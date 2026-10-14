import { useDeferredValue, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Star } from 'lucide-react';
import { CATEGORIES, searchTools, toolById, TOOLS, toolsInCategory } from '../data/tools';
import type { ToolDef } from '../data/tools';
import { TAGLINE } from '../config';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAppState } from '../store';
import { SearchBar } from '../components/SearchBar';
import { ToolGrid } from '../components/ToolCard';
import { CategoryNavigation } from '../components/CategoryNavigation';
import { AdSlot } from '../components/AdSlot';
import { EmptyState } from '../components/ui';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Dashboard() {
  usePageMeta('DevKit — tools praktis untuk pekerjaan digital');
  const { favorites, history } = useAppState();
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q);
  const searching = deferred.trim().length > 0;
  const results = useMemo(() => searchTools(deferred), [deferred]);

  const favTools = favorites.map(toolById).filter((t): t is ToolDef => !!t);
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: ToolDef[] = [];
    for (const h of history) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      const t = toolById(h.id);
      if (t) out.push(t);
      if (out.length >= 4) break;
    }
    return out;
  }, [history]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">DevKit</h1>
        <p className="mt-1.5 text-muted">
          {TAGLINE.charAt(0).toUpperCase() + TAGLINE.slice(1)} {TOOLS.length} tools berjalan langsung di browser Anda, tanpa akun.
        </p>
      </header>

      <SearchBar value={q} onChange={setQ} resultCount={results.length} />

      {searching ? (
        results.length ? (
          <Section title={`${results.length} hasil`}>
            <ToolGrid tools={results} />
          </Section>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Tidak ada tool yang cocok"
            description="Coba kata kunci lain, misalnya “json”, “base64”, atau “seo”."
          />
        )
      ) : (
        <>
          {favTools.length > 0 ? (
            <Section title="Favorit">
              <ToolGrid tools={favTools} />
            </Section>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Star className="h-4 w-4 shrink-0" aria-hidden />
              Tandai tool dengan ikon bintang di halamannya agar muncul di sini.
            </p>
          )}
          {recent.length > 0 && (
            <Section title="Terakhir digunakan">
              <ToolGrid tools={recent} />
            </Section>
          )}
          <Section title="Kategori">
            <CategoryNavigation variant="grid" />
          </Section>
          <AdSlot placement="dashboard" />
          {CATEGORIES.map((c) => (
            <Section key={c.id} title={c.name}>
              <ToolGrid tools={toolsInCategory(c.id)} />
            </Section>
          ))}
          <p className="text-sm text-muted">
            Butuh bantuan memilih? Buka{' '}
            <Link to="/alat" className="text-accent underline">
              daftar semua tools
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
