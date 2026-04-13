export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj =
      date instanceof Date
        ? date
        : typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? new Date(`${date}T00:00:00Z`)
          : new Date(date);
    
    // Use UTC methods to get the components in UTC time
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
    const day = dateObj.getUTCDate();
    
    // Format as DD-MM-YYYY
    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return String(date);
  }
}
