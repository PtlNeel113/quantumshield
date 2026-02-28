"""
QuantumShield - Demo Authentication Routes
Simplified routes for demo without database
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from .security import (
    verify_password, hash_password, create_access_token,
    create_refresh_token, decode_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Demo user data (in-memory)
DEMO_USERS = {
    "admin@quantumshield.com": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "organization_id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "admin@quantumshield.com",
        "password_hash": hash_password("admin123"),
        "role": "admin",
        "status": "active",
        "mfa_enabled": False,
    },
    "analyst@quantumshield.com": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "organization_id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "analyst@quantumshield.com",
        "password_hash": hash_password("analyst123"),
        "role": "analyst",
        "status": "active",
        "mfa_enabled": False,
    },
    "viewer@quantumshield.com": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "organization_id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "viewer@quantumshield.com",
        "password_hash": hash_password("viewer123"),
        "role": "viewer",
        "status": "active",
        "mfa_enabled": False,
    },
    "nil1032007@gmail.com": {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "organization_id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "nil1032007@gmail.com",
        "password_hash": hash_password("password123"),
        "role": "admin",
        "status": "active",
        "mfa_enabled": False,
    },
}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_token: str | None = None
    remember_device: bool = False


class UserResponse(BaseModel):
    id: str
    organization_id: str
    email: str
    role: str
    status: str
    mfa_enabled: bool
    last_login: str | None
    created_at: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Demo login endpoint - accepts any password for demo purposes"""
    
    print(f"🔍 Login attempt for: {login_data.email}")
    print(f"🔍 Available users: {list(DEMO_USERS.keys())}")
    
    # Get user
    user = DEMO_USERS.get(login_data.email)
    
    print(f"🔍 User found: {user is not None}")
    
    if not user:
        print(f"❌ User not found: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    print(f"✅ User authenticated: {login_data.email}")
    
    # Skip password verification for demo mode - accept any password
    # if not verify_password(login_data.password, user["password_hash"]):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid credentials"
    #     )
    
    # Create tokens
    access_token = create_access_token(
        user_id=user["id"],
        organization_id=user["organization_id"],
        role=user["role"],
        email=user["email"]
    )
    
    refresh_token = create_refresh_token(user_id=user["id"])
    
    # Prepare response
    user_response = UserResponse(
        id=user["id"],
        organization_id=user["organization_id"],
        email=user["email"],
        role=user["role"],
        status=user["status"],
        mfa_enabled=user["mfa_enabled"],
        last_login=datetime.utcnow().isoformat(),
        created_at=datetime.utcnow().isoformat()
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=15 * 60,
        user=user_response
    )


@router.post("/logout")
async def logout():
    """Demo logout endpoint"""
    return {"message": "Successfully logged out"}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(refresh_data: RefreshTokenRequest):
    """Demo refresh token endpoint"""
    try:
        payload = decode_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        
        # Find user by ID
        user = None
        for u in DEMO_USERS.values():
            if u["id"] == user_id:
                user = u
                break
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Create new access token
        access_token = create_access_token(
            user_id=user["id"],
            organization_id=user["organization_id"],
            role=user["role"],
            email=user["email"]
        )
        
        user_response = UserResponse(
            id=user["id"],
            organization_id=user["organization_id"],
            email=user["email"],
            role=user["role"],
            status=user["status"],
            mfa_enabled=user["mfa_enabled"],
            last_login=datetime.utcnow().isoformat(),
            created_at=datetime.utcnow().isoformat()
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_data.refresh_token,
            expires_in=15 * 60,
            user=user_response
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    """Demo get current user endpoint"""
    # Return demo admin user
    user = DEMO_USERS["admin@quantumshield.com"]
    return UserResponse(
        id=user["id"],
        organization_id=user["organization_id"],
        email=user["email"],
        role=user["role"],
        status=user["status"],
        mfa_enabled=user["mfa_enabled"],
        last_login=datetime.utcnow().isoformat(),
        created_at=datetime.utcnow().isoformat()
    )
