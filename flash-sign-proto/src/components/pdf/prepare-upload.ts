/**
 * Takes a picked file, checks it the way Flash Sign does (PDF only, up to 5 MB, a real PDF),
 * counts its pages and keeps it in the browser's file store.
 */
import type { PdfAttachment } from '@/types';
import { newFileId, readPdfUpload, savePdfFile } from '@/lib/pdf/file-store';
import { countPdfPages } from './pdf-pages';

export async function preparePdfUpload(file: File): Promise<{ attachment: PdfAttachment } | { error: string }> {
  const result = await readPdfUpload(file);
  if ('error' in result) return result;
  try {
    const pageCount = await countPdfPages(result.bytes);
    const fileId = newFileId();
    await savePdfFile(fileId, result.bytes);
    return { attachment: { fileId, name: file.name, sizeBytes: result.bytes.length, pageCount } };
  } catch {
    return { error: 'This PDF could not be opened. Please try another file.' };
  }
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
