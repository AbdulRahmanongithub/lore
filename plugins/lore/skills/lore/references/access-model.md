# The access model — never assume flat roles

The most common mistake in documenting who-can-do-what is treating access as a list of
roles. Real applications almost never work that way. Access is usually a **combination**,
and a person's effective permissions come from all parts of it at once.

A realistic example: a warehouse manager, scoped to the South region, holding approval
level 2. All three matter. Change the region and they see different stock. Change the
level and the same button either works or doesn't. Document "Warehouse Manager" as a role
with a list of permissions and you have described nobody.

So before you write a single line about access, work out the model's **shape**.

## The three dimensions

**Role** — what kind of actor. Usually declared: an enum, a claim, a policy name, an
`[Authorize(Roles=...)]` attribute. This is the part that is easy to find, which is why
it's the part most documentation stops at.

**Scope** — which subset of the data they act on. Region, warehouse, department, branch,
cost centre, tenant, project, client. **Scope is usually not declared anywhere as a
permission.** It lives in query filters:

```csharp
_db.Requisitions.Where(r => r.DepartmentId == currentUser.DepartmentId)
```

That line is an access rule as real as any attribute, and no authorization declaration
mentions it. Hunt these deliberately: query predicates keyed off a property of the
current user, global query filters, multi-tenancy discriminators, row-level security
policies, `HasQueryFilter`, repository base classes that silently add a `WHERE`. An agent
that misses the scope filter will write a feature that leaks one region's data to
another — the single most common authorization bug there is.

**Level** — graded authority *within* a role. Approval level 1/2/3, seniority, a
threshold band, a grade column. Look for numeric comparisons against a user attribute,
an `ApprovalLevel` column, a chain or hierarchy table, and configuration that maps a
level to a limit.

## Composition is the thing to document

Having found the three, the question that matters is how they combine, and the answer is
rarely a simple AND:

- Does a higher level inherit the lower levels' permissions, or are they distinct?
- Is scope hierarchical? A regional manager may see every warehouse in their region, so
  the scope is a tree, not a flat value.
- Can one person hold several scopes, or several roles at once? What wins on conflict?
- Does any role escape scoping entirely — the global administrator who sees all regions?
  That bypass is a rule, and often the most dangerous one in the system.
- Is level checked against the *record's* attributes as well as the user's? ("Level 2 can
  approve up to ₹50,000 **in their own region only**.")
- Are there negative rules — things a role cannot do *despite* having the level? "An
  approver cannot approve a requisition they raised" is one, and no role list expresses
  it.

Write the composition down as rules with citations, not as prose. An agent needs to
evaluate them, not admire them.

## What goes in the output

In `02-roles.md`, document the model in this order — shape first, then the parts, then
the combinations:

1. **The shape**, in one or two sentences: *"Access is role × region-scope ×
   approval-level. All three are resolved at sign-in from the `Users` table and carried
   in claims."* `[code: ...]` A reader who gets only this sentence already understands
   more than a role list could tell them.
2. **Each dimension** — its values, where they're defined, how they're assigned, who can
   change them.
3. **The composition rules** — including inheritance, hierarchy, conflicts and bypasses.
4. **The effective-permission matrix** — but see the next section, because this is where
   documentation usually becomes useless.
5. **The negative rules** — what a combination cannot do despite appearing able to.

## Do not enumerate the cross product

Three roles × five regions × three levels is forty-five combinations. A table with
forty-five rows is not documentation; nobody reads it and nothing is learned.

Instead, collapse along the dimensions that don't change behaviour:

**Scope rarely changes *what* you can do, only *which records* you do it to.** So it
belongs as a single stated rule — "you see only your own region `[code: ...]`" — not as a
row per region. Five regions do not make five documented behaviours.

**Level usually does change behaviour materially**, so levels belong as distinct rows or
a short comparison.

So the matrix is **role × level**, with scope as a stated rule applying to all of it,
plus a separate row for every bypass. That's typically a handful of rows that teach
something, instead of dozens that don't.

Then name the **distinct personas** — the combinations that genuinely behave
differently, in the project's own words. "Warehouse manager, single region, level 2" is a
persona. "Warehouse manager, South region" and "Warehouse manager, North region" are the
same persona twice.

## How to discover it

Attributes alone will mislead you, because they only carry the role dimension. Work
through all of these:

1. **Role declarations** — enums, claims, policies, attributes, a roles or permissions
   table, seeded role rows.
2. **The sign-in path** — what gets resolved into the session or token. This is the most
   informative single place in the codebase for the access model, because whatever is put
   in the claims is what the app considers identity. Scope and level usually appear here
   first.
3. **Query filters** — the scope dimension, as described above. Grep for the current-user
   object appearing inside a `Where`, and for global or base-repository filters.
4. **Authorization logic beyond attributes** — handlers, policy implementations,
   `CanDoX()` methods, service-layer guards. The real rules live here, not in the
   attributes.
5. **Threshold and chain configuration** — where a level maps to a limit.
6. **The admin screens** — how roles, scopes and levels get *assigned* tells you what the
   model permits, including combinations the code allows but nobody intended.
7. **Tests** — authorization test names are frequently the clearest statement of the
   model that exists anywhere in the project.

With `ast-grep` present, the scope hunt is a query rather than a reading exercise, which
matters because scope filters are scattered across every repository and service in the
codebase and missing one is the failure mode.

## When the model really is flat

Some applications genuinely have two roles and no scoping. Say so plainly — *"Access is a
flat role check; there is no scoping or level dimension `[code: ...]`"* — and move on. The
instruction here is not to invent complexity, it's to not assume simplicity. State which
one you found, with evidence either way, because "there is no scoping" is itself valuable:
it tells an agent that adding a region filter would be a new concept in this system, not a
pattern to imitate.
