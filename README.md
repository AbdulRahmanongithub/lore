# lore

## Understand any business from its code.

**Logic · Ownership · Rules · Evidence** — one skill for the part of your system an
agent can't read: the rules, the money, and the landmines.

Every codebase has lore: the unwritten knowledge in the heads of the people who built
it. Why orders over ₹50,000 skip auto-approval. Which table you must never write to
directly. That "closed" means the invoice was paid, not that the goods arrived.

A new engineer absorbs it over a month of asking questions. An AI coding agent never
gets that month — it reads the code, infers the rest, and confidently breaks things.

`lore` reads a codebase and writes that knowledge down where an agent will find it:

```
your-repo/
├── AGENTS.md          ← auto-loaded every session, ≤400 lines, rules only
└── .lore/
    ├── index.md
    ├── 01-business.md … 12-landmines.md
```

Stop re-explaining your system every session.

---

## Install

Pick one. All five install the same skill.

### 1. npx — no install, nothing left behind

```bash
npx lore-skill                # for your user   (~/.claude/skills/lore)
npx lore-skill --project      # for this repo   (.claude/skills/lore)
```

Other flags: `--where` prints the paths and changes nothing, `--force` overwrites,
`--remove` deletes it. Also works with `bunx lore-skill` and `pnpm dlx lore-skill`.

### 2. Plugin marketplace — the one that gets updates

```bash
claude plugin marketplace add AbdulRahmanongithub/lore
claude plugin install lore@lore
```

This is the only method that updates: when this repo changes, your users get the new
version. The others copy files once.

Installed this way the skill runs as `/lore:lore` rather than `/lore`, because Claude
Code prefixes plugin skills with the plugin name. Natural-language triggering is
unaffected, and that's the primary entry point anyway.

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
the internet, this one included — it's twenty lines and it writes one directory.

### 4. Commit it into your repo — zero install for your team

This is the one worth understanding. Claude Code loads skills from `.claude/skills/` in
the repository it's running in, so a skill committed to a repo is active for **anyone
who clones it**, with nothing to install:

```bash
npx lore-skill --project
git add .claude/skills/lore
git commit -m "add lore skill"
```

Now any teammate who clones the repo and opens Claude Code in it has `lore` available
immediately. They don't install anything, don't read this README, and don't need to know
the skill exists — they just ask Claude about the codebase and it knows how to answer.

Pair it with the output and the loop closes: `lore` writes `.lore/` and `AGENTS.md`,
both get committed, and every future session — anyone's — starts with the business
rules already loaded.

### 5. git clone — for hacking on it

```bash
git clone https://github.com/AbdulRahmanongithub/lore.git
cp -r lore/plugins/lore/skills/lore ~/.claude/skills/lore
```

Or run Claude Code with `--plugin-dir ./lore/plugins/lore` to load it without installing.

### Claude Desktop

The desktop app shares `~/.claude` with the CLI, so a plugin or user install is already
visible in its **Code tab** — open a project folder there and talk to it, nothing extra
to install.

**Desktop chat** (not the Code tab) uses uploaded skills rather than plugins. Download
`lore.skill` from [Releases](https://github.com/AbdulRahmanongithub/lore/releases) and
upload it in **Settings → Capabilities → Skills**.

Chat has no project filesystem of its own, so use the Code tab to *create* lore and chat
to *consume* it — answering "what are the approval rules here?" from a `.lore/` you've
already committed.

### Claude.ai

Same as desktop chat: download `lore.skill` from
[Releases](https://github.com/AbdulRahmanongithub/lore/releases) and upload it in
**Settings → Capabilities → Skills**.

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

The **Component inventory** should read `Skills (1)  lore`. If the plugin isn't listed at
all, see the next item.

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

That puts the skill in the project rather than a user profile, so it works regardless of
which account is running Claude Code — and committing it means your whole team gets it.

---

## Use

No command. Just talk to it:

> work out what this codebase does and write it down for you
>
> my agent keeps breaking the approval flow — map the business rules
>
> document this system so Claude stops guessing

It states what it's about to do, reads the code, comes back with up to ten ranked
questions (each with a proposed answer, so you reply "1 ok, 2 ok, 3 actually it's X"),
then writes the folder.

`/lore` works too if you prefer typing a command.

**Depth** is read from how you ask. "Just a quick look" skips the questions and flags
everything unverified. Otherwise you get the full two-phase run.

**Updates** are detected. If `.lore/` already exists, it's an update — it reads the
existing folder, keeps every `[user]` answer verbatim, refreshes what came from code,
and writes `.lore/CHANGELOG.md`.

**Missing sources get named.** At the end of its reading pass it lists what it doesn't
have — no dev connection string, no dev URL, no docs — and for each one, what it would
unlock in concrete terms: which file, which lines, which `[inferred ⚠]` becomes a fact.
A request without that is nagging; with it, it's a decision you make in five seconds.
Decline and each one goes to `11-open-questions.md` with the same note.

**More access** — dev database, the live dev app, or production — is gated by a typed
token each (`/lore-db`, `/lore-app`, `/lore-prod`). See below.

---

## It is read-only

`lore` inspects and documents. It never modifies the system it's reading.

No source edits — not even to fix a bug it spots. No `git commit`, `checkout`, `stash`
or `pull`. No dependency installs. No build, migration, test or seed commands. No calls
to the APIs your project integrates with. The only files it creates are `.lore/` and
`AGENTS.md`.

The reason is the output's whole value: a pass that changed something would describe a
system that no longer exists, and hand you a diff you never asked for. Anything broken
becomes a finding in `10-security.md` or `12-landmines.md`, and you decide.

A skill is instructions, not a sandbox — it cannot restrict the agent's tools, only
direct them. For a hard guarantee on a client's production repo, run it against a
throwaway clone.

### Access tiers

Code can't answer everything — a committed threshold may not be what production runs. So
`lore` can ask for more, and each tier reaching further out has its own gate:

| Tier | Reaches | Gate |
|---|---|---|
| **code** | the repo, its history, committed config | none; the default |
| **dev database** | live schema, constraints, lookup rows | `/lore-db` + target confirmation |
| **dev application** | the running app in a browser, signed in | `/lore-app` + **you** sign in |
| **production** | any production database or URL | `/lore-prod` + confirmation naming the host |

It **offers** escalation tied to a specific wall — "these thresholds are committed
defaults but a service reads them from a table at runtime; `/lore-db` would replace two
`[inferred ⚠]` lines with real values" — and a decline is a complete answer. The gap goes
to `11-open-questions.md` noting what access would close it.

**Dev is the default everywhere.** "The database" means dev. A host or database name
containing `prod`, `production` or `live` is production whatever you called it. Staging is
offered first every time, because for schema, constraints, enum contents and the URL
surface it answers identically with none of the risk.

**Production takes two separate acts of consent:** the typed `/lore-prod`, then a reply
naming the host back. A bare "yes" is deliberately not enough — that's the point of
asking for the host. There the rules tighten rather than relax: no row data at all,
`COUNT(*)` only, and no sign-in, because a session in production is a real session doing
real things.

**In the live app, navigation is read-only.** Follow links, read pages, observe
redirects. No form submissions, no buttons that create or change anything, no non-GET
requests. A documentation run that creates a record in a live system has broken the
read-only rule as surely as editing source would.

What that tier is *for*: the **observed** access matrix, which is often wider than the
route table implies. A page the code marks `[Authorize]` that renders anonymously is the
most valuable row in the document — and a security finding.

### It never asks for your credentials

`lore` will not ask you to type a password, API key or token into the conversation. Not
for a dev box, not for a throwaway account, not if you offer.

A credential pasted into a chat is in that transcript permanently: stored, synced across
your devices, visible to anyone with access to the conversation, and impossible to rotate
out afterwards. A tool that redacts the secrets it finds in your repo has no business
soliciting fresh ones in plaintext.

Instead: **you sign in to the app yourself**, and `lore` works in the session you
authenticated. It never sees the password, and you end the access by logging out.
Alternatively point it at a local file (`.env.development`) — it reads it, uses it, and
treats every value as `[REDACTED]` in all output.

Secrets found in your repo are `[REDACTED]` with the shape kept, because the shape is
useful: `sk_live_[REDACTED] (live key, 107 chars, .env.production:8)`.

## Optional tooling

`lore` works with nothing installed. It uses what's present and tells you what was
missing — it never installs anything itself.

| Tool | What it adds |
|---|---|
| `ast-grep` | Structural queries. Turns "is this enum value ever set?" from a reading exercise into something that holds at 2,000 files |
| `gitleaks` / `trufflehog` | Git **history** scanning — finds the key committed in March and deleted in April, which is still exposed |
| `scc` | Real file and complexity counts for the scope estimate |
| `tbls` | Schema constraints under `/lore-db`; check constraints are business rules written in SQL |
| `syft` + `osv-scanner` | Package versions, licences and CVEs as facts rather than recall |

Deliberately **not** used: embedding search (can't produce a `file:line` provenance tag,
and every claim needs one), whole-repo packers like repomix (the opposite operation —
`lore` exists because dumping everything into context doesn't work), and decompilers.

If your target is a binary with no source, `lore` has nothing to work with and the right
tool is [REA](https://github.com/morluto/rea). The division: REA recovers the code, lore
recovers the business from code.

---

## What it writes

| File | Contents |
|---|---|
| `AGENTS.md` | The digest that loads every session. Rules, glossary, landmines. No history. |
| `.lore/index.md` | Map of the folder, confidence counts, weakest areas |
| `01-business.md` | Purpose, who pays vs who uses, end-to-end flow, domain glossary |
| `02-roles.md` | Auth, roles, URL matrix, action-level permissions |
| `03-rules.md` | **The important one.** Invariants, state machines, calculations, temporal rules |
| `04-money.md` | Model, gateways, rounding, refunds, audit trail |
| `05-architecture.md` | Pattern *and where the code deviates from it*, components, conventions |
| `06-data-model.md` | Entities, enums in full, soft deletes, code↔DB drift |
| `07-integrations.md` | API surface, external services, webhooks, failure behaviour |
| `08-jobs.md` | Background work, and what breaks if it doesn't run |
| `09-infra.md` | Environments, CI/CD, how migrations are applied, who can deploy |
| `10-security.md` | Posture and 🚨 findings, hardcoded secrets first |
| `11-open-questions.md` | Every unconfirmed inference. **This file existing is a feature.** |
| `12-landmines.md` | Code that looks wrong but is deliberate. Read before changing anything. |
| `site/` | A guided-tour website — pick who you are and get walked through the app as that person experiences it, plus an architecture map. Open `index.html` by double-clicking it. |

### The guided tour

`.lore/*.md` is for an agent to grep. `site/` is for a **person to be walked through** —
a new developer on day one, a client who wants to understand what they paid for, a tester
who needs to know what each screen is meant to do.

It opens with **"who are you?"**. Each stop on a tour is one screen of the app and carries
four things:

- **What you see** — including what's *absent* for this persona that another would see
- **What you do** — the actions available
- **What happens behind it** — which service, which rules fire, what gets written or queued
- **Where you can go next** — the real navigation, so it's a path and not a list

That third one is what makes it documentation rather than a user manual.

**Personas come from your real access model, not a role list.** Access in real apps is
layered — a role, a scope like region or warehouse, often a level. So a persona is a
combination that behaves distinctly: *Warehouse Manager · one region · approval level 2*.
`lore` works the model out from the code first: the roles, the scopes, the levels, and how
they compose — including the bypasses.

It deliberately does **not** generate the cross product. Three roles × five regions ×
three levels is forty-five tours and nobody takes any of them. Scope changes *which
records* you touch rather than *what* you can do, so it's a stated rule inside the tour;
level usually does change behaviour, so it earns its own persona.

**`map.html`** is an architecture tree — hand-drawn SVG, no library — on every site, and
the front door when there's no UI. For a Windows service, API or batch job there are no
screens, so the tour follows the **data** instead: what arrives, what triggers each stage,
what rule applies, what's written, what happens when it fails.

**It borrows your app's design** if it has a UI — palette, type stack, logo copied in
locally — so the tour feels like your product. Two hard limits: no external requests ever
(a CDN font breaks the site offline and won't work in two years), and borrowing the design
mustn't borrow the credibility — every page carries the lore header and provenance legend,
so nobody mistakes a tour stop for the real app.

**Screenshots** only with `/lore-app`, only from dev, and only after looking at what's on
the screen: dev databases are often restored from production, so a dev screen can hold
real names and order amounts. A described screen with no PII beats a captured one with it.

**The visuals carry the weight, not the prose.** The access model, the scope rule, the
state machine as stages, route coverage as a proportional bar, any graded ladder — each is
a hand-drawn SVG with the text explaining the picture rather than repeating it. Every
persona gets its own icon. Things that are *absent* get marked visually — a role declared
but inert, an enum value nothing sets — because prose hides absence and a strike-through
does not.

It renders **from** the finished markdown rather than beside it, so the two can't drift.
Every claim keeps its citation, and `[inferred ⚠]` stays visually loud — a guess that
looks like a fact is more dangerous in a polished site than in plain markdown.

### Your access model, as it actually is

The most common failure in documenting who-can-do-what is treating access as a list of
roles. `lore` looks for all three dimensions:

- **Role** — declared, easy to find: enums, claims, policies, `[Authorize]` attributes
- **Scope** — which records you act on. **Usually not declared anywhere as a permission** —
  it lives in query filters like `Where(r => r.RegionId == user.RegionId)`, global filters
  and tenancy discriminators. Missing one of these is how a feature leaks one region's
  data into another.
- **Level** — graded authority within a role: approval level 1/2/3, threshold bands

Then how they **compose**: does a higher level inherit the lower ones? Is scope
hierarchical, so a regional manager sees every warehouse in their region? Can someone hold
several at once, and what wins? Which role escapes scoping entirely — that bypass is often
the most dangerous rule in the system. And the negative rules no role list can express:
"an approver cannot approve a requisition they raised."

If your app genuinely has two roles and no scoping, it says so plainly — that's valuable
too, because it tells an agent that adding a region filter would be a new concept here
rather than a pattern to imitate.

## Repo layout

```
.claude-plugin/marketplace.json   ← makes this repo a plugin marketplace
plugins/lore/
  .claude-plugin/plugin.json
  skills/lore/
    SKILL.md                      ← the skill (single source of truth)
    references/
      security.md                 ← DB gatekeeping, redaction, read-only, prod, credentials
      stack-detection.md          ← manifests, data stores, CI/CD per ecosystem
      output-template.md          ← content template for each .lore/ file
      access-escalation.md        ← the four access tiers and their gates
      access-model.md             ← discovering role × scope × level, not a flat list
      tour-site.md                ← the guided-tour site and architecture map
      tooling.md                  ← which tools earn their place, and why not the rest
bin/cli.js                        ← npx installer
install.sh / install.ps1          ← curl installers
```

Every install method copies from `plugins/lore/skills/lore`. Edit the skill in one place.

---

## Before you publish

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
