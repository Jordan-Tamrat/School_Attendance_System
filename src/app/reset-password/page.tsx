"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--danger-text)", marginBottom: 8 }}>
          Invalid Link
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
          This password reset link is invalid or missing the security token.
        </p>
        <Link href="/forgot-password" className="btn-primary" style={{ display: "block", textDecoration: "none" }}>
          Request New Link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to reset password");
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "var(--success-light)", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <CheckCircle2 size={24} color="var(--success-text)" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Password Reset Complete
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
          Your password has been successfully updated. Redirecting to login...
        </p>
        <Link href="/login" className="btn-primary" style={{ display: "block", textDecoration: "none" }}>
          Login Now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label className="label">New Password</label>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", display: "flex"
          }}>
            <Lock size={18} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimum 8 characters"
            className="input"
            style={{ paddingLeft: 42, paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 4,
              display: "flex", alignItems: "center",
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, fontSize: 13,
          background: "var(--danger-light)", color: "var(--danger-text)",
          border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ padding: 14, fontSize: 15, marginTop: 8 }}
      >
        {loading ? "Updating Password..." : "Update Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-body)", padding: 20
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "var(--bg-surface)", padding: 40,
        borderRadius: 24, boxShadow: "var(--shadow-2xl)",
        border: "1px solid var(--border)",
      }}>
        {/* Logo Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "var(--accent)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 16px color-mix(in srgb, var(--accent) 30%, transparent)"
          }}>
            <GraduationCap size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Set New Password
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>
            Create a secure password for your account
          </p>
        </div>

        <Suspense fallback={<div style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
