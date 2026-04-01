import localforage from 'localforage';

const HANDLE_KEY = 'chaptered-backup-dir-handle';
const LAST_BACKUP_KEY = 'chaptered-last-backup-date';
const FOLDER_NAME_KEY = 'chaptered-backup-folder-name';
const INTERVAL_KEY = 'chaptered-backup-interval-days';

// ── File System Access API support check ─────────────────────────────────────
export const supportsFilePicker = () => 'showDirectoryPicker' in window;

// ── Pick a folder and store the handle ───────────────────────────────────────
export async function pickBackupFolder(): Promise<{ handle: FileSystemDirectoryHandle; name: string } | null> {
  if (!supportsFilePicker()) return null;
  try {
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    await localforage.setItem(HANDLE_KEY, handle);
    await localforage.setItem(FOLDER_NAME_KEY, handle.name);
    return { handle, name: handle.name };
  } catch {
    return null; // user cancelled
  }
}

// ── Retrieve stored handle and re-verify permission ──────────────────────────
export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await localforage.getItem<FileSystemDirectoryHandle>(HANDLE_KEY);
    if (!handle) return null;
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return handle;
    const req = await (handle as any).requestPermission({ mode: 'readwrite' });
    return req === 'granted' ? handle : null;
  } catch {
    return null;
  }
}

export async function getStoredFolderName(): Promise<string | null> {
  return localforage.getItem<string>(FOLDER_NAME_KEY);
}

export async function clearStoredHandle(): Promise<void> {
  await localforage.removeItem(HANDLE_KEY);
  await localforage.removeItem(FOLDER_NAME_KEY);
}

// ── Write a dated backup JSON to the chosen folder ───────────────────────────
export async function writeBackup(handle: FileSystemDirectoryHandle, data: object): Promise<string> {
  const filename = `chaptered-backup-${new Date().toISOString().split('T')[0]}.json`;
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await (fileHandle as any).createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
  const now = new Date().toISOString();
  await localforage.setItem(LAST_BACKUP_KEY, now);
  return now;
}

// ── Read/write interval preference ───────────────────────────────────────────
export async function getBackupInterval(): Promise<number> {
  const val = await localforage.getItem<number>(INTERVAL_KEY);
  return val ?? 7;
}

export async function setBackupInterval(days: number): Promise<void> {
  await localforage.setItem(INTERVAL_KEY, days);
}

// ── Read last backup timestamp ────────────────────────────────────────────────
export async function getLastBackupDate(): Promise<string | null> {
  return localforage.getItem<string>(LAST_BACKUP_KEY);
}

// ── Called on app launch: auto-backup if interval has elapsed ─────────────────
export async function checkAndAutoBackup(data: object): Promise<boolean> {
  const handle = await getStoredHandle();
  if (!handle) return false;

  const interval = await getBackupInterval();
  const lastBackup = await getLastBackupDate();

  if (lastBackup) {
    const daysSince = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < interval) return false;
  }

  try {
    await writeBackup(handle, data);
    return true;
  } catch {
    return false;
  }
}
