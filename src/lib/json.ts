import { ok, fail, type Result } from './text.ts';

export type JsonParse =
  | { ok: true; value: unknown }
  | { ok: false; error: string; line?: number; column?: number };

export function locate(text: string, pos: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else column++;
  }
  return { line, column };
}

function hintFor(input: string): string {
  if (/,\s*[}\]]/.test(input)) return ' Petunjuk: kemungkinan ada koma berlebih sebelum } atau ].';
  if (/(^|[{,]\s*)'[^']*'\s*:/.test(input)) return ' Petunjuk: JSON memakai tanda kutip ganda ("), bukan tunggal (\').';
  if (/[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(input)) return ' Petunjuk: nama properti harus diberi tanda kutip ganda.';
  return '';
}

export function parseJson(input: string): JsonParse {
  if (!input.trim()) return { ok: false, error: 'Masukkan JSON terlebih dahulu.' };
  try {
    return { ok: true, value: JSON.parse(input) as unknown };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    let line: number | undefined;
    let column: number | undefined;
    const byPos = /position (\d+)/i.exec(raw);
    const byLine = /line (\d+) column (\d+)/i.exec(raw);
    if (byPos) {
      const loc = locate(input, Number(byPos[1]));
      line = loc.line;
      column = loc.column;
    } else if (byLine) {
      line = Number(byLine[1]);
      column = Number(byLine[2]);
    }
    const where = line ? ` (baris ${line}, kolom ${column})` : '';
    return { ok: false, error: `JSON tidak valid${where}: ${raw}.${hintFor(input)}`, line, column };
  }
}

/** indent 0 = minify. */
export function formatJson(input: string, indent: number): Result<string> {
  const r = parseJson(input);
  if (!r.ok) return fail(r.error);
  return ok(indent > 0 ? JSON.stringify(r.value, null, indent) : JSON.stringify(r.value));
}

export interface JsonInfo {
  type: string;
  summary: string;
  depth: number;
}

export function describeJson(value: unknown): JsonInfo {
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  let summary = '';
  if (Array.isArray(value)) summary = `${value.length} elemen`;
  else if (value !== null && typeof value === 'object') summary = `${Object.keys(value).length} properti`;
  else summary = String(value).slice(0, 60);
  let depth = 0;
  const stack: [unknown, number][] = [[value, 1]];
  while (stack.length) {
    const [v, d] = stack.pop() as [unknown, number];
    if (v !== null && typeof v === 'object') {
      depth = Math.max(depth, d);
      for (const child of Object.values(v)) stack.push([child, d + 1]);
    }
  }
  return { type, summary, depth };
}
