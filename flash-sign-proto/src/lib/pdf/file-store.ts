/**
 * Uploaded PDFs, kept in the browser's IndexedDB (localStorage is far too small for files).
 * Like the rest of the demo, files live in this browser only.
 */
import type { PdfAttachment } from '@/types';
import { buildSamplePdf } from './sample-pdfs';

const DB_NAME = 'flashsign-demo-files';
const STORE = 'files';

/** Same limits as Flash Sign: PDF only, up to 5 MB */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = action(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

export function savePdfFile(fileId: string, bytes: Uint8Array): Promise<void> {
  return run<void>('readwrite', store => store.put(bytes, fileId));
}

/** Frees a file when its request is deleted for ever */
export function deletePdfFile(fileId: string): Promise<void> {
  return run<void>('readwrite', store => store.delete(fileId));
}

export async function loadPdfFile(fileId: string): Promise<Uint8Array | null> {
  const value = await run<Uint8Array | ArrayBuffer | undefined>('readonly', store => store.get(fileId));
  if (!value) return null;
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

/** The attachment's bytes; a sample document is rebuilt if its stored copy is missing */
export async function loadAttachmentBytes(pdf: PdfAttachment): Promise<Uint8Array | null> {
  const stored = await loadPdfFile(pdf.fileId).catch(() => null);
  if (stored) return stored;
  if (pdf.sampleId) return buildSamplePdf(pdf.sampleId);
  return null;
}

/** Checks a picked file the way Flash Sign does: type, size, and the %PDF- header */
export async function readPdfUpload(file: File): Promise<{ bytes: Uint8Array } | { error: string }> {
  const isPdfName = file.name.toLowerCase().endsWith('.pdf');
  if (file.type !== 'application/pdf' && !isPdfName) return { error: 'Only PDF files can be uploaded.' };
  if (file.size > MAX_PDF_BYTES) return { error: 'This file is larger than 5 MB.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  if (!head.includes('%PDF-')) return { error: 'This file is not a valid PDF.' };
  return { bytes };
}

export function newFileId(): string {
  return `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Starts a browser download of the given bytes */
export function downloadBytes(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
