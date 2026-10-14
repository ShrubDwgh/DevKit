import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, RotateCcw, Star } from 'lucide-react';
import { copyText } from '../lib/browser';
import { actions, useAppState } from '../store';
import { categoryById, type ToolDef } from '../data/tools';
import { Button } from './ui';
import { useToast } from './Toast';

export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function CopyButton({ text, label = 'Salin', disabled }: { text: string; label?: string; disabled?: boolean }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onClick = async () => {
    const ok = await copyText(text);
    if (ok) {
      toast('Disalin ke clipboard.', 'success');
      setDone(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDone(false), 1500);
    } else {
      toast('Gagal menyalin. Sorot teks lalu salin secara manual.', 'error');
    }
  };
  return (
    <Button variant="secondary" onClick={onClick} disabled={disabled || !text} className="min-h-10 px-3">
      {done ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {done ? 'Tersalin' : label}
    </Button>
  );
}

/** Hanya mereset tool yang sedang dibuka. Tidak menyentuh favorit atau riwayat. */
export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      <RotateCcw className="h-4 w-4" aria-hidden />
      Reset
    </Button>
  );
}

export function FavoriteButton({ toolId, name }: { toolId: string; name: string }) {
  const { favorites } = useAppState();
  const toast = useToast();
  const fav = favorites.includes(toolId);
  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? `Hapus ${name} dari favorit` : `Tambahkan ${name} ke favorit`}
      onClick={() => toast(actions.toggleFavorite(toolId) ? 'Ditambahkan ke favorit.' : 'Dihapus dari favorit.', 'info')}
      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated transition-colors hover:border-field"
    >
      <Star className={`h-5 w-5 ${fav ? 'fill-warning text-warning' : 'text-muted'}`} aria-hidden />
    </button>
  );
}

export function ToolHeader({ tool }: { tool: ToolDef }) {
  const cat = categoryById(tool.category);
  const Icon = tool.icon;
  return (
    <header className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-elevated text-accent">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        {cat && (
          <Link to={`/kategori/${cat.id}`} className="text-xs text-muted hover:text-fg hover:underline">
            {cat.name}
          </Link>
        )}
        <h1 className="text-xl font-semibold leading-tight">{tool.name}</h1>
        <p className="mt-1 text-sm text-muted">{tool.description}</p>
      </div>
      <FavoriteButton toolId={tool.id} name={tool.name} />
    </header>
  );
}

interface ToolInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  hint?: string;
}

export function ToolInput({ label, value, onChange, placeholder, rows = 8, mono = true, hint }: ToolInputProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        className={`input resize-y leading-relaxed ${mono ? 'font-mono' : ''}`}
      />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function ToolOutput({
  label, value, placeholder = 'Hasil akan tampil di sini.', actions: extra, copyLabel,
}: {
  label: string;
  value: string;
  placeholder?: string;
  actions?: ReactNode;
  copyLabel?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {extra}
          <CopyButton text={value} label={copyLabel} />
        </div>
      </div>
      <pre tabIndex={0} aria-labelledby={id} className="output">
        {value || <span className="text-muted">{placeholder}</span>}
      </pre>
    </div>
  );
}
