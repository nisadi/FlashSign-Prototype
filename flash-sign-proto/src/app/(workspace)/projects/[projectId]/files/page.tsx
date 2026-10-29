'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Trash2,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileImage,
  UploadCloud,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileType,
  ArrowRight,
  Edit2,
  Tag,
  CheckSquare,
} from 'lucide-react';
import type { ProjectFile, DocumentCategory, FileAnalysisStatus, SrsGeneratedTaskRecord } from '@/types';
import type { CreateTaskInput } from '@/context/app-context';
import { DocumentClassificationModal } from '@/components/projects/document-classification-modal';
import { SrsActionModal } from '@/components/projects/srs-action-modal';
import { GeneratedTasksReviewModal } from '@/components/projects/generated-tasks-review-modal';
import { SrsGeneratedTasksModal } from '@/components/projects/srs-generated-tasks-modal';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/shared/modal';
import { generateSuggestedTasksFromSrs, SrsSuggestedTask } from '@/lib/srs-analysis';

export default function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { projects, files, tasks, users, addFile, updateFile, deleteFile, addTasks, srsTaskHistories, saveSrsTaskHistory } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showUploadModal, setShowUploadModal] = useState(false);
  // The header's "+ New" menu opens this dialog with ?create=upload
  const createRequested = useSearchParams().get('create') === 'upload';
  const router = useRouter();
  const pathname = usePathname();
  const dialogOpen = showUploadModal || createRequested;
  const closeDialog = () => {
    setShowUploadModal(false);
    if (createRequested) router.replace(pathname);
  };
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);

  // Workflow modals state
  const [classifyModalFile, setClassifyModalFile] = useState<ProjectFile | null>(null);
  const [srsModalFile, setSrsModalFile] = useState<ProjectFile | null>(null);
  const [reviewModalFile, setReviewModalFile] = useState<ProjectFile | null>(null);
  const [srsHistoryModalFile, setSrsHistoryModalFile] = useState<ProjectFile | null>(null);
  const [srsSuggestedTasks, setSrsSuggestedTasks] = useState<SrsSuggestedTask[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New mock file form
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('pdf');
  const [newFileSize, setNewFileSize] = useState('2.4 MB');
  const [newFileCategory, setNewFileCategory] = useState<DocumentCategory>('srs');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const project =
    projects.find((p) => p.id === projectId) ||
    (projectId === 'p-mvhmnblw' ? projects.find((p) => p.id === 'p1') : undefined);

  if (!project) return notFound();

  const effectiveId =
    projectId === 'p-mvhmnblw' && !files.some((f) => f.projectId === 'p-mvhmnblw')
      ? 'p1'
      : projectId;

  const projectFiles = files.filter(
    (f) => f.projectId === projectId || f.projectId === effectiveId
  );

  const filteredFiles = projectFiles.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.category && f.category.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === 'all' || f.type.toLowerCase() === typeFilter.toLowerCase();
    const matchCat =
      categoryFilter === 'all' ||
      (categoryFilter === 'unclassified' ? !f.category : f.category === categoryFilter);
    return matchSearch && matchType && matchCat;
  });

  const handleUploadMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    addFile({
      name: newFileName.trim(),
      projectId: project.id,
      size: newFileSize,
      type: newFileType,
      category: newFileCategory,
      analysisStatus: 'not_analyzed',
      uploadedBy: project.ownerId,
      createdAt: new Date().toISOString(),
    });

    showToast(`File "${newFileName.trim()}" uploaded successfully.`);
    setNewFileName('');
    closeDialog();
  };

  const handleFileRowClick = (file: ProjectFile) => {
    setClassifyModalFile(file);
  };

  const handleConfirmClassification = (category: DocumentCategory) => {
    if (!classifyModalFile) return;

    updateFile(classifyModalFile.id, {
      category,
      analysisStatus: classifyModalFile.analysisStatus || 'not_analyzed',
    });

    const currentFile = { ...classifyModalFile, category };
    setClassifyModalFile(null);

    if (category === 'srs') {
      // Continue to SRS action workflow
      setSrsModalFile(currentFile);
    } else {
      // Save classification and show toast
      const categoryNames: Record<DocumentCategory, string> = {
        srs: 'SRS',
        test_report: 'Test Report',
        doc: 'Document (DOC)',
        other: 'Other Document',
      };
      showToast(`Document classified as ${categoryNames[category]} successfully.`);
    }
  };

  const handleSrsSaveOnly = () => {
    if (!srsModalFile) return;
    updateFile(srsModalFile.id, {
      category: 'srs',
      analysisStatus: srsModalFile.analysisStatus || 'not_analyzed',
    });
    setSrsModalFile(null);
    showToast('SRS classification saved successfully.');
  };

  const handleStartAnalysis = () => {
    if (!srsModalFile) return;
    const generated = generateSuggestedTasksFromSrs(
      srsModalFile.name,
      project.name,
      project.key
    );
    setSrsSuggestedTasks(generated);
    setReviewModalFile(srsModalFile);
    setSrsModalFile(null);
  };

  const handleAcceptRemainingTasks = (
    allTasks: SrsSuggestedTask[],
    acceptedTasks: SrsSuggestedTask[]
  ) => {
    if (!reviewModalFile) return;

    // 1. Prepare created project tasks for accepted items only
    const taskInputs: CreateTaskInput[] = acceptedTasks.map((t, idx) => ({
      id: `task-srs-${Date.now()}-${idx}`,
      key: `${project.key}-${tasks.length + idx + 101}`,
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria,
      priority: t.priority,
      status: 'todo',
      type: t.type,
      projectId: project.id,
      sourceDocumentId: reviewModalFile.id,
      sourceDocumentName: reviewModalFile.name,
      sourceSection: t.sourceSection,
      isSrsGenerated: true,
      points: t.points,
      tags: t.tags,
      labels: ['SRS Generated', ...t.tags],
    }));

    if (taskInputs.length > 0) {
      addTasks(taskInputs);
    }

    // 2. Map all tasks to complete SrsGeneratedTaskRecord[] audit history
    const taskInputMap = new Map<string, CreateTaskInput>();
    acceptedTasks.forEach((t, idx) => {
      taskInputMap.set(t.id, taskInputs[idx]);
    });

    const historyRecords: SrsGeneratedTaskRecord[] = allTasks.map((t, idx) => {
      const created = taskInputMap.get(t.id);
      const isAccepted = !t.isRejected;

      return {
        id: `srs-rec-${reviewModalFile.id}-${Date.now()}-${idx}`,
        originalId: t.id,
        projectTaskId: isAccepted && created ? created.id : undefined,
        projectTaskKey: isAccepted && created ? created.key : undefined,
        fileId: reviewModalFile.id,
        fileName: reviewModalFile.name,
        projectId: project.id,
        projectName: project.name,
        title: t.title,
        originalTitle: t.originalTitle || t.title,
        description: t.description,
        originalDescription: t.originalDescription || t.description,
        acceptanceCriteria: t.acceptanceCriteria,
        originalAcceptanceCriteria: t.originalAcceptanceCriteria || t.acceptanceCriteria,
        priority: t.priority,
        originalPriority: t.originalPriority || t.priority,
        type: t.type,
        originalType: t.originalType || t.type,
        sourceSection: t.sourceSection,
        points: t.points,
        tags: t.tags,
        isEdited: !!t.isEdited,
        outcome: isAccepted ? 'accepted' : 'rejected',
        rejectionReason: t.rejectionReason || (isAccepted ? undefined : 'Excluded during SRS analysis review: Not added to project backlog.'),
        createdAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      };
    });

    saveSrsTaskHistory(reviewModalFile.id, historyRecords);

    updateFile(reviewModalFile.id, {
      category: 'srs',
      analysisStatus: 'tasks_created',
      tasksGeneratedCount: acceptedTasks.length,
      analyzedAt: new Date().toISOString(),
    });

    setReviewModalFile(null);
    if (acceptedTasks.length > 0) {
      showToast(`${acceptedTasks.length} tasks added to ${project.name} (${allTasks.length - acceptedTasks.length} rejected). Generation history preserved.`);
    } else {
      showToast(`Review complete: all ${allTasks.length} tasks rejected. SRS generation history preserved.`);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'figma':
        return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileCode className="w-5 h-5 text-flash-deep" />;
    }
  };

  const getCategoryBadge = (category?: DocumentCategory) => {
    switch (category) {
      case 'srs':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> SRS
          </span>
        );
      case 'test_report':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-2.5 h-2.5 text-blue-600" /> TEST REPORT
          </span>
        );
      case 'doc':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <FileText className="w-2.5 h-2.5 text-amber-600" /> DOC
          </span>
        );
      case 'other':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30">
            OTHER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-mist/60 text-muted border border-line border-dashed">
            Unclassified
          </span>
        );
    }
  };

  const getAnalysisStatusBadge = (file: ProjectFile) => {
    switch (file.analysisStatus) {
      case 'tasks_created':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSrsHistoryModalFile(file);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25 hover:border-emerald-500/60 hover:shadow-xs transition-all cursor-pointer group/badge focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            title="Click to view all tasks generated from this SRS"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Tasks Created</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/badge:scale-125 transition-transform" />
          </button>
        );
      case 'analyzed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Sparkles className="w-3 h-3 text-blue-600" /> Analyzed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-mist/50 text-muted border border-line">
            Not Analyzed
          </span>
        );
    }
  };

  return (
    <div className="min-h-full bg-paper pb-16">
      <ProjectHeaderNav projectId={projectId} activeTab="files" />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-ink text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 border border-flash/30">
          <CheckCircle2 className="w-4 h-4 text-flash shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-up">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-flash-deep" /> Project Assets & Documentation
            </h1>
            <p className="text-xs text-muted">
              {projectFiles.length} files attached to {project.name} • Click any file to classify or analyze SRS
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files or categories…"
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs bg-paper-elevated border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash font-medium"
            >
              <option value="all">All Categories</option>
              <option value="srs">SRS Specifications</option>
              <option value="test_report">Test Reports</option>
              <option value="doc">Documents (DOC)</option>
              <option value="other">Other Assets</option>
              <option value="unclassified">Unclassified</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-paper-elevated border border-line rounded-lg text-xs text-ink outline-none focus:border-flash"
            >
              <option value="all">All File Formats</option>
              <option value="pdf">PDF</option>
              <option value="figma">Figma</option>
              <option value="csv">CSV/Data</option>
              <option value="code">Code/JSON</option>
            </select>

            {/* View toggle */}
            <div className="inline-flex rounded-xl border border-line bg-paper-elevated p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-ink text-flash' : 'text-muted hover:text-ink'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-ink text-flash' : 'text-muted hover:text-ink'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
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
              const isSrs = file.category === 'srs';

              return (
                <Card
                  key={file.id}
                  className="p-5 flex flex-col justify-between hover:border-flash/40 transition-all group cursor-pointer"
                  onClick={() => handleFileRowClick(file)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-mist/60 border border-line/60">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 text-muted hover:text-ink hover:bg-mist rounded-lg transition-colors"
                          title="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setClassifyModalFile(file)}
                          className="p-1.5 text-muted hover:text-ink hover:bg-mist rounded-lg transition-colors"
                          title="Change Document Classification"
                        >
                          <FileType className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getCategoryBadge(file.category)}
                        {getAnalysisStatusBadge(file)}
                      </div>

                      <h3 className="text-xs font-bold text-ink hover:text-flash-deep transition-colors truncate">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted mt-0.5">
                        <span className="uppercase">{file.type}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                      </div>
                    </div>

                    {isSrs && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        {file.analysisStatus === 'tasks_created' ? (
                          <button
                            onClick={() => setSrsHistoryModalFile(file)}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> View Generated Tasks
                          </button>
                        ) : (
                          <button
                            onClick={() => setSrsModalFile(file)}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Analyze SRS & Create Tasks
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-line text-[11px] text-muted mt-3">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-paper text-muted text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-3">Document Type</th>
                    <th className="py-3 px-3">Format</th>
                    <th className="py-3 px-3">File Size</th>
                    <th className="py-3 px-3">Analysis Status</th>
                    <th className="py-3 px-3">Uploaded Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredFiles.map((file) => {
                    const isSrs = file.category === 'srs';

                    return (
                      <tr
                        key={file.id}
                        onClick={() => handleFileRowClick(file)}
                        className="hover:bg-mist/30 transition-colors cursor-pointer group"
                      >
                        {/* File Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-mist/60 border border-line/60 shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-ink group-hover:text-flash-deep transition-colors truncate block max-w-xs sm:max-w-sm">
                                {file.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Document Type */}
                        <td className="py-3.5 px-3">
                          {getCategoryBadge(file.category)}
                        </td>

                        {/* Format */}
                        <td className="py-3.5 px-3 font-mono text-[11px] text-muted uppercase">
                          {file.type}
                        </td>

                        {/* File Size */}
                        <td className="py-3.5 px-3 font-mono text-[11px] text-muted">
                          {file.size}
                        </td>

                        {/* Analysis Status */}
                        <td className="py-3.5 px-3">
                          {getAnalysisStatusBadge(file)}
                        </td>

                        {/* Uploaded Date */}
                        <td className="py-3.5 px-3 font-mono text-[11px] text-muted">
                          {formatDate(file.createdAt)}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {isSrs && (
                              file.analysisStatus === 'tasks_created' ? (
                                <button
                                  onClick={() => setSrsHistoryModalFile(file)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/25 flex items-center gap-1 transition-colors"
                                  title="View all tasks generated from this SRS"
                                >
                                  <Sparkles className="w-3 h-3" /> View Tasks
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSrsModalFile(file)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/25 flex items-center gap-1 transition-colors"
                                  title="Analyze SRS and create suggested tasks"
                                >
                                  <Sparkles className="w-3 h-3" /> Analyze SRS
                                </button>
                              )
                            )}

                            <button
                              onClick={() => setClassifyModalFile(file)}
                              className="px-2 py-1 rounded-lg text-muted hover:text-ink hover:bg-mist/80 transition-colors text-[11px] font-medium flex items-center gap-1"
                              title="Change Document Classification"
                            >
                              <FileType className="w-3.5 h-3.5" /> Change Type
                            </button>

                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-1.5 text-muted hover:text-ink hover:bg-mist/80 rounded-lg transition-colors"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteFile(file.id)}
                              className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal (Rendered outside animate-fade-up via shared Modal) */}
      <Modal
        isOpen={dialogOpen}
        onClose={closeDialog}
        size="sm"
        aria-labelledby="modal-upload-title"
      >
        <ModalHeader
          title="Attach Mock File"
          description="Add a demonstration file attachment to this project workspace."
          icon={UploadCloud}
          iconColor="text-flash-deep"
          onClose={closeDialog}
          id="modal-upload-title"
        />
        <form onSubmit={handleUploadMock} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                File Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. FlashSign_SRS_v3.pdf"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Format</label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="figma">Figma Design</option>
                  <option value="csv">CSV Spreadsheet</option>
                  <option value="code">JSON / Code</option>
                  <option value="doc">DOC Word Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Document Category</label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-semibold"
                >
                  <option value="srs">SRS Specification</option>
                  <option value="test_report">Test Report</option>
                  <option value="doc">Document (DOC)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">File Size</label>
              <input
                type="text"
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xl outline-none focus:border-flash text-ink font-mono"
              />
            </div>
          </ModalBody>

          <ModalFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Attach File
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* File Preview Drawer / Modal */}
      {previewFile && (
        <Modal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          size="md"
          aria-labelledby="modal-preview-title"
        >
          <ModalHeader
            title={previewFile.name}
            icon={FileText}
            iconColor="text-flash-deep"
            onClose={() => setPreviewFile(null)}
            id="modal-preview-title"
          />
          <ModalBody className="space-y-4 text-center">
            <div className="flex justify-center">
              {getCategoryBadge(previewFile.category)}
            </div>
            <div className="p-6 bg-paper rounded-xl border border-line space-y-2">
              <h4 className="text-base font-bold text-ink">{previewFile.name}</h4>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Demonstration preview for <strong>{previewFile.type.toUpperCase()}</strong>{' '}
                ({previewFile.size}). Classification: <strong>{previewFile.category?.toUpperCase() || 'UNCLASSIFIED'}</strong>.
              </p>
            </div>
            <div className="text-xs text-muted font-mono">
              Uploaded {formatDate(previewFile.createdAt)}
            </div>
          </ModalBody>
          <ModalFooter className="justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const f = previewFile;
                setPreviewFile(null);
                setClassifyModalFile(f);
              }}
            >
              Classify Document
            </Button>
            <Button variant="primary" size="sm" onClick={() => setPreviewFile(null)}>
              Close Preview
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Classification Modal */}
      {classifyModalFile && (
        <DocumentClassificationModal
          file={classifyModalFile}
          isOpen={!!classifyModalFile}
          onClose={() => setClassifyModalFile(null)}
          onConfirm={handleConfirmClassification}
        />
      )}

      {/* SRS Action Modal */}
      {srsModalFile && (
        <SrsActionModal
          file={srsModalFile}
          isOpen={!!srsModalFile}
          onClose={() => setSrsModalFile(null)}
          onSaveOnly={handleSrsSaveOnly}
          onStartAnalysis={handleStartAnalysis}
        />
      )}

      {/* Generated Tasks Review Modal */}
      {reviewModalFile && (
        <GeneratedTasksReviewModal
          project={project}
          file={reviewModalFile}
          isOpen={!!reviewModalFile}
          tasks={srsSuggestedTasks}
          onClose={() => setReviewModalFile(null)}
          onAcceptRemaining={handleAcceptRemainingTasks}
        />
      )}

      {/* SRS Generated Tasks History Modal */}
      {srsHistoryModalFile && (
        <SrsGeneratedTasksModal
          project={project}
          file={srsHistoryModalFile}
          isOpen={!!srsHistoryModalFile}
          historyTasks={srsTaskHistories[srsHistoryModalFile.id] || []}
          onClose={() => setSrsHistoryModalFile(null)}
        />
      )}
    </div>
  );
}
