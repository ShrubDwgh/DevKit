import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { describeJson, formatJson, parseJson } from '../lib/json';
import type { JsonInfo } from '../lib/json';
import { formatHtml } from '../lib/html';
import { minifyCss } from '../lib/css';
import { VALID_FLAGS } from '../lib/regex';
import type { RegexMatch, RegexOutcome } from '../lib/regex';
import { runRegexSafe } from '../lib/regexRunner';
import { byteLength, formatBytes } from '../lib/text';
import { Actions, ResetButton, ToolInput, ToolOutput } from '../components/toolkit';
import { Badge, Button, Checkbox, ErrorMessage, KeyValue, Notice, Segmented, TextInput, WarningList } from '../components/ui';

// ---------- 1. JSON Formatter ----------
export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'2' | '4' | 'min'>('2');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const r = formatJson(input, mode === 'min' ? 0 : Number(mode));
    if (r.ok) {
      setOutput(r.value);
      setError(null);
    } else {
      setOutput('');
      setError(r.error);
    }
  };
  const reset = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <>
      <ToolInput label="JSON" value={input} onChange={setInput} placeholder='{"nama":"DevKit","tools":23}' rows={10} />
      <Actions>
        <Segmented
          label="Format keluaran"
          value={mode}
          onChange={setMode}
          options={[
            { value: '2', label: '2 spasi' },
            { value: '4', label: '4 spasi' },
            { value: 'min', label: 'Ringkas' },
          ]}
        />
        <Button variant="primary" onClick={run}>
          Format JSON
        </Button>
        <ResetButton onClick={reset} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {output && !error && <Notice tone="success">JSON valid dan berhasil diformat ({formatBytes(byteLength(output))}).</Notice>}
      <ToolOutput label="Hasil" value={output} />
      <Notice>Angka yang sangat besar dapat kehilangan presisi karena JSON diproses dengan angka JavaScript.</Notice>
    </>
  );
}

// ---------- 2. JSON Validator ----------
type JsonCheck =
  | { valid: true; info: JsonInfo; size: number }
  | { valid: false; error: string; line?: number; column?: number; snippet?: string };

export function JsonValidator() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<JsonCheck | null>(null);

  const run = () => {
    const r = parseJson(input);
    if (r.ok) {
      setResult({ valid: true, info: describeJson(r.value), size: byteLength(input) });
      return;
    }
    const lineText = r.line ? input.split('\n')[r.line - 1] : undefined;
    setResult({
      valid: false,
      error: r.error,
      line: r.line,
      column: r.column,
      snippet: lineText !== undefined ? lineText.slice(0, 200) : undefined,
    });
  };

  return (
    <>
      <ToolInput label="JSON" value={input} onChange={(v) => { setInput(v); setResult(null); }} placeholder='{"a": 1}' rows={10} />
      <Actions>
        <Button variant="primary" onClick={run}>
          Validasi JSON
        </Button>
        <ResetButton onClick={() => { setInput(''); setResult(null); }} />
      </Actions>
      {result && result.valid && (
        <div className="space-y-3" role="status">
          <div className="flex items-center gap-2">
            <Badge tone="success">
              <Check className="mr-1 h-3.5 w-3.5" aria-hidden />
              Valid
            </Badge>
            <span className="text-sm text-muted">Sintaks JSON benar.</span>
          </div>
          <KeyValue
            items={[
              { k: 'Tipe akar', v: result.info.type },
              { k: 'Ringkasan', v: result.info.summary },
              { k: 'Kedalaman', v: String(result.info.depth) },
              { k: 'Ukuran', v: formatBytes(result.size) },
            ]}
          />
        </div>
      )}
      {result && !result.valid && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="danger">
              <X className="mr-1 h-3.5 w-3.5" aria-hidden />
              Tidak valid
            </Badge>
            {result.line && (
              <span className="text-sm text-muted">
                Baris {result.line}, kolom {result.column}
              </span>
            )}
          </div>
          <ErrorMessage>{result.error}</ErrorMessage>
          {result.snippet !== undefined && <pre className="output min-h-0">{result.snippet || '(baris kosong)'}</pre>}
        </div>
      )}
    </>
  );
}

// ---------- 3. HTML Formatter ----------
export function HtmlFormatter() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<'2' | '4'>('2');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const r = formatHtml(input, Number(indent));
    if (r.ok) {
      setOutput(r.value);
      setError(null);
    } else {
      setOutput('');
      setError(r.error);
    }
  };

  return (
    <>
      <ToolInput label="HTML" value={input} onChange={setInput} placeholder="<div><p>Halo</p></div>" rows={10} />
      <Actions>
        <Segmented
          label="Indentasi"
          value={indent}
          onChange={setIndent}
          options={[
            { value: '2', label: '2 spasi' },
            { value: '4', label: '4 spasi' },
          ]}
        />
        <Button variant="primary" onClick={run}>
          Rapikan HTML
        </Button>
        <ResetButton onClick={() => { setInput(''); setOutput(''); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ToolOutput label="Hasil" value={output} />
      <Notice>
        Kode hanya diproses sebagai teks dan tidak pernah dijalankan. Formatter ini tidak memahami CSS, sehingga jarak antar elemen inline
        dapat berubah. Isi script, style, pre, dan textarea dipertahankan.
      </Notice>
    </>
  );
}

// ---------- 4. CSS Minifier ----------
export function CssMinifier() {
  const [input, setInput] = useState('');
  const [keep, setKeep] = useState(true);
  const [output, setOutput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!input.trim()) {
      setError('Masukkan CSS terlebih dahulu.');
      setOutput('');
      setWarnings([]);
      return;
    }
    const r = minifyCss(input, keep);
    setOutput(r.output);
    setWarnings(r.warnings);
    setError(null);
  };
  const before = byteLength(input);
  const after = byteLength(output);

  return (
    <>
      <ToolInput label="CSS" value={input} onChange={setInput} placeholder="a { color: red; }" rows={10} />
      <Checkbox label="Pertahankan komentar penting /*! … */" checked={keep} onChange={setKeep} />
      <Actions>
        <Button variant="primary" onClick={run}>
          Minify CSS
        </Button>
        <ResetButton onClick={() => { setInput(''); setOutput(''); setWarnings([]); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <WarningList items={warnings} />
      {output && (
        <Notice tone="success">
          {formatBytes(before)} menjadi {formatBytes(after)} (hemat {before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0}%).
        </Notice>
      )}
      <ToolOutput label="Hasil" value={output} />
      <Notice>Minifier ini menghapus komentar dan spasi serta menjaga isi string dan url(). Nilai seperti warna dan satuan tidak diubah.</Notice>
    </>
  );
}

// ---------- 6. Regex Tester ----------
function highlight(text: string, matches: RegexMatch[]): { t: string; hit: boolean }[] {
  const segs: { t: string; hit: boolean }[] = [];
  let pos = 0;
  for (const m of matches) {
    if (m.end <= m.index || m.index < pos) continue;
    if (m.index > pos) segs.push({ t: text.slice(pos, m.index), hit: false });
    segs.push({ t: text.slice(m.index, m.end), hit: true });
    pos = m.end;
  }
  if (pos < text.length) segs.push({ t: text.slice(pos), hit: false });
  return segs;
}

const FLAG_LABEL: Record<string, string> = {
  g: 'g (global)',
  i: 'i (abaikan huruf besar/kecil)',
  m: 'm (multibaris)',
  s: 's (titik cocok baris baru)',
  u: 'u (unicode)',
  y: 'y (sticky)',
};

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<string[]>(['g']);
  const [text, setText] = useState('');
  const [outcome, setOutcome] = useState<RegexOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const id = ++seq.current;
    if (!pattern) {
      setOutcome(null);
      setRunning(false);
      return;
    }
    setRunning(true);
    const r = await runRegexSafe(pattern, VALID_FLAGS.filter((f) => flags.includes(f)).join(''), text);
    if (id === seq.current) {
      setOutcome(r);
      setRunning(false);
    }
  }, [pattern, flags, text]);

  // Pengujian berjalan otomatis (di Web Worker, dengan batas waktu) setelah jeda mengetik.
  useEffect(() => {
    const t = window.setTimeout(run, 350);
    return () => window.clearTimeout(t);
  }, [run]);

  const toggle = (f: string) => setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const matches = outcome && outcome.ok ? outcome.matches : [];
  const canHighlight = outcome && outcome.ok && text.length <= 20000;

  return (
    <>
      <TextInput label="Pola regex" value={pattern} onChange={setPattern} placeholder="(\d+)-(?<nama>\w+)" mono hint="Tulis pola tanpa tanda garis miring pembuka dan penutup." />
      <fieldset>
        <legend className="label">Flag</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {VALID_FLAGS.map((f) => (
            <Checkbox key={f} label={FLAG_LABEL[f]} checked={flags.includes(f)} onChange={() => toggle(f)} />
          ))}
        </div>
      </fieldset>
      <ToolInput label="Teks uji" value={text} onChange={setText} placeholder="Tempel teks yang ingin diuji" rows={6} />
      <Actions>
        <Button variant="primary" onClick={run} disabled={!pattern || running}>
          {running ? 'Menguji…' : 'Uji sekarang'}
        </Button>
        <ResetButton onClick={() => { setPattern(''); setText(''); setFlags(['g']); setOutcome(null); }} />
      </Actions>
      {outcome && !outcome.ok && <ErrorMessage>{outcome.error}</ErrorMessage>}
      {outcome && outcome.ok && (
        <div className="space-y-4" aria-live="polite">
          <Notice tone={matches.length ? 'success' : 'info'}>
            {matches.length ? `${matches.length}${outcome.truncated ? '+' : ''} kecocokan ditemukan` : 'Tidak ada kecocokan'} ({outcome.elapsedMs.toFixed(1)} ms).
            {outcome.truncated && ' Daftar dibatasi 1.000 kecocokan pertama.'}
            {!flags.includes('g') && !flags.includes('y') && matches.length > 0 && ' Aktifkan flag g untuk mencari semua kecocokan.'}
          </Notice>
          {canHighlight && matches.length > 0 && (
            <div>
              <p className="label">Teks dengan sorotan</p>
              <pre className="output">
                {highlight(text, matches).map((s, i) =>
                  s.hit ? (
                    <mark key={i} className="rounded bg-warning/30 px-0.5 text-fg underline decoration-warning">
                      {s.t}
                    </mark>
                  ) : (
                    <span key={i}>{s.t}</span>
                  ),
                )}
              </pre>
            </div>
          )}
          {matches.length > 0 && (
            <div>
              <p className="label">Daftar kecocokan</p>
              <ol className="max-h-96 space-y-2 overflow-auto">
                {matches.slice(0, 100).map((m, i) => (
                  <li key={`${m.index}-${i}`} className="rounded-lg border border-line p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>#{i + 1}</span>
                      <span>
                        posisi {m.index}–{m.end}
                      </span>
                      <span>
                        baris {m.line}, kolom {m.column}
                      </span>
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap font-mono [overflow-wrap:anywhere]">{m.text === '' ? '(kosong)' : m.text}</pre>
                    {m.groups.length > 0 && (
                      <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted">
                        {m.groups.map((g, gi) => (
                          <li key={gi} className="[overflow-wrap:anywhere]">
                            grup {gi + 1}: {g === undefined ? '(tidak cocok)' : JSON.stringify(g)}
                          </li>
                        ))}
                        {Object.entries(m.named).map(([k, v]) => (
                          <li key={k} className="[overflow-wrap:anywhere]">
                            {k}: {v === undefined ? '(tidak cocok)' : JSON.stringify(v)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
              {matches.length > 100 && <p className="hint">Menampilkan 100 dari {matches.length} kecocokan.</p>}
            </div>
          )}
        </div>
      )}
      <Notice>
        Regex dijalankan oleh mesin JavaScript browser Anda di Web Worker dan dihentikan otomatis jika terlalu lama (perlindungan terhadap
        pola yang memicu backtracking berlebihan). Perilaku di bahasa lain dapat berbeda.
      </Notice>
    </>
  );
}
