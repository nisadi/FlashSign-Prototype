'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl',
};

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  className,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar shift if present
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!mounted || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={handleBackdropClick}
      style={{
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full my-auto flex flex-col min-h-0 bg-paper-elevated border border-line rounded-2xl shadow-2xl overflow-hidden',
          'max-h-[calc(100dvh-32px)]',
          SIZE_CLASSES[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ── Modal Header ──────────────────────────────────────────────────────────────
interface ModalHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ElementType;
  iconColor?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export function ModalHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-flash-deep',
  onClose,
  children,
  className,
  id,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'p-5 border-b border-line bg-paper/60 flex items-start justify-between gap-4 shrink-0',
        className
      )}
    >
      {children || (
        <>
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="p-2 rounded-xl bg-flash/10 text-flash-deep border border-flash/20 shrink-0 mt-0.5">
                <Icon className={cn('w-5 h-5', iconColor)} />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h2 id={id} className="text-base sm:text-lg font-bold text-ink truncate leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-muted mt-0.5 leading-normal">{description}</p>
              )}
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-ink hover:bg-mist/70 rounded-lg transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Modal Body ────────────────────────────────────────────────────────────────
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4', className)}>
      {children}
    </div>
  );
}

// ── Modal Footer ──────────────────────────────────────────────────────────────
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'p-4 sm:p-5 border-t border-line bg-paper/60 flex flex-wrap items-center justify-between gap-3 shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Simple Client Portal ──────────────────────────────────────────────────────
export function ClientPortal({
  children,
  lockScroll = true,
}: {
  children: React.ReactNode;
  lockScroll?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!lockScroll || !mounted) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [lockScroll, mounted]);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

