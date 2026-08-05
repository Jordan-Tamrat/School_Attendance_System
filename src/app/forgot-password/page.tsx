"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, User, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    setLoading(false);

    if (res.ok) {
      try {
        const data = await res.json();
        setMaskedEmail(data.maskedEmail);
        setSuccess(true);
      } catch (err) {
        setSuccess(true); // fallback if JSON fails but ok is true
      }
    } else {
      try {
        const data = await res.json();
        setError(data.error || "Failed to send reset email");
      } catch (err) {
        setError("Failed to send reset email (Server Error)");
      }
    }
  }

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
            Forgot Password
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--success-light)", margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <CheckCircle2 size={24} color="var(--success-text)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
              We have sent a password reset link to <strong>{maskedEmail || "your registered email address"}</strong>.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: "block", textDecoration: "none" }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="label">Username</label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", display: "flex"
                }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. johndoe"
                  className="input"
                  style={{ paddingLeft: 42 }}
                />
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
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
                  textDecoration: "none", transition: "color 0.15s"
                }}
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
