import type { LinearIssue } from "@/lib/linear";
import { formatDueDate, formatSla, initials, type SlaRisk } from "@/lib/format";

export type IssueRowMode = "due" | "sla" | "plain";

export function IssueRow({
  issue,
  mode,
}: {
  issue: LinearIssue;
  mode: IssueRowMode;
}) {
  const due = formatDueDate(issue.dueDate);
  const sla = formatSla(issue.slaBreachesAt);

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-800/40"
    >
      <span className="w-16 shrink-0 truncate font-mono text-xs text-neutral-500">
        {issue.identifier}
      </span>

      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: issue.state?.color ?? "#6b7280" }}
        title={issue.state?.name ?? undefined}
      />

      <span className="flex-1 truncate text-sm text-neutral-200">
        {issue.title}
      </span>

      {mode === "sla" && sla ? <SlaBadge label={sla.label} risk={sla.risk} /> : null}
      {mode !== "sla" && due ? (
        <DueBadge label={due.label} overdue={due.overdue} />
      ) : null}

      {issue.assignee ? <Avatar assignee={issue.assignee} /> : null}
    </a>
  );
}

function DueBadge({ label, overdue }: { label: string; overdue: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${
        overdue
          ? "bg-red-950/60 text-red-300"
          : "bg-neutral-800 text-neutral-400"
      }`}
    >
      {label}
    </span>
  );
}

const SLA_STYLES: Record<SlaRisk, string> = {
  breached: "bg-red-950/60 text-red-300",
  soon: "bg-amber-950/60 text-amber-300",
  ok: "bg-neutral-800 text-neutral-400",
};

function SlaBadge({ label, risk }: { label: string; risk: SlaRisk }) {
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${SLA_STYLES[risk]}`}
    >
      {label}
    </span>
  );
}

function Avatar({
  assignee,
}: {
  assignee: { name: string; avatarUrl: string | null };
}) {
  if (assignee.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- avatars are arbitrary external URLs
    return (
      <img
        src={assignee.avatarUrl}
        alt={assignee.name}
        title={assignee.name}
        className="h-6 w-6 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      title={assignee.name}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-medium text-neutral-200"
    >
      {initials(assignee.name)}
    </span>
  );
}
