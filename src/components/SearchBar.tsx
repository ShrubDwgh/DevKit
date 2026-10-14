import { useId } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({ value, onChange, resultCount }: { value: string; onChange: (v: string) => void; resultCount?: number }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Cari tools
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari tools, kategori, atau kata kunci"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          className="input pl-10 pr-11"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {value && resultCount !== undefined ? `${resultCount} hasil ditemukan` : ''}
      </p>
    </div>
  );
}
