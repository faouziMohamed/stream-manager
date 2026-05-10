type Plan = {
  id: string;
  durationMonths: number;
  price: string | number;
  currencyCode: string;
};

type ServiceItem = { id: string; name: string; logoUrl?: string | null };

type Promo = {
  id: string;
  name: string;
  description?: string | null;
  expiresAt?: Date | string | null;
  services: ServiceItem[];
  plans: Plan[];
};

export type { Plan, Promo, ServiceItem };
