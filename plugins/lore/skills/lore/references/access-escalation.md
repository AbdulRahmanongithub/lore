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
| **T1 — dev database** | live schema, constraints, enum and lookup rows | typed `/lore-db` + target confirmation |
| **T2 — dev application** | the running app in a browser, signed in | typed `/lore-app` + the user signs in themselves |
| **T3 — production** | any production database or URL | typed `/lore-prod` + two-step confirmation |

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
> keys from a `Settings` table at runtime, so production may differ. If you send
> `/lore-db` I can read the actual rows and replace two `[inferred ⚠]` lines with
> `[db]` ones.

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

With `/lore-app` and a signed-in session, what you are mapping is the **real** URL
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

**Step one — the typed token.** The user's message contains `/lore-prod`. Without it you
do not touch production, no matter how clearly they seem to want it, and no matter that
they already sent `/lore-db` or `/lore-app` — those authorize dev.

**Step two — confirmation naming the target.** Show the masked target and require a
reply that names the environment back to you:

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

  To proceed, reply with the word PRODUCTION and the host above.
  Anything else, including "yes" or "go ahead", I will treat as a no.
```

Then **wait**. A bare "yes" is not consent at this tier — that is the entire point of
asking for the host back. An ambiguous reply, a reply that changes the subject, or
silence all mean no.

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
