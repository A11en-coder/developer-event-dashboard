import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "API Guide — Trace",
  description:
    "Send named backend events to Trace with a project API key and understand each response.",
};

const errors = [
  {
    code: "401 UNAUTHORIZED / KEY_REVOKED",
    detail:
      "The key is missing, malformed, unknown, incorrect, or has been revoked. A revoked key is linked to the project; other invalid keys are not.",
  },
  {
    code: "400 INVALID_JSON / INVALID_PAYLOAD / INVALID_EVENT_NAME",
    detail:
      "The body is not valid JSON, has fields other than name, or the event name does not match the required format.",
  },
  {
    code: "413 PAYLOAD_TOO_LARGE / 415 UNSUPPORTED_MEDIA_TYPE",
    detail:
      "The body exceeds 1 KiB, or Content-Type is not application/json.",
  },
  {
    code: "429 RATE_LIMITED",
    detail:
      "The project has reached its rolling limit. Wait for the number of seconds in the Retry-After response header before sending more requests.",
  },
  {
    code: "503 STORAGE_UNAVAILABLE",
    detail:
      "The service could not confirm that the request was stored. Do not treat it as accepted or retry automatically: the commit may have completed before a connection was lost, and a repeated POST creates another event.",
  },
];

export default function ApiGuidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8 lg:px-12">
      <header className="flex h-20 items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-sm font-black text-zinc-950">
            T
          </span>
          Trace
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >
            Create account <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>

      <div className="max-w-3xl py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
          Public API guide
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Send your first event
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
          Send a named event from your backend. Trace records the accepted event
          and the outcome of the request under its project, so you can understand
          what the API received.
        </p>
      </div>

      <div className="space-y-12">
        <section aria-labelledby="setup-heading">
          <div className="mb-5 flex items-start gap-4">
            <span className="font-mono text-sm text-lime-300">01</span>
            <div>
              <h2 id="setup-heading" className="text-xl font-semibold text-white">
                Create a project and key
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Create an account, add a project, and issue its API key from the
                project page. The full key is shown once. Copy it when issued;
                if you lose it, replace the key and update the secret in your
                backend.
              </p>
            </div>
          </div>
          <aside className="ml-8 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm leading-6 text-amber-100/80">
            Keep the key in a server-side environment variable or secret manager.
            Never put it in browser code, a public environment variable, a URL,
            or a source-controlled file. Anyone with the key can submit events
            for its project.
          </aside>
        </section>

        <section aria-labelledby="request-heading">
          <div className="mb-5 flex items-start gap-4">
            <span className="font-mono text-sm text-lime-300">02</span>
            <div>
              <h2 id="request-heading" className="text-xl font-semibold text-white">
                Send a request
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Replace the app URL and key placeholder. This PowerShell example
                uses <code className="font-mono text-zinc-200">curl.exe</code>;
                for local development, set the URL to
                <code className="mx-1 font-mono text-zinc-200">http://localhost:3000</code>.
              </p>
            </div>
          </div>
          <pre className="ml-8 overflow-x-auto rounded-xl border border-white/10 bg-[#101211] p-5 font-mono text-xs leading-6 text-zinc-300 sm:text-sm">
            <code>{`$env:APP_URL = "https://your-app.example"
$secureKey = Read-Host "Project API key" -AsSecureString
$env:DED_API_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password

curl.exe --request POST "$env:APP_URL/api/v1/events" --header "Authorization: Bearer $env:DED_API_KEY" --header "Content-Type: application/json" --data-raw '{"name":"trial_started"}'

$env:DED_API_KEY = $null
Remove-Variable secureKey`}</code>
          </pre>
          <p className="ml-8 mt-3 text-xs leading-5 text-zinc-500">
            For production, load the key from your deployment&apos;s secret
            manager rather than entering it in a command or committing it to
            source control.
          </p>
        </section>

        <section aria-labelledby="format-heading">
          <div className="mb-5 flex items-start gap-4">
            <span className="font-mono text-sm text-lime-300">03</span>
            <div>
              <h2 id="format-heading" className="text-xl font-semibold text-white">
                Use the event format
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Send one JSON object with exactly one property, name. Names are
                case-sensitive, are not trimmed or normalized, and must start
                with an ASCII letter followed by up to 63 ASCII letters, digits,
                or underscores. For example, use
                <code className="mx-1 font-mono text-zinc-200">checkout_completed</code>
                rather than a name containing a dot. Do not include personal
                information in event names.
              </p>
            </div>
          </div>
          <div className="ml-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-lime-300/15 bg-lime-300/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-lime-200">
                Accepted
              </p>
              <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 text-zinc-300">
                <code>{`{"name":"trial_started"}`}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Rejected: extra properties
              </p>
              <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 text-zinc-400">
                <code>{`{"name":"trial_started","userId":"123"}`}</code>
              </pre>
            </div>
          </div>
        </section>

        <section aria-labelledby="response-heading">
          <div className="mb-5 flex items-start gap-4">
            <span className="font-mono text-sm text-lime-300">04</span>
            <div>
              <h2 id="response-heading" className="text-xl font-semibold text-white">
                Read the response
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                A successful submission returns HTTP 201 after the event is
                committed. The event ID and requestId are the same.
              </p>
            </div>
          </div>
          <pre className="ml-8 overflow-x-auto rounded-xl border border-white/10 bg-[#101211] p-5 font-mono text-xs leading-6 text-zinc-300 sm:text-sm">
            <code>{`{
  "event": {
    "id": "<uuid>",
    "name": "trial_started",
    "receivedAt": "2026-10-01T00:00:00.000Z"
  },
  "requestId": "<same-uuid>"
}`}</code>
          </pre>
          <p className="ml-8 mt-3 text-xs leading-5 text-zinc-500">
            Errors use an <code className="font-mono text-zinc-300">error</code>{" "}
            object with a stable code, a safe message, and a requestId. The
            response also includes the matching X-Request-Id header.
          </p>
        </section>

        <section aria-labelledby="errors-heading">
          <div className="mb-5 flex items-start gap-4">
            <span className="font-mono text-sm text-lime-300">05</span>
            <div>
              <h2 id="errors-heading" className="text-xl font-semibold text-white">
                Handle errors
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Correct the request for validation errors. For rate limits, wait
                for Retry-After. A 503 means the service could not confirm the
                outcome; if avoiding duplicates matters, check project activity
                before retrying.
              </p>
            </div>
          </div>
          <pre className="ml-8 overflow-x-auto rounded-xl border border-white/10 bg-[#101211] p-5 font-mono text-xs leading-6 text-zinc-300 sm:text-sm">
            <code>{`HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "INVALID_EVENT_NAME",
    "message": "Event name must start with a letter and contain up to 64 letters, numbers, or underscores."
  },
  "requestId": "<uuid>"
}`}</code>
          </pre>
          <p className="ml-8 mt-3 text-xs leading-5 text-zinc-500">
            A rate-limit response includes a header such as{" "}
            <code className="font-mono text-zinc-300">Retry-After: 12</code>;
            the number is the wait in seconds for that response.
          </p>
          <ul className="ml-8 divide-y divide-white/[0.07] rounded-xl border border-white/10 bg-white/[0.02] px-4 sm:px-5">
            {errors.map((error) => (
              <li key={error.code} className="py-4">
                <p className="font-mono text-xs font-semibold text-zinc-200 sm:text-sm">
                  {error.code}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {error.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="limits-heading">
          <div className="mb-5 flex items-start gap-4">
            <span className="font-mono text-sm text-lime-300">06</span>
            <div>
              <h2 id="limits-heading" className="text-xl font-semibold text-white">
                Limits, retries, and retention
              </h2>
              <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-400 marker:text-lime-300">
                <li>
                  Each project can admit up to 60 active-key attempts in any
                  rolling 60-second window, shared across its keys. Invalid
                  requests with a valid active key count toward the limit.
                </li>
                <li>
                  A 429 response is recorded but does not consume another slot.
                  Revoked-key attempts do not use the active-key quota.
                </li>
                <li>
                  Repeating a successful request creates another event. There is
                  no idempotency key or automatic deduplication. A lost response
                  can leave the result uncertain, so do not retry automatically.
                </li>
                <li>
                  The product&apos;s event and request history window is 30 days.
                  The dashboard shows retained history, and expired live
                  records are scheduled for daily cleanup with up to 25 hours
                  of normal-operation lag. Events are backend submissions
                  only; browser collection is unsupported.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16">
        <SiteFooter />
      </div>
    </main>
  );
}
