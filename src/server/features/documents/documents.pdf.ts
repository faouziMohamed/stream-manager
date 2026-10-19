import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

/**
 * Bills and receipts, drawn server-side with pdf-lib.
 *
 * No browser and no headless print: the operator asked to send these to a
 * customer, so the bytes have to exist on the server. The layout follows the
 * KM-News document — issuer and recipient columns, a line-item table, a total,
 * and a stamp — and every label comes from `LABELS` in the customer's own
 * language, because that is who has to read it.
 */
const A4 = { height: 841.89, width: 595.28 };
const MARGIN = 50;
const RIGHT = A4.width - MARGIN;

const INK = rgb(0.08, 0.13, 0.22);
const GRAY = rgb(0.42, 0.48, 0.56);
const LINE = rgb(0.85, 0.88, 0.92);
const GREEN = rgb(0.05, 0.5, 0.3);

type Labels = {
  billedTo: string;
  date: string;
  designation: string;
  footer: string;
  from: string;
  paid: string;
  receipt: string;
  bill: string;
  subtotal: string;
  title: string;
  total: string;
};

const LABELS: Record<'en' | 'fr', Labels> = {
  en: {
    bill: 'BILL',
    billedTo: 'BILLED TO',
    date: 'ISSUED ON',
    designation: 'DESIGNATION',
    footer: 'This document is generated automatically and does not require a signature.',
    from: 'ISSUER',
    paid: 'PAID',
    receipt: 'RECEIPT',
    subtotal: 'Subtotal',
    title: 'StreamManager',
    total: 'Total',
  },
  fr: {
    bill: 'FACTURE',
    billedTo: 'FACTURÉ À',
    date: 'ÉMIS LE',
    designation: 'DÉSIGNATION',
    footer: 'Ce document est généré automatiquement et ne nécessite pas de signature.',
    from: 'ÉMETTEUR',
    paid: 'PAYÉ',
    receipt: 'REÇU',
    subtotal: 'Sous-total',
    title: 'StreamManager',
    total: 'Total',
  },
};

export type DocumentInput = {
  /** One line per payment, already described for a reader. */
  lines: { amount: number; label: string }[];
  currencyCode: string;
  customer: { email: string | null; name: string; phone: string | null };
  kind: 'bill' | 'receipt';
  language: 'en' | 'fr';
  number: string;
  issuedOn: string;
};

export async function buildDocumentPdf(input: DocumentInput): Promise<Uint8Array> {
  const labels = LABELS[input.language];
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(`${labels[input.kind]} ${input.number}`);
  pdf.setAuthor(labels.title);

  let page = pdf.addPage([A4.width, A4.height]);

  const draw = (text: string, x: number, y: number, size: number, f: PDFFont = font) =>
    page.drawText(text, { color: INK, font: f, size, x, y });

  const drawRight = (text: string, x: number, y: number, size: number, f: PDFFont = font) =>
    page.drawText(text, {
      color: INK,
      font: f,
      size,
      x: x - f.widthOfTextAtSize(text, size),
      y,
    });

  const rule = (y: number) =>
    page.drawLine({
      color: LINE,
      end: { x: RIGHT, y },
      start: { x: MARGIN, y },
      thickness: 1,
    });

  // Below this the footer lives; a row or a total placed here would collide
  // with it. Checked before drawing, not after.
  const BOTTOM = 96;
  const ROW_HEIGHT = 20;

  const drawHeader = () => {
    draw(labels.title, MARGIN, 780, 20, bold);
    drawRight(labels[input.kind], RIGHT, 782, 12, bold);
    drawRight(input.number, RIGHT, 764, 10, font);
    drawRight(`${labels.date} ${input.issuedOn}`, RIGHT, 750, 9);
    rule(736);
  };

  const drawTableHead = () => {
    draw(labels.designation, MARGIN, 622, 8, bold);
    drawRight(input.currencyCode, RIGHT, 622, 8, bold);
    rule(612);
  };

  drawHeader();
  draw(labels.from, MARGIN, 706, 8, bold);
  draw(labels.billedTo, 320, 706, 8, bold);
  draw(labels.title, MARGIN, 690, 11, bold);
  draw(input.customer.name, 320, 690, 11, bold);
  if (input.customer.email !== null) draw(input.customer.email, 320, 676, 9);
  if (input.customer.phone !== null) draw(input.customer.phone, 320, 662, 9);
  rule(640);
  drawTableHead();

  let y = 592;
  for (const line of input.lines) {
    if (y < BOTTOM) {
      // A long batch continues on a fresh page, header and column titles
      // repeated so the second sheet still says what it is.
      drawFooter(page, labels.footer, font, labels.title);
      page = pdf.addPage([A4.width, A4.height]);
      drawHeader();
      drawTableHead();
      y = 592;
    }

    draw(truncate(line.label, 58), MARGIN, y, 10);
    drawRight(formatDocumentMoney(line.amount, input.currencyCode, input.language), RIGHT, y, 10);
    y -= ROW_HEIGHT;
  }

  // Totals and stamp need room of their own; if the last row landed near the
  // footer they move to a page where they fit.
  if (y < BOTTOM + 44) {
    drawFooter(page, labels.footer, font, labels.title);
    page = pdf.addPage([A4.width, A4.height]);
    drawHeader();
    y = 700;
  }

  rule(y + 6);
  const total = input.lines.reduce((sum, line) => sum + line.amount, 0);
  draw(labels.subtotal, MARGIN, y - 10, 9);
  drawRight(formatDocumentMoney(total, input.currencyCode, input.language), RIGHT, y - 10, 9);
  draw(labels.total, MARGIN, y - 32, 12, bold);
  drawRight(
    formatDocumentMoney(total, input.currencyCode, input.language),
    RIGHT,
    y - 32,
    12,
    bold
  );

  if (input.kind === 'receipt') {
    // The stamp is the point of a receipt: it is what the customer keeps.
    const stampY = y - 78;
    page.drawRectangle({
      borderColor: GREEN,
      borderWidth: 1.5,
      height: 30,
      width: 92,
      x: MARGIN,
      y: stampY,
    });
    page.drawText(labels.paid, {
      color: GREEN,
      font: bold,
      size: 14,
      x: MARGIN + 22,
      y: stampY + 9,
    });
  }

  drawFooter(page, labels.footer, font, labels.title);
  return pdf.save();
}

function drawFooter(page: PDFPage, text: string, font: PDFFont, brand: string) {
  page.drawText(text, { color: GRAY, font, size: 8, x: MARGIN, y: 60 });
  page.drawText(brand, { color: GRAY, font, size: 8, x: MARGIN, y: 46 });
}

/** French groups with a space and writes the decimal comma; English does not. */
export function formatDocumentMoney(amount: number, code: string, language: 'en' | 'fr'): string {
  const [whole, cents] = amount.toFixed(2).split('.');

  if (language === 'fr') {
    const grouped = (whole ?? '0').replaceAll(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return `${grouped},${cents} ${code}`;
  }

  return `${whole}.${cents} ${code}`;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
