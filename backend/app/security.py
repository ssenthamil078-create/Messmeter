"""Security helpers: bcrypt password hashing and JWT creation / verification."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=settings.bcrypt_rounds)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:  # malformed hash or password longer than bcrypt allows
        return False


def create_access_token(user_id: int, role: str, expires_minutes: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    minutes = settings.access_token_expire_minutes if expires_minutes is None else expires_minutes
    payload = {"sub": str(user_id), "role": role, "iat": now, "exp": now + timedelta(minutes=minutes)}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Return the token payload, or raise jwt.PyJWTError if it is invalid or expired."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
