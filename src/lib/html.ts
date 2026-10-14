import { ok, fail, escapeHtml, type Result } from './text.ts';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'pre', 'textarea']);

type TokType = 'open' | 'close' | 'self' | 'text' | 'comment' | 'decl' | 'raw';
interface Tok {
  type: TokType;
  raw: string;
  name: string;
}

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  const tagRe = /<(\/?)([A-Za-z][A-Za-z0-9:-]*)/y;
  let i = 0;
  let text = '';
  const flush = () => {
    if (text) {
      toks.push({ type: 'text', raw: text, name: '' });
      text = '';
    }
  };
  while (i < src.length) {
    if (src[i] !== '<') {
      const next = src.indexOf('<', i);
      const end = next === -1 ? src.length : next;
      text += src.slice(i, end);
      i = end;
      continue;
    }
    if (src.startsWith('<!--', i)) {
      flush();
      const e = src.indexOf('-->', i + 4);
      const end = e === -1 ? src.length : e + 3;
      toks.push({ type: 'comment', raw: src.slice(i, end), name: '' });
      i = end;
      continue;
    }
    if (src[i + 1] === '!' || src[i + 1] === '?') {
      flush();
      const e = src.indexOf('>', i);
      const end = e === -1 ? src.length : e + 1;
      toks.push({ type: 'decl', raw: src.slice(i, end), name: '' });
      i = end;
      continue;
    }
    tagRe.lastIndex = i;
    const m = tagRe.exec(src);
    if (!m) {
      text += '<';
      i++;
      continue;
    }
    let j = i + m[0].length;
    let quote = '';
    for (; j < src.length; j++) {
      const ch = src[j];
      if (quote) {
        if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
    }
    if (j >= src.length) {
      text += src.slice(i);
      i = src.length;
      break;
    }
    flush();
    const raw = src.slice(i, j + 1);
    const name = m[2].toLowerCase();
    const type: TokType = m[1] ? 'close' : raw.endsWith('/>') || VOID.has(name) ? 'self' : 'open';
    toks.push({ type, raw, name });
    i = j + 1;
    if (type === 'open' && RAW.has(name)) {
      const rest = src.slice(i);
      const cm = new RegExp('</' + name + '\\s*>', 'i').exec(rest);
      const inner = cm ? rest.slice(0, cm.index) : rest;
      toks.push({ type: 'raw', raw: inner, name });
      i += inner.length;
    }
  }
  flush();
  return toks;
}

/** Merapikan spasi di dalam tag (di luar tanda kutip) menjadi satu spasi. */
function normalizeTag(raw: string): string {
  let out = '';
  let quote = '';
  let space = false;
  for (const ch of raw) {
    if (quote) {
      out += ch;
      if (ch === quote) quote = '';
      continue;
    }
    if (/\s/.test(ch)) {
      space = true;
      continue;
    }
    if (space && ch !== '>') out += ' ';
    space = false;
    if (ch === '"' || ch === "'") quote = ch;
    out += ch;
  }
  return out;
}

function dedent(s: string): string {
  const lines = s.split('\n').map((l) => l.replace(/\s+$/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => (/^[ \t]*/.exec(l) as RegExpExecArray)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

/** Merapikan indentasi HTML. Kode hanya diproses sebagai teks, tidak pernah dijalankan. */
export function formatHtml(src: string, indentSize: number): Result<string> {
  if (!src.trim()) return fail('Masukkan kode HTML terlebih dahulu.');
  const toks = tokenize(src);
  const unit = ' '.repeat(indentSize);
  const lines: string[] = [];
  let depth = 0;
  const push = (s: string) => lines.push(unit.repeat(depth) + s);
  const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.type === 'text') {
      const s = squash(t.raw);
      if (s) push(s);
    } else if (t.type === 'comment' || t.type === 'decl') {
      push(t.raw.trim());
    } else if (t.type === 'self') {
      push(normalizeTag(t.raw));
    } else if (t.type === 'close') {
      depth = Math.max(0, depth - 1);
      push(normalizeTag(t.raw));
    } else if (t.type === 'open') {
      const next = toks[k + 1];
      const after = toks[k + 2];
      if (next && next.type === 'raw') {
        const close = after && after.type === 'close' && after.name === t.name ? after : undefined;
        if (t.name === 'pre' || t.name === 'textarea') {
          push(normalizeTag(t.raw) + next.raw + (close ? normalizeTag(close.raw) : ''));
        } else {
          push(normalizeTag(t.raw));
          const body = dedent(next.raw);
          if (body) {
            depth++;
            for (const l of body.split('\n')) lines.push(l ? unit.repeat(depth) + l : '');
            depth--;
          }
          if (close) push(normalizeTag(close.raw));
        }
        k += close ? 2 : 1;
      } else if (next && next.type === 'text' && after && after.type === 'close' && after.name === t.name) {
        const line = normalizeTag(t.raw) + squash(next.raw) + normalizeTag(after.raw);
        if (line.length + depth * indentSize <= 120) {
          push(line);
          k += 2;
        } else {
          push(normalizeTag(t.raw));
          depth++;
        }
      } else if (next && next.type === 'close' && next.name === t.name) {
        push(normalizeTag(t.raw) + normalizeTag(next.raw));
        k += 1;
      } else {
        push(normalizeTag(t.raw));
        depth++;
      }
    }
  }
  return ok(lines.join('\n'));
}

export function encodeEntities(s: string, nonAscii: boolean): string {
  const out = escapeHtml(s);
  if (!nonAscii) return out;
  return Array.from(out)
    .map((ch) => {
      const cp = ch.codePointAt(0) as number;
      return cp > 126 ? `&#${cp};` : ch;
    })
    .join('');
}

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«',
  raquo: '»', bull: '•', middot: '·', euro: '€', pound: '£', yen: '¥', cent: '¢', sect: '§', deg: '°',
  plusmn: '±', times: '×', divide: '÷', larr: '←', rarr: '→', uarr: '↑', darr: '↓', hearts: '♥',
  micro: 'µ', para: '¶', frac12: '½', frac14: '¼', frac34: '¾', iexcl: '¡', iquest: '¿', ne: '≠',
  le: '≤', ge: '≥', infin: '∞', check: '✓',
};

export const SUPPORTED_ENTITY_COUNT = Object.keys(NAMED).length;

function validCodePoint(cp: number): boolean {
  return cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff);
}

export function decodeEntities(s: string): { output: string; unknown: string[] } {
  const unknown = new Set<string>();
  const output = s.replace(
    /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{1,31}));/g,
    (full: string, dec: string | undefined, hex: string | undefined, name: string | undefined) => {
      if (dec !== undefined || hex !== undefined) {
        const cp = dec !== undefined ? parseInt(dec, 10) : parseInt(hex as string, 16);
        if (!validCodePoint(cp)) {
          unknown.add(full);
          return full;
        }
        return String.fromCodePoint(cp);
      }
      if (name !== undefined && Object.prototype.hasOwnProperty.call(NAMED, name)) return NAMED[name];
      unknown.add(full);
      return full;
    },
  );
  return { output, unknown: Array.from(unknown) };
}
