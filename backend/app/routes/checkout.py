import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.checkout import CheckoutOrder
from app.schemas.checkout import CheckoutRequest, CheckoutResponse

router = APIRouter(prefix="/api/checkout", tags=["checkout"])

@router.post("", response_model=CheckoutResponse)
def submit_checkout(request: CheckoutRequest, db: Session = Depends(get_db)):
    # Basic validation
    if not request.shipping_address or not request.shipping_address.strip():
        raise HTTPException(status_code=400, detail="Shipping address is required")
    phone = request.phone.strip()
    if not re.fullmatch(r"[6-9]\d{9}", phone):
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number.")

    # If user_id is provided, verify they actually exist
    if request.user_id is not None:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

    new_order = CheckoutOrder(
        user_id=request.user_id,
        email=request.email,
        phone=phone,
        shipping_address=request.shipping_address.strip()
    )
    
    db.add(new_order)
    db.commit()

    return CheckoutResponse(
        success=True,
        message="Checkout submitted successfully"
    )
