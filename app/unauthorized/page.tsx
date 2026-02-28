"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-full">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          You don't have permission to access this resource.
          <br />
          Please contact your administrator if you believe this is an error.
        </p>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
