import { ok, fail, type Result } from './text.ts';

// ---------- Base64 ----------
export function base64Encode(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  let b = btoa(bin);
  if (urlSafe) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b;
}

export function base64Decode(input: string): Result<string> {
  let s = input.replace(/\s+/g, '');
  if (!s) return fail('Masukkan teks Base64 terlebih dahulu.');
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    return fail('Input mengandung karakter yang bukan Base64. Karakter yang valid: huruf, angka, +, /, = (atau - dan _ untuk varian URL-safe).');
  }
  const stripped = s.replace(/=+$/, '');
  if (stripped.length % 4 === 1) return fail('Panjang Base64 tidak valid (data terpotong atau rusak).');
  const padded = stripped + '='.repeat((4 - (stripped.length % 4)) % 4);
  let bin: string;
  try {
    bin = atob(padded);
  } catch {
    return fail('Base64 tidak valid dan tidak dapat di-decode.');
  }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  try {
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return fail('Data berhasil di-decode, tetapi bukan teks UTF-8 yang valid (mungkin data biner seperti gambar atau file).');
  }
}

// ---------- URL ----------
export type UrlEncodeMode = 'component' | 'full';

export function urlEncode(s: string, mode: UrlEncodeMode): Result<string> {
  if (!s) return fail('Masukkan teks terlebih dahulu.');
  try {
    return ok(mode === 'full' ? encodeURI(s) : encodeURIComponent(s));
  } catch {
    return fail('Teks mengandung karakter Unicode yang tidak lengkap (surrogate tunggal) sehingga tidak dapat di-encode.');
  }
}

export function urlDecode(s: string, plusAsSpace: boolean): Result<string> {
  if (!s) return fail('Masukkan teks terlebih dahulu.');
  try {
    return ok(decodeURIComponent(plusAsSpace ? s.replace(/\+/g, ' ') : s));
  } catch {
    return fail('Teks mengandung urutan persen-encoding yang tidak valid (contoh: % yang tidak diikuti dua digit heksadesimal, atau byte yang bukan UTF-8 valid).');
  }
}

// ---------- Warna ----------
export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function parseHex(input: string): Rgb | null {
  let h = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const s1 = s / 100;
  const l1 = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s1 * Math.min(l1, 1 - l1);
  const f = (n: number) => l1 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}

export function parseIntInRange(s: string, min: number, max: number): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
}

// ---------- Unix timestamp ----------
export type TsUnit = 'auto' | 's' | 'ms';

export function timestampToMs(input: string, unit: TsUnit): Result<{ ms: number; unit: 's' | 'ms' }> {
  const t = input.trim();
  if (!t) return fail('Masukkan timestamp terlebih dahulu.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return fail('Timestamp harus berupa angka, contoh: 1700000000 atau 1700000000000.');
  const n = Number(t);
  const u: 's' | 'ms' = unit === 'auto' ? (Math.abs(n) >= 1e11 ? 'ms' : 's') : unit;
  const ms = Math.round(u === 's' ? n * 1000 : n);
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return fail('Nilai di luar rentang tanggal yang didukung JavaScript.');
  return ok({ ms, unit: u });
}

export interface DateDescription {
  iso: string;
  utc: string;
  local: string;
  timeZone: string;
  seconds: number;
  ms: number;
}

export function describeMs(ms: number): DateDescription {
  const d = new Date(ms);
  return {
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'long' }).format(d),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    seconds: Math.floor(ms / 1000),
    ms,
  };
}

export function relativeTime(ms: number, now: number = Date.now()): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536e6],
    ['month', 2592e6],
    ['day', 864e5],
    ['hour', 36e5],
    ['minute', 6e4],
    ['second', 1e3],
  ];
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (abs >= size || unit === 'second') return rtf.format(Math.round(diff / size), unit);
  }
  return '';
}

/** value berformat dari <input type="datetime-local">: YYYY-MM-DDTHH:mm atau YYYY-MM-DDTHH:mm:ss */
export function dateInputToMs(value: string, utc: boolean): Result<number> {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!value) return fail('Pilih tanggal dan waktu terlebih dahulu.');
  if (!m) return fail('Format tanggal dan waktu tidak valid.');
  const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6] ?? '0'].map(Number);
  const dt = new Date(0);
  if (utc) {
    dt.setUTCFullYear(y, mo - 1, d);
    dt.setUTCHours(h, mi, s, 0);
  } else {
    dt.setFullYear(y, mo - 1, d);
    dt.setHours(h, mi, s, 0);
  }
  const t = dt.getTime();
  if (Number.isNaN(t)) return fail('Tanggal tidak valid.');
  const same = utc
    ? dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d && dt.getUTCHours() === h && dt.getUTCMinutes() === mi
    : dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && dt.getHours() === h && dt.getMinutes() === mi;
  if (!same) return fail('Tanggal atau waktu tidak ada (misalnya 30 Februari, atau jam yang terlewati saat pergantian waktu musim panas).');
  return ok(t);
}
