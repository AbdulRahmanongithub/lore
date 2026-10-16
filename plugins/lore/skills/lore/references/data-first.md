# Data first — think from the table

Screens come and go; the tables stay. In most business systems the database is where the
business actually lives: every rule ends as a column value, every workflow as a status
change, every integration as rows arriving from somewhere. A developer reverse-engineering
a system by hand learns this fast — they open the login screen, then go straight to the
`Users` table to see what can stop someone signing in.

So alongside the code-first sweep, run a **data-first** pass: start from each table and
work outward to everything that writes it, reads it, reacts to it, and shows it.

Read this in Phase 1, before services (step 7).

## 1. Every table, every side of it

For each table — from migrations, ORM models, `.sql` files, a database project
(`.sqlproj`, Flyway, Liquibase, DACPAC), or live introspection if the user agreed — record:

```
### Users                                   [code: Database/Tables/Users.sql]
Purpose:    one row per person who can sign in, including disabled ones
Written by: AccountController.Register → usp_User_Insert      [code: ...:44]
            usp_User_Disable (called by AdminService.Disable)  [code: ...:120]
            HR sync Windows service, nightly, from HR feed    [code: HrSync/Worker.cs:61]
            ⚠ also by hand: 3 rows have CreatedBy = 'sa'       [db] → open question Q-4
Read by:    usp_Login, usp_User_Search, 14 reports              [code: ...]
Reacts:     trg_Users_Audit → UsersAudit on update            [code: Triggers/...:3]
Shown in:   Admin › Users (grid), Profile page
Key flags:  see §2
```

Then build the **CRUD matrix** — tables down the side, every writer and reader across the
top (screens, endpoints, SPs, jobs, services, triggers, external systems), with C/R/U/D in
the cells. It goes in `06-data-model.md`, and it answers the two questions developers ask
most: "what touches this table?" and "what does this feature touch?". A table with readers
and no writer in the repo means data arrives from outside — §4.

## 2. Every flag, status and date that changes behaviour

Business logic hides in columns: `IsActive`, `IsLocked`, `IsDeleted`, `IsApproved`,
`Status`, `Type`, `ExpiryDate`, `PasswordChangedOn`, `FailedLoginCount`, `ValidFrom`,
`ValidTo`, `ProcessedFlag`, `RetryCount`, `LastRunAt`. For **every** such column:

| Column | Values and meaning | Set by | Checked by | Effect |
|---|---|---|---|---|
| Users.IsActive | 1 active, 0 disabled | usp_User_Disable; HR sync when employee leaves | usp_Login:31 | 0 → login fails, message "Account disabled" |
| Users.ExpiryDate | null = never | admin screen; contract users only | usp_Login:38 | past → login fails, "Account expired" |
| Users.FailedLoginCount | 0–n | usp_Login on bad password | usp_Login:25 | ≥ 5 → IsLocked = 1, no auto-unlock ⚠ |
| Users.PasswordChangedOn | date | ChangePassword | LoginService.cs:88 | > 90 days → forced to change-password page |

Find these by reading every `WHERE`, `IF`, `CASE` and `if` that mentions a column — in SPs,
queries, ORM filters and application code. A flag checked in the SP and again, slightly
differently, in the C# is a landmine: record both and the difference.

**Go exhaustive on the modules that gate everything.** Login, permissions, approvals,
posting, billing, closing a period: these routinely carry dozens or hundreds of
conditions. Enumerate every one. For login that means at least: user lookup (by what —
username, email, employee code, case-sensitive?), password check (algorithm, salt,
legacy hashes still accepted?), every flag above, lockout and unlock, expiry of account
and password, first-login forced change, concurrent-session rules, IP or time-of-day
restrictions, tenant or company selection, licence or seat counts, role and menu loading,
audit writes, and what each failure tells the user — including failures that show the
same message for different causes, which make support calls impossible to diagnose.

## 3. Stored procedures, functions, views, triggers

In SQL-heavy systems the SPs **are** the business layer. Treat each like a service method:

```
### usp_Order_Post                         [code: Database/Procs/usp_Order_Post.sql]
Called by:  OrderService.Post (C#), SQL Agent job "Nightly repost"  [code: ...]
Inputs:     @OrderId int, @UserId int
Reads:      Orders, OrderLines, Stock, Settings('AllowNegativeStock')
Rules:      R-21 status must be 'Approved' else RAISERROR 50010
            R-22 stock check skipped when AllowNegativeStock = 1
Writes:     Orders.Status = 'Posted', StockLedger insert, Stock update
Transaction: yes, with TRY/CATCH → rollback and re-raise        [code: ...:88]
Calls:      usp_Ledger_Insert, usp_Notify_Queue
Errors:     50010 not approved · 50011 insufficient stock → mapped in OrderService:140
```

Also: dynamic SQL (`EXEC(@sql)`, `sp_executesql`) — say what it can build, and flag
injection risk; cursors and loops over large tables; `NOLOCK` hints; cross-database or
linked-server calls (another system, always worth a landmine); SPs nothing calls (dead, or
called from outside the repo — ask).

**Triggers** are logic nobody sees from the application. List every one: table, event,
what it does, and whether it can fail the original write.

**Views** used by reports or integrations are contracts: changing a column breaks someone.

If SP and trigger source is not in the repo, it lives only in the database. Say so in
Phase 1's missing-sources list: this is the strongest reason to offer database access,
because reading definitions (`sys.sql_modules`, `pg_proc`, `ALL_SOURCE`) is read-only and
often doubles what the run can explain.

## 4. Where does this data come from? — follow it upstream, then ask

For every table, the question is not only "what does the app do with it" but "**how did
the rows get there**". The answer is one or more of:

- the application itself (a screen, an endpoint)
- an SP, trigger or job inside the database
- a service, worker or scheduled task in this repo
- **another system** — an HR feed, an ERP, a bank file, a partner API, an SSIS package, a
  replication job, a mainframe extract, a person with SQL Management Studio

The last group is invisible from the repo, and it matters most: a Windows service that
starts processing "when a row with Status = 'N' appears in InboundOrders" makes no sense
until you know who inserts that row.

So trace upstream as far as the repo allows, and where the trail ends **ask the user**,
with your best guess as an option. These go out with the Phase 2 questions as their own
group, because one answer often explains an entire subsystem:

```
Where does this data come from?

1. InboundOrders — the OrderPoller service processes rows with Status = 'N'
   [code: OrderPoller/Worker.cs:40], but nothing in this repo inserts them.
   ● An external system writes directly into the table (which one?)
   ○ A file import / SSIS package outside this repo
   ○ Another application of ours (which?)
   ○ I don't know — mark it as unknown
```

Ask about the tables whose source is unknown **and** that trigger behaviour — feed a
service, a job, money, or something a customer sees. A lookup table nobody writes is a
seed; mention it, don't ask.

An "I don't know" is a real answer: write it into `11-open-questions.md` and into the
table's entry as `Source: unknown [user]`, so the next person knows it was asked.

## 5. Consumers that react to data

Many systems are not driven by clicks at all. Find everything that **waits for data**:

- Windows services and daemons polling a table (`WHERE Status = 'N'`, `WHERE Processed = 0`,
  `TOP 100 ORDER BY CreatedOn`)
- SQL Agent jobs, cron, Windows Task Scheduler entries, Hangfire/Quartz schedules
- queue and topic consumers, Service Broker, change data capture, `SqlDependency`
- file watchers on a folder or FTP drop
- triggers that call out (`xp_cmdshell`, CLR, sp_send_dbmail)

For each, document the full lifecycle as a data journey: **what row or event starts it →
how it claims the work (and whether two instances can claim the same row) → what it does
→ what it writes back (status values in order) → what happens on failure (retry count,
error status, poison rows that block the queue forever) → how often it runs**. Status
values form a state machine; draw it in `03-rules.md`.

## 6. Diagnostics — from symptom to the row that explains it

The payoff of knowing every flag is being able to answer "some users can't log in" with a
checklist instead of a shrug. For each important failure, write the causes in the order
the code checks them, each with a **read-only query** the user can run to confirm it:

```
### User cannot log in                                    → F-1, R-3…R-9
Check in this order (the order usp_Login checks them):     [code: usp_Login.sql]
1. Does the user exist?   SELECT UserId FROM Users WHERE UserName = @u
                          (case-insensitive collation — "Ravi" = "ravi")
2. Disabled?              SELECT IsActive FROM Users WHERE UserName = @u   → 0
3. Locked?                SELECT IsLocked, FailedLoginCount ...            → 1 / ≥ 5
                          unlock: Admin › Users › Unlock (no auto-unlock)
4. Account expired?       SELECT ExpiryDate ...                            → < today
5. Password expired?      SELECT PasswordChangedOn ...                     → > 90 days
                          (user sees the change-password page, not an error)
6. No role for company?   SELECT * FROM UserCompanyRoles WHERE UserId = @id → none
All six show the same message "Invalid login" ⚠ — L-7
```

These go in `16-diagnostics.md`. The queries are for the developer to run; this skill
writes them and never runs them against anything but a database the user agreed to, and
never selects personal data itself (`security.md` §3).

## 7. Where this lands

| Finding | File |
|---|---|
| Table entries, CRUD matrix, flag catalogue | `06-data-model.md` |
| SP / trigger / view entries | `06-data-model.md` (objects), rules in `03-rules.md` |
| Status lifecycles of polled tables | `03-rules.md` (state machines), `08-jobs.md` |
| Data origin, including "unknown [user]" | `06-data-model.md`, `11-open-questions.md` |
| Symptom → cause → query | `16-diagnostics.md` |
