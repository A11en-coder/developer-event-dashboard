Developer Event Dashboard Product Requirements Document

Version 1.0 | 26 September 2026 | Approved interview baseline

This PRD defines a small, publicly usable event analytics service as a full stack portfolio project. The release succeeds when a fresh reviewer can sign up, send an event to the public API, and see that event and request outcome in the deployed dashboard. Product behavior and release checks are specified here; implementation choices belong in the later technical requirements document.

# 1 Document control

| **Field**                | **Value**                                                       |
| ------------------------ | --------------------------------------------------------------- |
| Product                  | Developer Event Dashboard                                       |
| Owner and decision maker | Allen, solo builder                                             |
| Stakeholder              | Portfolio reviewer; representative solo developer               |
| Status                   | Four interview stages approved; implementation pending          |
| Revision                 | Initial complete PRD from approved interview, 26 September 2026 |

# 2 Executive summary

A solo developer wants to send named events from an app backend and confirm both what happened in the app and whether the analytics API accepted each request. The service offers account and project setup, one active API key per project, a public event endpoint, 30-day event and request views, concise API documentation, and clear recovery from errors. Reviewers can exercise the complete journey themselves. The first release is planned over eight weeks at about five hours each week, with a public deployment tested early and again at release.

# 3 Product vision and problem definition

## Problem and opportunity

A local demo may prove interface behavior while leaving production sign-in, credentials, API calls, and data display untested. The builder experienced local-to-production failures in the earlier FitFix project. Here the central product problem is to make a developer's first event observable together with the API outcome in a publicly working, understandable flow. The portfolio opportunity is to demonstrate API design, authentication, data separation, testing, and operational discipline through a coherent small product.

## Goals and non goals

- Goal: a fresh reviewer completes the sign-up-to-visible-event journey at the public URL, without access to the builder's local environment.
- Goal: a developer can distinguish application event activity from request success and attributable errors for each project.
- Goal: the builder can show deployed positive and negative test evidence in a portfolio walkthrough.
- Non goals: replace established analytics suites, validate commercial demand, provide team collaboration, billing, browser-side collection, or advanced analysis in the first release.

# 4 Research and evidence

Plausible documents direct event submission to an Events API and custom-event reporting in its dashboard. PostHog documents analytics insights and dashboards. These are direct category examples, not evidence of unmet demand for a new service. The proposed differentiation is a compact, inspectable reviewer journey with visible API usage and clear error feedback; that positioning is a design inference rather than a verified market gap \[1–3\].

Evidence limits: no user interviews, pricing study, market sizing, or usability test was conducted. The primary audience and priorities come from the owner's portfolio objective and approved interview decisions. Revisit broader demand only if the project changes from portfolio demonstration to a real commercial service.

# 5 Target audience

| **Segment**                              | **Job and need**                                                                                                | **Adoption role**                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Primary: solo developer with a small app | Send named backend events; verify counts, recent activity, and API outcomes. Familiar with making API requests. | Creates account, project, and key; integrates app backend.            |
| Portfolio reviewer                       | Try the deployed product quickly and assess whether the complete flow works.                                    | Signs up, uses copyable request, examines results and error behavior. |

Accessibility needs apply to both groups: usable keyboard focus, readable contrast and zoom, descriptive labels, and understandable status or error text. English is the first-release language; no additional language needs were supplied.

# 6 Product strategy

Value proposition: "Send a named event from your backend and see the event and the request outcome in one project dashboard." The product is a free public portfolio demonstration for evaluation; no paid plan or revenue target is assumed. Principles: short first-use path; project separation; observable errors; honest time windows; production behavior verified through the public URL.

| **Success measure**     | **Target and evidence**                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public journey          | One fresh test account can create a project and key, send an accepted event to the deployed API, and see it in the matching dashboard within 30 seconds after refreshing. |
| Project separation      | Two projects under one account show only their own events and linked usage.                                                                                               |
| Failure recovery        | Deployed invalid input, revoked key, and exceeded-limit checks return understandable responses; attributable rejected requests are visible to the project.                |
| Documentation usability | A reviewer can use the published example without project source code or builder assistance.                                                                               |

These are release targets, not measured baselines or evidence of market traction. No signup, retention, or commercial conversion goal is proposed.

# 7 Scope and prioritization

| **Priority** | **Capabilities and boundary**                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Must         | Public landing page and sign-up; multiple owned projects; one active key per project; show full key once; revoke and replace; accept named events from a backend; per-project 30-day counts and recent event/request activity; clear validation and errors; short API guide and example; 60 requests/minute/project; responsive dark interface; public-URL acceptance. |
| Should       | Helpful first-use empty states, copy actions, warning before key replacement, concise retention and data guidance. These are included in the planned MVP flow.                                                                                                                                                                                                         |
| Could        | Small polish improvements after core journey and safeguards pass.                                                                                                                                                                                                                                                                                                      |
| Won't in MVP | Charts, user identities, event properties, client timestamps, browser-side collection, teams and invitations, billing, SDKs, advanced segmentation, export, offline mode.                                                                                                                                                                                              |

An event in the MVP consists of a name and the service-recorded arrival time. Requests without a key that can identify a project receive an API error but do not appear in a project's usage view. Usage totals refer to the same 30-day history window and are labeled accordingly.

# 8 Functional requirements

| **ID** | **Requirement**                                                                                                                                    | **Priority / need**         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| FR-01  | A visitor can read a brief explanation and navigate to sign-up and the API guide.                                                                  | Must / reviewer orientation |
| FR-02  | A developer can create an account, sign in, sign out, and access only their own projects.                                                          | Must / ownership            |
| FR-03  | An account can create multiple named projects and switch between their separate views.                                                             | Must / separation           |
| FR-04  | A project has one active key. The full value appears only at issuance or replacement; afterward only a masked identifier appears.                  | Must / safe access          |
| FR-05  | An owner can revoke and replace a key; the revoked value stops authorizing new events.                                                             | Must / recovery             |
| FR-06  | The public API accepts a valid project key and a valid event name from a backend, records arrival time, and returns a clear success response.      | Must / ingestion            |
| FR-07  | Missing, invalid, malformed, revoked, or over-limit requests receive useful error responses; an invalid event is not counted as an accepted event. | Must / debugging            |
| FR-08  | Each project dashboard shows event counts by name and recent accepted events for the retained 30 days.                                             | Must / app activity         |
| FR-09  | Each project dashboard shows linked request total, accepted count, rejected count, and recent outcomes over 30 days.                               | Must / API health           |
| FR-10  | The public API guide documents setup, required event name, a copyable request, success and error examples, key handling, limit, and retention.     | Must / self-serve test      |
| FR-11  | The service limits event submissions to 60 requests per minute per project and identifies an exceeded limit clearly.                               | Must / public usage control |
| FR-12  | The owner can identify the selected project, its masked active-key state, and its relevant usage period on every project view.                     | Must / orientation          |

# 9 Non functional product requirements

| **ID** | **Observable outcome**                                                                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Production availability for evaluation: the landing page, sign-up, guide, dashboard, and event API are reachable at public URLs at release.                                |
| NFR-02 | An accepted event is visible in its project dashboard within 30 seconds of the API response after a page refresh. Automatic updating is not required.                      |
| NFR-03 | One project's key cannot grant dashboard access or event attribution to another project; a signed-in account cannot view another account's projects.                       |
| NFR-04 | Event and linked request history is retained for 30 days, then removed; affected counts explicitly state that window.                                                      |
| NFR-05 | The full API key appears only at creation or replacement and is never displayed again in an ordinary project view.                                                         |
| NFR-06 | Core tasks work on desktop and mobile layouts, with keyboard operation, visible focus, readable contrast, form labels, and text explanations for statuses.                 |
| NFR-07 | The first release is in English, requires a network connection, and offers no offline mode or additional localization.                                                     |
| NFR-08 | Guide and privacy copy state that the MVP is intended for named events without personal information; the landing page identifies the project as a portfolio demonstration. |
| NFR-09 | Release checks use a fresh account and public production URL, including accepted and rejected requests and two-project separation.                                         |

Browser and regional support: current desktop and mobile browsers are the intended platforms; exact support matrix and any regional legal assessment remain open before public release. No guarantee of service uptime or message delivery beyond the measured acceptance flow is implied.

# 10 User stories and acceptance criteria

## US-01 As a reviewer, I want to sign up and create a project so that I can try the product myself

Traceability: FR-01–03. Acceptance: At the public URL, a fresh account can create "My Website"; its project appears in the selector; another account cannot access it.

## US-02 As a developer, I want a key and a sample request so that I can send my first event

Traceability: FR-04, FR-06, FR-10. Acceptance: The new key is copyable once. Following the published example with that key and trial_started produces success; the secret is masked on revisit.

## US-03 As a developer, I want to see activity so that I can tell what happened in my app

Traceability: FR-08, NFR-02. Acceptance: After an accepted request, refresh within 30 seconds shows trial_started, arrival time, and a count increased by one in the right project.

## US-04 As a developer, I want request outcomes so that I can debug my integration

Traceability: FR-07, FR-09. Acceptance: A valid-key malformed event is rejected, is absent from accepted event counts, and appears as an attributable rejected request in the same project.

## US-05 As a developer, I want to replace a key so that I can stop using an exposed one

Traceability: FR-05. Acceptance: After confirmation, the old key no longer accepts events; the new key works; the interface shows the new value once.

## US-06 As a developer, I want project separation so that I can inspect each app independently

Traceability: FR-03, NFR-03. Acceptance: Send different names with two project keys; each project shows only its own events and linked request outcomes.

## US-07 As a developer, I want a clear limit response so that I can slow or fix a noisy integration

Traceability: FR-11. Acceptance: When a project crosses the agreed 60 requests/minute threshold, further requests in that window receive a distinct explanatory error.

## US-08 As a mobile reviewer, I want the same main tasks on my phone so that I can assess the demo anywhere

Traceability: NFR-06. Acceptance: Sign-up, project selection, key copy, activity reading, and key replacement remain reachable and readable at a phone-sized viewport.

Additional negative cases: missing and unrecognized keys return clear errors without creating events. A missing key cannot be assigned to a project dashboard. Retained-history removal is verified at the 30-day boundary using a suitable test setup defined in the TRD.

# 11 Information architecture and user flows

Screen map: public landing page → sign-up or sign-in → projects list and create-project state → selected project dashboard (events, request usage, key management) ↔ API guide. Sign-out returns to the public entry point. No reviewer demo account is required.

Primary flow: sign up; create "My Website"; issue and copy key; open guide; send trial_started from a backend or the copyable test request; refresh project view; inspect event count and linked success. Recovery flow: inspect a failed response and, where attributable, its request outcome; correct the input or replace a compromised key; retry. Permission failure returns the visitor to an appropriate sign-in or access message without exposing another account's data.

# 12 Content strategy

Voice: concise, factual, and developer-oriented. Prefer "event", "request", "project", "API key", "accepted", and "rejected" consistently. Avoid claims of real-time streaming or lifetime totals. Allen owns and reviews all copy. Review docs and error examples whenever public behavior changes; English only in the first release.

| **Screen**      | **Intent and message**                         | **Action / content**                                                                       |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Landing         | Explain what can be tried publicly.            | Sign up; API guide; four-step overview; portfolio-demo note.                               |
| Empty projects  | Start a first project.                         | Create project; one-line project purpose.                                                  |
| Key issuance    | Use secret now; it will not reappear.          | Copy key; next step to send example; careful-storage hint.                                 |
| Project view    | Read the selected project's 30-day activity.   | Counts, recent events and requests; guide link; clear empty states.                        |
| API guide       | Send one named event and interpret the result. | Copyable example and success/error responses; limit, retention, no-personal-data guidance. |
| Key replacement | Understand the destructive effect.             | Confirmation that the old key will immediately stop working.                               |

Privacy and support content: provide a concise notice about account data and 30-day event/request history, plus a visible contact or issue-report route before public release. Search optimization, marketing content program, images, and video are not required.

# 13 User interface and experience requirements

Visual direction: a dark developer-tool interface with a restrained accent, compact totals, legible tabular activity, clear selected-project state, and no MVP charts. Use readable sans-serif text, distinct numeric formatting, consistent spacing, and minimal animation; respect reduced-motion preference. Icons supplement text rather than carrying meaning alone.

## Text wireframes

- Landing: compact header with product name, Sign up and API guide; short value statement; four ordered steps; small portfolio-demo and retention note.
- First-use dashboard: project navigation and Create project action; explanatory empty state; after creation, key issuance panel with copy action and a direct guide link.
- Project dashboard: project selector and status; three or four 30-day count summaries; event-name counts and recent accepted events; separate recent request outcomes; masked key and replace action. On phones, navigation collapses and table records stack into labeled rows.
- Key dialog: consequence statement, cancel and confirm actions; after replacement, show the new full key once with copy feedback.
- API guide: short setup sequence, copyable request, responses, troubleshooting table, and link back to selected project.

States to design and verify: default, keyboard focus, loading, no projects, no events, no linked request history, success, input error, unauthorized request, revoked key, exceeded limit, confirmation, and disabled action. No visual mockup has been commissioned; these text wireframes are the approved UI artifact for the PRD.

Usability check: ask at least one fresh reviewer to complete the deployed first-event flow without verbal help if available; if unavailable, record that the check was not performed rather than implying validation.

# 14 Delivery plan

| **Weeks** | **Product milestone and review gate**                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–2       | Agree first-use copy and flow; make a public entry point and account/project journey available early; verify sign-in and access at the public URL.    |
| 3–4       | Complete key issuance and the first accepted public event; verify the deployed request-to-dashboard path with a fresh account.                        |
| 5–6       | Complete project-separated counts, recent events and request outcomes, validation, key replacement, API guide, retention behavior, and request limit. |
| 7–8       | Run public-URL positive and negative checks, mobile/keyboard review, documentation review, and release evidence capture; fix observed gaps.           |

Resource: one builder, approximately five hours per week for eight weeks (about 40 hours). These are planning targets, not a delivery guarantee. Allen owns scope, copy, implementation, product review, and release decision. Dependencies include working public authentication, a public API URL, persistent event and usage data, and sufficient hosting capacity; technical arrangements are deferred to the TRD.

Launch gate: a new public account can complete the main flow; two projects remain separate; revoked and invalid requests fail with clear feedback; attributable errors and 60/minute enforcement are checked; 30-day labeling and retention are verified; key masking, mobile usability, and API guide match deployed behavior. Capture the public URL and a short walkthrough for the portfolio.

# 15 Risks assumptions constraints and dependencies

| **Risk or assumption**                 | **Impact and response**                                                                                                                                     | **Owner** |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Public sign-ups and traffic            | Medium likelihood, medium impact: request limits and input checks are MVP requirements; evaluate other public-abuse protections in the TRD.                 | Allen     |
| Production behavior differs from local | High relevance from FitFix experience: deploy early and run fresh-account public-URL checks at each milestone.                                              | Allen     |
| About 40 hours may be insufficient     | Medium likelihood, high impact: keep advanced analytics out; use weekly gates and revise timing transparently rather than silently dropping release checks. | Allen     |
| Key exposure or wrong-project access   | High impact: one-time full-key display, replacement, project isolation, and negative tests are required.                                                    | Allen     |
| Audience assumption                    | The solo developer and reviewer are assumed roles, not validated market personas; seek a fresh reviewer for usability feedback if feasible.                 | Allen     |

Approved constraints: backend-origin event calls only; a 30-second refresh visibility target; 30-day history; one active key per project; 60 requests per minute per project; English, dark interface, and mobile usability. No invitation workflow is required.

# 16 Deferred to technical requirements document

Choose the authentication provider, framework, database and storage model, public API paths and exact request/response fields, credential storage and authorization implementation, rate-limit strategy (including unknown keys), retention enforcement, hosting topology, environment configuration, deployment automation, testing tools, monitoring, and whether or when Docker is useful. Product acceptance at public URLs stays mandatory regardless of these choices.

# 17 Open questions and future opportunities

- Before release, Allen should finalize supported browser versions, the privacy notice and contact route, and a feasible verification method for 30-day removal. These product details remain open, not silently approved.
- If a later release serves real developers beyond portfolio review, validate user demand, data handling needs, usage volumes, support expectations, and reliability targets with them.
- Later candidates: charts, richer event properties, browser collection with an appropriate public credential model, teams, SDKs, export, and advanced filters. Reprioritize from observed use rather than assuming all are necessary.

# 18 Approval

Owner Allen approved the interview direction for research, planning (including the eight-week change), content, and UI/UX on 26 September 2026. This document compiles those decisions. Final release approval is pending the public-URL checks in Section 14 and closure of the release questions in Section 17.

## Sources

\[1\] Plausible Events API reference: <https://plausible.io/docs/events-api>

\[2\] Plausible custom event tracking: <https://plausible.io/docs/custom-event-goals>

\[3\] PostHog creating insights: <https://posthog.com/docs/product-analytics/insights>