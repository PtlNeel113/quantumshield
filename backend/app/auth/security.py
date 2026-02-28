"""
QuantumShield - Security utilities
Password hashing, JWT generation, and token management
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from passlib.hash import argon2
import pyotp
import qrcode
from io import BytesIO
import base64

# Password hashing context (Argon2id)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,  # 64 MB
    argon2__time_cost=3,
    argon2__parallelism=4,
)

# JWT Configuration
JWT_SECRET_KEY = "CHANGE_ME_IN_PRODUCTION_USE_ENV_VAR"  # Load from environment
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """
    Hash password using Argon2id
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(
    user_id: str,
    organization_id: str,
    role: str,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User UUID
        organization_id: Organization UUID
        role: User role (admin, analyst, viewer, auditor)
        email: User email
        expires_delta: Optional custom expiration time
        
    Returns:
        JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "org": organization_id,
        "role": role,
        "email": email,
        "type": "access",
        "iat": datetime.utcnow(),
        "exp": expire
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Create refresh token
    
    Args:
        user_id: User UUID
        
    Returns:
        JWT refresh token string
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": secrets.token_urlsafe(32),  # Unique token ID
        "iat": datetime.utcnow(),
        "exp": expire
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        jwt.ExpiredSignatureError: Token has expired
        jwt.InvalidTokenError: Token is invalid
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


def generate_mfa_secret() -> str:
    """
    Generate TOTP secret for MFA
    
    Returns:
        Base32 encoded secret
    """
    return pyotp.random_base32()


def generate_mfa_qr_code(email: str, secret: str, issuer: str = "QuantumShield") -> str:
    """
    Generate QR code for MFA enrollment
    
    Args:
        email: User email
        secret: TOTP secret
        issuer: Application name
        
    Returns:
        Base64 encoded QR code image
    """
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=email, issuer_name=issuer)
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_mfa_token(secret: str, token: str) -> bool:
    """
    Verify TOTP token
    
    Args:
        secret: User's TOTP secret
        token: 6-digit TOTP code
        
    Returns:
        True if token is valid, False otherwise
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)  # Allow 1 step before/after


def generate_backup_codes(count: int = 10) -> list[str]:
    """
    Generate backup codes for MFA recovery
    
    Args:
        count: Number of backup codes to generate
        
    Returns:
        List of backup codes
    """
    return [secrets.token_hex(4).upper() for _ in range(count)]


def generate_session_id() -> str:
    """
    Generate secure session ID
    
    Returns:
        Random session ID
    """
    return secrets.token_urlsafe(32)


def generate_device_id() -> str:
    """
    Generate device fingerprint ID
    
    Returns:
        Random device ID
    """
    return secrets.token_urlsafe(16)


def is_password_strong(password: str) -> tuple[bool, list[str]]:
    """
    Check password strength
    
    Args:
        password: Password to check
        
    Returns:
        Tuple of (is_strong, list of issues)
    """
    issues = []
    
    if len(password) < 12:
        issues.append("Password must be at least 12 characters long")
    
    if not any(c.isupper() for c in password):
        issues.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        issues.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        issues.append("Password must contain at least one digit")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        issues.append("Password must contain at least one special character")
    
    return len(issues) == 0, issues


def check_breached_password(password: str) -> bool:
    """
    Check if password appears in breach databases
    Uses Have I Been Pwned API (k-anonymity model)
    
    Args:
        password: Password to check
        
    Returns:
        True if password is breached, False otherwise
    """
    import hashlib
    import requests
    
    # SHA-1 hash of password
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]
    
    try:
        # Query HIBP API with first 5 characters
        response = requests.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=2
        )
        
        if response.status_code == 200:
            # Check if suffix appears in response
            hashes = response.text.split('\r\n')
            for hash_line in hashes:
                hash_suffix, count = hash_line.split(':')
                if hash_suffix == suffix:
                    return True  # Password is breached
        
        return False
    except Exception:
        # If API fails, don't block user
        return False
