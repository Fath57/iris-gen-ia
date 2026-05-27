from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.mail.auth import send_otp_email
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse
from app.services.auth import upsert_and_get_otp, verify_otp_and_issue_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-otp", status_code=202)
async def request_otp(body: OTPRequest, db: AsyncSession = Depends(get_db)):
    code = await upsert_and_get_otp(body.email, db)
    await send_otp_email(body.email, code)
    return {"message": "Code OTP envoyé par email."}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: OTPVerify, db: AsyncSession = Depends(get_db)):
    try:
        token = await verify_otp_and_issue_token(body.email, body.code, db)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return TokenResponse(access_token=token)
