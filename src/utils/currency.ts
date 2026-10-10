/**
 * Currency and Location Utilities for Kathmandu, Nepal (NRs. / Nepalese Rupees)
 */

export const CURRENCY_SYMBOL = 'NRs.';
export const LOCATION_NAME = 'Kathmandu, Nepal';

/**
 * Format a number into Nepalese Rupee string (e.g., NRs. 28,000)
 */
export function formatNRS(amount: number, includeDecimals = false): string {
  if (isNaN(amount)) return 'NRs. 0';
  if (includeDecimals) {
    return `NRs. ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `NRs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Compact format for chart axes (e.g., NRs. 85k)
 */
export function formatCompactNRS(amount: number): string {
  if (amount >= 100000) {
    return `NRs. ${(amount / 100000).toFixed(1)}L`; // Lakhs in Nepal
  }
  if (amount >= 1000) {
    return `NRs. ${(amount / 1000).toFixed(0)}k`;
  }
  return `NRs. ${amount}`;
}
