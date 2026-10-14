import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, LayoutGrid, Menu, Settings as SettingsIcon, X } from 'lucide-react';
import { APP_NAME, APP_VERSION, TAGLINE } from '../config';
import { CategoryNavigation } from './CategoryNavigation';
import { ThemeToggle } from './ThemeToggle';

function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#0B0D10" />
      <g fill="none" stroke="#3B82F6" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round">
        <path d="M200 168 112 256l88 88" />
        <path d="M312 168l88 88-88 88" />
      </g>
      <path d="M290 150 222 362" stroke="#F3F4F6" strokeWidth="40" strokeLinecap="round" />
    </svg>
  );
}

const navItem = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
    isActive ? 'bg-elevated font-medium text-fg' : 'text-muted hover:bg-elevated hover:text-fg'
  }`;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-4 py-4">
        <Logo />
        <span>
          <span className="block text-base font-semibold leading-tight">{APP_NAME}</span>
          <span className="block text-xs text-muted">Developer Tools</span>
        </span>
      </Link>
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-2 pb-4">
        <NavLink to="/" end onClick={onNavigate} className={navItem}>
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          Beranda
        </NavLink>
        <NavLink to="/alat" end onClick={onNavigate} className={navItem}>
          <LayoutGrid className="h-4 w-4" aria-hidden />
          Semua tools
        </NavLink>
        <p className="px-3 pb-1 pt-4 text-xs text-muted">Kategori</p>
        <CategoryNavigation onNavigate={onNavigate} />
        <div className="mt-4 border-t border-line pt-2">
          <NavLink to="/pengaturan" onClick={onNavigate} className={navItem}>
            <SettingsIcon className="h-4 w-4" aria-hidden />
            Pengaturan
          </NavLink>
        </div>
      </nav>
      <div className="flex items-center justify-between border-t border-line px-3 py-2">
        <span className="text-xs text-muted">v{APP_VERSION}</span>
        <ThemeToggle />
      </div>
    </div>
  );
}

const bottomItem = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
    isActive ? 'font-medium text-accent' : 'text-muted'
  }`;

export default function Layout() {
  const { pathname } = useLocation();
  const drawer = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const d = drawer.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#konten"
        className="sr-only z-[70] rounded-lg bg-accent-strong px-3 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Lewati ke konten utama
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-bg pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex h-14 items-center gap-1 px-2">
          <Link to="/" className="flex min-h-11 flex-1 items-center gap-2.5 px-2">
            <Logo className="h-7 w-7" />
            <span className="text-base font-semibold">{APP_NAME}</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="konten" tabIndex={-1} className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 outline-none lg:px-8 lg:pb-12 lg:pt-10">
        <Outlet />
        <footer className="mt-12 border-t border-line pt-5 text-sm text-muted">
          <p>
            {APP_NAME} · {TAGLINE}
          </p>
          <p className="mt-1">Data diproses di browser Anda.</p>
          <nav aria-label="Tautan legal" className="mt-3 flex flex-wrap gap-x-5">
            <Link to="/privasi" className="inline-flex min-h-11 items-center hover:text-fg hover:underline">
              Kebijakan Privasi
            </Link>
            <Link to="/ketentuan" className="inline-flex min-h-11 items-center hover:text-fg hover:underline">
              Ketentuan Penggunaan
            </Link>
          </nav>
        </footer>
      </main>

      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <NavLink to="/" end className={bottomItem}>
          <LayoutDashboard className="h-5 w-5" aria-hidden />
          Beranda
        </NavLink>
        <NavLink to="/alat" end className={bottomItem}>
          <LayoutGrid className="h-5 w-5" aria-hidden />
          Tools
        </NavLink>
        <NavLink to="/pengaturan" className={bottomItem}>
          <SettingsIcon className="h-5 w-5" aria-hidden />
          Pengaturan
        </NavLink>
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted">
          <Menu className="h-5 w-5" aria-hidden />
          Menu
        </button>
      </nav>

      <dialog
        ref={drawer}
        className="drawer lg:hidden"
        aria-label="Menu navigasi"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === drawer.current) setOpen(false);
        }}
      >
        <div className="relative h-full">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="absolute right-2 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-fg"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </dialog>
    </div>
  );
}
