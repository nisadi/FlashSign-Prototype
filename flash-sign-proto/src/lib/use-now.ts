'use client';

import { useSyncExternalStore } from 'react';

// A shared ticking clock for live timers. Returns null during server rendering and
// hydration, so text such as "1h 20m" is only rendered in the browser (no mismatch).

const listeners = new Set<() => void>();
let current = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach(l => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
