import type { TaskPriority, TaskType } from '@/types';

export interface SrsSuggestedTask {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: TaskPriority;
  status: 'todo';
  type: TaskType;
  sourceSection: string;
  isRejected: boolean;
  points: number;
  tags: string[];
}

/**
 * Returns realistic simulated SRS requirement extraction results.
 * Can tailor tasks to the source file name and project key.
 */
export function generateSuggestedTasksFromSrs(
  fileName: string,
  projectName: string,
  projectKey: string
): SrsSuggestedTask[] {
  // Flash Sign / Core e-signature platform tasks
  return [
    {
      id: `sugg-${Date.now()}-1`,
      title: 'Multi-Party Cryptographic Signature Verification',
      description:
        'Implement cryptographic verification for X.509 PKI certificates to validate document integrity and tamper evidence across multi-signer sequential workflows.',
      acceptanceCriteria:
        '1. Validates all signer signatures against CRL/OCSP revocation lists upon upload.\n2. Generates SHA-256 document checksum recorded in immutable audit log.\n3. Renders a visible tamper-evident badge if any byte in the PDF has been altered post-signing.',
      priority: 'critical',
      status: 'todo',
      type: 'story',
      sourceSection: 'SRS §3.1.4: Digital Signature Standards & Cryptographic Hashing',
      isRejected: false,
      points: 5,
      tags: ['security', 'cryptography', 'srs-generated'],
    },
    {
      id: `sugg-${Date.now()}-2`,
      title: 'HTML5 Signature Canvas Biometric Stroke & Pressure Capture',
      description:
        'Capture stroke velocity, timestamped vectors, and normalized pressure values on touch and stylus screens during handwritten signature capture for fraud mitigation.',
      acceptanceCriteria:
        '1. Captures minimum 60Hz coordinate sampling rate across touch and pointer events.\n2. Serializes stroke paths into smoothed SVG vectors with embedded velocity telemetry.\n3. Graceful fallback for standard mouse devices with synthetic velocity estimation.',
      priority: 'high',
      status: 'todo',
      type: 'task',
      sourceSection: 'SRS §4.2: Biometric Stroke Capture & Canvas Dynamics',
      isRejected: false,
      points: 3,
      tags: ['frontend', 'canvas', 'srs-generated'],
    },
    {
      id: `sugg-${Date.now()}-3`,
      title: 'Automated Multi-Channel Signer Reminder & Escalation Queue',
      description:
        'Build background notification scheduling with customizable reminder intervals (24h, 48h, 7d) and automatic manager escalation for pending signature requests.',
      acceptanceCriteria:
        '1. Document owners can toggle automated reminder cadences from the document settings.\n2. Dispatches transactional email and webhook events with secure 1-click review magic links.\n3. Signers can opt out of redundant notifications via RFC-8058 compliant unsubscribe links.',
      priority: 'medium',
      status: 'todo',
      type: 'story',
      sourceSection: 'SRS §5.3.1: Notification Workflow Engine & Reminders',
      isRejected: false,
      points: 3,
      tags: ['notifications', 'backend', 'srs-generated'],
    },
    {
      id: `sugg-${Date.now()}-4`,
      title: 'SOC 2 & HIPAA Tamper-Evident Audit Certificate PDF Appendix',
      description:
        'Automatically generate a certified, tamper-evident audit trail certificate appended as the final page of completed document packages upon final recipient signature.',
      acceptanceCriteria:
        '1. Appends standardized audit certificate including signer names, verified email, IP, and UTC timestamps.\n2. Includes company seal graphic and cryptographic QR code verifying document authenticity.\n3. Meets eIDAS, ESIGN Act, and UETA legal compliance standards.',
      priority: 'critical',
      status: 'todo',
      type: 'task',
      sourceSection: 'SRS §6.1: Audit Trail & Regulatory Compliance Reporting',
      isRejected: false,
      points: 5,
      tags: ['compliance', 'audit', 'srs-generated'],
    },
    {
      id: `sugg-${Date.now()}-5`,
      title: 'Smart Field Anchor Auto-Detection for PDF Placeholders',
      description:
        'Analyze uploaded documents for standard text tags like {{signature}}, {{date}}, and {{signer_name}} and automatically place corresponding interactive input fields.',
      acceptanceCriteria:
        '1. Scans PDF content stream for delimiter tags with configurable regex patterns.\n2. Accurately maps field coordinates with sub-2px bounding box alignment.\n3. Provides visual preview confirmation and drag-and-drop repositioning for sender override.',
      priority: 'high',
      status: 'todo',
      type: 'story',
      sourceSection: 'SRS §2.4: Dynamic Field Placement & Tag Anchoring',
      isRejected: false,
      points: 3,
      tags: ['ai-engine', 'pdf-processing', 'srs-generated'],
    },
    {
      id: `sugg-${Date.now()}-6`,
      title: 'Mobile Responsive Signer Interface with Offline State Cache',
      description:
        'Deliver a streamlined mobile signing view with touch-optimized controls and IndexedDB offline caching for contract review during intermittent network conditions.',
      acceptanceCriteria:
        '1. 100% responsive down to 320px viewport without horizontal layout breakage.\n2. Caches viewed document pages locally to allow offline reading.\n3. Queues signature submission and synchronizes immediately when connection is restored.',
      priority: 'medium',
      status: 'todo',
      type: 'task',
      sourceSection: 'SRS §7.2: Responsive Client & Mobile Offline Protocol',
      isRejected: false,
      points: 2,
      tags: ['mobile', 'offline', 'srs-generated'],
    },
  ];
}
