'use client';

import React, { useState } from 'react';
import { Folder, X, Check } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { ClientPortal } from '@/components/shared/modal';

interface MoveFolderDialogProps {
  documentId: string | null;
  documentTitle?: string;
  currentFolderId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveFolderDialog({
  documentId,
  documentTitle,
  currentFolderId,
  open,
  onOpenChange,
}: MoveFolderDialogProps) {
  const { documentFolders, moveDocumentToFolder } = useApp();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);

  if (!open || !documentId) return null;

  const handleSave = () => {
    moveDocumentToFolder(documentId, selectedFolderId);
    onOpenChange(false);
  };

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div className="bg-white border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 max-h-[calc(100dvh-32px)] flex flex-col my-auto overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-flash/10 text-flash-deep flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Move Document</h3>
              <p className="text-xs text-muted truncate max-w-[280px]">
                {documentTitle || 'Select target destination'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-lg hover:bg-paper text-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto p-1 border border-line rounded-xl">
          {/* Root option */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
              selectedFolderId === null
                ? 'bg-flash/10 text-flash-deep border border-flash'
                : 'hover:bg-paper text-ink'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted" /> Root / Unfiled
            </span>
            {selectedFolderId === null && <Check className="w-4 h-4 text-flash-deep" />}
          </button>

          {/* Folder list */}
          {documentFolders.map(folder => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                  isSelected
                    ? 'bg-flash/10 text-flash-deep border border-flash'
                    : 'hover:bg-paper text-ink'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-500" />
                  {folder.name}
                  <span className="text-[10px] text-muted font-normal">({folder.documentCount} docs)</span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-flash-deep" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-line hover:bg-paper text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-flash hover:bg-flash-deep text-ink hover:text-white transition-colors"
          >
            Move Document
          </button>
        </div>
      </div>
    </div>
  </ClientPortal>
  );
}
