'use client';

import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface AvatarProps {
  user: Pick<User, 'name' | 'initials' | 'color'>;
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
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        SIZE_MAP[size],
        className
      )}
      style={{ background: user.color }}
      title={user.name}
    >
      {user.initials}
    </div>
  );
}

interface AvatarGroupProps {
  users: Pick<User, 'name' | 'initials' | 'color'>[];
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
          style={{ background: u.color }}
          title={u.name}
        >
          {u.initials}
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
