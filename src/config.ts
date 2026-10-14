import type { ReactNode } from 'react';

export const APP_NAME = 'DevKit';
export const APP_VERSION = '1.0.0';
export const TAGLINE = 'tools praktis untuk pekerjaan digital.';
export const DEFAULT_DESCRIPTION =
  'DevKit: tools gratis untuk developer dan pekerjaan digital. Diproses di browser Anda, tanpa akun.';
export const LEGAL_UPDATED = '14 Oktober 2026';

/**
 * Domain produksi. Isi lewat variabel lingkungan VITE_SITE_URL (tanpa slash di akhir) setelah domain diketahui.
 * Jika kosong, canonical URL dan og:url tidak dipasang.
 */
export const SITE_URL: string = (() => {
  const v = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '');
  return v && /^https?:\/\/[^\s"'<>]+$/.test(v) ? v : '';
})();

export type AdPlacement = 'dashboard' | 'tool-bottom';

export interface AdProvider {
  name: string;
  render: (placement: AdPlacement) => ReactNode;
}

/**
 * Konfigurasi slot iklan. Selama `enabled` false atau `provider` null, slot TIDAK ditampilkan di production.
 * Lihat README bagian "Mengaktifkan AdSlot" setelah provider iklan benar-benar tersedia.
 * `devPlaceholder` hanya menampilkan kerangka tata letak saat `npm run dev` (bukan iklan).
 */
export const AD_CONFIG: { enabled: boolean; provider: AdProvider | null; devPlaceholder: boolean } = {
  enabled: false,
  provider: null,
  devPlaceholder: false,
};
