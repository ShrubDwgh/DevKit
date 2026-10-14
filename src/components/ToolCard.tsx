import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { ToolDef } from '../data/tools';
import { useAppState } from '../store';

export function ToolCard({ tool }: { tool: ToolDef }) {
  const { favorites } = useAppState();
  const Icon = tool.icon;
  const fav = favorites.includes(tool.id);
  return (
    <Link
      to={`/alat/${tool.slug}`}
      className="group flex h-full items-start gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 transition-colors hover:border-field hover:bg-elevated"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-elevated text-accent group-hover:bg-surface">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <span className="min-w-0 [overflow-wrap:anywhere]">{tool.name}</span>
          {fav && <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" aria-label="Favorit" />}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{tool.description}</span>
      </span>
    </Link>
  );
}

export function ToolGrid({ tools }: { tools: ToolDef[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {tools.map((t) => (
        <li key={t.id}>
          <ToolCard tool={t} />
        </li>
      ))}
    </ul>
  );
}
