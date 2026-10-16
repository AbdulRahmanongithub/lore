# Every kind of application

lore is not a web-app tool. The same questions apply to every system — what starts it,
where the rules live, what data it touches, how it fails, how you see that it failed —
but where the answers sit changes completely by type. Detect the type of **each
component** in Phase 0 (a real system is usually several: a web app, two Windows
services, forty SPs and an SSIS package), then use the matching playbook below.

For each type: **starts** (what makes code run), **logic** (where rules live), **look
for**, **the tour follows**, **logs**.

## Web — SPA + API, server-rendered MVC, classic ASP / WebForms / JSP / PHP

- **Starts:** HTTP requests; also background hosted services inside the web process.
- **Logic:** controllers/handlers and services; in older stacks, code-behind
  (`.aspx.cs`), `Page_Load`, postback handlers and inline SQL — read those as carefully
  as a service layer.
- **Look for:** route tables, filters/middleware, session usage, ViewState, global.asax
  `Application_Start`, `web.config` transforms per environment.
- **Tour follows:** screens per persona.
- **Logs:** app logs, IIS logs (`%SystemDrive%\inetpub\logs\LogFiles`), Windows Event Log,
  hosting platform logs.

## Desktop — WinForms, WPF, Delphi, VB6, Java Swing, Electron

- **Starts:** user actions on forms; also timers on forms — easy to miss and often doing
  real work.
- **Logic:** frequently **inside the form**: button click handlers, grid events, validation
  in `Leave`/`Validating` events, SQL built in the form. Treat each form like a screen and
  each handler like an endpoint.
- **Look for:** `Program.Main`/`App.xaml`, the menu or ribbon definition (it is the route
  table), the connection string (often in `app.config` or the registry, sometimes per
  user), local files or SQLite/Access databases, auto-update mechanisms, printing and
  report definitions (Crystal, RDLC, FastReport — they hold logic too).
- **Tour follows:** forms per persona, opened from the menu.
- **Logs:** local log files (`%AppData%`, `%ProgramData%`, next to the exe), Event Log,
  often none — say so.

## Windows services, Linux daemons, background workers

- **Starts:** a schedule, a polling loop, a queue message, a file arriving, a table row
  appearing — **never** a user. The trigger is the most important fact about the service.
- **Logic:** `OnStart`/`ExecuteAsync`/`Run` → the loop → the processing method.
- **Look for:** the poll interval and query (`data-first.md` §5), how work is claimed,
  concurrency (can two instances run?), what happens on `OnStop` mid-batch, service
  account and its permissions, install scripts (`sc create`, installers, `topshelf`,
  `systemd` units), recovery options.
- **Tour follows:** the **data journey** — what arrives, from where (ask if the source is
  outside the repo), each stage, each status, each failure.
- **Logs:** Event Log (source name from the code), log files, and the status/error
  columns the service writes back to its tables — often the only real log.

## Console apps, batch jobs, scheduled tasks, scripts

- **Starts:** Task Scheduler, cron, SQL Agent CmdExec steps, a CI job, a person.
- **Logic:** `Main` and whatever it calls; arguments change behaviour — document every
  argument and flag.
- **Look for:** who schedules it and when (the schedule is usually outside the repo — ask),
  exit codes and what reads them, idempotency (what happens if it runs twice, or not at
  all), input and output files and folders.
- **Tour follows:** the data journey, one run start to finish.
- **Logs:** stdout redirected somewhere, log files, the scheduler's own history.

## Database-centric — stored procedures, SQL Agent, SSIS, Oracle packages

- **Starts:** calls from applications, SQL Agent schedules, triggers, Service Broker,
  SSIS package executions.
- **Logic:** SPs, functions, triggers, packages, SSIS data flows and script tasks — the
  whole of `data-first.md`.
- **Look for:** `.sqlproj`/DACPAC, `.dtsx` packages (XML — read the data flows,
  derived columns and lookups), SQL Agent job definitions if scripted, linked servers,
  synonyms pointing at other databases.
- **Tour follows:** the data journey per job or package, plus the CRUD matrix.
- **Logs:** SQL Agent job history, SSIS catalog (`SSISDB`) execution reports, custom
  log tables — find them, they are usually there.

## Message-driven and microservices

- **Starts:** messages on queues/topics (RabbitMQ, Kafka, Azure Service Bus, SQS),
  HTTP between services, events.
- **Look for:** every producer and consumer per topic, message schemas and versions,
  retries and dead-letter queues, ordering assumptions, idempotency keys, sagas and
  compensations, service-to-service auth.
- **Tour follows:** one business event across services — draw it as a sequence diagram.
- **Logs:** centralised logging and tracing (correlation IDs across services, or the
  lack of them — a finding).

## Mobile — Android, iOS, Flutter, React Native

- **Starts:** screens, push notifications, background sync, deep links.
- **Look for:** offline storage and sync conflict rules, the API base URL per build
  flavour, feature flags, app-store version gates (forced update logic), permissions
  requested and why.
- **Tour follows:** screens per persona; plus the sync journey if there is offline mode.
- **Logs:** crash reporting (Crashlytics, Sentry), device logs.

## Data pipelines and ETL — Airflow, dbt, Spark, ADF, Informatica

- **Starts:** schedules and upstream completion.
- **Look for:** DAG or pipeline definitions, sources and sinks, transformations (they are
  business rules: "revenue excludes returns within 30 days"), late-data handling,
  backfills, data-quality checks.
- **Tour follows:** source → each transformation → target, per pipeline.
- **Logs:** orchestrator run history, pipeline logs.

## Office and end-user tools — Excel/VBA, Access, macros

- **Starts:** a person opening a file, a button, `Workbook_Open`.
- **Logic:** VBA modules, Access queries and forms, formulas — named ranges and hidden
  sheets included.
- **Look for:** connections to databases, file paths on shared drives, who runs it and
  how often (ask).
- **Logs:** usually none; say so.

## Legacy — COBOL, RPG, PowerBuilder, Classic ASP, VB6

- **Starts:** JCL, menus, CICS transactions, forms.
- **Logic:** copybooks and record layouts are the data model; paragraphs and sections are
  the methods. No manifest — derive the stack from extensions and build scripts.
- **Tour follows:** whatever the system is organised around — transactions, menus, batch
  streams.
- These are the systems where nobody remembers the rules any more. Be most exhaustive here.

## Libraries, SDKs, plugins

- **Starts:** someone else's code calling the public API.
- **Look for:** the public surface (exported types and functions), versioning and
  compatibility promises, configuration options, extension points.
- **Tour follows:** the main use cases a caller has, as code paths.

## Serverless and low-code

- **Starts:** function triggers (HTTP, queue, timer, blob), workflow triggers.
- **Look for:** trigger bindings in config (`function.json`, `serverless.yml`), Power
  Automate / Logic Apps definitions exported as JSON, cold-start sensitive code, per-call
  cost (`deep-read.md` §7).

## When the type is unclear

Say what you found and what you think it is, with the evidence, and ask once in Phase 2.
A misread type sends the whole tour in the wrong direction.
