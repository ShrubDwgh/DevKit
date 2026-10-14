import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import {
  ArrowLeftRight, Asterisk, Binary, Bot, Braces, Clock, Code, Code2, FileCheck, FileCode, FileText, Fingerprint,
  Globe, KeyRound, Layers, Link2, ListOrdered, Lock, Network, Paintbrush, Palette, QrCode, Send,
  Share2, Sparkles, Tags, Type, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryId = 'code' | 'converter' | 'generator' | 'web' | 'api';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface ToolDef {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  keywords: string[];
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType>;
}

export const CATEGORIES: Category[] = [
  { id: 'code', name: 'Code Tools', description: 'Format, validasi, dan minifikasi kode.', icon: Code2 },
  { id: 'converter', name: 'Converters', description: 'Ubah data antar format dan encoding.', icon: ArrowLeftRight },
  { id: 'generator', name: 'Generators', description: 'Buat ID, password, QR code, dan teks.', icon: Sparkles },
  { id: 'web', name: 'Web Tools', description: 'File dan tag untuk SEO dan crawler.', icon: Globe },
  { id: 'api', name: 'API Tools', description: 'Referensi dan alat uji untuk API.', icon: Network },
];

function load<M extends object>(loader: () => Promise<M>, key: keyof M & string): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const mod = await loader();
    return { default: (mod as unknown as Record<string, unknown>)[key] as ComponentType };
  });
}

export const TOOLS: ToolDef[] = [
  {
    id: 'json-formatter', slug: 'json-formatter', name: 'JSON Formatter', category: 'code', icon: Braces,
    description: 'Rapikan JSON dengan indentasi 2 atau 4 spasi, atau ringkas menjadi satu baris.',
    keywords: ['json', 'format', 'beautify', 'pretty', 'rapikan', 'indent', 'minify'],
    component: load(() => import('../tools/CodeTools'), 'JsonFormatter'),
  },
  {
    id: 'json-validator', slug: 'json-validator', name: 'JSON Validator', category: 'code', icon: FileCheck,
    description: 'Periksa apakah JSON valid dan lihat lokasi kesalahan sintaksnya.',
    keywords: ['json', 'validasi', 'validate', 'cek', 'syntax', 'error'],
    component: load(() => import('../tools/CodeTools'), 'JsonValidator'),
  },
  {
    id: 'html-formatter', slug: 'html-formatter', name: 'HTML Formatter', category: 'code', icon: FileCode,
    description: 'Rapikan indentasi markup HTML tanpa menjalankannya.',
    keywords: ['html', 'format', 'beautify', 'indent', 'markup', 'rapikan'],
    component: load(() => import('../tools/CodeTools'), 'HtmlFormatter'),
  },
  {
    id: 'css-minifier', slug: 'css-minifier', name: 'CSS Minifier', category: 'code', icon: Paintbrush,
    description: 'Hapus komentar dan spasi berlebih dari CSS untuk memperkecil ukuran.',
    keywords: ['css', 'minify', 'kompres', 'compress', 'stylesheet', 'perkecil'],
    component: load(() => import('../tools/CodeTools'), 'CssMinifier'),
  },
  {
    id: 'js-minifier', slug: 'js-minifier', name: 'JavaScript Minifier', category: 'code', icon: Zap,
    description: 'Perkecil kode JavaScript dengan Terser, langsung di browser.',
    keywords: ['javascript', 'js', 'minify', 'terser', 'compress', 'kompres', 'uglify'],
    component: load(() => import('../tools/JsMinifier'), 'JsMinifier'),
  },
  {
    id: 'regex-tester', slug: 'regex-tester', name: 'Regex Tester', category: 'code', icon: Asterisk,
    description: 'Uji regular expression, lihat kecocokan, posisi, dan grup tangkapan.',
    keywords: ['regex', 'regexp', 'regular expression', 'pola', 'match', 'cocok', 'pattern'],
    component: load(() => import('../tools/CodeTools'), 'RegexTester'),
  },
  {
    id: 'markdown-previewer', slug: 'markdown-previewer', name: 'Markdown Previewer', category: 'code', icon: FileText,
    description: 'Tulis Markdown dan lihat pratinjau yang sudah disanitasi.',
    keywords: ['markdown', 'md', 'preview', 'pratinjau', 'editor', 'render'],
    component: load(() => import('../tools/MarkdownPreviewer'), 'MarkdownPreviewer'),
  },
  {
    id: 'base64', slug: 'base64', name: 'Base64 Encoder / Decoder', category: 'converter', icon: Binary,
    description: 'Encode teks ke Base64 atau decode kembali, mendukung Unicode dan varian URL-safe.',
    keywords: ['base64', 'encode', 'decode', 'unicode', 'base64url'],
    component: load(() => import('../tools/ConverterTools'), 'Base64Tool'),
  },
  {
    id: 'url-encoder', slug: 'url-encoder', name: 'URL Encoder / Decoder', category: 'converter', icon: Link2,
    description: 'Encode atau decode komponen URL (percent-encoding).',
    keywords: ['url', 'encode', 'decode', 'percent', 'uri', 'query', 'encodeURIComponent'],
    component: load(() => import('../tools/ConverterTools'), 'UrlTool'),
  },
  {
    id: 'html-entity', slug: 'html-entity', name: 'HTML Entity Encoder / Decoder', category: 'converter', icon: Code,
    description: 'Ubah karakter khusus HTML menjadi entity dan sebaliknya, hasilnya selalu berupa teks.',
    keywords: ['html', 'entity', 'entitas', 'escape', 'unescape', 'encode', 'decode', 'amp', 'lt'],
    component: load(() => import('../tools/ConverterTools'), 'HtmlEntityTool'),
  },
  {
    id: 'color-converter', slug: 'color-converter', name: 'Color Converter', category: 'converter', icon: Palette,
    description: 'Konversi warna antara HEX, RGB, dan HSL dengan pratinjau.',
    keywords: ['warna', 'color', 'colour', 'hex', 'rgb', 'hsl', 'konversi'],
    component: load(() => import('../tools/ConverterTools'), 'ColorConverter'),
  },
  {
    id: 'unix-timestamp', slug: 'unix-timestamp', name: 'Unix Timestamp Converter', category: 'converter', icon: Clock,
    description: 'Ubah timestamp Unix (detik atau milidetik) dari dan ke tanggal, lokal dan UTC.',
    keywords: ['unix', 'timestamp', 'epoch', 'tanggal', 'waktu', 'date', 'time', 'utc'],
    component: load(() => import('../tools/ConverterTools'), 'TimestampTool'),
  },
  {
    id: 'uuid-generator', slug: 'uuid-generator', name: 'UUID Generator', category: 'generator', icon: Fingerprint,
    description: 'Buat satu atau banyak UUID v4 menggunakan generator acak kriptografis browser.',
    keywords: ['uuid', 'guid', 'id', 'unik', 'unique', 'random', 'acak', 'v4'],
    component: load(() => import('../tools/GeneratorTools'), 'UuidGenerator'),
  },
  {
    id: 'password-generator', slug: 'password-generator', name: 'Password Generator', category: 'generator', icon: Lock,
    description: 'Buat password acak yang kuat secara lokal di browser; tidak disimpan dan tidak dikirim.',
    keywords: ['password', 'kata sandi', 'sandi', 'random', 'acak', 'aman', 'secure'],
    component: load(() => import('../tools/GeneratorTools'), 'PasswordGenerator'),
  },
  {
    id: 'qr-code', slug: 'qr-code', name: 'QR Code Generator', category: 'generator', icon: QrCode,
    description: 'Buat QR code dari teks atau URL dan unduh sebagai PNG.',
    keywords: ['qr', 'qrcode', 'barcode', 'kode', 'url', 'png', 'unduh'],
    component: load(() => import('../tools/QrCodeGenerator'), 'QrCodeGenerator'),
  },
  {
    id: 'lorem-ipsum', slug: 'lorem-ipsum', name: 'Lorem Ipsum Generator', category: 'generator', icon: Type,
    description: 'Buat teks placeholder dengan jumlah paragraf dan kalimat yang bisa diatur.',
    keywords: ['lorem', 'ipsum', 'placeholder', 'dummy', 'teks', 'paragraf', 'text'],
    component: load(() => import('../tools/GeneratorTools'), 'LoremGenerator'),
  },
  {
    id: 'meta-tag', slug: 'meta-tag', name: 'Meta Tag Generator', category: 'generator', icon: Tags,
    description: 'Hasilkan kode meta tag dasar untuk SEO, lengkap dengan pratinjau hasil pencarian.',
    keywords: ['meta', 'tag', 'seo', 'title', 'description', 'canonical', 'head', 'robots'],
    component: load(() => import('../tools/GeneratorTools'), 'MetaTagGenerator'),
  },
  {
    id: 'robots-txt', slug: 'robots-txt', name: 'Robots.txt Generator', category: 'web', icon: Bot,
    description: 'Susun file robots.txt dengan aturan Allow, Disallow, dan sitemap, lalu unduh.',
    keywords: ['robots', 'robots.txt', 'crawler', 'bot', 'seo', 'disallow', 'allow', 'user-agent'],
    component: load(() => import('../tools/WebTools'), 'RobotsGenerator'),
  },
  {
    id: 'sitemap-xml', slug: 'sitemap-xml', name: 'Sitemap.xml Generator', category: 'web', icon: Layers,
    description: 'Ubah daftar URL menjadi sitemap.xml yang valid, lalu unduh.',
    keywords: ['sitemap', 'sitemap.xml', 'xml', 'seo', 'url', 'lastmod', 'peta situs'],
    component: load(() => import('../tools/WebTools'), 'SitemapGenerator'),
  },
  {
    id: 'open-graph', slug: 'open-graph', name: 'Open Graph Meta Tag Generator', category: 'web', icon: Share2,
    description: 'Buat tag Open Graph dan Twitter/X Card untuk pratinjau tautan di media sosial.',
    keywords: ['open graph', 'og', 'twitter', 'card', 'sosial', 'social', 'share', 'preview', 'meta'],
    component: load(() => import('../tools/WebTools'), 'OpenGraphGenerator'),
  },
  {
    id: 'http-status', slug: 'http-status', name: 'HTTP Status Code Reference', category: 'api', icon: ListOrdered,
    description: 'Referensi kode status HTTP lengkap dengan deskripsi dan contoh penggunaan.',
    keywords: ['http', 'status', 'code', 'kode', '404', '500', '200', 'referensi', 'api', 'error'],
    component: load(() => import('../tools/ApiTools'), 'HttpStatusReference'),
  },
  {
    id: 'jwt-decoder', slug: 'jwt-decoder', name: 'JWT Decoder', category: 'api', icon: KeyRound,
    description: 'Decode header dan payload JWT di browser. Tidak memverifikasi tanda tangan.',
    keywords: ['jwt', 'token', 'json web token', 'decode', 'bearer', 'auth', 'exp', 'claim'],
    component: load(() => import('../tools/ApiTools'), 'JwtDecoder'),
  },
  {
    id: 'api-request-tester', slug: 'api-request-tester', name: 'API Request Tester', category: 'api', icon: Send,
    description: 'Kirim request HTTP langsung dari browser Anda dan lihat status, header, dan respons.',
    keywords: ['api', 'request', 'http', 'fetch', 'rest', 'get', 'post', 'endpoint', 'postman', 'cors', 'test'],
    component: load(() => import('../tools/ApiTools'), 'ApiRequestTester'),
  },
];

export function toolBySlug(slug: string | undefined): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolById(id: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function categoryById(id: string | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function toolsInCategory(id: CategoryId): ToolDef[] {
  return TOOLS.filter((t) => t.category === id);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const haystacks = new Map<string, { name: string; all: string }>(
  TOOLS.map((t) => {
    const cat = CATEGORIES.find((c) => c.id === t.category)?.name ?? '';
    return [t.id, { name: normalize(t.name), all: normalize([t.name, t.description, cat, ...t.keywords].join(' ')) }];
  }),
);

/** Pencarian berdasarkan nama, kategori, deskripsi, dan kata kunci. Semua kata harus cocok. */
export function searchTools(query: string, category?: CategoryId): ToolDef[] {
  const pool = category ? TOOLS.filter((t) => t.category === category) : TOOLS;
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (!tokens.length) return pool;
  const scored: { tool: ToolDef; score: number }[] = [];
  for (const tool of pool) {
    const h = haystacks.get(tool.id);
    if (!h) continue;
    let score = 0;
    let match = true;
    for (const tok of tokens) {
      if (!h.all.includes(tok)) {
        match = false;
        break;
      }
      score += h.name.includes(tok) ? 3 : 1;
    }
    if (match) scored.push({ tool, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.tool);
}
