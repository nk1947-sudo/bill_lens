import json
import re
from openai import AsyncOpenAI, APIStatusError
from app.core.config import settings

ANALYST_SYSTEM = """You are a certified medical billing specialist and fraud investigator with 15 years of experience.
You analyze medical bills for billing errors, fraud patterns, and overcharges.
Your findings are cautious, evidence-based, and patient-protective.
IMPORTANT: Always respond with valid JSON only. No markdown, no extra text."""

ANALYST_USER_TEMPLATE = """Analyze this medical bill text for suspicious charges, billing errors, upcoding, unbundling, and duplicate charges.

Return ONLY this JSON structure (no markdown fences):
{{
  "facility_name": "Name of hospital/facility from the bill or 'Unknown Facility'",
  "total_amount": 0.00,
  "risk_score": 0,
  "flagged_charges": [
    {{
      "id": 1,
      "name": "Charge description",
      "code": "CPT or Revenue code",
      "amount": "$0.00",
      "risk": "High",
      "reason": "Brief category (e.g. Potential Upcoding, Duplicate Charge, Possible Unbundling, Unusual Price, Vague Description)",
      "detail": "2-3 sentence explanation of why this is suspicious and what the correct billing should be"
    }}
  ]
}}

Risk score: 0-100 (0=clean bill, 100=highly suspicious).
Identify 3-7 flagged charges. If text is incomplete, use realistic examples based on typical hospital billing patterns.

Bill text:
{bill_text}"""

ADVOCATE_SYSTEM = """You are a compassionate patient financial advocate who helps patients understand and dispute medical bills.
You translate complex medical billing jargon into clear, actionable guidance.
Your tone is empowering, not alarmist. You help patients advocate for themselves.
IMPORTANT: Always respond with valid JSON only. No markdown, no extra text."""

ADVOCATE_USER_TEMPLATE = """Based on this medical bill analysis, create a patient advocacy strategy.

Analysis data:
{analysis_json}

Return ONLY this JSON structure (no markdown fences):
{{
  "summary": "2-3 sentence plain-English explanation of what the bill shows and what the patient should know. Be specific about potential savings.",
  "action_plan": [
    {{"step": 1, "title": "Request an Itemized Bill", "detail": "Detailed actionable instructions"}},
    {{"step": 2, "title": "Pull Your Medical Records", "detail": "..."}},
    {{"step": 3, "title": "File a Formal Billing Dispute", "detail": "..."}},
    {{"step": 4, "title": "Contact Your Insurance", "detail": "..."}},
    {{"step": 5, "title": "Escalate if Needed", "detail": "..."}}
  ],
  "phone_script": "Full word-for-word phone script the patient can read when calling the hospital billing department. Include placeholders like [YOUR NAME], [ACCOUNT NUMBER], [DATE]. Reference the specific flagged charges by name."
}}"""

DEMO_RESULT = {
    "facility_name": "General Hospital",
    "total_amount": 12847.00,
    "risk_score": 85,
    "demo_mode": True,
    "flagged_charges": [
        {"id": 1, "name": "Room & Board – ICU Level 4", "code": "Rev 0204", "amount": "$4,200",
         "risk": "High", "reason": "Potential Upcoding",
         "detail": "ICU Level 4 classification is rarely warranted. Standard monitoring only — Level 2 billing ($1,400) is far more appropriate for the documented care level."},
        {"id": 2, "name": "Comprehensive Metabolic Panel × 3", "code": "CPT 80053", "amount": "$870",
         "risk": "High", "reason": "Duplicate Charge",
         "detail": "The same panel appears three times on the same date. Labs of this type are typically drawn once per encounter. Two charges appear redundant and should be removed."},
        {"id": 3, "name": "Surgical Tray Setup", "code": "CPT 99070", "amount": "$380",
         "risk": "Medium", "reason": "Possible Unbundling",
         "detail": "Tray setup fees are generally bundled into the procedure code. Billing separately may constitute improper unbundling under CMS guidelines."},
        {"id": 4, "name": "Physical Therapy Evaluation", "code": "CPT 97161", "amount": "$340",
         "risk": "Medium", "reason": "Unusual Price",
         "detail": "This charge is 2.4× the Medicare rate for this procedure in your region ($142). Significant price disparity warrants a formal review request."},
        {"id": 5, "name": "Disposable Supplies Fee", "code": "Rev 0270", "amount": "$95",
         "risk": "Low", "reason": "Vague Description",
         "detail": "No itemized breakdown provided. Hospitals are legally required to itemize supply charges. Request a line-item detail in writing."},
    ],
    "summary": "Your bill totals $12,847. Our audit flagged 5 items worth challenging — potential savings of $3,800–$5,200. The biggest red flags are a likely ICU room classification upcoding ($2,800 overcharge) and a lab panel billed three times in one day. These are among the most common hospital billing errors and are frequently corrected on appeal.",
    "action_plan": [
        {"step": 1, "title": "Request an Itemized Bill",
         "detail": "Call the billing department and ask for a fully itemized bill listing every CPT and revenue code. This is your legal right in all 50 states under the No Surprises Act. Allow 3–5 business days."},
        {"step": 2, "title": "Pull Your Medical Records",
         "detail": "Request your nursing notes and physician orders for the dates of service. Cross-reference what was ordered vs. what was billed — discrepancies are your strongest dispute evidence."},
        {"step": 3, "title": "File a Formal Billing Dispute",
         "detail": "Submit a written dispute letter citing each flagged CPT/revenue code and your specific grounds (duplicate charge, upcoding, etc.). Send via certified mail and keep a copy."},
        {"step": 4, "title": "Contact Your Insurance",
         "detail": "If insured, call your insurer's member advocacy line. They have contractual leverage hospitals respond to and can audit charges on your behalf at no cost to you."},
        {"step": 5, "title": "Escalate if Needed",
         "detail": "If unresolved within 30 days, file a complaint with your state Insurance Commissioner. Consider a patient advocate or medical billing attorney — many work on contingency and charge nothing unless they recover funds."},
    ],
    "phone_script": """Hello, my name is [YOUR NAME] and my account number is [ACCOUNT NUMBER].

I'm calling to dispute several charges on my bill dated [DATE].

I've reviewed my itemized statement and have identified the following concerns:

1. DUPLICATE CHARGE — CPT 80053 (Comprehensive Metabolic Panel) appears three times on [DATE]. I'd like these reviewed and the two duplicate charges removed.

2. BILLING CLASSIFICATION — I was billed for ICU Level 4 room & board (Rev 0204 at $4,200). My medical records indicate standard monitoring only. I am requesting a formal downgrade review to Level 2.

3. UNBUNDLED SUPPLY FEE — CPT 99070 (Surgical Tray Setup) appears billed separately from the associated procedure. I'm requesting this be reviewed for proper bundling per CMS guidelines.

Can you open a formal billing dispute and give me a reference number?

[PAUSE — write down the reference number and the agent's full name]

Thank you. I'll follow up in writing within 5 business days. Can you confirm the correct mailing address for written disputes?""",
}


def _make_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.TOGETHER_API_KEY, base_url=settings.TOGETHER_BASE_URL)


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def run_analyst(bill_text: str) -> dict:
    client = _make_client()
    truncated = bill_text[:6000] if len(bill_text) > 6000 else bill_text
    response = await client.chat.completions.create(
        model=settings.ANALYSIS_MODEL,
        messages=[
            {"role": "system", "content": ANALYST_SYSTEM},
            {"role": "user", "content": ANALYST_USER_TEMPLATE.format(bill_text=truncated)},
        ],
        max_tokens=3000,
        temperature=0.1,
    )
    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)


async def run_advocate(analysis: dict) -> dict:
    client = _make_client()
    response = await client.chat.completions.create(
        model=settings.ADVOCACY_MODEL,
        messages=[
            {"role": "system", "content": ADVOCATE_SYSTEM},
            {"role": "user", "content": ADVOCATE_USER_TEMPLATE.format(analysis_json=json.dumps(analysis, indent=2))},
        ],
        max_tokens=3000,
        temperature=0.2,
    )
    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)


async def run_full_chain(bill_text: str) -> dict:
    if settings.DEMO_MODE or not settings.TOGETHER_API_KEY.strip():
        return DEMO_RESULT

    try:
        analysis = await run_analyst(bill_text)
        advocacy = await run_advocate(analysis)
        return {**analysis, **advocacy}
    except APIStatusError as e:
        if e.status_code == 402:
            # Credits exhausted — fall back to demo results silently
            return {**DEMO_RESULT, "demo_mode": True}
        raise
