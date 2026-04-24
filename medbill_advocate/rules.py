import re
from collections import defaultdict
from dataclasses import dataclass

from medbill_advocate.ocr import OcrLine


AMOUNT_PATTERN = re.compile(r"\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})")
CODE_PATTERN = re.compile(r"\b([A-Z]\d{4}|[A-Z]\d{3,4}|\d{5})\b")
ESTIMATE_PATTERN = re.compile(r"\b(?:estimate|estimated|quote|quoted)\b", re.IGNORECASE)
EOB_PATTERN = re.compile(r"\b(?:eob|explanation of benefits|allowed amount)\b", re.IGNORECASE)
NEGATIVE_HINT_PATTERN = re.compile(r"\b(?:paid|adjustment|discount|write[- ]?off)\b", re.IGNORECASE)
SUMMARY_LINE_PATTERN = re.compile(
    r"\b(?:estimate|estimated|quote|quoted|total|amount due|patient responsibility|"
    r"balance due|eob|explanation of benefits|allowed amount)\b",
    re.IGNORECASE,
)
HIGH_RISK_TERMS = {
    "acetaminophen",
    "tylenol",
    "ibuprofen",
    "aspirin",
    "gauze",
    "gloves",
    "bandage",
    "saline",
    "misc",
    "miscellaneous",
    "supplies",
}


@dataclass(frozen=True)
class BillLineItem:
    description: str
    amount: float
    code: str | None
    source_text: str
    page_hint: str | None = None


@dataclass(frozen=True)
class RuleFinding:
    title: str
    severity: str
    explanation: str
    evidence: list[str]


@dataclass(frozen=True)
class RuleAnalysis:
    line_items: list[BillLineItem]
    findings: list[RuleFinding]
    estimate_amount: float | None
    eob_amount: float | None
    total_charges: float | None


def parse_line_items(lines: list[OcrLine]) -> list[BillLineItem]:
    items = []
    for line in lines:
        text = _normalize_space(line.text)
        if not text:
            continue
        if SUMMARY_LINE_PATTERN.search(text):
            continue
        amounts = _extract_amounts(text)
        if not amounts:
            continue

        amount = amounts[-1]
        if amount <= 0 or NEGATIVE_HINT_PATTERN.search(text):
            continue

        code_match = CODE_PATTERN.search(text)
        code = code_match.group(1) if code_match else None
        description = _clean_description(text, amount, code)
        if not description:
            description = text

        items.append(
            BillLineItem(
                description=description,
                amount=amount,
                code=code,
                source_text=text,
            )
        )
    return items


def analyze_with_rules(lines: list[OcrLine]) -> RuleAnalysis:
    text_lines = [_normalize_space(line.text) for line in lines if line.text.strip()]
    line_items = parse_line_items(lines)
    findings = []

    findings.extend(_find_duplicate_charges(line_items))
    findings.extend(_find_suspicious_high_items(line_items))
    findings.extend(_find_estimate_eob_mismatches(text_lines))

    estimate_amount = _find_context_amount(text_lines, ESTIMATE_PATTERN)
    eob_amount = _find_context_amount(text_lines, EOB_PATTERN)
    total_charges = _find_total_charges(text_lines)

    return RuleAnalysis(
        line_items=line_items,
        findings=findings,
        estimate_amount=estimate_amount,
        eob_amount=eob_amount,
        total_charges=total_charges,
    )


def format_rule_analysis(analysis: RuleAnalysis) -> str:
    if not analysis.findings:
        findings_text = "- No deterministic red flags were found in the extracted text."
    else:
        findings_text = "\n".join(
            _format_finding(index, finding)
            for index, finding in enumerate(analysis.findings, start=1)
        )

    totals = [
        f"- Parsed line items: {len(analysis.line_items)}",
        f"- Total charges found: {_format_optional_amount(analysis.total_charges)}",
        f"- Estimate found: {_format_optional_amount(analysis.estimate_amount)}",
        f"- EOB/allowed amount found: {_format_optional_amount(analysis.eob_amount)}",
    ]

    return (
        "## Rule-Based Bill Review\n\n"
        "This fallback uses OCR plus deterministic checks. It does not require an LLM.\n\n"
        "### Summary\n"
        f"{chr(10).join(totals)}\n\n"
        "### Findings\n"
        f"{findings_text}\n\n"
        "### Suggested Next Steps\n"
        "- Ask the billing department for an itemized bill with CPT/HCPCS codes.\n"
        "- Request the Explanation of Benefits from your insurer and compare allowed amounts.\n"
        "- Ask for duplicate or unclear charges to be reviewed before paying.\n"
        "- Ask whether financial assistance, prompt-pay discounts, or coding review is available."
    )


def _find_duplicate_charges(line_items: list[BillLineItem]) -> list[RuleFinding]:
    grouped_items = defaultdict(list)
    for item in line_items:
        key = (_normalize_description(item.description), item.code, round(item.amount, 2))
        grouped_items[key].append(item)

    findings = []
    for duplicates in grouped_items.values():
        if len(duplicates) < 2:
            continue
        first = duplicates[0]
        findings.append(
            RuleFinding(
                title="Possible duplicate charge",
                severity="High",
                explanation=(
                    f"The same description/code/amount appears {len(duplicates)} times. "
                    "This may be valid, but it is worth asking billing to verify."
                ),
                evidence=[item.source_text for item in duplicates],
            )
        )
    return findings


def _find_suspicious_high_items(line_items: list[BillLineItem]) -> list[RuleFinding]:
    findings = []
    for item in line_items:
        description = item.description.lower()
        has_high_risk_term = any(term in description for term in HIGH_RISK_TERMS)
        if has_high_risk_term and item.amount >= 50:
            findings.append(
                RuleFinding(
                    title="Suspiciously high common item charge",
                    severity="Medium",
                    explanation=(
                        "A common medication or supply appears expensive. Ask whether "
                        "this is bundled, coded correctly, or eligible for adjustment."
                    ),
                    evidence=[item.source_text],
                )
            )
        elif item.amount >= 1000 and not item.code:
            findings.append(
                RuleFinding(
                    title="High charge without visible billing code",
                    severity="Medium",
                    explanation=(
                        "A large line item does not show a visible CPT/HCPCS code in the "
                        "OCR text. Ask for the itemized coded bill."
                    ),
                    evidence=[item.source_text],
                )
            )
    return findings


def _find_estimate_eob_mismatches(text_lines: list[str]) -> list[RuleFinding]:
    findings = []
    estimate = _find_context_amount(text_lines, ESTIMATE_PATTERN)
    eob = _find_context_amount(text_lines, EOB_PATTERN)
    total = _find_total_charges(text_lines)

    if estimate is not None and total is not None and abs(total - estimate) > 400:
        findings.append(
            RuleFinding(
                title="Bill differs from estimate by more than $400",
                severity="High",
                explanation=(
                    f"The extracted total differs from the estimate by ${abs(total - estimate):,.2f}. "
                    "Under surprise-billing rules, this may be worth escalating."
                ),
                evidence=[
                    f"Estimate: ${estimate:,.2f}",
                    f"Total charges: ${total:,.2f}",
                ],
            )
        )

    if eob is not None and total is not None and abs(total - eob) > 400:
        findings.append(
            RuleFinding(
                title="Bill differs from EOB/allowed amount by more than $400",
                severity="High",
                explanation=(
                    "The bill total appears far from the EOB or allowed amount. "
                    "Ask the provider to reconcile the bill against the insurer's EOB."
                ),
                evidence=[
                    f"EOB/allowed amount: ${eob:,.2f}",
                    f"Total charges: ${total:,.2f}",
                ],
            )
        )
    return findings


def _find_context_amount(text_lines: list[str], pattern: re.Pattern[str]) -> float | None:
    for line in text_lines:
        if pattern.search(line):
            amounts = _extract_amounts(line)
            if amounts:
                return amounts[-1]
    return None


def _find_total_charges(text_lines: list[str]) -> float | None:
    total_patterns = [
        re.compile(r"\b(?:total charges|total charge|amount due|patient responsibility)\b", re.IGNORECASE),
        re.compile(r"\b(?:balance due|total due|total)\b", re.IGNORECASE),
    ]
    for pattern in total_patterns:
        total = _find_context_amount(text_lines, pattern)
        if total is not None:
            return total
    all_amounts = []
    for line in text_lines:
        all_amounts.extend(_extract_amounts(line))
    return max(all_amounts) if all_amounts else None


def _extract_amounts(text: str) -> list[float]:
    amounts = []
    for match in AMOUNT_PATTERN.finditer(text):
        raw_amount = match.group(1).replace(",", "")
        try:
            amounts.append(float(raw_amount))
        except ValueError:
            continue
    return amounts


def _clean_description(text: str, amount: float, code: str | None) -> str:
    description = text
    description = description.replace(f"${amount:,.2f}", "")
    description = description.replace(f"{amount:,.2f}", "")
    description = description.replace(f"{amount:.2f}", "")
    if code:
        description = description.replace(code, "")
    return _normalize_space(description.strip(" -:|"))


def _normalize_description(description: str) -> str:
    normalized = re.sub(r"[^a-z0-9 ]+", "", description.lower())
    return _normalize_space(normalized)


def _normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _format_finding(index: int, finding: RuleFinding) -> str:
    evidence = "\n".join(f"  - {item}" for item in finding.evidence)
    return (
        f"{index}. **{finding.title}** ({finding.severity})\n"
        f"   - {finding.explanation}\n"
        f"   - Evidence:\n{evidence}"
    )


def _format_optional_amount(amount: float | None) -> str:
    if amount is None:
        return "not found"
    return f"${amount:,.2f}"
