'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoAuth } from '@/context/demo-auth-context';
import { featuresFor, type FeatureKey } from '@/lib/rbac';

/**
 * Shows its children only while the active organisation has the feature switched on
 * (organization_feature, set by the Super Admin); otherwise sends the person to `fallback`.
 * Runs in the browser because the switches live in the demo-auth context.
 */
export function FeatureGate({ feature, fallback, children }: { feature: FeatureKey; fallback: string; children: React.ReactNode }) {
  const router = useRouter();
  const { isHydrated, selectedWorkspace, organizationFeatures } = useDemoAuth();
  const enabled = featuresFor(selectedWorkspace?.id, organizationFeatures)[feature];

  useEffect(() => {
    if (isHydrated && !enabled) router.replace(fallback);
  }, [isHydrated, enabled, fallback, router]);

  if (!isHydrated || !enabled) return null;
  return <>{children}</>;
}
