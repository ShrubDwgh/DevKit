import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { CATEGORIES, categoryById, searchTools, TOOLS } from '../data/tools';
import type { CategoryId } from '../data/tools';
import { usePageMeta } from '../hooks/usePageMeta';
import { SearchBar } from '../components/SearchBar';
import { ToolGrid } from '../components/ToolCard';
import { Button, EmptyState } from '../components/ui';
import NotFound from './NotFound';

export function AllTools() {
  usePageMeta('Semua tools — DevKit', 'Daftar lengkap tools DevKit untuk developer dan pekerjaan digital.');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const results = useMemo(() => searchTools(q, cat === 'all' ? undefined : cat), [q, cat]);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Semua tools</h1>
      <SearchBar value={q} onChange={setQ} resultCount={results.length} />
      <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-2">
        {[{ id: 'all' as const, name: `Semua (${TOOLS.length})` }, ...CATEGORIES].map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCat(c.id)}
              className={`min-h-10 rounded-lg border px-3 text-sm transition-colors ${
                active ? 'border-accent-strong bg-accent-strong font-medium text-white' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
      {results.length ? (
        <ToolGrid tools={results} />
      ) : (
        <EmptyState
          icon={SearchX}
          title="Tidak ada tool yang cocok"
          description="Coba kata kunci lain, misalnya “json”, “base64”, atau “seo”."
          action={
            <Button
              onClick={() => {
                setQ('');
                setCat('all');
              }}
            >
              Hapus filter
            </Button>
          }
        />
      )}
    </div>
  );
}

export function CategoryPage() {
  const { id } = useParams();
  const category = categoryById(id);
  usePageMeta(category ? `${category.name} — DevKit` : 'Kategori tidak ditemukan — DevKit', category?.description);
  if (!category) return <NotFound />;
  const tools = TOOLS.filter((t) => t.category === category.id);
  const Icon = category.icon;
  return (
    <div className="space-y-5">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elevated text-accent">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{category.name}</h1>
          <p className="mt-1 text-sm text-muted">{category.description}</p>
        </div>
      </header>
      <ToolGrid tools={tools} />
    </div>
  );
}
