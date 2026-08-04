/**
 * Format a date string/Date to a locale-consistent string in IST (Asia/Kolkata).
 * Always passes timeZone explicitly to prevent SSR/CSR hydration mismatches
 * (server may run in UTC; without timeZone the displayed time would be wrong).
 */
export function formatDate(
  dateInput: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata", // IST — always explicit to avoid server/client drift
      ...options,
    });
  } catch {
    return "";
  }
}

/**
 * Format a date+time string in IST with time included.
 */
export function formatDateTime(
  dateInput: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
      ...options,
    });
  } catch {
    return "";
  }
}
