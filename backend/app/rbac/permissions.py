"""
QuantumShield - RBAC Permissions
Permission definitions and role mappings
"""

from enum import Enum
from typing import Set, Dict


class Permission(str, Enum):
    """Permission enumeration"""
    
    # Asset permissions
    ASSET_READ = "asset.read"
    ASSET_WRITE = "asset.write"
    ASSET_DELETE = "asset.delete"
    ASSET_SCAN = "asset.scan"
    
    # Risk permissions
    RISK_READ = "risk.read"
    RISK_COMPUTE = "risk.compute"
    RISK_EXPORT = "risk.export"
    
    # Scan permissions
    SCAN_READ = "scan.read"
    SCAN_CREATE = "scan.create"
    SCAN_DELETE = "scan.delete"
    
    # Crypto permissions
    CRYPTO_READ = "crypto.read"
    CRYPTO_ANALYZE = "crypto.analyze"
    
    # Simulation permissions
    SIMULATION_READ = "simulation.read"
    SIMULATION_RUN = "simulation.run"
    
    # Migration permissions
    MIGRATION_READ = "migration.read"
    MIGRATION_PLAN = "migration.plan"
    
    # Report permissions
    REPORT_READ = "report.read"
    REPORT_GENERATE = "report.generate"
    REPORT_EXPORT = "report.export"
    
    # User management permissions
    USER_READ = "user.read"
    USER_CREATE = "user.create"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_MANAGE = "user.manage"
    
    # Organization permissions
    ORG_READ = "organization.read"
    ORG_UPDATE = "organization.update"
    ORG_MANAGE = "organization.manage"
    
    # Audit permissions
    AUDIT_READ = "audit.read"
    AUDIT_EXPORT = "audit.export"
    
    # Settings permissions
    SETTINGS_READ = "settings.read"
    SETTINGS_UPDATE = "settings.update"


class Role(str, Enum):
    """Role enumeration"""
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"
    AUDITOR = "auditor"


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.ADMIN: {
        # All permissions
        Permission.ASSET_READ,
        Permission.ASSET_WRITE,
        Permission.ASSET_DELETE,
        Permission.ASSET_SCAN,
        Permission.RISK_READ,
        Permission.RISK_COMPUTE,
        Permission.RISK_EXPORT,
        Permission.SCAN_READ,
        Permission.SCAN_CREATE,
        Permission.SCAN_DELETE,
        Permission.CRYPTO_READ,
        Permission.CRYPTO_ANALYZE,
        Permission.SIMULATION_READ,
        Permission.SIMULATION_RUN,
        Permission.MIGRATION_READ,
        Permission.MIGRATION_PLAN,
        Permission.REPORT_READ,
        Permission.REPORT_GENERATE,
        Permission.REPORT_EXPORT,
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_MANAGE,
        Permission.ORG_READ,
        Permission.ORG_UPDATE,
        Permission.ORG_MANAGE,
        Permission.AUDIT_READ,
        Permission.AUDIT_EXPORT,
        Permission.SETTINGS_READ,
        Permission.SETTINGS_UPDATE,
    },
    
    Role.ANALYST: {
        # Security analyst permissions
        Permission.ASSET_READ,
        Permission.ASSET_WRITE,
        Permission.ASSET_SCAN,
        Permission.RISK_READ,
        Permission.RISK_COMPUTE,
        Permission.RISK_EXPORT,
        Permission.SCAN_READ,
        Permission.SCAN_CREATE,
        Permission.CRYPTO_READ,
        Permission.CRYPTO_ANALYZE,
        Permission.SIMULATION_READ,
        Permission.SIMULATION_RUN,
        Permission.MIGRATION_READ,
        Permission.MIGRATION_PLAN,
        Permission.REPORT_READ,
        Permission.REPORT_GENERATE,
        Permission.REPORT_EXPORT,
        Permission.SETTINGS_READ,
    },
    
    Role.VIEWER: {
        # Read-only permissions
        Permission.ASSET_READ,
        Permission.RISK_READ,
        Permission.SCAN_READ,
        Permission.CRYPTO_READ,
        Permission.SIMULATION_READ,
        Permission.MIGRATION_READ,
        Permission.REPORT_READ,
        Permission.SETTINGS_READ,
    },
    
    Role.AUDITOR: {
        # Audit and compliance permissions
        Permission.ASSET_READ,
        Permission.RISK_READ,
        Permission.SCAN_READ,
        Permission.CRYPTO_READ,
        Permission.REPORT_READ,
        Permission.REPORT_EXPORT,
        Permission.AUDIT_READ,
        Permission.AUDIT_EXPORT,
        Permission.SETTINGS_READ,
    },
}


def has_permission(role: str, permission: str) -> bool:
    """
    Check if role has permission
    
    Args:
        role: User role
        permission: Required permission
        
    Returns:
        True if role has permission
    """
    try:
        role_enum = Role(role)
        permission_enum = Permission(permission)
        return permission_enum in ROLE_PERMISSIONS.get(role_enum, set())
    except (ValueError, KeyError):
        return False


def get_role_permissions(role: str) -> Set[str]:
    """
    Get all permissions for a role
    
    Args:
        role: User role
        
    Returns:
        Set of permission strings
    """
    try:
        role_enum = Role(role)
        return {p.value for p in ROLE_PERMISSIONS.get(role_enum, set())}
    except ValueError:
        return set()


def can_access_resource(role: str, resource: str, action: str) -> bool:
    """
    Check if role can perform action on resource
    
    Args:
        role: User role
        resource: Resource name (e.g., 'asset', 'risk')
        action: Action name (e.g., 'read', 'write')
        
    Returns:
        True if access is allowed
    """
    permission = f"{resource}.{action}"
    return has_permission(role, permission)
