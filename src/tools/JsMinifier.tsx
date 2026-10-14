import { useState } from 'react';
import { minify } from 'terser';
import { byteLength, formatBytes } from '../lib/text';
import { Actions, ResetButton, ToolInput, ToolOutput } from '../components/toolkit';
import { Button, Checkbox, ErrorMessage, Notice } from '../components/ui';

const MAX_CHARS = 500_000;

export function JsMinifier() {
  const [input, setInput] = useState('');
  const [mangle, setMangle] = useState(true);
  const [compress, setCompress] = useState(true);
  const [isModule, setIsModule] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setOutput('');
    if (!input.trim()) {
      setError('Masukkan kode JavaScript terlebih dahulu.');
      return;
    }
    if (input.length > MAX_CHARS) {
      setError(`Kode terlalu panjang (maksimal ${MAX_CHARS.toLocaleString('id-ID')} karakter).`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Terser hanya mem-parse dan menulis ulang kode; kode tidak pernah dieksekusi.
      const res = await minify(input, { compress, mangle, module: isModule, format: { comments: false } });
      if (typeof res.code === 'string') setOutput(res.code);
      else setError('Minifikasi tidak menghasilkan kode.');
    } catch (e) {
      const err = e as { message?: string; line?: number; col?: number };
      const where = err.line ? ` (baris ${err.line}, kolom ${err.col ?? 0})` : '';
      setError(`Kode JavaScript tidak valid${where}: ${err.message ?? 'kesalahan tidak diketahui'}. Jika kode memakai import/export, aktifkan mode module.`);
    } finally {
      setBusy(false);
    }
  };

  const before = byteLength(input);
  const after = byteLength(output);

  return (
    <>
      <ToolInput label="JavaScript" value={input} onChange={setInput} placeholder="function halo(nama) { return 'Halo ' + nama; }" rows={10} />
      <div className="grid gap-x-4 sm:grid-cols-3">
        <Checkbox label="Persingkat nama variabel" checked={mangle} onChange={setMangle} />
        <Checkbox label="Optimasi kode (compress)" checked={compress} onChange={setCompress} />
        <Checkbox label="Mode module (import/export)" checked={isModule} onChange={setIsModule} />
      </div>
      <Actions>
        <Button variant="primary" onClick={run} disabled={busy}>
          {busy ? 'Memproses…' : 'Minify JavaScript'}
        </Button>
        <ResetButton onClick={() => { setInput(''); setOutput(''); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {output && (
        <Notice tone="success">
          {formatBytes(before)} menjadi {formatBytes(after)} (hemat {before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0}%).
        </Notice>
      )}
      <ToolOutput label="Hasil" value={output} />
      <Notice tone="warning">
        Hasil minifikasi tidak dijamin aman untuk semua kode. Mempersingkat nama dapat merusak kode yang bergantung pada nama fungsi atau
        variabel (misalnya eval, new Function, atau Function.name). Uji hasilnya sebelum dipakai di produksi.
      </Notice>
    </>
  );
}
