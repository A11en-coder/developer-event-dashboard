# Vercel Firewall: event-ingestion observation rule

## Decision

Use Vercel Firewall rate limiting as an upstream shared abuse control for `POST /api/v1/events`. The application's existing limit of 60 admitted active-key attempts per project per rolling minute remains in place; this rule observes requests by client IP before they reach the application and database.

The initial threshold is 600 requests per IP per 60 seconds. That is ten times the application's per-project limit and is only a starting observation threshold. It is not an enforcement decision: requests above it should be logged, not blocked. Multiple users behind one public IP can share this counter, and Vercel documents that counters are regional, so inspect real traffic before considering any enforcement threshold.

## Stage the rule

The repository is now linked to the `developer-event-dashboard` Vercel project. To avoid PowerShell JSON-argument quoting problems, open the interactive rule wizard from the repository root:

```powershell
vercel.cmd firewall rules add
```

In the wizard, configure one AND condition group with method `POST` and path exactly `/api/v1/events`. Choose action `rate_limit`, window `60` seconds, maximum `600` requests, key `ip`, and exceeded-limit action `log`. Name it `Event ingestion IP rate observation`.

Review the staged change without publishing it:

```powershell
vercel.cmd firewall diff --json
```

The `rate_limit` action with `--rate-limit-action log` records over-threshold matches without rejecting those requests. Adding the rule stages a draft. Do not publish it until the linked project and rule scope have been reviewed.

## Review and rollout

After the log-only rule has been published by the project owner, review its Firewall traffic view over representative production traffic. Confirm that the rule matches only `POST /api/v1/events`, check whether legitimate clients share IPs, and record the observed rate distribution. Keep the rule in log mode until the owner reviews that evidence and approves a separate enforcement change. Do not convert this observation threshold into a blocking limit based only on the application's per-project quota.

## Current setup status

- Rule design and staging command are documented.
- `.vercel/project.json` identifies this app's linked project as `developer-event-dashboard` (`prj_sMaHgERejKTTPJ3AeHKvqGvLYEyo`).
- The user's PowerShell has Vercel CLI 62.2.0. The CLI is unavailable in the agent shell, and its npm package fetch was denied by that environment.
- The separate `fit-fix` project was not modified.
- A draft rule was staged and reviewed on 2026-10-04: `rule_event_ingestion_ip_rate_observation_EkZKJt`. It matches method `POST` and path `/api/v1/events` in one AND group, and uses a 60-second fixed window, 600 requests per IP, with `log` as the exceeded-limit action.
- The draft has not been published, so it has not affected production and has not observed production traffic. Publishing this log-only rule would begin observation without rejecting requests; any enforcement change requires a separate review and approval.
