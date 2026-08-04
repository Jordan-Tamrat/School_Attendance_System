import Dexie, { Table } from "dexie";

interface QueuedScan {
  id?: number;
  qrCodeData: string;
  clientTimestamp: string;
  synced: boolean;
}

class AttendanceDB extends Dexie {
  queue!: Table<QueuedScan>;

  constructor() {
    super("AttendanceOfflineDB");
    this.version(1).stores({ queue: "++id, synced" });
  }
}

export const offlineDB = new AttendanceDB();

export async function queueScan(qrCodeData: string) {
  await offlineDB.queue.add({
    qrCodeData,
    clientTimestamp: new Date().toISOString(),
    synced: false,
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
