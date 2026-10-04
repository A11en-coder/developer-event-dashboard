import type { ActivitySnapshot } from "@/lib/activity-types";
import type { ReactNode } from "react";

type ProjectActivityProps = {
  snapshot: ActivitySnapshot | null;
  unavailable: boolean;
};

function formatUtc(value: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function ProjectActivity({
  snapshot,
  unavailable,
}: ProjectActivityProps) {
  if (unavailable || !snapshot) {
    return (
      <section
        aria-labelledby="activity-heading"
        className="rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-6"
      >
        <h2 id="activity-heading" className="text-lg font-semibold text-white">
          Activity unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Project activity could not be loaded. Refresh this page in a moment;
          the service has not treated the unavailable data as zero activity.
        </p>
      </section>
    );
  }

  const highestEventCount = Math.max(
    1,
    ...snapshot.eventCounts.map((event) => event.count),
  );

  return (
    <section aria-labelledby="activity-heading" className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">
            Project activity
          </p>
          <h2 id="activity-heading" className="mt-2 text-2xl font-semibold text-white">
            Past 30 days
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Window ends {formatUtc(snapshot.window.to)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Requests" value={snapshot.requests.total} />
        <SummaryCard label="Accepted" value={snapshot.requests.accepted} tone="lime" />
        <SummaryCard label="Rejected" value={snapshot.requests.rejected} tone="amber" />
        <SummaryCard label="Events" value={snapshot.events.total} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white">Events by name</h3>
          <p className="mt-1 text-xs text-zinc-400">Top event names by accepted count</p>
          {snapshot.eventCounts.length === 0 ? (
            <EmptyState>No accepted events in this 30-day window.</EmptyState>
          ) : (
            <ul className="mt-5 space-y-4">
              {snapshot.eventCounts.map((event) => (
                <li key={event.name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-mono text-zinc-300">{event.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-400">{event.count}</span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
                  >
                    <div
                      className="h-full rounded-full bg-lime-300"
                      style={{ width: `${Math.max(4, (event.count / highestEventCount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white">Recent events</h3>
          <p className="mt-1 text-xs text-zinc-400">Latest accepted event submissions</p>
          {snapshot.recentEvents.length === 0 ? (
            <EmptyState>Accepted events will appear here after your first submission.</EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {snapshot.recentEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <span className="min-w-0 truncate font-mono text-sm text-zinc-300 sm:flex-1">{event.name}</span>
                  <time
                    dateTime={event.receivedAt}
                    className="shrink-0 text-xs text-zinc-400"
                  >
                    {formatUtc(event.receivedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent requests</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Accepted and attributable rejected outcomes
              </p>
            </div>
            <p className="text-xs text-zinc-400">Times shown in UTC</p>
          </div>
          {snapshot.recentRequests.length === 0 ? (
            <EmptyState>No attributable requests in this 30-day window.</EmptyState>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {snapshot.recentRequests.map((request) => (
                <li
                  key={request.id}
                  className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${request.outcome === "ACCEPTED" ? "bg-lime-300" : "bg-amber-300"}`}
                    />
                    <span
                      className={`text-sm ${request.outcome === "ACCEPTED" ? "text-lime-200" : "text-amber-200"}`}
                    >
                      {request.outcome === "ACCEPTED" ? "Accepted" : request.errorCode ?? "Rejected"}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-zinc-400">
                    HTTP {request.httpStatus}
                  </span>
                  <time
                    dateTime={request.receivedAt}
                    className="text-xs text-zinc-400 sm:text-right"
                  >
                    {formatUtc(request.receivedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="text-xs leading-5 text-zinc-400">
        Records exactly 30 days old are outside this window. Unknown or incorrect
        keys are not attributable and do not appear here.
      </p>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "lime" | "amber";
}) {
  const valueColor =
    tone === "lime"
      ? "text-lime-200"
      : tone === "amber"
        ? "text-amber-200"
        : "text-white";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums ${valueColor}`}>
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="py-8 text-center text-sm leading-6 text-zinc-400">{children}</p>
  );
}
