/* Non-component helpers for the admin — class-name joining and date
   formatting. Kept out of ui.tsx so that file exports only components,
   which keeps Vite's Fast Refresh working during development. */

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

// Bookings' created_at is ISO from Postgres; preferred_date is a plain date.
// Parse both without tripping over Safari's stricter Date handling.
function toDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) return new Date(`${value.replace(" ", "T")}Z`);
  return new Date(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = toDate(value);
  return isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = toDate(value);
  return isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}
