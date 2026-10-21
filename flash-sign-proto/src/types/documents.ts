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
  | 'checkbox';

export interface SignatureField {
  id: string;
  type: SignatureFieldType;
  signerId: string;
  pageNumber: number;
  positionX: number; // percentage 0-100 or px
  positionY: number; // percentage 0-100 or px
  width: number;
  height: number;
  required: boolean;
  value?: string;
}

export type SignatureRequestStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_signed'
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
}
