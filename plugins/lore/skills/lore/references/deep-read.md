# Deep read — every file, every flow, every failure

A full run reads the whole codebase, not a sample of it. This file is how that stays true
on a repo too big for one context window, and how the reading turns into the three things
a developer without a handover needs most: **where a request goes**, **what happens when
a check is false or a call fails**, and **what the system is built from, at which
versions, at what cost**.

Read this in Phase 0, before estimating scope.

## 1. Coverage is a ledger, not a feeling

"I read the codebase" is unfalsifiable. A ledger is not.

Before Phase 1, build the **inventory**: every tracked source file
(`git ls-files`, or a directory walk outside git), minus the skip list in SKILL.md §7.
Classify each one: `ui`, `api`, `service`, `data`, `job`, `config`, `infra`, `test`,
`script`, `other`. That inventory is the denominator.

As you read, record each file in `.lore/coverage.md`:

```
| File | Kind | Read | Lines | Blob | Extracted to |
|---|---|---|---|---|---|
| src/api/orders.py | api | full | 412 | 3f9a1c2 | 07 §orders, 13 §place-order, 14 §OrderError |
| src/ui/pages/Settlement.tsx | ui | full | 288 | a71e0d4 | 15 §advanced-settlement, 13 §save-settlement |
| src/api/customers.py | api | template diff vs orders.py | 390 | 0c55b19 | 07 §customers — differs only in R-30 |
| src/legacy/report_v1.py | service | skimmed | 1,904 | 9be2f70 | 12 §dead-report — nothing imports it |
| migrations/0001_init.sql | data | full | 96 | 51d0a8e | 06 §all tables |
```

`Read` is `full`, `template diff vs <file>` (`budget.md` §3.3), `skimmed` (with the
reason), or `skipped` (with the reason). `Blob` is the short git blob hash from
`git ls-files -s`; an update compares it to decide what to re-read (`budget.md` §3.8).
`Extracted to` names the sections the file fed. A file that was read and fed nothing is
fine — say `nothing business-relevant` — but a file with no row means nobody looked.

`index.md` carries the headline: **"Read 412 of 418 source files in full; 6 skimmed,
reasons in coverage.md."** That sentence is the difference between documentation a
developer can trust and documentation they have to re-check.

Every method is read; not every method is documented. A method earns a line in the
output when it carries a rule, a branch with business meaning, a side effect, an external
call, or an error it raises or swallows. Getters, mappers and plumbing are read and
counted, and appear only in the ledger.

## 2. Large repos: fan out, then merge

One context window holds a few hundred files with room left to think. Past roughly 300
source files — or sooner if files are long — split the work.

**If the harness can spawn sub-agents** (Claude Code's Agent tool, for instance), shard
by component or by top-level folder, never by alphabet: a shard must contain whole
features, or the traces that cross it break. Give each sub-agent:

- its file list from the inventory
- this skill's P0–P5 and the provenance tag rules, verbatim
- the output it must return: ledger rows, plus raw findings grouped by the `.lore/` file
  they belong to, every line already tagged

Sub-agents return findings; **only the main run writes `.lore/`.** Then do the merge pass
yourself: resolve conflicts between shards, stitch traces that cross shard boundaries
(the UI shard saw `POST /settlements`; the API shard saw the handler — the trace is
yours to join), and re-check every count (P1a) because shards double-count shared code.

**If it cannot**, go component by component, write each component's findings to a
scratch file outside the repo before moving on, and merge at the end. Never let earlier
findings silently fall out of context: what is not written down by the time you start the
next component is lost.

Either way, say in the scope block how the run is split and roughly how long it will
take. A user who expected ten minutes and gets forty without warning stops trusting the
run.

## 3. Front to back — the connectivity map

Before tracing anything, establish how the pieces physically connect. This becomes the
first section of `05-architecture.md` and the spine of `map.html`.

For each hop, record the mechanism and where it is configured:

```
Browser — React 18.2 SPA (Vite 5.1)              [code: package.json:14]
  │  HTTPS, JSON, bearer JWT in Authorization     [code: src/api/client.ts:8]
  │  base URL from VITE_API_URL                   [config: .env.example:2]
  ▼
API — FastAPI 0.110 on Uvicorn, Python 3.11       [code: pyproject.toml:9]
  │  SQLAlchemy 2.0 async, asyncpg                [code: app/db.py:12]
  │  pool size 10, no read replica                [code: app/db.py:15]
  ▼
PostgreSQL 15                                     [config: docker-compose.yml:22]
  └─ Redis 7 — session cache, rate-limit counters [code: app/cache.py:4]
Side channels: Celery worker (same codebase), Stripe webhooks inbound to /hooks/stripe
```

Look for: the HTTP client wrapper on the front end and its base URL; CORS config
(which origins the API trusts says which front ends exist); proxy rules (`vite.config`,
`nginx.conf`, `next.config`, `vercel.json` rewrites); the ORM/driver and its connection
config; message brokers; anything that talks to the database **without** going through
the API — a second app, a reporting tool, a cron script with its own connection string.
That last one is a landmine nearly every time.

## 4. Traces — one per user action

A trace follows one thing a user does from the click to the row and back. These go in
`13-flows.md` and are the most useful part of the output for a developer who has to
change something next week.

Trace every action that writes, every action that moves money, every action behind a
permission, and the main read paths. For each:

```
### Save settlement — Advanced Settlement › Adjustments tab

Who:      Finance L2+ in own branch                    [code: app/api/settle.py:31]
UI:       AdjustmentsTab.tsx:88  onSubmit → saveSettlement()
          client validation: amount > 0, reason ≥ 10 chars [code: AdjustmentsTab.tsx:61]
Request:  PUT /api/settlements/{id}/adjustments  body: AdjustmentIn
                                                       [code: src/api/settlements.ts:40]
Handler:  settle.py:118 update_adjustments()
          auth: require_role("finance") + level ≥ 2    [code: settle.py:117]
          scope: settlement.branch_id == user.branch_id [code: settle.py:124]
Service:  SettlementService.apply_adjustment()         [code: services/settlement.py:203]
          rule R-14: adjustment ≤ 5% of gross, else needs L3 [code: settlement.py:219]
Writes:   settlement_adjustments (insert), settlements.net_amount (update),
          audit_log (insert) — one transaction           [code: settlement.py:240]
Side:     emits settlement.adjusted → Celery task notify_branch_head
                                                       [code: settlement.py:251]
Response: 200 SettlementOut; UI refetches and shows toast "Saved"
```

Then the part most documentation never has — **the failure branches**. Every decision
point in the trace gets its false branch, and every external call gets its failure:

```
If…                                Then…                                   Evidence
amount ≤ 0                         blocked client-side, field error        AdjustmentsTab.tsx:61
not finance or level < 2           403 {"detail":"forbidden"}, UI toast    settle.py:117
other branch's settlement          404 — not 403, deliberately hides it    settle.py:124
adjustment > 5% and user is L2     409 NEEDS_APPROVAL, row created pending settlement.py:221
DB write fails mid-transaction     rolled back, 500, logged at ERROR       settlement.py:246
Celery broker down                 save SUCCEEDS, notification silently    settlement.py:251
                                   lost — no retry, no log ⚠ landmine
```

That last row is why the table exists. "What happens if this fails" is the question a
developer cannot answer without reading every line, and the answer is frequently "it
fails silently", which belongs in `12-landmines.md` as well.

Where a trace is long or branches heavily, add a Mermaid `sequenceDiagram` under it —
GitHub renders it in place, and the site redraws it as SVG.

For a system with no UI, the trace starts at whatever arrives: the message, the file, the
API call, the schedule.

## 5. Rules as decision tables

A rule written as a sentence hides its false branch. In `03-rules.md`, write any rule with
a condition as a table that states both outcomes:

```
R-14  Adjustment limit                          [code: services/settlement.py:219]
| Condition                         | Result                                   |
|---|---|
| adjustment ≤ 5% of gross          | applied immediately                      |
| > 5% and user level ≥ 3           | applied immediately, audit flag "large"  |
| > 5% and user level < 3           | saved as pending, routed to L3 queue     |
| gross is 0                        | ⚠ division by zero — 500, unhandled      |
```

Give each rule a stable ID (`R-14`). Traces, landmines and the site reference rules by
ID, and an agent asked to "change the adjustment limit" finds every place it applies by
grepping one token.

## 6. Versions — all of them, from the source of truth

A developer about to add a dependency or patch a security issue needs exact versions,
not names. Record in `05-architecture.md`:

| What | Where to read it |
|---|---|
| Language runtime | `.nvmrc`, `.node-version`, `engines`, `.python-version`, `runtime.txt`, `global.json`, `<TargetFramework>`, `go` directive, `rust-toolchain`, Dockerfile `FROM` |
| Framework and every direct dependency | manifest for the **declared** range, lockfile for the **resolved** version |
| Database and broker engines | docker-compose image tags, IaC, managed-service config, migration tool dialect |
| Build and tooling | bundler, compiler, test runner, linter — from the manifest |
| Hosting runtime | Dockerfile base image, platform config (`vercel.json`, `app.yaml`, `Procfile`) |

Lockfiles are skipped for *reading*, never for *versions* — read them for resolved
versions only. When declared and resolved differ meaningfully (`^4.0.0` resolved to
`4.18.2`), record both. Flag end-of-life runtimes and frameworks with the EOL date and
its source; if you are going from memory rather than a tool, tag it `[inferred ⚠]` —
EOL dates are exactly the facts that rot in model weights.

## 7. Cost — what drives it, from the code

The user wants to know what the system costs to run. Code cannot tell you the bill, but it
tells you exactly **what drives it**, and that is the half nobody else can produce.

For every paid external service in `07-integrations.md`:

| Field | From |
|---|---|
| Service, SDK and version | manifest, client construction |
| Plan or tier, if configured | config keys, IaC (`sku`, `tier`, `instance_class`) |
| What triggers a billable call | the trace: "one SMS per order placed, plus one per status change" |
| Volume multipliers | loops, fan-out, retries, polling intervals, crons — "polls every 30 s per open tab" |
| Caching or batching that reduces it | or the lack of it |
| Unit price | **only** from the user, a pricing doc in the repo, or a pricing page the user supplied — tagged with source and date |

Never state a price from memory. Prices change, vary by region and contract, and a wrong
number in a cost table gets copied into a budget. Without a sourced price, write the
driver and leave the price as an open question: "Twilio SMS — 2–3 per order; unit price
not in repo [open question 7]". The driver is the durable fact; the price is a lookup.

Flag cost landmines in `12-landmines.md`: unbounded retries against a paid API, polling
where a webhook exists, a cron that calls a paid API per row, a missing cache in front of
a metered lookup.

## 8. Where this lands

| Finding | File |
|---|---|
| Coverage ledger | `.lore/coverage.md` |
| Connectivity map, versions | `05-architecture.md` |
| Endpoint catalogue | `07-integrations.md` |
| Traces with failure branches | `13-flows.md` |
| Rules as decision tables | `03-rules.md` |
| Errors, logging, how to debug | `14-errors.md` — see `references/errors-and-logs.md` |
| Screen → file → endpoint → table index | `15-change-map.md` |
| Cost drivers | `07-integrations.md`, landmines in `12-landmines.md` |
