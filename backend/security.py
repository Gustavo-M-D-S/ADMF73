import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from itsdangerous import URLSafeTimedSerializer
from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib
import hmac

from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

csrf_serializer = URLSafeTimedSerializer(settings.CSRF_SECRET_KEY)

class TokenSecurity(HTTPBearer):
    """Enhanced token security with CSRF protection"""

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
        self.csrf_header = "X-CSRF-Token"

    async def __call__(self, request: Request) -> Optional[Dict[str, Any]]:
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)

        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token de autenticação não fornecido"
            )

        token_data = verify_access_token(credentials.credentials)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido ou expirado"
            )

        if request.method not in ["GET", "HEAD", "OPTIONS"]:
            csrf_token = request.headers.get(self.csrf_header)
            if not csrf_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token não fornecido"
                )

            if not validate_csrf_token(csrf_token, token_data.get("sub")):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token inválido ou expirado"
                )

        return token_data

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Get password hash with bcrypt"""
    encoded_password = password.encode('utf-8')
    if len(encoded_password) > 72:
        encoded_password = encoded_password[:72]
    return pwd_context.hash(encoded_password)

def generate_secure_password(length: int = 12) -> str:
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
        "jti": secrets.token_urlsafe(32)  # Unique token ID for replay protection
    })

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
        "jti": secrets.token_urlsafe(32)
    })

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT access token"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "iat", "sub", "jti", "type"]}
        )

        if payload.get("type") != "access":
            return None

        return payload

    except JWTError:
        return None

def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT refresh token"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "iat", "sub", "jti", "type"]}
        )

        if payload.get("type") != "refresh":
            return None

        return payload

    except JWTError:
        return None

def generate_csrf_token(user_id: str) -> str:
    """Generate CSRF token for a user"""
    data = {
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat(),
        "random": secrets.token_urlsafe(16)
    }

    message = f"{user_id}:{data['created_at']}:{data['random']}"
    hmac_digest = hmac.new(
        settings.CSRF_SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    data["hmac"] = hmac_digest

    return csrf_serializer.dumps(data)

def validate_csrf_token(token: str, user_id: str) -> bool:
    """Validate CSRF token"""
    try:
        data = csrf_serializer.loads(
            token,
            max_age=settings.CSRF_TOKEN_EXPIRE_SECONDS
        )

        if data.get("user_id") != user_id:
            return False

        message = f"{data['user_id']}:{data['created_at']}:{data['random']}"
        expected_hmac = hmac.new(
            settings.CSRF_SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        if data.get("hmac") != expected_hmac:
            return False

        return True

    except Exception:
        return False

def validate_request_origin(request: Request) -> bool:
    """Validate request origin to prevent CSRF"""
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    if settings.DEBUG or not (origin or referer):
        return True

    allowed_origins = settings.CORS_ORIGINS
    if origin and origin in allowed_origins:
        return True

    if referer:
        for allowed_origin in allowed_origins:
            if referer.startswith(allowed_origin):
                return True

    return False

def generate_session_id() -> str:
    """Generate secure session ID"""
    return secrets.token_urlsafe(64)

def get_security_headers() -> Dict[str, str]:
    """Get security headers for responses"""
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    }

class RateLimiter:
    """Simple in-memory rate limiter for demo purposes"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = {}

    def is_allowed(self, key: str) -> bool:
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)

        self.requests = {
            k: v for k, v in self.requests.items()
            if v > minute_ago
        }

        recent_requests = sum(1 for t in self.requests.values() if t > minute_ago)

        if recent_requests >= self.requests_per_minute:
            return False

        self.requests[key] = now
        return True

rate_limiter = RateLimiter()