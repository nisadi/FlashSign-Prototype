'use client';

import { useSyncExternalStore } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One place for "Saved" and "Couldn't save" messages across the workspace. Call notify()
 * after a save; <Toaster /> (in the workspace layout) shows it for a few seconds.
 */
type Toast = { id: number; message: string; tone: 'success' | 'error' };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function notify(message: string, tone: Toast['tone'] = 'success') {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, tone }];
  emit();
  setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
}

function dismiss(id: number) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const empty: Toast[] = [];

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => toasts, () => empty);
  if (list.length === 0) return null;
  return (
    <div className="fixed top-16 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none" role="status" aria-live="polite">
      {list.map(t => {
        const Icon = t.tone === 'error' ? AlertCircle : CheckCircle2;
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 max-w-sm px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border animate-fade-up',
              t.tone === 'error' ? 'bg-danger text-white border-danger' : 'bg-ink text-white border-flash/30'
            )}
          >
            <Icon className={cn('w-4 h-4 shrink-0', t.tone === 'error' ? 'text-white' : 'text-flash')} />
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
