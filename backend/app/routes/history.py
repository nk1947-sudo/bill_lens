from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "facility_name": doc.get("facility_name", "Unknown"),
        "total_amount": doc.get("total_amount", 0),
        "risk_score": doc.get("risk_score", 0),
        "filename": doc.get("file_metadata", {}).get("filename", ""),
        "file_type": doc.get("file_metadata", {}).get("file_type", ""),
        "analysis": doc.get("analysis", {}),
        "status": doc.get("status", "completed"),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
    }


@router.get("")
async def list_bills(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cursor = db.medical_bills.find(
        {"user_id": current_user["_id"]},
        sort=[("created_at", -1)],
    )
    bills = []
    async for doc in cursor:
        bills.append(_serialize(doc))
    return bills


@router.get("/{bill_id}")
async def get_bill(
    bill_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        oid = ObjectId(bill_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid bill ID")

    doc = await db.medical_bills.find_one({"_id": oid, "user_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Bill not found")
    return _serialize(doc)


@router.delete("/{bill_id}", status_code=204)
async def delete_bill(
    bill_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        oid = ObjectId(bill_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid bill ID")

    result = await db.medical_bills.delete_one({"_id": oid, "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
