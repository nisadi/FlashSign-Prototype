'use client';

/* eslint-disable @next/next/no-img-element -- previews of local data URLs */
import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Upload, Type, PenLine, ImageUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SignatureSource, SignatureStyle } from '@/types';
import { SIGNATURE_STYLES } from './signature-fonts';
import { SignatureMark, type SignatureDraft } from './signature-mark';

// Same limits as Flash Sign
const MAX_INITIALS = 4;
const MAX_UPLOAD_BYTES = 200 * 1024;
const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp'];

const METHODS: { id: SignatureSource; label: string; icon: React.ElementType }[] = [
  { id: 'type', label: 'Type', icon: Type },
  { id: 'draw', label: 'Draw', icon: PenLine },
  { id: 'upload', label: 'Upload', icon: ImageUp },
];

export const initialsFromName = (name: string) =>
  name.trim().split(/\s+/).map(part => part[0] ?? '').join('').toUpperCase().slice(0, MAX_INITIALS);

/** A finished draft has a name, initials, and an image for each part when drawn or uploaded. */
export function isCompleteDraft(draft: SignatureDraft): boolean {
  if (!draft.name.trim() || !draft.initials.trim()) return false;
  if (draft.source === 'type') return true;
  return !!draft.signatureImage && !!draft.initialsImage;
}

/**
 * Create or change a signature and initials: type it in one of four styles, draw it,
 * or upload an image. Controlled: the parent owns the draft and decides when to save.
 */
export function SignatureEditor({
  value,
  onChange,
  allowedMethods = ['type', 'draw', 'upload'],
}: {
  value: SignatureDraft;
  onChange: (draft: SignatureDraft) => void;
  allowedMethods?: SignatureSource[];
}) {
  const methods = METHODS.filter(m => allowedMethods.includes(m.id));
  const set = (updates: Partial<SignatureDraft>) => onChange({ ...value, ...updates });

  const switchMethod = (source: SignatureSource) => {
    // Images from another method don't carry over
    set({ source, signatureImage: undefined, initialsImage: undefined, styleId: value.styleId ?? 'script' });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
        <label className="block">
          <span className="block font-semibold text-ink mb-1">Full name</span>
          <input
            type="text"
            value={value.name}
            onChange={e => set({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-sm text-ink focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
          />
        </label>
        <label className="block">
          <span className="block font-semibold text-ink mb-1">Initials</span>
          <input
            type="text"
            value={value.initials}
            maxLength={MAX_INITIALS}
            onChange={e => set({ initials: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 rounded-lg bg-paper border border-line text-sm text-ink uppercase focus:outline-none focus:ring-2 focus:ring-flash/30 focus:border-flash"
          />
        </label>
      </div>

      {methods.length > 1 && (
        <div className="flex items-center bg-paper rounded-lg border border-line p-0.5 w-fit" role="tablist" aria-label="Signature method">
          {methods.map(m => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={value.source === m.id}
              onClick={() => switchMethod(m.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors',
                value.source === m.id ? 'bg-paper-elevated text-ink shadow-2xs' : 'text-muted hover:text-ink'
              )}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      )}

      {value.source === 'type' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Signature style">
          {SIGNATURE_STYLES.map(style => {
            const selected = (value.styleId ?? 'script') === style.id;
            return (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set({ styleId: style.id as SignatureStyle })}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
                  selected ? 'border-flash bg-flash/5 ring-1 ring-flash' : 'border-line bg-paper-elevated hover:border-flash/50'
                )}
              >
                <span className={cn(style.className, 'text-2xl text-ink truncate')}>{value.name || 'Your Name'}</span>
                <span className={cn(style.className, 'text-xl text-ink-soft shrink-0')}>{value.initials || 'YN'}</span>
              </button>
            );
          })}
        </div>
      )}

      {value.source === 'draw' && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
          <DrawPad label="Draw your signature" image={value.signatureImage} onChange={img => set({ signatureImage: img })} height={140} />
          <DrawPad label="Draw your initials" image={value.initialsImage} onChange={img => set({ initialsImage: img })} height={140} />
        </div>
      )}

      {value.source === 'upload' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UploadBox label="Signature image" image={value.signatureImage} onChange={img => set({ signatureImage: img })} />
          <UploadBox label="Initials image" image={value.initialsImage} onChange={img => set({ initialsImage: img })} />
        </div>
      )}

      {isCompleteDraft(value) && (
        <div className="flex flex-wrap items-end gap-8 px-4 py-3 rounded-lg bg-paper border border-dashed border-line">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Signature</p>
            <SignatureMark signature={value} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Initials</p>
            <SignatureMark signature={value} variant="initials" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Drawing canvas ─────────────────────────────────────────────────────────────
function DrawPad({ label, image, onChange, height }: {
  label: string;
  image?: string;
  onChange: (image: string | undefined) => void;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(!!image);

  // Size the backing store to the element so strokes stay sharp
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0c1f22';
    if (image) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, height);
      img.src = image;
    }
    // Only on mount: later strokes are drawn directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange(undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-ink">{label}</span>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-muted hover:text-ink">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ height }}
          className="w-full rounded-lg border border-line bg-white touch-none cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          aria-label={label}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted">
            Sign here with your mouse or finger
          </span>
        )}
      </div>
    </div>
  );
}

// ── Image upload ───────────────────────────────────────────────────────────────
function UploadBox({ label, image, onChange }: {
  label: string;
  image?: string;
  onChange: (image: string | undefined) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!UPLOAD_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG, GIF or BMP image.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('The image must be 200 KB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <span className="block font-semibold text-ink mb-1">{label}</span>
      <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-lg border border-dashed border-line bg-paper hover:border-flash/60 cursor-pointer transition-colors">
        {image ? (
          <img src={image} alt={label} className="max-h-24 max-w-[90%] object-contain" />
        ) : (
          <>
            <Upload className="w-5 h-5 text-muted" />
            <span className="text-muted">Choose an image · JPG, PNG, GIF, BMP · max 200 KB</span>
          </>
        )}
        <input
          type="file"
          accept={UPLOAD_TYPES.join(',')}
          className="sr-only"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </label>
      {image && (
        <button type="button" onClick={() => onChange(undefined)} className="mt-1 text-muted hover:text-ink">
          Remove
        </button>
      )}
      {error && <p className="mt-1 text-danger">{error}</p>}
    </div>
  );
}
