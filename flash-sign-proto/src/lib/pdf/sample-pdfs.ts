/**
 * Built-in sample documents for the demo, made in the browser with pdf-lib so no files
 * need to ship with the app. The same sample id always gives the same pages.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export interface SamplePdf {
  id: string;
  title: string;
  description: string;
  pages: number;
}

interface SampleSpec extends SamplePdf {
  parties: [string, string];
  sections: { heading: string; text: string }[];
}

const SPECS: SampleSpec[] = [
  {
    id: 'nda',
    title: 'Mutual Non-Disclosure Agreement',
    description: 'Two-way NDA between Flash Technologies and a partner.',
    pages: 2,
    parties: ['Flash Technologies Ltd.', 'Partner Company'],
    sections: [
      { heading: '1. Purpose', text: 'The parties wish to explore a possible business relationship. In doing so, each party may share information that is confidential. This Agreement sets out how that information must be protected.' },
      { heading: '2. Confidential Information', text: 'Confidential Information means any business, technical or financial information shared by one party with the other, in any form, that is marked as confidential or that a reasonable person would understand to be confidential.' },
      { heading: '3. Obligations', text: 'The receiving party will use the Confidential Information only for the purpose above, will not share it with any third party without written consent, and will protect it with at least the same care it uses for its own confidential information.' },
      { heading: '4. Exclusions', text: 'These obligations do not apply to information that is already public, was known to the receiving party before disclosure, is received from a third party without restriction, or is developed independently.' },
      { heading: '5. Term', text: 'This Agreement starts on the date of the last signature and continues for two (2) years. The duty to protect Confidential Information continues for three (3) years after the Agreement ends.' },
      { heading: '6. Return of Information', text: 'On request, the receiving party will promptly return or destroy all Confidential Information and confirm this in writing.' },
      { heading: '7. Governing Law', text: 'This Agreement is governed by the laws of the jurisdiction in which Flash Technologies Ltd. is registered.' },
    ],
  },
  {
    id: 'offer',
    title: 'Employment Offer Letter',
    description: 'Job offer for a Senior Software Engineer role.',
    pages: 1,
    parties: ['Flash Technologies Ltd.', 'Candidate'],
    sections: [
      { heading: 'Position', text: 'We are pleased to offer you the position of Senior Software Engineer, reporting to the Engineering Lead. Your planned start date is the first Monday of next month.' },
      { heading: 'Compensation', text: 'Your annual base salary will be USD 96,000, paid monthly. You will also be eligible for the company bonus plan and the standard benefits package.' },
      { heading: 'Working Hours', text: 'Normal working hours are 40 hours per week, Monday to Friday, with flexible start and finish times agreed with your manager.' },
      { heading: 'Acceptance', text: 'Please sign below to accept this offer. This offer is valid for 14 days from the date of this letter.' },
    ],
  },
  {
    id: 'services',
    title: 'Master Services Agreement',
    description: 'Services contract with scope, fees and payment terms.',
    pages: 2,
    parties: ['Flash Technologies Ltd.', 'Client'],
    sections: [
      { heading: '1. Services', text: 'The Provider will deliver the software development and support services described in each Statement of Work (SOW) signed by both parties.' },
      { heading: '2. Fees and Payment', text: 'The Client will pay the fees set out in each SOW. Invoices are issued monthly and are due within thirty (30) days of the invoice date.' },
      { heading: '3. Intellectual Property', text: 'On full payment, the Client owns the deliverables created for it under a SOW. The Provider keeps ownership of its existing tools and know-how.' },
      { heading: '4. Warranties', text: 'The Provider will perform the services with reasonable skill and care, using suitably qualified staff.' },
      { heading: '5. Limitation of Liability', text: 'Neither party is liable for indirect or consequential loss. Each party\'s total liability is limited to the fees paid in the twelve (12) months before the claim.' },
      { heading: '6. Termination', text: 'Either party may end this Agreement with sixty (60) days\' written notice, or immediately if the other party seriously breaches it and does not fix the breach within thirty (30) days.' },
      { heading: '7. Entire Agreement', text: 'This Agreement and its SOWs are the whole agreement between the parties on this subject.' },
    ],
  },
];

export const SAMPLE_PDFS: SamplePdf[] = SPECS.map(({ id, title, description, pages }) => ({ id, title, description, pages }));

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 64;
const INK = rgb(0.047, 0.121, 0.133);
const MUTED = rgb(0.35, 0.43, 0.42);

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildSamplePdf(sampleId: string): Promise<Uint8Array | null> {
  const spec = SPECS.find(s => s.id === sampleId);
  if (!spec) return null;

  const doc = await PDFDocument.create();
  doc.setTitle(spec.title);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const textWidth = PAGE_W - MARGIN * 2;

  const pages: PDFPage[] = [doc.addPage([PAGE_W, PAGE_H])];
  let page = pages[0];
  let y = PAGE_H - MARGIN;

  page.drawText('FLASH TECHNOLOGIES LTD.', { x: MARGIN, y, size: 9, font: bold, color: MUTED });
  y -= 30;
  page.drawText(spec.title, { x: MARGIN, y, size: 20, font: bold, color: INK });
  y -= 22;
  page.drawText(`Between ${spec.parties[0]} and ${spec.parties[1]}`, { x: MARGIN, y, size: 10, font: regular, color: MUTED });
  y -= 30;

  // Sections are split so the sample has the stated number of pages
  const perPage = Math.ceil(spec.sections.length / spec.pages);
  spec.sections.forEach((section, i) => {
    if (i > 0 && i % perPage === 0) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      pages.push(page);
      y = PAGE_H - MARGIN;
    }
    page.drawText(section.heading, { x: MARGIN, y, size: 12, font: bold, color: INK });
    y -= 18;
    for (const line of wrap(section.text, regular, 10.5, textWidth)) {
      page.drawText(line, { x: MARGIN, y, size: 10.5, font: regular, color: INK });
      y -= 15;
    }
    y -= 14;
  });

  // Signature block at the bottom of the last page, one column per party
  const colW = textWidth / 2 - 12;
  spec.parties.forEach((party, i) => {
    const x = MARGIN + i * (colW + 24);
    let by = 190;
    page.drawText(party, { x, y: by, size: 10, font: bold, color: INK });
    by -= 48;
    page.drawLine({ start: { x, y: by }, end: { x: x + colW, y: by }, thickness: 0.8, color: MUTED });
    page.drawText('Signature', { x, y: by - 12, size: 8, font: regular, color: MUTED });
    by -= 40;
    page.drawLine({ start: { x, y: by }, end: { x: x + colW * 0.6, y: by }, thickness: 0.8, color: MUTED });
    page.drawText('Name', { x, y: by - 12, size: 8, font: regular, color: MUTED });
    page.drawLine({ start: { x: x + colW * 0.65, y: by }, end: { x: x + colW, y: by }, thickness: 0.8, color: MUTED });
    page.drawText('Date', { x: x + colW * 0.65, y: by - 12, size: 8, font: regular, color: MUTED });
  });

  pages.forEach((p, i) => {
    p.drawText(`Page ${i + 1} of ${pages.length}`, { x: PAGE_W - MARGIN - 50, y: 32, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}

/**
 * Where the sample's signature block sits on its last page, as page percentages, for each
 * party column (0 = first party, 1 = second). Used to suggest field positions.
 */
export function sampleSignatureSlots(column: 0 | 1) {
  const textWidth = PAGE_W - MARGIN * 2;
  const colW = textWidth / 2 - 12;
  const x = MARGIN + column * (colW + 24);
  const pct = (v: number, of: number) => (v / of) * 100;
  // pdf-lib y is from the bottom; fields are measured from the top
  const top = (yFromBottom: number) => pct(PAGE_H - yFromBottom, PAGE_H);
  return {
    signature: { x: pct(x, PAGE_W), y: top(142 + 34), w: pct(colW, PAGE_W), h: pct(32, PAGE_H) },
    name: { x: pct(x, PAGE_W), y: top(102 + 20), w: pct(colW * 0.6, PAGE_W), h: pct(18, PAGE_H) },
    date: { x: pct(x + colW * 0.65, PAGE_W), y: top(102 + 20), w: pct(colW * 0.35, PAGE_W), h: pct(18, PAGE_H) },
  };
}
