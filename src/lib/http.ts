import { ok, fail, byteLength, type Result } from './text.ts';

export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type Method = (typeof METHODS)[number];

const FORBIDDEN = new Set([
  'accept-charset', 'accept-encoding', 'access-control-request-headers', 'access-control-request-method', 'connection',
  'content-length', 'cookie', 'cookie2', 'date', 'dnt', 'expect', 'host', 'keep-alive', 'origin', 'referer', 'set-cookie',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'via',
]);

export function isForbiddenHeader(name: string): boolean {
  const n = name.toLowerCase();
  return FORBIDDEN.has(n) || n.startsWith('proxy-') || n.startsWith('sec-');
}

export function parseHeaders(text: string): Result<[string, string][]> {
  const out: [string, string][] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 1) return fail(`Header baris ${i + 1} tidak valid. Gunakan format "Nama: nilai".`);
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) return fail(`Nama header "${name}" (baris ${i + 1}) mengandung karakter yang tidak diizinkan.`);
    out.push([name, value]);
  }
  return ok(out);
}

function isMetadataHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === 'metadata.google.internal' ||
    h === 'metadata' ||
    /^169\.254\./.test(h) ||
    h === '100.100.100.200' ||
    h === '[fd00:ec2::254]' ||
    h.startsWith('[::ffff:a9fe:')
  );
}

export function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || /^127\./.test(h) || h === '[::1]';
}

export function checkTargetUrl(raw: string): Result<URL> {
  const t = raw.trim();
  if (!t) return fail('Masukkan URL endpoint.');
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return fail('URL tidak valid. Sertakan skema, contoh: https://api.contoh.com/data');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return fail('Hanya URL http:// atau https:// yang didukung.');
  if (u.username || u.password) return fail('URL tidak boleh berisi username atau password. Gunakan header Authorization bila perlu (tidak disimpan).');
  if (isMetadataHost(u.hostname)) return fail('Alamat layanan metadata cloud diblokir demi keamanan.');
  return ok(u);
}

export interface BuiltRequest {
  url: string;
  init: RequestInit;
  notes: string[];
}

export function buildRequest(
  p: { method: Method; url: string; headers: string; body: string },
  pageProtocol?: string,
): Result<BuiltRequest> {
  const u = checkTargetUrl(p.url);
  if (!u.ok) return fail(u.error);
  const hs = parseHeaders(p.headers);
  if (!hs.ok) return fail(hs.error);
  const notes: string[] = [];
  if (pageProtocol === 'https:' && u.value.protocol === 'http:' && !isLoopbackHost(u.value.hostname)) {
    return fail('Browser memblokir request http:// dari halaman https:// (mixed content), kecuali ke localhost. Gunakan endpoint https://.');
  }
  const headers = new Headers();
  for (const [name, value] of hs.value) {
    try {
      headers.append(name, value);
    } catch {
      return fail(`Header "${name}" tidak valid.`);
    }
    if (isForbiddenHeader(name)) notes.push(`Header "${name}" dikendalikan browser dan akan diabaikan.`);
  }
  const hasBody = p.method !== 'GET' && p.body.trim().length > 0;
  if (p.method === 'GET' && p.body.trim()) notes.push('Body diabaikan karena metode GET tidak mengirim body.');
  if (hasBody && !headers.has('content-type')) {
    try {
      JSON.parse(p.body);
      headers.set('Content-Type', 'application/json');
      notes.push('Content-Type: application/json ditambahkan otomatis karena body berupa JSON.');
    } catch {
      /* biarkan default browser (text/plain) */
    }
  }
  return ok({
    url: u.value.href,
    init: {
      method: p.method,
      headers,
      body: hasBody ? p.body : undefined,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    },
    notes,
  });
}

export function isTextualType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  if (!ct) return true;
  return /json|text\/|xml|javascript|html|x-www-form-urlencoded|yaml|csv|graphql|svg/.test(ct);
}

export async function readBodyText(res: Response, maxBytes = 2_000_000): Promise<{ text: string; truncated: boolean; bytes: number }> {
  if (!res.body) {
    const t = await res.text();
    return { text: t, truncated: false, bytes: byteLength(t) };
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
      if (total > maxBytes) {
        truncated = true;
        await reader.cancel();
        break;
      }
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return { text: new TextDecoder().decode(merged.subarray(0, Math.min(total, maxBytes))), truncated, bytes: Math.min(total, maxBytes) };
}
