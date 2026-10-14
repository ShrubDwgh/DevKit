import { ok, fail, type Result } from './text.ts';
import { base64Decode } from './convert.ts';

export type Tone = 'success' | 'warning' | 'error' | 'info';

export interface TimeClaim {
  name: 'exp' | 'iat' | 'nbf';
  label: string;
  value: number;
  iso: string;
  note: string;
  tone: Tone;
}

export interface JwtDecoded {
  header: Record<string, unknown>;
  payload: unknown;
  signature: string;
  timeClaims: TimeClaim[];
  textClaims: { name: string; value: string }[];
  warnings: string[];
}

function decodeSegment(seg: string, label: string): Result<unknown> {
  if (!seg) return fail(`Bagian ${label} kosong.`);
  if (!/^[A-Za-z0-9_-]+$/.test(seg)) return fail(`Bagian ${label} bukan Base64URL yang valid.`);
  const text = base64Decode(seg);
  if (!text.ok) return fail(`Bagian ${label} tidak dapat di-decode: ${text.error}`);
  try {
    return ok(JSON.parse(text.value) as unknown);
  } catch {
    return fail(`Bagian ${label} berhasil di-decode tetapi bukan JSON yang valid.`);
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Hanya men-decode. Fungsi ini TIDAK memverifikasi tanda tangan. */
export function decodeJwt(input: string, now: number = Date.now()): Result<JwtDecoded> {
  const token = input.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  if (!token) return fail('Tempelkan token JWT terlebih dahulu.');
  const parts = token.split('.');
  if (parts.length === 5) return fail('Token ini tampaknya JWE (terenkripsi, 5 bagian). Isinya tidak dapat dibaca tanpa kunci dekripsi.');
  if (parts.length !== 3) return fail('JWT harus terdiri dari 3 bagian yang dipisahkan titik: header.payload.signature.');
  const h = decodeSegment(parts[0], 'header');
  if (!h.ok) return fail(h.error);
  if (!isObject(h.value)) return fail('Header JWT harus berupa objek JSON.');
  const p = decodeSegment(parts[1], 'payload');
  if (!p.ok) return fail(p.error);
  if (parts[2] && !/^[A-Za-z0-9_-]+$/.test(parts[2])) return fail('Bagian signature bukan Base64URL yang valid.');

  const header = h.value;
  const warnings: string[] = [];
  const alg = typeof header.alg === 'string' ? header.alg : '';
  if (!alg) warnings.push('Header tidak memiliki field "alg".');
  if (alg.toLowerCase() === 'none') warnings.push('Algoritma "none": token tanpa tanda tangan. Jangan dipercaya sebagai bukti identitas.');
  else if (!parts[2]) warnings.push('Signature kosong padahal algoritma bukan "none".');

  const timeClaims: TimeClaim[] = [];
  const textClaims: { name: string; value: string }[] = [];
  if (isObject(p.value)) {
    const payload = p.value;
    const labels = { exp: 'Kedaluwarsa (exp)', iat: 'Diterbitkan (iat)', nbf: 'Berlaku mulai (nbf)' } as const;
    for (const name of ['exp', 'iat', 'nbf'] as const) {
      if (!(name in payload)) continue;
      const v = payload[name];
      if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v * 1000) > 8.64e15) {
        warnings.push(`Claim "${name}" bukan timestamp numerik yang valid.`);
        continue;
      }
      const ms = v * 1000;
      let note = '';
      let tone: Tone = 'info';
      if (name === 'exp') {
        if (now >= ms) {
          note = 'Sudah kedaluwarsa menurut jam perangkat ini';
          tone = 'error';
        } else {
          note = 'Belum kedaluwarsa menurut jam perangkat ini';
          tone = 'success';
        }
      } else if (name === 'nbf') {
        if (now < ms) {
          note = 'Belum berlaku menurut jam perangkat ini';
          tone = 'warning';
        } else note = 'Sudah berlaku';
      } else if (ms > now + 60_000) {
        note = 'Waktu penerbitan ada di masa depan';
        tone = 'warning';
      } else note = 'Waktu penerbitan token';
      timeClaims.push({ name, label: labels[name], value: v, iso: new Date(ms).toISOString(), note, tone });
    }
    for (const name of ['iss', 'sub', 'aud', 'jti']) {
      if (!(name in payload)) continue;
      const v = payload[name];
      textClaims.push({ name, value: typeof v === 'string' ? v : JSON.stringify(v) });
    }
  } else warnings.push('Payload bukan objek JSON, sehingga claim standar tidak dapat ditampilkan.');

  return ok({ header, payload: p.value, signature: parts[2], timeClaims, textClaims, warnings });
}
