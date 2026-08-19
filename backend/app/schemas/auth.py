from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

class RegisterResponse(BaseModel):
    success: bool
    message: str
    code: str

class RecognizeRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)

class ResendCodeRequest(BaseModel):
    email: EmailStr

class ResendCodeResponse(BaseModel):
    success: bool
    message: str

class VerifyCodeResponse(BaseModel):
    success: bool
    user: dict | None = None
    message: str | None = None
