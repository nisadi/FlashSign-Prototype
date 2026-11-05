'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock, RefreshCw } from 'lucide-react';
import { useDemoAuth } from '@/context/demo-auth-context';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  backHref?: string;
}

export function AccessDenied({
  title = 'Access Denied',
  message = 'You do not have the required permissions to access this page or resource.',
  requiredRole,
  backHref,
}: AccessDeniedProps) {
  const router = useRouter();
  const { currentRbacUser } = useDemoAuth();

  const defaultHome = currentRbacUser?.isSuperAdmin
    ? '/super-admin'
    : currentRbacUser?.dashboardAccess?.defaultDashboard === 'my-status'
    ? '/projects/home'
    : '/dashboard';

  const destination = backHref || defaultHome;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-paper-elevated border border-line rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-danger/15 text-danger border border-danger/30 uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3" />
            Restricted Access
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight mt-1">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        {currentRbacUser && (
          <div className="p-3 rounded-xl bg-mist/60 border border-line/80 text-left text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted">Signed in as:</span>
              <span className="font-semibold text-ink">{currentRbacUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Assigned Role:</span>
              <span className="font-semibold text-flash-deep">{currentRbacUser.roleName}</span>
            </div>
            {requiredRole && (
              <div className="flex items-center justify-between pt-1 border-t border-line/40">
                <span className="text-muted">Required Authority:</span>
                <span className="font-semibold text-amber-700">{requiredRole}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg border border-line text-ink hover:bg-mist transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>

          <Link
            href={destination}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-flash-deep hover:bg-flash text-white hover:text-ink transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Go to Your Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

