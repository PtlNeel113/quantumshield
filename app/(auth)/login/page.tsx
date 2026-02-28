"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Loader2 } from "lucide-react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({
        email,
        password,
        mfa_token: showMfa ? mfaToken : undefined,
        remember_device: rememberDevice,
      });

      if (result.success) {
        // Redirect to dashboard
        router.push("/dashboard");
      } else if (result.mfaRequired) {
        setShowMfa(true);
        setError("Please enter your 6-digit MFA code");
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">QuantumShield</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            {!showMfa && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* MFA Token Field */}
            {showMfa && (
              <div className="space-y-2">
                <Label htmlFor="mfaToken" className="text-slate-200">
                  Two-Factor Authentication Code
                </Label>
                <Input
                  id="mfaToken"
                  type="text"
                  placeholder="000000"
                  value={mfaToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  disabled={loading}
                  maxLength={6}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                  autoFocus
                />
                <p className="text-sm text-slate-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Remember Device */}
            {!showMfa && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberDevice}
                  onCheckedChange={(checked: boolean) => setRememberDevice(checked)}
                  disabled={loading}
                  className="border-slate-600 data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  Remember this device for 30 days
                </Label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : showMfa ? (
                "Verify & Sign In"
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Back to Login (when MFA is shown) */}
            {showMfa && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowMfa(false);
                  setMfaToken("");
                  setError("");
                }}
                disabled={loading}
                className="w-full text-slate-400 hover:text-white"
              >
                Back to login
              </Button>
            )}

            {/* Forgot Password */}
            {!showMfa && (
              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Your session is encrypted and monitored for security.
              <br />
              Device fingerprinting is enabled for enhanced protection.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>© 2024 QuantumShield. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
