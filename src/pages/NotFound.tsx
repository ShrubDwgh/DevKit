import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  usePageMeta('Halaman tidak ditemukan — DevKit');
  return (
    <EmptyState
      icon={SearchX}
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada di DevKit. Periksa kembali alamatnya atau kembali ke beranda."
      action={
        <Link to="/" className="btn btn-primary">
          Kembali ke beranda
        </Link>
      }
    />
  );
}
