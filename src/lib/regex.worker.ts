import { runRegex } from './regex';

// Berjalan di Web Worker agar pola regex yang mahal (ReDoS) dapat dihentikan tanpa membekukan halaman.
self.onmessage = (e: MessageEvent<{ pattern: string; flags: string; text: string }>) => {
  const { pattern, flags, text } = e.data;
  self.postMessage(runRegex(pattern, flags, text));
};
