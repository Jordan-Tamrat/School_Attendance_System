"use client";

import { useState } from "react";
import { Printer, BarChart2, Search, Edit2, X, CheckCircle } from "lucide-react";
import { Toast, useToast } from "@/components/Toast";

type ReportType = "daily" | "absent" | "student";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  entryMethod: string;
  checkInTime: string;
  auditNote?: string;
  permissionNote?: string;
  student?: { firstName: string; lastName: string; studentNumber: string };
  recordedBy?: { fullName: string };
}

interface AbsentStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  class: { grade: string; section: string };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  class: { grade: string; section: string };
}

const statusColors: Record<string, { bg: string; color: string }> = {
  present:    { bg: "var(--success-light)",  color: "var(--success-text)" },
  late:       { bg: "var(--warning-light)",  color: "var(--warning-text)" },
  absent:     { bg: "var(--danger-light)",   color: "var(--danger-text)" },
  permission: { bg: "var(--purple-light)",   color: "var(--purple-text)" },
};

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();

  async function searchStudents() {
    if (!studentSearch.trim()) return;
    const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}`);
    setStudentResults(await res.json());
  }

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams({ type });
    if (type === "daily" || type === "absent") params.set("date", date);
    if (type === "student" && selectedStudent) params.set("studentId", selectedStudent.id);
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    if (type === "absent") {
      setAbsentStudents(Array.isArray(data) ? data : []);
      setRecords([]);
    } else {
      setRecords(Array.isArray(data) ? data : []);
      setAbsentStudents([]);
    }
    setLoading(false);
    setGenerated(true);
  }

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    setEditLoading(true);
    await fetch(`/api/attendance/${editRecord.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus, permissionNote: editNote }),
    });
    setEditLoading(false);
    setEditRecord(null);
    fetchReport();
    showToast("Attendance record updated");
  }

  const typeLabels: Record<ReportType, string> = {
    daily: "Daily Attendance",
    absent: "Absent Students",
    student: "Student History",
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle no-print">Generate and export attendance reports</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary no-print">
          <Printer size={15} /> Print Report
        </button>
      </div>

      {/* Global Print Styles */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body { margin: 1.6cm; }
        }
      `}</style>

      {/* Filter bar */}
      <div className="card no-print" style={{ padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <div>
            <label className="label">Report Type</label>
              <div className="flex gap-2 w-full md:w-auto">
                {(["daily", "absent", "student"] as ReportType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setType(t); setGenerated(false); setRecords([]); setAbsentStudents([]); }}
                    style={{
                      borderRadius: 8, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.15s",
                      background: type === t ? "var(--accent)" : "var(--bg-surface-2)",
                      color: type === t ? "#fff" : "var(--text-secondary)",
                      border: `1.5px solid ${type === t ? "var(--accent)" : "var(--border)"}`,
                    }}
                    className="flex-1 md:flex-none text-[11px] md:text-[13px] px-2 py-2 md:px-3.5 md:py-2 text-center"
                  >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {(type === "daily" || type === "absent") && (
            <div>
              <label className="label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" style={{ width: "auto" }} />
            </div>
          )}

          {type === "student" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label">Search Student</label>
              {selectedStudent ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--accent-light)", border: "1.5px solid var(--accent)",
                  borderRadius: 8, padding: "8px 12px",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-text)" }}>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                    <span style={{ fontWeight: 400, marginLeft: 6, color: "var(--text-muted)" }}>
                      #{selectedStudent.studentNumber}
                    </span>
                  </span>
                  <button
                    onClick={() => { setSelectedStudent(null); setStudentResults([]); setStudentSearch(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                      placeholder="Name or student number..."
                      className="input"
                      style={{ width: 240 }}
                    />
                    <button onClick={searchStudents} className="btn-secondary" style={{ padding: "10px 14px" }}>
                      <Search size={15} />
                    </button>
                  </div>
                  {studentResults.length > 0 && (
                    <div style={{
                      background: "var(--bg-surface)", border: "1px solid var(--border)",
                      borderRadius: 8, overflow: "hidden", boxShadow: "var(--shadow-md)",
                    }}>
                      {studentResults.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedStudent(s); setStudentResults([]); }}
                          style={{
                            width: "100%", textAlign: "left", padding: "10px 14px",
                            background: "none", border: "none", cursor: "pointer",
                            borderBottom: "1px solid var(--border)", fontSize: 13,
                            color: "var(--text-primary)",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                          <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                            #{s.studentNumber} · Grade {s.class.grade}-{s.class.section}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={fetchReport}
            disabled={loading || (type === "student" && !selectedStudent)}
            className="btn-primary"
          >
            <Search size={15} /> {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Empty states */}
      {!generated && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <BarChart2 size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Select a report type and click Generate</p>
        </div>
      )}
      {generated && records.length === 0 && absentStudents.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <p style={{ fontSize: 14 }}>No records found for the selected criteria.</p>
        </div>
      )}

      {/* Absent Students table */}
      {type === "absent" && absentStudents.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              {absentStudents.length} student{absentStudents.length !== 1 ? "s" : ""} absent
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student No.</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {absentStudents.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                    <td style={{ color: "var(--text-secondary)" }}>#{s.studentNumber}</td>
                    <td style={{ color: "var(--text-secondary)" }}>Grade {s.class.grade}-{s.class.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Results table */}
      {records.length > 0 && (
        <>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              {records.length} record{records.length !== 1 ? "s" : ""} found
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {type !== "student" && <th>Student</th>}
                  <th>Date</th>
                  <th>Status</th>
                  <th>Method</th>
                  {type === "student" && <th>Note</th>}
                  <th className="no-print">Update</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const sc = statusColors[r.status];
                  const isEditable = new Date(r.date).toLocaleDateString("en-CA", { timeZone: "UTC" }) === new Date().toLocaleDateString("en-CA");
                  return (
                    <tr key={r.id}>
                      {type !== "student" && (
                        <td style={{ fontWeight: 500 }}>
                          {r.student ? `${r.student.firstName} ${r.student.lastName}` : "—"}
                          {r.student && (
                            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
                              #{r.student.studentNumber}
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ color: "var(--text-secondary)" }}>
                        {new Date(r.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "3px 10px", borderRadius: 999,
                          fontSize: 12, fontWeight: 600,
                          background: sc?.bg ?? "var(--bg-surface-2)",
                          color: sc?.color ?? "var(--text-secondary)",
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{r.entryMethod}</td>
                      {type === "student" && (
                        <td style={{ color: "var(--text-muted)", fontSize: 12, maxWidth: 180 }}>
                          {r.auditNote ?? r.permissionNote ?? "—"}
                        </td>
                      )}
                      <td className="no-print">
                        <div title={!isEditable ? "Cannot edit past records" : ""} style={{ display: "inline-block" }}>
                          <button
                            onClick={() => { setEditRecord(r); setEditStatus(r.status); setEditNote(r.permissionNote ?? ""); }}
                            disabled={!isEditable}
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                              borderRadius: 6, fontWeight: 500,
                              color: "var(--text-secondary)", cursor: isEditable ? "pointer" : "not-allowed",
                              opacity: isEditable ? 1 : 0.5,
                            }}
                            className="px-2 py-1.5 md:px-2.5 md:py-1.5 text-[11px] md:text-xs justify-center md:justify-start"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit status modal */}
      {editRecord && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--bg-surface)", borderRadius: 16,
            boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 420,
            border: "1px solid var(--border)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid var(--border)",
            }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Update Attendance Status</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {editRecord.student
                    ? `${editRecord.student.firstName} ${editRecord.student.lastName}`
                    : "Student"} ·{" "}
                  {new Date(editRecord.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })}
                </p>
              </div>
              <button onClick={() => setEditRecord(null)} style={{
                background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-secondary)",
                display: "flex", alignItems: "center",
              }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleStatusUpdate} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">New Status</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(statusColors).map(([s, { bg, color }]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditStatus(s)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                        background: editStatus === s ? bg : "var(--bg-surface-2)",
                        color: editStatus === s ? color : "var(--text-secondary)",
                        border: `1.5px solid ${editStatus === s ? color : "var(--border)"}`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {(editStatus === "permission") && (
                <div>
                  <label className="label">
                    Permission Note <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    required
                    rows={2}
                    placeholder="Reason for permission..."
                    className="input"
                    style={{ resize: "none" }}
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setEditRecord(null)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className="btn-primary" style={{ flex: 2 }}>
                  {editLoading ? "Saving..." : <><CheckCircle size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
