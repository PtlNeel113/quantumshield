"""
QuantumShield - Audit logging
Security event tracking and logging
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
import asyncpg


class AuditLogger:
    """Audit logging service"""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
    
    async def log_event(
        self,
        user_id: Optional[str],
        organization_id: Optional[str],
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Log security event to audit log
        
        Args:
            user_id: User UUID (optional for system events)
            organization_id: Organization UUID
            action: Action performed (login_success, login_failure, etc.)
            entity_type: Type of entity affected (user, asset, etc.)
            entity_id: ID of entity affected
            old_value: Previous value (for updates)
            new_value: New value (for updates)
            ip_address: IP address
            user_agent: User agent string
            metadata: Additional metadata
        """
        import json
        
        query = """
            INSERT INTO audit_logs (
                user_id, organization_id, action, entity_type, entity_id,
                old_value, new_value, ip_address, user_agent, request_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """
        
        try:
            await self.db.execute(
                query,
                UUID(user_id) if user_id else None,
                UUID(organization_id) if organization_id else None,
                action,
                entity_type,
                UUID(entity_id) if entity_id else None,
                json.dumps(old_value) if old_value else None,
                json.dumps(new_value) if new_value else None,
                ip_address,
                user_agent,
                metadata.get("request_id") if metadata else None,
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Audit logging error: {e}")
    
    async def log_login_success(
        self,
        user_id: str,
        organization_id: str,
        ip_address: str,
        user_agent: str,
        mfa_used: bool = False,
    ):
        """Log successful login"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="login_success",
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"mfa_used": mfa_used},
        )
    
    async def log_login_failure(
        self,
        email: str,
        reason: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log failed login attempt"""
        await self.log_event(
            user_id=None,
            organization_id=None,
            action="login_failure",
            entity_type="user",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": email, "reason": reason},
        )
    
    async def log_logout(
        self,
        user_id: str,
        organization_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log logout"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="logout",
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_password_change(
        self,
        user_id: str,
        organization_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log password change"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="password_change",
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_mfa_enabled(
        self,
        user_id: str,
        organization_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log MFA enrollment"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="mfa_enabled",
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_mfa_disabled(
        self,
        user_id: str,
        organization_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log MFA disabled"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="mfa_disabled",
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_user_created(
        self,
        admin_user_id: str,
        organization_id: str,
        new_user_id: str,
        new_user_email: str,
        new_user_role: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log user creation"""
        await self.log_event(
            user_id=admin_user_id,
            organization_id=organization_id,
            action="user_created",
            entity_type="user",
            entity_id=new_user_id,
            new_value={"email": new_user_email, "role": new_user_role},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_user_updated(
        self,
        admin_user_id: str,
        organization_id: str,
        target_user_id: str,
        old_values: Dict[str, Any],
        new_values: Dict[str, Any],
        ip_address: str,
        user_agent: str,
    ):
        """Log user update"""
        await self.log_event(
            user_id=admin_user_id,
            organization_id=organization_id,
            action="user_updated",
            entity_type="user",
            entity_id=target_user_id,
            old_value=old_values,
            new_value=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_user_deleted(
        self,
        admin_user_id: str,
        organization_id: str,
        deleted_user_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log user deletion"""
        await self.log_event(
            user_id=admin_user_id,
            organization_id=organization_id,
            action="user_deleted",
            entity_type="user",
            entity_id=deleted_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_role_changed(
        self,
        admin_user_id: str,
        organization_id: str,
        target_user_id: str,
        old_role: str,
        new_role: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log role change"""
        await self.log_event(
            user_id=admin_user_id,
            organization_id=organization_id,
            action="role_changed",
            entity_type="user",
            entity_id=target_user_id,
            old_value={"role": old_role},
            new_value={"role": new_role},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_token_refresh(
        self,
        user_id: str,
        organization_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log token refresh"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="token_refresh",
            entity_type="user",
            entity_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def log_session_revoked(
        self,
        user_id: str,
        organization_id: str,
        session_id: str,
        ip_address: str,
        user_agent: str,
    ):
        """Log session revocation"""
        await self.log_event(
            user_id=user_id,
            organization_id=organization_id,
            action="session_revoked",
            entity_type="session",
            entity_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def get_user_audit_logs(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list:
        """
        Get audit logs for a user
        
        Args:
            user_id: User UUID
            limit: Maximum number of records
            offset: Offset for pagination
            
        Returns:
            List of audit log records
        """
        query = """
            SELECT id, user_id, action, entity_type, entity_id,
                   ip_address, user_agent, created_at
            FROM audit_logs
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        rows = await self.db.fetch(query, UUID(user_id), limit, offset)
        return [dict(row) for row in rows]
    
    async def get_organization_audit_logs(
        self,
        organization_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list:
        """
        Get audit logs for an organization
        
        Args:
            organization_id: Organization UUID
            limit: Maximum number of records
            offset: Offset for pagination
            
        Returns:
            List of audit log records
        """
        query = """
            SELECT id, user_id, action, entity_type, entity_id,
                   ip_address, user_agent, created_at
            FROM audit_logs
            WHERE organization_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        rows = await self.db.fetch(query, UUID(organization_id), limit, offset)
        return [dict(row) for row in rows]
