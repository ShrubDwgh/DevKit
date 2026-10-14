import { AD_CONFIG } from '../config';
import type { AdPlacement } from '../config';

/**
 * Slot iklan non-intrusif. Tanpa provider yang dikonfigurasi, komponen ini tidak merender apa pun
 * di production (tidak ada iklan atau konten palsu). Lihat AD_CONFIG di src/config.ts dan README.
 */
export function AdSlot({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  const provider = AD_CONFIG.enabled ? AD_CONFIG.provider : null;
  if (provider) {
    return (
      <aside aria-label="Iklan" className={`min-h-[90px] overflow-hidden rounded-lg border border-line ${className}`}>
        {provider.render(placement)}
      </aside>
    );
  }
  if (import.meta.env.DEV && AD_CONFIG.devPlaceholder) {
    return (
      <div className={`min-h-[90px] rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-muted ${className}`}>
        [Pengembangan] Kerangka tata letak slot “{placement}”. Ini bukan iklan.
      </div>
    );
  }
  return null;
}
