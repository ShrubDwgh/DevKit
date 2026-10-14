# DevKit

**Tools praktis untuk pekerjaan digital.** DevKit adalah kumpulan 23 tools web untuk developer, pelajar, pemilik website, dan pengguna umum. Semua pemrosesan terjadi di browser Anda. Tanpa akun, tanpa pembayaran, tanpa backend.

> Status: proyek sudah **disiapkan untuk deployment** ke GitHub dan Vercel, tetapi belum di-deploy oleh pembuatnya.

## Teknologi

React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6, Lucide React, vite-plugin-pwa (Workbox), marked + DOMPurify (Markdown), qrcode (QR), terser (minifikasi JS).

## Fitur

- Dashboard dengan pencarian (nama, kategori, deskripsi, kata kunci), kategori, favorit, dan terakhir digunakan.
- Mode gelap (utama), terang, atau ikuti sistem. Navigasi samping di desktop, drawer + bottom navigation di smartphone.
- Favorit dan riwayat ringan disimpan di localStorage (riwayat hanya nama tool dan waktu; bisa dimatikan dan dihapus).
- PWA yang dapat dipasang, halaman Kebijakan Privasi dan Ketentuan Penggunaan, halaman 404.

| Kategori | Tools |
| --- | --- |
| Code | JSON Formatter, JSON Validator, HTML Formatter, CSS Minifier, JavaScript Minifier, Regex Tester, Markdown Previewer |
| Converters | Base64, URL, HTML Entity, Color, Unix Timestamp |
| Generators | UUID v4, Password, QR Code, Lorem Ipsum, Meta Tag |
| Web | robots.txt, sitemap.xml, Open Graph + Twitter Card |
| API | HTTP Status Reference, JWT Decoder, API Request Tester |

## Menjalankan di lingkungan Node.js

Butuh Node.js 20 atau lebih baru.

```bash
npm install          # juga membuat package-lock.json; commit file ini
npm run dev          # server pengembangan
npm run build        # build produksi ke folder dist
npm run typecheck    # pemeriksaan tipe TypeScript
npm run build:strict # typecheck lalu build
npm run preview      # pratinjau hasil build
npm test             # unit test logika (Node 22.6 atau lebih baru)
```

## Mengedit dari GitHub

Buka repositori di GitHub, tekan tombol `.` (atau ganti `github.com` menjadi `github.dev`) untuk editor web, ubah file, lalu commit. Vercel otomatis membangun ulang setiap ada commit di branch utama. Tidak perlu terminal atau Codespaces.

## Deployment dengan GitHub + Vercel

1. Buat repositori GitHub dan unggah seluruh isi proyek ini (folder yang sudah diekstrak, bukan file zip).
2. Di vercel.com pilih **Add New → Project**, impor repositori tersebut.
3. Vercel mengenali Vite otomatis. Konfigurasi sudah ada di `vercel.json` (build `npm run build`, output `dist`, rewrite SPA agar membuka `/alat/json-formatter` langsung tidak 404, serta header keamanan termasuk Content-Security-Policy).
4. Tekan **Deploy**.

### Domain sendiri

Vercel → Project → **Settings → Domains** → tambahkan domain, lalu atur DNS sesuai petunjuk di sana. Setelah domain aktif, isi variabel lingkungan `VITE_SITE_URL` (contoh `https://contoh.com`, tanpa slash di akhir) di **Settings → Environment Variables**, lalu deploy ulang. DevKit akan memasang canonical URL dan `og:url` per halaman. Tanpa variabel ini, keduanya tidak dipasang (domain tidak ditebak).

### Memperbarui aplikasi

Commit perubahan ke GitHub dan Vercel membangun ulang. Service worker memakai `autoUpdate`: pengguna PWA mendapat versi baru pada kunjungan berikutnya. Naikkan `APP_VERSION` di `src/config.ts` dan `version` di `package.json` bila perlu.

## Batasan API Request Tester

Request dikirim **langsung dari browser** ke endpoint tujuan. Tidak ada proxy dan DevKit tidak mencoba mengakali CORS. Karena itu:

- Server tujuan harus mengizinkan origin DevKit lewat header CORS (`Access-Control-Allow-Origin`, dan `Access-Control-Allow-Headers` bila memakai header kustom seperti Authorization). Jika tidak, browser memblokir dan DevKit hanya dapat menampilkan pesan kegagalan umum.
- Browser hanya menampilkan header respons yang diekspos server (`Access-Control-Expose-Headers`).
- Header yang dikendalikan browser (Cookie, Origin, Host, dan sebagainya) diabaikan. Cookie tidak dikirim (`credentials: omit`).
- Dari halaman https, request ke `http://` diblokir browser (mixed content), kecuali ke localhost.
- Alamat layanan metadata cloud (mis. 169.254.169.254) sengaja diblokir. Respons dibatasi 2 MB.
- URL, header (termasuk Authorization), dan body tidak disimpan di mana pun.

## Mengaktifkan AdSlot

Secara bawaan tidak ada iklan dan slot disembunyikan di production. Setelah punya provider iklan yang sungguhan (akun, kode situs, dan kebijakan yang jelas):

1. Buka `src/config.ts`, isi `AD_CONFIG.provider` dengan objek `{ name, render(placement) }` yang mengembalikan elemen/skrip milik provider, lalu set `enabled: true`.
2. Slot tersedia di dashboard dan di bawah halaman tool (`<AdSlot placement="..." />`). Tambahkan domain provider ke `script-src`/`connect-src`/`img-src` pada Content-Security-Policy di `vercel.json`.
3. **Perbarui `src/pages/Legal.tsx`** (Kebijakan Privasi) sebelum iklan atau analitik diaktifkan, karena kebijakan saat ini menyatakan keduanya belum dipakai.

`devPlaceholder: true` hanya menampilkan kerangka tata letak saat `npm run dev` dan bukan iklan.

## Lokasi file penting

| Path | Fungsi |
| --- | --- |
| `src/data/tools.ts` | Registry 23 tools, kategori, dan pencarian. Tambah tool baru di sini. |
| `src/tools/*.tsx` | Antarmuka tiap tool, dikelompokkan per kategori |
| `src/lib/*.ts` | Logika murni tiap tool (tanpa React), diuji di `tests/lib.test.ts` |
| `src/store.ts` | Tema, favorit, riwayat (localStorage dengan validasi dan fallback) |
| `src/components/` | Komponen bersama: toolkit, ui, Layout, Toast, ConfirmDialog, AdSlot, dan lainnya |
| `src/pages/` | Dashboard, Browse, ToolPage, Settings, Legal, NotFound |
| `src/config.ts` | Versi, SITE_URL, konfigurasi AdSlot |
| `src/index.css`, `tailwind.config.js` | Token warna (gelap/terang) dan gaya komponen |
| `vite.config.ts` | Konfigurasi Vite dan PWA (precache aset statis saja) |
| `vercel.json` | Rewrite SPA, header keamanan, cache |
| `public/` | Ikon, favicon, `theme-init.js` |

### Menambah tool baru

1. Buat logika di `src/lib/` dan komponen di `src/tools/`.
2. Daftarkan di `TOOLS` pada `src/data/tools.ts` (id, slug, deskripsi, kata kunci, ikon).

## Catatan keamanan dan privasi

- Tidak ada `eval`, `new Function`, atau iframe. Satu-satunya `dangerouslySetInnerHTML` ada di Markdown Previewer dan hanya menerima keluaran DOMPurify.
- Password, JWT, token, header Authorization, dan isi request tidak pernah masuk localStorage atau riwayat.
- Service worker tidak punya runtime caching, sehingga respons API tidak pernah di-cache.
- Tool yang butuh internet: API Request Tester (dan gambar eksternal di pratinjau Markdown/Open Graph). Tool lain berjalan offline setelah aplikasi pernah dimuat.
- Hasil minifikasi dan generator perlu diperiksa sebelum dipakai di produksi.
