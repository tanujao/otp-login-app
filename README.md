# OTP-Based User Login and Checkout

## Description
This is a full-stack web application for an OTP-based user recognition and checkout flow. The application allows users to register, generating a secure 6-digit login code. During checkout, the application recognizes returning users in real-time as they type their email and prompts them for their 6-digit login code via a modal. Users can choose to verify the code to link the checkout to their account, or skip to continue as a guest. The application prioritizes functional correctness, security (using bcrypt for hash storage), and a clean, responsive UI.

## Features
- **Registration**: Register with email, first name, and last name.
- **6-digit login code generation**: A cryptographically secure 6-digit numeric code is generated upon registration and displayed once. Codes expire after five minutes, allow three attempts, and support a 30-second resend cooldown.
- **Real-time email recognition**: The checkout form debounces email input and checks if the user is registered without blocking the UI.
- **OTP login**: Returning users are prompted for their 6-digit code via a modal that supports typing, mobile numeric input, and pasting the complete code into any box.
- **Guest checkout**: Unrecognized emails or users who skip login can checkout as guests.
- **Authenticated checkout**: Logged-in users' checkout records are linked to their database `user_id`.
- **PostgreSQL persistence**: All data (users and checkout orders) is persisted to a real PostgreSQL database.

## Architecture
- **Frontend**: React + TypeScript + Vite (Axios for API requests, React Router for navigation)
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Database**: PostgreSQL

The flow of data is:
`React` → `Axios` → `FastAPI REST API` → `SQLAlchemy ORM` → `PostgreSQL`

## Project Structure
```
otp-login-app/
│
├── frontend/             # React (Vite + TypeScript) application
│   ├── src/
│   │   ├── components/   # Reusable UI components (Button, Input, OTPModal, Navbar)
│   │   ├── pages/        # Main pages (Register, Checkout)
│   │   ├── services/     # Axios API service
│   │   ├── styles/       # CSS modules/stylesheets
│   │   └── types/        # TypeScript interfaces
│
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── models/       # SQLAlchemy database models
│   │   ├── routes/       # API endpoints grouped by feature
│   │   ├── schemas/      # Pydantic schemas for request/response validation
│   │   ├── services/     # Business logic (e.g., OTP generation & hashing)
│   │   ├── database.py   # Database connection and session setup
│   │   └── main.py       # FastAPI application entry point
│
└── database/             # Database setup scripts
    ├── schema.sql        # Table creation definitions
    └── seed.sql          # Seed data (optional)
```

## Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL

## Setup Instructions

### 1. Database Setup (Windows PowerShell)
PostgreSQL must be installed and the PostgreSQL service must be running. The
default installer location is `C:\Program Files\PostgreSQL\18\bin`.

If PowerShell reports that `psql` is not recognized, add the PostgreSQL client
to the current terminal session:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql --version
```

To add it permanently for new terminals, run this once and then open a new
PowerShell window:
```powershell
$postgresBin = "C:\Program Files\PostgreSQL\18\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$postgresBin", "User")
```

If PostgreSQL was installed in another version directory, replace `18` with
that version. You can also run `psql.exe` using its full path.

Create the database and initialize the schema. Replace `postgres` below with
the password chosen during PostgreSQL installation when prompted:
```powershell
psql -U postgres -h localhost -d postgres
```

Inside `psql`, run:
```sql
CREATE DATABASE otp_login_db;
\c otp_login_db
\i 'D:/PROJECTS/otp-login-app/database/schema.sql'
\q
```

If the database already exists, skip `CREATE DATABASE otp_login_db;`.

If you see `password authentication failed for user "postgres"`, the server
password is different from the example value. Use the password configured
during PostgreSQL installation in `backend\.env`:
```dotenv
DATABASE_URL=postgresql://postgres:<YOUR_POSTGRES_PASSWORD>@localhost:5432/otp_login_db
```
Do not commit `backend\.env` or share the password.

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from example (PowerShell)
Copy-Item .env.example .env

# Run FastAPI Server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend

# Install dependencies
npm install

# Create .env from example (PowerShell)
Copy-Item .env.example .env

# Start React Dev Server
npm run dev
```

## API Endpoints

- `POST /api/auth/register`
  Registers a new user, hashes the generated code, and returns the plain code.
- `POST /api/auth/recognize`
  Checks whether an email is registered and returns only the user's first and last name.
- `POST /api/auth/verify-otp`
  Verifies the 6-digit code, expiry, and attempt limit, returning safe user information only.
- `POST /api/auth/resend-otp`
  Rotates an expired or unavailable code subject to a 30-second cooldown.
- `POST /api/checkout`
  Submits a checkout order. Associates `user_id` if authenticated, else stores as guest (`user_id = null`).
- `GET /health`
  Health check endpoint.

## Testing the Flow
1. **Register**: Go to `/register`, enter your details. Note the 6-digit code.
2. **Checkout (Registered)**: Go to `/checkout`, enter the registered email. The OTP modal will appear.
3. **Verify**: Enter the correct code. Your name will appear at the top. Complete checkout.
4. **Checkout (Guest)**: Enter an unregistered email. No modal will appear. Complete checkout.

## Environment Variables
- **Backend**:
  - `DATABASE_URL`: Connection string for PostgreSQL (e.g. `postgresql://postgres:postgres@localhost:5432/otp_login_db`)
  - `CORS_ORIGINS`: Allowed frontend origins (e.g. `http://localhost:5173`)
- **Frontend**:
  - `VITE_API_BASE_URL`: URL of the FastAPI backend (e.g. `http://localhost:8000`)
