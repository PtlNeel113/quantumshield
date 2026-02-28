"""
QuantumShield - Authentication models
Pydantic schemas for auth requests and responses
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=1)
    mfa_token: Optional[str] = Field(None, min_length=6, max_length=6)
    remember_device: bool = False
    device_fingerprint: Optional[str] = None


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request schema"""
    current_password: str
    new_password: str = Field(..., min_length=12)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        from .security import is_password_strong
        is_strong, issues = is_password_strong(v)
        if not is_strong:
            raise ValueError("; ".join(issues))
        return v


class ResetPasswordRequest(BaseModel):
    """Reset password request schema"""
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    """Reset password confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=12)


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    organization_id: str
    email: str
    role: str
    status: str
    mfa_enabled: bool
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class MFAEnrollRequest(BaseModel):
    """MFA enrollment request schema"""
    password: str


class MFAEnrollResponse(BaseModel):
    """MFA enrollment response schema"""
    secret: str
    qr_code: str
    backup_codes: list[str]


class MFAVerifyRequest(BaseModel):
    """MFA verification request schema"""
    token: str = Field(..., min_length=6, max_length=6)


class MFADisableRequest(BaseModel):
    """MFA disable request schema"""
    password: str
    token: str = Field(..., min_length=6, max_length=6)


class SessionResponse(BaseModel):
    """Session response schema"""
    session_id: str
    device: str
    ip_address: str
    country: Optional[str]
    last_activity: datetime
    is_current: bool


class AuditLogResponse(BaseModel):
    """Audit log response schema"""
    id: str
    user_id: str
    action: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    metadata: Optional[dict]
    
    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    """Create user request schema (admin only)"""
    email: EmailStr
    password: str = Field(..., min_length=12)
    role: str = Field(..., pattern="^(admin|analyst|viewer|auditor)$")
    organization_id: Optional[str] = None
    
    @validator('password')
    def validate_password_strength(cls, v):
        from .security import is_password_strong
        is_strong, issues = is_password_strong(v)
        if not is_strong:
            raise ValueError("; ".join(issues))
        return v


class UpdateUserRequest(BaseModel):
    """Update user request schema (admin only)"""
    role: Optional[str] = Field(None, pattern="^(admin|analyst|viewer|auditor)$")
    status: Optional[str] = Field(None, pattern="^(active|inactive|suspended)$")


class DeviceInfo(BaseModel):
    """Device information schema"""
    user_agent: str
    ip_address: str
    device_fingerprint: Optional[str] = None
