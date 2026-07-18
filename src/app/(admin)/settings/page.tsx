"use client";

import { useEffect, useState } from "react";
import { Save, Settings, CheckCircle } from "lucide-react";

interface SchoolSettings {
  schoolName: string;
  schoolStartTime: string;
  lateThresholdMin: number;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SchoolSettings>({
    schoolName: "",
    schoolStartTime: "07:30",
    lateThresholdMin: 15,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          schoolName: data.schoolName,
          schoolStartTime: data.schoolStartTime,
          lateThresholdMin: data.lateThresholdMin,
        });
        setFetching(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(
        data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(", ")
          : data.error ?? "Failed to save settings"
      );
    }
  }

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure school-wide attendance rules</p>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Settings size={18} color="var(--accent-text)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                School Configuration
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                These settings affect how attendance is recorded system-wide
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="label">School Name *</label>
              <input
                value={form.schoolName}
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                required
                placeholder="e.g. Springfield High School"
                className="input"
              />
            </div>

            <div>
              <label className="label">School Start Time *</label>
              <input
                type="time"
                value={form.schoolStartTime}
                onChange={(e) => setForm({ ...form, schoolStartTime: e.target.value })}
                required
                className="input"
                style={{ width: "auto" }}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Students who scan after this time + the threshold below are marked &quot;Late&quot;
              </p>
            </div>

            <div>
              <label className="label">Late Threshold (minutes) *</label>
              <input
                type="number"
                min={1}
                max={120}
                value={form.lateThresholdMin}
                onChange={(e) =>
                  setForm({ ...form, lateThresholdMin: parseInt(e.target.value) || 1 })
                }
                required
                className="input"
                style={{ width: "auto" }}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                A scan arriving more than{" "}
                <strong>{form.lateThresholdMin} minute{form.lateThresholdMin !== 1 ? "s" : ""}</strong>{" "}
                after <strong>{form.schoolStartTime}</strong> is recorded as &quot;Late&quot;
              </p>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, fontSize: 13,
                background: "var(--danger-light)", color: "var(--danger-text)",
                border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 8, fontSize: 13,
                background: "var(--success-light)", color: "var(--success-text)",
                border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
              }}>
                <CheckCircle size={15} /> Settings saved successfully
              </div>
            )}

            <div style={{ paddingTop: 4 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ minWidth: 140 }}
              >
                <Save size={15} />
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
