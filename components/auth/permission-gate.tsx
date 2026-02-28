"use client";

import { useAuth } from "@/lib/auth-context";

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
}

/**
 * Component to conditionally render children based on permissions/roles
 */
export function PermissionGate({
  children,
  permission,
  role,
  roles,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasRole } = useAuth();

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check roles (any of)
  if (roles && !roles.some((r) => hasRole(r))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
