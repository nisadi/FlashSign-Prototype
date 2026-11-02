'use client';

/**
 * Places fields on the pages of a PDF: drag a field type from the palette (or pick it and
 * click the page), then move it, resize it from the corner, or delete it.
 * Positions are stored as percentages of the page, as in Flash Sign.
 */
import React, { useRef } from 'react';
import { X } from 'lucide-react';
import type { SignatureField, SignatureFieldType } from '@/types';
import { DEFAULT_OPTIONS, FIELD_META, fieldStyle } from './fields';
import { cn } from '@/lib/utils';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function newField(type: SignatureFieldType, signerId: string, pageNumber: number, centerX: number, centerY: number): SignatureField {
  const { w, h } = FIELD_META[type];
  return {
    id: `fld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    signerId,
    pageNumber,
    positionX: clamp(centerX - w / 2, 0, 100 - w),
    positionY: clamp(centerY - h / 2, 0, 100 - h),
    width: w,
    height: h,
    // A checkbox is optional; everything else must be filled in
    required: type !== 'checkbox',
    ...((type === 'dropdown' || type === 'radio') && { options: [...DEFAULT_OPTIONS] }),
  };
}

export const PALETTE_DRAG_TYPE = 'application/x-flashsign-field';

type Drag = { id: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: SignatureField; rect: DOMRect };

export function FieldPlacerOverlay({
  pageNumber,
  fields,
  colorOf,
  labelOf,
  armedType,
  activeSignerId,
  selectedId,
  onSelect,
  onAdd,
  onChange,
  onDelete,
  onBeginChange,
}: {
  pageNumber: number;
  fields: SignatureField[];
  colorOf: (signerId: string) => string;
  labelOf: (signerId: string) => string;
  armedType: SignatureFieldType | null;
  activeSignerId: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (field: SignatureField) => void;
  onChange: (field: SignatureField) => void;
  onDelete: (id: string) => void;
  /** A move or resize is starting (the wizard keeps an undo step) */
  onBeginChange?: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const pointToPct = (clientX: number, clientY: number) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
  };

  const startDrag = (e: React.PointerEvent, field: SignatureField, mode: Drag['mode']) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(field.id);
    onBeginChange?.();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: field.id, mode, startX: e.clientX, startY: e.clientY, orig: field, rect: overlayRef.current!.getBoundingClientRect() };
  };

  const moveDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
    const f = d.orig;
    if (d.mode === 'move') {
      onChange({ ...f, positionX: clamp(f.positionX + dx, 0, 100 - f.width), positionY: clamp(f.positionY + dy, 0, 100 - f.height) });
    } else {
      onChange({ ...f, width: clamp(f.width + dx, 2, 100 - f.positionX), height: clamp(f.height + dy, 1.5, 100 - f.positionY) });
    }
  };

  const endDrag = () => { drag.current = null; };

  return (
    <div
      ref={overlayRef}
      className={cn('absolute inset-0', armedType && 'cursor-crosshair')}
      style={{ containerType: 'inline-size' }}
      onClick={e => {
        if (!armedType) {
          onSelect(null);
          return;
        }
        const p = pointToPct(e.clientX, e.clientY);
        onAdd(newField(armedType, activeSignerId, pageNumber, p.x, p.y));
      }}
      onDragOver={e => {
        if (e.dataTransfer.types.includes(PALETTE_DRAG_TYPE)) e.preventDefault();
      }}
      onDrop={e => {
        const type = e.dataTransfer.getData(PALETTE_DRAG_TYPE) as SignatureFieldType;
        if (!type || !FIELD_META[type]) return;
        e.preventDefault();
        const p = pointToPct(e.clientX, e.clientY);
        onAdd(newField(type, activeSignerId, pageNumber, p.x, p.y));
      }}
    >
      {fields.filter(f => f.pageNumber === pageNumber).map(f => {
        const color = colorOf(f.signerId);
        const Icon = FIELD_META[f.type].icon;
        const selected = selectedId === f.id;
        return (
          <div
            key={f.id}
            className={cn(
              'absolute rounded-sm border-2 flex items-center gap-1 px-1 cursor-move select-none touch-none',
              selected && 'ring-2 ring-offset-1 ring-ink/60 z-10'
            )}
            style={fieldStyle(f, color)}
            title={`${FIELD_META[f.type].label} · ${labelOf(f.signerId)}`}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => startDrag(e, f, 'move')}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
            {f.type !== 'checkbox' && (
              <span className="text-[10px] font-semibold text-ink truncate">{FIELD_META[f.type].label}</span>
            )}
            {selected && (
              <>
                <button
                  type="button"
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center shadow"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(f.id);
                  }}
                  aria-label="Delete field"
                >
                  <X className="w-3 h-3" />
                </button>
                <span
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm bg-ink cursor-se-resize"
                  onPointerDown={e => startDrag(e, f, 'resize')}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  aria-label="Resize field"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
