"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { queueScan } from "@/services/offlineQueue";
import { CheckCircle, XCircle, WifiOff, QrCode, StopCircle, Clock, UserX, RefreshCw } from "lucide-react";

interface ScanResult {
  type: "success" | "error" | "duplicate" | "offline" | "expired";
  message: string;
  time: string;
}

interface AbsentStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
}

export default function ScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [latest, setLatest] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [absentList, setAbsentList] = useState<AbsentStudent[]>([]);
  const [absentLoading, setAbsentLoading] = useState(false);
  const lastScanned = useRef("");
  const cooldown = useRef(false);

  const fetchAbsent = useCallback(async () => {
    setAbsentLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`/api/reports?type=absent&date=${today}`);
    if (res.ok) setAbsentList(await res.json());
    setAbsentLoading(false);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
    fetchAbsent();
  }, [fetchAbsent]);

  async function startScanner() {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      onScanSuccess,
      () => {}
    );
    setScanning(true);
  }

  async function stopScanner() {
    if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    setScanning(false);
  }

  async function onScanSuccess(qrCodeData: string) {
    if (cooldown.current || qrCodeData === lastScanned.current) return;
    cooldown.current = true;
    lastScanned.current = qrCodeData;

    const time = new Date().toLocaleTimeString();

    if (!isOnline) {
      await queueScan(qrCodeData);
      const r = { type: "offline" as const, message: "Queued for sync (offline)", time };
      setLatest(r);
      setHistory((h) => [r, ...h].slice(0, 20));
      setTimeout(() => { cooldown.current = false; lastScanned.current = ""; }, 3000);
      return;
    }

    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeData, clientTimestamp: new Date().toISOString() }),
      });
      const data = await res.json();
      let r: ScanResult;
      if (res.ok) {
        r = { type: "success", message: `${data.student} — marked ${data.status}`, time };
        fetchAbsent();
      } else if (res.status === 409) {
        r = { type: "duplicate", message: `Already scanned today (${data.existing?.status})`, time };
      } else if (res.status === 403) {
        r = { type: "expired", message: data.error ?? "ID Card Expired", time };
      } else {
        r = { type: "error", message: data.error ?? "Scan failed", time };
      }
      setLatest(r);
      setHistory((h) => [r, ...h].slice(0, 20));
    } catch {
      await queueScan(qrCodeData);
      const r = { type: "offline" as const, message: "Network error — queued", time };
      setLatest(r);
      setHistory((h) => [r, ...h].slice(0, 20));
    }

    setTimeout(() => { setLatest(null); cooldown.current = false; lastScanned.current = ""; }, 4000);
  }

  const resultStyle: Record<string, { bg: string; color: string; border: string }> = {
    success:   { bg: "var(--success-light)",  color: "var(--success-text)",  border: "color-mix(in srgb, var(--success) 25%, transparent)" },
    error:     { bg: "var(--danger-light)",   color: "var(--danger-text)",   border: "color-mix(in srgb, var(--danger) 25%, transparent)" },
    duplicate: { bg: "var(--warning-light)",  color: "var(--warning-text)",  border: "color-mix(in srgb, var(--warning) 25%, transparent)" },
    expired:   { bg: "var(--danger-light)",   color: "var(--danger-text)",   border: "color-mix(in srgb, var(--danger) 25%, transparent)" },
    offline:   { bg: "var(--bg-surface-2)",   color: "var(--text-secondary)", border: "var(--border)" },
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">QR Scanner</h1>
        <p className="page-subtitle">Point the camera at a student ID card to mark attendance</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Scanner panel */}
        <div className="card" style={{ padding: 24 }}>
          {!isOnline && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--danger-light)", color: "var(--danger-text)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13,
              marginBottom: 16, fontWeight: 500,
            }}>
              <WifiOff size={15} /> Offline mode — scans will be queued locally
            </div>
          )}

          <div style={{
            borderRadius: 12, overflow: "hidden",
            background: "#000", aspectRatio: "1",
            border: `2px solid ${scanning ? "var(--accent)" : "var(--border)"}`,
            transition: "border-color 0.3s",
            position: "relative",
          }}>
            <div id="qr-reader" style={{ width: "100%", height: "100%" }} />
            {!scanning && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "var(--bg-surface-2)", gap: 12,
              }}>
                <QrCode size={48} color="var(--text-muted)" />
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Camera inactive</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            {!scanning ? (
              <button onClick={startScanner} className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                <QrCode size={17} /> Start Scanning
              </button>
            ) : (
              <button onClick={stopScanner} style={{
                width: "100%", padding: "12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "var(--danger-light)", color: "var(--danger-text)",
                border: "1.5px solid color-mix(in srgb, var(--danger) 25%, transparent)",
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                <StopCircle size={17} /> Stop Scanner
              </button>
            )}
          </div>

          {latest && (
            <div style={{
              marginTop: 14, padding: "12px 16px", borderRadius: 8,
              background: resultStyle[latest.type].bg,
              color: resultStyle[latest.type].color,
              border: `1px solid ${resultStyle[latest.type].border}`,
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 14, fontWeight: 500,
              animation: "fadeIn 0.2s ease",
            }}>
              {latest.type === "success" && <CheckCircle size={17} />}
              {latest.type === "error" && <XCircle size={17} />}
              {latest.type === "expired" && <XCircle size={17} />}
              {latest.type === "duplicate" && <Clock size={17} />}
              {latest.type === "offline" && <WifiOff size={17} />}
              {latest.message}
            </div>
          )}
        </div>

        {/* Not yet scanned */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Not Yet Scanned
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 600,
                background: absentList.length > 0 ? "var(--danger-light)" : "var(--success-light)",
                color: absentList.length > 0 ? "var(--danger-text)" : "var(--success-text)",
                padding: "2px 8px", borderRadius: 999,
              }}>
                {absentList.length}
              </span>
            </h2>
            <button
              onClick={fetchAbsent}
              disabled={absentLoading}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, padding: 4,
              }}
            >
              <RefreshCw size={13} style={{ animation: absentLoading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>

          {absentList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 14 }}>
              <CheckCircle size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} color="var(--success-text)" />
              All students scanned!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
              {absentList.map((s) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8,
                  background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: "var(--danger-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <UserX size={14} color="var(--danger-text)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {s.firstName} {s.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>#{s.studentNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scan history — full width below */}
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
          Scan History
          {history.length > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 12, fontWeight: 600,
              background: "var(--accent-light)", color: "var(--accent-text)",
              padding: "2px 8px", borderRadius: 999,
            }}>
              {history.length}
            </span>
          )}
        </h2>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 14 }}>
            <QrCode size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
            No scans yet this session
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {history.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8,
                background: resultStyle[r.type].bg,
                border: `1px solid ${resultStyle[r.type].border}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: resultStyle[r.type].color }}>
                    {r.message}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {r.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        #qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover; }
        #qr-reader { width: 100% !important; }
        #qr-reader__scan_region { border: none !important; }
        #qr-reader__dashboard { display: none !important; }
      `}</style>
    </div>
  );
}
