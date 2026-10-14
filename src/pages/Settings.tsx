import { useState } from 'react';
import type { ReactNode } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { APP_VERSION } from '../config';
import { toolById } from '../data/tools';
import { usePageMeta } from '../hooks/usePageMeta';
import { actions, useAppState } from '../store';
import type { ThemeSetting } from '../store';
import { Button, Checkbox, Notice, Segmented } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

type Pending = 'history' | 'favorites' | 'all' | null;

const CONFIRM: Record<Exclude<Pending, null>, { title: string; description: string }> = {
  history: { title: 'Hapus riwayat?', description: 'Seluruh riwayat penggunaan tools di perangkat ini akan dihapus. Favorit dan pengaturan tidak berubah.' },
  favorites: { title: 'Hapus semua favorit?', description: 'Semua tool yang Anda tandai favorit akan dilepas. Riwayat dan pengaturan tidak berubah.' },
  all: {
    title: 'Hapus semua data lokal DevKit?',
    description: 'Tema, favorit, riwayat, dan pengaturan DevKit di browser ini akan dihapus. Data situs lain di browser Anda tidak disentuh.',
  },
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Settings() {
  usePageMeta('Pengaturan — DevKit');
  const { theme, historyEnabled, history, favorites, storageOk } = useAppState();
  const toast = useToast();
  const [pending, setPending] = useState<Pending>(null);
  const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  const confirm = () => {
    if (pending === 'history') actions.clearHistory();
    if (pending === 'favorites') actions.clearFavorites();
    if (pending === 'all') actions.resetAll();
    toast('Data lokal dihapus.', 'success');
    setPending(null);
  };

  const themes: { value: ThemeSetting; label: string }[] = [
    { value: 'dark', label: 'Gelap' },
    { value: 'light', label: 'Terang' },
    { value: 'system', label: 'Ikuti sistem' },
  ];
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>

      {!storageOk && (
        <Notice tone="warning">
          Penyimpanan lokal browser tidak tersedia (mungkin mode privat atau diblokir). DevKit tetap bisa dipakai, tetapi tema, favorit, dan
          riwayat tidak akan tersimpan setelah halaman ditutup.
        </Notice>
      )}

      <Block title="Tampilan">
        <div className="flex items-center gap-3">
          <ThemeIcon className="h-5 w-5 text-muted" aria-hidden />
          <Segmented label="Tema" value={theme} onChange={actions.setTheme} options={themes} />
        </div>
      </Block>

      <Block title="Riwayat">
        <p className="text-sm text-muted">
          Riwayat hanya mencatat nama tool dan waktu pembukaannya, disimpan di browser ini. Input, hasil, password, token, dan isi request
          API tidak pernah dicatat.
        </p>
        <Checkbox label="Catat riwayat penggunaan" checked={historyEnabled} onChange={actions.setHistoryEnabled} />
        {history.length > 0 ? (
          <ul className="max-h-56 divide-y divide-line overflow-auto rounded-lg border border-line text-sm">
            {history.slice(0, 20).map((h) => (
              <li key={`${h.id}-${h.t}`} className="flex justify-between gap-3 px-3 py-2">
                <span>{toolById(h.id)?.name}</span>
                <time className="shrink-0 text-muted" dateTime={new Date(h.t).toISOString()}>
                  {fmt.format(new Date(h.t))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Belum ada riwayat.</p>
        )}
        <Button onClick={() => setPending('history')} disabled={!history.length}>
          Hapus riwayat
        </Button>
      </Block>

      <Block title="Favorit">
        <p className="text-sm text-muted">{favorites.length} tool ditandai favorit di perangkat ini.</p>
        <Button onClick={() => setPending('favorites')} disabled={!favorites.length}>
          Hapus semua favorit
        </Button>
      </Block>

      <Block title="Data lokal">
        <p className="text-sm text-muted">
          DevKit menyimpan data ringan di localStorage browser (tema, favorit, riwayat, preferensi riwayat). Tombol ini hanya menghapus data
          milik DevKit, bukan data situs lain.
        </p>
        <Button variant="danger" onClick={() => setPending('all')}>
          Hapus semua data lokal DevKit
        </Button>
      </Block>

      <Block title="Tentang">
        <p className="text-sm">DevKit versi {APP_VERSION}</p>
        <p className="text-sm text-muted">
          Setelah dibuka sekali, tampilan aplikasi dapat dimuat saat offline. Tools yang memproses data lokal tetap berjalan, tetapi API
          Request Tester membutuhkan koneksi internet.
        </p>
      </Block>

      <ConfirmDialog
        open={pending !== null}
        title={pending ? CONFIRM[pending].title : ''}
        description={pending ? CONFIRM[pending].description : ''}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
