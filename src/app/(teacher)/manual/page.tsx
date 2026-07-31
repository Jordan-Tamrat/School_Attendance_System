"use client";

import { useState, useEffect } from "react";
import { Search, User, X } from "lucide-react";
import { Toast, useToast } from "@/components/Toast";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  class: { grade: string; section: string };
}

interface Class {
  id: string;
  grade: string;
  section: string;
}

const statusOptions = [
  { value: "present",    label: "Present",    color: "var(--success-text)",  bg: "var(--success-light)" },
  { value: "late",       label: "Late",       color: "var(--warning-text)",  bg: "var(--warning-light)" },
  { value: "absent",     label: "Absent",     color: "var(--danger-text)",   bg: "var(--danger-light)" },
  { value: "permission", label: "Permission", color: "var(--purple-text)",   bg: "var(--purple-light)" },
];

export default function ManualEntryPage() {
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [status, setStatus] = useState("present");
  const [auditNote, setAuditNote] = useState("");
  const [permissionNote, setPermissionNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast, show: showToast, hide: hideToast } = useToast();



  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
  }, []);

  async function searchStudents() {
    if (!search.trim() && !selectedClassId) {
      setStudents([]);
      return;
    }
    
    let url = "/api/students?";
    if (search.trim()) url += `search=${encodeURIComponent(search)}&`;
    if (selectedClassId) url += `classId=${selectedClassId}`;
    
    const res = await fetch(url);
    setStudents(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true); setError("");
    const res = await fetch("/api/attendance/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selected.id, status, auditNote, permissionNote }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      showToast(`${selected.firstName} ${selected.lastName} marked as ${status}`);
      setSelected(null); setAuditNote(""); setPermissionNote(""); setSearch(""); setStudents([]);
    } else {
      setError(data.error?.fieldErrors?.auditNote?.[0] ?? data.error ?? "Failed");
    }
  }

  const selectedStatus = statusOptions.find((s) => s.value === status);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manual Entry</h1>
        <p className="page-subtitle">Search a student by name or ID, then record their attendance</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Left — search */}
        <div>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
              Find Student
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="input"
              >
                <option value="">All Classes (School-wide)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Grade {cls.grade} — Section {cls.section}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                  placeholder="Name or student number..."
                  className="input"
                  style={{ flex: 1 }}
                />
                <button onClick={searchStudents} className="btn-primary" style={{ padding: "10px 16px" }}>
                  <Search size={16} />
                </button>
              </div>
            </div>

            {students.length > 0 && !selected && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                      background: "var(--bg-surface-2)",
                      border: "1.5px solid var(--border)",
                      textAlign: "left", transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                      (e.currentTarget as HTMLElement).style.background = "var(--accent-light)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-2)";
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: "var(--accent-light)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <User size={16} color="var(--accent-text)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {s.firstName} {s.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        #{s.studentNumber} · Grade {s.class.grade}-{s.class.section}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {students.length === 0 && (search || selectedClassId) && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                No students found matching your criteria.
              </p>
            )}
          </div>
        </div>

        {/* Right — form */}
        <div>
          {!selected ? (
            <div className="card" style={{
              padding: 40, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "var(--bg-surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User size={24} color="var(--text-muted)" />
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Search and select a student to record attendance
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 24 }}>
              {/* Selected student header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 10,
                background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                marginBottom: 20,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <User size={18} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    {selected.firstName} {selected.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    #{selected.studentNumber} · Grade {selected.class.grade}-{selected.class.section}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 4, borderRadius: 6,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Status selector */}
                <div>
                  <label className="label">Attendance Status</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        style={{
                          padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.15s",
                          background: status === opt.value ? opt.bg : "var(--bg-surface-2)",
                          color: status === opt.value ? opt.color : "var(--text-secondary)",
                          border: `1.5px solid ${status === opt.value ? opt.color : "var(--border)"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">
                    Audit Note <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <textarea
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                    required
                    rows={3}
                    placeholder="Reason for manual entry (e.g. student forgot ID at home)..."
                    className="input"
                    style={{ resize: "none", lineHeight: 1.6 }}
                  />
                </div>

                {(status === "permission") && (
                  <div>
                    <label className="label">
                      Permission Note <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <textarea
                      value={permissionNote}
                      onChange={(e) => setPermissionNote(e.target.value)}
                      required
                      rows={2}
                      placeholder="Details about the permission..."
                      className="input"
                      style={{ resize: "none", lineHeight: 1.6 }}
                    />
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8, fontSize: 13,
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
                  style={{ width: "100%", padding: "12px" }}
                >
                  {loading ? "Saving..." : `Mark as ${selectedStatus?.label}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
