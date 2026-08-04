"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard, QrCode, PenLine, BarChart2,
  Users, AlertTriangle, LogOut, GraduationCap,
  Sun, Moon, ChevronRight, BookOpen, Shield, SlidersHorizontal,
  Menu, X
} from "lucide-react";
import { useState } from "react";

const teacherLinks = [
  { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/scanner",   label: "Scanner",     icon: QrCode },
  { href: "/manual",    label: "Manual Entry", icon: PenLine },
  { href: "/reports",   label: "Reports",     icon: BarChart2 },
];

const adminLinks = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/reports",    label: "Reports",     icon: BarChart2 },
  { href: "/students",   label: "Students",    icon: Users },
  { href: "/classes",    label: "Classes",     icon: BookOpen },
  { href: "/users",      label: "Staff",       icon: Shield },
  { href: "/exceptions", label: "Exceptions",  icon: AlertTriangle },
  { href: "/settings",   label: "Settings",    icon: SlidersHorizontal },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const links = session?.user.role === "admin" ? adminLinks : teacherLinks;
  const initials = session?.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden print:hidden flex items-center justify-between p-4 bg-[var(--bg-sidebar)] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-tight">EduAttend</div>
            <div className="text-[11px] text-white/40 mt-px">Attendance System</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        print:hidden fixed inset-y-0 left-0 z-50 w-[240px] bg-[var(--bg-sidebar)] flex flex-col shrink-0 border-r border-white/10
        transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile close button */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden absolute top-5 right-4 p-1.5 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>
      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>
            EduAttend
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
            Attendance System
          </div>
        </div>
      </div>

      {/* Nav section label */}
      <div style={{ padding: "20px 20px 8px" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Navigation
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                color: active ? "#fff" : "var(--text-sidebar)",
                background: active ? "var(--bg-sidebar-active)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-sidebar-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8,
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-sidebar)", fontSize: 13.5, fontWeight: 400,
            width: "100%", textAlign: "left",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sidebar-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {theme === "dark"
            ? <Sun size={16} style={{ opacity: 0.7 }} />
            : <Moon size={16} style={{ opacity: 0.7 }} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User info */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          marginTop: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {session?.user.name}
            </div>
            <div style={{
              fontSize: 11, color: "rgba(255,255,255,0.35)",
              textTransform: "capitalize", marginTop: 1,
            }}>
              {session?.user.role}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.3)", padding: 4, borderRadius: 6,
              display: "flex", alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
