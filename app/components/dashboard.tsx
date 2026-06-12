import type { DashboardData, LinearViewer } from "@/lib/linear";
import { initials } from "@/lib/format";
import { Footer } from "./footer";
import { IssueRow } from "./issue-row";
import { Panel } from "./panel";

export function Dashboard({
  data,
  justConnected,
}: {
  data: DashboardData;
  justConnected: boolean;
}) {
  const { viewer, dueSoon, slaAtRisk, assigned, teams } = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Header viewer={viewer} />

      {justConnected ? (
        <p className="mt-5 rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          ✓ Linear connected. These panels are live data from your workspace.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Panel
          title="Due soon / Overdue"
          subtitle="Open issues due in the next 14 days"
          count={dueSoon.length}
          empty="Nothing due in the next two weeks. 🎉"
        >
          {dueSoon.map((issue) => (
            <IssueRow key={issue.id} issue={issue} mode="due" />
          ))}
        </Panel>

        <Panel
          title="SLA at risk"
          subtitle="Breached, high & medium risk"
          count={slaAtRisk.length}
          empty="No issues at SLA risk — or SLA isn't configured for this workspace. Linear SLAs require the Business plan and per-team setup."
        >
          {slaAtRisk.map((issue) => (
            <IssueRow key={issue.id} issue={issue} mode="sla" />
          ))}
        </Panel>

        <Panel
          title="Assigned to me"
          subtitle="Your active issues"
          count={assigned.length}
          empty="No active issues assigned to you."
        >
          {assigned.map((issue) => (
            <IssueRow key={issue.id} issue={issue} mode="plain" />
          ))}
        </Panel>

        <Panel
          title="Teams"
          subtitle="Teams in this workspace"
          count={teams.length}
          empty="No teams found."
        >
          <div className="flex flex-wrap gap-2 p-4">
            {teams.map((team) => (
              <span
                key={team.id}
                className="rounded-md border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-xs"
              >
                <span className="font-mono text-neutral-400">{team.key}</span>
                <span className="ml-1.5 text-neutral-200">{team.name}</span>
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <Footer />
    </main>
  );
}

function Header({ viewer }: { viewer: LinearViewer }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {viewer.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar is an arbitrary external URL
          <img
            src={viewer.avatarUrl}
            alt={viewer.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium text-neutral-200">
            {initials(viewer.name)}
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full bg-emerald-400"
              title="Connected"
            />
            <h1 className="text-lg font-semibold tracking-tight">
              {viewer.organization.name}
            </h1>
          </div>
          <p className="text-sm text-neutral-400">
            Connected as {viewer.name} · {viewer.email}
          </p>
        </div>
      </div>

      <form action="/api/linear/disconnect" method="post">
        <button
          type="submit"
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-800"
        >
          Disconnect
        </button>
      </form>
    </header>
  );
}
