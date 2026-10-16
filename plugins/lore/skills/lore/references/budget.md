# Budget — time and tokens

A full run on a large system is expensive, and the person paying should know before it
starts, choose how much to spend, and see afterwards what it cost. This file covers how
to estimate, how to let the user choose, how to spend fewer tokens without reading less,
and what to report.

Read this in Phase 0, right after building the inventory.

## 1. Estimate before reading

You cannot know the exact figure in advance, and you cannot read the harness's meter.
You **can** measure the source exactly, and turn that into an honest range.

**Measure** from the inventory (`deep-read.md` §1), after the skip list:

```bash
git ls-files -z | xargs -0 wc -c      # or a directory walk outside git
```

Sum bytes per kind (`ui`, `api`, `service`, `data`, `job`, …). Exclude lockfiles,
generated code and vendored folders — they are skipped or extracted by script (§3), never
read. Then:

| Quantity | Rule of thumb |
|---|---|
| Source tokens **S** | bytes ÷ 3.5 for code and SQL; bytes ÷ 4 for prose and markup |
| Reading, total processed | **3 × S to 6 × S** — tool framing, the context each step carries, targeted re-reads. Lower end with fan-out and notes on disk (§3), upper end single-pass on a tangled codebase |
| Fixed overhead | ~60k (skill, references, Phase 0–2 conversation) + ~20k per sub-agent |
| Writing `.lore/` + `AGENTS.md` | ~0.1 × S, minimum ~40k |
| Website | ~30–80k with a generator script (§3.6); 3–5× that if every page is hand-written |
| Time | ~1–2 min per 10k lines of logic code in one pass; fan-out divides that by the number of parallel shards (up to ~4 in practice), plus ~10–20 min for writing and the site |

These are starting points, not promises. Always show a **range**, say it is an estimate,
and say most of the reading total is usually served from the prompt cache, which bills
lower than fresh input — but do not quote prices (`deep-read.md` §7: never a price from
memory).

**Calibrate from history.** If `.lore/index.md` has run stats from an earlier run (§5),
use the real figures from it instead of the rules of thumb, scaled by how much changed.
A second estimate on the same repo should be much closer than the first.

## 2. Let the user choose — before spending

Show the estimate in the scope block:

```
  Budget:    source ≈ 1.9 MB · ~540k tokens of code across 412 files
             full run ≈ 1.7M–3.3M tokens processed · ~35–60 min (4 shards)
```

If the full run is large — more than ~1M tokens processed, or more than ~30 minutes — do
not just start. Ask one structured question with the cost of each option attached:

```
Question:  This is a large codebase. How much should I read?
Options:   ● Full — every file, all of .lore/, the website
             ≈ 1.7M–3.3M tokens · ~35–60 min
           ○ Focused — only the modules you name, plus what they touch
             ≈ 300k–700k tokens · ~10–20 min  (tell me which modules)
           ○ Full, without the website — add it later on request
             ≈ 1.6M–3.1M tokens · ~30–50 min
           ○ Quick look — single pass, no questions, everything marked unverified
             ≈ 150k–300k tokens · ~5–10 min
```

Below the threshold, show the estimate and start; asking would cost more attention than
it saves. A user who said "just a quick look" or named a module already chose — skip the
question.

A **focused** run still writes a complete `.lore/` shape; files outside the focus say
`Not read in this run — focused on <modules> [scope]` rather than being left empty, and
`coverage.md` shows exactly what was skipped and why. A later run can extend it.

## 3. Spend less without reading less

P6 says every file is read. These keep that true while cutting what it costs.

**3.1 Read once, note immediately.** After reading a file, write its findings — already
tagged — to the working notes outside the repo before opening the next. Re-open a file
only for a specific line you need to cite, with an offset and limit, never in full. Most
wasted tokens in a long run are files read twice because the first reading fell out of
context.

**3.2 Extract, don't read, machine-made files.** Lockfiles can be larger than the whole
codebase. Pull resolved versions with a script (`node -e`, `python -c`, `jq`) that prints
`name version` lines for direct dependencies only. Same for large generated JSON, OpenAPI
dumps, `.resx` resource files and SQL data inserts: query them for what you need.

**3.3 Read one, diff the rest.** When many files follow a template — fifty CRUD
controllers, a hundred near-identical SPs, generated repositories — read two or three in
full, then compare each remaining file against them (`git diff --no-index`, or a
structural comparison) and read only the differences. Record in `coverage.md`:
`full (template diff vs OrdersController.cs)`. The deviations are where the business
rules are anyway.

**3.4 Locate, then read.** Use `rg -l`, `rg -c` and `ast-grep` to find which files matter
for a question before opening any. Cap command output (`| head -100`) and count before
listing. A grep that prints 4,000 lines into context costs more than reading the file.

**3.5 Brief sub-agents, don't clone yourself.** Give each sub-agent a compact shard brief
— its file list, P0–P7 and the tag rules in a few hundred words, the exact return format —
not this whole skill and its references. Ask for findings as tagged lines, no prose. The
main run spends its context on merging, not on re-reading what sub-agents already read.

**3.6 Generate the site, don't type it.** Hand-writing every HTML page is the most
output-heavy part of a run, and output tokens are the slowest and costliest. Instead,
write one small generator — Python or Node, whichever the machine has — in the scratch
directory **outside the repo**, that turns the finished `.lore/*.md` into the pages, the
search index and the shared CSS/JS. Hand-write only what a script cannot: the SVG
diagrams and persona icons. The generator writes only into `.lore/site/`, which keeps P0
intact. If neither runtime exists, fall back to writing pages directly and say so.

**3.7 Load references lazily.** Read each reference file at the phase that names it, and
only the parts that apply: from `app-types.md`, the sections for the types you detected;
skip `access-escalation.md` entirely if no live access is offered.

**3.8 Updates read only what changed.** `coverage.md` records each file's git blob hash
(`git ls-files -s`). On an update, re-read only files whose hash changed or that are new,
plus the files the CRUD matrix and change map say depend on them; carry every other
finding forward. A monthly update on a stable system should cost a small fraction of the
first run — say so in the estimate.

## 4. While running

For runs estimated over ~30 minutes, give a one-line progress note at each phase or
shard boundary: `Read 180 of 412 files (api, services done) · ~20 min left`. Never go
silent for an hour.

If the run is heading well past the upper estimate — a shard far larger than expected,
a codebase much more tangled than it looked — stop at the next boundary, say so with a
revised range, and ask whether to continue, narrow to a focus, or finish with what you
have. Running 3× over budget without telling the user is the failure this section exists
to prevent.

## 5. Report after

Close the run with what it actually took, and record it in `.lore/index.md` so the next
estimate is calibrated:

```
## Run stats
Mode: full · 4 shards · 2026-10-16
Read: 412 files in full, 6 by template diff · 1.9 MB of source (~540k tokens)
Estimated processed: ~2.1M tokens (range given beforehand: 1.7M–3.3M)
Wall time: ~42 min
Next update: re-reads only changed files — likely 5–15% of this run
```

Be clear which numbers are measured (files, bytes, time) and which are estimated
(tokens). For the exact token count, point the user at their harness's own usage view —
in Claude Code, `/cost` — rather than presenting your estimate as the meter reading.

## 6. Tell the user how to spend less

When the estimate is large, one line on the levers they control:

- **Focus** on the modules they care about now; extend later.
- **Skip the website** for now; it can be generated from the finished `.lore/` any time.
- **Install `ast-grep` and `scc`** — structural queries and exact counts replace a lot of
  reading (`tooling.md`).
- **Commit `.lore/`** — every later update reads only what changed since.
