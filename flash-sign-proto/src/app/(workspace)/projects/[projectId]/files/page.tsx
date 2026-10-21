'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ProjectHeaderNav } from '@/components/projects/project-header-nav';
import { Card, Button, EmptyState } from '@/components/shared/ui';
import { Avatar } from '@/components/shared/avatar';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List,
  Download,
  Trash2,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileImage,
  UploadCloud,
  Check,
} from 'lucide-react';
import type { ProjectFile } from '@/types';

export default function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, files, users, addFile, deleteFile, openTaskDrawer } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);

  // New mock file form
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('pdf');
  const [newFileSize, setNewFileSize] = useState('1.8 MB');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return notFound();

  const projectFiles = files.filter((f) => f.projectId === projectId);

  const filteredFiles = projectFiles.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || f.type.toLowerCase() === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  const handleUploadMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    addFile({
      name: newFileName.trim(),
      projectId,
      size: newFileSize,
      type: newFileType,
      uploadedBy: project.ownerId,
      createdAt: new Date().toISOString(),
    });

    setNewFileName('');
    setShowUploadModal(false);
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'figma':
        return <FileImage className="w-6 h-6 text-purple-500" />;
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      default:
        return <FileCode className="w-6 h-6 text-flash-deep" />;
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="files" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-flash-deep" /> Project Assets & Documentation
            </h1>
            <p className="text-xs text-muted">
              {projectFiles.length} files attached to {project.name}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files…"
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs bg-paper-elevated border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="figma">Figma</option>
              <option value="csv">CSV/Data</option>
              <option value="json">JSON/Code</option>
            </select>

            {/* View toggle */}
            <div className="inline-flex rounded-xl border border-line bg-paper-elevated p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-ink text-flash' : 'text-muted hover:text-ink'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-ink text-flash' : 'text-muted hover:text-ink'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowUploadModal(true)}
            >
              Upload File
            </Button>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-paper-elevated border border-line rounded-2xl p-6 max-w-md w-full shadow-xl animate-fade-in space-y-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-flash-deep" /> Attach Mock File
              </h2>
              <p className="text-xs text-muted">
                Add a demonstration file attachment to this project workspace.
              </p>

              <form onSubmit={handleUploadMock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    File Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="e.g. System Architecture Diagram.pdf"
                    className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Type</label>
                    <select
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="figma">Figma Design</option>
                      <option value="csv">CSV Spreadsheet</option>
                      <option value="json">JSON Config</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Mock Size</label>
                    <input
                      type="text"
                      value={newFileSize}
                      onChange={(e) => setNewFileSize(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Attach File
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* File Preview Drawer / Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-paper-elevated border border-line rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(previewFile.type)}
                  <h3 className="text-sm font-bold text-ink truncate">{previewFile.name}</h3>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-muted hover:text-ink text-base p-1"
                >
                  ✕
                </button>
              </div>

              {/* Sample preview body */}
              <div className="p-6 bg-paper rounded-xl border border-line text-center space-y-2">
                <p className="text-xs font-mono text-muted uppercase">Sample Document Preview</p>
                <h4 className="text-base font-bold text-ink">{previewFile.name}</h4>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  This is a demonstration preview for <strong>{previewFile.type.toUpperCase()}</strong>{' '}
                  ({previewFile.size}). In the live platform, this renders interactive PDF annotators,
                  Figma embed frames, or spreadsheet previews with digital signing markers.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted pt-1">
                <span>Uploaded {formatDate(previewFile.createdAt)}</span>
                <Button variant="secondary" size="sm" onClick={() => setPreviewFile(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Files Content */}
        {filteredFiles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No files found"
            description="Upload blueprints, specs, and mockups for this project."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowUploadModal(true)}
              >
                Upload File
              </Button>
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const uploader = users.find((u) => u.id === file.uploadedBy);

              return (
                <Card
                  key={file.id}
                  className="p-5 flex flex-col justify-between hover:border-flash/40 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-mist/60 border border-line/60">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1 text-muted hover:text-ink hover:bg-mist rounded"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1 text-muted hover:text-danger hover:bg-danger/10 rounded"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3
                        onClick={() => setPreviewFile(file)}
                        className="text-xs font-bold text-ink hover:text-flash-deep cursor-pointer truncate"
                      >
                        {file.name}
                      </h3>
                      <span className="text-[10px] font-mono text-muted">{file.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-line text-[11px] text-muted">
                    <div className="flex items-center gap-1.5">
                      {uploader && <Avatar user={uploader} size="xs" />}
                      <span className="truncate max-w-[100px]">{uploader?.name || 'User'}</span>
                    </div>
                    <span className="font-mono text-[10px]">{formatDate(file.createdAt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-paper-elevated border border-line rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-paper text-muted text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Uploaded By</th>
                  <th className="py-3 px-3">Date Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredFiles.map((file) => {
                  const uploader = users.find((u) => u.id === file.uploadedBy);
                  return (
                    <tr key={file.id} className="hover:bg-mist/30 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-2 cursor-pointer font-medium text-ink hover:text-flash-deep"
                          onClick={() => setPreviewFile(file)}
                        >
                          {getFileIcon(file.type)}
                          <span className="truncate max-w-xs">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-muted uppercase">
                        {file.type}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-muted">{file.size}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {uploader && <Avatar user={uploader} size="xs" />}
                          <span className="text-ink truncate">{uploader?.name || 'User'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-muted">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1 text-muted hover:text-ink rounded"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-1 text-muted hover:text-danger rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
