from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


class FlaggedCharge(BaseModel):
    id: int
    name: str
    code: str
    amount: str
    risk: str
    reason: str
    detail: str


class ActionStep(BaseModel):
    step: int
    title: str
    detail: str


class BillAnalysis(BaseModel):
    facility_name: str
    total_amount: float
    risk_score: int
    flagged_charges: List[FlaggedCharge]
    summary: str
    action_plan: List[ActionStep]
    phone_script: str


class BillResponse(BaseModel):
    id: str
    facility_name: str
    total_amount: float
    risk_score: int
    file_metadata: dict
    analysis: dict
    status: str
    created_at: datetime

    class Config:
        arbitrary_types_allowed = True


class BillListItem(BaseModel):
    id: str
    facility_name: str
    total_amount: float
    risk_score: int
    filename: str
    created_at: datetime
