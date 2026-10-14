import { useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { downloadDataUrl } from '../lib/browser';
import { Actions, ResetButton, ToolInput } from '../components/toolkit';
import { Button, ErrorMessage, Notice, SelectField } from '../components/ui';

type Ecc = 'L' | 'M' | 'Q' | 'H';

export function QrCodeGenerator() {
  const [text, setText] = useState('');
  const [ecc, setEcc] = useState<Ecc>('M');
  const [size, setSize] = useState('512');
  const [dataUrl, setDataUrl] = useState('');
  const [encoded, setEncoded] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!text.trim()) {
      setError('Masukkan teks atau URL terlebih dahulu.');
      setDataUrl('');
      return;
    }
    setBusy(true);
    try {
      const url = await QRCode.toDataURL(text, {
        errorCorrectionLevel: ecc,
        margin: 2,
        width: Number(size),
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      setDataUrl(url);
      setEncoded(text);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setDataUrl('');
      setError(
        /too big|too long/i.test(msg)
          ? 'Teks terlalu panjang untuk dimuat dalam satu QR code. Persingkat teks atau turunkan tingkat koreksi kesalahan.'
          : 'QR code gagal dibuat. Periksa teks yang dimasukkan.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ToolInput label="Teks atau URL" value={text} onChange={setText} rows={4} mono={false} placeholder="https://contoh.com" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Koreksi kesalahan"
          value={ecc}
          onChange={setEcc}
          options={[
            { value: 'L', label: 'Rendah (7%)' },
            { value: 'M', label: 'Sedang (15%)' },
            { value: 'Q', label: 'Kuartil (25%)' },
            { value: 'H', label: 'Tinggi (30%)' },
          ]}
          hint="Makin tinggi, makin tahan rusak tetapi kodenya makin padat."
        />
        <SelectField
          label="Ukuran PNG"
          value={size}
          onChange={setSize}
          options={[
            { value: '256', label: '256 × 256 px' },
            { value: '512', label: '512 × 512 px' },
            { value: '1024', label: '1024 × 1024 px' },
          ]}
        />
      </div>
      <Actions>
        <Button variant="primary" onClick={run} disabled={busy}>
          {busy ? 'Membuat…' : 'Buat QR code'}
        </Button>
        <ResetButton onClick={() => { setText(''); setDataUrl(''); setError(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {dataUrl && (
        <div className="space-y-3">
          <img src={dataUrl} alt={`QR code untuk: ${encoded.slice(0, 80)}`} width={256} height={256} className="h-auto w-full max-w-[16rem] rounded-lg bg-white p-2" />
          <Button onClick={() => downloadDataUrl('qrcode.png', dataUrl)}>
            <Download className="h-4 w-4" aria-hidden />
            Unduh PNG
          </Button>
        </div>
      )}
      <Notice>
        QR code dibuat di browser Anda dan selalu hitam di atas putih agar mudah dipindai. Uji hasilnya dengan aplikasi pemindai sebelum dicetak atau dibagikan.
      </Notice>
    </>
  );
}
