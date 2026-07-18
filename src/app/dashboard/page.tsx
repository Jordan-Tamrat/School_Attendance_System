import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, CheckCircle, XCircle, Clock, QrCode, PenLine, AlertTriangle } from "lucide-react";

async function getStats(userId: string, role: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let classFilter = {};
  if (role === "teacher") {
    const cls = await prisma.class.findFirst({ where: { teacherId: userId } });
    classFilter = cls ? { classId: cls.id } : { classId: "none" };
  }

  const [total, present, late, exceptions] = await Promise.all([
    prisma.student.count({ where: { isActive: true, ...classFilter } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "present", ...classFilter } }),
    prisma.attendanceRecord.count({ where: { date: today, status: "late", ...classFilter } }),
    prisma.scanException.count({ where: { resolved: false } }),
  ]);

  const absent = total - present - late;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { total, present, late, absent, exceptions, rate };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getStats(session!.user.id, session!.user.role);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const cards = [
    {
      label: "Total Students", value: stats.total, icon: Users,
      accent: "#2563eb", bg: "var(--accent-light)", color: "var(--accent-text)",
    },
    {
      label: "Present Today", value: stats.present, icon: CheckCircle,
      accent: "#059669", bg: "var(--success-light)", color: "var(--success-text)",
    },
    {
      label: "Late Today", value: stats.late, icon: Clock,
      accent: "#d97706", bg: "var(--warning-light)", color: "var(--warning-text)",
    },
    {
      label: "Absent Today", value: stats.absent, icon: XCircle,
      accent: "#dc2626", bg: "var(--danger-light)", color: "var(--danger-text)",
    },
  ];

  const quickActions = [
    { href: "/scanner", label: "Open Scanner", icon: QrCode, desc: "Scan student QR codes" },
    { href: "/manual", label: "Manual Entry", icon: PenLine, desc: "Enter attendance manually" },
    { href: "/reports", label: "View Reports", icon: Users, desc: "Daily & monthly reports" },
  ];

  const quickActionStyle = `
    .quick-action-card { transition: box-shadow 0.15s, transform 0.15s; }
    .quick-action-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  `;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            {session!.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "8px 16px", fontSize: 13,
          color: "var(--text-secondary)", boxShadow: "var(--shadow-sm)",
        }}>
          <span style={{ fontWeight: 600, color: "var(--accent)" }}>{stats.rate}%</span> attendance rate today
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {cards.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="card" style={{ padding: "20px 22px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 10,
              background: bg, marginBottom: 14,
            }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 6 }}>
              {value}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Attendance progress bar */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Today&apos;s Attendance Progress</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {stats.present + stats.late} / {stats.total} students checked in
          </span>
        </div>
        <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 999,
            background: "linear-gradient(90deg, var(--accent), #06b6d4)",
            width: `${stats.rate}%`,
            transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          {[
            { label: "Present", value: stats.present, color: "var(--success-text)", bg: "var(--success-light)" },
            { label: "Late", value: stats.late, color: "var(--warning-text)", bg: "var(--warning-light)" },
            { label: "Absent", value: stats.absent, color: "var(--danger-text)", bg: "var(--danger-light)" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ fontWeight: 600, color }}>{value}</span> {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Quick Actions
        </h2>
        <style>{quickActionStyle}</style>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {quickActions.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div className="card quick-action-card" style={{
                padding: "18px 20px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "var(--accent-light)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={18} color="var(--accent-text)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Exceptions alert */}
      {session!.user.role === "admin" && stats.exceptions > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "var(--warning-light)",
          border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
          borderRadius: 10, padding: "14px 18px", marginTop: 16,
        }}>
          <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: "var(--warning-text)", flex: 1 }}>
            <strong>{stats.exceptions}</strong> unresolved scan exception(s) require your attention.
          </span>
          <Link href="/exceptions" style={{
            fontSize: 13, fontWeight: 600, color: "var(--warning-text)",
            textDecoration: "none", whiteSpace: "nowrap",
            padding: "6px 12px", borderRadius: 6,
            background: "color-mix(in srgb, var(--warning) 15%, transparent)",
          }}>
            Review →
          </Link>
        </div>
      )}
    </div>
  );
}
