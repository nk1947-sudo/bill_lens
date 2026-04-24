from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.ocr import extract_bill_text
from app.services.llm_chain import run_full_chain

router = APIRouter(prefix="/analyze", tags=["analyze"])

ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("")
async def analyze_bill(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    # Step 1: Extract text
    bill_text = await extract_bill_text(content, file.content_type)
    if not bill_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from the uploaded file.")

    # Steps 2 & 3: Analyst → Advocate LLM chain
    analysis = await run_full_chain(bill_text)

    # Persist to MongoDB
    bill_doc = {
        "user_id": current_user["_id"],
        "facility_name": analysis.get("facility_name", "Unknown Facility"),
        "total_amount": float(analysis.get("total_amount", 0)),
        "risk_score": int(analysis.get("risk_score", 0)),
        "original_text": bill_text,
        "file_metadata": {
            "filename": file.filename,
            "file_type": file.content_type,
            "file_size": len(content),
        },
        "analysis": analysis,
        "status": "completed",
        "created_at": datetime.utcnow(),
    }
    result = await db.medical_bills.insert_one(bill_doc)

    return {
        "id": str(result.inserted_id),
        "facility_name": bill_doc["facility_name"],
        "total_amount": bill_doc["total_amount"],
        "risk_score": bill_doc["risk_score"],
        "file_metadata": bill_doc["file_metadata"],
        "analysis": bill_doc["analysis"],
        "status": bill_doc["status"],
        "created_at": bill_doc["created_at"].isoformat(),
    }
