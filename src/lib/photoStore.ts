// IndexedDB storage for photo moments — keeps large image blobs out of localStorage

const DB_NAME = 'planner-rieke-moments';
const STORE = 'moments';
const DB_VERSION = 1;

export interface MomentRecord {
  id: string;
  caption: string;
  blob: Blob;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMoment(moment: MomentRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(moment);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function deleteMoment(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getAllMoments(): Promise<MomentRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      db.close();
      const items = (req.result as MomentRecord[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export function blobToURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type });
}
