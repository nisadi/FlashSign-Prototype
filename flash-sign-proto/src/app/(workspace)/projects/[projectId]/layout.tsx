'use client';

import React, { use } from 'react';
import { useDemoAuth } from '@/context/demo-auth-context';
import { canAccessProject } from '@/lib/rbac';
import { AccessDenied } from '@/components/shared/access-denied';

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { currentRbacUser } = useDemoAuth();

  if (currentRbacUser && !canAccessProject(currentRbacUser, projectId)) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <AccessDenied
          title="Project Access Restricted"
          message={`You do not have permission to view project (${projectId}). It is not in your assigned projects list.`}
          requiredRole="Project Assignment"
          backHref="/projects"
        />
      </div>
    );
  }

  return <>{children}</>;
}

