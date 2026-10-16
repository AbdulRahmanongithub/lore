# Output templates for `.lore/`

One file per concern, stable filenames, stable headings. Stable names are what make the
folder greppable: an agent that has seen one `.lore/` knows where to look in all of them.

Keep a file even when it's thin — write `Not applicable: internal tool, no monetization
[inferred ⚠]` rather than deleting `04-money.md`. A missing file reads as "not
investigated," which is exactly the ambiguity the provenance tags exist to kill.

Every line carries a provenance tag: `[code: path:line]`, `[config: path]`,
`[docs: path]`, `[web: url]`, `[user]`, `[inferred ⚠]`.

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
confirmed {n} · inferred {n} · open questions {n}
Weakest areas: {which files are thinnest and why}
```

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
* **Core stack:** language/runtime/framework **with versions**, EOL flags
* **Packages:** name · version · purpose · licence (flag non-permissive)
* **Data layer:** store type(s), ORM/driver, migration strategy, caching, transaction
  boundaries
* **Conventions:** naming, folder layout, error handling, logging, DI, async style —
  what an agent must imitate to make its code look native here

## `06-data-model.md`

* **Entities:** purpose, key fields, relationships
* **Enums and lookups:** full contents with meanings, and for each value whether any
  code path sets it — an unreachable value means a removed feature or manual DB edits
* **Soft deletes, audit columns, multi-tenancy discriminators**
* **Code ↔ DB drift:** if the DB pass ran

## `07-integrations.md`

* **Internal API surface:** endpoint groups, auth, versioning, error envelope
* **External — paid:** service · purpose · plan/cost signal · failure behaviour
* **External — free/open:** same
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
* **Observability:** logs, metrics, alerting, error tracking

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

What stays out: history, rationale at length, the full package inventory, anything an
agent can read from the code in one grep. If the digest runs long, cut background and
keep rules — an agent that knows the rules and not the history is useful; the reverse
is not.
