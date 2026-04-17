export function parseDateInput(date: Date | string | null | undefined): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const trimmedValue = date.trim();
  if (!trimmedValue || trimmedValue === "-") {
    return null;
  }

  const isoDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const dayMonthYearMatch = trimmedValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dayMonthYearMatch) {
    const [, day, month, year] = dayMonthYearMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const parsed = new Date(trimmedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toISODateString(date: Date | string | null | undefined): string {
  const dateObj = parseDateInput(date);
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return "";
  }

  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth() + 1;
  const day = dateObj.getUTCDate();

  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  const dateObj = parseDateInput(date);
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return "";
  }

  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth() + 1;
  const day = dateObj.getUTCDate();

  return `${day.toString().padStart(2, "0")}-${month.toString().padStart(2, "0")}-${year}`;
}
