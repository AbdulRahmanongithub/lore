# HTML documentation

`.lore/` is written for an agent to grep. The HTML is written for a **person** to read:
a new developer on their first day, a client who wants to know what they bought, a
reviewer who will never open a terminal.

Same facts, different reader. That difference decides every choice below.

## One source of truth

**Generate the HTML from the markdown, never alongside it.** Write the `.lore/` files
first, completely, then render. If you author the two separately they drift within one
revision, and a documentation set that contradicts itself is worse than either half
alone — the reader has no way to tell which is stale.

So the HTML adds no new facts. If something belongs in the HTML, it belongs in a `.lore/`
file first, and the HTML shows it.

## Where it goes

```
.lore/
└── html/
    ├── index.html          ← what this app is, who uses it, how it works
    ├── pages.html          ← every URL and page, with the access matrix
    ├── rules.html          ← business rules, state machines, calculations
    ├── data.html           ← entities, enums, relationships
    ├── operations.html     ← jobs, integrations, environments, deployment
    └── assets/
        └── style.css
```

Six pages, not thirteen. The markdown split is for grepping; a human reading wants fewer,
longer pages with a clear spine. Collapse `01`–`02` into `index`, `03`–`04` into `rules`,
`06` into `data`, `07`–`09` into `operations`, and route `10`–`12` into whichever page
they belong to, flagged.

Open `index.html` from disk with a double-click. No server, no build step.

## Self-contained, always

**No external requests.** No CDN scripts, no Google Fonts, no remote images. One local
stylesheet, system font stack, inline SVG if a diagram helps. Three reasons, each
sufficient on its own: this documentation describes a client's system and may be read on
an air-gapped machine; a CDN link is a third party learning which internal systems exist;
and a page that breaks offline in two years is not documentation.

Use a system font stack (`-apple-system, Segoe UI, Roboto, sans-serif`), a readable
measure (~70ch), and `prefers-color-scheme` for dark mode. Keep the stylesheet under a
few hundred lines. This is a reference document, not a showcase — legibility over
styling.

## The pages

### `index.html`

What a newcomer needs in the first five minutes.

- **What this application is** — two or three sentences, no jargon
- **Who uses it** — each role, what they do, and that *who pays and who uses are often
  different people*
- **How it works** — the end-to-end happy path as a numbered sequence; a small inline
  SVG flow diagram if it genuinely clarifies, skipped if not
- **Vocabulary** — the terms whose meaning here differs from their everyday meaning.
  Put this high on the page, not in an appendix. It is the single highest-value thing a
  newcomer can read, because it is what everyone else in the team already knows and
  will never think to explain.
- **The five things not to get wrong** — each linking to the page that explains it

### `pages.html` — the URL and access inventory

The page the user specifically wants, so give it room.

One table, one row per page or endpoint:

| URL | Method | What it does | Who can reach it | Source |
|---|---|---|---|---|
| `/requisitions` | GET | list, scoped to the user's department | Requester, Approver, Director, SuperAdmin | `[code: RequisitionController.cs:6]` |
| `/requisitions/{id}/close` | POST | releases the budget line; terminal | **SuperAdmin only** | `[code: RequisitionController.cs:12]` |

Rules that make this table worth reading:

- **Sort by URL, not by file.** The reader is navigating the app, not the codebase.
- **Mark the dangerous ones.** A row that deletes, releases money, or cannot be undone
  gets visually flagged. Someone skimming this table should see those without reading.
- **Include what is *not* protected.** A page with no authorization attribute is a row,
  and an important one. Blank is ambiguous; write "anonymous" and flag it.
- **Separate declared from observed.** When the live app was mapped (tier T2, see
  `access-escalation.md`), add an *Observed* column. A page the code marks `[Authorize]`
  that renders anonymously is the most valuable row in the document — and a finding.
- **Permissions that are not URL-shaped go underneath**, as prose: "an Approver cannot
  approve a requisition they raised" with its citation. A table cannot express those,
  and they matter as much as the table does.

### `rules.html`

The invariants, state machines and calculations from `03-rules.md` and `04-money.md`.

State machines as a table of transitions plus, where it earns it, a small inline SVG.
**Show illegal transitions explicitly** — a reader needs to know that `Closed → Approved`
has no path anywhere in the system, and absence is invisible unless stated.

Calculations get a worked example with real numbers. A formula with rounding mode stated
but never demonstrated is a formula people get wrong.

### `data.html`

Entities, their relationships, enums transcribed in full with meanings. Mark any enum
value no code path sets — that is a removed feature or manual database edits, and either
way the reader should know.

### `operations.html`

Jobs with schedules and what breaks if they do not run. Integrations and failure
behaviour. Environments. Deployment, stated honestly: if it is manual FTP, write manual
FTP.

## Provenance survives the rendering

**Every claim keeps its citation.** The HTML is a different presentation of evidence, not
a break from it. Render each tag as small muted text after the claim — `appsettings.json:2`
— and keep the legend on every page.

`[inferred ⚠]` must stay visually obvious. A guess that looks like a fact in a polished
document is more dangerous than the same guess in a plain markdown file, because the
polish lends it authority. Give it a distinct colour and a marker, and say in the legend
what it means.

## Secrets, redacted here too

Everything in `security.md` §4 applies to the HTML exactly as it does to chat and to
markdown. An HTML file is more likely to be emailed, shared, or committed to a wiki than
a markdown file in a dot-directory — so the shape stays, the value never does:

```
STRIPE_SECRET_KEY = sk_live_[REDACTED]   (live key, 107 chars, .env.production:8)
```

Never put a connection string, a password, or a token in these pages, even masked to
what looks like harmlessness. Host names and database names are fine; credentials are
not.

## Header every page

```
lore v1 · {project} · generated {date} · source {repo}@{sha}
confirmed {n} · inferred {n} · open questions {n}
```

The counts belong on the page a person reads, not only in the agent's index. A reader
who knows that 40 of 180 claims are inferred reads the document correctly. One who does
not, does not.

## What not to build

No search box, no filtering, no tabs, no collapsible trees, no JavaScript framework. A
reader uses Ctrl-F. Every interactive feature is a thing that can break, and none of them
makes the content more correct.

No "last updated" that is not the generation date. No coverage or completeness
percentages beyond the confidence counts — they invite being read as quality scores.
