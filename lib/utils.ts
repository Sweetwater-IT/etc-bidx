import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDailyRate(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export const formatPotentialNullToCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || value === 0) return ''
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Formats a phone number string into (123) 456-7890 format
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 0) {
    return '';
  } else if (cleaned.length <= 3) {
    return `(${cleaned}`;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
}

export const formatHoursAndMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const hourText = hours === 1 ? 'hr' : 'hrs';
  const minuteText = minutes === 1 ? 'min' : 'mins';
  
  if (hours === 0) {
    return `0 hrs ${minutes} ${minuteText}`;
  }
  
  if (minutes === 0) {
    return `${hours} ${hourText} 0 mins`;
  }
  
  return `${hours} ${hourText} ${minutes} ${minuteText}`;
};