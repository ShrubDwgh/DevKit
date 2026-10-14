import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_DESCRIPTION, SITE_URL } from '../config';

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/** Mengatur title, meta description, dan (bila VITE_SITE_URL diisi) canonical + og:url untuk halaman aktif. */
export function usePageMeta(title: string, description?: string): void {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title;
    const desc = description || DEFAULT_DESCRIPTION;
    upsert('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' })).setAttribute('content', desc);
    upsert('meta[property="og:title"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:title');
      return m;
    }).setAttribute('content', title);
    upsert('meta[property="og:description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:description');
      return m;
    }).setAttribute('content', desc);
    if (SITE_URL) {
      const href = SITE_URL + (pathname === '/' ? '/' : pathname);
      upsert('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' })).setAttribute('href', href);
      upsert('meta[property="og:url"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:url');
        return m;
      }).setAttribute('content', href);
    }
  }, [title, description, pathname]);
}
