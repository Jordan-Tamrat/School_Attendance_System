"use client";

import { useEffect, useState } from "react";
import { offlineDB, syncPendingScans } from "@/services/offlineQueue";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  async function refreshPending() {
    const count = await offlineDB.queue.filter(r => !r.synced).count();
    setPending(count);
  }

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshPending();
    const onOnline = async () => { 
      setIsOnline(true); 
      const count = await offlineDB.queue.filter(r => !r.synced).count();
      setPending(count);
      if (count > 0) {
        setSyncing(true);
        await syncPendingScans();
        await refreshPending();
        setSyncing(false);
      }
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("scanQueued", refreshPending);
    return () => { 
      window.removeEventListener("online", onOnline); 
      window.removeEventListener("offline", onOffline); 
      window.removeEventListener("scanQueued", refreshPending);
    };
  }, []);

  async function handleSync() {
    setSyncing(true);
    await syncPendingScans();
    await refreshPending();
    setSyncing(false);
  }

  if (isOnline && pending === 0) return null;

  const isWarning = isOnline && pending > 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 20px",
      background: isWarning ? "var(--warning-light)" : "var(--danger-light)",
      color: isWarning ? "var(--warning-text)" : "var(--danger-text)",
      borderBottom: `1px solid ${isWarning ? "color-mix(in srgb, var(--warning) 20%, transparent)" : "color-mix(in srgb, var(--danger) 20%, transparent)"}`,
      fontSize: 13, fontWeight: 500,
    }}>
      {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
      <span>
        {isOnline
          ? `Back online — ${pending} scan(s) pending sync`
          : `You're offline — ${pending} scan(s) queued locally`}
      </span>
      {isWarning && (
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            marginLeft: 8, display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--warning-text)", fontWeight: 600, fontSize: 13,
            textDecoration: "underline", padding: 0,
          }}
        >
          <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
          {syncing ? "Syncing..." : "Sync now"}
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
