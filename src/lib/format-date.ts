/**
 * Format a date string/Date to a locale-consistent string.
 * Uses explicit locale + options to prevent SSR/CSR hydration mismatches.
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
      ...options,
    });
  } catch {
    return "";
  }
}
