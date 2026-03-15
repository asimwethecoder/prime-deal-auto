// Formatting Utility Functions
// Format prices, mileage, and other values for display

/**
 * Format price in South African Rand (ZAR) with R prefix
 * Handles both number and string inputs (PostgreSQL DECIMAL returns strings)
 * Always displays as whole number with space as thousands separator
 * 
 * @param price - Price in ZAR (number or string from database)
 * @returns Formatted price string (e.g., "R290 000")
 */
export function formatPrice(price: number | string): string {
  const numericPrice = Math.round(Number(price));
  return `R${numericPrice.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
}

/** Alias for formatPrice — format value as South African Rand (ZAR). */
export const formatToZAR = formatPrice;

/**
 * Format mileage in kilometers with thousand separators
 * 
 * @param mileage - Mileage in km
 * @returns Formatted mileage string (e.g., "25,000 km")
 */
export function formatMileage(mileage: number): string {
  return `${mileage.toLocaleString('en-ZA')} km`;
}

/**
 * Format a date string to a readable format
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "15 March 2024")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a relative time string (e.g., "2 days ago")
 * 
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Capitalize first letter of each word
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
