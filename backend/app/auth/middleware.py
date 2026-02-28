"""
QuantumShield - Authentication middleware
JWT verification and RBAC enforcement
"""

from functools import wraps
from typing import Optional, Callable
from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from .security import decode_token
from ..rbac.permissions import has_permission


security = HTTPBearer()


class AuthenticationError(HTTPException):
    """Authentication error exception"""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Authorization error exception"""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP authorization credentials
        
    Returns:
        User data from token
        
    Raises:
        AuthenticationError: If token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        
        # Verify token type
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type")
        
        # Extract user data
        user_data = {
            "user_id": payload.get("sub"),
            "organization_id": payload.get("org"),
            "role": payload.get("role"),
            "email": payload.get("email"),
        }
        
        # Validate required fields
        if not all(user_data.values()):
            raise AuthenticationError("Invalid token payload")
        
        return user_data
        
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")
    except Exception:
        raise AuthenticationError()


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Get current active user (can be extended to check user status in DB)
    
    Args:
        current_user: Current user from token
        
    Returns:
        User data
    """
    # TODO: Check user status in database if needed
    return current_user


def require_permission(permission: str):
    """
    Decorator to require specific permission
    
    Args:
        permission: Required permission (e.g., 'asset.read')
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, current_user: dict = Depends(get_current_active_user), **kwargs):
            user_role = current_user.get("role")
            
            if not has_permission(user_role, permission):
                raise AuthorizationError(
                    f"Permission '{permission}' required. Your role: {user_role}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        
        return wrapper
    return decorator


def require_role(role: str):
    """
    Decorator to require specific role
    
    Args:
        role: Required role (e.g., 'admin')
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, current_user: dict = Depends(get_current_active_user), **kwargs):
            user_role = current_user.get("role")
            
            if user_role != role:
                raise AuthorizationError(
                    f"Role '{role}' required. Your role: {user_role}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        
        return wrapper
    return decorator


def require_any_role(*roles: str):
    """
    Decorator to require any of the specified roles
    
    Args:
        roles: Required roles
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, current_user: dict = Depends(get_current_active_user), **kwargs):
            user_role = current_user.get("role")
            
            if user_role not in roles:
                raise AuthorizationError(
                    f"One of roles {roles} required. Your role: {user_role}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        
        return wrapper
    return decorator


def require_same_organization(func: Callable):
    """
    Decorator to ensure user can only access resources in their organization
    
    Args:
        func: Function to wrap
        
    Returns:
        Wrapped function
    """
    @wraps(func)
    async def wrapper(*args, current_user: dict = Depends(get_current_active_user), **kwargs):
        # Extract organization_id from kwargs or path parameters
        resource_org_id = kwargs.get("organization_id")
        user_org_id = current_user.get("organization_id")
        
        # Admin can access all organizations
        if current_user.get("role") == "admin":
            return await func(*args, current_user=current_user, **kwargs)
        
        # Check organization match
        if resource_org_id and resource_org_id != user_org_id:
            raise AuthorizationError("Access denied to this organization's resources")
        
        return await func(*args, current_user=current_user, **kwargs)
    
    return wrapper


async def get_device_info(request: Request) -> dict:
    """
    Extract device information from request
    
    Args:
        request: FastAPI request object
        
    Returns:
        Device information dictionary
    """
    return {
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "ip_address": request.client.host if request.client else "Unknown",
        "device_fingerprint": request.headers.get("x-device-fingerprint"),
    }
