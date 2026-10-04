import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy and data use — Trace",
  description:
    "What Trace stores for account access, projects, API keys, events, and request history.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-12 sm:px-8 lg:px-12">
      <header className="flex h-20 items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">
            T
          </span>
          Trace
        </Link>
        <Link href="/api-guide" className="text-sm text-zinc-400 transition hover:text-white">
          API guide
        </Link>
      </header>

      <article className="max-w-3xl py-14 sm:py-18">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
          Privacy and data use
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          What Trace stores
        </h1>
        <p className="mt-5 text-sm leading-7 text-zinc-400">
          Trace is a portfolio demonstration for named backend events. Do not
          send personal information in project names, event names, or API
          requests. Names can still identify a person even though the API does
          not accept event properties or user IDs.
        </p>

        <div className="mt-10 space-y-9 text-sm leading-7 text-zinc-400">
          <section aria-labelledby="account-data">
            <h2 id="account-data" className="text-lg font-semibold text-white">
              Account and project data
            </h2>
            <p className="mt-3">
              Clerk handles sign-in and account profile information. Trace stores
              the Clerk account identifier with each project so it can enforce
              project ownership. Trace also stores project names and API-key
              metadata. API keys are stored as hashes with a display hint; the
              full key is shown only when issued or replaced.
            </p>
          </section>

          <section aria-labelledby="event-data">
            <h2 id="event-data" className="text-lg font-semibold text-white">
              Events and request outcomes
            </h2>
            <p className="mt-3">
              An accepted event stores its name and server-recorded arrival
              time. For requests that can be attributed to a project, Trace
              stores the outcome, HTTP status, and a safe error code when
              rejected. Rejected request bodies are not retained. Requests with
              a missing or unrecognized key cannot be linked to a project
              dashboard.
            </p>
          </section>

          <section aria-labelledby="history-retention">
            <h2 id="history-retention" className="text-lg font-semibold text-white">
              History and retention
            </h2>
            <p className="mt-3">
              The dashboard shows event and attributable request history for
              the past 30 days. Expired live records are scheduled for daily
              deletion; during normal operation, physical deletion may lag the
              30-day boundary by up to 25 hours.
            </p>
            <p className="mt-3">
              This period describes live event and request history. It does not
              set retention periods for Clerk account profiles, operational
              logs, or database backups; those are governed separately by their
              providers and configuration. A restored database must be cleaned
              before the service resumes.
            </p>
          </section>

          <section aria-labelledby="account-removal">
            <h2 id="account-removal" className="text-lg font-semibold text-white">
              Account and project removal
            </h2>
            <p className="mt-3">
              Trace does not currently provide self-service project or account
              deletion. Removing a Clerk account alone does not automatically
              remove its project records. Use the support page to request
              operator-assisted project-data removal.
            </p>
          </section>

          <section aria-labelledby="demo-scope">
            <h2 id="demo-scope" className="text-lg font-semibold text-white">
              Demonstration scope
            </h2>
            <p className="mt-3">
              Trace is intended for named events without personal information.
              It does not claim a compliance certification or promise a service
              uptime level.
            </p>
          </section>
        </div>

        <p className="mt-10 text-xs text-zinc-600">
          For questions or a project-data removal request, visit{" "}
          <Link href="/support" className="text-lime-200 hover:text-lime-100">
            Support
          </Link>
          .
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
