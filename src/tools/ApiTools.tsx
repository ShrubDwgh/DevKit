import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShieldAlert, WifiOff } from 'lucide-react';
import { HTTP_STATUSES, STATUS_CLASSES, statusClass } from '../data/httpStatus';
import { decodeJwt } from '../lib/jwt';
import type { JwtDecoded, Tone } from '../lib/jwt';
import { buildRequest, isTextualType, METHODS, readBodyText } from '../lib/http';
import type { Method } from '../lib/http';
import { formatBytes } from '../lib/text';
import { Actions, ResetButton, ToolInput, ToolOutput } from '../components/toolkit';
import { Badge, Button, EmptyState, ErrorMessage, KeyValue, Notice, Segmented, SelectField, TextInput, WarningList } from '../components/ui';

// ---------- 21. HTTP status reference ----------
const CLASS_TONE = { 1: 'info', 2: 'success', 3: 'info', 4: 'warning', 5: 'danger' } as const;

export function HttpStatusReference() {
  const [q, setQ] = useState('');
  const [cls, setCls] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return HTTP_STATUSES.filter((s) => {
      if (cls !== 'all' && statusClass(s.code) !== Number(cls)) return false;
      if (!t) return true;
      return String(s.code).includes(t) || s.name.toLowerCase().includes(t) || s.description.toLowerCase().includes(t) || s.example.toLowerCase().includes(t);
    });
  }, [q, cls]);

  return (
    <>
      <TextInput label="Cari kode atau nama" value={q} onChange={setQ} placeholder="404, redirect, timeout…" inputMode="text" />
      <div role="radiogroup" aria-label="Filter kategori status" className="flex flex-wrap gap-2">
        {[{ id: 'all', label: 'Semua' }, ...STATUS_CLASSES.map((c) => ({ id: String(c.id), label: c.label }))].map((c) => {
          const active = cls === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCls(c.id as typeof cls)}
              className={`min-h-10 rounded-lg border px-3 text-sm transition-colors ${active ? 'border-accent-strong bg-accent-strong font-medium text-white' : 'border-line text-muted hover:text-fg'}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {list.length} dari {HTTP_STATUSES.length} kode status
      </p>
      {list.length ? (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.code} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CLASS_TONE[statusClass(s.code) as 1 | 2 | 3 | 4 | 5]}>{s.code}</Badge>
                <h2 className="text-sm font-semibold">{s.name}</h2>
                {s.flag === 'deprecated' && <Badge tone="danger">deprecated</Badge>}
                {s.flag === 'unused' && <Badge tone="warning">tidak dipakai</Badge>}
              </div>
              <p className="mt-1.5 text-sm">{s.description}</p>
              <p className="mt-1 text-xs text-muted">Contoh: {s.example}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Search} title="Kode status tidak ditemukan" description="Coba angka seperti 404 atau kata seperti “redirect”." action={<Button onClick={() => { setQ(''); setCls('all'); }}>Hapus filter</Button>} />
      )}
      <Notice>Daftar ini memuat kode status yang terdaftar di IANA HTTP Status Code Registry. Kode tidak baku buatan server atau CDN tertentu sengaja tidak dimasukkan.</Notice>
    </>
  );
}

// ---------- 22. JWT decoder ----------
const TONE_BADGE = { success: 'success', warning: 'warning', error: 'danger', info: 'info' } as const satisfies Record<Tone, 'success' | 'warning' | 'danger' | 'info'>;

export function JwtDecoder() {
  // Token hanya berada di state komponen ini. Tidak ke localStorage, riwayat, maupun server.
  const [token, setToken] = useState('');
  const [result, setResult] = useState<JwtDecoded | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const r = decodeJwt(token);
    if (r.ok) {
      setResult(r.value);
      setError(null);
    } else {
      setResult(null);
      setError(r.error);
    }
  };
  const reset = () => {
    setToken('');
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Notice tone="warning">
        <strong>Decode bukan verifikasi.</strong> Tool ini hanya membaca isi token. Tanda tangan tidak diperiksa, sehingga token yang berhasil di-decode belum tentu asli atau
        masih dipercaya. Token diproses di browser ini dan tidak dikirim atau disimpan, tetapi jangan menempelkan token sensitif di perangkat yang tidak Anda percayai.
      </Notice>
      <ToolInput label="Token JWT" value={token} onChange={setToken} rows={6} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.tanda-tangan" />
      <Actions>
        <Button variant="primary" onClick={run}>
          Decode token
        </Button>
        <ResetButton onClick={reset} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {result && (
        <div className="space-y-5">
          <WarningList items={result.warnings} />
          <ToolOutput label="Header" value={JSON.stringify(result.header, null, 2)} />
          <ToolOutput label="Payload" value={JSON.stringify(result.payload, null, 2)} />
          {(result.timeClaims.length > 0 || result.textClaims.length > 0) && (
            <div>
              <p className="label">Claim standar</p>
              <KeyValue
                items={[
                  ...result.timeClaims.map((c) => ({
                    k: c.label,
                    v: (
                      <span className="space-y-1">
                        <span className="block font-mono text-xs">{c.value} · {c.iso}</span>
                        <span className="block text-xs text-muted">Lokal: {new Date(c.value * 1000).toLocaleString('id-ID')}</span>
                        <Badge tone={TONE_BADGE[c.tone]}>{c.note}</Badge>
                      </span>
                    ),
                  })),
                  ...result.textClaims.map((c) => ({ k: c.name, v: <span className="font-mono text-xs">{c.value}</span> })),
                ]}
              />
            </div>
          )}
          <div>
            <p className="label">Signature (tidak diverifikasi)</p>
            <pre className="output min-h-0 text-xs">{result.signature || '(kosong)'}</pre>
          </div>
        </div>
      )}
      <Notice>
        <ShieldAlert className="mr-1 inline h-4 w-4" aria-hidden />
        Untuk memverifikasi tanda tangan diperlukan kunci rahasia atau kunci publik penerbit token, dan itu harus dilakukan di server Anda.
      </Notice>
    </>
  );
}

// ---------- 23. API request tester ----------
interface ApiResult {
  status: number;
  statusText: string;
  durationMs: number;
  headers: [string, string][];
  body: string;
  bodyNote: string;
  bytes: number;
}

const NETWORK_HINT =
  'Request gagal sebelum respons diterima. Penyebab umum: server tidak mengizinkan akses dari origin DevKit (CORS), server tidak dapat dijangkau, sertifikat tidak valid, atau koneksi terputus. Demi keamanan browser tidak memberi tahu penyebab pastinya. Jika CORS, pemilik API harus mengizinkan origin ini lewat header Access-Control-Allow-Origin.';

function statusTone(code: number): 'success' | 'info' | 'warning' | 'danger' {
  if (code < 300) return 'success';
  if (code < 400) return 'info';
  if (code < 500) return 'warning';
  return 'danger';
}

export function ApiRequestTester() {
  // Semua input (URL, header, body) hanya di state komponen: tidak disimpan dan tidak dikirim ke analytics.
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [timeoutSec, setTimeoutSec] = useState('15');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [tab, setTab] = useState<'body' | 'headers'>('body');
  const ctrl = useRef<AbortController | null>(null);
  const flags = useRef({ timedOut: false });
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      ctrl.current?.abort();
    };
  }, []);

  const send = async () => {
    setError(null);
    setResult(null);
    const sec = Number(timeoutSec);
    if (!Number.isFinite(sec) || sec < 1 || sec > 120) {
      setError('Batas waktu harus antara 1 dan 120 detik.');
      return;
    }
    if (!navigator.onLine) {
      setError('Perangkat Anda sedang offline. Sambungkan internet lalu coba lagi.');
      return;
    }
    const built = buildRequest({ method, url, headers, body }, window.location.protocol);
    if (!built.ok) {
      setError(built.error);
      return;
    }
    setNotes(built.value.notes);
    const controller = new AbortController();
    ctrl.current = controller;
    flags.current.timedOut = false;
    const timer = window.setTimeout(() => {
      flags.current.timedOut = true;
      controller.abort();
    }, sec * 1000);
    setLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch(built.value.url, { ...built.value.init, signal: controller.signal });
      const contentType = res.headers.get('content-type') ?? '';
      const hdrs: [string, string][] = [];
      res.headers.forEach((v, k) => hdrs.push([k, v]));
      let text = '';
      let bytes = 0;
      let note = '';
      if (isTextualType(contentType)) {
        const b = await readBodyText(res);
        text = b.text;
        bytes = b.bytes;
        if (b.truncated) note = 'Respons dipotong pada 2 MB pertama.';
        if (/json/i.test(contentType) || /^\s*[{[]/.test(text)) {
          try {
            text = JSON.stringify(JSON.parse(text), null, 2);
            note = (note ? note + ' ' : '') + 'JSON diformat otomatis.';
          } catch {
            /* bukan JSON valid: tampilkan apa adanya */
          }
        }
      } else {
        await res.body?.cancel();
        const len = res.headers.get('content-length');
        note = `Respons berupa data biner (${contentType}). Isinya tidak ditampilkan.`;
        bytes = len ? Number(len) || 0 : 0;
      }
      setResult({ status: res.status, statusText: res.statusText, durationMs: performance.now() - t0, headers: hdrs, body: text, bodyNote: note, bytes });
      setTab('body');
    } catch (e) {
      if (flags.current.timedOut) setError(`Request melewati batas waktu ${sec} detik dan dibatalkan.`);
      else if (e instanceof DOMException && e.name === 'AbortError') setError('Request dibatalkan.');
      else setError(NETWORK_HINT);
    } finally {
      window.clearTimeout(timer);
      ctrl.current = null;
      setLoading(false);
    }
  };

  const reset = () => {
    ctrl.current?.abort();
    setMethod('GET');
    setUrl('');
    setHeaders('');
    setBody('');
    setTimeoutSec('15');
    setError(null);
    setNotes([]);
    setResult(null);
  };

  const headersText = result ? result.headers.map(([k, v]) => `${k}: ${v}`).join('\n') : '';
  const canHaveBody = method !== 'GET';

  return (
    <>
      <Notice>
        Request dikirim langsung dari browser Anda ke server tujuan, tanpa proxy DevKit. Server tujuan harus mengizinkan origin ini lewat konfigurasi CORS; jika tidak, browser
        akan memblokirnya. Header Authorization dan isi request tidak disimpan.
      </Notice>
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <SelectField label="Metode" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: m }))} />
        <TextInput label="URL endpoint" value={url} onChange={setUrl} inputMode="url" mono placeholder="https://api.contoh.com/users" />
      </div>
      <ToolInput label="Header (satu per baris, format Nama: nilai)" value={headers} onChange={setHeaders} rows={4} placeholder={'Accept: application/json\nAuthorization: Bearer <token>'} />
      {canHaveBody && <ToolInput label="Body request" value={body} onChange={setBody} rows={6} placeholder='{"nama":"Budi"}' />}
      <TextInput label="Batas waktu (detik)" value={timeoutSec} onChange={setTimeoutSec} inputMode="numeric" mono maxLength={3} className="max-w-[10rem]" />
      <Actions>
        <Button variant="primary" onClick={send} disabled={loading}>
          {loading ? 'Mengirim…' : 'Kirim request'}
        </Button>
        {loading && <Button onClick={() => ctrl.current?.abort()}>Batalkan</Button>}
        <ResetButton onClick={reset} />
      </Actions>
      {!online && (
        <Notice tone="warning">
          <WifiOff className="mr-1 inline h-4 w-4" aria-hidden />
          Anda sedang offline. Tool ini membutuhkan koneksi internet.
        </Notice>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {notes.length > 0 && <WarningList items={notes} />}
      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(result.status)}>
              {result.status} {result.statusText}
            </Badge>
            <span className="text-sm text-muted">{Math.round(result.durationMs)} ms</span>
            {result.bytes > 0 && <span className="text-sm text-muted">{formatBytes(result.bytes)}</span>}
          </div>
          {result.bodyNote && <Notice>{result.bodyNote}</Notice>}
          <Segmented
            label="Tampilan respons"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'body', label: 'Body' },
              { value: 'headers', label: `Header (${result.headers.length})` },
            ]}
          />
          {tab === 'body' ? (
            <ToolOutput label="Body respons" value={result.body} placeholder="(body kosong)" copyLabel="Salin respons" />
          ) : (
            <>
              <ToolOutput label="Header respons" value={headersText} placeholder="(tidak ada header yang dapat dibaca)" />
              <p className="hint">Browser hanya menampilkan header yang diekspos server melalui CORS (Access-Control-Expose-Headers).</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
