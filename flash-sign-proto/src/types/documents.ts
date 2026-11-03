// ─── Documents, Contracts & Electronic Signature Types ────────────────────────

export type DocumentType =
  | 'pdf'
  | 'docx'
  | 'agreement'
  | 'sow'
  | 'msa'
  | 'proposal'
  | 'nda'
  | 'spec'
  | 'contract'
  | 'other';

export type DocumentStatus =
  | 'draft'
  | 'in_review'
  | 'shared'
  | 'pending'
  | 'signed'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string | null;
  ownerId: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  modifiedBy: string;
  modifiedDate: string;
  changeSummary: string;
  content: string;
}

export interface DocumentComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  status: 'open' | 'resolved';
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  ownerId: string;
  ownerName?: string;
  folderId?: string | null;
  relatedProjectId?: string;
  relatedContractId?: string;
  content: string;
  fileSize?: string;
  pages?: number;
  isFavorite?: boolean;
  favorite?: boolean;
  isEditable?: boolean;
  currentVersion?: number;
  isShared?: boolean;
  sharedWithUserIds?: string[];
  accessType?: 'viewer' | 'editor' | 'signer';
  versions: DocumentVersion[];
  comments?: DocumentComment[];
  lastOpenedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** An uploaded PDF: the file itself lives in the browser's file store */
  pdf?: PdfAttachment;
}

export type TemplateCategory =
  | 'contracts'
  | 'legal'
  | 'sales'
  | 'project_management'
  | 'human_resources'
  | 'procurement'
  | 'general';

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  type: DocumentType;
  content: string;
  placeholders: string[]; // e.g. ["client_name", "effective_date"]
  isFavorite?: boolean;
  lastUpdated: string;
}

export type RenewalType = 'auto' | 'manual' | 'none' | 'auto_renew' | 'one_time';
export type SigningOrder = 'sequential' | 'parallel';

export type ContractType =
  | 'agreement'
  | 'sow'
  | 'msa'
  | 'nda'
  | 'proposal'
  | 'specification'
  | 'master_services_agreement'
  | 'statement_of_work'
  | 'non_disclosure_agreement'
  | 'software_license'
  | 'consulting_agreement'
  | 'vendor_contract'
  | 'service_level_agreement'
  | 'change_request'
  | 'other';

export type ContractStatus =
  | 'draft'
  | 'pending_review'
  | 'awaiting_signature'
  | 'active'
  | 'expiring'
  | 'completed'
  | 'expired'
  | 'archived';

export interface ContractReviewComment {
  id: string;
  authorId: string;
  authorName: string;
  text?: string;
  content?: string;
  createdAt: string;
  actionRequested?: 'changes' | 'approved';
}

export interface Contract {
  id: string;
  title: string;
  contractType: ContractType;
  counterparty: string;
  ownerId: string;
  ownerName?: string;
  reviewerName?: string;
  relatedProjectId?: string;
  documentId?: string;
  effectiveDate: string; // YYYY-MM-DD
  expiryDate?: string;    // YYYY-MM-DD
  renewalType: RenewalType;
  contractValue?: number; // USD
  value?: number; // convenience alias
  paymentTerms?: string;
  specialConditions?: string;
  description?: string;
  status: ContractStatus;
  reviewerId?: string;
  signatureRequestId?: string;
  reviewComments?: ContractReviewComment[];
  activity?: {
    id: string;
    action?: string;
    actor?: string;
    actorName?: string;
    description?: string;
    type?: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ─── Electronic Signatures Types ─────────────────────────────────────────────

export type SignatureSignerStatus =
  | 'waiting'
  | 'pending'
  | 'viewed'
  | 'signed'
  | 'declined';

export interface SignatureSigner {
  id: string;
  name: string;
  email: string;
  role: string;
  order: number;
  status: SignatureSignerStatus;
  viewedAt?: string;
  signedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  signatureValue?: string; // typed or drawn mock data URI / text
  required: boolean;
  color?: string;
}

export type SignatureFieldType =
  | 'signature'
  | 'initials'
  | 'date'
  | 'name'
  | 'text'
  | 'checkbox'
  // The rest of Flash Sign's 14 field types (used on uploaded-PDF requests)
  | 'email'
  | 'company'
  | 'title'
  | 'number'
  | 'dropdown'
  | 'radio'
  | 'approve'
  | 'decline';

export interface SignatureField {
  id: string;
  type: SignatureFieldType;
  signerId: string;
  pageNumber: number;
  /** On a request with a `pdf`: top-left corner and size as a percentage (0-100) of the page */
  positionX: number; // percentage 0-100 or px
  positionY: number; // percentage 0-100 or px
  width: number;
  height: number;
  required: boolean;
  value?: string;
  /** Which of the request's PDFs the field is on; missing = the first one */
  fileId?: string;
  /** Choices for a dropdown or radio field */
  options?: string[];
}

export type SignatureRequestStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_signed'
  /** Everyone has signed; it completes once every reviewer approves */
  | 'awaiting_review'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface AuditEvent {
  id: string;
  requestId?: string;
  documentId?: string;
  contractId?: string;
  name?: string;
  eventName?: string;
  actorName: string;
  actorEmail?: string;
  relatedSigner?: string;
  description: string;
  category?: 'security' | 'signing' | 'delivery' | 'status' | 'creation' | 'request';
  ipAddress?: string;
  timestamp: string;
}

export interface SignatureRequest {
  id: string;
  documentId?: string;
  contractId?: string;
  title: string;
  senderId: string;
  senderName?: string;
  signers: SignatureSigner[];
  signingOrder: SigningOrder;
  status: SignatureRequestStatus;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  expiresAt: string; // ISO date
  message?: string;
  reminderIntervalDays?: number;
  fields: SignatureField[];
  events?: AuditEvent[];
  /** An uploaded or sample PDF; its bytes live in the browser's file store (src/lib/pdf/file-store.ts) */
  pdf?: PdfAttachment;
  /** "Sign it yourself": the sender is the only signer and nothing is sent */
  selfSign?: boolean;
  /** People who get a copy of the finished document but do not sign */
  ccRecipients?: CopyRecipient[];
  /** People who check the signed document; the request is finished only when they all approve */
  reviewers?: SignatureReviewer[];
  /** Emails the demo would have sent, shown in the Outbox instead */
  emails?: DemoEmail[];
  /** All PDFs of the request, in order (`pdf` is the first one) */
  pdfs?: PdfAttachment[];
  /** In the Trash since this time; restoring clears it */
  deletedAt?: string;
  /** How often signers who have not signed are reminded automatically */
  reminderFrequency?: ReminderFrequency;
  lastReminderAt?: string;
  /** While status is 'draft': the setup screens' choices, so the draft can be continued */
  draft?: PdfRequestDraft;
}

export type DraftRecipientKind = 'signer' | 'copy' | 'review';

export interface PdfRequestDraft {
  mode: 'self' | 'send';
  step: number;
  recipients: { id: string; name: string; email: string; kind: DraftRecipientKind }[];
  signingOrder: SigningOrder;
  message: string;
  expiresInDays: number;
  reminderFrequency: ReminderFrequency;
  savedAt: string;
}

export interface PdfAttachment {
  fileId: string;
  name: string;
  sizeBytes: number;
  pageCount: number;
  /** Set for built-in sample documents, which can be rebuilt if the stored file is gone */
  sampleId?: string;
  /** The Documents library item this PDF came from (or was saved to) */
  documentId?: string;
}

export interface CopyRecipient {
  id: string;
  name: string;
  email: string;
  /** "Receives a copy"; 'view' is the old "Needs to view" role, kept on requests sent before reviewers */
  role?: 'copy' | 'view';
}

/**
 * waiting: signers are still signing · pending: asked to review · approved / rejected: done.
 * Rejecting closes the request as declined.
 */
export type ReviewerStatus = 'waiting' | 'pending' | 'approved' | 'rejected';

export interface SignatureReviewer {
  id: string;
  name: string;
  email: string;
  status: ReviewerStatus;
  reviewedAt?: string;
  /** Optional comment when approving; the reason when rejecting */
  note?: string;
}

export type DemoEmailKind = 'invite' | 'copy' | 'review' | 'reminder' | 'completed' | 'declined' | 'cancelled' | 'expired';

export interface DemoEmail {
  id: string;
  kind: DemoEmailKind;
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
  /** The recipient's personal signing link opens as this signer */
  signerId?: string;
  /** The reviewer's personal review link opens as this reviewer */
  reviewerId?: string;
  /** The signed PDF goes with it */
  withSignedPdf?: boolean;
  sentAt: string;
}

// ─── Saved Signatures, Signing Defaults & Company Seals ─────────────────────

export type SignatureSource = 'type' | 'draw' | 'upload';

/** Typed-signature font styles (same four as Flash Sign) */
export type SignatureStyle = 'formal' | 'script' | 'bold' | 'elegant';

/** One signature + initials per person, managed in Settings > My Signature */
export interface SavedSignature {
  userId: string;
  name: string;
  initials: string;
  source: SignatureSource;
  /** Used when source is 'type' */
  styleId?: SignatureStyle;
  /** PNG/JPEG data URLs when source is 'draw' or 'upload' */
  signatureImage?: string;
  initialsImage?: string;
  updatedAt: string;
}

export type ReminderFrequency = 'daily' | 'every_2_days' | 'every_3_days' | 'weekly' | 'never';

/** Organisation-wide defaults for new signature requests (Agreements > Settings) */
export interface SigningDefaults {
  expireDays: number;
  reminderFrequency: ReminderFrequency;
  signingOrder: SigningOrder;
  emailSubject: string;
  message: string;
  allowedSignatureMethods: SignatureSource[];
  /** Saved for later: no warning is sent yet */
  expiryWarningDays: number;
}

/** An approved company seal/stamp image that permitted roles may apply when signing */
export interface CompanySeal {
  id: string;
  name: string;
  description?: string;
  /** PNG/SVG/JPEG data URL */
  image: string;
  /** App roles allowed to apply this seal (DemoRole ids) */
  allowedRoles: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
  lastUsedAt?: string;
}
