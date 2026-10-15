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

### Claude.ai and the desktop app

Download `lore.skill` from [Releases](https://github.com/AbdulRahmanongithub/lore/releases) and
upload it in Settings → Capabilities → Skills.

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

**Database access** is the one thing that needs a typed token. See below.

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

### Database access needs a typed token

Live databases are gated behind `/lore-db` in your message, and that is deliberately
*not* conversational. In a long session "yeah go ahead" can refer to any of the last
three things discussed; a typed token is unambiguous, deliberate, and sits in your
transcript as evidence of when you granted it.

Two steps, both required:

1. Your message contains `/lore-db`
2. It shows you the masked connection target and asks again before connecting

Then it runs schema introspection only — tables, columns, FKs, indexes, constraints,
enum and lookup contents. Never your rows, never a write, never DDL.

Without the token it still reads migration files, ORM models and entity classes, and
says in the output that the schema came from code rather than a live connection.

Secrets are `[REDACTED]` before anything reaches chat or disk, with the shape kept
because the shape is useful: `sk_live_[REDACTED] (live key, 107 chars, .env.production:8)`.

---

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

Every line carries a provenance tag — `[code: path:line]`, `[config: …]`, `[user]`,
`[inferred ⚠]` — so an agent can tell fact from guess at a glance. An unmarked guess
gets treated as ground truth and propagates into code, which is the failure this whole
design exists to prevent.

---

## Repo layout

```
.claude-plugin/marketplace.json   ← makes this repo a plugin marketplace
plugins/lore/
  .claude-plugin/plugin.json
  skills/lore/
    SKILL.md                      ← the skill (single source of truth)
    references/
      security.md                 ← DB gatekeeping, redaction, read-only rules
      stack-detection.md          ← manifests, data stores, CI/CD per ecosystem
      output-template.md          ← content template for each .lore/ file
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
