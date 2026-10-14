import type { ReactNode } from 'react';
import { LEGAL_UPDATED } from '../config';
import { usePageMeta } from '../hooks/usePageMeta';

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="max-w-prose space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">Terakhir diperbarui: {LEGAL_UPDATED}</p>
      </header>
      {children}
    </article>
  );
}

function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export function Privacy() {
  usePageMeta('Kebijakan Privasi — DevKit');
  return (
    <Page title="Kebijakan Privasi">
      <Sec title="Ringkasan">
        <p>
          DevKit dirancang agar data Anda tetap di perangkat Anda. Sebagian besar tools memproses input langsung di browser dan tidak
          mengirimnya ke server DevKit. DevKit tidak meminta akun dan tidak memiliki basis data pengguna.
        </p>
      </Sec>
      <Sec title="Data yang disimpan di browser Anda">
        <p>
          DevKit memakai localStorage browser untuk data ringan: pilihan tema, daftar tool favorit, riwayat penggunaan, dan pengaturan
          riwayat. Data ini hanya berada di browser dan perangkat Anda.
        </p>
        <p>
          Riwayat hanya berisi nama tool dan waktu pembukaan. Riwayat dapat dinonaktifkan dan dihapus kapan saja di halaman Pengaturan, dan
          tombol hapus data lokal hanya menghapus data milik DevKit.
        </p>
      </Sec>
      <Sec title="Yang tidak disimpan">
        <p>
          Password yang dihasilkan, token JWT, API key, header Authorization, isi request API, serta isi input dan hasil tools tidak
          disimpan oleh aplikasi, baik di localStorage maupun di riwayat. Isi tersebut hilang saat Anda menutup atau memuat ulang halaman.
        </p>
      </Sec>
      <Sec title="API Request Tester">
        <p>
          Tool ini mengirim request langsung dari browser Anda ke alamat yang Anda masukkan. Request tidak melewati server DevKit. Server
          tujuan dapat melihat alamat IP Anda dan data yang Anda kirim, dan memiliki kebijakan privasinya sendiri. Request dapat gagal
          karena CORS atau kebijakan server tujuan.
        </p>
      </Sec>
      <Sec title="Hosting dan log server">
        <p>
          Aplikasi ini disajikan sebagai berkas statis oleh penyedia hosting. Penyedia hosting dapat mencatat log akses standar (misalnya
          alamat IP dan waktu akses) sesuai kebijakannya sendiri. DevKit tidak membaca log tersebut untuk melacak pengguna.
        </p>
      </Sec>
      <Sec title="Iklan dan analitik">
        <p>
          kebijakan iklan ini dapat diperbarui sewaktu-waktu mengikuti perubahan layanan, teknologi periklanan, atau ketentuan yang berlaku. perubahan akan dipublikasikan pada halaman ini beserta tanggal pembaruan terbaru.
        </p>
      </Sec>
      <Sec title="Cache offline">
        <p>
          DevKit dapat dipasang sebagai aplikasi (PWA). Service worker hanya menyimpan berkas statis aplikasi agar dapat dibuka saat offline.
          Respons API dan data pribadi tidak di-cache.
        </p>
      </Sec>
      <Sec title="Perubahan kebijakan">
        <p>Kebijakan ini dapat diperbarui. Tanggal pembaruan terakhir tercantum di bagian atas halaman.</p>
      </Sec>
    </Page>
  );
}

export function Terms() {
  usePageMeta('Ketentuan Penggunaan — DevKit');
  return (
    <Page title="Ketentuan Penggunaan">
      <Sec title="Tujuan layanan">
        <p>DevKit menyediakan kumpulan alat berbasis web untuk membantu pekerjaan digital, tanpa biaya dan tanpa akun.</p>
      </Sec>
      <Sec title="Tanggung jawab pengguna">
        <p>
          Anda bertanggung jawab memeriksa setiap hasil sebelum menggunakannya di lingkungan produksi, termasuk kode yang diformat atau
          diminifikasi, file robots.txt, sitemap, meta tag, dan hasil konversi.
        </p>
        <p>
          Hasil tools dibuat sebagai bantuan. DevKit tidak menjamin bahwa setiap output selalu sesuai dengan kebutuhan, bebas dari
          kesalahan, atau cocok untuk tujuan tertentu.
        </p>
      </Sec>
      <Sec title="Akses ke API pihak ketiga">
        <p>
          Saat memakai API Request Tester, Anda harus memiliki izin yang sesuai untuk mengakses endpoint tujuan dan mematuhi ketentuan
          layanan pemiliknya. Jangan memasukkan kredensial pada perangkat yang tidak Anda percayai.
        </p>
      </Sec>
      <Sec title="Penggunaan yang dilarang">
        <p>
          Dilarang menggunakan DevKit untuk aktivitas ilegal atau yang merugikan orang lain, termasuk mengakses sistem tanpa izin, menyerang
          layanan, atau melanggar hak pihak lain.
        </p>
      </Sec>
      <Sec title="Batasan layanan">
        <p>
          Gunakan layanan secara wajar. Layanan disediakan apa adanya dan dapat berubah, terhenti, atau diperbarui sewaktu-waktu. Sejauh
          diizinkan hukum, pengelola DevKit tidak bertanggung jawab atas kerugian yang timbul dari penggunaan tools ini.
        </p>
      </Sec>
      <Sec title="Perubahan ketentuan">
        <p>Ketentuan ini dapat diperbarui. Tanggal pembaruan terakhir tercantum di bagian atas halaman.</p>
      </Sec>
    </Page>
  );
}
