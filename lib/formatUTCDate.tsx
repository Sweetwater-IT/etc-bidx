export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    // Convert the date to a Date object if it's not already
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Use UTC methods to get the components in UTC time
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
    const day = dateObj.getUTCDate();
    
    // Format as MM/DD/YYYY
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return String(date);
  }
}