import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind's merge for cleaner class combinations
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a date in a readable format
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats ISO date strings from the API to a readable format
 */
export function formatAPIDate(dateString: string | undefined): string {
  if (!dateString) return '';
  return formatDate(dateString);
}

/**
 * Trims and formats expansion names if too long
 */
export function formatExpansionName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
}

/**
 * Trims and formats Pokémon names if too long
 */
export function formatPokemonName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name;
  
  // If the name contains spaces, try to abbreviate parts after the main name
  const parts = name.split(' ');
  if (parts.length > 1) {
    const mainName = parts[0];
    const rest = parts.slice(1).map(p => p.charAt(0)).join('.');
    const abbreviated = `${mainName} ${rest}`;
    
    if (abbreviated.length <= maxLength) {
      return abbreviated;
    }
  }
  
  return name.substring(0, maxLength) + '...';
}

/**
 * Gets a proper slug from an expansion ID or name
 */
export function getExpansionSlug(expansionId: string | undefined): string {
  if (!expansionId) return '';
  
  // Remove any special characters and convert to lowercase
  return expansionId.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}