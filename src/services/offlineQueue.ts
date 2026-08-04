import Dexie, { Table } from "dexie";

interface QueuedScan {
  id?: number;
  qrCodeData: string;
  clientTimestamp: string;
  synced: boolean;
  exceptionType?: string;
  exceptionNotes?: string;
}

interface RosterStudent {
  qrCodeData: string;
  name: string;
  isActive: boolean;
  qrExpiresAt: string;
  hasScannedToday: boolean;
}

interface OfflineSettings {
  id: string; // "default"
  doorOpensTime: string;
  doorClosesTime: string;
  lateThresholdMin: number;
}

class AttendanceDB extends Dexie {
  queue!: Table<QueuedScan>;
  roster!: Table<RosterStudent, string>; // Primary key is qrCodeData
  settings!: Table<OfflineSettings, string>; // Primary key is id

  constructor() {
    super("AttendanceOfflineDB");
    this.version(1).stores({ queue: "++id, synced" });
    this.version(2).stores({
      queue: "++id, synced",
      roster: "qrCodeData", // Primary key qrCodeData
      settings: "id"        // Primary key id
    });
  }
}

export const offlineDB = new AttendanceDB();

export async function queueScan(qrCodeData: string, exceptionType?: string, exceptionNotes?: string) {
  await offlineDB.queue.add({
    qrCodeData,
    clientTimestamp: new Date().toISOString(),
    synced: false,
    exceptionType,
    exceptionNotes,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("scanQueued"));
  }
}

export async function syncPendingScans() {
  const pending = await offlineDB.queue.filter(r => !r.synced).toArray();
  if (!pending.length) return { synced: 0 };

  const res = await fetch("/api/attendance/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records: pending }),
  });

  if (res.ok) {
    const ids = pending.map((r) => r.id!).filter(Boolean);
    await offlineDB.queue.bulkUpdate(ids.map((id) => ({ key: id, changes: { synced: true } })));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("scansSynced"));
    }
    return await res.json();
  }

  return { synced: 0 };
}

export async function downloadOfflineSnapshot() {
  try {
    const res = await fetch("/api/attendance/offline-snapshot");
    if (!res.ok) return false;
    
    const data = await res.json();
    
    await offlineDB.transaction("rw", offlineDB.roster, offlineDB.settings, async () => {
      // Clear existing roster and insert new ones
      await offlineDB.roster.clear();
      if (data.roster && data.roster.length > 0) {
        await offlineDB.roster.bulkAdd(data.roster);
      }
      
      // Update settings
      if (data.settings) {
        await offlineDB.settings.put({ id: "default", ...data.settings });
      }
    });
    
    return true;
  } catch (error) {
    console.error("Failed to download offline snapshot:", error);
    return false;
  }
}

