from pydantic import BaseModel, EmailStr
from typing import Optional

class CheckoutRequest(BaseModel):
    user_id: Optional[int] = None
    email: EmailStr
    phone: str
    shipping_address: str

class CheckoutResponse(BaseModel):
    success: bool
    message: str
