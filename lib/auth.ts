/**
 * QuantumShield - Authentication utilities
 * Client-side auth functions and token management
 */

import { jwtDecode } from "jwt-decode";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface LoginCredentials {
  email: string;
  password: string;
  mfa_token?: string;
  remember_device?: boolean;
  device_fingerprint?: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  status: string;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface TokenPayload {
  sub: string;
  org: string;
  role: string;
  email: string;
  type: string;
  iat: number;
  exp: number;
}

/**
 * Login user — accepts any email/password for demo/hackathon mode
 */
export async function login(credentials: LoginCredentials): Promise<{
  success: boolean;
  mfaRequired?: boolean;
  error?: string;
}> {
  try {
    console.log("🔍 Login attempt:", credentials.email);

    // --- Demo/Hackathon mode: accept any credentials ---
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 86400; // 24 hours

    // Build a fake JWT-like token (header.payload.signature) so isAuthenticated() works
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: "demo-user-001",
        org: "demo-org",
        role: "admin",
        email: credentials.email,
        type: "access",
        iat: now,
        exp: exp,
      })
    );
    const fakeToken = `${header}.${payload}.demo-signature`;

    // Build a mock user object
    const mockUser: User = {
      id: "demo-user-001",
      organization_id: "demo-org",
      email: credentials.email,
      role: "admin",
      status: "active",
      mfa_enabled: false,
      last_login: new Date().toISOString(),
      created_at: "2024-01-01T00:00:00Z",
    };

    // Store tokens
    setAccessToken(fakeToken);
    setRefreshToken(`refresh-${fakeToken}`);

    // Store user data
    localStorage.setItem("user", JSON.stringify(mockUser));

    console.log("✅ Login successful (demo mode):", mockUser.email);
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const token = getAccessToken();

    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage
    clearTokens();
    localStorage.removeItem("user");
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const data: LoginResponse = await response.json();
      setAccessToken(data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return true;
    }

    // Refresh failed, clear tokens
    clearTokens();
    return false;
  } catch (error) {
    console.error("Token refresh error:", error);
    clearTokens();
    return false;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getAccessToken();

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user: User = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    }

    // Token invalid, try refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return getCurrentUser();
    }

    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const now = Date.now() / 1000;

    // Check if token is expired
    if (decoded.exp < now) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user from local storage
 */
export function getStoredUser(): User | null {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Decode access token
 */
export function decodeAccessToken(): TokenPayload | null {
  try {
    const token = getAccessToken();
    return token ? jwtDecode<TokenPayload>(token) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(permission: string): boolean {
  const user = getStoredUser();
  if (!user) return false;

  // Get role permissions from config
  const rolePermissions = getRolePermissions(user.role);
  return rolePermissions.includes(permission);
}

/**
 * Check if user has role
 */
export function hasRole(role: string): boolean {
  const user = getStoredUser();
  return user?.role === role;
}

/**
 * Check if user has any of the roles
 */
export function hasAnyRole(roles: string[]): boolean {
  const user = getStoredUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Get role permissions
 */
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: [
      "asset.read", "asset.write", "asset.delete", "asset.scan",
      "risk.read", "risk.compute", "risk.export",
      "scan.read", "scan.create", "scan.delete",
      "crypto.read", "crypto.analyze",
      "simulation.read", "simulation.run",
      "migration.read", "migration.plan",
      "report.read", "report.generate", "report.export",
      "user.read", "user.create", "user.update", "user.delete", "user.manage",
      "organization.read", "organization.update", "organization.manage",
      "audit.read", "audit.export",
      "settings.read", "settings.update",
    ],
    analyst: [
      "asset.read", "asset.write", "asset.scan",
      "risk.read", "risk.compute", "risk.export",
      "scan.read", "scan.create",
      "crypto.read", "crypto.analyze",
      "simulation.read", "simulation.run",
      "migration.read", "migration.plan",
      "report.read", "report.generate", "report.export",
      "settings.read",
    ],
    viewer: [
      "asset.read",
      "risk.read",
      "scan.read",
      "crypto.read",
      "simulation.read",
      "migration.read",
      "report.read",
      "settings.read",
    ],
    auditor: [
      "asset.read",
      "risk.read",
      "scan.read",
      "crypto.read",
      "report.read", "report.export",
      "audit.read", "audit.export",
      "settings.read",
    ],
  };

  return permissions[role] || [];
}

// Token storage helpers
function setAccessToken(token: string): void {
  localStorage.setItem("access_token", token);
}

function setRefreshToken(token: string): void {
  localStorage.setItem("refresh_token", token);
}

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/**
 * API request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry request with new token
      const newToken = getAccessToken();
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed, redirect to login
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  return response;
}

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(): string {
  // Simple device fingerprint based on browser info
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fingerprint = `${userAgent}-${language}-${platform}-${screenResolution}-${timezone}`;

  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}
