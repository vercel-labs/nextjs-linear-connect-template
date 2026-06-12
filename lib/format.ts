/** Returns a `YYYY-MM-DD` string for today + `days` (UTC). */
export function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DueInfo = { label: string; overdue: boolean };

/**
 * Human-friendly relative label for a Linear `dueDate` (a date-only
 * `YYYY-MM-DD` string): "overdue 2d", "due today", "in 3d".
 */
export function formatDueDate(due: string | null): DueInfo | null {
  if (!due) return null;
  const now = new Date();
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const [y, m, d] = due.split("-").map(Number);
  const dueUTC = Date.UTC(y, m - 1, d);
  const days = Math.round((dueUTC - todayUTC) / 86_400_000);

  if (days < 0) return { label: `overdue ${Math.abs(days)}d`, overdue: true };
  if (days === 0) return { label: "due today", overdue: true };
  if (days === 1) return { label: "due tomorrow", overdue: false };
  return { label: `in ${days}d`, overdue: false };
}

export type SlaRisk = "breached" | "soon" | "ok";
export type SlaInfo = { label: string; risk: SlaRisk };

/**
 * Human-friendly relative label for a Linear `slaBreachesAt` (an ISO
 * datetime): "breaches in 4h" / "breached 1d ago".
 */
export function formatSla(iso: string | null): SlaInfo | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) {
    return { label: `breached ${humanizeDuration(-ms)} ago`, risk: "breached" };
  }
  return {
    label: `breaches in ${humanizeDuration(ms)}`,
    risk: ms < 24 * 3_600_000 ? "soon" : "ok",
  };
}

function humanizeDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** First-letter initials for an avatar fallback. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
