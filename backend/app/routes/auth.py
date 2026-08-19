from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RecognizeRequest,
    RegisterRequest,
    RegisterResponse,
    ResendCodeRequest,
    ResendCodeResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
)
from app.schemas.user import UserRecognizeResponse
from app.services.auth_service import generate_login_code, hash_login_code, verify_login_code

router = APIRouter(prefix="/api/auth", tags=["auth"])
OTP_LIFETIME = timedelta(minutes=5)
RESEND_COOLDOWN = timedelta(seconds=30)
MAX_ATTEMPTS = 3

@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email = str(request.email).lower()
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Generate 6-digit code
    code = generate_login_code()
    hashed_code = hash_login_code(code)

    # Save to database
    now = datetime.now(timezone.utc)
    new_user = User(
        email=email,
        first_name=request.first_name.strip(),
        last_name=request.last_name.strip(),
        login_code_hash=hashed_code,
        otp_expires_at=now + OTP_LIFETIME,
        failed_attempts=0,
        last_otp_sent_at=now,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return success with the plain code (as required by the assignment)
    return RegisterResponse(
        success=True,
        message="Registration successful",
        code=code
    )

@router.post("/resend-otp", response_model=ResendCodeResponse)
def resend_otp(request: ResendCodeRequest, db: Session = Depends(get_db)):
    email = str(request.email).lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    now = datetime.now(timezone.utc)
    if user.last_otp_sent_at and now - user.last_otp_sent_at < RESEND_COOLDOWN:
        remaining = int((RESEND_COOLDOWN - (now - user.last_otp_sent_at)).total_seconds()) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Resend available in {remaining} seconds",
        )

    code = generate_login_code()
    user.login_code_hash = hash_login_code(code)
    user.otp_expires_at = now + OTP_LIFETIME
    user.failed_attempts = 0
    user.last_otp_sent_at = now
    db.commit()
    return ResendCodeResponse(success=True, message="A new login code has been sent.")

@router.post("/recognize", response_model=UserRecognizeResponse)
def recognize(request: RecognizeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == str(request.email).lower()).first()
    if user:
        return UserRecognizeResponse(
            recognized=True,
            first_name=user.first_name,
            last_name=user.last_name
        )
    return UserRecognizeResponse(recognized=False)

@router.post("/verify-otp", response_model=VerifyCodeResponse)
def verify_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    # Validate code format
    if len(request.code) != 6 or not request.code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid login code format."
        )

    user = db.query(User).filter(User.email == str(request.email).lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login code" # Generic message to avoid exposing email existence
        )

    now = datetime.now(timezone.utc)
    if not user.otp_expires_at or now >= user.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This login code has expired. Please request a new code.",
        )

    if (user.failed_attempts or 0) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please request a new code.",
        )

    # Verify the hash
    if not verify_login_code(request.code, user.login_code_hash):
        user.failed_attempts = (user.failed_attempts or 0) + 1
        db.commit()
        if user.failed_attempts >= MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please request a new code.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid login code. Attempts remaining: {MAX_ATTEMPTS - user.failed_attempts}",
        )

    user.failed_attempts = 0
    db.commit()

    # Return success and safe user info
    return VerifyCodeResponse(
        success=True,
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        },
        message="Verification successful"
    )
