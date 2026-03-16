// WhatsApp Link Generator Utility
// Generates wa.me links with prefilled messages for car enquiries

import { formatPrice } from './utils/format';

export const WHATSAPP_PHONE = '27732144072';

interface CarInfo {
  year: number;
  make: string;
  model: string;
  variant?: string;
  price: number;
}

/**
 * Generate a WhatsApp link with prefilled message for a car enquiry
 */
export function generateWhatsAppLink(car: CarInfo): string {
  const carName = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ''}`;
  const message = `Hi, I'm interested in the ${carName} listed at ${formatPrice(car.price)}. Is it still available?`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
}

/**
 * Generate a simple WhatsApp link without prefilled message
 */
export function getWhatsAppLink(): string {
  return `https://wa.me/${WHATSAPP_PHONE}`;
}

/**
 * Generate a tel: link for phone calls
 */
export function getPhoneLink(): string {
  return `tel:+${WHATSAPP_PHONE}`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(): string {
  return '+27 73 214 4072';
}
