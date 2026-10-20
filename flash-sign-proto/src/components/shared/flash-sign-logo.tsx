import React from 'react';
import Link from 'next/link';

interface FlashSignLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  href?: string;
}

export function FlashSignLogo({
  className = '',
  size = 'md',
  showBadge = false,
  href,
}: FlashSignLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Dynamic Flash Icon */}
      <div
        className={`${iconSizes[size]} rounded-lg flex items-center justify-center font-bold relative shadow-sm border border-emerald-400/20`}
        style={{
          background: 'linear-gradient(135deg, #00c2a8 0%, #009882 100%)',
          color: '#0c1f22',
        }}
      >
        {/* Bolt / Signature Stroke SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 drop-shadow-sm text-[#0c1f22]"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`font-semibold tracking-tight text-[var(--ink)] ${textSizes[size]}`}>
            Flash<span className="text-[var(--flash-deep)] font-extrabold">Sign</span>
          </span>
          {showBadge && (
            <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full font-medium bg-[var(--mist)] text-[var(--ink-soft)] border border-[var(--line)]">
              Prototype
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
