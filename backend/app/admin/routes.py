"""
QuantumShield - Admin routes
User management endpoints (admin only)
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
import asyncpg

from ..auth.models import CreateUserRequest, UpdateUserRequest, UserResponse, AuditLogResponse
from ..auth.security import hash_password, check_breached_password
from ..auth.middleware import get_current_active_user, require_permission, get_device_info
from ..auth.audit import AuditLogger
from ..database import get_db_pool

router = APIRouter(prefix="/admin", tags=["Admin"])


async def get_audit_logger() -> AuditLogger:
    """Get audit logger instance"""
    db_pool = await get_db_pool()
    return AuditLogger(db_pool)


@router.post("/users", response_model=UserResponse)
@require_permission("user.create")
async def create_user(
    request: Request,
    user_data: CreateUserRequest,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Create new user (admin only)
    """
    # Check if email already exists
    existing_user = await db.fetchrow(
        "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
        user_data.email
    )
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if password is breached
    if check_breached_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password has been found in data breaches. Please choose a different password."
        )
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Use current user's organization if not specified
    organization_id = user_data.organization_id or current_user["organization_id"]
    
    # Create user
    query = """
        INSERT INTO users (
            organization_id, email, password_hash, role, status
        ) VALUES ($1, $2, $3, $4, 'active')
        RETURNING id, organization_id, email, role, status, mfa_enabled, 
                  last_login, created_at
    """
    
    new_user = await db.fetchrow(
        query,
        organization_id,
        user_data.email,
        password_hash,
        user_data.role
    )
    
    # Log user creation
    await audit_logger.log_user_created(
        admin_user_id=current_user["user_id"],
        organization_id=organization_id,
        new_user_id=str(new_user["id"]),
        new_user_email=new_user["email"],
        new_user_role=new_user["role"],
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return UserResponse(
        id=str(new_user["id"]),
        organization_id=str(new_user["organization_id"]),
        email=new_user["email"],
        role=new_user["role"],
        status=new_user["status"],
        mfa_enabled=new_user["mfa_enabled"],
        last_login=new_user["last_login"],
        created_at=new_user["created_at"]
    )


@router.get("/users", response_model=List[UserResponse])
@require_permission("user.read")
async def list_users(
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    skip: int = 0,
    limit: int = 100,
):
    """
    List all users in organization
    """
    query = """
        SELECT id, organization_id, email, role, status, mfa_enabled,
               last_login, created_at
        FROM users
        WHERE organization_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    """
    
    users = await db.fetch(
        query,
        current_user["organization_id"],
        limit,
        skip
    )
    
    return [
        UserResponse(
            id=str(user["id"]),
            organization_id=str(user["organization_id"]),
            email=user["email"],
            role=user["role"],
            status=user["status"],
            mfa_enabled=user["mfa_enabled"],
            last_login=user["last_login"],
            created_at=user["created_at"]
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
@require_permission("user.read")
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get user by ID
    """
    query = """
        SELECT id, organization_id, email, role, status, mfa_enabled,
               last_login, created_at
        FROM users
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
    """
    
    user = await db.fetchrow(query, user_id, current_user["organization_id"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
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


@router.patch("/users/{user_id}", response_model=UserResponse)
@require_permission("user.update")
async def update_user(
    user_id: str,
    request: Request,
    user_data: UpdateUserRequest,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Update user (admin only)
    """
    # Get current user data
    query = """
        SELECT id, organization_id, email, role, status
        FROM users
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
    """
    
    user = await db.fetchrow(query, user_id, current_user["organization_id"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    old_values = {
        "role": user["role"],
        "status": user["status"]
    }
    
    new_values = {}
    update_fields = []
    update_values = []
    param_count = 1
    
    if user_data.role is not None:
        update_fields.append(f"role = ${param_count}")
        update_values.append(user_data.role)
        new_values["role"] = user_data.role
        param_count += 1
    
    if user_data.status is not None:
        update_fields.append(f"status = ${param_count}")
        update_values.append(user_data.status)
        new_values["status"] = user_data.status
        param_count += 1
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Add updated_at
    update_fields.append(f"updated_at = ${param_count}")
    update_values.append(datetime.utcnow())
    param_count += 1
    
    # Add user_id for WHERE clause
    update_values.append(user_id)
    
    # Update user
    update_query = f"""
        UPDATE users
        SET {', '.join(update_fields)}
        WHERE id = ${param_count}
        RETURNING id, organization_id, email, role, status, mfa_enabled,
                  last_login, created_at
    """
    
    updated_user = await db.fetchrow(update_query, *update_values)
    
    # Log user update
    await audit_logger.log_user_updated(
        admin_user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        target_user_id=user_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return UserResponse(
        id=str(updated_user["id"]),
        organization_id=str(updated_user["organization_id"]),
        email=updated_user["email"],
        role=updated_user["role"],
        status=updated_user["status"],
        mfa_enabled=updated_user["mfa_enabled"],
        last_login=updated_user["last_login"],
        created_at=updated_user["created_at"]
    )


@router.delete("/users/{user_id}")
@require_permission("user.delete")
async def delete_user(
    user_id: str,
    request: Request,
    current_user: dict = Depends(get_current_active_user),
    db: asyncpg.Pool = Depends(get_db_pool),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    device_info: dict = Depends(get_device_info),
):
    """
    Delete user (soft delete)
    """
    # Prevent self-deletion
    if user_id == current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Soft delete user
    result = await db.execute(
        """
        UPDATE users
        SET deleted_at = $1
        WHERE id = $2 AND organization_id = $3 AND deleted_at IS NULL
        """,
        datetime.utcnow(),
        user_id,
        current_user["organization_id"]
    )
    
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log user deletion
    await audit_logger.log_user_deleted(
        admin_user_id=current_user["user_id"],
        organization_id=current_user["organization_id"],
        deleted_user_id=user_id,
        ip_address=device_info["ip_address"],
        user_agent=device_info["user_agent"],
    )
    
    return {"message": "User deleted successfully"}


@router.get("/audit-logs", response_model=List[AuditLogResponse])
@require_permission("audit.read")
async def get_audit_logs(
    current_user: dict = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get audit logs for organization
    """
    logs = await audit_logger.get_organization_audit_logs(
        organization_id=current_user["organization_id"],
        limit=limit,
        offset=skip
    )
    
    return [
        AuditLogResponse(
            id=str(log["id"]),
            user_id=str(log["user_id"]) if log["user_id"] else None,
            action=log["action"],
            ip_address=log["ip_address"],
            user_agent=log["user_agent"],
            created_at=log["created_at"],
            metadata=None
        )
        for log in logs
    ]
