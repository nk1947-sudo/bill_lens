import json
import re
from openai import AsyncOpenAI
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


def _make_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.TOGETHER_API_KEY, base_url=settings.TOGETHER_BASE_URL)


def _extract_json(text: str) -> dict:
    text = text.strip()
    # Strip markdown code fences if present
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
    analysis = await run_analyst(bill_text)
    advocacy = await run_advocate(analysis)
    return {**analysis, **advocacy}
