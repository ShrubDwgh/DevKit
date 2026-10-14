import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

type Push = (message: string, kind?: ToastKind) => void;
const ToastContext = createContext<Push>(() => undefined);

export function useToast(): Push {
  return useContext(ToastContext);
}

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />,
  error: <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />,
  info: <Info className="h-4 w-4 shrink-0 text-accent" aria-hidden />,
};

/** Notifikasi singkat (ToastNotification). Wilayah aria-live agar terbaca oleh screen reader. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const push = useCallback<Push>((message, kind = 'info') => {
    const id = ++counter.current;
    setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg border border-line bg-elevated px-3 py-2.5 text-sm shadow-lg"
          >
            {ICONS[t.kind]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
