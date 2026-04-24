from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, DisclaimerAcceptRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "disclaimer_accepted": user.get("disclaimer_accepted", False),
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_doc = {
        "email": body.email,
        "full_name": body.full_name,
        "hashed_password": hash_password(body.password),
        "disclaimer_accepted": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=_serialize_user(user_doc))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=_serialize_user(user))


@router.post("/disclaimer")
async def accept_disclaimer(
    body: DisclaimerAcceptRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not body.accepted:
        raise HTTPException(status_code=400, detail="Disclaimer must be accepted")
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"disclaimer_accepted": True}},
    )
    return {"ok": True}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _serialize_user(current_user)
