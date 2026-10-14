// Jalankan: npm test  (Node >= 22.6). Menguji logika murni di src/lib dan src/data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJson, formatJson, describeJson } from '../src/lib/json.ts';
import { formatHtml, encodeEntities, decodeEntities } from '../src/lib/html.ts';
import { minifyCss } from '../src/lib/css.ts';
import { runRegex } from '../src/lib/regex.ts';
import { base64Encode, base64Decode, urlEncode, urlDecode, parseHex, rgbToHex, rgbToHsl, hslToRgb, timestampToMs, dateInputToMs, describeMs } from '../src/lib/convert.ts';
import { uuidv4, generatePassword, passwordComposition, randomInt, generateLorem, passwordEntropyBits } from '../src/lib/generate.ts';
import { buildMetaTags, buildOpenGraph, buildRobots, buildSitemap } from '../src/lib/web.ts';
import { decodeJwt } from '../src/lib/jwt.ts';
import { buildRequest, checkTargetUrl, parseHeaders, isForbiddenHeader } from '../src/lib/http.ts';
import { HTTP_STATUSES } from '../src/data/httpStatus.ts';

test('JSON: format, minify, error dengan lokasi', () => {
  const f = formatJson('{"a":[1,2],"b":{"c":null}}', 2);
  assert.ok(f.ok && f.value.includes('\n  "a": ['));
  const m = formatJson('{ "a": 1 }', 0);
  assert.ok(m.ok && m.value === '{"a":1}');
  const bad = parseJson('{"a":1,}');
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.error, /JSON tidak valid/);
  assert.equal(parseJson('').ok, false);
  assert.equal(parseJson("{'a':1}").ok, false);
  assert.deepEqual(describeJson({ a: { b: [1] } }).depth, 3);
});

test('HTML formatter: indentasi, void, raw, atribut', () => {
  const r = formatHtml('<div><p>Halo</p><br><ul><li>a</li><li>b</li></ul></div>', 2);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.value, '<div>\n  <p>Halo</p>\n  <br>\n  <ul>\n    <li>a</li>\n    <li>b</li>\n  </ul>\n</div>');
  const s = formatHtml('<script>if (a<b) {\n  x();\n}</script><a   href="a>b"  >t</a>', 2);
  assert.ok(s.ok);
  if (s.ok) {
    assert.ok(s.value.includes('if (a<b) {'));
    assert.ok(s.value.includes('<a href="a>b">t</a>'));
  }
  const pre = formatHtml('<pre>  a\n  b</pre>', 2);
  assert.ok(pre.ok && pre.value === '<pre>  a\n  b</pre>');
  assert.equal(formatHtml('   ', 2).ok, false);
});

test('Entity encode/decode', () => {
  assert.equal(encodeEntities('<a href="x">&\'', false), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  assert.equal(encodeEntities('é', true), '&#233;');
  const d = decodeEntities('&lt;b&gt; &amp; &#169; &#x1F600; &copy; &bogus; &#0;');
  assert.equal(d.output, '<b> & © 😀 © &bogus; &#0;');
  assert.deepEqual(d.unknown.sort(), ['&#0;', '&bogus;']);
  // hasil decode hanya teks, tidak pernah dieksekusi
  assert.equal(decodeEntities('&lt;script&gt;alert(1)&lt;/script&gt;').output, '<script>alert(1)</script>');
});

test('CSS minifier', () => {
  const css = `/* c */ a  >  b { color : red ; margin: 0 auto ; }\n.x:hover,.y { background: url( "a b.png" ) ; content: "a  ;  b" }\n@media (min-width: 600px) { a { width: calc(100% - 10px); } }\n/*! keep */`;
  const r = minifyCss(css, true);
  assert.equal(r.warnings.length, 0);
  assert.ok(r.output.startsWith('a>b{color :red;margin:0 auto}'));
  assert.ok(r.output.includes('url("a b.png")'));
  assert.ok(r.output.includes('content:"a  ;  b"'));
  assert.ok(r.output.includes('@media (min-width:600px){a{width:calc(100% - 10px)}}'));
  assert.ok(r.output.endsWith('/*! keep */'));
  assert.ok(!minifyCss('a{} /*! k */', false).output.includes('k'));
  assert.ok(minifyCss('a{color:red', true).warnings.length > 0);
  assert.equal(minifyCss('a :hover{x:y}', true).output, 'a :hover{x:y}');
});

test('Regex runner', () => {
  const r = runRegex('(?<n>\\d+)', 'g', 'a1 b22\nc333');
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.matches.length, 3);
    assert.equal(r.matches[1].text, '22');
    assert.equal(r.matches[2].line, 2);
    assert.equal(r.matches[2].named.n, '333');
  }
  const empty = runRegex('x*', 'g', 'ab');
  assert.ok(empty.ok && empty.matches.length === 3); // zero-length tidak membuat loop tak berujung
  const single = runRegex('a', '', 'aaa');
  assert.ok(single.ok && single.matches.length === 1);
  assert.equal(runRegex('(', 'g', 'x').ok, false);
  assert.equal(runRegex('', 'g', 'x').ok, false);
  const many = runRegex('a', 'g', 'a'.repeat(5000));
  assert.ok(many.ok && many.truncated && many.matches.length === 1000);
});

test('Base64 Unicode, URL-safe, validasi', () => {
  const enc = base64Encode('Halo dunia — 你好 😀', false);
  const dec = base64Decode(enc);
  assert.ok(dec.ok && dec.value === 'Halo dunia — 你好 😀');
  assert.equal(base64Encode('??>>', true), 'Pz8-Pg');
  assert.ok(base64Decode('Pz8-Pg').ok);
  assert.equal(base64Decode('***').ok, false);
  assert.equal(base64Decode('A').ok, false);
  assert.equal(base64Decode('/w==').ok, false); // byte 0xFF bukan UTF-8 valid
  assert.equal(base64Decode('').ok, false);
  assert.equal(base64Encode('', false), '');
});

test('URL encode/decode', () => {
  const e = urlEncode('a b&c=d/é', 'component');
  assert.ok(e.ok && e.value === 'a%20b%26c%3Dd%2F%C3%A9');
  const f = urlEncode('https://x.com/a b?q=é', 'full');
  assert.ok(f.ok && f.value === 'https://x.com/a%20b?q=%C3%A9');
  assert.ok(urlDecode('a%20b%C3%A9', false).ok);
  assert.equal(urlDecode('%E0%A4%A', false).ok, false);
  const plus = urlDecode('a+b', true);
  assert.ok(plus.ok && plus.value === 'a b');
});

test('Warna: HEX/RGB/HSL', () => {
  assert.deepEqual(parseHex('#3B82F6'), { r: 59, g: 130, b: 246 });
  assert.deepEqual(parseHex('fff'), { r: 255, g: 255, b: 255 });
  assert.equal(parseHex('#12'), null);
  assert.equal(parseHex('#GGGGGG'), null);
  assert.equal(rgbToHex({ r: 59, g: 130, b: 246 }), '#3B82F6');
  assert.deepEqual(rgbToHsl({ r: 255, g: 0, b: 0 }), { h: 0, s: 100, l: 50 });
  assert.deepEqual(rgbToHsl({ r: 0, g: 0, b: 0 }), { h: 0, s: 0, l: 0 });
  assert.deepEqual(hslToRgb({ h: 120, s: 100, l: 50 }), { r: 0, g: 255, b: 0 });
  assert.deepEqual(hslToRgb({ h: 0, s: 0, l: 100 }), { r: 255, g: 255, b: 255 });
  const rt = hslToRgb(rgbToHsl({ r: 59, g: 130, b: 246 }));
  assert.ok(Math.abs(rt.r - 59) <= 2 && Math.abs(rt.g - 130) <= 2 && Math.abs(rt.b - 246) <= 2);
});

test('Timestamp', () => {
  const s = timestampToMs('1700000000', 'auto');
  assert.ok(s.ok && s.value.ms === 1700000000000 && s.value.unit === 's');
  const ms = timestampToMs('1700000000000', 'auto');
  assert.ok(ms.ok && ms.value.unit === 'ms');
  assert.equal(describeMs(1700000000000).iso, '2023-11-14T22:13:20.000Z');
  assert.equal(timestampToMs('abc', 'auto').ok, false);
  assert.equal(timestampToMs('99999999999999999999', 'ms').ok, false);
  const d = dateInputToMs('2023-11-14T22:13:20', true);
  assert.ok(d.ok && d.value === 1700000000000);
  assert.equal(dateInputToMs('2023-02-30T10:00', true).ok, false);
  assert.equal(dateInputToMs('', true).ok, false);
});

test('UUID, password, random, lorem', () => {
  const ids = new Set(Array.from({ length: 200 }, () => uuidv4()));
  assert.equal(ids.size, 200);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const o = { length: 24, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false };
  for (let i = 0; i < 100; i++) {
    const p = generatePassword(o);
    assert.ok(p.ok && p.value.length === 24);
    if (p.ok) {
      const c = passwordComposition(p.value);
      assert.ok(c.lower > 0 && c.upper > 0 && c.digits > 0 && c.symbols > 0);
    }
  }
  const digitsOnly = generatePassword({ ...o, lower: false, upper: false, symbols: false });
  assert.ok(digitsOnly.ok && /^\d{24}$/.test(digitsOnly.value));
  const noAmb = generatePassword({ ...o, symbols: false, avoidAmbiguous: true, length: 128 });
  assert.ok(noAmb.ok && !/[0O1lI]/.test(noAmb.value));
  assert.equal(generatePassword({ ...o, lower: false, upper: false, digits: false, symbols: false }).ok, false);
  assert.equal(generatePassword({ ...o, length: 3 }).ok, false);
  assert.ok(passwordEntropyBits(o) > 100);
  const counts = new Array(6).fill(0);
  for (let i = 0; i < 6000; i++) counts[randomInt(6)]++;
  assert.ok(counts.every((c) => c > 800 && c < 1200));
  const lorem = generateLorem(3, 4, true);
  assert.equal(lorem.split('\n\n').length, 3);
  assert.ok(lorem.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'));
  assert.equal(generateLorem(999, 999, false).split('\n\n').length, 20);
});

test('Meta tag, Open Graph', () => {
  const m = buildMetaTags({ title: 'A & B <x>', description: 'Desk "kutip"', url: 'https://contoh.com', author: '', themeColor: '3b82f6', robots: 'index, follow', includeBasics: true });
  assert.ok(m.ok);
  if (m.ok) {
    assert.ok(m.value.code.includes('<title>A &amp; B &lt;x&gt;</title>'));
    assert.ok(m.value.code.includes('content="Desk &quot;kutip&quot;"'));
    assert.ok(m.value.code.includes('<meta name="theme-color" content="#3B82F6" />'));
    assert.ok(m.value.code.includes('<link rel="canonical" href="https://contoh.com" />'));
  }
  assert.equal(buildMetaTags({ title: '', description: '', url: '', author: '', themeColor: '', robots: 'index, follow', includeBasics: true }).ok, false);
  assert.equal(buildMetaTags({ title: 'x', description: '', url: 'javascript:alert(1)', author: '', themeColor: '', robots: 'index, follow', includeBasics: false }).ok, false);
  const og = buildOpenGraph({ title: 'T', description: 'D', url: 'https://a.com/x', image: 'https://a.com/i.png', siteName: 'S', type: 'website', locale: 'id_ID', twitterCard: 'summary_large_image', twitterHandle: 'akun' });
  assert.ok(og.ok);
  if (og.ok) {
    assert.ok(og.value.code.includes('<meta property="og:image" content="https://a.com/i.png" />'));
    assert.ok(og.value.code.includes('<meta name="twitter:site" content="@akun" />'));
  }
  assert.equal(buildOpenGraph({ title: 'T', description: '', url: '', image: 'ftp://x', siteName: '', type: 'website', locale: '', twitterCard: 'summary', twitterHandle: '' }).ok, false);
});

test('robots.txt', () => {
  const r = buildRobots([{ userAgent: '*', allow: '/public/', disallow: '/admin/\n/tmp/' }], 'https://contoh.com/sitemap.xml');
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.value.code, 'User-agent: *\nAllow: /public/\nDisallow: /admin/\nDisallow: /tmp/\n\nSitemap: https://contoh.com/sitemap.xml\n');
  const empty = buildRobots([{ userAgent: 'Googlebot', allow: '', disallow: '' }], '');
  assert.ok(empty.ok && empty.value.code === 'User-agent: Googlebot\nDisallow:\n');
  const block = buildRobots([{ userAgent: '*', allow: '', disallow: '/' }], '');
  assert.ok(block.ok && block.value.warnings.some((w) => w.includes('memblokir seluruh situs')));
  assert.equal(buildRobots([{ userAgent: '*', allow: '', disallow: 'admin' }], '').ok, false);
  assert.equal(buildRobots([{ userAgent: '', allow: '', disallow: '' }], '').ok, false);
  assert.equal(buildRobots([{ userAgent: '*', allow: '', disallow: '' }], 'bukan-url').ok, false);
});

test('sitemap.xml', () => {
  const s = buildSitemap('https://contoh.com/\nhttps://contoh.com/a?x=1&y=2 | 2026-01-05\nhttps://contoh.com/\n', '2026-10-14');
  assert.ok(s.ok);
  if (s.ok) {
    assert.equal(s.value.count, 2);
    assert.equal(s.value.duplicates, 1);
    assert.ok(s.value.code.includes('<loc>https://contoh.com/a?x=1&amp;y=2</loc>'));
    assert.ok(s.value.code.includes('<lastmod>2026-01-05</lastmod>'));
    assert.ok(s.value.code.includes('<lastmod>2026-10-14</lastmod>'));
    assert.ok(s.value.code.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  }
  assert.equal(buildSitemap('ftp://x.com', '').ok, false);
  assert.equal(buildSitemap('https://a.com | 2026-02-31', '').ok, false);
  assert.equal(buildSitemap('', '').ok, false);
});

const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

test('JWT decoder (tanpa verifikasi tanda tangan)', () => {
  const now = Date.UTC(2026, 9, 14);
  const tok = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: '123', iss: 'x', exp: now / 1000 - 3600, iat: now / 1000 - 7200, nbf: now / 1000 + 100 })}.c2ln`;
  const r = decodeJwt(`Bearer ${tok}`, now);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.header.alg, 'HS256');
    assert.equal(r.value.timeClaims.find((c) => c.name === 'exp')?.tone, 'error');
    assert.equal(r.value.timeClaims.find((c) => c.name === 'nbf')?.tone, 'warning');
    assert.equal(r.value.textClaims.length, 2);
  }
  const none = decodeJwt(`${b64u({ alg: 'none' })}.${b64u({ a: 1 })}.`, now);
  assert.ok(none.ok && none.value.warnings.some((w) => w.includes('none')));
  assert.equal(decodeJwt('a.b', now).ok, false);
  assert.equal(decodeJwt('a.b.c.d.e', now).ok, false);
  assert.equal(decodeJwt('###.###.###', now).ok, false);
  assert.equal(decodeJwt(`${b64u([1])}.${b64u({})}.x`, now).ok, false);
  assert.equal(decodeJwt('', now).ok, false);
});

test('API request: validasi URL, header, body, blokir metadata', () => {
  assert.equal(checkTargetUrl('').ok, false);
  assert.equal(checkTargetUrl('ftp://x.com').ok, false);
  assert.equal(checkTargetUrl('https://user:pw@x.com').ok, false);
  assert.equal(checkTargetUrl('http://169.254.169.254/latest/meta-data').ok, false);
  assert.equal(checkTargetUrl('http://metadata.google.internal/').ok, false);
  assert.equal(checkTargetUrl('http://2852039166/').ok, false); // desimal = 169.254.169.254
  assert.ok(checkTargetUrl('http://localhost:3000/api').ok);
  assert.ok(parseHeaders('Authorization: Bearer abc\n\nX-A: b: c').ok);
  assert.equal(parseHeaders('tanpa-titik-dua').ok, false);
  assert.equal(parseHeaders('Bad Name: x').ok, false);
  assert.ok(isForbiddenHeader('Cookie') && isForbiddenHeader('sec-fetch-mode') && !isForbiddenHeader('Authorization'));
  const req = buildRequest({ method: 'POST', url: 'https://api.contoh.com/x', headers: 'X-Key: 1', body: '{"a":1}' }, 'https:');
  assert.ok(req.ok);
  if (req.ok) {
    assert.equal(req.value.init.credentials, 'omit');
    assert.equal((req.value.init.headers as Headers).get('content-type'), 'application/json');
    assert.equal(req.value.init.body, '{"a":1}');
  }
  const get = buildRequest({ method: 'GET', url: 'https://a.com', headers: '', body: 'abaikan' }, 'https:');
  assert.ok(get.ok && get.value.init.body === undefined && get.value.notes.length === 1);
  assert.equal(buildRequest({ method: 'GET', url: 'http://api.contoh.com', headers: '', body: '' }, 'https:').ok, false);
  assert.ok(buildRequest({ method: 'GET', url: 'http://localhost:8080', headers: '', body: '' }, 'https:').ok);
});

test('Data status HTTP', () => {
  const codes = HTTP_STATUSES.map((s) => s.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(HTTP_STATUSES.find((s) => s.code === 305)?.flag === 'deprecated');
  for (const s of HTTP_STATUSES) assert.ok(s.code >= 100 && s.code < 600 && s.name && s.description && s.example);
  for (const c of [200, 301, 404, 500]) assert.ok(codes.includes(c));
});
