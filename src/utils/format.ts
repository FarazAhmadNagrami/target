/**
 * Indian number formatting utilities
 */

export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_00_00_000) {
      return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 1_00_000) {
      return `₹${(amount / 1_00_000).toFixed(2)} L`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `₹${(amount / 1_000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(amount));
}

export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
