'use client';

import { cn } from '@/lib/utils';
import { isRemovedMember, type User } from '@/types';

/* eslint-disable @next/next/no-img-element -- avatar photos are local data URLs */
type AvatarUser = Pick<User, 'name' | 'initials' | 'color'> & Partial<Pick<User, 'removedAt' | 'avatar'>>;

/** A removed member keeps their name on past work, greyed out and labelled */
const displayName = (u: AvatarUser) => (isRemovedMember(u) ? `${u.name} (former member)` : u.name);
const displayColor = (u: AvatarUser) => (isRemovedMember(u) ? '#9ca3af' : u.color);

interface AvatarProps {
  user?: AvatarUser | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  if (!user) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-muted bg-mist shrink-0',
          SIZE_MAP[size],
          className
        )}
        title="Unassigned"
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        SIZE_MAP[size],
        className
      )}
      style={{ background: displayColor(user) }}
      title={displayName(user)}
    >
      {user.avatar ? (
        <img src={user.avatar} alt="" className={cn('w-full h-full rounded-full object-cover', isRemovedMember(user) && 'grayscale opacity-70')} />
      ) : (
        user.initials
      )}
    </div>
  );
}

interface AvatarGroupProps {
  users: AvatarUser[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  const sizeClass = SIZE_MAP[size];

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((u, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full flex items-center justify-center font-bold text-white border-2 border-paper-elevated shrink-0',
            sizeClass
          )}
          style={{ background: displayColor(u) }}
          title={displayName(u)}
        >
          {u.avatar ? (
            <img src={u.avatar} alt="" className={cn('w-full h-full rounded-full object-cover', isRemovedMember(u) && 'grayscale opacity-70')} />
          ) : (
            u.initials
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold text-muted bg-mist border-2 border-paper-elevated shrink-0',
            sizeClass
          )}
          title={`+${extra} more`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
