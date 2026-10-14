import { useId } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---------- Button ----------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={`${VARIANT_CLASS[variant]} ${className}`} {...props} />;
}

// ---------- Form controls ----------
interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'url';
  mono?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  className?: string;
}

export function TextInput({
  label, value, onChange, type = 'text', placeholder, hint, error, inputMode, mono, maxLength, min, max, step, disabled, className = '',
}: TextInputProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`input ${mono ? 'font-mono' : ''}`}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField<T extends string>({
  label, value, onChange, options, hint, className = '',
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Checkbox({
  label, checked, onChange, hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-[rgb(var(--c-accent-strong))]"
        />
        <span>{label}</span>
      </label>
      {hint && <p className="hint -mt-1 pl-[1.875rem]">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-wrap rounded-lg border border-line bg-bg p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-md px-3 text-sm font-medium transition-colors ${
              active ? 'bg-accent-strong text-white' : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Messages ----------
type NoticeTone = 'info' | 'warning' | 'success' | 'error';
const NOTICE: Record<NoticeTone, { box: string; icon: LucideIcon; iconClass: string }> = {
  info: { box: 'border-accent/40 bg-accent/10', icon: Info, iconClass: 'text-accent' },
  warning: { box: 'border-warning/50 bg-warning/10', icon: AlertTriangle, iconClass: 'text-warning' },
  success: { box: 'border-success/40 bg-success/10', icon: CheckCircle2, iconClass: 'text-success' },
  error: { box: 'border-danger/50 bg-danger/10', icon: AlertCircle, iconClass: 'text-danger' },
};

export function Notice({ tone = 'info', children, className = '' }: { tone?: NoticeTone; children: ReactNode; className?: string }) {
  const n = NOTICE[tone];
  const Icon = n.icon;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${n.box} ${className}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.iconClass}`} aria-hidden />
      <div className="min-w-0 flex-1 whitespace-pre-line [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return <Notice tone="error">{children}</Notice>;
}

export function WarningList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <Notice tone="warning">
      <ul className="space-y-1">
        {items.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </Notice>
  );
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
const BADGE: Record<BadgeTone, string> = {
  neutral: 'border-line text-muted',
  success: 'border-success/50 text-success',
  warning: 'border-warning/60 text-warning',
  danger: 'border-danger/60 text-danger',
  info: 'border-accent/50 text-accent',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${BADGE[tone]}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-muted" aria-hidden />
      <h2 className="mt-3 text-base font-medium">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-8 text-sm text-muted">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function KeyValue({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line rounded-lg border border-line text-sm">
      {items.map((i) => (
        <div key={i.k} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:gap-4">
          <dt className="shrink-0 text-muted sm:w-40">{i.k}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}
