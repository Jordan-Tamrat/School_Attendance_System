"use client";

import { useEffect, useState } from "react";
import { Plus, X, Trash2, Users, GraduationCap, UserCheck } from "lucide-react";
import { Toast, useToast } from "@/components/Toast";

interface Teacher {
  id: string;
  fullName: string;
  role: string;
}

interface Class {
  id: string;
  grade: string;
  section: string;
  academicYear: string;
  teacher: { id: string; fullName: string } | null;
  _count: { students: number };
}

const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [form, setForm] = useState({
    grade: "",
    section: "",
    academicYear: CURRENT_YEAR,
    teacherId: "",
  });

  useEffect(() => {
    fetchClasses();
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setTeachers(data.filter((u: Teacher) => u.role === "teacher")));
  }, []);

  async function fetchClasses() {
    const res = await fetch("/api/classes");
    setClasses(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        teacherId: form.teacherId || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ grade: "", section: "", academicYear: CURRENT_YEAR, teacherId: "" });
      fetchClasses();
      showToast("Class created successfully");
    } else {
      setError(data.error ?? "Failed to create class");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      setDeleteId(null);
      fetchClasses();
      showToast("Class deleted");
    } else {
      setError(data.error ?? "Failed to delete");
    }
  }

  // Group classes by academic year
  const grouped = classes.reduce<Record<string, Class[]>>((acc, cls) => {
    if (!acc[cls.academicYear]) acc[cls.academicYear] = [];
    acc[cls.academicYear].push(cls);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">Manage grade sections and teacher assignments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> New Class
        </button>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--bg-surface)", borderRadius: 16,
            boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 440,
            border: "1px solid var(--border)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid var(--border)",
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Create New Class</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Add a grade section for the academic year</p>
              </div>
              <button onClick={() => { setShowForm(false); setError(""); }} style={{
                background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-secondary)",
                display: "flex", alignItems: "center",
              }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Grade *</label>
                  <input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    required
                    placeholder="e.g. 10"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Section *</label>
                  <input
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    required
                    placeholder="e.g. A"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Academic Year *</label>
                <input
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  required
                  placeholder="e.g. 2024-2025"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Assign Teacher (optional)</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="input"
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Each teacher can only be assigned to one class
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

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
                  {loading ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--bg-surface)", borderRadius: 16,
            boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 380,
            border: "1px solid var(--border)", padding: 28, textAlign: "center",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "var(--danger-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Trash2 size={22} color="var(--danger-text)" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
              Delete this class?
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              This action cannot be undone. Classes with active students cannot be deleted.
            </p>
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16,
                background: "var(--danger-light)", color: "var(--danger-text)",
              }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setDeleteId(null); setError(""); }} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  flex: 1, padding: "10px 18px", borderRadius: 8, fontSize: 14,
                  fontWeight: 600, cursor: "pointer", border: "none",
                  background: "var(--danger)", color: "#fff",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Classes grouped by year */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <GraduationCap size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No classes yet. Click &quot;New Class&quot; to create one.</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([year, yearClasses]) => (
            <div key={year} style={{ marginBottom: 32 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: "var(--accent-text)",
                  background: "var(--accent-light)", padding: "4px 12px",
                  borderRadius: 999, letterSpacing: "0.03em",
                }}>
                  {year}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {yearClasses.length} class{yearClasses.length !== 1 ? "es" : ""}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {yearClasses.map((cls) => (
                  <div key={cls.id} className="card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "var(--accent-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "var(--accent-text)",
                        marginBottom: 12,
                      }}>
                        {cls.grade}{cls.section}
                      </div>
                      <button
                        onClick={() => { setDeleteId(cls.id); setError(""); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--text-muted)", padding: 4, borderRadius: 6,
                          display: "flex", alignItems: "center",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger-text)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                      Grade {cls.grade} — Section {cls.section}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)" }}>
                        <Users size={13} color="var(--text-muted)" />
                        {cls._count.students} student{cls._count.students !== 1 ? "s" : ""}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)" }}>
                        <UserCheck size={13} color="var(--text-muted)" />
                        {cls.teacher ? cls.teacher.fullName : (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No teacher assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
