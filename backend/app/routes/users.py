from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRecognizeResponse
from pydantic import EmailStr

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/recognize", response_model=UserRecognizeResponse)
def recognize_user(email: EmailStr = Query(..., description="The email to recognize"), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == str(email).lower()).first()
    
    if user:
        return UserRecognizeResponse(
            recognized=True,
            first_name=user.first_name,
            last_name=user.last_name
        )
    
    return UserRecognizeResponse(recognized=False)
