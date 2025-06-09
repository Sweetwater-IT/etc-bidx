/**
 * Format a date consistently for display in the UI
 * This function preserves the exact date without timezone shifts
 * 
 * @param date Date object, ISO string (YYYY-MM-DD), or null/undefined
 * @returns Formatted date string as MM/DD/YYYY or empty string if no date
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    let year, month, day;
    
    // Handle ISO date strings (YYYY-MM-DD) directly to avoid timezone issues
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      // For Date objects or other string formats
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Use local date methods to avoid timezone shifts
      year = dateObj.getFullYear();
      month = dateObj.getMonth() + 1; // getMonth() is 0-indexed
      day = dateObj.getDate();
    }
    
    // Format as MM/DD/YYYY
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return String(date);
  }
}