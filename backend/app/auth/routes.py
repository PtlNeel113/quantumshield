"""
QuantumShield - Authentication routes
Login, logout, token refresh, MFA, and user management endpoints
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
import asyncpg
import redis

from .models import (
    LoginRequest, LoginResponse, RefreshTokenRequest,
    ChangePasswordRequest, ResetPasswordRequest, ResetPasswordConfirm,
    UserResponse, MFAEnrollRequest, MFAEnrollResponse,
    MFAVerifyRequest, MFADisableRequest, SessionResponse,
    CreateUserRequest, UpdateUserRequest, DeviceInfo
)
from .security import (
    verify_password, hash_password, create_access_token,
    create_refresh_token, decode_token, generate_mfa_secret,
    generate_mfa_qr_code, verify_mfa_token, generate_backup_codes,
    is_password_strong, check_breached_password
)
from .session import SessionStore, RateLimiter, LoginAttemptTracker
from .middleware import get_current_user, get_current_active_user, get_device_info, require_permission
from .audit import AuditLogger
from ..database import get_db_pool, get_redis_client

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


# Dependency injection
async def get_session_store() -> SessionStore:
    """Get session store instance"""
    redis_client = await get_redis_client()
    return SessionStore(redis_client)


async def get_rate_limiter() -> RateLimiter:
    """Get rate limiter instance"""
    redis_client = await get_redis_client()
    return RateLimiter(redis_client)


async def get_login_tracker() -> LoginAttemptTracker:
    """Get login attempt tracker instance"""
    redis_client = await get_redis_client()
    return LoginAttemptTracker(redis_client)


async def get_audit_logger() -> AuditLogger:
    """Get audit logger instance"""
    db_pool = await get_db_pool()
    return AuditLogger(db_pool)


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: asyncpg.Pool = Depends(get_db_pool),
    session_store: SessionStore = Depends(get_session_store),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
    login_tracker: LoginAttemptTracker = Depends(get_login_tracker),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Login endpoint
    
    Authenticates user and returns JWT tokens
    """
    ip_address = device_info["ip_address"]
    user_agent = device_info["user_agent"]
    
    # Rate limiting - 5 attempts per minute per IP
    is_allowed, remaining = rate_limiter.check_rate_limit(
        f"login:{ip_address}",
        limit=5,
        window=60
    )
    
    if not is_allowed:
        await audit_logger.log_login_failure(
            email=login_data.email,
            reason="rate_limit_exceeded",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Check if account is locked
    if login_tracker.is_account_locked(login_data.email):
        await audit_logger.log_login_failure(
            email=login_data.email,
            reason="account_locked",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked due to multiple failed login attempts."
        )
    
    # Get user from database
    query = """
        SELECT id, organization_id, email, password_hash, role, status, 
               mfa_enabled, mfa_secret, last_login
        FROM users
        WHERE email = $1 AND deleted_at IS NULL
    """
    
    user = await db.fetchrow(query, login_data.email)
    
    if not user:
        # Record failed attempt
        login_tracker.record_failed_attempt(login_data.email, ip_address)
        
        await audit_logger.log_login_failure(
            email=login_data.email,
            reason="invalid_credentials",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        # Generic error message to prevent user enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check user status
    if user["status"] != "active":
        await audit_logger.log_login_failure(
            email=login_data.email,
            reason=f"account_{user['status']}",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user['status']}"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["password_hash"]):
        # Record failed attempt
        attempts = login_tracker.record_failed_attempt(login_data.email, ip_address)
        
        # Lock account after 5 failed attempts
        if attempts >= 5:
            login_tracker.lock_account(login_data.email, duration=1800)  # 30 minutes
            
            await audit_logger.log_event(
                user_id=str(user["id"]),
                organization_id=str(user["organization_id"]),
                action="account_locked",
                entity_type="user",
                entity_id=str(user["id"]),
                ip_address=ip_address,
                user_agent=user_agent,
            )
        
        await audit_logger.log_login_failure(
            email=login_data.email,
            reason="invalid_password",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check MFA if enabled
    if user["mfa_enabled"]:
        if not login_data.mfa_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA token required",
                headers={"X-MFA-Required": "true"}
            )
        
        if not verify_mfa_token(user["mfa_secret"], login_data.mfa_token):
            await audit_logger.log_login_failure(
                email=login_data.email,
                reason="invalid_mfa_token",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA token"
            )
    
    # Reset failed login attempts
    login_tracker.reset_attempts(login_data.email)
    
    # Create tokens
    access_token = create_access_token(
        user_id=str(user["id"]),
        organization_id=str(user["organization_id"]),
        role=user["role"],
        email=user["email"]
    )
    
    refresh_token = create_refresh_token(user_id=str(user["id"]))
    
    # Create session
    device_info_extended = {
        **device_info,
        "device_fingerprint": login_data.device_fingerprint
    }
    
    session_id = session_store.create_session(
        user_id=str(user["id"]),
        refresh_token=refresh_token,
        device_info=device_info_extended,
        remember_device=login_data.remember_device
    )
    
    # Update last login
    await db.execute(
        "UPDATE users SET last_login = $1 WHERE id = $2",
        datetime.utcnow(),
        user["id"]
    )
    
    # Log successful login
    await audit_logger.log_login_success(
        user_id=str(user["id"]),
        organization_id=str(user["organization_id"]),
        ip_address=ip_address,
        user_agent=user_agent,
        mfa_used=user["mfa_enabled"]
    )
    
    # Prepare response
    user_response = UserResponse(
        id=str(user["id"]),
        organization_id=str(user["organization_id"]),
        email=user["email"],
        role=user["role"],
        status=user["status"],
        mfa_enabled=user["mfa_enabled"],
        last_login=user["last_login"],
        created_at=datetime.utcnow()  # Would come from DB
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=15 * 60,  # 15 minutes
        user=user_response
    )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_active_user),
    session_store: SessionStore = Depends(get_session_store),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Logout endpoint
    
    Revokes current session and refresh token
    """
    # Get refresh token from request (could be in body or header)
    # For now, we'll delete all user sessions
    session_store.delete_user_sessions(current_user["user_id"])
    
    # Log logout
    await audit_logger.log_logout(
        user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: asyncpg.Pool = Depends(get_db_pool),
    session_store: SessionStore = Depends(get_session_store),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Refresh token endpoint
    
    Issues new access token using refresh token
    """
    try:
        # Decode refresh token
        payload = decode_token(refresh_data.refresh_token)
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        
        # Verify session exists
        session = session_store.get_session_by_refresh_token(refresh_data.refresh_token)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user from database
        query = """
            SELECT id, organization_id, email, role, status, mfa_enabled, last_login
            FROM users
            WHERE id = $1 AND deleted_at IS NULL
        """
        
        user = await db.fetchrow(query, payload["sub"])
        
        if not user or user["status"] != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        access_token = create_access_token(
            user_id=str(user["id"]),
            organization_id=str(user["organization_id"]),
            role=user["role"],
            email=user["email"]
        )
        
        # Update session activity
        session_store.update_session_activity(session["session_id"])
        
        # Log token refresh
        await audit_logger.log_token_refresh(
            user_id=str(user["id"]),
            organization_id=str(user["organization_id"]),
            ip_address=device_info["ip_address"],
            user_agent=device_info["user_agent"],
        )
        
        # Prepare response
        user_response = UserResponse(
            id=str(user["id"]),
            organization_id=str(user["organization_id"]),
            email=user["email"],
            role=user["role"],
            status=user["status"],
            mfa_enabled=user["mfa_enabled"],
            last_login=user["last_login"],
            created_at=datetime.utcnow()
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_data.refresh_token,  # Keep same refresh token
            expires_in=15 * 60,
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get current user information
    """
    query = """
        SELECT id, organization_id, email, role, status, mfa_enabled, 
               last_login, created_at
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
    """
    
    user = await db.fetchrow(query, current_user["user_id"])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user["id"]),
        organization_id=str(user["organization_id"]),
        email=user["email"],
        role=user["role"],
        status=user["status"],
        mfa_enabled=user["mfa_enabled"],
        last_login=user["last_login"],
        created_at=user["created_at"]
    )



@router.post("/change-password")
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    session_store: SessionStore = Depends(get_session_store),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Change password endpoint
    """
    # Get current user
    query = "SELECT password_hash FROM users WHERE id = $1"
    user = await db.fetchrow(query, current_user["user_id"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Check if new password is breached
    if check_breached_password(password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password has been found in data breaches. Please choose a different password."
        )
    
    # Hash new password
    new_password_hash = hash_password(password_data.new_password)
    
    # Update password
    await db.execute(
        "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3",
        new_password_hash,
        datetime.utcnow(),
        current_user["user_id"]
    )
    
    # Revoke all sessions except current
    session_store.delete_user_sessions(current_user["user_id"])
    
    # Log password change
    await audit_logger.log_password_change(
        user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return {"message": "Password changed successfully"}


@router.get("/sessions", response_model=list[SessionResponse])
async def get_user_sessions(
    current_user: dict = Depends(get_current_active_user),
    session_store: SessionStore = Depends(get_session_store),
):
    """
    Get all active sessions for current user
    """
    sessions = session_store.get_user_sessions(current_user["user_id"])
    
    return [
        SessionResponse(
            session_id=s["session_id"],
            device=s["device"],
            ip_address=s["ip_address"],
            country=s.get("country"),
            last_activity=datetime.fromisoformat(s["last_activity"]),
            is_current=False  # TODO: Determine current session
        )
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_active_user),
    session_store: SessionStore = Depends(get_session_store),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Revoke a specific session
    """
    session = session_store.get_session(session_id)
    
    if not session or session["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_store.delete_session(session_id)
    
    await audit_logger.log_session_revoked(
        user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        session_id=session_id,
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return {"message": "Session revoked successfully"}


# MFA Endpoints

@router.post("/mfa/enroll", response_model=MFAEnrollResponse)
async def enroll_mfa(
    request: Request,
    enroll_data: MFAEnrollRequest,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Enroll in MFA (TOTP)
    """
    # Verify password
    query = "SELECT password_hash, mfa_enabled FROM users WHERE id = $1"
    user = await db.fetchrow(query, current_user["user_id"])
    
    if not verify_password(enroll_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    if user["mfa_enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )
    
    # Generate MFA secret
    secret = generate_mfa_secret()
    qr_code = generate_mfa_qr_code(current_user["email"], secret)
    backup_codes = generate_backup_codes()
    
    # Store secret (temporarily, until verified)
    await db.execute(
        "UPDATE users SET mfa_secret = $1 WHERE id = $2",
        secret,
        current_user["user_id"]
    )
    
    return MFAEnrollResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=backup_codes
    )


@router.post("/mfa/verify")
async def verify_mfa(
    request: Request,
    verify_data: MFAVerifyRequest,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Verify and enable MFA
    """
    query = "SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1"
    user = await db.fetchrow(query, current_user["user_id"])
    
    if not user["mfa_secret"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not enrolled"
        )
    
    if not verify_mfa_token(user["mfa_secret"], verify_data.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token"
        )
    
    # Enable MFA
    await db.execute(
        "UPDATE users SET mfa_enabled = TRUE WHERE id = $1",
        current_user["user_id"]
    )
    
    await audit_logger.log_mfa_enabled(
        user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return {"message": "MFA enabled successfully"}


@router.post("/mfa/disable")
async def disable_mfa(
    request: Request,
    disable_data: MFADisableRequest,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Disable MFA
    """
    query = "SELECT password_hash, mfa_secret, mfa_enabled FROM users WHERE id = $1"
    user = await db.fetchrow(query, current_user["user_id"])
    
    if not user["mfa_enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    # Verify password
    if not verify_password(disable_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Verify MFA token
    if not verify_mfa_token(user["mfa_secret"], disable_data.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token"
        )
    
    # Disable MFA
    await db.execute(
        "UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL WHERE id = $1",
        current_user["user_id"]
    )
    
    await audit_logger.log_mfa_disabled(
        user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return {"message": "MFA disabled successfully"}
