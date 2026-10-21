import {
  DocumentItem,
  DocumentFolder,
  DocumentTemplate,
  Contract,
  SignatureRequest,
  AuditEvent,
} from '@/types/documents';

const now = new Date();
const d = (daysOffset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

const dt = (daysOffset: number, hoursOffset: number = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
};

// ─── Mock Folders ─────────────────────────────────────────────────────────────
export const MOCK_FOLDERS: DocumentFolder[] = [
  {
    id: 'f-legal',
    name: 'Legal & Compliance',
    parentId: null,
    ownerId: 'u9',
    documentCount: 5,
    createdAt: dt(-45),
    updatedAt: dt(-2),
  },
  {
    id: 'f-contracts',
    name: 'Client Master Contracts',
    parentId: 'f-legal',
    ownerId: 'u9',
    documentCount: 4,
    createdAt: dt(-40),
    updatedAt: dt(-1),
  },
  {
    id: 'f-sow',
    name: 'Statements of Work',
    parentId: null,
    ownerId: 'u2',
    documentCount: 4,
    createdAt: dt(-35),
    updatedAt: dt(-3),
  },
  {
    id: 'f-nda',
    name: 'Mutual NDAs',
    parentId: 'f-legal',
    ownerId: 'u1',
    documentCount: 3,
    createdAt: dt(-60),
    updatedAt: dt(-5),
  },
  {
    id: 'f-engineering',
    name: 'Engineering Specs & RFCs',
    parentId: null,
    ownerId: 'u3',
    documentCount: 2,
    createdAt: dt(-30),
    updatedAt: dt(-4),
  },
  {
    id: 'f-templates',
    name: 'Approved Org Templates',
    parentId: null,
    ownerId: 'u9',
    documentCount: 8,
    createdAt: dt(-90),
    updatedAt: dt(-10),
  },
];

// ─── Mock Document Templates ──────────────────────────────────────────────────
export const MOCK_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tpl-nda',
    title: 'Standard Mutual Non-Disclosure Agreement (NDA)',
    description: 'Bilateral confidentiality agreement safeguarding proprietary code, business logic, and IP.',
    category: 'legal',
    type: 'nda',
    placeholders: ['party_a', 'party_b', 'effective_date', 'jurisdiction'],
    isFavorite: true,
    lastUpdated: d(-5),
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made effective as of {{effective_date}}, by and between {{party_a}} ("Disclosing Party") and {{party_b}} ("Receiving Party").

### 1. Purpose
The parties wish to explore a potential business relationship in connection with software engineering, AI automation, and document security.

### 2. Confidential Information
"Confidential Information" refers to any non-public technical data, source code, cryptographic designs, customer lists, and financial forecasts disclosed directly or indirectly.

### 3. Obligations
The Receiving Party agrees to protect the Confidential Information with at least the degree of care it uses for its own confidential assets, but not less than reasonable care.

### 4. Governing Law
This Agreement shall be governed by the laws of {{jurisdiction}}.`,
  },
  {
    id: 'tpl-msa',
    title: 'Master Services Agreement (MSA)',
    description: 'Comprehensive software vendor master contract governing engineering deliverables and terms.',
    category: 'contracts',
    type: 'msa',
    placeholders: ['client_name', 'provider_name', 'effective_date', 'payment_terms'],
    isFavorite: true,
    lastUpdated: d(-8),
    content: `# MASTER SERVICES AGREEMENT (MSA)

This Master Services Agreement is entered into by {{provider_name}} ("Vendor") and {{client_name}} ("Client") on {{effective_date}}.

### 1. Services
Vendor shall provide custom software engineering, platform architecture, and electronic-signature infrastructure as specified in Statements of Work.

### 2. Payment Terms
Client shall compensate Vendor according to agreed hourly rates or fixed milestones. Invoices are payable under {{payment_terms}}.

### 3. Intellectual Property
Upon full settlement of milestone fees, Client acquires ownership of tailored work product, subject to Vendor background IP licenses.`,
  },
  {
    id: 'tpl-sow',
    title: 'Statement of Work (SOW) — Sprint Delivery',
    description: 'Deliverable-oriented sprint specification defining milestones, acceptance criteria, and budget.',
    category: 'project_management',
    type: 'sow',
    placeholders: ['project_title', 'sprint_count', 'total_cost', 'target_launch'],
    isFavorite: true,
    lastUpdated: d(-12),
    content: `# STATEMENT OF WORK: {{project_title}}

### 1. Scope of Work
Vendor will deliver full-stack enterprise capabilities across {{sprint_count}} agile two-week development sprints.

### 2. Target Milestones
- Milestone 1: Core UX and Identity Architecture
- Milestone 2: Electronic Signature Workflow & Field Engine
- Milestone 3: Production Hardening by {{target_launch}}

### 3. Total Commercials
Total engagement compensation: {{total_cost}}, payable upon delivery sign-off.`,
  },
  {
    id: 'tpl-consulting',
    title: 'Independent Consulting Agreement',
    description: 'Agreement for specialized external advisors, AI security auditors, and legal consultants.',
    category: 'human_resources',
    type: 'agreement',
    placeholders: ['consultant_name', 'hourly_rate', 'commencement_date'],
    isFavorite: false,
    lastUpdated: d(-15),
    content: `# CONSULTING SERVICES AGREEMENT

Agreement between Flash Sign Inc. and {{consultant_name}}, commencing on {{commencement_date}}.

1. Consulting Services: Technical security reviews, SOC2 readiness audit, and architecture guidance.
2. Compensation: Consultant will invoice bi-weekly at the agreed rate of {{hourly_rate}}.
3. Independent Status: Consultant remains an independent contractor.`,
  },
  {
    id: 'tpl-change-request',
    title: 'Project Scope Change Request (CR)',
    description: 'Formal amendment record adjusting sprint backlog scope, timeline, and associated fees.',
    category: 'project_management',
    type: 'agreement',
    placeholders: ['cr_number', 'project_name', 'scope_addition', 'added_cost'],
    isFavorite: false,
    lastUpdated: d(-20),
    content: `# SCOPE CHANGE REQUEST #{{cr_number}}

Project Reference: {{project_name}}

### Description of Scope Modification
{{scope_addition}}

### Commercial Impact
- Schedule variance: +14 calendar days
- Additional fee adjustment: {{added_cost}}`,
  },
  {
    id: 'tpl-sla',
    title: 'Service Level Agreement (SLA)',
    description: 'Enterprise uptime commitments, incident response tiers, and support guarantees.',
    category: 'procurement',
    type: 'agreement',
    placeholders: ['uptime_target', 'response_time_p1', 'client_tier'],
    isFavorite: false,
    lastUpdated: d(-22),
    content: `# ENTERPRISE SERVICE LEVEL AGREEMENT

Target Tier: {{client_tier}}

### Uptime Commitment
Vendor guarantees a monthly service availability of {{uptime_target}}%, excluding scheduled maintenance windows.

### Incident Severity Tiers
- Severity 1 (Critical Outage): Initial response within {{response_time_p1}}
- Severity 2 (Major Impairment): Response within 2 hours`,
  },
  {
    id: 'tpl-handover',
    title: 'Project Handover & Acceptance Sign-off',
    description: 'Formal client acceptance certificate confirming deliverables match contract specifications.',
    category: 'sales',
    type: 'agreement',
    placeholders: ['release_version', 'client_signoff_lead', 'handover_date'],
    isFavorite: false,
    lastUpdated: d(-28),
    content: `# CERTIFICATE OF DELIVERY ACCEPTANCE

Deliverable: {{release_version}}
Acceptance Date: {{handover_date}}

The undersigned representative {{client_signoff_lead}} acknowledges that all acceptance criteria and test matrices for the release have been fulfilled.`,
  },
  {
    id: 'tpl-vendor',
    title: 'Vendor Procurement Framework Agreement',
    description: 'Procurement policy and vendor compliance agreement for cloud compute and software licenses.',
    category: 'procurement',
    type: 'contract',
    placeholders: ['vendor_entity', 'annual_minimum', 'renewal_date'],
    isFavorite: false,
    lastUpdated: d(-30),
    content: `# VENDOR PROCUREMENT AGREEMENT

Framework Agreement between Flash Sign Operations and {{vendor_entity}}.

1. Annual Spend Baseline: {{annual_minimum}}
2. Data Processing & Security Standards: ISO/IEC 27001 compliance mandatory.
3. Renewal Notice: Written notice 60 days prior to {{renewal_date}}.`,
  },
];

// ─── Mock Documents Library (at least 15) ─────────────────────────────────────
export const MOCK_DOCUMENT_ITEMS: DocumentItem[] = [
  {
    id: 'doc-101',
    title: 'Acme Corp Master Services Agreement 2026',
    description: '2-year platform engineering and digital contract infrastructure agreement.',
    type: 'msa',
    status: 'pending',
    ownerId: 'u9', // David Osei
    folderId: 'f-contracts',
    relatedProjectId: 'p2',
    relatedContractId: 'cnt-1',
    fileSize: '2.4 MB',
    pages: 18,
    isFavorite: true,
    isShared: true,
    sharedWithUserIds: ['u1', 'u2', 'u10'],
    accessType: 'editor',
    lastOpenedAt: dt(-1),
    createdAt: dt(-14),
    updatedAt: dt(-1),
    content: `# MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is executed on October 14, 2026, by and between:
- **Vendor:** Flash Sign Inc., Delaware Corporation ("Flash Sign")
- **Client:** Acme Corporation, 100 Innovation Way, Suite 400, Austin TX ("Acme")

### 1. Scope of Services
Flash Sign shall provide unified enterprise software engineering, AI-assisted development tooling, and digital electronic signature workflow infrastructure.

### 2. Term & Milestones
The initial term shall run for 24 calendar months. Delivery schedules are governed by bilateral Statements of Work.

### 3. Confidentiality & Security
All source code, cryptographic signing keys, and proprietary schema definitions are held under strict non-disclosure obligations.

### 4. Counterparts & Execution
This document is executed via Flash Sign simulated electronic signature protocol.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-14),
        changeSummary: 'Initial legal draft prepared from standard enterprise template.',
        content: 'Initial draft content...',
      },
      {
        id: 'v1.1',
        versionNumber: 2,
        modifiedBy: 'David Osei',
        modifiedDate: d(-4),
        changeSummary: 'Updated Section 3 with SOC2 compliance and data residency covenants.',
        content: 'Revised draft with data residency...',
      },
    ],
    comments: [
      {
        id: 'cm-1',
        authorId: 'u1',
        authorName: 'Aria Chen',
        text: 'Payment milestones in Section 4 look solid. Ready for client signature.',
        createdAt: dt(-3),
        status: 'open',
      },
    ],
  },
  {
    id: 'doc-102',
    title: 'Acme Corp Mutual Non-Disclosure Agreement',
    description: 'Bilateral confidentiality agreement covering Flash Sign v2.0 source code and trade secrets.',
    type: 'nda',
    status: 'signed',
    ownerId: 'u9',
    folderId: 'f-nda',
    relatedProjectId: 'p2',
    relatedContractId: 'cnt-2',
    fileSize: '680 KB',
    pages: 6,
    isFavorite: true,
    isShared: true,
    sharedWithUserIds: ['u1', 'u10'],
    accessType: 'viewer',
    lastOpenedAt: dt(-2),
    createdAt: dt(-25),
    updatedAt: dt(-20),
    content: `# MUTUAL NON-DISCLOSURE AGREEMENT (EXECUTED)

Effective Date: October 1, 2026
Parties: Flash Sign Inc. and Acme Corporation.

Status: Fully Executed & Archived.
Both parties have recorded valid simulated signatures. All technical information shared during evaluation is strictly protected.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-25),
        changeSummary: 'Executed version after bilateral review.',
        content: 'Executed agreement...',
      },
    ],
  },
  {
    id: 'doc-103',
    title: 'Website Redesign & Portal SOW — Phase 1',
    description: 'Scope of work detailing customer dashboard overhaul and e-signature modal integration.',
    type: 'sow',
    status: 'in_review',
    ownerId: 'u2', // Marcus Webb
    folderId: 'f-sow',
    relatedProjectId: 'p1',
    relatedContractId: 'cnt-3',
    fileSize: '1.8 MB',
    pages: 12,
    isFavorite: false,
    isShared: true,
    sharedWithUserIds: ['u1', 'u9', 'u4'],
    accessType: 'editor',
    lastOpenedAt: dt(-1, -4),
    createdAt: dt(-7),
    updatedAt: dt(-2),
    content: `# STATEMENT OF WORK: CLIENT PORTAL OVERHAUL

Project: Acme Digital Platform (Phase 1)
Total Sprints: 6 Two-Week Sprints
Estimated Budget: $140,000 USD

### Deliverable Gates
1. Figma component library aligned with Flash Sign branding.
2. Next.js 16 App Router refactoring with zero layout overflow.
3. Signing canvas and real-time field placement overlay.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'Marcus Webb',
        modifiedDate: d(-7),
        changeSummary: 'Initial scope baseline submitted to internal review.',
        content: 'Initial SOW...',
      },
    ],
  },
  {
    id: 'doc-104',
    title: 'Cloud Infrastructure SLA & Uptime Guarantee',
    description: 'Guaranteed 99.95% API uptime policy and disaster recovery procedures.',
    type: 'agreement',
    status: 'approved',
    ownerId: 'u9',
    folderId: 'f-legal',
    relatedProjectId: 'p3',
    relatedContractId: 'cnt-4',
    fileSize: '950 KB',
    pages: 8,
    isFavorite: false,
    isShared: false,
    lastOpenedAt: dt(-6),
    createdAt: dt(-18),
    updatedAt: dt(-10),
    content: `# SERVICE LEVEL AGREEMENT (SLA)

Uptime Target: 99.95% Availability across AWS us-east-1 and eu-west-1 clusters.
Incident Response Time: 15-minute acknowledgment for Sev-1 operational incidents.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-18),
        changeSummary: 'Reviewed by DevOps and Legal leads.',
        content: 'SLA document...',
      },
    ],
  },
  {
    id: 'doc-105',
    title: 'Vertex Labs Consulting & Audit Agreement',
    description: 'External security penetration testing and cryptography architecture validation.',
    type: 'contract',
    status: 'draft',
    ownerId: 'u9',
    folderId: 'f-contracts',
    relatedProjectId: 'p4',
    relatedContractId: 'cnt-5',
    fileSize: '1.1 MB',
    pages: 9,
    isFavorite: false,
    isShared: true,
    sharedWithUserIds: ['u1'],
    accessType: 'editor',
    lastOpenedAt: dt(0, -2),
    createdAt: dt(-3),
    updatedAt: dt(0, -1),
    content: `# INDEPENDENT CONSULTING AGREEMENT (DRAFT)

Between: Flash Sign Inc. and Vertex Security Labs LLC.
Engagement: AI Agent Sandboxing & E-Signature Audit.
Estimated Start: November 15, 2026.`,
    versions: [
      {
        id: 'v0.9',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-3),
        changeSummary: 'Draft terms being reviewed.',
        content: 'Draft...',
      },
    ],
  },
  {
    id: 'doc-106',
    title: 'Northstar Studio Partnership Term Sheet',
    description: 'Strategic co-marketing and integration term sheet for design asset libraries.',
    type: 'proposal',
    status: 'shared',
    ownerId: 'u1',
    folderId: 'f-legal',
    fileSize: '520 KB',
    pages: 4,
    isFavorite: false,
    isShared: true,
    sharedWithUserIds: ['u9', 'u2'],
    accessType: 'viewer',
    lastOpenedAt: dt(-5),
    createdAt: dt(-12),
    updatedAt: dt(-8),
    content: `# STRATEGIC PARTNERSHIP TERM SHEET

Exploring mutual distribution of UI components and electronic document templates. Non-binding commercial terms.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'Aria Chen',
        modifiedDate: d(-12),
        changeSummary: 'Initial term sheet.',
        content: 'Term sheet...',
      },
    ],
  },
  {
    id: 'doc-107',
    title: 'Software Development Agreement — Mobile App SDK',
    description: 'iOS and Android native electronic signature capture SDK development agreement.',
    type: 'contract',
    status: 'pending',
    ownerId: 'u9',
    folderId: 'f-contracts',
    relatedProjectId: 'p1',
    fileSize: '3.1 MB',
    pages: 22,
    isFavorite: true,
    isShared: true,
    sharedWithUserIds: ['u3', 'u4'],
    accessType: 'editor',
    lastOpenedAt: dt(-2),
    createdAt: dt(-9),
    updatedAt: dt(-2),
    content: `# MOBILE SDK DEVELOPMENT AGREEMENT

Scope includes React Native and Swift/Kotlin bridge wrappers for Flash Sign touch signature capture.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-9),
        changeSummary: 'Draft SDK terms.',
        content: 'Content...',
      },
    ],
  },
  {
    id: 'doc-108',
    title: 'Change Request #04: Biometric Signature Auth Spec',
    description: 'Scope amendment to incorporate mobile touch biometric verification into sign flows.',
    type: 'agreement',
    status: 'approved',
    ownerId: 'u2',
    folderId: 'f-sow',
    relatedProjectId: 'p2',
    fileSize: '410 KB',
    pages: 5,
    isFavorite: false,
    isShared: false,
    lastOpenedAt: dt(-10),
    createdAt: dt(-22),
    updatedAt: dt(-15),
    content: `# SCOPE CHANGE REQUEST #04

Approved expansion of Phase 2 sprint scope for biometric confirmation modals.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'Marcus Webb',
        modifiedDate: d(-22),
        changeSummary: 'Approved CR.',
        content: 'CR content...',
      },
    ],
  },
  {
    id: 'doc-109',
    title: 'Flash Sign Enterprise DPA (Data Processing Addendum)',
    description: 'GDPR and CCPA compliant data processing addendum for European enterprise clients.',
    type: 'agreement',
    status: 'signed',
    ownerId: 'u9',
    folderId: 'f-legal',
    fileSize: '1.4 MB',
    pages: 14,
    isFavorite: true,
    isShared: true,
    sharedWithUserIds: ['u1', 'u10'],
    accessType: 'viewer',
    lastOpenedAt: dt(-4),
    createdAt: dt(-35),
    updatedAt: dt(-30),
    content: `# DATA PROCESSING ADDENDUM (DPA)

Governing the processing of personal data in compliance with Regulation (EU) 2016/679 (GDPR).`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-35),
        changeSummary: 'Standard EU DPA.',
        content: 'DPA...',
      },
    ],
  },
  {
    id: 'doc-110',
    title: 'Subcontractor Agreement — QA Automation Lead',
    description: 'Contractor agreement for Playwright and Cypress end-to-end testing coverage.',
    type: 'contract',
    status: 'draft',
    ownerId: 'u9',
    folderId: 'f-contracts',
    fileSize: '890 KB',
    pages: 7,
    isFavorite: false,
    isShared: false,
    lastOpenedAt: dt(-1),
    createdAt: dt(-4),
    updatedAt: dt(-2),
    content: `# SUBCONTRACTOR AGREEMENT

Independent QA automation specialist scope for regression testing pipelines.`,
    versions: [
      {
        id: 'v0.8',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-4),
        changeSummary: 'Draft in preparation.',
        content: 'Draft...',
      },
    ],
  },
  {
    id: 'doc-111',
    title: 'Product Requirements Doc: E-Signature Canvas v2',
    description: 'Detailed technical specification for responsive signature field dragging and zoom.',
    type: 'spec',
    status: 'approved',
    ownerId: 'u3',
    folderId: 'f-engineering',
    fileSize: '1.9 MB',
    pages: 16,
    isFavorite: false,
    isShared: true,
    sharedWithUserIds: ['u2', 'u4', 'u9'],
    accessType: 'editor',
    lastOpenedAt: dt(-3),
    createdAt: dt(-20),
    updatedAt: dt(-12),
    content: `# PRD: ELECTRONIC SIGNATURE CANVAS V2

Specification covering multi-signer field coordinates, responsive page scale, and touch stylus events.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'Alex Rivera',
        modifiedDate: d(-20),
        changeSummary: 'Approved spec.',
        content: 'PRD...',
      },
    ],
  },
  {
    id: 'doc-112',
    title: 'Consulting Retainer Agreement — Legal Advisory',
    description: 'Quarterly legal retainer agreement for SaaS terms of service and compliance updates.',
    type: 'contract',
    status: 'signed',
    ownerId: 'u9',
    folderId: 'f-legal',
    fileSize: '740 KB',
    pages: 6,
    isFavorite: false,
    isShared: false,
    lastOpenedAt: dt(-15),
    createdAt: dt(-50),
    updatedAt: dt(-45),
    content: `# LEGAL ADVISORY RETAINER

Retainer agreement with Morrison & Foerster LLP for SaaS regulatory advice.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-50),
        changeSummary: 'Signed retainer.',
        content: 'Retainer...',
      },
    ],
  },
  {
    id: 'doc-113',
    title: 'Project Handover Sign-off: Sprint 18 Deliverables',
    description: 'Formal sign-off acknowledging completion of AI agent review dashboard.',
    type: 'agreement',
    status: 'signed',
    ownerId: 'u2',
    folderId: 'f-sow',
    relatedProjectId: 'p1',
    fileSize: '510 KB',
    pages: 3,
    isFavorite: false,
    isShared: true,
    sharedWithUserIds: ['u1', 'u9'],
    accessType: 'viewer',
    lastOpenedAt: dt(-8),
    createdAt: dt(-16),
    updatedAt: dt(-14),
    content: `# DELIVERABLE HANDOVER CERTIFICATE

Sprint 18 delivery formally verified and accepted by project leadership.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'Marcus Webb',
        modifiedDate: d(-16),
        changeSummary: 'Executed handover.',
        content: 'Handover...',
      },
    ],
  },
  {
    id: 'doc-114',
    title: 'Cloudflare Enterprise CDN & WAF Service Agreement',
    description: 'Enterprise edge caching, DDoS mitigation, and SSL termination agreement.',
    type: 'contract',
    status: 'signed',
    ownerId: 'u9',
    folderId: 'f-legal',
    fileSize: '1.6 MB',
    pages: 11,
    isFavorite: false,
    isShared: false,
    lastOpenedAt: dt(-20),
    createdAt: dt(-70),
    updatedAt: dt(-65),
    content: `# CLOUDFLARE ENTERPRISE SERVICE AGREEMENT

High-availability edge routing and WAF security agreement.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'David Osei',
        modifiedDate: d(-70),
        changeSummary: 'Signed contract.',
        content: 'Content...',
      },
    ],
  },
  {
    id: 'doc-115',
    title: 'Marketing Agency Creative Proposal — Q4 Campaign',
    description: 'Creative campaign proposal for developer conference sponsorships and launch demos.',
    type: 'proposal',
    status: 'in_review',
    ownerId: 'u1',
    folderId: 'f-legal',
    fileSize: '4.2 MB',
    pages: 26,
    isFavorite: false,
    isShared: true,
    sharedWithUserIds: ['u2', 'u9'],
    accessType: 'editor',
    lastOpenedAt: dt(-3),
    createdAt: dt(-10),
    updatedAt: dt(-3),
    content: `# Q4 DEVELOPER ADVOCACY PROPOSAL

Strategy proposal covering interactive sandbox demos, hackathons, and signature workflow showcases.`,
    versions: [
      {
        id: 'v1.0',
        versionNumber: 1,
        modifiedBy: 'Aria Chen',
        modifiedDate: d(-10),
        changeSummary: 'Under budget review.',
        content: 'Proposal...',
      },
    ],
  },
];

// ─── Mock Contracts (at least 10) ─────────────────────────────────────────────
export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'cnt-1',
    title: 'Acme Corp Master Services Agreement',
    contractType: 'master_services_agreement',
    counterparty: 'Acme Corporation',
    ownerId: 'u9',
    relatedProjectId: 'p2',
    documentId: 'doc-101',
    effectiveDate: d(-14),
    expiryDate: d(716), // 2 years out
    renewalType: 'auto',
    contractValue: 320000,
    paymentTerms: 'Net 30 milestone disbursements upon delivery acceptance',
    specialConditions: 'Includes priority 24/7 SLA and dedicated engineering lead.',
    status: 'awaiting_signature',
    reviewerId: 'u1',
    signatureRequestId: 'sig-1',
    reviewComments: [
      {
        id: 'rc-1',
        authorId: 'u1',
        authorName: 'Aria Chen',
        text: 'Commercial liability caps adjusted to $1M. Approved for execution.',
        createdAt: dt(-3),
        actionRequested: 'approved',
      },
    ],
    activity: [
      { id: 'ca-1', action: 'Contract created from template', actor: 'David Osei', timestamp: dt(-14) },
      { id: 'ca-2', action: 'Submitted for internal review', actor: 'David Osei', timestamp: dt(-5) },
      { id: 'ca-3', action: 'Approved by CEO Aria Chen', actor: 'Aria Chen', timestamp: dt(-3) },
      { id: 'ca-4', action: 'Signature request dispatched', actor: 'David Osei', timestamp: dt(-2) },
    ],
    createdAt: dt(-14),
    updatedAt: dt(-2),
  },
  {
    id: 'cnt-2',
    title: 'Acme Corp Mutual NDA',
    contractType: 'non_disclosure_agreement',
    counterparty: 'Acme Corporation',
    ownerId: 'u9',
    relatedProjectId: 'p2',
    documentId: 'doc-102',
    effectiveDate: d(-25),
    expiryDate: d(340),
    renewalType: 'auto',
    contractValue: 0,
    paymentTerms: 'N/A — Bilateral confidentiality covenants',
    status: 'active',
    reviewerId: 'u1',
    signatureRequestId: 'sig-2',
    reviewComments: [],
    activity: [
      { id: 'ca-5', action: 'Draft created', actor: 'David Osei', timestamp: dt(-28) },
      { id: 'ca-6', action: 'Signed by all parties', actor: 'Flash Sign System', timestamp: dt(-24) },
    ],
    createdAt: dt(-28),
    updatedAt: dt(-24),
  },
  {
    id: 'cnt-3',
    title: 'Client Portal Redesign Statement of Work',
    contractType: 'statement_of_work',
    counterparty: 'Acme Corporation',
    ownerId: 'u2',
    relatedProjectId: 'p1',
    documentId: 'doc-103',
    effectiveDate: d(5),
    expiryDate: d(185),
    renewalType: 'manual',
    contractValue: 140000,
    paymentTerms: '30% upfront, 40% milestone 2, 30% final sign-off',
    status: 'pending_review',
    reviewerId: 'u9',
    reviewComments: [
      {
        id: 'rc-2',
        authorId: 'u9',
        authorName: 'David Osei',
        text: 'Please clarify Figma deliverable acceptance criteria before we dispatch.',
        createdAt: dt(-1),
        actionRequested: 'changes',
      },
    ],
    activity: [
      { id: 'ca-7', action: 'SOW drafted', actor: 'Marcus Webb', timestamp: dt(-7) },
      { id: 'ca-8', action: 'Changes requested by Legal', actor: 'David Osei', timestamp: dt(-1) },
    ],
    createdAt: dt(-7),
    updatedAt: dt(-1),
  },
  {
    id: 'cnt-4',
    title: 'Cloud Infrastructure SLA Agreement',
    contractType: 'service_level_agreement',
    counterparty: 'AWS Enterprise Cloud',
    ownerId: 'u9',
    relatedProjectId: 'p3',
    documentId: 'doc-104',
    effectiveDate: d(-18),
    expiryDate: d(347),
    renewalType: 'auto',
    contractValue: 75000,
    paymentTerms: 'Annual billing with monthly credit reconciliation',
    status: 'active',
    reviewerId: 'u1',
    reviewComments: [],
    activity: [
      { id: 'ca-9', action: 'Contract activated', actor: 'David Osei', timestamp: dt(-10) },
    ],
    createdAt: dt(-18),
    updatedAt: dt(-10),
  },
  {
    id: 'cnt-5',
    title: 'Vertex Security Audit & Pen Test',
    contractType: 'consulting_agreement',
    counterparty: 'Vertex Security Labs LLC',
    ownerId: 'u9',
    relatedProjectId: 'p4',
    documentId: 'doc-105',
    effectiveDate: d(14),
    expiryDate: d(44),
    renewalType: 'none',
    contractValue: 28000,
    paymentTerms: '50% upon kickoff, 50% upon final penetration report delivery',
    status: 'draft',
    reviewerId: 'u1',
    reviewComments: [],
    activity: [
      { id: 'ca-10', action: 'Draft initialized', actor: 'David Osei', timestamp: dt(-3) },
    ],
    createdAt: dt(-3),
    updatedAt: dt(-1),
  },
  {
    id: 'cnt-6',
    title: 'Northstar Creative Partnership Agreement',
    contractType: 'vendor_contract',
    counterparty: 'Northstar Studio',
    ownerId: 'u1',
    documentId: 'doc-106',
    effectiveDate: d(-60),
    expiryDate: d(25), // Expiring in 25 days (< 30 days!)
    renewalType: 'manual',
    contractValue: 45000,
    paymentTerms: 'Quarterly service retainer',
    status: 'expiring',
    reviewerId: 'u9',
    reviewComments: [],
    activity: [
      { id: 'ca-11', action: 'Renewal reminder generated (expiring < 30d)', actor: 'System Alert', timestamp: dt(-1) },
    ],
    createdAt: dt(-60),
    updatedAt: dt(-1),
  },
  {
    id: 'cnt-7',
    title: 'Mobile App SDK Software License',
    contractType: 'software_license',
    counterparty: 'Global Fintech Solutions',
    ownerId: 'u9',
    relatedProjectId: 'p1',
    documentId: 'doc-107',
    effectiveDate: d(-5),
    expiryDate: d(360),
    renewalType: 'auto',
    contractValue: 185000,
    paymentTerms: 'Annual subscription fee upfront',
    status: 'awaiting_signature',
    reviewerId: 'u1',
    signatureRequestId: 'sig-3',
    reviewComments: [],
    activity: [
      { id: 'ca-12', action: 'Sent for client signature', actor: 'David Osei', timestamp: dt(-2) },
    ],
    createdAt: dt(-9),
    updatedAt: dt(-2),
  },
  {
    id: 'cnt-8',
    title: 'Biometric Signing Module Change Request',
    contractType: 'change_request',
    counterparty: 'Acme Corporation',
    ownerId: 'u2',
    relatedProjectId: 'p2',
    documentId: 'doc-108',
    effectiveDate: d(-15),
    expiryDate: d(165),
    renewalType: 'none',
    contractValue: 18000,
    paymentTerms: 'Payable upon completion of milestone tests',
    status: 'active',
    reviewerId: 'u9',
    reviewComments: [],
    activity: [
      { id: 'ca-13', action: 'Executed and active', actor: 'Marcus Webb', timestamp: dt(-15) },
    ],
    createdAt: dt(-22),
    updatedAt: dt(-15),
  },
  {
    id: 'cnt-9',
    title: 'Legacy Hosting & Managed Server Agreement',
    contractType: 'vendor_contract',
    counterparty: 'Rackspace Hosting Corp',
    ownerId: 'u9',
    effectiveDate: d(-400),
    expiryDate: d(-35), // Expired 35 days ago
    renewalType: 'none',
    contractValue: 36000,
    paymentTerms: 'Terminated upon cloud migration to AWS',
    status: 'completed',
    reviewComments: [],
    activity: [
      { id: 'ca-14', action: 'Contract term completed & closed', actor: 'David Osei', timestamp: dt(-35) },
    ],
    createdAt: dt(-400),
    updatedAt: dt(-35),
  },
  {
    id: 'cnt-10',
    title: 'Archived Q2 Marketing Sponsorship Deal',
    contractType: 'vendor_contract',
    counterparty: 'TechConf Global Events',
    ownerId: 'u1',
    effectiveDate: d(-180),
    expiryDate: d(-90),
    renewalType: 'none',
    contractValue: 15000,
    paymentTerms: 'One-time sponsorship fee',
    status: 'archived',
    reviewComments: [],
    activity: [
      { id: 'ca-15', action: 'Archived to historical records', actor: 'Aria Chen', timestamp: dt(-85) },
    ],
    createdAt: dt(-180),
    updatedAt: dt(-85),
  },
];

// ─── Mock Electronic Signature Requests (at least 12) ─────────────────────────
export const MOCK_SIGNATURE_REQUESTS: SignatureRequest[] = [
  {
    id: 'sig-1',
    documentId: 'doc-101',
    contractId: 'cnt-1',
    title: 'Acme Corp Master Services Agreement Execution',
    senderId: 'u9', // David Osei
    signingOrder: 'sequential',
    status: 'sent',
    expiresAt: d(14),
    message: 'Please review and execute the Master Services Agreement for our 2026 engagement.',
    reminderIntervalDays: 3,
    createdAt: dt(-2),
    sentAt: dt(-2),
    signers: [
      {
        id: 'sgn-1',
        name: 'David Osei',
        email: 'david@flashsign.io',
        role: 'Flash Sign Legal Lead',
        order: 1,
        status: 'signed',
        signedAt: dt(-2, 2),
        signatureValue: 'David Osei',
        required: true,
        color: '#00c2a8',
      },
      {
        id: 'sgn-2',
        name: 'Claire Dupont',
        email: 'claire@acmecorp.com',
        role: 'Client Executive Sponsor',
        order: 2,
        status: 'pending',
        viewedAt: dt(-1),
        required: true,
        color: '#3b82f6',
      },
    ],
    fields: [
      {
        id: 'fld-1',
        type: 'signature',
        signerId: 'sgn-1',
        pageNumber: 1,
        positionX: 18,
        positionY: 82,
        width: 180,
        height: 48,
        required: true,
        value: 'David Osei',
      },
      {
        id: 'fld-2',
        type: 'date',
        signerId: 'sgn-1',
        pageNumber: 1,
        positionX: 55,
        positionY: 82,
        width: 140,
        height: 40,
        required: true,
        value: d(-2),
      },
      {
        id: 'fld-3',
        type: 'signature',
        signerId: 'sgn-2',
        pageNumber: 1,
        positionX: 18,
        positionY: 90,
        width: 180,
        height: 48,
        required: true,
      },
      {
        id: 'fld-4',
        type: 'date',
        signerId: 'sgn-2',
        pageNumber: 1,
        positionX: 55,
        positionY: 90,
        width: 140,
        height: 40,
        required: true,
      },
    ],
    events: [
      {
        id: 'ev-1',
        requestId: 'sig-1',
        eventName: 'Request Created',
        actorName: 'David Osei',
        actorEmail: 'david@flashsign.io',
        description: 'Demo signature request prepared from document #doc-101.',
        category: 'creation',
        timestamp: dt(-2),
      },
      {
        id: 'ev-2',
        requestId: 'sig-1',
        eventName: 'Dispatched for Signature',
        actorName: 'Flash Sign Dispatcher',
        actorEmail: 'system@flashsign.io',
        description: 'Simulated notifications queued for signers in sequence.',
        category: 'delivery',
        timestamp: dt(-2),
      },
      {
        id: 'ev-3',
        requestId: 'sig-1',
        eventName: 'Signer 1 Completed',
        actorName: 'David Osei',
        actorEmail: 'david@flashsign.io',
        relatedSigner: 'David Osei',
        description: 'David Osei signed page 1 using simulated typed signature.',
        category: 'signing',
        timestamp: dt(-2, 2),
      },
      {
        id: 'ev-4',
        requestId: 'sig-1',
        eventName: 'Document Viewed',
        actorName: 'Claire Dupont',
        actorEmail: 'claire@acmecorp.com',
        relatedSigner: 'Claire Dupont',
        description: 'Claire Dupont viewed agreement preview on secure demo canvas.',
        category: 'signing',
        timestamp: dt(-1),
      },
    ],
  },
  {
    id: 'sig-2',
    documentId: 'doc-102',
    contractId: 'cnt-2',
    title: 'Acme Corp Mutual NDA Execution',
    senderId: 'u9',
    signingOrder: 'parallel',
    status: 'completed',
    expiresAt: d(10),
    message: 'Mutual confidentiality execution.',
    createdAt: dt(-26),
    sentAt: dt(-26),
    completedAt: dt(-24),
    signers: [
      {
        id: 'sgn-3',
        name: 'Aria Chen',
        email: 'aria@flashsign.io',
        role: 'CEO',
        order: 1,
        status: 'signed',
        signedAt: dt(-25),
        signatureValue: 'Aria Chen',
        required: true,
        color: '#00c2a8',
      },
      {
        id: 'sgn-4',
        name: 'Claire Dupont',
        email: 'claire@acmecorp.com',
        role: 'Client Representative',
        order: 1,
        status: 'signed',
        signedAt: dt(-24),
        signatureValue: 'Claire Dupont',
        required: true,
        color: '#3b82f6',
      },
    ],
    fields: [
      {
        id: 'fld-5',
        type: 'signature',
        signerId: 'sgn-3',
        pageNumber: 1,
        positionX: 20,
        positionY: 85,
        width: 160,
        height: 44,
        required: true,
        value: 'Aria Chen',
      },
      {
        id: 'fld-6',
        type: 'signature',
        signerId: 'sgn-4',
        pageNumber: 1,
        positionX: 60,
        positionY: 85,
        width: 160,
        height: 44,
        required: true,
        value: 'Claire Dupont',
      },
    ],
    events: [
      {
        id: 'ev-5',
        requestId: 'sig-2',
        eventName: 'All Signatures Completed',
        actorName: 'Flash Sign Protocol',
        description: 'Simulated multi-party workflow completed successfully.',
        category: 'status',
        timestamp: dt(-24),
      },
    ],
  },
  {
    id: 'sig-3',
    documentId: 'doc-107',
    contractId: 'cnt-7',
    title: 'Mobile SDK Software License Sign-off',
    senderId: 'u9',
    signingOrder: 'parallel',
    status: 'viewed',
    expiresAt: d(8),
    message: 'Please review and execute the SDK developer license.',
    createdAt: dt(-5),
    sentAt: dt(-4),
    signers: [
      {
        id: 'sgn-5',
        name: 'Marcus Webb',
        email: 'marcus@flashsign.io',
        role: 'Project Manager',
        order: 1,
        status: 'viewed',
        viewedAt: dt(-2),
        required: true,
        color: '#f59e0b',
      },
      {
        id: 'sgn-6',
        name: 'Alex Rivera',
        email: 'alex@flashsign.io',
        role: 'Lead Architect',
        order: 1,
        status: 'pending',
        required: true,
        color: '#8b5cf6',
      },
    ],
    fields: [
      {
        id: 'fld-7',
        type: 'signature',
        signerId: 'sgn-5',
        pageNumber: 1,
        positionX: 20,
        positionY: 85,
        width: 180,
        height: 44,
        required: true,
      },
      {
        id: 'fld-8',
        type: 'signature',
        signerId: 'sgn-6',
        pageNumber: 1,
        positionX: 60,
        positionY: 85,
        width: 180,
        height: 44,
        required: true,
      },
    ],
    events: [
      {
        id: 'ev-6',
        requestId: 'sig-3',
        eventName: 'Document Opened',
        actorName: 'Marcus Webb',
        actorEmail: 'marcus@flashsign.io',
        relatedSigner: 'Marcus Webb',
        description: 'Signer viewed the mobile SDK license document.',
        category: 'signing',
        timestamp: dt(-2),
      },
    ],
  },
  {
    id: 'sig-4',
    documentId: 'doc-103',
    contractId: 'cnt-3',
    title: 'Website Portal SOW Approval',
    senderId: 'u2',
    signingOrder: 'sequential',
    status: 'draft',
    expiresAt: d(20),
    message: 'Sprint scope and budget confirmation.',
    createdAt: dt(-1),
    signers: [
      {
        id: 'sgn-7',
        name: 'Aria Chen',
        email: 'aria@flashsign.io',
        role: 'CEO',
        order: 1,
        status: 'waiting',
        required: true,
        color: '#00c2a8',
      },
      {
        id: 'sgn-8',
        name: 'Claire Dupont',
        email: 'claire@acmecorp.com',
        role: 'Client Lead',
        order: 2,
        status: 'waiting',
        required: true,
        color: '#3b82f6',
      },
    ],
    fields: [],
    events: [
      {
        id: 'ev-7',
        requestId: 'sig-4',
        eventName: 'Draft Initialized',
        actorName: 'Marcus Webb',
        description: 'Signature configuration draft saved locally.',
        category: 'creation',
        timestamp: dt(-1),
      },
    ],
  },
  {
    id: 'sig-5',
    documentId: 'doc-109',
    title: 'European Union Data Processing Addendum',
    senderId: 'u9',
    signingOrder: 'parallel',
    status: 'completed',
    expiresAt: d(-10),
    message: 'Mandatory GDPR Article 28 data processing execution.',
    createdAt: dt(-35),
    sentAt: dt(-35),
    completedAt: dt(-32),
    signers: [
      {
        id: 'sgn-9',
        name: 'David Osei',
        email: 'david@flashsign.io',
        role: 'Data Protection Officer',
        order: 1,
        status: 'signed',
        signedAt: dt(-33),
        signatureValue: 'David Osei (DPO)',
        required: true,
        color: '#00c2a8',
      },
      {
        id: 'sgn-10',
        name: 'Claire Dupont',
        email: 'claire@acmecorp.com',
        role: 'EU Compliance Officer',
        order: 1,
        status: 'signed',
        signedAt: dt(-32),
        signatureValue: 'Claire Dupont',
        required: true,
        color: '#3b82f6',
      },
    ],
    fields: [],
    events: [
      {
        id: 'ev-8',
        requestId: 'sig-5',
        eventName: 'Audit Log Archived',
        actorName: 'Compliance Engine',
        description: 'Simulated certificate hash sealed and verified.',
        category: 'security',
        timestamp: dt(-32),
      },
    ],
  },
  {
    id: 'sig-6',
    documentId: 'doc-104',
    contractId: 'cnt-4',
    title: 'Cloud Infrastructure SLA Sign-off',
    senderId: 'u9',
    signingOrder: 'sequential',
    status: 'completed',
    expiresAt: d(-2),
    createdAt: dt(-20),
    sentAt: dt(-20),
    completedAt: dt(-17),
    signers: [
      {
        id: 'sgn-11',
        name: 'Aria Chen',
        email: 'aria@flashsign.io',
        role: 'CEO',
        order: 1,
        status: 'signed',
        signedAt: dt(-18),
        signatureValue: 'Aria Chen',
        required: true,
        color: '#00c2a8',
      },
    ],
    fields: [],
    events: [],
  },
  {
    id: 'sig-7',
    documentId: 'doc-108',
    title: 'Scope Change Request #04 Execution',
    senderId: 'u2',
    signingOrder: 'parallel',
    status: 'completed',
    expiresAt: d(-5),
    createdAt: dt(-22),
    sentAt: dt(-22),
    completedAt: dt(-20),
    signers: [
      {
        id: 'sgn-12',
        name: 'Marcus Webb',
        email: 'marcus@flashsign.io',
        role: 'PM',
        order: 1,
        status: 'signed',
        signedAt: dt(-21),
        signatureValue: 'Marcus Webb',
        required: true,
        color: '#f59e0b',
      },
    ],
    fields: [],
    events: [],
  },
  {
    id: 'sig-8',
    documentId: 'doc-106',
    title: 'Northstar Studio Partnership Term Sheet',
    senderId: 'u1',
    signingOrder: 'sequential',
    status: 'declined',
    expiresAt: d(-1),
    message: 'Co-marketing partnership term sheet review.',
    createdAt: dt(-14),
    sentAt: dt(-14),
    signers: [
      {
        id: 'sgn-13',
        name: 'Northstar Legal',
        email: 'legal@northstarstudio.com',
        role: 'Partner Legal',
        order: 1,
        status: 'declined',
        declinedAt: dt(-11),
        declineReason: 'Need revision on revenue share percentages in section 3.2.',
        required: true,
        color: '#ef4444',
      },
    ],
    fields: [],
    events: [
      {
        id: 'ev-9',
        requestId: 'sig-8',
        eventName: 'Signer Declined Request',
        actorName: 'Northstar Legal',
        description: 'Signer requested revisions to commercial revenue split.',
        category: 'status',
        timestamp: dt(-11),
      },
    ],
  },
  {
    id: 'sig-9',
    documentId: 'doc-105',
    title: 'Vertex Security Penetration Testing Agreement',
    senderId: 'u9',
    signingOrder: 'sequential',
    status: 'draft',
    expiresAt: d(30),
    message: 'Review and execute third-party audit agreement.',
    createdAt: dt(-1),
    signers: [
      {
        id: 'sgn-14',
        name: 'David Osei',
        email: 'david@flashsign.io',
        role: 'Document Manager',
        order: 1,
        status: 'waiting',
        required: true,
        color: '#00c2a8',
      },
      {
        id: 'sgn-15',
        name: 'Sarah Connor',
        email: 'sarah@vertexsec.io',
        role: 'Principal Auditor',
        order: 2,
        status: 'waiting',
        required: true,
        color: '#8b5cf6',
      },
    ],
    fields: [],
    events: [],
  },
  {
    id: 'sig-10',
    documentId: 'doc-110',
    title: 'QA Contractor Agreement — Cypress Lead',
    senderId: 'u9',
    signingOrder: 'parallel',
    status: 'expired',
    expiresAt: d(-4), // Expired 4 days ago
    message: 'Contractor agreement for automation test runner.',
    createdAt: dt(-24),
    sentAt: dt(-24),
    signers: [
      {
        id: 'sgn-16',
        name: 'James Wilson',
        email: 'james@qa-freelance.net',
        role: 'Contractor',
        order: 1,
        status: 'pending',
        required: true,
        color: '#6b7280',
      },
    ],
    fields: [],
    events: [
      {
        id: 'ev-10',
        requestId: 'sig-10',
        eventName: 'Request Expired',
        actorName: 'Expiration Monitor',
        description: 'Simulated request exceeded 20-day validity window without completion.',
        category: 'status',
        timestamp: dt(-4),
      },
    ],
  },
  {
    id: 'sig-11',
    documentId: 'doc-113',
    title: 'Sprint 18 Handover Certificate',
    senderId: 'u2',
    signingOrder: 'parallel',
    status: 'completed',
    expiresAt: d(-12),
    createdAt: dt(-17),
    sentAt: dt(-17),
    completedAt: dt(-15),
    signers: [
      {
        id: 'sgn-17',
        name: 'Aria Chen',
        email: 'aria@flashsign.io',
        role: 'CEO',
        order: 1,
        status: 'signed',
        signedAt: dt(-15),
        signatureValue: 'Aria Chen',
        required: true,
        color: '#00c2a8',
      },
    ],
    fields: [],
    events: [],
  },
  {
    id: 'sig-12',
    documentId: 'doc-114',
    title: 'Cloudflare Edge WAF Renewal',
    senderId: 'u9',
    signingOrder: 'sequential',
    status: 'completed',
    expiresAt: d(-55),
    createdAt: dt(-72),
    sentAt: dt(-72),
    completedAt: dt(-68),
    signers: [
      {
        id: 'sgn-18',
        name: 'David Osei',
        email: 'david@flashsign.io',
        role: 'Legal Lead',
        order: 1,
        status: 'signed',
        signedAt: dt(-68),
        signatureValue: 'David Osei',
        required: true,
        color: '#00c2a8',
      },
    ],
    fields: [],
    events: [],
  },
];
