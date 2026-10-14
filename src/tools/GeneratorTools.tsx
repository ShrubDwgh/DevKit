import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { generateLorem, generatePassword, LOREM_MAX_PARAGRAPHS, LOREM_MAX_SENTENCES, passwordComposition, passwordEntropyBits, strengthLabel, uuidv4 } from '../lib/generate';
import type { PasswordOptions } from '../lib/generate';
import { buildMetaTags, ROBOTS_OPTIONS } from '../lib/web';
import type { MetaInput } from '../lib/web';
import { Actions, CopyButton, ResetButton, ToolOutput } from '../components/toolkit';
import { Button, Checkbox, ErrorMessage, Notice, SelectField, TextInput, WarningList } from '../components/ui';

// ---------- 13. UUID ----------
const MAX_UUIDS = 100;

export function UuidGenerator() {
  const [count, setCount] = useState('1');
  const [upper, setUpper] = useState(false);
  const [noHyphen, setNoHyphen] = useState(false);
  const [ids, setIds] = useState<string[]>(() => [uuidv4()]);
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > MAX_UUIDS) {
      setError(`Jumlah harus bilangan bulat antara 1 dan ${MAX_UUIDS}.`);
      return;
    }
    setError(null);
    setIds(Array.from({ length: n }, () => uuidv4()));
  };
  const text = ids
    .map((id) => {
      let v = noHyphen ? id.replace(/-/g, '') : id;
      if (upper) v = v.toUpperCase();
      return v;
    })
    .join('\n');

  return (
    <>
      <TextInput label={`Jumlah UUID (1–${MAX_UUIDS})`} value={count} onChange={setCount} inputMode="numeric" mono maxLength={3} error={error} />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Checkbox label="Huruf besar" checked={upper} onChange={setUpper} />
        <Checkbox label="Tanpa tanda hubung" checked={noHyphen} onChange={setNoHyphen} />
      </div>
      <Actions>
        <Button variant="primary" onClick={generate}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Buat UUID
        </Button>
        <ResetButton onClick={() => { setCount('1'); setUpper(false); setNoHyphen(false); setError(null); setIds([uuidv4()]); }} />
      </Actions>
      <ToolOutput label={`Hasil (${ids.length})`} value={text} />
      <Notice>UUID v4 dibuat dari generator acak kriptografis browser (crypto.randomUUID atau crypto.getRandomValues), bukan Math.random.</Notice>
    </>
  );
}

// ---------- 14. Password ----------
const DEFAULT_PW: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false };

export function PasswordGenerator() {
  const [opts, setOpts] = useState<PasswordOptions>(DEFAULT_PW);
  const [password, setPassword] = useState<string>(() => {
    const r = generatePassword(DEFAULT_PW);
    return r.ok ? r.value : '';
  });
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  // Password hanya disimpan di state komponen ini: tidak ke localStorage, riwayat, atau server.

  const set = <K extends keyof PasswordOptions>(k: K, v: PasswordOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const generate = () => {
    const r = generatePassword(opts);
    if (r.ok) {
      setPassword(r.value);
      setError(null);
    } else {
      setPassword('');
      setError(r.error);
    }
  };
  const comp = password ? passwordComposition(password) : null;
  const bits = passwordEntropyBits(opts);
  const label = strengthLabel(bits);
  const pct = Math.min(100, Math.round((bits / 128) * 100));

  return (
    <>
      <div>
        <label htmlFor="pw-length" className="label">
          Panjang: {opts.length} karakter
        </label>
        <input
          id="pw-length"
          type="range"
          min={4}
          max={128}
          value={opts.length}
          onChange={(e) => set('length', Number(e.target.value))}
          className="h-11 w-full accent-[rgb(var(--c-accent-strong))]"
        />
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Checkbox label="Huruf kecil (a–z)" checked={opts.lower} onChange={(v) => set('lower', v)} />
        <Checkbox label="Huruf besar (A–Z)" checked={opts.upper} onChange={(v) => set('upper', v)} />
        <Checkbox label="Angka (0–9)" checked={opts.digits} onChange={(v) => set('digits', v)} />
        <Checkbox label="Simbol (!@#$…)" checked={opts.symbols} onChange={(v) => set('symbols', v)} />
        <Checkbox label="Hindari karakter mirip (0 O 1 l I)" checked={opts.avoidAmbiguous} onChange={(v) => set('avoidAmbiguous', v)} />
      </div>
      <Actions>
        <Button variant="primary" onClick={generate}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Buat password
        </Button>
        <ResetButton onClick={() => { setOpts(DEFAULT_PW); setError(null); const r = generatePassword(DEFAULT_PW); setPassword(r.ok ? r.value : ''); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {password && (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">Password</span>
              <div className="flex gap-1.5">
                <Button className="min-h-10 px-3" onClick={() => setVisible((v) => !v)} aria-pressed={!visible}>
                  {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  {visible ? 'Sembunyikan' : 'Tampilkan'}
                </Button>
                <CopyButton text={password} />
              </div>
            </div>
            <p className="output select-all font-mono text-base tracking-wide">{visible ? password : '•'.repeat(password.length)}</p>
          </div>
          {comp && (
            <div className="space-y-2 rounded-lg border border-line p-3 text-sm">
              <p className="font-medium">Komposisi</p>
              <p className="text-muted">
                {comp.lower} huruf kecil · {comp.upper} huruf besar · {comp.digits} angka · {comp.symbols} simbol
              </p>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated" aria-hidden>
                  <div className="h-full rounded-full bg-accent-strong" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0">
                  {label} (~{Math.round(bits)} bit)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      <Notice>
        Password dibuat secara lokal di browser Anda dengan crypto.getRandomValues. Password tidak dikirim ke server, tidak disimpan di localStorage, dan tidak masuk
        riwayat. Nilai bit hanyalah perkiraan kasar. Clipboard dapat terbaca aplikasi lain di perangkat Anda, jadi hapus salinannya setelah dipakai.
      </Notice>
    </>
  );
}

// ---------- 16. Lorem ipsum ----------
export function LoremGenerator() {
  const [paragraphs, setParagraphs] = useState('3');
  const [sentences, setSentences] = useState('5');
  const [classic, setClassic] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const p = Number(paragraphs);
    const s = Number(sentences);
    if (!Number.isInteger(p) || p < 1 || p > LOREM_MAX_PARAGRAPHS) {
      setError(`Jumlah paragraf harus bilangan bulat 1–${LOREM_MAX_PARAGRAPHS}.`);
      return;
    }
    if (!Number.isInteger(s) || s < 1 || s > LOREM_MAX_SENTENCES) {
      setError(`Jumlah kalimat per paragraf harus bilangan bulat 1–${LOREM_MAX_SENTENCES}.`);
      return;
    }
    setError(null);
    setOutput(generateLorem(p, s, classic));
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={`Paragraf (1–${LOREM_MAX_PARAGRAPHS})`} value={paragraphs} onChange={setParagraphs} inputMode="numeric" mono maxLength={2} />
        <TextInput label={`Kalimat per paragraf (1–${LOREM_MAX_SENTENCES})`} value={sentences} onChange={setSentences} inputMode="numeric" mono maxLength={2} />
      </div>
      <Checkbox label="Mulai dengan “Lorem ipsum dolor sit amet…”" checked={classic} onChange={setClassic} />
      <Actions>
        <Button variant="primary" onClick={run}>
          Buat teks
        </Button>
        <ResetButton onClick={() => { setParagraphs('3'); setSentences('5'); setClassic(true); setOutput(''); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ToolOutput label="Hasil" value={output} />
      <Notice>Jumlah keluaran dibatasi agar browser tetap responsif.</Notice>
    </>
  );
}

// ---------- 17. Meta tag ----------
const META_DEFAULT: MetaInput = { title: '', description: '', url: '', author: '', themeColor: '', robots: ROBOTS_OPTIONS[0], includeBasics: true };

export function MetaTagGenerator() {
  const [m, setM] = useState<MetaInput>(META_DEFAULT);
  const [code, setCode] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; url: string; description: string } | null>(null);

  const set = <K extends keyof MetaInput>(k: K, v: MetaInput[K]) => setM((o) => ({ ...o, [k]: v }));
  const run = () => {
    const r = buildMetaTags(m);
    if (!r.ok) {
      setError(r.error);
      setCode('');
      setWarnings([]);
      setPreview(null);
      return;
    }
    setError(null);
    setCode(r.value.code);
    setWarnings(r.value.warnings);
    setPreview({ title: m.title.trim(), url: m.url.trim(), description: m.description.trim() });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput className="sm:col-span-2" label="Judul website *" value={m.title} onChange={(v) => set('title', v)} placeholder="DevKit — Developer Tools" hint={`${m.title.trim().length} karakter (disarankan ≤ 60)`} />
        <div className="sm:col-span-2">
          <label htmlFor="meta-desc" className="label">
            Deskripsi
          </label>
          <textarea
            id="meta-desc"
            rows={3}
            value={m.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ringkasan halaman yang tampil di hasil pencarian."
            className="input resize-y"
          />
          <p className="hint">{m.description.trim().length} karakter (disarankan ≤ 160)</p>
        </div>
        <TextInput label="URL website" value={m.url} onChange={(v) => set('url', v)} inputMode="url" placeholder="https://contoh.com/" hint="Dipakai untuk canonical." />
        <TextInput label="Nama penulis" value={m.author} onChange={(v) => set('author', v)} placeholder="Nama Anda" />
        <TextInput label="Tema warna" value={m.themeColor} onChange={(v) => set('themeColor', v)} mono placeholder="#3B82F6" hint="Warna bilah browser di perangkat seluler." />
        <SelectField label="Robots" value={m.robots} onChange={(v) => set('robots', v)} options={ROBOTS_OPTIONS.map((o) => ({ value: o, label: o }))} />
      </div>
      <Checkbox label="Sertakan charset dan viewport" checked={m.includeBasics} onChange={(v) => set('includeBasics', v)} />
      <Actions>
        <Button variant="primary" onClick={run}>
          Buat meta tag
        </Button>
        <ResetButton onClick={() => { setM(META_DEFAULT); setCode(''); setWarnings([]); setError(null); setPreview(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <WarningList items={warnings} />
      <ToolOutput label="Kode meta tag" value={code} placeholder="Isi form lalu tekan “Buat meta tag”." />
      {preview && (
        <div>
          <p className="label">Perkiraan tampilan di hasil pencarian</p>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="truncate text-xs text-muted">{preview.url || 'https://contoh.com/'}</p>
            <p className="mt-0.5 text-base text-accent [overflow-wrap:anywhere]">{preview.title.slice(0, 60)}{preview.title.length > 60 ? '…' : ''}</p>
            <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">{preview.description.slice(0, 160)}{preview.description.length > 160 ? '…' : ''}</p>
          </div>
        </div>
      )}
      <Notice>
        Tool ini hanya menghasilkan kode. Salin dan tempel ke bagian &lt;head&gt; website Anda; meta tag tidak terpasang otomatis. Tampilan di mesin
        pencari dapat berbeda dari pratinjau.
      </Notice>
    </>
  );
}
