"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  requiredRoles,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check required permission
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/unauthorized");
        return;
      }

      // Check required role
      if (requiredRole && !hasRole(requiredRole)) {
        router.push("/unauthorized");
        return;
      }

      // Check required roles (any of)
      if (requiredRoles && !requiredRoles.some((role) => hasRole(role))) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [
    loading,
    isAuthenticated,
    requiredPermission,
    requiredRole,
    requiredRoles,
    router,
    hasPermission,
    hasRole,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check permissions
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  if (requiredRoles && !requiredRoles.some((role) => hasRole(role))) {
    return null;
  }

  return <>{children}</>;
}
