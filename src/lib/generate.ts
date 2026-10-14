import { ok, fail, type Result } from './text.ts';

/** Bilangan bulat acak seragam di [0, max) dari crypto.getRandomValues (rejection sampling, tanpa modulo bias). */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 0x100000000) throw new RangeError('max tidak valid');
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

export function uuidv4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
} as const;

function activeSets(o: PasswordOptions): string[] {
  return (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((k) => o[k])
    .map((k) => (o.avoidAmbiguous ? SETS[k].replace(/[0O1lI]/g, '') : SETS[k]));
}

export function generatePassword(o: PasswordOptions): Result<string> {
  const sets = activeSets(o);
  if (!sets.length) return fail('Pilih minimal satu jenis karakter.');
  if (!Number.isInteger(o.length) || o.length < 4 || o.length > 128) return fail('Panjang password harus antara 4 dan 128.');
  const pool = sets.join('');
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < o.length) chars.push(pool[randomInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return ok(chars.join(''));
}

export function passwordComposition(pw: string): { lower: number; upper: number; digits: number; symbols: number } {
  const lower = (pw.match(/[a-z]/g) ?? []).length;
  const upper = (pw.match(/[A-Z]/g) ?? []).length;
  const digits = (pw.match(/[0-9]/g) ?? []).length;
  return { lower, upper, digits, symbols: pw.length - lower - upper - digits };
}

/** Perkiraan entropi (bit) = panjang × log2(ukuran kumpulan karakter). Hanya estimasi kasar. */
export function passwordEntropyBits(o: PasswordOptions): number {
  const size = activeSets(o).join('').length;
  return size > 1 ? o.length * Math.log2(size) : 0;
}

export function strengthLabel(bits: number): string {
  if (bits < 40) return 'Lemah';
  if (bits < 60) return 'Cukup';
  if (bits < 80) return 'Kuat';
  return 'Sangat kuat';
}

const WORDS = (
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ' +
  'enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in ' +
  'reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa ' +
  'qui officia deserunt mollit anim id est laborum'
).split(' ');

function sentence(): string {
  const count = 6 + randomInt(9);
  const words: string[] = [];
  for (let i = 0; i < count; i++) words.push(WORDS[randomInt(WORDS.length)]);
  if (count > 8) words[3 + randomInt(count - 6)] += ',';
  const text = words.join(' ').replace(/,$/, '');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

export const LOREM_MAX_PARAGRAPHS = 20;
export const LOREM_MAX_SENTENCES = 10;

export function generateLorem(paragraphs: number, sentences: number, classicStart: boolean): string {
  const p = Math.min(Math.max(Math.floor(paragraphs), 1), LOREM_MAX_PARAGRAPHS);
  const s = Math.min(Math.max(Math.floor(sentences), 1), LOREM_MAX_SENTENCES);
  const out: string[] = [];
  for (let i = 0; i < p; i++) {
    const list: string[] = [];
    for (let j = 0; j < s; j++) list.push(i === 0 && j === 0 && classicStart ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' : sentence());
    out.push(list.join(' '));
  }
  return out.join('\n\n');
}
