'use client';

/**
 * A small PDF viewer on pdf.js (as in Flash Sign's PdfCanvas): every page is drawn to a
 * <canvas>, with an overlay on each page for signing fields.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ZoomIn, ZoomOut, Loader2, AlertTriangle } from 'lucide-react';
import type { PdfAttachment } from '@/types';
import { loadAttachmentBytes } from '@/lib/pdf/file-store';

// pdf.js needs browser globals, so it is loaded on the client only. The legacy build is used
// because the modern one relies on very new JavaScript features.
type PdfjsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let pdfjsPromise: Promise<PdfjsModule> | null = null;

function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then(pdfjs => {
      // Copied from node_modules on install (scripts/copy-pdf-worker.mjs)
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Reads the page count of a PDF, e.g. right after upload */
export async function countPdfPages(bytes: Uint8Array): Promise<number> {
  const pdfjs = await loadPdfjs();
  // pdf.js takes ownership of the buffer it is given, so it gets a copy
  const task = pdfjs.getDocument({ data: bytes.slice() });
  const count = (await task.promise).numPages;
  void task.destroy();
  return count;
}

export interface PdfState {
  bytes: Uint8Array | null;
  pdf: PDFDocumentProxy | null;
  loading: boolean;
  error: string | null;
}

/** Loads an attachment's bytes from the browser file store and opens it with pdf.js */
export function usePdfAttachment(attachment: PdfAttachment | undefined): PdfState {
  const [state, setState] = useState<PdfState>({ bytes: null, pdf: null, loading: true, error: null });
  const fileId = attachment?.fileId;
  const sampleId = attachment?.sampleId;

  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<PdfjsModule['getDocument']> | null = null;
    (async () => {
      if (!fileId) {
        setState({ bytes: null, pdf: null, loading: false, error: null });
        return;
      }
      setState(s => ({ ...s, loading: true, error: null }));
      const bytes = await loadAttachmentBytes({ fileId, sampleId, name: '', sizeBytes: 0, pageCount: 0 });
      if (cancelled) return;
      if (!bytes) {
        setState({ bytes: null, pdf: null, loading: false, error: 'The document file is not in this browser any more.' });
        return;
      }
      const pdfjs = await loadPdfjs();
      task = pdfjs.getDocument({ data: bytes.slice() });
      const opened = await task.promise;
      if (cancelled) return;
      setState({ bytes, pdf: opened, loading: false, error: null });
    })().catch(err => {
      if (!cancelled) setState({ bytes: null, pdf: null, loading: false, error: err instanceof Error ? err.message : 'Could not open the PDF.' });
    });
    return () => {
      cancelled = true;
      // Destroying the loading task also closes the document and its worker resources
      void task?.destroy();
    };
  }, [fileId, sampleId]);

  return state;
}

const MAX_DPR = 2;

function PdfPageCanvas({ pdf, pageNumber, width }: { pdf: PDFDocumentProxy; pageNumber: number; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    let cancelled = false;
    let task: { promise: Promise<void>; cancel: () => void } | null = null;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      setHeight(width * (base.height / base.width));
      task = page.render({ canvas, viewport });
      try {
        await task.promise;
      } catch (err) {
        if ((err as { name?: string })?.name !== 'RenderingCancelledException') console.error('PDF page render failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, width]);

  return (
    <canvas
      ref={canvasRef}
      className="block bg-white"
      style={{ width: `${width}px`, height: height ? `${height}px` : `${width * 1.294}px` }}
    />
  );
}

/**
 * All pages of a PDF, one under the other, sized to the container. `renderOverlay` draws on
 * top of a page (fields); its box matches the page exactly, so positions can be percentages.
 */
export function PdfPages({
  state,
  renderOverlay,
  maxWidth = 820,
  showZoom = true,
}: {
  state: PdfState;
  renderOverlay?: (pageNumber: number) => React.ReactNode;
  maxWidth?: number;
  showZoom?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => setContainerWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.max(240, Math.min(containerWidth - 16, maxWidth) * zoom);
  const pageNumbers = state.pdf ? Array.from({ length: state.pdf.numPages }, (_, i) => i + 1) : [];

  return (
    <div ref={containerRef} className="w-full">
      {showZoom && state.pdf && (
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-muted">
          <span>{state.pdf.numPages} page{state.pdf.numPages === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="p-1.5 rounded-md border border-line bg-paper-elevated hover:bg-mist"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-semibold text-ink">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(2, +(z + 0.25).toFixed(2)))}
              className="p-1.5 rounded-md border border-line bg-paper-elevated hover:bg-mist"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {state.loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-xs text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> Opening document…
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {state.error}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex flex-col items-center gap-4 py-1" style={{ minWidth: pageWidth }}>
          {state.pdf && containerWidth > 0 && pageNumbers.map(n => (
            <div key={n} className="relative shadow-md border border-line" style={{ width: pageWidth }} data-page={n}>
              <PdfPageCanvas pdf={state.pdf!} pageNumber={n} width={pageWidth} />
              {renderOverlay && <div className="absolute inset-0">{renderOverlay(n)}</div>}
              <span className="absolute -bottom-0 right-1 text-[9px] text-muted/70 select-none pointer-events-none">
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One PDF of a request with its title, loaded on its own (requests can have several) */
export function DocPages({
  doc,
  heading,
  renderOverlay,
  maxWidth,
  showZoom,
}: {
  doc: PdfAttachment;
  heading?: React.ReactNode;
  renderOverlay?: (pageNumber: number) => React.ReactNode;
  maxWidth?: number;
  showZoom?: boolean;
}) {
  const state = usePdfAttachment(doc);
  return (
    <section className="space-y-2">
      {heading}
      <PdfPages state={state} renderOverlay={renderOverlay} maxWidth={maxWidth} showZoom={showZoom} />
    </section>
  );
}
