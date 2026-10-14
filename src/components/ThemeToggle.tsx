import { Moon, Sun } from 'lucide-react';
import { actions, isDarkNow, useAppState } from '../store';

export function ThemeToggle() {
  const { theme } = useAppState();
  const dark = isDarkNow(theme);
  return (
    <button
      type="button"
      onClick={() => actions.setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-fg"
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}
