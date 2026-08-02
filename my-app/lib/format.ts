// lib/format.ts
//
// Shared date helpers. Used by both the Server Component that renders the list
// and the Client Components that edit it, so they can't drift apart.
 
/** "12 Aug 2026" — what the user reads. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
 
/**
 * "2026-08-12" — what <input type="date"> expects.
 *
 * Deliberately NOT date.toISOString().slice(0, 10): toISOString converts to UTC
 * first, so a date stored at 23:59 local time can come back as the *next* day.
 * Reading the local parts avoids that.
 */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}