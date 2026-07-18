"use client";

import { useEffect, useState } from "react";
import { UserPlus, X, Shield, GraduationCap, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    role: "teacher",
    password: "",
  });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const res = await fetch("/api/users");
    setUsers(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setShowForm(false);
      setForm({ username: "", fullName: "", role: "teacher", password: "" });
      fetchUsers();
    } else {
      setError(data.error?.fieldErrors
        ? Object.values(data.error.fieldErrors).flat().join(", ")
        : data.error ?? "Failed to create user");
    }
  }

  function closeForm() {
    setShowForm(false);
    setError("");
    setForm({ username: "", fullName: "", role: "teacher", password: "" });
  }

  const admins  = users.filter((u) => u.role === "admin");
  const teachers = users.filter((u) => u.role === "teacher");

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Staff Accounts</h1>
          <p className="page-subtitle">Manage administrator and teacher accounts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <UserPlus size={16} /> New Account
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
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Create Staff Account</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  New staff can log in immediately after creation
                </p>
              </div>
              <button onClick={closeForm} style={{
                background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-secondary)",
                display: "flex", alignItems: "center",
              }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Role selector */}
              <div>
                <label className="label">Role *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "teacher", label: "Teacher", icon: GraduationCap, desc: "Can scan, manual entry, reports" },
                    { value: "admin",   label: "Admin",   icon: Shield,         desc: "Full access to all features" },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, role: value })}
                      style={{
                        flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                        textAlign: "left", transition: "all 0.15s",
                        background: form.role === value ? "var(--accent-light)" : "var(--bg-surface-2)",
                        border: `2px solid ${form.role === value ? "var(--accent)" : "var(--border)"}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Icon size={15} color={form.role === value ? "var(--accent-text)" : "var(--text-muted)"} />
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: form.role === value ? "var(--accent-text)" : "var(--text-primary)",
                        }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  placeholder="e.g. John Smith"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Username *</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                  required
                  placeholder="e.g. jsmith"
                  className="input"
                  autoComplete="off"
                />
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Lowercase letters and numbers only, no spaces
                </p>
              </div>

              <div>
                <label className="label">Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    className="input"
                    style={{ paddingRight: 44 }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-muted)", padding: 4,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                <button type="button" onClick={closeForm} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admins section */}
      <UserSection
        title="Administrators"
        icon={Shield}
        color="var(--accent-text)"
        bg="var(--accent-light)"
        users={admins}
      />

      {/* Teachers section */}
      <UserSection
        title="Teachers"
        icon={GraduationCap}
        color="var(--success-text)"
        bg="var(--success-light)"
        users={teachers}
      />
    </div>
  );
}

function UserSection({
  title, icon: Icon, color, bg, users,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  users: User[];
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
        <span style={{
          fontSize: 12, fontWeight: 600, color,
          background: bg, padding: "2px 8px", borderRadius: 999,
        }}>
          {users.length}
        </span>
      </div>

      {users.length === 0 ? (
        <div style={{
          padding: "24px", borderRadius: 12, textAlign: "center",
          border: "1.5px dashed var(--border)", color: "var(--text-muted)", fontSize: 13,
        }}>
          No {title.toLowerCase()} yet
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: bg, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color,
                      }}>
                        {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-muted)" }}>
                    @{u.username}
                  </td>
                  <td>
                    {u.isActive ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                        background: "var(--success-light)", color: "var(--success-text)",
                        padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      }}>
                        <CheckCircle size={11} /> Active
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                        background: "var(--danger-light)", color: "var(--danger-text)",
                        padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                      }}>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {u.lastLogin ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Clock size={12} color="var(--text-muted)" />
                        {new Date(u.lastLogin).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Never</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
