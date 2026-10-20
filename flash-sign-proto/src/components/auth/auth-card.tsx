import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div
      className={`w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-[var(--paper-elevated)] border border-[var(--line)] shadow-xl shadow-slate-900/5 ${className}`}
    >
      {children}
    </div>
  );
}
