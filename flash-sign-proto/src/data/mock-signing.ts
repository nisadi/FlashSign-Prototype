import type { CompanySeal, SigningDefaults } from '@/types';

// Flash Sign's own defaults: reminders every 2 days, expiry after 120 days.
export const DEFAULT_SIGNING_DEFAULTS: SigningDefaults = {
  expireDays: 120,
  reminderFrequency: 'every_2_days',
  signingOrder: 'sequential',
  emailSubject: 'Please sign: {{document}}',
  message: 'Please review and sign the attached agreement.',
  allowedSignatureMethods: ['type', 'draw', 'upload'],
  expiryWarningDays: 3,
};

// A round stamp drawn as SVG so the demo needs no image file.
function sealSvg(org: string, center: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs><path id="arc" d="M 30 100 A 70 70 0 1 1 170 100"/></defs>
  <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="6"/>
  <circle cx="100" cy="100" r="78" fill="none" stroke="${color}" stroke-width="2"/>
  <text font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${color}" letter-spacing="3">
    <textPath href="#arc" startOffset="50%" text-anchor="middle">${org}</textPath>
  </text>
  <text x="100" y="108" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="${color}" text-anchor="middle">${center}</text>
  <text x="100" y="138" font-family="Arial, sans-serif" font-size="22" fill="${color}" text-anchor="middle">&#9733;</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MOCK_COMPANY_SEALS: CompanySeal[] = [
  {
    id: 'seal-1',
    name: 'Official Company Seal',
    description: 'For contracts, statements of work and other binding agreements.',
    image: sealSvg('ACME DIGITAL LTD', 'APPROVED', '#1c5cab'),
    allowedRoles: ['ceo', 'document_manager'],
    isActive: true,
    createdBy: 'u1',
    createdAt: '2026-09-02T10:00:00.000Z',
    usageCount: 12,
    lastUsedAt: '2026-10-19T14:20:00.000Z',
  },
  {
    id: 'seal-2',
    name: 'Finance Department Stamp',
    description: 'Invoices and payment approvals only.',
    image: sealSvg('ACME DIGITAL FINANCE', 'PAID', '#b42318'),
    allowedRoles: ['ceo'],
    isActive: false,
    createdBy: 'u1',
    createdAt: '2026-09-15T09:00:00.000Z',
    usageCount: 3,
  },
];
