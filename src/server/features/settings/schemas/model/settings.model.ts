export interface SummaryLinkRecord {
  createdAt: Date;
  expiresAt: Date | null;
  id: string;
  label: string | null;
  token: string;
}
