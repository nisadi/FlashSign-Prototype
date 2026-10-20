'use client';

import { cn } from '@/lib/utils';

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ElementType;
  iconColor?: string;
  className?: string;
}

export function StatCard({ label, value, delta, deltaPositive, icon: Icon, iconColor, className }: StatCardProps) {
  return (
    <div className={cn('bg-paper-elevated rounded-xl border border-line p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted font-medium">{label}</p>
        {Icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: iconColor ? `${iconColor}20` : 'var(--mist)' }}
          >
            <Icon className="w-4 h-4" style={{ color: iconColor ?? 'var(--muted)' }} />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        {delta && (
          <p className={cn('text-xs mt-1 font-medium', deltaPositive ? 'text-emerald-600' : 'text-danger')}>
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, color = 'var(--flash)', height = 6, showLabel = false, className }: ProgressBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex-1 rounded-full bg-mist overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 animate-pulse-bar"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted font-medium shrink-0 w-8 text-right">{value}%</span>
      )}
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-up">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-mist flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-muted" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-paper-elevated rounded-xl border border-line', className)}>
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const variants = {
    primary:   'bg-flash text-ink hover:bg-flash-deep hover:text-white',
    secondary: 'bg-paper-elevated border border-line text-ink hover:bg-mist',
    ghost:     'text-muted hover:text-ink hover:bg-mist',
    danger:    'bg-danger text-white hover:bg-red-700',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs gap-1',
    md: 'px-3.5 py-2 text-sm gap-1.5',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="w-8 h-8 border-3 border-line border-t-flash rounded-full animate-spin" />
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-sm font-semibold text-ink uppercase tracking-wide mb-3', className)}>
      {children}
    </h2>
  );
}
