# The tour site

`.lore/*.md` is written for an agent to grep. The site is written for a **person** to be
walked through: a new developer on day one, a client who wants to understand what they
paid for, a tester who needs to know what each screen is supposed to do.

It is not a reference manual with a nicer font. It is a **guided tour**: you pick who you
are, and it walks you through the application as that person experiences it.

## One source of truth

**Render the site from the finished markdown, never alongside it.** Write `.lore/*.md`
completely first, then generate. Authored in parallel the two drift inside a single
revision, and a documentation set that contradicts itself is worse than either half,
because the reader cannot tell which side is stale. The site introduces no fact that is
not already in a markdown file, and every claim keeps its citation.

## Structure

```
.lore/site/
├── index.html              ← "who are you?" — the personas, from the real access model
├── tours/
│   ├── <persona>.html      ← one guided journey per persona
│   └── ...
├── map.html                ← architecture tree / mind map
├── reference.html          ← the dense material: rules, data, operations
└── assets/
    ├── style.css
    ├── theme.css           ← extracted from the app's own design, if it has one
    └── shots/              ← screenshots, only with dev app access
```

Opens from disk with a double-click. No server, no build step, no JavaScript framework.

## `index.html` — who are you?

The landing page asks the reader to pick a persona, and the personas come from the
**real** access model, not from a role list. Read `references/access-model.md` before
writing this page; it is the file that decides whether this site is useful or misleading.

Access in real applications is layered — a role, a scope such as region or warehouse, and
often a level. A persona is a combination that **behaves distinctly**:

> **Warehouse Manager · one region · approval level 2**
> Sees stock for their own region only. Can approve transfers up to ₹50,000 within that
> region. Cannot approve a transfer they raised.

**Do not generate one tour per combination.** Three roles × five regions × three levels
is forty-five tours and nobody takes any of them. Collapse along the dimension that does
not change behaviour: scope changes *which records* a person touches, not *what* they can
do, so it belongs as a stated rule inside the tour — "you see only your own region
`[code: ...]`" — rather than as five separate tours. Level usually does change behaviour,
so it earns separate personas or an explicit comparison inside one.

Also on this page: the **shape** of the access model in one sentence, and a link to the
effective-permission matrix in `reference.html`. A reader who understands the shape can
reason about combinations the tour does not cover.

Name personas in the project's own words. If the code and the team say "Approver L2", the
page says Approver L2, not "Mid-tier Approval Authority".

## `tours/<persona>.html` — the journey

One page per persona, in the order that person actually encounters the app: sign-in,
landing page, the main task, the edges. Each **stop** is one page or screen of the
application, and carries four things:

**What you see** — the screen in that persona's terms. What is on it, what is absent for
*this* persona that another one would see. Absence is as informative as presence: "the
Close button is not rendered for you `[code: ...]`" tells a reader more than a permission
table row.

**What you do** — the actions available, and what each one starts.

**What happens behind it** — the part no user could know and every developer needs: which
service handles it, which rules fire, what gets written, what gets queued, what email
goes out. This is where the tour stops being a user manual and becomes documentation.

**Where you can go next** — the real navigation, so the tour is a path rather than a list
of screens.

Then, where they apply:

- **Rules that fire here**, each citing `rules` in `reference.html`
- **What changes with scope or level** — the one-line callout that replaces generating
  separate tours
- **Landmines** — if this screen is one you must not change carelessly, say so here,
  where someone about to change it is actually looking

End each tour with the handful of things that persona can do that nobody else can. That
list is what someone briefing a new team member reads out loud.

## `map.html` — the architecture tree

An additional view on every site, and the **main** view when there is no UI.

A tree or mind map of the system: components, how requests flow through them, where the
data stores sit, what the background jobs touch, which integrations hang off which
service. Inline SVG, drawn by hand — no diagramming library, no CDN.

Keep it honest about depth. A readable tree of fifteen nodes that shows the real request
path beats a hundred-node graph nobody can follow. If the system is genuinely large,
draw the top level and link to per-component trees rather than cramming it.

Where the code deviates from the stated architecture, mark the deviation **on the
diagram**. "Clean architecture, except the reporting module queries the database straight
from the controller" is exactly the kind of thing a diagram can show in one glance and
three paragraphs of prose cannot.

## No UI — follow the data instead

A Windows service, a web service, an API, a batch job, an ETL pipeline: there are no
screens, so there is no "what you see". Replace the role tour with a **data journey** and
make `map.html` the front door.

A stop in a data journey is a stage in the pipeline: what arrives, what triggers this
stage, what rule or transformation applies, what is written, what moves on, what happens
when it fails. Personas still exist where they make sense — an API has callers with
different scopes and keys — but the spine of the site is the flow, not the navigation.

Plain, clean styling here. There is no app design to borrow.

## Using the app's own design

If the application has a UI, the tour should feel like the product rather than like a
generic report. Extract from its own stylesheets and assets:

- the colour palette (CSS custom properties, Sass or Tailwind config, theme files)
- the type stack as declared
- the logo and favicon — **copied** into `assets/`, never hotlinked

Write what you find into `assets/theme.css` as custom properties that `style.css`
consumes, so the tour's own layout stays intact and only the skin changes.

Two constraints that do not bend:

**No external requests, ever.** If the app loads a webfont from a CDN, you do not. Name
the font first in the stack and fall back to system fonts; a tour that needs the network
breaks offline, leaks which internal systems exist to a third party, and will not work in
two years. Note in the output which font the app actually uses, so a reader knows why the
rendering differs slightly.

**Borrowing the design must not borrow the credibility.** The site carries the lore header
and the provenance legend on every page. It should look like the product's documentation,
never like a page of the product itself — nobody should mistake a tour stop for the real
application.

If extracting the design would be guesswork — no stylesheet, obfuscated build output,
only a compiled bundle — use the default styling and say so. Invented brand colours are
worse than neutral ones.

## Screenshots

Only with dev application access (tier T2 in `references/access-escalation.md`), and only
from **dev**. Never production, under any circumstance — a production screenshot is a
snapshot of real customers' data, and it would sit in a file destined for a wiki.

**Dev data is not automatically safe.** Dev databases are frequently restored from
production, so a dev screen can hold real names, addresses, order amounts and emails.
Before capturing a screen, look at what is on it. If it shows anything that looks like a
real person's data, do not capture it — describe the screen in words instead, and note in
the output that the screenshot was skipped and why. A described screen with no PII is
strictly better than a captured one with it.

Capture the empty and populated states of the same screen where they differ meaningfully,
crop to the relevant region, and keep them in `assets/shots/`. Screenshots are
supplementary: the tour must read correctly with every image missing, because that is how
it will be read whenever the capture step was skipped.

## Provenance survives the rendering

Every claim keeps its tag, rendered as small muted text after the claim. The legend sits
on every page.

`[inferred ⚠]` must stay visually loud — distinct colour, visible marker, explained in the
legend. A guess that looks like a fact is more dangerous in a polished site than in a
plain markdown file, because the design lends it an authority it has not earned. The same
goes for the confidence counts in the header: a reader who knows 40 of 180 claims are
inferred reads the whole site correctly, and one who does not, does not.

## Secrets

Everything in `security.md` §4 applies here, and more strictly, because a site is far more
likely to be emailed, zipped or pasted into a wiki than a markdown file in a dot
directory. Host names and database names are fine. Connection strings, passwords, keys and
tokens never appear — not masked, not partial, not "for completeness". And nothing in
`assets/shots/` may show a credential on screen, including a pre-filled login form.

## Header every page

```
lore v1 · {project} · generated {date} · source {repo}@{sha}
confirmed {n} · inferred {n} · open questions {n}
```

## What not to build

No search, no filtering, no tabs, no collapsible trees, no framework, no analytics. The
reader uses Ctrl-F. Every interactive feature is something that can break, and none makes
the content more correct.

No completeness or coverage percentages beyond the confidence counts — they get read as
quality scores. No "last updated" that is not the generation date.
