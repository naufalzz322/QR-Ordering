/**
 * Centralized configuration for QR Table Ordering System
 * Use these values instead of hardcoding outlet slug or app URL
 */

export const config = {
  /**
   * Outlet slug - used in URLs and API calls
   * Fallback: 'warung-nusantara-sby' for development
   */
  outletSlug: process.env.NEXT_PUBLIC_OUTLET_SLUG || 'warung-nusantara-sby',

  /**
   * Application base URL - used for QR code generation
   * Fallback: 'http://localhost:3000' for development
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

/**
 * Generate full menu URL for a table
 */
export function getMenuUrl(tableToken?: string): string {
  const base = `${config.appUrl}/m/${config.outletSlug}`
  return tableToken ? `${base}/${tableToken}` : base
}

/**
 * Generate kitchen display URL
 */
export function getKitchenUrl(): string {
  return `${config.appUrl}/kitchen/${config.outletSlug}`
}

/**
 * Generate admin URL
 */
export function getAdminUrl(path?: string): string {
  return `${config.appUrl}/admin${path || ''}`
}
