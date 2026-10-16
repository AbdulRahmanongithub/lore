# Output templates for `.lore/`

One file per concern, stable filenames, stable headings. Stable names are what make the
folder greppable: an agent that has seen one `.lore/` knows where to look in all of them.

Keep a file even when it's thin — write `Not applicable: internal tool, no monetization
[inferred ⚠]` rather than deleting `04-money.md`. A missing file reads as "not
investigated," which is exactly the ambiguity the provenance tags exist to kill.

Every line carries a provenance tag: `[code: path:line]`, `[config: path]`,
`[docs: path]`, `[web: url]`, `[db]`, `[user]`, `[inferred ⚠]`.

Cross-reference by stable ID rather than by prose: rules are `R-<n>`, flows `F-<n>`,
landmines `L-<n>`, open questions `Q-<n>`. An agent asked to change one thing greps the
ID and finds every place it matters.

Header every file with:

```
lore v1 · Generated: {date} · Source: {repo}@{sha} · Mode: {full|quick|update}
Confidence: confirmed {n} · inferred {n} · open questions {n}
```

---

## `index.md`

Written last, once the real counts are known. This is the file a human opens to judge
whether the run was any good.

```markdown
# Lore index — {project}

lore v1 · Generated: {date} · Source: {repo}@{sha} · DB access: {granted/denied}

## What this system is
Three sentences. No more.

## The five things an agent must not get wrong
Numbered, each linking to the file that explains it.

## Files
| File | Covers | Confidence |
|---|---|---|
| 01-business.md | purpose, glossary, cycles | confirmed / partial |
| ... | | |

## Coverage
Read {n} of {m} source files in full; {k} skimmed, {j} skipped — see coverage.md
confirmed {n} · inferred {n} · open questions {n}
Weakest areas: {which files are thinnest and why}

## Run stats
Mode · shards · date · files read (full / template diff / skimmed / skipped) · bytes of
source · estimated tokens processed vs the range given beforehand · wall time · likely
cost of the next update. Label measured vs estimated. See `budget.md` §5.

## How to use this folder for a change
"Add X to screen Y" → 15-change-map.md finds the files → 13-flows.md shows the path →
03-rules.md and 12-landmines.md say what must not break.
```

---

## `coverage.md`

The ledger from `deep-read.md` §1 — one row per source file in the inventory: file ·
kind · read (full / template diff / skimmed / skipped) · lines · blob hash · extracted
to. Skimmed and skipped rows
carry the reason. Sort by folder so a reader can see at a glance which areas were read in
full.

---

## `01-business.md`

* **Category:**
* **Problem solved:**
* **Who pays, who uses:** often different people — say so when they are
* **End-to-end flow:** numbered happy path, start to finish
* **Business cycles:** fiscal year, month-end, academic term, billing period
* **Domain glossary:** term → precise meaning here → the code symbol representing it.
  Prioritise terms whose everyday meaning differs from the meaning in this system;
  those are the ones that cause an agent to write plausible, wrong code.

## `02-roles.md`

Start with the **shape** of the access model in one or two sentences — "access is role ×
region-scope × approval-level, all resolved at sign-in into claims" — before any list of
roles. A reader who gets only that sentence understands more than a role list can teach
them. See `access-model.md`; scope and level normally are not declared as permissions and
have to be found in query filters and threshold logic.

* **Sign-in, step by step:** the real sequence from the login screen to an
  authenticated request — form or provider, the endpoint it posts to, how the password is
  checked (hash algorithm and library), what is issued (cookie, JWT, session row), its
  lifetime and refresh, where the client stores it, how every later request presents it,
  and how sign-out and expiry work. Include sign-up, password reset, email verification,
  MFA, SSO/OAuth providers, API keys and service accounts where they exist. For each
  step, what happens on failure: wrong password, locked account, expired token, unverified
  email — the status, the message, and whether attempts are counted or rate-limited.
* **Auth mechanism:** cookie, JWT, SSO, provider, session lifetime
* **Model shape:** the dimensions in play, and how they compose (inheritance, hierarchy,
  conflicts, bypasses)
* **Scope dimension:** where records get filtered by a user attribute, and what escapes it
* **Level dimension:** grades, thresholds, and what each unlocks
* **Role-based:** yes/no · where roles are defined
* **Roles:** each with purpose, how it is granted, what only it can do.
  Super Admin gets its own subsection — list every bypass and override it holds.
* **URL access matrix:** `/path` · verb · roles · notes
* **Action-level permissions:** the rules that are not URL-shaped
  ("an Approver cannot approve a request they raised" `[code: ...]`)

## `03-rules.md` ← the most important file

Every rule gets a stable ID (`R-14`) and, where it has a condition, a **decision
table** stating every outcome, including the false branch and the edge that crashes —
see `deep-read.md` §5. A rule written as a sentence hides what happens when it does not
hold, and that is the half a developer needs.

* **Invariants:** rule · why · enforced at · what breaks if violated
* **State machines:** per entity — states, allowed transitions, trigger, actor, side
  effects. State an illegal transition explicitly; an agent needs to know what must
  never happen, not only what may. Keep each machine whole in this file — never split
  one across files.
* **Calculations:** every formula — tax, discount, pro-rating, interest, fees — with
  rounding mode and a worked example. Rounding mode matters: `AwayFromZero` and
  `ToEven` differ on real invoices.
* **Validation rules:** field-level and cross-field
* **Temporal rules:** deadlines, cut-offs, retention, auto-expiry, SLA timers
* **Edge cases handled deliberately:** the weird branches and what motivated them

## `04-money.md`

* **Model:** subscription / one-time / usage / free / internal
* **Plans, tiers, limits**
* **Payment gateways:** provider, mode (test/live), webhook endpoints, idempotency
* **Money handling:** currency, decimal precision, rounding, tax treatment
* **Refunds, cancellations, dunning, failed payments**
* **Financial audit trail:** what is logged and where

## `05-architecture.md`

* **Architecture:** pattern, layers, module boundaries, request lifecycle, **and where
  the code deviates from the stated pattern** — the deviation is what trips agents up
* **Components:** for a polyglot system, one row per component —
  name · language/runtime · responsibility · how it talks to the others · repo path
* **Connectivity map:** browser → API → services → stores → side channels, each hop
  with protocol, auth and where it is configured (`deep-read.md` §3). Anything that
  reaches the database without going through the application is called out.
* **Core stack:** language/runtime/framework **with exact versions** and where each was
  read; EOL flags with date and source (`deep-read.md` §6)
* **Database and infrastructure engines:** engine and version for every store, broker
  and cache
* **Packages:** name · declared · resolved (from the lockfile) · purpose · licence (flag
  non-permissive). Every direct dependency, not a highlight reel.
* **Data layer:** store type(s), ORM/driver, migration strategy, caching, transaction
  boundaries
* **Conventions:** naming, folder layout, error handling, logging, DI, async style —
  what an agent must imitate to make its code look native here

## `06-data-model.md`

Written from the table outward — `data-first.md` has the detail.

* **Every table:** purpose · written by · read by · reacts (triggers, polling services,
  jobs) · shown in · **data origin** — including `Source: unknown [user]` when the user
  was asked and did not know
* **CRUD matrix:** tables × every writer and reader (screens, endpoints, SPs, jobs,
  services, triggers, external systems)
* **Flag, status and date catalogue:** every column that changes behaviour — values and
  meaning · set by · checked by · effect. Every one, not the interesting ones.
* **Stored procedures, functions, views, triggers:** called by · inputs · reads · rules
  (by `R-` ID) · writes · transaction · calls · errors raised. Dynamic SQL, cursors,
  cross-database and linked-server calls flagged.
* **Entities:** purpose, key fields, relationships
* **Enums and lookups:** full contents with meanings, and for each value whether any
  code path sets it — an unreachable value means a removed feature or manual DB edits
* **Soft deletes, audit columns, multi-tenancy discriminators**
* **Code ↔ DB drift:** if the DB pass ran

## `07-integrations.md`

* **Internal API catalogue:** every endpoint — verb · path · handler `file:line` ·
  auth and role/scope check · request shape · response shape · error statuses · which
  screen or caller uses it. Group by resource; the full list, not samples (P1a).
* **API conventions:** versioning, pagination, error envelope, idempotency keys
* **External — paid:** service · SDK and version · purpose · plan or tier if configured ·
  **what triggers a billable call** · volume multipliers (loops, retries, polling, crons)
  · caching · unit price only with a source and date · failure behaviour. See
  `deep-read.md` §7 — never a price from memory.
* **External — free/open:** same, minus the cost columns
* **Webhooks:** inbound and outbound, signature verification, retry policy
* **Failure handling:** what happens when each integration is down

## `08-jobs.md`

Job · schedule · what it does · what breaks if it does not run · idempotent? ·
observable where? · called from the app or only by cron?

That last column earns its place: a job nothing in the app calls is invisible to an
agent reading the code it's editing, and those are the jobs that delete things.

## `09-infra.md`

* **Environments:** dev / staging / prod URLs, who can reach them
* **Config structure:** where connection strings and credentials live per environment —
  locations only, values `[REDACTED]`
* **CI/CD:** platform · trigger conditions · stages in order · test and lint gates ·
  build artifacts · **how migrations are applied** · approval gates · secret injection
  mechanism (names only) · rollback procedure · who can deploy.
  If deployment is manual, say exactly how — that constrains every change an agent
  proposes, and inventing a pipeline is worse than admitting there isn't one.
* **Containers & IaC:** Docker/compose/Helm/K8s, Terraform/Pulumi/CloudFormation/Bicep/Ansible
* **Branching & release:** branch model, versioning, cadence, hotfix path
* **Observability:** metrics and alerting. Logs and error tracking live in
  `14-errors.md`, with how to read them.

## `10-security.md`

* Posture: CAPTCHA, rate limiting, CSRF, CORS, headers, file uploads, PII, encryption
* **🚨 Findings table:** severity · file:line · issue · remediation. Hardcoded secrets
  first. Do not bury a committed live key among style notes.

## `11-open-questions.md`

Numbered. Every `[inferred ⚠]` never confirmed, plus what an answer would change.

**This file existing is a feature.** Never pad it away by resolving entries with
guesses. An agent that knows what is unknown asks; an agent handed a confident wrong
answer ships it.

## `12-landmines.md`

* Code that looks wrong but is deliberate, and why
* Tables, endpoints or files that must not be touched directly, and what depends on them
* Known tech debt with blast radius
* "Last person who changed X broke Y"
* Silent failures — swallowed exceptions, fire-and-forget calls with no retry, partial
  writes outside a transaction (`errors-and-logs.md` §3)
* Cost traps — unbounded retries or polling against a paid API

## `13-flows.md`

One section per user action that writes, moves money, sits behind a permission, or is a
main read path — `deep-read.md` §4 has the exact shape. Each flow, with a stable ID
(`F-7`):

* **Who** can do it, with the role/scope/level check that gates it
* **UI → request → handler → service → writes → side effects → response**, each hop with
  `file:line`
* **Failure branches:** a table of every decision point's false branch and every external
  call's failure — status, message, what state is left behind, what is logged
* A Mermaid `sequenceDiagram` where the path is long or branches heavily

For a system with no UI, a flow starts at whatever arrives — a message, a file, a call, a
schedule.

## `14-errors.md`

`errors-and-logs.md` has the detail. In this order:

* **Logging:** library and version, sinks, levels per environment, structure,
  correlation IDs, what is scrubbed
* **How to read the logs:** commands and locations per environment, from this repo
* **Error tracking:** service and project, key names only
* **Custom error types:** type · base · raised where · meaning · status · what the user
  sees
* **Error code catalogue**, in full, if one exists
* **Global handler and response envelope**, with one real example
* **Front-end error handling:** interceptors, toasts, redirects, retries
* **Failure behaviour:** retries, timeouts, transactions, fallbacks, dead letters
* **When X breaks, look here:** symptom · likely cause · look at · evidence

## `15-change-map.md` — where everything is

The index a developer uses to turn "add a column to the first tab of Advanced
Settlement" into a file list without asking anyone. One entry per screen (or endpoint,
for systems without UI), named the way **users and the UI** name it — the menu label,
the page title, the tab caption — with the code name alongside:

```
### Advanced Settlement  (route /finance/settlement/:id · SettlementPage)
Menu:        Finance › Settlements › open one › "Advanced"   [code: nav.ts:44]
Tabs:        1 Adjustments — AdjustmentsTab.tsx
             2 Deductions  — DeductionsTab.tsx
             3 History     — HistoryTab.tsx (read-only)
Form/schema: adjustmentSchema (zod)          [code: schemas/settlement.ts:12]
API:         GET/PUT /api/settlements/{id}/adjustments   → F-12
Server:      settle.py:118 → SettlementService.apply_adjustment
Validation:  client schemas/settlement.ts:12 · server AdjustmentIn settle.py:20
Access:      finance, level ≥ 2, own branch  [code: settle.py:117,124]
Data:        settlement_adjustments, settlements.net_amount  [code: models.py:210]
Migrations:  alembic, autogenerate, applied on deploy   [config: Procfile:1]
Tests:       tests/api/test_settlement.py (12 tests)
Rules:       R-14, R-15 · Landmines: L-3
To add a field here, touch: model + migration → AdjustmentIn/Out → service →
  settlements.ts types → adjustmentSchema → AdjustmentsTab.tsx → tests
```

That last line — the ordered list of layers a new field must pass through, derived from
how existing fields are wired — is the most reused line in the whole folder.

## `16-diagnostics.md` — from symptom to the row that explains it

One section per failure a user or support desk will report — "cannot log in", "order
stuck in Processing", "report shows zero", "service stopped picking up files". For each,
the possible causes **in the order the code checks them**, each with:

* the condition, cited (`[code: usp_Login.sql:31]`)
* a **read-only query** or check that confirms it, using this system's real tables and
  columns
* what the user sees (and whether several causes show the same message — a landmine)
* the fix: which screen, which admin action, or which column — and who may do it

Built from the flag catalogue and the failure tables; see `data-first.md` §6. Queries
are for a developer to run; they never select more than the columns needed to diagnose.

## `faq.md`

Questions people asked — from the site's question box (`tour-site.md`) or in
conversation — with the answer, its evidence, and the date. An answer that corrected the
lore also updates the file it corrected. Newest first.
---

## `AGENTS.md` — the root digest

`.lore/` is the reference; `AGENTS.md` is what actually gets loaded into every agent
session, so it has to survive a 400-line budget. In this order:

1. One paragraph: what this system is and who it serves.
2. **Where the lore lives** — point at `.lore/` and say which file answers what, so an
   agent greps instead of guessing.
3. Domain glossary — only the terms whose meaning here differs from the everyday one.
4. The ten rules that must never be broken, each with where it's enforced.
5. State machines, compressed to transition tables.
6. Conventions an agent must imitate: naming, error handling, logging, async style.
7. The landmine list.
8. **When something breaks** — point at `.lore/16-diagnostics.md`: symptom → causes in
   check order → the query that confirms each.
9. **Before you change anything** — a short procedure that works for any agent, with or
   without this skill installed:
   ```
   1. Find the screen or endpoint in .lore/15-change-map.md — it lists every file
      and layer involved.
   2. Read its flow in .lore/13-flows.md, including the failure branches.
   3. Check the rules (R-…) and landmines (L-…) it references.
   4. Change every layer the change map lists, in that order, imitating how existing
      fields are wired. Enforce validation and access on the server, not only the UI.
   5. Update the affected .lore/ entries in the same change.
   ```

What stays out: history, rationale at length, the full package inventory, anything an
agent can read from the code in one grep. If the digest runs long, cut background and
keep rules — an agent that knows the rules and not the history is useful; the reverse
is not.
