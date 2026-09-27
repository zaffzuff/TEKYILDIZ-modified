const DB_NAME = "zaf-tech-mainnet";
const DB_VERSION = 1;
const STORE = "ledgers";

export interface StoredLedger {
  sequence: string;
  closedAt: string;
  transactionCount: number;
  operationCount: number;
  hash?: string;
  protocolVersion?: number | null;
  savedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "sequence" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveLedgers(ledgers: StoredLedger[]): Promise<void> {
  if (typeof indexedDB === "undefined" || !ledgers.length) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const ledger of ledgers) store.put(ledger);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
  db.close();
}

export async function getStoredLedgers(limit = 5000): Promise<StoredLedger[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const result = await new Promise<StoredLedger[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => {
      const rows = (request.result as StoredLedger[])
        .sort((a, b) => Number(b.sequence) - Number(a.sequence))
        .slice(0, limit);
      resolve(rows);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
  });
  db.close();
  return result;
}

export async function countStoredLedgers(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDb();
  const count = await new Promise<number>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB count failed"));
  });
  db.close();
  return count;
}
