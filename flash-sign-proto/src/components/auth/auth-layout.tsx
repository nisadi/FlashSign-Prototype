import React from 'react';
import { BrandPanel } from '@/components/auth/brand-panel';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row paper-grain">
      {/* Left Branding Panel (Desktop side / Mobile top) */}
      <div className="w-full lg:w-5/12 xl:w-1/2 shrink-0">
        <BrandPanel />
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
