import { NavLink } from 'react-router-dom';
import { CATEGORIES, toolsInCategory } from '../data/tools';

/** Daftar kategori. variant "sidebar" untuk navigasi samping/drawer, "grid" untuk dashboard. */
export function CategoryNavigation({ variant = 'sidebar', onNavigate }: { variant?: 'sidebar' | 'grid'; onNavigate?: () => void }) {
  if (variant === 'grid') {
    return (
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.id}>
              <NavLink
                to={`/kategori/${c.id}`}
                className="flex h-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-field hover:bg-surface"
              >
                <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{c.name}</span>
                  <span className="block text-xs text-muted">{toolsInCategory(c.id).length} tools</span>
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="space-y-0.5">
      {CATEGORIES.map((c) => {
        const Icon = c.icon;
        return (
          <li key={c.id}>
            <NavLink
              to={`/kategori/${c.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                  isActive ? 'bg-elevated font-medium text-fg' : 'text-muted hover:bg-elevated hover:text-fg'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-muted">{toolsInCategory(c.id).length}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}
