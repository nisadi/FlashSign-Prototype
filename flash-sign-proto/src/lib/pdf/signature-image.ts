/**
 * Turns a signature (typed, drawn or uploaded) into a PNG data URL, so it looks the same on
 * screen and in the signed PDF. Typed signatures are drawn in their chosen font.
 */
import type { SignatureDraft } from '@/components/signature/signature-mark';
import { signatureFontClass } from '@/components/signature/signature-fonts';

const WIDTH = 600;
const HEIGHT = 180;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** The real font family behind a next/font class name */
function fontFamilyOf(className: string): string {
  const probe = document.createElement('span');
  probe.className = className;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.textContent = 'Signature';
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily;
  probe.remove();
  return family;
}

export async function signatureToPng(draft: SignatureDraft, variant: 'signature' | 'initials'): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = variant === 'signature' ? WIDTH : HEIGHT * 1.6;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const image = variant === 'signature' ? draft.signatureImage : draft.initialsImage;
  if (draft.source !== 'type' && image) {
    const img = await loadImage(image);
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas.toDataURL('image/png');
  }

  const text = (variant === 'signature' ? draft.name : draft.initials).trim() || '—';
  const family = fontFamilyOf(signatureFontClass(draft.styleId));
  let size = 110;
  await document.fonts.load(`${size}px ${family}`).catch(() => undefined);
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > canvas.width - 24 && size > 24) {
    size -= 4;
    ctx.font = `${size}px ${family}`;
  }
  ctx.fillStyle = '#0c1f22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL('image/png');
}
