import { useSyncExternalStore } from 'react';
import { TOOLS } from './data/tools';
import { isStorageAvailable, readJson, storageClearAll, storageGet, storageSet, writeJson } from './lib/storage';

export type ThemeSetting = 'dark' | 'light' | 'system';
export interface HistoryEntry {
  id: string;
  t: number;
}

interface State {
  theme: ThemeSetting;
  favorites: string[];
  history: HistoryEntry[];
  historyEnabled: boolean;
  storageOk: boolean;
}

const HISTORY_LIMIT = 100;
const knownIds = new Set(TOOLS.map((t) => t.id));

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isHistory = (v: unknown): v is HistoryEntry[] =>
  Array.isArray(v) &&
  v.every((x) => typeof x === 'object' && x !== null && typeof (x as HistoryEntry).id === 'string' && Number.isFinite((x as HistoryEntry).t));

function load(): State {
  const rawTheme = storageGet('theme');
  const theme: ThemeSetting = rawTheme === 'light' || rawTheme === 'system' ? rawTheme : 'dark';
  const favorites = readJson<string[]>('favorites', isStringArray, []).filter((id) => knownIds.has(id));
  const history = readJson<HistoryEntry[]>('history', isHistory, [])
    .filter((e) => knownIds.has(e.id))
    .slice(0, HISTORY_LIMIT);
  return {
    theme,
    favorites: Array.from(new Set(favorites)),
    history,
    historyEnabled: storageGet('historyEnabled') !== '0',
    storageOk: isStorageAvailable(),
  };
}

export function isDarkNow(theme: ThemeSetting): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: ThemeSetting): void {
  if (typeof document === 'undefined') return;
  const dark = isDarkNow(theme);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0D10' : '#F6F7F9');
}

let state: State = load();
const listeners = new Set<() => void>();

function update(patch: Partial<State>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

applyTheme(state.theme);
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.theme === 'system') applyTheme('system');
  });
}

export const actions = {
  setTheme(theme: ThemeSetting): void {
    storageSet('theme', theme);
    applyTheme(theme);
    update({ theme });
  },
  toggleFavorite(id: string): boolean {
    const isFav = state.favorites.includes(id);
    const favorites = isFav ? state.favorites.filter((f) => f !== id) : [...state.favorites, id];
    writeJson('favorites', favorites);
    update({ favorites });
    return !isFav;
  },
  /** Mencatat HANYA id tool dan waktu. Tidak pernah menyimpan input, hasil, token, atau password. */
  recordUse(id: string): void {
    if (!state.historyEnabled || !knownIds.has(id)) return;
    const now = Date.now();
    const last = state.history[0];
    if (last && last.id === id && now - last.t < 60_000) return;
    const history = [{ id, t: now }, ...state.history].slice(0, HISTORY_LIMIT);
    writeJson('history', history);
    update({ history });
  },
  setHistoryEnabled(on: boolean): void {
    storageSet('historyEnabled', on ? '1' : '0');
    update({ historyEnabled: on });
  },
  clearHistory(): void {
    writeJson('history', []);
    update({ history: [] });
  },
  clearFavorites(): void {
    writeJson('favorites', []);
    update({ favorites: [] });
  },
  /** Menghapus semua data milik DevKit (key berawalan "devkit:"). Data situs lain tidak disentuh. */
  resetAll(): void {
    storageClearAll();
    applyTheme('dark');
    update({ theme: 'dark', favorites: [], history: [], historyEnabled: true });
  },
};

export function useAppState(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
