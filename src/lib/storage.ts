// Pembungkus localStorage yang aman: semua akses dibungkus try/catch, semua key diberi awalan "devkit:".
// Jika localStorage tidak tersedia (mode privat, diblokir, penuh), aplikasi tetap berjalan tanpa menyimpan.
const PREFIX = 'devkit:';

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(PREFIX + key, value);
    return true;
  } catch {
    return false;
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* diabaikan: penyimpanan tidak tersedia */
  }
}

export function readJson<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  const raw = storageGet(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  return storageSet(key, JSON.stringify(value));
}

export function isStorageAvailable(): boolean {
  try {
    const k = PREFIX + '__probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** Menghapus HANYA data milik DevKit (key berawalan "devkit:"). Data situs lain tidak disentuh. */
export function storageClearAll(): number {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    return keys.length;
  } catch {
    return 0;
  }
}
