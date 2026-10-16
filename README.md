# lore

## Understand any business from its code.

**Logic · Ownership · Rules · Evidence** — reverse engineering for code you *have* but
nobody explained.

Every codebase has lore: the unwritten knowledge in the heads of the people who built
it. Why orders over ₹50,000 skip auto-approval. Which table you must never write to
directly. That "closed" means the invoice was paid, not that the goods arrived. Why some
users can't log in — `IsActive`, `IsLocked`, `ExpiryDate`, or the password is 91 days old.

A new engineer absorbs it over a month of asking questions — if anyone is left to ask.
An AI coding agent never gets that month. It reads the code, infers the rest, and
confidently breaks things.

`lore` reads **every file**, writes the business down where people and agents will find
it, and then helps you change the code without explaining it again.

```
your-repo/
├── AGENTS.md            ← auto-loaded every agent session: the rules that must not break
└── .lore/
    ├── 01-business.md … 16-diagnostics.md   ← the business, file by file
    ├── coverage.md      ← proof every file was read
    └── site/index.html  ← a role-based website to explore it, with diagrams
```

### Who it's for

- **The developer handed an old system with no documents**, who has to take it to
  production anyway.
- **The new joiner who got no handover** — or a handover of "it's all in the code".
- **Teams using AI agents** that keep breaking business rules they cannot see.

### What it does

| | |
|---|---|
| **Understand** | Reads every file of any kind of application — web, desktop, Windows services, batch jobs, stored procedures, SSIS, mobile, ETL, legacy — and writes the business rules, sign-in and every flag that blocks it, roles, money, APIs, costs, versions, every table and where its data comes from, every flow with what happens when it fails, errors and logs |
| **Show** | A website you explore by role: guided tours screen by screen, an architecture map, flow diagrams, search, and a question box that hands your questions back to Claude. Diagrams on request |
| **Diagnose** | "Some users can't log in" → every cause in the order the code checks it, with the query that confirms each |
| **Change** | "Add a GST field to the first tab of Advanced Settlement" — and the second skill, `lore-change`, finds the files and changes every layer, from database to form to tests |

Stop re-explaining your system every session.

---

## Install

Pick one. Every method installs both skills: **`lore`** (understand) and
**`lore-change`** (change).

### 1. npx — no install, nothing left behind

```bash
npx lore-skill                # for your user   (~/.claude/skills/lore, lore-change)
npx lore-skill --project      # for this repo   (.claude/skills/lore, lore-change)
```

Other flags: `--where` prints the paths and changes nothing, `--force` overwrites,
`--remove` deletes them. Also works with `bunx lore-skill` and `pnpm dlx lore-skill`.

### 2. Plugin marketplace — the one that gets updates

```bash
claude plugin marketplace add AbdulRahmanongithub/lore
claude plugin install lore@lore
```

This is the only method that updates: when this repo changes, you get the new version.
The others copy files once.

Installed this way the skills run as `/lore:lore` and `/lore:lore-change` rather than
`/lore` and `/lore-change`, because Claude Code prefixes plugin skills with the plugin
name. Plain conversation triggers them either way, and that's the main way in.

### 3. curl / irm

**macOS, Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/AbdulRahmanongithub/lore/main/install.sh | sh
curl -fsSL https://raw.githubusercontent.com/AbdulRahmanongithub/lore/main/install.sh | sh -s -- --project
```

**Windows PowerShell:**
```powershell
irm https://raw.githubusercontent.com/AbdulRahmanongithub/lore/main/install.ps1 | iex
```

Read the script before piping it to a shell. That applies to every install script on
the internet, this one included — it's short and it writes only the skill directories.

### 4. Commit it into your repo — zero install for your team

Claude Code loads skills from `.claude/skills/` in the repository it's running in, so
skills committed to a repo are active for **anyone who clones it**, with nothing to
install:

```bash
npx lore-skill --project
git add .claude/skills
git commit -m "add lore skills"
```

Any teammate who clones the repo and opens Claude Code in it has `lore` immediately.
Pair it with the output and the loop closes: `.lore/` and `AGENTS.md` get committed too,
so every future session — anyone's — starts with the business rules already loaded.

### 5. git clone — for hacking on it

```bash
git clone https://github.com/AbdulRahmanongithub/lore.git
cp -r lore/plugins/lore/skills/* ~/.claude/skills/
```

Or run Claude Code with `--plugin-dir ./lore/plugins/lore` to load it without installing.

### Claude Desktop and Claude.ai

The desktop app shares `~/.claude` with the CLI, so a plugin or user install is already
visible in its **Code tab** — open a project folder there and talk to it.

**Chat** (desktop chat or claude.ai) uses uploaded skills rather than plugins. Download
`lore.skill` from [Releases](https://github.com/AbdulRahmanongithub/lore/releases) and
upload it in **Settings → Capabilities → Skills**. Chat has no project folder of its
own, so use the Code tab to *create* lore and chat to *ask about* it — "what are the
approval rules here?" from a `.lore/` you've already committed.

---

## Setup

If you already run Claude Code, skip this — `lore` needs nothing beyond it.

### Install Claude Code

**Windows PowerShell:**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**macOS, Linux, WSL:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Then open a **new** terminal and check:
```
claude --version
```

### `claude: command not found` after installing

The installer puts the binary in `~/.local/bin` and doesn't always add it to PATH. It
tells you so in its own output, which is easy to miss.

**Windows PowerShell** — fixes the current session and every future one:
```powershell
$env:Path += ";$env:USERPROFILE\.local\bin"
[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ";$env:USERPROFILE\.local\bin", 'User')
```

**macOS, Linux** — add to `~/.zshrc` or `~/.bashrc`:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Verify lore loaded

```
claude plugin details lore
```

The **Component inventory** should list `Skills (2)`: `lore` and `lore-change`. If the
plugin isn't listed at all, see the next item.

### Installed but not showing up

Skills and plugins install **per user account**, not per machine. Installing from an
administrator shell and then working from your normal account is the usual cause — the
plugin sits in that other account's `~/.claude`.

Either install again from the account you actually code in, or sidestep user profiles
entirely:

```bash
cd your-project
npx lore-skill --project
```

That puts the skills in the project rather than a user profile, so they work whichever
account runs Claude Code — and committing them means your whole team gets them.

---

## Use

No command needed. Just talk to it:

> work out what this codebase does and write it down
>
> I've been handed this system with no documents — explain the business logic
>
> my agent keeps breaking the approval flow — map the business rules

**How a run goes:**

1. **It says what it's about to do, and what it will cost** — sources, size, the type
   of each component, and an estimate of **time and tokens**. On a large system it asks
   how much to read first. See [Time and tokens](#time-and-tokens).
2. **It reads everything.** Every file, every method, every table, recorded in
   `coverage.md`. A big repo is split across sub-agents and merged, never skimmed.
3. **It names what it's missing** — no dev database, no dev URL, no docs — and what each
   would unlock: which `[inferred ⚠]` lines would become facts.
4. **It asks you, once, in one batch:** up to ten questions ranked by how much damage a
   wrong guess would do, each with a proposed answer so you can reply "1 ok, 2 ok, 3
   actually it's X" — plus **where-does-this-data-come-from** questions for tables fed by
   something outside the repo.
5. **It writes `.lore/`, `AGENTS.md` and the website.**

**Updates are cheap.** A second run re-reads only the files that changed since the
last one, so keeping the lore current costs a fraction of the first run.

**Depth** comes from how you ask. "Just a quick look" skips the questions and marks
everything unverified.

**Updates** are detected. If `.lore/` already exists it keeps every answer you gave
before, refreshes what came from code, and writes `.lore/CHANGELOG.md`.

**After the run, keep asking.** "Draw how a refund works", "give me this as a document I
can send the team", "why can't this user log in?", "add a field to…" — all work from the
lore without a new run.

### Time and tokens

Before reading anything, `lore` measures your source and tells you what the run will
cost — as a range, because an honest estimate can't be a single number:

```
lore · scope
  Size:      412 files · 61k lines · C#, TypeScript, T-SQL
  Budget:    source ≈ 1.9 MB · ~540k tokens of code
             full run ≈ 1.7M–3.3M tokens processed · ~35–60 min (4 shards)
```

**On a large system it asks before spending:**

```
This is a large codebase. How much should I read?
  ● Full — every file, all of .lore/, the website      ≈ 1.7M–3.3M tokens · ~35–60 min
  ○ Focused — only the modules you name                ≈ 300k–700k tokens · ~10–20 min
  ○ Full, without the website (add it later)           ≈ 1.6M–3.1M tokens · ~30–50 min
  ○ Quick look — no questions, everything unverified   ≈ 150k–300k tokens · ~5–10 min
```

**It spends less without reading less:**

- **Reads each file once** and writes its notes down straight away, so nothing has to be
  re-read because it fell out of memory.
- **Extracts machine-made files by script** — lockfiles, generated JSON, resource files —
  instead of reading them. A lockfile alone can be bigger than your whole codebase.
- **Reads one, diffs the rest.** Fifty near-identical CRUD controllers or SPs: it reads
  two or three, then only the differences in the others. The differences are where the
  rules are anyway.
- **Gives sub-agents a short brief**, not the whole skill, and gets back tagged findings,
  not essays.
- **Generates the website with a script** from the finished markdown instead of typing
  every page — writing is the slowest and costliest part of a run.
- **On updates, reads only what changed**, using the file hashes it recorded last time.

**It keeps you posted** on long runs — `Read 180 of 412 files · ~20 min left` — and if a
run is heading well past its estimate, it stops and asks before carrying on.

**It reports what it took**, and saves it so the next estimate is more accurate:

```
Run stats
Read: 412 files in full, 6 by template diff · 1.9 MB of source
Estimated: ~2.1M tokens processed (estimate was 1.7M–3.3M) · ~42 min
Next update: likely 5–15% of this run
```

Token figures are `lore`'s estimate. For the exact count, check your usage in Claude
Code with `/cost`.

### Commands

None are required — plain conversation does everything. These are shortcuts, and `lore`
reminds you of them as it goes:

| Command | What it does |
|---|---|
| `/lore` | Start a run (same as asking in plain words) |
| `/lore-db` | Ask me about connecting to a database **now** — you still pick which one, or skip |
| `/lore-app` | Ask me about reading the running dev app now — you sign in yourself |
| `/lore-prod` | Ask me about production now — two confirmations, the second naming the host |
| `/lore-change` | Make a change or fix a problem using the lore |

The access shortcuts never connect by themselves. They only make the question come
sooner.

---

## What it writes

| File | Contents |
|---|---|
| `AGENTS.md` | The digest every agent session loads: rules, glossary, landmines, what to check when something breaks, how to make a change. No history. |
| `.lore/index.md` | Map of the folder, files read, confidence counts, weakest areas |
| `01-business.md` | Purpose, who pays vs who uses, end-to-end flow, domain glossary |
| `02-roles.md` | **Sign-in step by step** and what every failure returns; the real access model — role × scope × level; who can do what |
| `03-rules.md` | **The important one.** Every rule as a decision table — true branch, false branch, the edge that crashes. State machines, calculations, deadlines |
| `04-money.md` | Pricing model, gateways, rounding, tax, refunds, audit trail |
| `05-architecture.md` | How the pieces connect front to back, the pattern *and where the code breaks it*, **exact versions** of everything — runtime, framework, every package (declared and installed), database engines |
| `06-data-model.md` | **Every table:** who writes it, who reads it, what reacts to it, where its data comes from. The CRUD matrix, every flag/status/date column and what it does, every stored procedure, view and trigger |
| `07-integrations.md` | Every API endpoint; every external service with **what triggers a billable call** and what multiplies it; webhooks; what happens when each one is down |
| `08-jobs.md` | Background work, Windows services, schedules — what starts each, and what breaks if it doesn't run |
| `09-infra.md` | Environments, CI/CD, how migrations are applied, who can deploy |
| `10-security.md` | Posture and 🚨 findings, hardcoded secrets first |
| `11-open-questions.md` | Every unconfirmed guess. **This file existing is a feature.** |
| `12-landmines.md` | Code that looks wrong but is deliberate, silent failures, cost traps. Read before changing anything |
| `13-flows.md` | Every action traced screen → request → code → database → response, with a table of what happens when each check is false or each call fails |
| `14-errors.md` | Where the logs go in each environment and the command to read them, custom error types, error codes, "when X breaks, look here" |
| `15-change-map.md` | Every screen and tab by the name users call it → its files, endpoint, validation, access check, tables, tests, and the exact layers a new field passes through |
| `16-diagnostics.md` | Symptom → every cause in the order the code checks it → the read-only query that confirms it → the fix |
| `coverage.md` | Every source file: read in full, skimmed or skipped, and what it fed |
| `faq.md` | Questions asked from the website or in chat, answered with evidence |
| `site/` | The website — open `index.html` by double-clicking it |

Every line carries its evidence — `[code: path:line]`, `[config: …]`, `[db]`, `[user]` —
or is marked `[inferred ⚠]`, so you can always tell fact from guess. Prices are never
stated from memory; versions come from the files, not recall.

---

## How it reads a system

### Every file, front to back, both sides of every branch

- **It reads everything, and proves it.** Every source file goes in `coverage.md` with
  what it fed. On a repo too big for one pass it splits the work by component across
  sub-agents and merges the results, rather than quietly reading less.
- **It traces every action end to end.** SPA → HTTP call → API handler → service → SQL
  → response, each hop with `file:line`, plus how the pieces physically connect: which
  client, which base URL, which driver, which database engine and version.
- **It writes down both sides of every branch.** Every flow gets a failure table: wrong
  role, another branch's record, validation fails, the database fails mid-write, the
  queue is down. The answer is often "it fails silently" — and those go straight to the
  landmines.
- **It tells you where to look when things break.** Where the logs go, how to read them,
  every custom error and what the user sees.

### Thinking from the table

A developer reverse-engineering by hand opens the login screen, then goes straight to the
`Users` table to see what can stop someone signing in. `lore` does the same for every
table:

- **Who writes it, who reads it, what reacts to it, where it's shown** — screens, APIs,
  stored procedures, triggers, Windows services, jobs, other systems.
- **Every flag that changes behaviour** — `IsActive`, `IsLocked`, `ExpiryDate`,
  `FailedLoginCount`, `Status`, `ProcessedFlag` — with what sets it, what checks it and
  what it does. On login, permissions and approvals it collects every condition, however
  small: that's where accuracy is won.
- **Stored procedures and triggers as business logic** — inputs, reads, rules, writes,
  transactions, errors, and who calls each one.
- **Where the data comes from.** A Windows service that wakes up when a row lands in
  `InboundOrders` makes no sense until you know who inserts that row. When the trail
  leaves the repo, `lore` asks you:

  ```
  Where does this data come from? — InboundOrders
    ● An external system writes directly into the table (which one?)
    ○ A file import / SSIS package outside this repo
    ○ Another application of ours
    ○ I don't know — mark it as unknown
  ```

That is what makes `16-diagnostics.md` possible: *some users can't log in* → check
`IsActive`, then `IsLocked`, then `ExpiryDate`, in the order the code checks them, each
with the query to run.

### Every kind of application

Not just web apps. `lore` identifies the type of each component and follows its
playbook: web (SPA, MVC, WebForms, PHP), desktop (WinForms, WPF, Delphi, VB6), Windows
services and daemons, console and batch jobs, stored procedures, SQL Agent and SSIS,
message-driven services, mobile, ETL pipelines, Excel/VBA and Access, legacy COBOL and
Classic ASP, libraries, serverless. For each it knows what starts the code, where the
rules live, what the tour should follow — screens for a UI, the data's journey for a
service — and where the logs are.

### Your access model, as it actually is

The most common failure in documenting who-can-do-what is treating access as a list of
roles. `lore` looks for all three dimensions:

- **Role** — declared, easy to find: enums, claims, policies, `[Authorize]` attributes
- **Scope** — which records you act on. **Usually not declared anywhere as a permission** —
  it lives in query filters like `Where(r => r.RegionId == user.RegionId)`, global filters
  and tenancy discriminators. Missing one is how a feature leaks one region's data into
  another.
- **Level** — graded authority within a role: approval level 1/2/3, threshold bands

Then how they **compose**: does a higher level inherit the lower ones? Is scope
hierarchical? Which role escapes scoping entirely — often the most dangerous rule in the
system? And the negative rules no role list can express: "an approver cannot approve a
requisition they raised." If your app genuinely has two roles and no scoping, it says so
plainly — that's useful too.

---

## The website

`.lore/*.md` is for an agent to search. `site/` is for a **person to be walked through** —
a new developer on day one, a client who wants to understand what they paid for, a tester
who needs to know what each screen is meant to do. It opens offline with a double-click;
zip it and send it to your team.

**It opens with "who are you?"** Each stop on a tour is one screen of the app and carries
four things:

- **What you see** — including what's *absent* for you that another role would see
- **What you do** — the actions available
- **What happens behind it** — which code runs, which rules fire, what gets written
- **Where you can go next** — the real navigation, so it's a path and not a list

Personas come from your **real** access model — *Warehouse Manager · one region ·
approval level 2* — not a flat role list, and never the forty-five-tour cross product.

| Page | What's on it |
|---|---|
| `index.html` | Pick who you are |
| `tours/` | One guided journey per persona |
| `map.html` | Architecture from front end to database — the front door when there's no UI, where the tour follows the data instead |
| `flows.html` | Every traced action as a sequence diagram, with its failure table |
| `errors.html` | Where the logs are and what each failure means |
| `reference.html` | Rules, data, API catalogue, versions, cost drivers |
| `faq.html` | Answered questions |
| `diagrams/` | Pictures drawn on request after the run |

**Pictures carry the weight, not prose** — the access model, state machines, coverage,
approval ladders are all drawn, in hand-written SVG with no library. A **role switcher**
dims what your persona can't reach, and **search** finds any rule, flow, error or screen.

**It borrows your app's look** — palette, fonts, logo copied in locally — but never makes
an external request, and every page carries the lore header so nobody mistakes it for the
real app. Screenshots come only from dev, only with your agreement, and never of a
screen showing real people's data.

### Ask from the website — it comes back to Claude

Every tour stop, rule, flow and screen has an **Ask** box. The site is offline and holds
no keys, so it can't call Claude itself. Instead it builds a prompt that already carries
the context — which page, which persona, which rule and flow, which files — and copies it
for you to paste into Claude Code. Questions also collect in an inbox you can export; drop
the file in `.lore/inbox/` and the next run answers them all. Answers land in `faq.md`
and the site's FAQ, and an answer that shows the lore was wrong corrects it.

---

## Making changes — `lore-change`

The second skill uses the lore to change the code. Once `.lore/` exists, this is enough:

> add a GST number field to the first tab of Advanced Settlement

You don't explain which files, which API, which validation or who is allowed to save it.
`lore-change` finds the screen in `15-change-map.md` by the name you used and follows the
field through every layer — database and migration, model, API contract, server
validation, access and **scope** checks, client validation, the form, tests. It checks
the rules and landmines that screen touches, checks **every other writer of the table**
(the nightly sync that would break on a new NOT NULL column), and copies how existing
fields on the same screen are wired. It shows the plan first when the change touches data,
money or access, verifies with the project's own tests, and updates `.lore/` so the next
change starts from the truth.

**Problem reports work too.** *"Some users can't log in"* — it walks the causes in
`16-diagnostics.md` first, gives you the read-only checks (or runs them, if you let it
connect), and tells you whether it's data — an inactive flag, an expired date — or a real
bug. Only a real bug gets a code change; a data fix is written for you to run.

It never commits or pushes unless you ask.

---

## Safety

### `lore` is read-only

`lore` inspects and documents. It never modifies the system it's reading: no source
edits — not even to fix a bug it spots — no `git commit`, `checkout` or `pull`, no
installs, no build, migration, test or seed commands, no calls to the APIs your project
uses. The only files it creates are `.lore/` and `AGENTS.md`. Anything broken becomes a
finding, and you decide. Changing code is only ever `lore-change`, and only what you asked.

A skill is instructions, not a sandbox — it directs the agent's tools, it can't remove
them. For a hard guarantee on a client's production repo, run it on a throwaway clone.

### You stay in the loop for live access

Code can't answer everything — a committed threshold may not be what production runs. So
`lore` **asks**, tied to a specific gap, and you answer with a click:

```
Connect to the dev database for better results?
It would confirm the approval thresholds and order statuses (now guesses).
  ● Connect read-only to orders_dev on db-dev.****.internal
  ○ Use staging instead
  ○ Skip — continue from code only
Tip: next time, type /lore-db to be asked about the database straight away.
```

| Tier | Reaches | How you agree |
|---|---|---|
| **code** | the repo, its history, committed config | nothing to agree — the default |
| **dev database** | schema, constraints, lookup rows, stored procedure source | one question naming the database |
| **dev application** | the running app in a browser | one question, then **you** sign in — as admin for the fullest picture |
| **production** | any production database or URL | two questions — the second's only "connect" option names the host |

- **Skip is always an option**, and it won't ask again that run. The gap goes to
  `11-open-questions.md` with what access would close it.
- **Dev is the default.** A host or database named `prod`, `production` or `live` is
  production whatever it was called, and staging is offered first.
- **In a database it reads structure, never customer rows**, and never writes. In
  production it's stricter still: `COUNT(*)` only, and no sign-in at all.
- **In the app it only looks.** It follows links and reads pages — no forms, no buttons
  that create, change, delete or run anything. On admin screens, where the destructive
  buttons live, that matters most.

### It never asks for your password

`lore` will not ask you to type a password, API key or token into the conversation — not
for a dev box, not for an admin account, not if you offer. A credential typed into chat
stays in that transcript: stored, synced, visible to anyone with access, impossible to
take back. A tool that redacts the secrets it finds in your repo has no business asking
for fresh ones.

Instead **you sign in to the app yourself** — as admin, for the most complete result —
and `lore` reads through that session. It never sees the password, and you end access by
logging out. Or point it at a local file like `.env.development`: it reads it and treats
every value as `[REDACTED]`.

Secrets found in your repo are `[REDACTED]` with their shape kept, because the shape is
useful: `sk_live_[REDACTED] (live key, 107 chars, .env.production:8)`.

---

## Optional tooling

`lore` works with nothing installed. It uses what's present and tells you what was
missing — it never installs anything itself.

| Tool | What it adds |
|---|---|
| `ast-grep` | Structural queries. Turns "is this status value ever set?" from a reading exercise into something that holds at 2,000 files |
| `gitleaks` / `trufflehog` | Git **history** scanning — finds the key committed in March and deleted in April, which is still exposed |
| `scc` | Real file and complexity counts for the scope estimate |
| `tbls` | Schema constraints, once you agree to database access; check constraints are business rules written in SQL |
| `syft` + `osv-scanner` | Package versions, licences and CVEs as facts rather than recall |

Deliberately **not** used: embedding search (can't produce a `file:line` citation, and
every claim needs one), whole-repo packers like repomix (`lore` exists because dumping
everything into context doesn't work), and decompilers. If all you have is a compiled
binary with no source, the right tool is [REA](https://github.com/morluto/rea): REA
recovers the code; lore recovers the business from code.

---

## Repo layout

```
.claude-plugin/marketplace.json   ← makes this repo a plugin marketplace
plugins/lore/
  .claude-plugin/plugin.json
  skills/lore/
    SKILL.md                      ← understand: the main skill
    references/
      deep-read.md                ← coverage ledger, fan-out, traces, failure branches,
                                    versions, cost drivers
      data-first.md               ← every table's writers, readers and data origin, flags,
                                    SPs and triggers, services that wait for data, diagnostics
      app-types.md                ← playbooks for every kind of application
      errors-and-logs.md          ← logging, error model, failure behaviour, runbook table
      budget.md                   ← time and token estimates, choosing how much to read,
                                    spending less without reading less, run stats
      access-model.md             ← discovering role × scope × level, not a flat list
      access-escalation.md        ← the access tiers, the questions, the admin session
      security.md                 ← read-only rules, database gate, redaction, credentials
      output-template.md          ← content template for each .lore/ file
      tour-site.md                ← the website, map, flows, question box, diagrams
      stack-detection.md          ← manifests, data stores, CI/CD per ecosystem
      tooling.md                  ← which tools earn their place, and why not the rest
  skills/lore-change/
    SKILL.md                      ← change and diagnose, using .lore/
bin/cli.js                        ← npx installer
install.sh / install.ps1          ← curl installers
```

Every install method copies every skill under `plugins/lore/skills/`. Edit each skill in
one place.

---

## Publishing your own fork

Replace `AbdulRahmanongithub` with your GitHub username in `README.md`, `package.json`,
`install.sh` and `install.ps1`:

```bash
grep -rl AbdulRahmanongithub . | xargs sed -i 's/AbdulRahmanongithub/your-github-username/g'
```

Then validate and publish:

```bash
claude plugin validate .                  # marketplace + plugin manifests
claude plugin marketplace add .           # test locally before pushing
npm publish --access public               # for the npx path
```

MIT.
