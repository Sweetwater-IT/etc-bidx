/**
 * Converts a Date object to a local YYYY-MM-DD string without timezone conversion
 * This prevents dates from shifting due to UTC conversion
 */
export function dateToLocalDateString(date: Date): string {
  if (!date || !(date instanceof Date)) {
    return ""
  }

  try {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("[v0] Error converting date to local string:", error)
    return ""
  }
}

/**
 * Converts a YYYY-MM-DD string to a local Date object
 * This ensures the date stays in the user's timezone
 */
export function localDateStringToDate(dateStr: string): Date {
  if (!dateStr) {
    return new Date()
  }

  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  } catch (error) {
    console.error("[v0] Error parsing local date string:", error)
    return new Date()
  }
}

/**
 * Safely compares two dates in YYYY-MM-DD format
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDateStrings(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) {
    return 0
  }

  try {
    if (dateStr1 < dateStr2) return -1
    if (dateStr1 > dateStr2) return 1
    return 0
  } catch (error) {
    console.error("[v0] Error comparing date strings:", error)
    return 0
  }
}