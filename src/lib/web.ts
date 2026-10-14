import { ok, fail, escapeHtml, escapeXml, parseHttpUrl, isRealDate, type Result } from './text.ts';

export interface Generated {
  code: string;
  warnings: string[];
}

function normalizeHex(v: string): string | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v.trim());
  return m ? '#' + m[1].toUpperCase() : null;
}

// ---------- Meta tag ----------
export interface MetaInput {
  title: string;
  description: string;
  url: string;
  author: string;
  themeColor: string;
  robots: string;
  includeBasics: boolean;
}

export const ROBOTS_OPTIONS = ['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow'];

export function buildMetaTags(i: MetaInput): Result<Generated> {
  const title = i.title.trim();
  if (!title) return fail('Judul website wajib diisi.');
  const warnings: string[] = [];
  const url = i.url.trim();
  if (url && !parseHttpUrl(url)) return fail('URL website harus diawali http:// atau https:// dan berformat valid.');
  const color = i.themeColor.trim();
  const hex = color ? normalizeHex(color) : null;
  if (color && !hex) return fail('Tema warna harus berupa kode HEX, contoh: #3B82F6.');
  if (title.length > 60) warnings.push('Judul lebih dari 60 karakter; mesin pencari dapat memotongnya.');
  const desc = i.description.trim();
  if (!desc) warnings.push('Deskripsi kosong. Meta description membantu tampilan hasil pencarian.');
  else if (desc.length > 160) warnings.push('Deskripsi lebih dari 160 karakter; mesin pencari dapat memotongnya.');
  const lines: string[] = [];
  if (i.includeBasics) {
    lines.push('<meta charset="UTF-8" />');
    lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0" />');
  }
  lines.push(`<title>${escapeHtml(title)}</title>`);
  if (desc) lines.push(`<meta name="description" content="${escapeHtml(desc)}" />`);
  if (i.author.trim()) lines.push(`<meta name="author" content="${escapeHtml(i.author.trim())}" />`);
  if (hex) lines.push(`<meta name="theme-color" content="${hex}" />`);
  lines.push(`<meta name="robots" content="${escapeHtml(i.robots)}" />`);
  if (url) lines.push(`<link rel="canonical" href="${escapeHtml(url)}" />`);
  return ok({ code: lines.join('\n'), warnings });
}

// ---------- Open Graph ----------
export interface OgInput {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  type: 'website' | 'article';
  locale: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterHandle: string;
}

export function buildOpenGraph(i: OgInput): Result<Generated> {
  const title = i.title.trim();
  if (!title) return fail('Judul wajib diisi.');
  const warnings: string[] = [];
  const url = i.url.trim();
  const image = i.image.trim();
  if (url && !parseHttpUrl(url)) return fail('URL halaman harus diawali http:// atau https:// dan berformat valid.');
  if (image && !parseHttpUrl(image)) return fail('URL gambar harus diawali http:// atau https:// dan berformat valid.');
  const handleRaw = i.twitterHandle.trim();
  if (handleRaw && !/^@?[A-Za-z0-9_]{1,15}$/.test(handleRaw)) return fail('Handle Twitter/X tidak valid. Contoh: @namaakun (maksimal 15 karakter).');
  const locale = i.locale.trim();
  if (locale && !/^[a-z]{2}_[A-Z]{2}$/.test(locale)) return fail('Locale harus berformat bahasa_NEGARA, contoh: id_ID atau en_US.');
  if (!url) warnings.push('og:url kosong. Isi dengan alamat kanonik halaman.');
  if (!image) warnings.push('og:image kosong. Pratinjau tautan tidak akan menampilkan gambar.');
  if (!i.description.trim()) warnings.push('Deskripsi kosong.');
  const m = (attr: 'property' | 'name', key: string, value: string) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  const lines = ['<!-- Open Graph -->', m('property', 'og:type', i.type), m('property', 'og:title', title)];
  if (i.description.trim()) lines.push(m('property', 'og:description', i.description.trim()));
  if (url) lines.push(m('property', 'og:url', url));
  if (image) lines.push(m('property', 'og:image', image));
  if (i.siteName.trim()) lines.push(m('property', 'og:site_name', i.siteName.trim()));
  if (locale) lines.push(m('property', 'og:locale', locale));
  lines.push('', '<!-- Twitter/X Card -->', m('name', 'twitter:card', i.twitterCard), m('name', 'twitter:title', title));
  if (i.description.trim()) lines.push(m('name', 'twitter:description', i.description.trim()));
  if (image) lines.push(m('name', 'twitter:image', image));
  if (handleRaw) lines.push(m('name', 'twitter:site', handleRaw.startsWith('@') ? handleRaw : '@' + handleRaw));
  return ok({ code: lines.join('\n'), warnings });
}

// ---------- robots.txt ----------
export interface RobotsGroup {
  userAgent: string;
  allow: string;
  disallow: string;
}

function splitLines(s: string): string[] {
  return s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export function buildRobots(groups: RobotsGroup[], sitemaps: string): Result<Generated> {
  const warnings: string[] = [];
  const blocks: string[] = [];
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    const ua = grp.userAgent.trim();
    const label = `Grup ${g + 1}`;
    if (!ua) return fail(`${label}: User-agent wajib diisi (gunakan * untuk semua bot).`);
    if (!/^[^\s:#]+$/.test(ua)) return fail(`${label}: User-agent "${ua}" tidak valid (tanpa spasi, titik dua, atau #).`);
    const lines = [`User-agent: ${ua}`];
    const rules: [string, string][] = [
      ...splitLines(grp.allow).map((p): [string, string] => ['Allow', p]),
      ...splitLines(grp.disallow).map((p): [string, string] => ['Disallow', p]),
    ];
    for (const [kind, path] of rules) {
      if (!/^[/*]\S*$/.test(path)) return fail(`${label}: path "${path}" pada ${kind} harus diawali "/" atau "*" dan tanpa spasi.`);
      lines.push(`${kind}: ${path}`);
      if (kind === 'Disallow' && path === '/') warnings.push(`${label}: "Disallow: /" memblokir seluruh situs untuk user-agent ${ua}.`);
    }
    if (!rules.length) lines.push('Disallow:');
    blocks.push(lines.join('\n'));
  }
  const maps = splitLines(sitemaps);
  for (const s of maps) {
    if (!parseHttpUrl(s)) return fail(`URL sitemap "${s}" tidak valid. Gunakan URL absolut, contoh: https://contoh.com/sitemap.xml`);
  }
  warnings.push('robots.txt bukan mekanisme keamanan: file ini bersifat publik dan hanya dipatuhi oleh bot yang taat aturan.');
  let text = blocks.join('\n\n');
  if (maps.length) text += '\n\n' + maps.map((s) => `Sitemap: ${s}`).join('\n');
  return ok({ code: text + '\n', warnings });
}

// ---------- sitemap.xml ----------
export interface SitemapResult extends Generated {
  count: number;
  duplicates: number;
}

export const SITEMAP_MAX_URLS = 50000;

export function buildSitemap(text: string, defaultLastmod: string): Result<SitemapResult> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return fail('Masukkan minimal satu URL (satu URL per baris).');
  const def = defaultLastmod.trim();
  if (def && !isRealDate(def)) return fail('Tanggal lastmod bawaan tidak valid. Gunakan format YYYY-MM-DD.');
  const entries = new Map<string, string>();
  const errors: string[] = [];
  let duplicates = 0;
  const all = text.split(/\r?\n/);
  let lineNo = 0;
  for (const raw of all) {
    lineNo++;
    const line = raw.trim();
    if (!line) continue;
    const [urlPart, datePart] = line.split('|').map((s) => s.trim());
    const u = parseHttpUrl(urlPart);
    if (!u) {
      errors.push(`Baris ${lineNo}: "${urlPart.slice(0, 80)}" bukan URL http/https yang valid.`);
      continue;
    }
    if (u.href.length > 2048) {
      errors.push(`Baris ${lineNo}: URL melebihi 2048 karakter.`);
      continue;
    }
    if (datePart && !isRealDate(datePart)) {
      errors.push(`Baris ${lineNo}: lastmod "${datePart}" tidak valid (format YYYY-MM-DD).`);
      continue;
    }
    if (entries.has(u.href)) {
      duplicates++;
      continue;
    }
    entries.set(u.href, datePart || def);
  }
  if (errors.length) {
    const shown = errors.slice(0, 5).join('\n');
    return fail(shown + (errors.length > 5 ? `\n…dan ${errors.length - 5} kesalahan lain.` : ''));
  }
  if (entries.size > SITEMAP_MAX_URLS) return fail(`Satu file sitemap maksimal ${SITEMAP_MAX_URLS.toLocaleString('id-ID')} URL. Pecah menjadi beberapa file.`);
  const warnings: string[] = [];
  const hosts = new Set(Array.from(entries.keys()).map((h) => new URL(h).host));
  if (hosts.size > 1) warnings.push('URL berasal dari lebih dari satu host. Sitemap sebaiknya hanya memuat URL dari host yang sama.');
  if (duplicates) warnings.push(`${duplicates} URL duplikat diabaikan.`);
  const body = Array.from(entries, ([href, last]) =>
    `  <url>\n    <loc>${escapeXml(href)}</loc>\n${last ? `    <lastmod>${last}</lastmod>\n` : ''}  </url>`,
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return ok({ code: xml, warnings, count: entries.size, duplicates });
}
