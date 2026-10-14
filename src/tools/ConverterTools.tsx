import { useState } from 'react';
import { base64Decode, base64Encode, dateInputToMs, describeMs, hslToRgb, parseHex, parseIntInRange, relativeTime, rgbToHex, rgbToHsl, timestampToMs, urlDecode, urlEncode } from '../lib/convert';
import type { TsUnit, UrlEncodeMode } from '../lib/convert';
import { decodeEntities, encodeEntities, SUPPORTED_ENTITY_COUNT } from '../lib/html';
import { Actions, CopyButton, ResetButton, ToolInput, ToolOutput } from '../components/toolkit';
import { Button, Checkbox, ErrorMessage, KeyValue, Notice, Segmented, SelectField, TextInput } from '../components/ui';

// ---------- 8. Base64 ----------
export function Base64Tool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (mode === 'encode') {
      if (!input) {
        setError('Masukkan teks terlebih dahulu.');
        setOutput('');
        return;
      }
      setOutput(base64Encode(input, urlSafe));
      setError(null);
      return;
    }
    const r = base64Decode(input);
    if (r.ok) {
      setOutput(r.value);
      setError(null);
    } else {
      setOutput('');
      setError(r.error);
    }
  };
  const change = (m: 'encode' | 'decode') => {
    setMode(m);
    setOutput('');
    setError(null);
  };

  return (
    <>
      <Segmented
        label="Mode"
        value={mode}
        onChange={change}
        options={[
          { value: 'encode', label: 'Encode' },
          { value: 'decode', label: 'Decode' },
        ]}
      />
      <ToolInput label={mode === 'encode' ? 'Teks' : 'Teks Base64'} value={input} onChange={setInput} rows={7} placeholder={mode === 'encode' ? 'Halo dunia' : 'SGFsbyBkdW5pYQ=='} />
      {mode === 'encode' && <Checkbox label="Varian URL-safe (− dan _, tanpa padding =)" checked={urlSafe} onChange={setUrlSafe} />}
      <Actions>
        <Button variant="primary" onClick={run}>
          {mode === 'encode' ? 'Encode ke Base64' : 'Decode dari Base64'}
        </Button>
        <ResetButton onClick={() => { setInput(''); setOutput(''); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ToolOutput label="Hasil" value={output} />
      <Notice>Teks diproses sebagai UTF-8, jadi karakter Unicode seperti huruf beraksen dan emoji ditangani dengan benar. Base64 bukan enkripsi.</Notice>
    </>
  );
}

// ---------- 9. URL ----------
export function UrlTool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [kind, setKind] = useState<UrlEncodeMode>('component');
  const [plus, setPlus] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const r = mode === 'encode' ? urlEncode(input, kind) : urlDecode(input, plus);
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
      <Segmented
        label="Mode"
        value={mode}
        onChange={(m) => { setMode(m); setOutput(''); setError(null); }}
        options={[
          { value: 'encode', label: 'Encode' },
          { value: 'decode', label: 'Decode' },
        ]}
      />
      <ToolInput label="Teks" value={input} onChange={setInput} rows={6} placeholder={mode === 'encode' ? 'nama=Budi Santoso&kota=Jakarta' : 'nama%3DBudi%20Santoso'} />
      {mode === 'encode' ? (
        <SelectField
          label="Jenis encoding"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'component', label: 'Komponen URL (encodeURIComponent)' },
            { value: 'full', label: 'URL lengkap (encodeURI, karakter : / ? & tetap)' },
          ]}
        />
      ) : (
        <Checkbox label="Ubah tanda + menjadi spasi (gaya form)" checked={plus} onChange={setPlus} />
      )}
      <Actions>
        <Button variant="primary" onClick={run}>
          {mode === 'encode' ? 'Encode URL' : 'Decode URL'}
        </Button>
        <ResetButton onClick={() => { setInput(''); setOutput(''); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ToolOutput label="Hasil" value={output} />
    </>
  );
}

// ---------- 10. HTML entity ----------
export function HtmlEntityTool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [nonAscii, setNonAscii] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [unknown, setUnknown] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!input) {
      setError('Masukkan teks terlebih dahulu.');
      setOutput('');
      setUnknown([]);
      return;
    }
    setError(null);
    if (mode === 'encode') {
      setOutput(encodeEntities(input, nonAscii));
      setUnknown([]);
    } else {
      const r = decodeEntities(input);
      setOutput(r.output);
      setUnknown(r.unknown);
    }
  };

  return (
    <>
      <Segmented
        label="Mode"
        value={mode}
        onChange={(m) => { setMode(m); setOutput(''); setUnknown([]); setError(null); }}
        options={[
          { value: 'encode', label: 'Encode' },
          { value: 'decode', label: 'Decode' },
        ]}
      />
      <ToolInput label={mode === 'encode' ? 'Teks atau HTML' : 'Teks dengan entity'} value={input} onChange={setInput} rows={7} placeholder={mode === 'encode' ? '<p class="a">Tom & Jerry</p>' : '&lt;p&gt;Tom &amp; Jerry&lt;/p&gt;'} />
      {mode === 'encode' && <Checkbox label="Ubah juga karakter non-ASCII menjadi &#angka;" checked={nonAscii} onChange={setNonAscii} />}
      <Actions>
        <Button variant="primary" onClick={run}>
          {mode === 'encode' ? 'Encode entity' : 'Decode entity'}
        </Button>
        <ResetButton onClick={() => { setInput(''); setOutput(''); setUnknown([]); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {unknown.length > 0 && <Notice tone="warning">Entity tidak dikenali dan dibiarkan apa adanya: {unknown.slice(0, 10).join(' ')}</Notice>}
      <ToolOutput label="Hasil (teks)" value={output} />
      <Notice>
        Hasil selalu ditampilkan sebagai teks dan tidak pernah dirender sebagai HTML. Decode mendukung semua entity numerik serta {SUPPORTED_ENTITY_COUNT} entity
        bernama yang umum.
      </Notice>
    </>
  );
}

// ---------- 11. Color ----------
interface ColorFields {
  hex: string;
  r: string;
  g: string;
  b: string;
  h: string;
  s: string;
  l: string;
}

function fieldsFromRgb(rgb: { r: number; g: number; b: number }): ColorFields {
  const hsl = rgbToHsl(rgb);
  return { hex: rgbToHex(rgb), r: String(rgb.r), g: String(rgb.g), b: String(rgb.b), h: String(hsl.h), s: String(hsl.s), l: String(hsl.l) };
}

const DEFAULT_RGB = { r: 59, g: 130, b: 246 };

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="font-mono text-sm [overflow-wrap:anywhere]">{value || '—'}</p>
      </div>
      <CopyButton text={value} />
    </div>
  );
}

export function ColorConverter() {
  const [f, setF] = useState<ColorFields>(() => fieldsFromRgb(DEFAULT_RGB));

  const rgb = (() => {
    const r = parseIntInRange(f.r, 0, 255);
    const g = parseIntInRange(f.g, 0, 255);
    const b = parseIntInRange(f.b, 0, 255);
    return r !== null && g !== null && b !== null ? { r, g, b } : null;
  })();
  const hslVals = (() => {
    const h = parseIntInRange(f.h, 0, 360);
    const s = parseIntInRange(f.s, 0, 100);
    const l = parseIntInRange(f.l, 0, 100);
    return h !== null && s !== null && l !== null ? { h, s, l } : null;
  })();
  const hexRgb = parseHex(f.hex);

  const setHex = (v: string) => {
    const parsed = parseHex(v);
    setF(parsed ? { ...fieldsFromRgb(parsed), hex: v } : { ...f, hex: v });
  };
  const setRgbField = (key: 'r' | 'g' | 'b', v: string) => {
    const next = { ...f, [key]: v };
    const r = parseIntInRange(next.r, 0, 255);
    const g = parseIntInRange(next.g, 0, 255);
    const b = parseIntInRange(next.b, 0, 255);
    if (r !== null && g !== null && b !== null) setF({ ...fieldsFromRgb({ r, g, b }), r: next.r, g: next.g, b: next.b });
    else setF(next);
  };
  const setHslField = (key: 'h' | 's' | 'l', v: string) => {
    const next = { ...f, [key]: v };
    const h = parseIntInRange(next.h, 0, 360);
    const s = parseIntInRange(next.s, 0, 100);
    const l = parseIntInRange(next.l, 0, 100);
    if (h !== null && s !== null && l !== null) setF({ ...fieldsFromRgb(hslToRgb({ h, s, l })), h: next.h, s: next.s, l: next.l });
    else setF(next);
  };

  const current = hexRgb;
  const hexOut = current ? rgbToHex(current) : '';
  const rgbOut = current ? `rgb(${current.r}, ${current.g}, ${current.b})` : '';
  const hsl = current ? rgbToHsl(current) : null;
  const hslOut = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
        <div className="space-y-4">
          <TextInput label="HEX" value={f.hex} onChange={setHex} mono placeholder="#3B82F6" maxLength={7} error={f.hex && !hexRgb ? 'HEX harus 3 atau 6 digit (0–9, A–F), dengan atau tanpa #.' : null} />
          <fieldset>
            <legend className="label">RGB (0–255)</legend>
            <div className="grid grid-cols-3 gap-2">
              <TextInput label="R" value={f.r} onChange={(v) => setRgbField('r', v)} inputMode="numeric" mono maxLength={3} />
              <TextInput label="G" value={f.g} onChange={(v) => setRgbField('g', v)} inputMode="numeric" mono maxLength={3} />
              <TextInput label="B" value={f.b} onChange={(v) => setRgbField('b', v)} inputMode="numeric" mono maxLength={3} />
            </div>
            {!rgb && <p className="mt-1.5 text-xs text-danger" role="alert">Nilai R, G, dan B harus bilangan bulat 0–255.</p>}
          </fieldset>
          <fieldset>
            <legend className="label">HSL (H 0–360, S dan L 0–100)</legend>
            <div className="grid grid-cols-3 gap-2">
              <TextInput label="H" value={f.h} onChange={(v) => setHslField('h', v)} inputMode="numeric" mono maxLength={3} />
              <TextInput label="S %" value={f.s} onChange={(v) => setHslField('s', v)} inputMode="numeric" mono maxLength={3} />
              <TextInput label="L %" value={f.l} onChange={(v) => setHslField('l', v)} inputMode="numeric" mono maxLength={3} />
            </div>
            {!hslVals && <p className="mt-1.5 text-xs text-danger" role="alert">H harus 0–360 serta S dan L harus 0–100 (bilangan bulat).</p>}
          </fieldset>
        </div>
        <div>
          <p className="label">Pratinjau</p>
          <div
            role="img"
            aria-label={current ? `Pratinjau warna ${hexOut}` : 'Belum ada warna valid'}
            className="h-28 rounded-lg border border-line sm:h-40"
            style={{ backgroundColor: current ? hexOut : 'transparent' }}
          />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <CopyRow label="HEX" value={hexOut} />
        <CopyRow label="RGB" value={rgbOut} />
        <CopyRow label="HSL" value={hslOut} />
      </div>
      <Actions>
        <ResetButton onClick={() => setF(fieldsFromRgb(DEFAULT_RGB))} />
      </Actions>
      <Notice>Perubahan pada satu format langsung memperbarui format lain. HSL dibulatkan ke bilangan bulat sehingga konversi bolak-balik dapat berselisih 1–2 satuan.</Notice>
    </>
  );
}

// ---------- 12. Unix timestamp ----------
export function TimestampTool() {
  const [mode, setMode] = useState<'toDate' | 'toTs'>('toDate');
  const [ts, setTs] = useState('');
  const [unit, setUnit] = useState<TsUnit>('auto');
  const [dateValue, setDateValue] = useState('');
  const [utc, setUtc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ k: string; v: string }[]>([]);

  const show = (ms: number, extra: { k: string; v: string }[] = []) => {
    const d = describeMs(ms);
    setRows([
      ...extra,
      { k: 'Lokal', v: d.local },
      { k: 'Zona waktu', v: d.timeZone },
      { k: 'UTC', v: d.utc },
      { k: 'ISO 8601', v: d.iso },
      { k: 'Detik', v: String(d.seconds) },
      { k: 'Milidetik', v: String(d.ms) },
      { k: 'Relatif', v: relativeTime(ms) },
    ]);
    setError(null);
  };

  const run = () => {
    if (mode === 'toDate') {
      const r = timestampToMs(ts, unit);
      if (!r.ok) {
        setError(r.error);
        setRows([]);
        return;
      }
      show(r.value.ms, [{ k: 'Satuan terdeteksi', v: r.value.unit === 's' ? 'detik' : 'milidetik' }]);
    } else {
      const r = dateInputToMs(dateValue, utc);
      if (!r.ok) {
        setError(r.error);
        setRows([]);
        return;
      }
      show(r.value);
    }
  };

  const copyText = rows.map((r) => `${r.k}: ${r.v}`).join('\n');
  const reset = () => { setTs(''); setDateValue(''); setRows([]); setError(null); };

  return (
    <>
      <Segmented
        label="Arah konversi"
        value={mode}
        onChange={(m) => { setMode(m); setRows([]); setError(null); }}
        options={[
          { value: 'toDate', label: 'Timestamp ke tanggal' },
          { value: 'toTs', label: 'Tanggal ke timestamp' },
        ]}
      />
      {mode === 'toDate' ? (
        <div className="space-y-4">
          <TextInput label="Timestamp Unix" value={ts} onChange={setTs} inputMode="numeric" mono placeholder="1700000000" />
          <SelectField
            label="Satuan"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'auto', label: 'Otomatis (≥ 100 miliar dianggap milidetik)' },
              { value: 's', label: 'Detik' },
              { value: 'ms', label: 'Milidetik' },
            ]}
          />
          <Button onClick={() => setTs(String(Math.floor(Date.now() / 1000)))}>Isi dengan waktu sekarang</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <TextInput label="Tanggal dan waktu" type="datetime-local" step={1} value={dateValue} onChange={setDateValue} />
          <Checkbox label="Anggap input sebagai UTC (bukan zona waktu perangkat)" checked={utc} onChange={setUtc} />
        </div>
      )}
      <Actions>
        <Button variant="primary" onClick={run}>
          Konversi
        </Button>
        <ResetButton onClick={reset} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {rows.length > 0 && (
        <div className="space-y-3">
          <KeyValue items={rows.map((r) => ({ k: r.k, v: r.v }))} />
          <CopyButton text={copyText} label="Salin semua" />
        </div>
      )}
    </>
  );
}
