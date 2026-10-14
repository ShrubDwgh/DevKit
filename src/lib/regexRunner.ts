import { runRegex, type RegexOutcome } from './regex';

/** Menjalankan regex di Web Worker dengan batas waktu. Jika Worker tidak tersedia, jalan langsung dengan batas teks/kecocokan. */
export function runRegexSafe(pattern: string, flags: string, text: string, timeoutMs = 1500): Promise<RegexOutcome> {
  return new Promise((resolve) => {
    if (typeof Worker === 'undefined') {
      resolve(runRegex(pattern, flags, text));
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./regex.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      resolve(runRegex(pattern, flags, text));
      return;
    }
    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        error: `Pengujian dihentikan setelah ${timeoutMs / 1000} detik. Pola ini kemungkinan memicu backtracking berlebihan (ReDoS). Sederhanakan pola atau perkecil teks uji.`,
      });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent<RegexOutcome>) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: 'Worker pengujian gagal dijalankan di browser ini.' });
    };
    worker.postMessage({ pattern, flags, text });
  });
}
