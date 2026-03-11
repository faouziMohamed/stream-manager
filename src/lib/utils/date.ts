/**
 * Centralised date utilities — all date handling goes through dayjs.
 * Import from here, never from dayjs directly, so we can swap the lib if needed.
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("fr");

export { dayjs };

// ── Formatters ────────────────────────────────────────────────────────────────

/** "21 mars 2026" */
export const formatDate = (d: string | Date | null | undefined): string => {
  if (!d) return "—";
  return dayjs(d).format("D MMMM YYYY");
};

/** "21/03/2026" */
export const formatDateShort = (
  d: string | Date | null | undefined,
): string => {
  if (!d) return "—";
  return dayjs(d).format("DD/MM/YYYY");
};

/** "21 mars 2026 à 11:30" */
export const formatDateTime = (d: string | Date | null | undefined): string => {
  if (!d) return "—";
  return dayjs(d).format("D MMMM YYYY [à] HH:mm");
};

/** "il y a 3 jours" */
export const formatRelative = (d: string | Date | null | undefined): string => {
  if (!d) return "—";
  return dayjs(d).fromNow();
};

/** Returns YYYY-MM-DD for use in DB / GraphQL */
export const toISODate = (d: Date): string => dayjs(d).format("YYYY-MM-DD");

/** Returns full ISO 8601 string for GraphQL DateTime scalar */
export const toISODateTime = (d: Date | string): string => {
  const parsed = dayjs(d);
  if (!parsed.isValid()) throw new Error(`Invalid date: ${d}`);
  return parsed.toISOString();
};

/**
 * Normalize a datetime-local input value ("YYYY-MM-DDTHH:mm") to a full
 * ISO 8601 string ("YYYY-MM-DDTHH:mm:ss.sssZ") accepted by GraphQL DateTime.
 */
export const normalizeLocalDatetime = (
  v: string | undefined | null,
): string | undefined => {
  if (!v) return undefined;
  return dayjs(v).toISOString();
};

/** Today's date as YYYY-MM-DD string */
export const todayISO = (): string => dayjs().format("YYYY-MM-DD");
