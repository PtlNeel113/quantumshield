"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredPermission="user.read">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">User Management</h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage users, roles, and permissions
              </p>
            </div>
            <ProtectedRoute requiredPermission="user.create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </ProtectedRoute>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Users</h2>
            </div>
            <p className="text-slate-400">User list will be displayed here...</p>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
