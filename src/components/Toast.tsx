"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
      background: isSuccess ? "var(--success-light)" : "var(--danger-light)",
      color: isSuccess ? "var(--success-text)" : "var(--danger-text)",
      border: `1px solid color-mix(in srgb, ${isSuccess ? "var(--success)" : "var(--danger)"} 25%, transparent)`,
      boxShadow: "var(--shadow-xl)",
      animation: "slideUp 0.2s ease",
      maxWidth: 360,
    }}>
      {isSuccess ? <CheckCircle size={17} /> : <XCircle size={17} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "inherit", opacity: 0.6, padding: 2, display: "flex",
      }}>
        <X size={14} />
      </button>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const show = (message: string, type: ToastType = "success") => setToast({ message, type });
  const hide = () => setToast(null);
  return { toast, show, hide };
}
