---
name: lore-change
description: Change or fix an existing codebase using its lore — the .lore/ folder and AGENTS.md written by the lore skill — so a short request like "add a GST number field to the first tab of Advanced Settlement" or "some users can't log in" is enough. Diagnoses problem reports from symptom to cause with read-only checks before touching code; for changes, resolves the screen to its files and follows the field through every layer (UI, validation, API, access and scope checks, database and migration, every other writer of the table, tests), respects the rules and landmines, implements, verifies, and keeps .lore/ current. Use whenever the user asks to add, change, fix, remove or troubleshoot something in a repo with a .lore/ folder or a lore-generated AGENTS.md. Also on /lore-change. If there is no .lore/ yet, offer to run lore first.
---

# lore-change

The lore skill reads a codebase and writes down how it works. This skill **uses** that to
change it. The user describes the change the way they see the product — "the first tab of
Advanced Settlement" — and never has to explain the files, the layers, the validation
rules or the access model, because `.lore/` already knows them.

Unlike lore, this skill writes code. It does so only for the change the user asked for.

## 1. Load the lore first

Before reading any source for the task:

1. Read `AGENTS.md` and `.lore/index.md`.
2. Check freshness: compare the `Source: <repo>@<sha>` in the header with `git log -1`.
   If many commits have landed since, say so in one line and check the specific files the
   change touches against what `.lore/` claims about them before trusting it. Lore that
   disagrees with the code loses; fix the lore as part of the change (§6).
3. If there is no `.lore/`, say that this skill works from lore, and offer to run the lore
   skill first, or a quick lore pass scoped to the area being changed. Do not pretend to
   have context you do not have.

**Load only what the change needs.** `.lore/` on a large system can run to hundreds of
thousands of tokens; reading all of it for one field is the waste lore exists to avoid.
Find the target's entry in `15-change-map.md` by grepping the screen name, then pull
exactly the `R-`, `F-`, `L-` and table entries it references — by grepping their IDs and
headings and reading those sections with an offset and limit — rather than opening whole
files. Most changes need under a dozen sections.

## 1a. A problem report? Diagnose before you change anything

"Some users can't log in", "orders are stuck in Processing", "the service stopped picking
up files" — these are not change requests yet. Often nothing in the code is wrong: a flag
is set, a date has passed, a row is poisoning a queue.

1. Find the symptom in `.lore/16-diagnostics.md`. Walk the causes **in the order the code
   checks them**, and give the user the read-only query for each — with their values
   filled in where they gave them ("for user `ravi.k`").
2. If the user grants database access the usual way (a structured question naming the
   database), run those same read-only queries yourself, selecting only the columns
   needed to diagnose. Otherwise let the user run them and tell you the results.
3. Say which cause it is, with the evidence, and what fixes it — often an admin action or
   a data correction, not a code change. Data corrections in a live database are the
   user's to make; write the statement, label which environment it is for, and never run
   a write yourself.
4. Only if the cause is a bug — the code does the wrong thing with correct data — continue
   below and change the code. Add the new cause to `16-diagnostics.md` either way.

If the symptom is not in `16-diagnostics.md`, trace it through `13-flows.md`, the flag
catalogue in `06-data-model.md` and `14-errors.md`, and add the section you had to work
out, so the next person finds it.

## 2. Resolve the request to code

Find the target in `.lore/15-change-map.md` by the words the user used — menu labels,
page titles, tab captions, the domain glossary in `01-business.md`. "Advanced Settlement,
first tab" should resolve to a screen entry, a tab component, and its "to add a field
here, touch" line.

If the request matches more than one place, or none, ask — one question, with the
candidates listed by their UI names. Never guess between two screens.

Then read, for that target:

- its flow in `13-flows.md`, failure branches included
- every rule it references in `03-rules.md` (by `R-` ID)
- every landmine it references in `12-landmines.md` (by `L-` ID)
- its access entry in `02-roles.md` — role, **scope** and level
- the entities in `06-data-model.md`, and how migrations are applied in `09-infra.md`
- the error model in `14-errors.md`, so new errors look like existing ones
- the table entries in `06-data-model.md` for every table the change touches: who else
  writes and reads it — another screen, an SP, a Windows service, an external feed. A new
  NOT NULL column breaks the HR sync that inserts without it; a renamed status value
  strands the service that polls for the old one.

Then open the actual source files the change map lists. `.lore/` tells you where to look
and what must hold; the code is still the thing you edit.

## 3. Plan across every layer

A field added only to the UI is a bug; added without server validation it is a security
hole. Build the plan from the change map's layer list, and for each layer say what
changes, imitating how an **existing** field on the same screen is wired:

```
Change: add "GST number" to Advanced Settlement › Adjustments

Data        settlements.gst_number varchar(15) null — new alembic migration
            (applied on deploy, Procfile:1 — no manual step)
Model       Settlement.gst_number                     models.py:210
API         AdjustmentIn / AdjustmentOut + gst_number  settle.py:20
Server      format ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$ in AdjustmentIn,
            422 with the existing error envelope (14-errors.md)
Access      same as the screen: finance, L2+, own branch — no new check needed,
            the PUT is already gated (settle.py:117,124)
Client      settlements.ts types; adjustmentSchema same regex; input on
            AdjustmentsTab.tsx after "Reason", matching its layout
Audit       audit_log already records the full diff — nothing to add (settlement.py:240)
Tests       API: valid, invalid format, other-branch 404; UI schema test
Rules       R-14 unaffected. L-3 (net_amount recalculated on every save) — untouched
Lore        15-change-map (new field), 06-data-model, 13-flows F-12
```

Check the plan against the security list before showing it:

- validation enforced on the **server**, with the client mirroring it — never client only
- authorization unchanged or deliberately extended, **including scope filters** — a new
  query or endpoint must carry the same scope predicate as its neighbours, or it leaks
  one branch's data to another (`access-model.md` in the lore skill)
- no mass assignment: new fields added to explicit allow-lists or DTOs, not bound wholesale
- parameterized queries only; output encoded where it is rendered
- secrets and PII: not logged, not returned to roles that should not see them
- money: the project's decimal type and rounding mode, never floats

Show the plan in a compact form and ask for a go-ahead when the change touches data
(migrations), money, access rules, or more than a handful of files. For a small,
contained change the user has clearly specified, proceed and show the plan as you go.

## 4. Implement

Follow the plan layer by layer, in the change map's order, matching the surrounding
code: naming, error handling, logging, async style, test layout. Conventions are in
`05-architecture.md`; the code around the change is the final word.

Write migrations the way this repo writes them — the tool, the naming, reversible if
existing ones are reversible. Never edit an already-applied migration.

Do not drift beyond the request. A bug you notice nearby goes in your summary, not into
the diff.

## 5. Verify

Run what the project uses to check itself — tests, type checks, linters, build — scoped
to the change where the suite is slow. If the project's tests need a database or
services you cannot run, say so rather than claiming success.

Where the change is visible in a UI and the session can run the app, look at it once.

Walk the flow's failure table for the changed path and confirm each branch still
behaves: the new validation fails the way the table says, and existing branches did not
move.

## 6. Keep the lore true

The change is not finished until `.lore/` describes the system as it now is:

- update every `.lore/` entry the change touched — change map, flow, data model, rules,
  errors — with new citations
- add a line to `.lore/CHANGELOG.md`: date, what changed, files
- if `AGENTS.md` names something the change affected, update it
- if the site exists, regenerate the pages that render those files

Lore that falls behind the code becomes the thing that misleads the next agent, which is
the failure the lore skill exists to prevent.

## 7. Report

Say what changed, layer by layer, with file links; what was verified and how; what was
not verified and why; and anything noticed but deliberately left alone. Do not commit or
push unless the user asks.
