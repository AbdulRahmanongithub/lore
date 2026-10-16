# Access escalation — asking for more than code

Code alone cannot answer everything. A threshold read from `appsettings.json` is the
committed default, not necessarily what production runs. A role matrix read from
controller attributes is what the code declares, not what a user actually experiences
after login. When a gap like that matters, the honest move is to ask for the access that
would close it — and the asking has rules, because each tier reaches further outside the
repo than the last.

## The tiers

| Tier | Reaches | Gate |
|---|---|---|
| **T0 — code** | the repository, its history, committed config | none; this is the default |
| **T1 — dev database** | live schema, constraints, enum and lookup rows | one structured question naming the target |
| **T2 — dev application** | the running app in a browser, signed in | one structured question + the user signs in themselves |
| **T3 — production** | any production database or URL | two structured questions, the second naming the host |

## Human in the loop — how consent is asked

Access beyond the code is **offered by you and granted by the user through a structured
question**, not unlocked by a token the user has to know about. A user who has never read
this skill should still be asked, at the moment it would help, in a form they can answer
with one click.

Earlier versions required typed tokens (`/lore-db`, `/lore-app`, `/lore-prod`). The
reason was sound: in a long session "yeah go ahead" can refer to any of the last three
things discussed, and an inferred yes is neither deliberate nor auditable. A structured
question solves the same problem better — it names exactly one target, offers explicit
options, and the selected option sits in the transcript as the record of consent — and it
does not require the user to have memorised a command.

**What makes a question count as consent:**

- It is asked through the harness's structured-question tool where one exists (Claude
  Code's and Cowork's question tool, for instance), with selectable options.
- It names **one** target — masked host, database name, environment — and what you would
  do there. "Can I look at the database?" does not qualify; "Connect read-only to
  `orders_dev` on `db-dev.****.internal` (from `.env.development:3`)?" does.
- It says what the user gains, in concrete lines: which `[inferred ⚠]` claims become facts.
- **"Skip — continue from code only" is always an option**, and is the first option for
  production.
- **It names its shortcut.** The last line of every access question is the command
  for that tier, so the user learns it at the moment it is useful (see the table below).
- The answer is the selected option. Free text typed alongside it that changes the
  meaning ("yes but only staging") is treated as a new instruction, and you ask again
  about the new target.

**Without a structured-question tool**, ask in plain text with numbered options and accept
only a reply that selects one unambiguously — `1`, or the option's words. A bare "ok",
"sure" or "go ahead" is not an answer to a numbered question; ask once more, briefly.

**Shortcuts still work.** A user who types `/lore-db`, `/lore-app` or `/lore-prod` is
telling you up front that they want that tier. Treat it as permission to *ask* without
waiting for a finding — never as permission to connect. The target confirmation still
happens, every time.

**Tell the user the shortcuts exist.** Nobody should need to read this file to learn
them. Mention them at three points, once each per run, in one line — never as a lecture:

| When | What to say |
|---|---|
| Phase 0 scope block | `Shortcuts: /lore-db database · /lore-app running app · /lore-prod production — type one and I'll ask now; otherwise I'll ask when it would help` |
| Inside every access question, as its last line | `Tip: next time, type /lore-db to be asked about the database straight away.` — `/lore-app` for the app question, `/lore-prod` for both production questions. If the user typed the shortcut to raise this question, say `Asked because you typed /lore-db` instead. |
| Closing summary, if any tier was skipped or never offered | `To add the live schema later: say /lore-db and I'll ask which database.` — naming what it would improve |

Make clear every time that the shortcut **asks**, it does not connect: "type /lore-db
and I'll ask", never "type /lore-db to connect".

**One question per tier per run.** If the user picks Skip, do not ask again for that tier
in this run; the gap goes to `11-open-questions.md` with what access would close it.

Example — dev database, raised at the end of Phase 1:

```
Question:  Connect to the dev database for better results?
Context:   Found in .env.development:3 →  postgres on db-dev.****.internal / orders_dev
           I would read schema, constraints and lookup tables only — no customer rows,
           no writes. It would confirm the approval thresholds (2 lines in 03-rules.md)
           and the OrderStatus values (06-data-model.md), now marked [inferred ⚠].
Options:   ● Connect read-only to orders_dev (dev)
           ○ Use staging instead — I'll point you at its config
           ○ Skip — continue from code only
Tip:       next time, type /lore-db to be asked about the database straight away.
```

**Dev is the default everywhere.** When a user offers "the database" or "the site"
without saying which environment, assume dev and say so: *"I'll use the dev instance —
tell me if you meant something else."* Never infer production from an ambiguous answer.
A connection string or URL whose host, database name or subdomain contains `prod`,
`production`, `live`, or that resolves to a public customer-facing domain, is production
regardless of what the user called it, and T3 applies.

## Offer, don't demand

Escalation is something you offer when you hit a specific wall, naming the wall. A
generic request for more access is noise; a request tied to a finding is useful:

> `03-rules.md` has the approval thresholds as `[config: appsettings.json:2]` — 5000 and
> 50000. Those are the committed defaults, and `SettingsService.cs:40` reads the same
> keys from a `Settings` table at runtime, so production may differ. If I connect to the
> dev database I can read the actual rows and replace two `[inferred ⚠]` lines with
> `[db]` ones. *(followed by the structured question above)*

Say what you would learn and which lines would change. If the user declines, that is a
complete answer: the gap stays in `11-open-questions.md` with a note that it needs
database access, and the run continues. Never ask twice for the same access in a run.

## Credentials never enter the chat

This is the rule the rest of this file exists to protect.

**Never ask the user to type a username, password, API key or token into the
conversation.** Not for the dev app, not for a throwaway account, not when they offer.
A credential pasted into chat is in the transcript permanently: stored, synced across
devices, visible to anyone with access to the conversation, and impossible to rotate out
afterwards. This skill redacts secrets it finds in a repo (`security.md` §4) — asking
the user to hand over fresh ones in plain text would make that redaction theatre.

If the user offers credentials anyway, decline the paste and route to one of these:

**Preferred — the user signs in, you use the session.** The user opens the dev app in
the browser and logs in themselves. You then drive that already-authenticated session:
navigate, read pages, map the URL surface. You never see the password, and the user can
end the session by logging out. This is also how the browser tooling is designed to
work, so it is the path of least resistance as well as the safe one.

**Acceptable — a file you read but never echo.** The user points you at a local file
holding credentials (`.env.development`, a secrets file). Read it, use it, and treat
every value as `[REDACTED]` in all output and in every line you write to chat. Never
print it "to confirm I have the right one."

**Never** — a credential typed into the conversation, a credential in a commit you
create, or a credential written into `.lore/`.

## T2 — the dev application, in a browser

Ask the same way: one question naming the dev URL, what you would do (read-only
navigation), and what you would gain (the observed access matrix, screenshots). If the
user agrees, ask them to sign in themselves in the browser and tell you when they have.

```
Question:  Look at the running dev app for better results?
Context:   Found in .env.development:5 →  https://dev.orders.****.internal
           I would only follow links and read pages — no forms, no buttons that change
           anything. You sign in yourself; I never see your password. Signing in as an
           admin lets me see every screen, menu and setting, which gives the most
           accurate result.
Options:   ● Yes — I'll sign in as an admin (full access)
           ○ Yes — I'll sign in as a normal user
           ○ Skip — continue from code only
Tip:       next time, type /lore-app to be asked about the running app straight away.
```

### The admin session — maximum accuracy, no password in chat

An admin account sees everything: every menu, every screen, every settings page, every
lookup list. Read through an admin session, the app answers questions the code leaves
open — which settings are actually switched on, what the menus really contain, which
lookup values exist — so **offer admin first**.

But the admin password still never enters the conversation (§ Credentials never enter
the chat). If a user offers to type it, decline and explain in one line: *"Please sign in
as admin in the browser yourself — I'll read through that session. A password typed here
stays in the chat history."* Then wait for them to say they are signed in.

In an admin session, two extra cautions:

- **Admin screens are where the destructive buttons are.** Delete user, reset password,
  run job, purge, recalculate. Read-only navigation (below) matters more here than
  anywhere: open pages and read them; never press anything that acts.
- **Admin sees more than any other role.** What admin sees is not what a clerk sees.
  Use the session to learn what *exists*; take who-sees-what from the code and the access
  model. If the user can also sign in as one or two ordinary test users, offer that as a
  second pass for the persona tours — again, they sign in, you read.

With consent and a signed-in session, what you are mapping is the **real** URL
surface, which is frequently wider than the route table suggests: pages reachable that
the code implies are protected, redirects that reveal role boundaries, forms whose
validation differs from the server-side rules you read.

**Read-only navigation only.** Follow links, read rendered pages, observe redirects and
status codes. Do **not** submit forms (the sign-in the user performs is theirs, not
yours), click buttons that create, update or delete anything, trigger exports or emails,
or call API endpoints with anything but GET. A documentation pass that creates a test
record in a live system has broken P0 just as surely as editing source would.

If you are unsure whether an action writes — a link styled as a button, a POST behind a
GET-looking URL — do not take it. Record it in `11-open-questions.md` instead.

What goes in the output: the page inventory, the access matrix as *observed* rather than
as declared, and any divergence between the two. A page the code marks `[Authorize]`
that renders anonymously is a security finding for `10-security.md`, and one of the most
valuable things this tier produces.

## T3 — production, two steps and a stated reason

Production access is the only thing in this skill that can affect people who are not in
the conversation. Customers' data lives there. So it takes two separate acts of consent,
and neither substitutes for the other.

Consent given for dev never carries over: agreeing to the dev database or dev app says
nothing about production, and a target you discover is production (§ The tiers) moves to
this section even if the user thought they were offering dev.

**Step one — do you want production at all?** Ask only when there is a stated reason
staging cannot answer (row counts, drifted data, a hand-edited config row). Skip is the
first option:

```
Question:  Production access — needed for <the specific reason>?
Options:   ● Skip — continue without production
           ○ Use staging instead
           ○ Yes, I want to connect to production (read-only)
Tip:       /lore-prod raises this question any time — both steps still apply.
```

**Step two — confirm the exact host.** Only after a yes in step one. Show the masked
target and ask a second question whose only "proceed" option names the host:

```
⚠️  PRODUCTION ACCESS REQUESTED

  Target:   cityneedsyou-prod.****.ap-south-1.rds.amazonaws.com
  Database: ****_production
  User:     app_****
  Password: [REDACTED]
  Source:   appsettings.Production.json:14

  This is PRODUCTION. Real customer data.

  What I would do:    read-only schema introspection, constraints, and
                      enum/lookup table contents. No row data. No writes.
  What I would gain:  <the specific lines this would confirm>
  Safer alternative:  a staging instance, if one exists, gives the same schema

Options:  ● Cancel — do not connect
          ○ Connect read-only to PRODUCTION: cityneedsyou-prod.****.ap-south-1
Tip:      /lore-prod raises this question any time — both steps still apply.
```

Then **wait**. Only selecting the option that names the production host is consent.
Cancel, a dismissed question, an ambiguous reply, a reply that changes the subject, or
silence all mean no. Without a structured-question tool, require a reply containing the
word PRODUCTION and the host — a bare "yes" is not consent at this tier, because naming
the host back is the whole point of the second step.

**Always offer staging first.** For almost everything this skill wants — schema,
constraints, enum contents, the URL surface — staging answers identically with none of
the risk. Say so in the warning. The cases where production genuinely differs are worth
naming out loud: row counts for scale, data that drifted before a migration, a config
row someone changed by hand. If none of those is what you need, you do not need
production.

**In production, the read-only rules tighten rather than relax.** No row data at all,
not even a `SELECT TOP 1` to "check the shape". `COUNT(*)` is permitted. On a production
URL, navigation only — no sign-in at all, since a session in production is a real
session doing real things. If a finding requires logging in, that is a dev task.

Record in the output that production was accessed, when, and what was read. Someone
auditing this later should not have to reconstruct it from a chat transcript.
