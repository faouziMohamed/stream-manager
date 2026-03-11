import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'MAD',
): string {
  // MAD has no standard Intl symbol so we handle it manually
  if (currencyCode === 'MAD') {
    return `${amount.toFixed(2)} DH`;
  }
  try {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
