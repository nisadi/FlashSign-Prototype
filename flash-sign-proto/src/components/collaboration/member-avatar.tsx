'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { User, AvailabilityStatus } from '@/types';

interface MemberAvatarProps {
  user?: Partial<User> | null;
  name?: string;
  avatar?: string;
  initials?: string;
  color?: string;
  availability?: AvailabilityStatus;
  showAvailability?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function MemberAvatar({
  user,
  name,
  avatar,
  initials,
  color,
  availability,
  showAvailability = false,
  size = 'md',
  className,
}: MemberAvatarProps) {
  const resolvedName = user?.name || name || 'Team Member';
  const resolvedAvatar = user?.avatar || avatar;
  const resolvedInitials =
    user?.initials ||
    initials ||
    resolvedName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const resolvedColor = user?.color || color || '#00c2a8';
  const resolvedAvailability = user?.availability || availability;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base font-semibold',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0 border-2 border-white',
    lg: 'w-3 h-3 bottom-0.5 right-0.5 border-2 border-white',
    xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2 border-white',
  };

  const availabilityColors: Record<AvailabilityStatus, string> = {
    available: 'bg-emerald-500',
    busy: 'bg-amber-500',
    focus_time: 'bg-indigo-500',
    out_of_office: 'bg-rose-500',
  };

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center', className)}>
      {resolvedAvatar ? (
        <img
          src={resolvedAvatar}
          alt={resolvedName}
          className={cn('rounded-full object-cover border border-line/60', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white shadow-xs border border-white/20',
            sizeClasses[size]
          )}
          style={{ backgroundColor: resolvedColor }}
          title={resolvedName}
        >
          {resolvedInitials}
        </div>
      )}

      {showAvailability && resolvedAvailability && (
        <span
          className={cn(
            'absolute rounded-full ring-1 ring-white',
            dotSizes[size],
            availabilityColors[resolvedAvailability] || 'bg-slate-400'
          )}
          title={`Status: ${resolvedAvailability.replace('_', ' ')}`}
        />
      )}
    </div>
  );
}
