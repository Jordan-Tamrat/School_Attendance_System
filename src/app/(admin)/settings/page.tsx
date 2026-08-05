"use client";

import { useEffect, useState } from "react";
import { Calendar, Save, Settings, Trash2, User } from "lucide-react";
import { Toast, useToast } from "@/components/Toast";

interface SchoolSettings {
  schoolName: string;
  schoolCode: string;
  doorOpensTime: string;
  doorClosesTime: string;
  lateThresholdMin: number;
  academicYearStart: string;
  academicYearEnd: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SchoolSettings>({
    schoolName: "",
    schoolCode: "",
    doorOpensTime: "07:00",
    doorClosesTime: "07:30",
    lateThresholdMin: 15,
    academicYearStart: "",
    academicYearEnd: "",
  });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [myEmail, setMyEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  function loadData() {
    Promise.all([
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/settings/holidays").then(r => r.json()),
      fetch("/api/users/me").then(r => r.json())
    ]).then(([settingsData, holidaysData, userData]) => {
      setForm({
        schoolName: settingsData.schoolName,
        schoolCode: settingsData.schoolCode,
        doorOpensTime: settingsData.doorOpensTime,
        doorClosesTime: settingsData.doorClosesTime,
        lateThresholdMin: settingsData.lateThresholdMin,
        academicYearStart: settingsData.academicYearStart ? settingsData.academicYearStart.split("T")[0] : "",
        academicYearEnd: settingsData.academicYearEnd ? settingsData.academicYearEnd.split("T")[0] : "",
      });
      setHolidays(holidaysData);
      if (userData?.email) setMyEmail(userData.email);
      setFetching(false);
    });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      showToast("Settings saved successfully");
    } else {
      showToast(
        data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(", ")
          : data.error ?? "Failed to save settings",
        "error"
      );
    }
  }

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;
    
    setHolidayLoading(true);
    const res = await fetch("/api/settings/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newHolidayName, date: newHolidayDate }),
    });
    setHolidayLoading(false);
    
    if (res.ok) {
      setNewHolidayName("");
      setNewHolidayDate("");
      loadData();
      showToast("Holiday added");
    } else {
      showToast("Failed to add holiday (date might already exist)", "error");
    }
  }

  async function handleDeleteHoliday(id: string) {
    await fetch(`/api/settings/holidays/${id}`, { method: "DELETE" });
    loadData();
    showToast("Holiday deleted");
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: myEmail }),
    });
    const data = await res.json();
    setEmailLoading(false);

    if (res.ok) {
      showToast("Recovery email updated successfully");
    } else {
      showToast(data.error ?? "Failed to update email", "error");
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "32px", maxWidth: 1100, alignItems: "start" }}>
        {/* School Configuration Card */}
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
                onChange={(e) => {
                  const name = e.target.value;
                  const derived = name.split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).join("");
                  setForm({ ...form, schoolName: name, schoolCode: derived });
                }}
                required
                placeholder="e.g. Springfield High School"
                className="input"
              />
            </div>

            <div>
              <label className="label">School Code *</label>
              <input
                value={form.schoolCode}
                onChange={(e) => setForm({ ...form, schoolCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) })}
                required
                placeholder="e.g. SHS"
                className="input"
                style={{ width: "auto", minWidth: 120, fontFamily: "monospace", letterSpacing: 2 }}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Auto-derived from school name initials. Student IDs will be formatted:{" "}
                <strong style={{ fontFamily: "monospace" }}>{form.schoolCode || "CODE"}/{String(1).padStart(3,"0")}/{new Date().getFullYear() - (new Date().getMonth() >= 8 && new Date().getDate() >= 11 ? 7 : 8)}</strong>
              </p>
            </div>

            <div>
              <label className="label">Door Opens Time *</label>
              <input
                type="time"
                value={form.doorOpensTime}
                onChange={(e) => setForm({ ...form, doorOpensTime: e.target.value })}
                required
                className="input"
                style={{ width: "auto" }}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Students who scan before this time will be rejected as &quot;Too early&quot;
              </p>
            </div>

            <div>
              <label className="label">Door Closes Time *</label>
              <input
                type="time"
                value={form.doorClosesTime}
                onChange={(e) => setForm({ ...form, doorClosesTime: e.target.value })}
                required
                className="input"
                style={{ width: "auto" }}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Students who scan after this time are marked &quot;Late&quot; (or present if within threshold below)
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
                after <strong>{form.doorClosesTime}</strong> is recorded as &quot;Late&quot;
              </p>
            </div>

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

        {/* Right Column Wrapper */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Academic Calendar Settings */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--purple-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={18} color="var(--purple-text)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Academic Calendar
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                Configure the school year and closed holidays
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
            <div style={{ flex: "1 1 140px" }}>
              <label className="label">Academic Year Start</label>
              <input
                type="date"
                value={form.academicYearStart}
                onChange={(e) => setForm({ ...form, academicYearStart: e.target.value })}
                className="input"
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label className="label">Academic Year End</label>
              <input
                type="date"
                value={form.academicYearEnd}
                onChange={(e) => setForm({ ...form, academicYearEnd: e.target.value })}
                className="input"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "10px 16px" }}>
                Save Year
              </button>
            </div>
          </form>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Holidays & Closures
            </h3>
            
            <form onSubmit={handleAddHoliday} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <input
                placeholder="Holiday name (e.g. Winter Break)"
                value={newHolidayName}
                onChange={e => setNewHolidayName(e.target.value)}
                required
                className="input"
                style={{ flex: "1 1 200px" }}
              />
              <input
                type="date"
                value={newHolidayDate}
                onChange={e => setNewHolidayDate(e.target.value)}
                required
                className="input"
                style={{ flex: "1 1 140px" }}
              />
              <button type="submit" disabled={holidayLoading} className="btn-secondary" style={{ flex: "0 0 auto" }}>
                Add
              </button>
            </form>

            {holidays.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "var(--bg-surface-2)", borderRadius: 8 }}>
                No holidays added yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {holidays.map((h) => (
                  <div key={h.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 8, background: "var(--bg-surface-2)", border: "1px solid var(--border)"
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(h.date).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteHoliday(h.id)}
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: 6 }}
                      title="Delete holiday"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Account Card */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={18} color="var(--accent-text)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                My Account
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                Configure your personal recovery options
              </div>
            </div>
          </div>

          <form onSubmit={handleEmailUpdate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="label">Recovery Email Address *</label>
              <input
                type="email"
                value={myEmail}
                onChange={(e) => setMyEmail(e.target.value)}
                required
                placeholder="admin@school.edu"
                className="input"
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Used for password resets and critical system alerts.
              </p>
            </div>
            <button type="submit" disabled={emailLoading} className="btn-primary" style={{ width: "fit-content" }}>
              <Save size={15} /> {emailLoading ? "Saving..." : "Save Email"}
            </button>
          </form>
        </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
