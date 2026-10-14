import { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { buildOpenGraph, buildRobots, buildSitemap } from '../lib/web';
import type { OgInput, RobotsGroup } from '../lib/web';
import { downloadBlob } from '../lib/browser';
import { Actions, ResetButton, ToolInput, ToolOutput } from '../components/toolkit';
import { Button, ErrorMessage, Notice, SelectField, TextInput, WarningList } from '../components/ui';

// ---------- 18. robots.txt ----------
interface GroupState extends RobotsGroup {
  id: number;
}

const MAX_GROUPS = 10;

export function RobotsGenerator() {
  const nextId = () => Date.now() + Math.floor(Math.random() * 1000);
  const blank = (): GroupState => ({ id: nextId(), userAgent: '*', allow: '', disallow: '' });
  const [groups, setGroups] = useState<GroupState[]>(() => [{ id: 1, userAgent: '*', allow: '', disallow: '' }]);
  const [sitemaps, setSitemaps] = useState('');
  const [output, setOutput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const update = (id: number, patch: Partial<RobotsGroup>) => setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const run = () => {
    const r = buildRobots(groups, sitemaps);
    if (r.ok) {
      setOutput(r.value.code);
      setWarnings(r.value.warnings);
      setError(null);
    } else {
      setOutput('');
      setWarnings([]);
      setError(r.error);
    }
  };
  const reset = () => {
    setGroups([blank()]);
    setSitemaps('');
    setOutput('');
    setWarnings([]);
    setError(null);
  };

  return (
    <>
      {groups.map((g, i) => (
        <fieldset key={g.id} className="space-y-4 rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-medium">Grup aturan {i + 1}</legend>
          <TextInput label="User-agent" value={g.userAgent} onChange={(v) => update(g.id, { userAgent: v })} mono placeholder="* atau Googlebot" hint="Gunakan * untuk semua bot." />
          <ToolInput label="Allow (satu path per baris)" value={g.allow} onChange={(v) => update(g.id, { allow: v })} rows={3} placeholder="/publik/" />
          <ToolInput label="Disallow (satu path per baris)" value={g.disallow} onChange={(v) => update(g.id, { disallow: v })} rows={3} placeholder={'/admin/\n/tmp/'} />
          {groups.length > 1 && (
            <Button variant="ghost" onClick={() => setGroups((gs) => gs.filter((x) => x.id !== g.id))}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Hapus grup ini
            </Button>
          )}
        </fieldset>
      ))}
      <Button onClick={() => setGroups((gs) => [...gs, blank()])} disabled={groups.length >= MAX_GROUPS}>
        <Plus className="h-4 w-4" aria-hidden />
        Tambah grup user-agent
      </Button>
      <ToolInput label="URL sitemap (satu per baris)" value={sitemaps} onChange={setSitemaps} rows={3} placeholder="https://contoh.com/sitemap.xml" />
      <Actions>
        <Button variant="primary" onClick={run}>
          Buat robots.txt
        </Button>
        <ResetButton onClick={reset} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <WarningList items={warnings} />
      <ToolOutput
        label="robots.txt"
        value={output}
        actions={
          <Button className="min-h-10 px-3" disabled={!output} onClick={() => downloadBlob('robots.txt', output, 'text/plain;charset=utf-8')}>
            <Download className="h-4 w-4" aria-hidden />
            Unduh
          </Button>
        }
      />
      <Notice>
        Periksa aturan sebelum dipasang di website produksi: kesalahan kecil (misalnya Disallow: /) dapat membuat seluruh situs hilang dari mesin pencari. File
        harus ditaruh di akar domain, contohnya https://contoh.com/robots.txt.
      </Notice>
    </>
  );
}

// ---------- 19. sitemap.xml ----------
export function SitemapGenerator() {
  const [urls, setUrls] = useState('');
  const [lastmod, setLastmod] = useState('');
  const [output, setOutput] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const r = buildSitemap(urls, lastmod);
    if (r.ok) {
      setOutput(r.value.code);
      setWarnings(r.value.warnings);
      setCount(r.value.count);
      setError(null);
    } else {
      setOutput('');
      setWarnings([]);
      setCount(0);
      setError(r.error);
    }
  };

  return (
    <>
      <ToolInput
        label="Daftar URL (satu per baris)"
        value={urls}
        onChange={setUrls}
        rows={9}
        placeholder={'https://contoh.com/\nhttps://contoh.com/tentang\nhttps://contoh.com/blog/artikel | 2026-10-01'}
        hint="Opsional: tambahkan “ | YYYY-MM-DD” di akhir baris untuk lastmod URL tersebut."
      />
      <TextInput label="Lastmod bawaan (opsional)" type="date" value={lastmod} onChange={setLastmod} hint="Dipakai untuk URL yang tidak punya tanggal sendiri." />
      <Actions>
        <Button variant="primary" onClick={run}>
          Buat sitemap.xml
        </Button>
        <ResetButton onClick={() => { setUrls(''); setLastmod(''); setOutput(''); setWarnings([]); setError(null); setCount(0); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <WarningList items={warnings} />
      {output && <Notice tone="success">{count} URL dimasukkan ke dalam sitemap.</Notice>}
      <ToolOutput
        label="sitemap.xml"
        value={output}
        actions={
          <Button className="min-h-10 px-3" disabled={!output} onClick={() => downloadBlob('sitemap.xml', output, 'application/xml;charset=utf-8')}>
            <Download className="h-4 w-4" aria-hidden />
            Unduh
          </Button>
        }
      />
      <Notice>
        Sitemap dibuat dari daftar yang Anda masukkan, bukan dari hasil crawling website. Pastikan semua URL benar dan dapat diakses. Search engine bisa mengabaikan lastmod yang
        tidak akurat.
      </Notice>
    </>
  );
}

// ---------- 20. Open Graph ----------
const OG_DEFAULT: OgInput = {
  title: '', description: '', url: '', image: '', siteName: '', type: 'website', locale: 'id_ID', twitterCard: 'summary_large_image', twitterHandle: '',
};

export function OpenGraphGenerator() {
  const [o, setO] = useState<OgInput>(OG_DEFAULT);
  const [code, setCode] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OgInput | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const set = <K extends keyof OgInput>(k: K, v: OgInput[K]) => setO((x) => ({ ...x, [k]: v }));
  const run = () => {
    const r = buildOpenGraph(o);
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
    setPreview(o);
    setImgFailed(false);
  };
  const host = (() => {
    try {
      return preview?.url ? new URL(preview.url).host : '';
    } catch {
      return '';
    }
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput className="sm:col-span-2" label="Judul *" value={o.title} onChange={(v) => set('title', v)} placeholder="Judul halaman" />
        <div className="sm:col-span-2">
          <label htmlFor="og-desc" className="label">
            Deskripsi
          </label>
          <textarea id="og-desc" rows={3} value={o.description} onChange={(e) => set('description', e.target.value)} className="input resize-y" placeholder="Ringkasan singkat halaman." />
        </div>
        <TextInput label="URL halaman" value={o.url} onChange={(v) => set('url', v)} inputMode="url" placeholder="https://contoh.com/halaman" />
        <TextInput label="URL gambar" value={o.image} onChange={(v) => set('image', v)} inputMode="url" placeholder="https://contoh.com/gambar.png" hint="Disarankan 1200 × 630 px." />
        <TextInput label="Nama website" value={o.siteName} onChange={(v) => set('siteName', v)} placeholder="Nama Situs" />
        <TextInput label="Locale" value={o.locale} onChange={(v) => set('locale', v)} mono placeholder="id_ID" />
        <SelectField
          label="Tipe konten"
          value={o.type}
          onChange={(v) => set('type', v)}
          options={[
            { value: 'website', label: 'website' },
            { value: 'article', label: 'article' },
          ]}
        />
        <SelectField
          label="Jenis Twitter/X Card"
          value={o.twitterCard}
          onChange={(v) => set('twitterCard', v)}
          options={[
            { value: 'summary_large_image', label: 'summary_large_image (gambar besar)' },
            { value: 'summary', label: 'summary (gambar kecil)' },
          ]}
        />
        <TextInput label="Akun Twitter/X (opsional)" value={o.twitterHandle} onChange={(v) => set('twitterHandle', v)} mono placeholder="@namaakun" />
      </div>
      <Actions>
        <Button variant="primary" onClick={run}>
          Buat tag
        </Button>
        <ResetButton onClick={() => { setO(OG_DEFAULT); setCode(''); setWarnings([]); setError(null); setPreview(null); }} />
      </Actions>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <WarningList items={warnings} />
      <ToolOutput label="Kode meta tag" value={code} placeholder="Isi form lalu tekan “Buat tag”." />
      {preview && (
        <div>
          <p className="label">Perkiraan pratinjau tautan</p>
          <div className="max-w-md overflow-hidden rounded-lg border border-line bg-surface">
            {preview.image && !imgFailed ? (
              <img src={preview.image} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setImgFailed(true)} className="aspect-[1.91/1] w-full bg-elevated object-cover" />
            ) : (
              <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-elevated px-4 text-center text-xs text-muted">
                {preview.image ? 'Gambar tidak dapat dimuat dari URL ini.' : 'Tanpa gambar'}
              </div>
            )}
            <div className="space-y-0.5 p-3">
              {host && <p className="truncate text-xs uppercase text-muted">{host}</p>}
              <p className="text-sm font-medium [overflow-wrap:anywhere]">{preview.title}</p>
              {preview.description && <p className="line-clamp-2 text-xs text-muted">{preview.description}</p>}
            </div>
          </div>
        </div>
      )}
      <Notice>
        Tempatkan kode ini di dalam bagian &lt;head&gt; website Anda; tag tidak terpasang otomatis. Platform sosial menyimpan pratinjau di cache, jadi perubahan bisa butuh
        waktu untuk tampil. Pratinjau di sini hanya perkiraan.
      </Notice>
    </>
  );
}
