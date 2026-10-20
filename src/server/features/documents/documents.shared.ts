import { AppError } from '@/server/common/errors/app-error';

/**
 * Kind, customer, date and second.
 *
 * A document number has to be different each time it is issued, and nothing
 * here keeps a counter; the second-level stamp is enough to tell two batches
 * apart while staying readable and traceable to a customer and a day.
 */
export function documentNumber(kind: 'bill' | 'receipt', businessId: string, at: Date): string {
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, '0'),
    String(at.getDate()).padStart(2, '0'),
  ].join('');
  const clock = [
    String(at.getHours()).padStart(2, '0'),
    String(at.getMinutes()).padStart(2, '0'),
    String(at.getSeconds()).padStart(2, '0'),
  ].join('');

  return `${kind === 'bill' ? 'B' : 'R'}-${businessId}-${stamp}-${clock}`;
}

/**
 * The PDF's built-in fonts are WinAnsi and throw on anything outside it.
 *
 * Rather than crash mid-document (or print question marks where a customer's
 * name should be), the characters are checked first and the operator is told
 * what to fix. Moroccan names are frequently Arabic; a document that silently
 * mangles or refuses one is a support call either way, and an explicit message
 * is the honest version.
 */
export function assertPdfText(value: string, field: string) {
  // Printable WinAnsi range plus the handful of typographic marks it carries.
  const unsupported = [...value].filter((character) => {
    const code = character.codePointAt(0) ?? 0;

    return code > 0x7f && !WIN_ANSI_EXTRAS.has(code);
  });

  if (unsupported.length > 0) {
    throw new AppError(
      `The ${field} contains characters this PDF cannot render (${unsupported.slice(0, 3).join(' ')}). Use Latin script for documents.`,
      422,
      'DOCUMENT_UNRENDERABLE_TEXT'
    );
  }
}

/** WinAnsi accepts Latin-1 plus these code points above 0xFF. */
const WIN_ANSI_EXTRAS = new Set(
  [
    '20AC',
    '201A',
    '0192',
    '201E',
    '2026',
    '2020',
    '2021',
    '02C6',
    '2030',
    '0160',
    '2039',
    '0152',
    '017D',
    '2018',
    '2019',
    '201C',
    '201D',
    '2022',
    '2013',
    '2014',
    '02DC',
    '2122',
    '0161',
    '203A',
    '0153',
    '017E',
    '0178',
  ].map((hex) => Number.parseInt(hex, 16))
);

export function formatIssuedOn(date: Date, language: 'en' | 'fr'): string {
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
