/**
 * Builds the signed PDF in the browser: every filled field is written onto its page
 * (signatures as images, the rest as text), then a signing summary page is added.
 * Based on Flash Sign's server-side flattening (server/lib/pdf-flatten.ts).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { SignatureRequest } from '@/types';

const INK = rgb(0.047, 0.121, 0.133);
const MUTED = rgb(0.35, 0.43, 0.42);

// pdf-lib's standard fonts only cover Latin-1; drop anything else so drawing never throws
const latin1 = (value: string) => value.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();

function dataUrlBytes(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = /^data:([^;,]*);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { mime: match[1], bytes };
}

export function signedFileName(title: string): string {
  const base = (title || 'document').replace(/[^\w.\- ]+/g, '').trim() || 'document';
  return `${base} - signed.pdf`;
}

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

/**
 * `sources` are the request's PDFs in order. All of them go into one signed file (Flash Sign
 * only kept the first document); each field is written on its own document's page.
 */
export async function buildSignedPdf(sources: { fileId: string; bytes: Uint8Array }[], request: SignatureRequest): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${request.title} (signed)`);
  const firstPageOf = new Map<string, number>();
  for (const source of sources) {
    const part = await PDFDocument.load(source.bytes);
    firstPageOf.set(source.fileId, doc.getPageCount());
    const copied = await doc.copyPages(part, part.getPageIndices());
    copied.forEach(p => doc.addPage(p));
  }
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const firstFileId = sources[0]?.fileId;

  const text = (page: PDFPage, value: string, x: number, y: number, size: number, font: PDFFont) => {
    const clean = latin1(value);
    if (clean) page.drawText(clean, { x, y, size, font, color: INK });
  };

  for (const field of request.fields) {
    const value = field.value ?? '';
    if (!value) continue;
    const offset = firstPageOf.get(field.fileId ?? firstFileId ?? '');
    if (offset === undefined) continue;
    const page = pages[offset + field.pageNumber - 1];
    if (!page) continue;
    const { width: W, height: H } = page.getSize();
    const bx = (field.positionX / 100) * W;
    const bw = (field.width / 100) * W;
    const bh = (field.height / 100) * H;
    const bottom = H - (field.positionY / 100) * H - bh;

    if (value.startsWith('data:image')) {
      const img = dataUrlBytes(value);
      if (!img) continue;
      try {
        const embedded = img.mime.includes('jpeg') ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
        const scale = Math.min(bw / embedded.width, bh / embedded.height);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        page.drawImage(embedded, { x: bx + (bw - w) / 2, y: bottom + (bh - h) / 2, width: w, height: h });
      } catch {
        // A broken image is left out rather than failing the whole document
      }
      continue;
    }

    if (field.type === 'checkbox') {
      if (value === 'true') {
        const size = Math.min(bh, bw) * 0.9;
        text(page, 'X', bx + (bw - size * 0.6) / 2, bottom + bh * 0.15, size, helvBold);
      }
      continue;
    }

    const size = Math.max(6, Math.min(bh * 0.7, 12));
    text(page, value, bx + 2, bottom + (bh - size) / 2 + size * 0.18, size, helv);
  }

  // Signing summary: who signed, when, and the document reference
  const summary = doc.addPage([612, 792]);
  let y = 728;
  summary.drawText('Signing Summary', { x: 64, y, size: 18, font: helvBold, color: INK });
  y -= 20;
  summary.drawText('Flash Sign demo - not a legally binding or cryptographically signed document.', { x: 64, y, size: 9, font: helv, color: MUTED });
  y -= 30;
  const rows: [string, string][] = [
    ['Document', request.title],
    ...(sources.length > 1 ? [['Files', (request.pdfs ?? []).map(p => p.name).join(', ')] as [string, string]] : []),
    ['Reference', request.id],
    ['Sent by', request.senderName || '—'],
    ['Created', when(request.createdAt)],
    ['Completed', when(request.completedAt)],
  ];
  for (const [label, value] of rows) {
    text(summary, label, 64, y, 10, helvBold);
    text(summary, value, 170, y, 10, helv);
    y -= 16;
  }
  y -= 18;
  text(summary, request.selfSign ? 'Signer' : 'Signers', 64, y, 12, helvBold);
  y -= 20;
  for (const signer of [...request.signers].sort((a, b) => a.order - b.order)) {
    text(summary, `${signer.order}. ${signer.name} <${signer.email}>`, 64, y, 10, helvBold);
    y -= 14;
    text(summary, `Status: ${signer.status}   Signed: ${when(signer.signedAt)}`, 78, y, 9, helv);
    y -= 22;
  }
  if (request.ccRecipients?.length) {
    text(summary, 'Received a copy', 64, y, 12, helvBold);
    y -= 18;
    for (const cc of request.ccRecipients) {
      text(summary, `${cc.name} <${cc.email}>${cc.role === 'view' ? ' (needs to view)' : ''}`, 64, y, 10, helv);
      y -= 14;
    }
  }

  return doc.save();
}
