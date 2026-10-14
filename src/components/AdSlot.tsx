import { useEffect, useRef } from 'react';
import { AD_CONFIG } from '../config';
import type { AdPlacement } from '../config';

declare global {
  interface Window {
    adsbygoogle?: { push: (value: Record<string, never>) => void }[];
  }
}

const ADSENSE_CLIENT = 'ca-pub-3352751968708966';
const ADSENSE_SLOTS: Record<AdPlacement, string> = {
  dashboard: '6354495593',
  'tool-bottom': '6354495593',
};

function GoogleAdSense({
  placement,
  className,
}: {
  placement: AdPlacement;
  className: string;
}) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const element = adRef.current;

    if (!element || element.dataset.adsbygoogleStatus) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense gagal diinisialisasi:', error);
    }
  }, []);

  return (
    <aside
      aria-label="Iklan"
      className={`min-w-0 overflow-hidden ${className}`}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOTS[placement]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

export function AdSlot({
  placement,
  className = '',
}: {
  placement: AdPlacement;
  className?: string;
}) {
  if (AD_CONFIG.enabled && AD_CONFIG.provider) {
    return (
      <aside
        aria-label="Iklan"
        className={`min-h-[90px] overflow-hidden rounded-lg border border-line ${className}`}
      >
        {AD_CONFIG.provider.render(placement)}
      </aside>
    );
  }

  if (AD_CONFIG.enabled) {
    return (
      <GoogleAdSense placement={placement} className={className} />
    );
  }

  if (import.meta.env.DEV && AD_CONFIG.devPlaceholder) {
    return (
      <div
        className={`min-h-[90px] rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-muted ${className}`}
      >
        [Pengembangan] Kerangka tata letak slot “{placement}”. Ini bukan iklan.
      </div>
    );
  }

  return null;
}
