'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Folder,
  Layers,
  Info
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { DocumentType } from '@/types/documents';

interface UploadDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId?: string | null;
  onSuccess?: (newDocId: string) => void;
}

export function UploadDemoDialog({
  open,
  onOpenChange,
  defaultFolderId = null,
  onSuccess,
}: UploadDemoDialogProps) {
  const { addDocumentItem, documentFolders, projects } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('pdf');
  const [folderId, setFolderId] = useState<string>(defaultFolderId || '');
  const [projectId, setProjectId] = useState<string>('');
  const [pages, setPages] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${sizeInMB} MB`);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    setTitle(cleanTitle);

    if (file.name.endsWith('.pdf')) setType('pdf');
    else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) setType('docx');
    else setType('agreement');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    const newId = addDocumentItem({
      title: title.trim(),
      type,
      folderId: folderId || null,
      relatedProjectId: projectId || undefined,
      fileSize: fileSize || '1.8 MB',
      pages: Number(pages) || 4,
      status: 'draft',
      content: `# ${title.trim()}\n\nUploaded demo file representation (${selectedFileName || title + '.pdf'}).\n\n### Document Scope\nThis document record was imported into the Flash Sign demo library. Fields and signature workflows can be configured directly from the document details workspace.`,
    });

    onOpenChange(false);
    if (onSuccess) onSuccess(newId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
      <div className="bg-white border border-line rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-flash/10 flex items-center justify-center text-flash-deep">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">Upload Demo Document</h3>
              <p className="text-xs text-muted">Add a PDF, Word DOCX, or agreement into your local library.</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-paper text-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prototype notice */}
        <div className="bg-mist/30 border border-line/70 rounded-xl p-3 flex items-start gap-2.5 text-xs text-muted">
          <Info className="w-4 h-4 text-flash-deep flex-shrink-0 mt-0.5" />
          <span>
            <strong>Client-Side Demo:</strong> Selected files are processed locally in your browser session for mock e-signature placement and preview. Files are not sent to any external server.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive
                ? 'border-flash bg-flash/5 ring-2 ring-flash/20'
                : selectedFileName
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-line/80 hover:border-flash/60 hover:bg-paper/40'
            }`}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />

            {selectedFileName ? (
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-ink truncate max-w-xs mx-auto">{selectedFileName}</div>
                <div className="text-[11px] text-muted">{fileSize} • Ready to import</div>
                <label
                  htmlFor="file-upload-input"
                  className="inline-block text-[11px] text-flash-deep font-semibold hover:underline cursor-pointer pt-1"
                >
                  Choose another file
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="w-8 h-8 text-muted mx-auto" />
                <div className="text-xs font-semibold text-ink">
                  Drag & drop your document here, or{' '}
                  <label htmlFor="file-upload-input" className="text-flash-deep hover:underline cursor-pointer">
                    browse files
                  </label>
                </div>
                <p className="text-[10px] text-muted">Supports PDF, DOCX, SOW, and NDA agreements up to 25 MB</p>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Document Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Master Services Agreement 2026"
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              required
            />
          </div>

          {/* Type & Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Document Category
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                <option value="pdf">PDF Document</option>
                <option value="docx">Word DOCX</option>
                <option value="agreement">Agreement</option>
                <option value="msa">Master Services Agreement</option>
                <option value="sow">Statement of Work</option>
                <option value="nda">Non-Disclosure Agreement</option>
                <option value="proposal">Proposal</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Target Folder
              </label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
              >
                <option value="">Root / Unfiled</option>
                {documentFolders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Associated Project */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
              Linked Project (Optional)
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-flash"
            >
              <option value="">None / Standalone Document</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors shadow-sm"
            >
              Add to Demo Library
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
