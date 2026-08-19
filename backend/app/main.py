from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

from app.database import engine, Base, ensure_schema
from app.routes import auth_router, users_router, checkout_router

# Load environment variables
load_dotenv()

# Create tables if they don't exist
# We will use the schema.sql to manage db, but this is a fallback for local dev if schema.sql isn't run manually
Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(title="OTP Login & Checkout API")

@app.exception_handler(Exception)
async def handle_unexpected_error(_, __):
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."},
    )

# Setup CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(checkout_router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
