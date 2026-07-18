"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";

interface Exception {
  id: string;
  qrCodeData: string;
  exceptionType: string;
  scanTime: string;
  resolved: boolean;
  notes: string | null;
  scannedBy: { fullName: string } | null;
}

const typeConfig: Record<string, { label: string; bg: string; color: string }> = {
  duplicate_scan:   { label: "Duplicate Scan",   bg: "var(--warning-light)", color: "var(--warning-text)" },
  unknown_qr:       { label: "Unknown QR Code",  bg: "var(--danger-light)",  color: "var(--danger-text)" },
  inactive_student: { label: "Inactive Student", bg: "var(--bg-surface-2)",  color: "var(--text-secondary)" },
};

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchExceptions(); }, []);

  async function fetchExceptions() {
    const res = await fetch("/api/exceptions?resolved=false");
    setExceptions(await res.json());
  }

  async function resolve(id: string) {
    setLoading(true);
    await fetch("/api/exceptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes: note }),
    });
    setLoading(false);
    setResolving(null);
    setNote("");
    fetchExceptions();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scan Exceptions</h1>
        <p className="page-subtitle">Review and resolve flagged scan events that need attention</p>
      </div>

      {exceptions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "var(--success-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={28} color="var(--success-text)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>All clear!</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No unresolved scan exceptions at this time.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--warning-light)", color: "var(--warning-text)",
            border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, fontWeight: 500,
          }}>
            <AlertTriangle size={16} />
            {exceptions.length} exception{exceptions.length !== 1 ? "s" : ""} require your review
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exceptions.map((ex) => {
              const cfg = typeConfig[ex.exceptionType] ?? typeConfig.inactive_student;
              return (
                <div key={ex.id} className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 0 }}>
                      {/* Type badge */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: cfg.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <AlertTriangle size={18} color={cfg.color} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: "3px 10px",
                            borderRadius: 999, background: cfg.bg, color: cfg.color,
                          }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 13, color: "var(--text-muted)",
                          fontFamily: "monospace", marginBottom: 4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {ex.qrCodeData}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {new Date(ex.scanTime).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                          {ex.scannedBy && (
                            <span style={{ marginLeft: 8 }}>· by {ex.scannedBy.fullName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setResolving(resolving === ex.id ? null : ex.id); setNote(""); }}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", flexShrink: 0,
                        background: resolving === ex.id ? "var(--bg-surface-2)" : "var(--accent-light)",
                        color: resolving === ex.id ? "var(--text-secondary)" : "var(--accent-text)",
                        border: `1.5px solid ${resolving === ex.id ? "var(--border)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      {resolving === ex.id ? "Cancel" : "Resolve"}
                    </button>
                  </div>

                  {resolving === ex.id && (
                    <div style={{
                      marginTop: 14, paddingTop: 14,
                      borderTop: "1px solid var(--border)",
                      display: "flex", gap: 10,
                    }}>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Resolution note (optional)..."
                        className="input"
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => resolve(ex.id)}
                        disabled={loading}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: "var(--success-light)", color: "var(--success-text)",
                          border: "1.5px solid color-mix(in srgb, var(--success) 30%, transparent)",
                          cursor: "pointer", flexShrink: 0,
                        }}
                      >
                        <CheckCircle size={15} />
                        {loading ? "Saving..." : "Mark Resolved"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
