export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  line: number;
  column: number;
  groups: (string | undefined)[];
  named: Record<string, string | undefined>;
}

export type RegexOutcome =
  | { ok: true; matches: RegexMatch[]; truncated: boolean; elapsedMs: number }
  | { ok: false; error: string };

export const MAX_REGEX_TEXT = 200_000;
export const MAX_REGEX_MATCHES = 1000;
export const VALID_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;

function lineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function positionOf(starts: number[], idx: number): { line: number; column: number } {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: idx - starts[lo] + 1 };
}

/** Menjalankan regex dengan batas jumlah kecocokan dan panjang teks. Dipanggil di Web Worker oleh UI. */
export function runRegex(pattern: string, flags: string, text: string): RegexOutcome {
  if (!pattern) return { ok: false, error: 'Masukkan pola regex.' };
  if (text.length > MAX_REGEX_TEXT) {
    return { ok: false, error: `Teks uji terlalu panjang (maksimal ${MAX_REGEX_TEXT.toLocaleString('id-ID')} karakter).` };
  }
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    return { ok: false, error: 'Regex tidak valid: ' + (e instanceof Error ? e.message : String(e)) };
  }
  const started = performance.now();
  const starts = lineStarts(text);
  const matches: RegexMatch[] = [];
  let truncated = false;
  const toMatch = (m: RegExpExecArray): RegexMatch => {
    const pos = positionOf(starts, m.index);
    return {
      index: m.index,
      end: m.index + m[0].length,
      text: m[0],
      line: pos.line,
      column: pos.column,
      groups: m.slice(1),
      named: { ...(m.groups ?? {}) },
    };
  };
  if (!re.global && !re.sticky) {
    const m = re.exec(text);
    if (m) matches.push(toMatch(m));
  } else {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push(toMatch(m));
      if (m[0] === '') re.lastIndex++;
      if (matches.length >= MAX_REGEX_MATCHES) {
        truncated = true;
        break;
      }
    }
  }
  return { ok: true, matches, truncated, elapsedMs: performance.now() - started };
}
