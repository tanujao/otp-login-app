import secrets
import string
import bcrypt

def generate_login_code() -> str:
    """Generates a cryptographically secure 6-digit numeric code."""
    # Secrets module provides cryptographically strong random numbers
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def hash_login_code(code: str) -> str:
    """Hashes the login code using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(code.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_login_code(code: str, hashed_code: str) -> bool:
    """Verifies a plain code against a bcrypt hash."""
    return bcrypt.checkpw(code.encode('utf-8'), hashed_code.encode('utf-8'))
