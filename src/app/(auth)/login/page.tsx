"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid username or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Left panel — branding */}
      <div
        style={{
          background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)",
        }}
        className="w-full lg:w-[420px] shrink-0 flex flex-col justify-center relative overflow-hidden py-10 px-6 lg:py-[60px] lg:px-[48px]"
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(255,255,255,0.12)",
            marginBottom: 32,
          }}>
            <GraduationCap size={32} color="#fff" />
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 800, color: "#fff",
            lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.5px",
          }}>
            EduAttend
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 48 }}>
            Smart attendance tracking for modern schools. QR-based, real-time, and built for reliability.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "⚡", text: "Instant QR scan check-in" },
              { icon: "📊", text: "Real-time reports & analytics" },
              { icon: "🔒", text: "Role-based secure access" },
              { icon: "📶", text: "Works offline, syncs automatically" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700,
              color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.3px",
            }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Sign in to your staff account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="label">Username</label>
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="input"
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <span 
                  onClick={(e) => { e.preventDefault(); window.location.href = '/forgot-password'; }}
                  style={{ fontSize: 13, color: "var(--accent-text)", fontWeight: 600, cursor: "pointer" }}
                >
                  Forgot password?
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="input"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--danger-light)", color: "var(--danger-text)",
                border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                borderRadius: 8, padding: "10px 14px", fontSize: 13,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "12px 18px", fontSize: 15, marginTop: 4 }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p style={{
            marginTop: 32, fontSize: 12, color: "var(--text-muted)",
            textAlign: "center", lineHeight: 1.6,
          }}>
            This system is for authorized school staff only.<br />
            Contact your administrator if you need access.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
