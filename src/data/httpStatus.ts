export type StatusFlag = 'deprecated' | 'unused';

export interface HttpStatus {
  code: number;
  name: string;
  description: string;
  example: string;
  flag?: StatusFlag;
}

export const STATUS_CLASSES = [
  { id: 1, label: '1xx Informasi' },
  { id: 2, label: '2xx Sukses' },
  { id: 3, label: '3xx Pengalihan' },
  { id: 4, label: '4xx Kesalahan klien' },
  { id: 5, label: '5xx Kesalahan server' },
] as const;

type Row = [number, string, string, string, StatusFlag?];

// Hanya kode status yang terdaftar di IANA HTTP Status Code Registry.
const ROWS: Row[] = [
  [100, 'Continue', 'Header request diterima; klien boleh melanjutkan mengirim body.', 'Klien mengirim Expect: 100-continue sebelum mengunggah file besar.'],
  [101, 'Switching Protocols', 'Server setuju beralih protokol sesuai header Upgrade.', 'Koneksi HTTP ditingkatkan menjadi WebSocket.'],
  [102, 'Processing', 'Server masih memproses request yang lama (WebDAV).', 'Operasi WebDAV yang membutuhkan waktu panjang.'],
  [103, 'Early Hints', 'Petunjuk header (mis. Link preload) dikirim sebelum respons final.', 'Browser memuat CSS lebih awal saat server masih menyiapkan HTML.'],
  [200, 'OK', 'Request berhasil.', 'GET /users/1 mengembalikan data pengguna.'],
  [201, 'Created', 'Resource baru berhasil dibuat.', 'POST /users berhasil; header Location menunjuk ke resource baru.'],
  [202, 'Accepted', 'Request diterima tetapi belum selesai diproses.', 'Ekspor laporan dimasukkan ke antrean pekerjaan latar belakang.'],
  [203, 'Non-Authoritative Information', 'Berhasil, tetapi isinya sudah diubah oleh proxy perantara.', 'Proxy memodifikasi header dari server asal.'],
  [204, 'No Content', 'Berhasil tanpa body respons.', 'DELETE /users/1 berhasil dan tidak ada data yang dikembalikan.'],
  [205, 'Reset Content', 'Berhasil; klien diminta mengosongkan tampilan formulir.', 'Form dikosongkan setelah data tersimpan.'],
  [206, 'Partial Content', 'Hanya sebagian resource dikirim sesuai header Range.', 'Pemutar video meminta potongan file dengan Range: bytes=0-999.'],
  [207, 'Multi-Status', 'Hasil beberapa operasi dalam satu respons (WebDAV).', 'Operasi batch WebDAV dengan hasil berbeda untuk tiap item.'],
  [208, 'Already Reported', 'Anggota binding WebDAV sudah dilaporkan di respons yang sama.', 'Menghindari pengulangan item pada listing WebDAV.'],
  [226, 'IM Used', 'Respons berupa hasil delta encoding (RFC 3229).', 'Jarang dipakai; server mengirim selisih dari versi sebelumnya.'],
  [300, 'Multiple Choices', 'Tersedia beberapa pilihan representasi untuk resource.', 'Server menawarkan beberapa format atau bahasa dokumen.'],
  [301, 'Moved Permanently', 'Resource pindah permanen ke URL baru (header Location).', 'Pengalihan http:// ke https:// atau dari domain lama ke domain baru.'],
  [302, 'Found', 'Pengalihan sementara ke URL lain.', 'Pengguna dialihkan ke halaman login lalu kembali.'],
  [303, 'See Other', 'Ambil hasilnya di URL lain menggunakan GET.', 'Setelah POST formulir, klien diarahkan ke halaman konfirmasi.'],
  [304, 'Not Modified', 'Versi cache klien masih terbaru; tanpa body.', 'Browser mengirim If-None-Match dan ETag masih cocok.'],
  [305, 'Use Proxy', 'Dahulu meminta klien memakai proxy tertentu. Sudah deprecated karena risiko keamanan.', 'Tidak boleh dipakai pada API baru.', 'deprecated'],
  [306, '(Unused)', 'Kode ini dicadangkan dan tidak dipakai (dahulu "Switch Proxy").', 'Tidak boleh dikirim server.', 'unused'],
  [307, 'Temporary Redirect', 'Pengalihan sementara dengan mempertahankan method dan body.', 'POST tetap POST saat dialihkan ke URL sementara.'],
  [308, 'Permanent Redirect', 'Pengalihan permanen dengan mempertahankan method dan body.', 'Endpoint API dipindah permanen tanpa mengubah method.'],
  [400, 'Bad Request', 'Request tidak valid (sintaks atau parameter salah).', 'Body JSON rusak atau parameter wajib tidak ada.'],
  [401, 'Unauthorized', 'Autentikasi diperlukan atau gagal.', 'Token Bearer hilang atau sudah kedaluwarsa.'],
  [402, 'Payment Required', 'Dicadangkan untuk penggunaan pembayaran; belum punya semantik standar.', 'Sebagian API memakainya saat kuota atau langganan habis (tidak baku).'],
  [403, 'Forbidden', 'Server memahami request tetapi menolak mengizinkannya.', 'Pengguna sudah login tetapi tidak punya hak akses.'],
  [404, 'Not Found', 'Resource tidak ditemukan.', 'GET /users/999 untuk pengguna yang tidak ada.'],
  [405, 'Method Not Allowed', 'Method tidak diizinkan untuk resource ini.', 'DELETE ke endpoint yang hanya menerima GET; lihat header Allow.'],
  [406, 'Not Acceptable', 'Server tidak dapat menghasilkan representasi sesuai header Accept.', 'Klien meminta Accept: application/xml tetapi server hanya menyediakan JSON.'],
  [407, 'Proxy Authentication Required', 'Autentikasi ke proxy diperlukan.', 'Proxy kantor meminta kredensial.'],
  [408, 'Request Timeout', 'Server menunggu request lengkap terlalu lama.', 'Koneksi lambat sehingga body tidak selesai dikirim tepat waktu.'],
  [409, 'Conflict', 'Request bertentangan dengan keadaan resource saat ini.', 'Mendaftarkan pengguna dengan email yang sudah ada.'],
  [410, 'Gone', 'Resource sudah dihapus secara permanen.', 'Artikel yang sengaja dihapus dan tidak akan kembali.'],
  [411, 'Length Required', 'Header Content-Length wajib disertakan.', 'Server menolak upload tanpa Content-Length.'],
  [412, 'Precondition Failed', 'Syarat pada header (If-Match dan sejenisnya) tidak terpenuhi.', 'Update ditolak karena ETag berubah sejak dibaca.'],
  [413, 'Content Too Large', 'Body request melebihi batas server (dahulu bernama Payload Too Large).', 'Upload file melebihi batas ukuran.'],
  [414, 'URI Too Long', 'URL terlalu panjang untuk diproses server.', 'Query string berisi data yang sangat besar.'],
  [415, 'Unsupported Media Type', 'Format body (Content-Type) tidak didukung.', 'Mengirim XML ke endpoint yang hanya menerima JSON.'],
  [416, 'Range Not Satisfiable', 'Rentang yang diminta di luar ukuran resource.', 'Range: bytes=5000-6000 pada file 1000 byte.'],
  [417, 'Expectation Failed', 'Nilai header Expect tidak dapat dipenuhi.', 'Server tidak mendukung Expect: 100-continue.'],
  [418, "I'm a teapot", 'Berasal dari lelucon April Mop (RFC 2324); dicadangkan dan tidak untuk penggunaan produksi.', 'Kadang dipakai sebagai easter egg.'],
  [421, 'Misdirected Request', 'Request dikirim ke server yang tidak mampu memberi respons.', 'Koneksi HTTP/2 dipakai ulang untuk host yang salah.'],
  [422, 'Unprocessable Content', 'Sintaks benar tetapi isi tidak dapat diproses (dahulu Unprocessable Entity).', 'Validasi gagal: format email salah pada body JSON yang valid.'],
  [423, 'Locked', 'Resource sedang dikunci (WebDAV).', 'File WebDAV sedang diedit pengguna lain.'],
  [424, 'Failed Dependency', 'Gagal karena request sebelumnya yang menjadi dependensi gagal (WebDAV).', 'Satu langkah dalam operasi berantai gagal.'],
  [425, 'Too Early', 'Server menolak memproses request yang berisiko diputar ulang (replay).', 'Request pada TLS early data ditolak.'],
  [426, 'Upgrade Required', 'Klien harus beralih ke protokol lain.', 'Server mewajibkan versi TLS atau protokol yang lebih baru.'],
  [428, 'Precondition Required', 'Server mewajibkan request bersyarat.', 'API mewajibkan header If-Match untuk mencegah lost update.'],
  [429, 'Too Many Requests', 'Batas laju (rate limit) terlampaui; lihat header Retry-After.', 'Terlalu banyak request ke API dalam waktu singkat.'],
  [431, 'Request Header Fields Too Large', 'Header request terlalu besar.', 'Cookie yang menumpuk membuat header melebihi batas.'],
  [451, 'Unavailable For Legal Reasons', 'Konten diblokir karena alasan hukum.', 'Halaman tidak tersedia di suatu negara akibat perintah hukum.'],
  [500, 'Internal Server Error', 'Kesalahan tak terduga di server.', 'Exception yang tidak tertangani pada kode backend.'],
  [501, 'Not Implemented', 'Server tidak mendukung fungsi yang diminta.', 'Method HTTP yang tidak dikenali server.'],
  [502, 'Bad Gateway', 'Gateway atau proxy menerima respons tidak valid dari server upstream.', 'Nginx tidak dapat berkomunikasi dengan aplikasi di belakangnya.'],
  [503, 'Service Unavailable', 'Server sementara tidak tersedia (perawatan atau kelebihan beban); cek Retry-After.', 'Situs dalam mode maintenance.'],
  [504, 'Gateway Timeout', 'Gateway tidak menerima respons tepat waktu dari upstream.', 'Backend terlalu lama merespons sehingga proxy menyerah.'],
  [505, 'HTTP Version Not Supported', 'Versi HTTP pada request tidak didukung.', 'Klien memakai versi HTTP yang tidak dikenali server.'],
  [506, 'Variant Also Negotiates', 'Kesalahan konfigurasi content negotiation di server.', 'Konfigurasi negosiasi konten saling merujuk.'],
  [507, 'Insufficient Storage', 'Server kehabisan ruang penyimpanan untuk menyelesaikan request (WebDAV).', 'Upload gagal karena disk server penuh.'],
  [508, 'Loop Detected', 'Server mendeteksi perulangan tak berujung (WebDAV).', 'Struktur binding yang saling merujuk.'],
  [511, 'Network Authentication Required', 'Klien harus melakukan autentikasi jaringan.', 'Captive portal Wi-Fi hotel meminta login.'],
];

export const HTTP_STATUSES: HttpStatus[] = ROWS.map(([code, name, description, example, flag]) => ({ code, name, description, example, flag }));

export function statusClass(code: number): number {
  return Math.floor(code / 100);
}
