import { useDeferredValue, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Actions, CopyButton, ResetButton, ToolInput } from '../components/toolkit';
import { Notice, Segmented } from '../components/ui';

const MAX_CHARS = 300_000;

// Semua tautan hasil render dibuka di tab baru tanpa mengirim referrer.
let hookInstalled = false;
function installHook() {
  if (hookInstalled) return;
  hookInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
}

function render(md: string): string {
  installHook();
  const raw = marked.parse(md, { async: false, gfm: true }) as string;
  // Semua HTML disanitasi DOMPurify: skrip, event handler, form, dan style dibuang.
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['style'],
  });
}

const SAMPLE = `# Judul

Teks dengan **tebal**, *miring*, dan \`kode\`.

- Item pertama
- Item kedua

> Kutipan

| Kolom | Nilai |
| ----- | ----- |
| A     | 1     |
`;

export function MarkdownPreviewer() {
  const [md, setMd] = useState('');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const deferred = useDeferredValue(md);
  const tooLong = md.length > MAX_CHARS;
  const html = useMemo(() => (deferred.trim() && deferred.length <= MAX_CHARS ? render(deferred) : ''), [deferred]);

  return (
    <>
      <div className="lg:hidden">
        <Segmented
          label="Tampilan"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'edit', label: 'Editor' },
            { value: 'preview', label: 'Pratinjau' },
          ]}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={tab === 'edit' ? 'block' : 'hidden lg:block'}>
          <ToolInput label="Markdown" value={md} onChange={setMd} placeholder="# Tulis Markdown di sini" rows={16} />
        </div>
        <div className={tab === 'preview' ? 'block' : 'hidden lg:block'}>
          <p className="label">Pratinjau</p>
          <div className="min-h-[10rem] rounded-lg border border-line bg-bg p-4">
            {html ? (
              // Aman: html sudah disanitasi DOMPurify di fungsi render().
              <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-sm text-muted">{md.trim() ? 'Pratinjau tidak tersedia.' : 'Pratinjau akan muncul di sini setelah Anda menulis Markdown.'}</p>
            )}
          </div>
        </div>
      </div>
      {tooLong && <Notice tone="warning">Teks melebihi {MAX_CHARS.toLocaleString('id-ID')} karakter, pratinjau dinonaktifkan.</Notice>}
      <Actions>
        <CopyButton text={md} label="Salin Markdown" />
        <button type="button" className="btn btn-secondary" onClick={() => setMd(SAMPLE)}>
          Muat contoh
        </button>
        <ResetButton onClick={() => setMd('')} />
      </Actions>
      <Notice>
        HTML hasil render disanitasi dengan DOMPurify: skrip dan atribut berbahaya dibuang. Gambar dari alamat https dapat dimuat dari server
        pemiliknya saat pratinjau ditampilkan.
      </Notice>
    </>
  );
}
