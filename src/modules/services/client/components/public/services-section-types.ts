export type Plan = {
  id: string;
  durationMonths: number;
  price: string | number;
  currencyCode: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  logoUrl?: string | null;
  plans: Plan[];
};
