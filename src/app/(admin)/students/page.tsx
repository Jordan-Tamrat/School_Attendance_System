"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, FileDown, X, Users, Camera, Loader2, AlertCircle, Pencil, QrCode, CheckCircle } from "lucide-react";
import { Toast, useToast } from "@/components/Toast";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  qrCodeImage: string;
  photoUrl: string | null;
  parentPhone: string;
  parentEmail: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  isActive: boolean;
  qrExpiresAt: string;
  class: { id: string; grade: string; section: string };
}

interface Class {
  id: string;
  grade: string;
  section: string;
}

interface StudentForm {
  firstName: string;
  lastName: string;
  classId: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  parentEmail: string;
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function StudentFormFields({
  form, setForm, classes, phone, setPhone, phoneError, setPhoneError,
  emailError, setEmailError, photoPreview, photoUrl, uploadingPhoto,
  photoError, fileInputRef, handlePhotoChange, isEdit,
}: {
  form: StudentForm;
  setForm: (f: StudentForm) => void;
  classes: Class[];
  phone: string;
  setPhone: (v: string) => void;
  phoneError: string;
  setPhoneError: (v: string) => void;
  emailError: string;
  setEmailError: (v: string) => void;
  photoPreview: string | null;
  photoUrl: string | null;
  uploadingPhoto: boolean;
  photoError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEdit: boolean;
}) {
  return (
    <>
      {/* Photo */}
      <div>
        <label className="label">
          Student Photo <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 80, height: 80, borderRadius: 14, flexShrink: 0,
              background: photoPreview ? "transparent" : "var(--bg-surface-2)",
              border: `2px dashed ${photoError ? "var(--danger)" : photoPreview ? "var(--accent)" : "var(--border-strong)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", position: "relative",
            }}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Camera size={24} color={photoError ? "var(--danger)" : "var(--text-muted)"} />
            )}
            {uploadingPhoto && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={20} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
          </div>
          <div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px", marginBottom: 6 }}>
              {photoPreview ? "Change Photo" : "Upload Photo"}
            </button>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>JPG, PNG or WEBP · Max 5MB</div>
            {photoError && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "var(--danger-text)" }}>
                <AlertCircle size={12} /> {photoError}
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} style={{ display: "none" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">First Name *</label>
          <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="input" placeholder="Ahmed" />
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="input" placeholder="Hassan" />
        </div>
      </div>

      <div>
        <label className="label">Class *</label>
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required className="input">
          <option value="">Select class...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>Grade {c.grade} — Section {c.section}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Date of Birth</label>
          <input value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} type="date" className="input" />
        </div>
        <div>
          <label className="label">Gender</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Parent Phone <span style={{ color: "var(--danger)" }}>*</span></label>
        <input
          value={phone}
          onChange={(e) => {
            const val = e.target.value;
            if (!val.startsWith("+251")) return;
            const suffix = val.slice(4).replace(/\D/g, "").slice(0, 9);
            setPhone("+251" + suffix);
            setPhoneError("");
          }}
          onBlur={() => {
            if (!/^\+251[0-9]{9}$/.test(phone)) setPhoneError("Must be +251 followed by 9 digits");
          }}
          className="input"
          placeholder="+251912345678"
          style={{ borderColor: phoneError ? "var(--danger)" : undefined }}
        />
        {phoneError ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "var(--danger-text)" }}>
            <AlertCircle size={12} /> {phoneError}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Ethiopian format: +251 followed by 9 digits</div>
        )}
      </div>

      <div>
        <label className="label">Parent Email</label>
        <input
          value={form.parentEmail}
          onChange={(e) => { setForm({ ...form, parentEmail: e.target.value }); setEmailError(""); }}
          onBlur={(e) => {
            if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) setEmailError("Invalid email address");
          }}
          type="email"
          className="input"
          placeholder="parent@email.com"
          style={{ borderColor: emailError ? "var(--danger)" : undefined }}
        />
        {emailError && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "var(--danger-text)" }}>
            <AlertCircle size={12} /> {emailError}
          </div>
        )}
      </div>

      <div>
        <label className="label">Address</label>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" placeholder="Street, City" />
      </div>
    </>
  );
}

const emptyForm: StudentForm = { firstName: "", lastName: "", classId: "", dateOfBirth: "", gender: "", address: "", parentEmail: "" };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [idPreview, setIdPreview] = useState("");
  
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  // Register state
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState<StudentForm>(emptyForm);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Edit state
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<StudentForm>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Manage ID state
  const [manageStudent, setManageStudent] = useState<Student | null>(null);
  const [revokeReason, setRevokeReason] = useState("lost");
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState("");

  // Shared photo state (reset per modal)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [phone, setPhone] = useState("+251");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast, show: showToast, hide: hideToast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
    fetch("/api/settings").then((r) => r.json()).then((s) => {
      const code = s.schoolCode || "SCH";
      const now = new Date();
      const ethYear = now.getFullYear() - (now.getMonth() >= 8 && now.getDate() >= 11 ? 7 : 8);
      setIdPreview(`${code}/001/${ethYear}`);
    });
  }, []);

  async function fetchStudents() {
    let url = "/api/students?";
    if (search.trim()) url += `search=${encodeURIComponent(search)}&`;
    if (selectedClassId) url += `classId=${selectedClassId}`;
    
    const res = await fetch(url);
    setStudents(await res.json());
  }

  // Refetch when class filter changes
  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (file.size > 5 * 1024 * 1024) { setPhotoError("Photo must be under 5MB"); return; }
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingPhoto(false);
    if (res.ok) { setPhotoUrl(data.url); }
    else { setPhotoError(data.error ?? "Upload failed"); setPhotoPreview(null); }
  }

  function resetPhotoState(existingUrl?: string | null) {
    setPhotoPreview(existingUrl ?? null);
    setPhotoUrl(existingUrl ?? null);
    setPhotoError("");
    setUploadingPhoto(false);
  }

  function openRegister() {
    setRegisterForm(emptyForm);
    setRegisterError("");
    setPhone("+251");
    setPhoneError("");
    setEmailError("");
    resetPhotoState(null);
    setShowRegister(true);
  }

  function openEdit(s: Student) {
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      classId: s.class.id,
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
      gender: s.gender ?? "",
      address: s.address ?? "",
      parentEmail: s.parentEmail ?? "",
    });
    setPhone(s.parentPhone ?? "+251");
    setPhoneError("");
    setEmailError("");
    setEditError("");
    resetPhotoState(s.photoUrl);
    setEditStudent(s);
  }

  function validateBeforeSubmit(): boolean {
    if (!photoUrl) { setPhotoError("Student photo is required"); return false; }
    if (!/^\+251[0-9]{9}$/.test(phone)) { setPhoneError("Must be +251 followed by 9 digits"); return false; }
    return true;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError("");
    if (!validateBeforeSubmit()) return;
    setRegisterLoading(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...registerForm, parentPhone: phone, photoUrl }),
    });
    const data = await res.json();
    setRegisterLoading(false);
    if (res.ok) { setShowRegister(false); fetchStudents(); showToast("Student registered successfully"); }
    else {
      setRegisterError(
        data.error?.fieldErrors ? Object.values(data.error.fieldErrors).flat().join(", ") : data.error ?? "Failed"
      );
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    if (!validateBeforeSubmit()) return;
    setEditLoading(true);
    const res = await fetch(`/api/students/${editStudent!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, parentPhone: phone, photoUrl }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (res.ok) { setEditStudent(null); fetchStudents(); showToast("Student updated successfully"); }
    else {
      setEditError(
        data.error?.fieldErrors ? Object.values(data.error.fieldErrors).flat().join(", ") : data.error ?? "Failed"
      );
    }
  }

  async function handleRevoke() {
    setManageError("");
    setManageLoading(true);
    const res = await fetch(`/api/students/${manageStudent!.id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: revokeReason }),
    });
    const data = await res.json();
    setManageLoading(false);
    if (res.ok) {
      setManageStudent(data);
      fetchStudents();
      showToast("ID Card revoked successfully");
    } else {
      setManageError(data.error ?? "Failed to revoke");
    }
  }

  async function handleRegenerate() {
    setManageError("");
    setManageLoading(true);
    const res = await fetch(`/api/students/${manageStudent!.id}/regenerate`, {
      method: "POST",
    });
    const data = await res.json();
    setManageLoading(false);
    if (res.ok) {
      setManageStudent(data);
      fetchStudents();
      showToast("Replacement ID Card generated");
    } else {
      setManageError(data.error ?? "Failed to regenerate");
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
      showToast(`ID card downloaded for ${student.firstName} ${student.lastName}`);
    } else {
      showToast("Failed to download ID card", "error");
    }
    setDownloadingId(null);
  }

  const sharedFieldProps = {
    classes, phone, setPhone, phoneError, setPhoneError,
    emailError, setEmailError, photoPreview, photoUrl,
    uploadingPhoto, photoError, fileInputRef, handlePhotoChange,
  };

  const modalContent = (
    title: string,
    subtitle: string,
    form: StudentForm,
    setForm: (f: StudentForm) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
    loading: boolean,
    error: string,
    onClose: () => void,
    isEdit: boolean
  ) => (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50, padding: 16, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "var(--bg-surface)", borderRadius: 16,
        boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 520,
        maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
        border: "1px solid var(--border)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>
          </div>
          <button onClick={onClose} style={{
            background: "var(--bg-surface-2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-secondary)", display: "flex",
          }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {!isEdit && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              borderRadius: 8, padding: "10px 14px",
            }}>
              <span style={{ fontSize: 12, color: "var(--accent-text)" }}>
                Student ID will be auto-generated:{" "}
                <strong style={{ fontFamily: "monospace" }}>{idPreview}</strong>
              </span>
            </div>
          )}

          {isEdit && editStudent && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--bg-surface-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "10px 14px",
            }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Student ID: <strong style={{ fontFamily: "monospace" }}>{editStudent.studentNumber}</strong>
                <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>(cannot be changed)</span>
              </span>
            </div>
          )}

          <StudentFormFields
            form={form} setForm={setForm}
            isEdit={isEdit}
            {...sharedFieldProps}
          />

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
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading || uploadingPhoto} className="btn-primary" style={{ flex: 2 }}>
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student registrations and ID cards</p>
        </div>
        <button onClick={openRegister} className="btn-primary">
          <UserPlus size={16} /> Register Student
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="input"
          style={{ width: "250px", flexShrink: 0 }}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>Grade {c.grade} — Section {c.section}</option>
          ))}
        </select>
        <div style={{ display: "flex", flex: 1, gap: 8, minWidth: "300px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchStudents()}
            placeholder="Search by name or ID number..."
            className="input"
            style={{ flex: 1 }}
          />
          <button onClick={fetchStudents} className="btn-secondary" style={{ padding: "0 16px" }}>
            Search
          </button>
        </div>
      </div>

      {showRegister && modalContent(
        "Register New Student",
        `Student ID will be auto-generated (${idPreview})`,
        registerForm, setRegisterForm,
        handleRegister, "Register Student",
        registerLoading, registerError,
        () => setShowRegister(false),
        false
      )}

      {editStudent && modalContent(
        "Edit Student",
        `Editing ${editStudent.firstName} ${editStudent.lastName}`,
        editForm, setEditForm,
        handleEdit, "Save Changes",
        editLoading, editError,
        () => setEditStudent(null),
        true
      )}

      {manageStudent && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--bg-surface)", borderRadius: 16,
            boxShadow: "var(--shadow-xl)", width: "100%", maxWidth: 440,
            overflow: "hidden", display: "flex", flexDirection: "column",
            border: "1px solid var(--border)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Manage ID Card</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{manageStudent.firstName} {manageStudent.lastName}</p>
              </div>
              <button onClick={() => setManageStudent(null)} style={{
                background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-secondary)", display: "flex",
              }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {new Date(manageStudent.qrExpiresAt) < new Date() ? (
                <>
                  <div style={{
                    padding: "12px 16px", borderRadius: 8, fontSize: 13,
                    background: "var(--danger-light)", color: "var(--danger-text)",
                    border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                  }}>
                    <AlertCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
                    This student's ID Card is currently expired.
                  </div>
                  {manageStudent.isActive && (
                    <button onClick={handleRegenerate} disabled={manageLoading} className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                      {manageLoading ? "Generating..." : "Generate Replacement Card"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div style={{
                    padding: "12px 16px", borderRadius: 8, fontSize: 13,
                    background: "var(--success-light)", color: "var(--success-text)",
                    border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                  }}>
                    <CheckCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
                    This student's ID Card is active.
                  </div>
                  
                  <div>
                    <label className="label">Revocation Reason</label>
                    <select value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} className="input">
                      <option value="lost">Card Lost / Stolen</option>
                      <option value="left">Student Left School</option>
                    </select>
                  </div>

                  <button onClick={handleRevoke} disabled={manageLoading} style={{
                    width: "100%", padding: "12px", borderRadius: 8,
                    background: "var(--danger)", color: "#fff", border: "none",
                    fontWeight: 600, cursor: "pointer", opacity: manageLoading ? 0.7 : 1
                  }}>
                    {manageLoading ? "Revoking..." : "Revoke ID Card"}
                  </button>
                </>
              )}
              
              {manageError && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, fontSize: 13,
                  background: "var(--danger-light)", color: "var(--danger-text)",
                  border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                }}>
                  {manageError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No students registered yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Class</th>
                <th>Parent Phone</th>
                <th>Manage ID</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {s.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photoUrl} alt={s.firstName} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: "var(--accent-light)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: "var(--accent-text)", flexShrink: 0,
                        }}>
                          {getInitials(s.firstName, s.lastName)}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontFamily: "monospace", fontSize: 13 }}>{s.studentNumber}</td>
                  <td>
                    <span style={{ background: "var(--accent-light)", color: "var(--accent-text)", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      Grade {s.class.grade}-{s.class.section}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{s.parentPhone ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        onClick={() => downloadIDCard(s)}
                        disabled={downloadingId === s.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                          borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600,
                          color: "var(--text-secondary)", cursor: "pointer",
                          opacity: downloadingId === s.id ? 0.6 : 1,
                        }}
                      >
                        {downloadingId === s.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <FileDown size={13} />}
                        {downloadingId === s.id ? "..." : "PDF"}
                      </button>
                      <button
                        onClick={() => {
                          setManageStudent(s);
                          setRevokeReason("lost");
                          setManageError("");
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                          borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600,
                          color: "var(--text-secondary)", cursor: "pointer",
                        }}
                      >
                        <QrCode size={13} /> Manage
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => openEdit(s)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                        borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                        color: "var(--text-secondary)", cursor: "pointer",
                      }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
