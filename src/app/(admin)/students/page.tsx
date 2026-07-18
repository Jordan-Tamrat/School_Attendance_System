"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, FileDown, X, Users, Camera, Loader2 } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  qrCodeImage: string;
  photoUrl: string | null;
  parentPhone: string;
  class: { grade: string; section: string };
}

interface Class {
  id: string;
  grade: string;
  section: string;
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
  }, []);

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);

    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingPhoto(false);

    if (res.ok) {
      setPhotoUrl(data.url);
    } else {
      setError(data.error ?? "Photo upload failed");
      setPhotoPreview(null);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(form), photoUrl: photoUrl ?? undefined };

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setShowForm(false);
      setPhotoPreview(null);
      setPhotoUrl(null);
      fetchStudents();
    } else {
      setError(
        data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(", ")
          : data.error ?? "Failed to register student"
      );
    }
  }

  async function downloadIDCard(student: Student) {
    setDownloadingId(student.id);
    const res = await fetch(`/api/students/${student.id}/id-card`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `id-card-${student.studentNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloadingId(null);
  }

  function closeForm() {
    setShowForm(false);
    setError("");
    setPhotoPreview(null);
    setPhotoUrl(null);
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student registrations and ID cards</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <UserPlus size={16} /> Register Student
        </button>
      </div>

      {/* Registration Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--bg-surface)", borderRadius: 16,
            boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 520,
            maxHeight: "92vh", overflow: "hidden",
            display: "flex", flexDirection: "column",
            border: "1px solid var(--border)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Register New Student</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>A unique QR code will be generated automatically</p>
              </div>
              <button onClick={closeForm} style={{
                background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-secondary)",
                display: "flex", alignItems: "center",
              }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegister} style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Photo upload */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                    background: photoPreview ? "transparent" : "var(--bg-surface-2)",
                    border: `2px dashed ${photoPreview ? "var(--accent)" : "var(--border-strong)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", overflow: "hidden", position: "relative",
                    transition: "border-color 0.15s",
                  }}
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Camera size={22} color="var(--text-muted)" />
                  )}
                  {uploadingPhoto && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Loader2 size={20} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                    Student Photo
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                    JPG, PNG or WEBP · Max 2MB · Optional
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">First Name *</label>
                  <input name="firstName" required className="input" placeholder="Ahmed" />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input name="lastName" required className="input" placeholder="Hassan" />
                </div>
              </div>

              <div>
                <label className="label">Student Number *</label>
                <input name="studentNumber" required className="input" placeholder="e.g. 2024-001" />
              </div>

              <div>
                <label className="label">Class *</label>
                <select name="classId" required className="input">
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>Grade {c.grade} — Section {c.section}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="label">Date of Birth</label>
                  <input name="dateOfBirth" type="date" className="input" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select name="gender" className="input">
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Parent Phone</label>
                <input name="parentPhone" type="tel" className="input" placeholder="+1 234 567 8900" />
              </div>

              <div>
                <label className="label">Parent Email</label>
                <input name="parentEmail" type="email" className="input" placeholder="parent@email.com" />
              </div>

              <div>
                <label className="label">Address</label>
                <input name="address" className="input" placeholder="Street, City" />
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

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={closeForm} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading || uploadingPhoto} className="btn-primary" style={{ flex: 2 }}>
                  {loading ? "Registering..." : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students table */}
      {students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No students registered yet. Click &quot;Register Student&quot; to get started.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student #</th>
                <th>Class</th>
                <th>Parent Phone</th>
                <th>ID Card</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {s.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photoUrl}
                          alt={s.firstName}
                          style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: "var(--accent-light)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: "var(--accent-text)", flexShrink: 0,
                        }}>
                          {getInitials(s.firstName, s.lastName)}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: 13 }}>
                    #{s.studentNumber}
                  </td>
                  <td>
                    <span style={{
                      background: "var(--accent-light)", color: "var(--accent-text)",
                      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>
                      Grade {s.class.grade}-{s.class.section}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{s.parentPhone ?? "—"}</td>
                  <td>
                    <button
                      onClick={() => downloadIDCard(s)}
                      disabled={downloadingId === s.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                        borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                        color: "var(--text-secondary)", cursor: "pointer",
                        opacity: downloadingId === s.id ? 0.6 : 1,
                      }}
                    >
                      {downloadingId === s.id
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : <FileDown size={13} />}
                      {downloadingId === s.id ? "..." : "Download PDF"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
