/**
 * Timezone utilities targeting Asia/Kolkata (IST)
 */

export const TIMEZONE = "Asia/Kolkata";

/**
 * Returns the current date formatted as YYYY-MM-DD in Asia/Kolkata timezone.
 */
export function getFormattedTodayDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // Output format: YYYY-MM-DD
}

/**
 * Formats a date object to a localized string in Asia/Kolkata.
 */
export function formatKolkataDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Formats time only in Asia/Kolkata.
 */
export function formatKolkataTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}
