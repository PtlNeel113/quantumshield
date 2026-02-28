"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Zap, Eye, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">QuantumShield</span>
          </div>
          <Button
            onClick={() => router.push("/login")}
            variant="ghost"
            className="text-slate-300 hover:text-white"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">
              Harvest Now Decrypt Later Protection
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Protect Your Data from
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Quantum Threats
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Enterprise cyber risk intelligence platform for quantum-safe cryptography.
            Scan, analyze, and migrate before it's too late.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800 px-8 py-6 text-lg"
            >
              <Eye className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-sm text-slate-500 pt-4">
            Trusted by Fortune 500 companies • SOC 2 Certified • GDPR Compliant
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: Shield,
              title: "Quantum Risk Assessment",
              description: "Real-time analysis of cryptographic vulnerabilities across your infrastructure",
              color: "blue",
            },
            {
              icon: Lock,
              title: "HNDL Detection",
              description: "Identify systems at risk from harvest now, decrypt later attacks",
              color: "purple",
            },
            {
              icon: Zap,
              title: "Migration Planning",
              description: "Automated roadmap for post-quantum cryptography adoption",
              color: "emerald",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
            >
              <div className={`p-3 bg-${feature.color}-500/10 rounded-lg w-fit mb-4`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-slate-800 rounded-2xl p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "42,847", label: "Assets Monitored" },
              { value: "3,247", label: "Quantum Vulnerable" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "24/7", label: "Security Support" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why QuantumShield?
          </h2>
          <div className="space-y-4">
            {[
              "Continuous infrastructure scanning and crypto discovery",
              "AI-powered quantum threat timeline modeling",
              "Automated risk scoring and prioritization",
              "Compliance-ready audit trails and reporting",
              "Integration with existing security tools",
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-slate-900/30 border border-slate-800 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Secure Your Future?
          </h2>
          <p className="text-blue-100 mb-8">
            Start protecting your organization from quantum threats today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-6 text-lg"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          <p>© 2024 QuantumShield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
