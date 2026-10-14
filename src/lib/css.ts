export interface CssMinifyResult {
  output: string;
  warnings: string[];
}

const NO_SPACE_AFTER = new Set(['{', '}', ';', ',', '>', '~', '(', ':']);
const NO_SPACE_BEFORE = new Set(['{', '}', ';', ',', '>', '~', ')']);
const STRUCTURAL = new Set(['{', '}', ';', ',', '>', '~', '(', ')', ':']);

function isWs(c: string): boolean {
  return c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\f';
}

/**
 * Minifikasi CSS berbasis tokenizer: menghapus komentar dan spasi yang tidak diperlukan,
 * menjaga isi string dan url(). Tidak mengubah nilai (mis. warna atau satuan).
 */
export function minifyCss(src: string, keepImportantComments: boolean): CssMinifyResult {
  const warnings: string[] = [];
  let out = '';
  let space = false;
  let brace = 0;
  let paren = 0;
  let i = 0;
  const n = src.length;

  const emit = (tok: string) => {
    if (space && out) {
      const last = out[out.length - 1];
      if (!NO_SPACE_AFTER.has(last) && !NO_SPACE_BEFORE.has(tok[0])) out += ' ';
    }
    space = false;
    out += tok;
  };

  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      if (end === -1) warnings.push('Ada komentar /* yang tidak ditutup; sisa teks dianggap komentar.');
      const body = src.slice(i, stop);
      if (keepImportantComments && body.startsWith('/*!') && end !== -1) emit(body);
      else space = true;
      i = stop;
      continue;
    }
    if (isWs(c)) {
      space = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') j++;
        j++;
      }
      const end = Math.min(j + 1, n);
      emit(src.slice(i, end));
      i = end;
      continue;
    }
    if ((c === 'u' || c === 'U') && src.slice(i, i + 4).toLowerCase() === 'url(') {
      let j = i + 4;
      while (j < n && isWs(src[j])) j++;
      if (src[j] !== '"' && src[j] !== "'") {
        let k = j;
        while (k < n && src[k] !== ')') {
          if (src[k] === '\\') k++;
          k++;
        }
        const end = Math.min(k + 1, n);
        emit('url(' + src.slice(j, end - 1).trim() + ')');
        i = end;
        continue;
      }
    }
    if (STRUCTURAL.has(c)) {
      if (c === '{') brace++;
      else if (c === '}') {
        brace--;
        if (out.endsWith(';')) out = out.slice(0, -1);
      } else if (c === '(') paren++;
      else if (c === ')') paren--;
      emit(c);
      i++;
      continue;
    }
    let j = i;
    while (j < n) {
      const d = src[j];
      if (d === '\\') {
        j += 2;
        continue;
      }
      if (STRUCTURAL.has(d) || isWs(d) || d === '"' || d === "'" || (d === '/' && src[j + 1] === '*')) break;
      j++;
    }
    if (j === i) j = i + 1;
    j = Math.min(j, n);
    emit(src.slice(i, j));
    i = j;
  }
  if (brace !== 0) warnings.push('Tanda kurung kurawal { } tidak seimbang. Periksa kembali CSS Anda.');
  if (paren !== 0) warnings.push('Tanda kurung ( ) tidak seimbang. Periksa kembali CSS Anda.');
  return { output: out, warnings };
}
