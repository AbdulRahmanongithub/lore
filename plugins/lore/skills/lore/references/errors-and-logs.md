# Errors and logs — how this system fails, and how you find out

The first thing a developer without a handover needs, after "where is the code for this
screen", is "something broke in production — where do I look?". Almost no codebase writes
that down. `14-errors.md` does.

Read this in Phase 1, alongside step 4 (config) and step 7 (services).

## 1. Logging — where it goes and how to read it

Find and record, per environment:

| Question | Where to look |
|---|---|
| Logging library and version | manifest; `logging.config`, `logback.xml`, `log4net.config`, `serilog` setup, `winston`/`pino` construction, `NLog.config` |
| Sinks — where lines actually end up | console, file paths, rolling policy, syslog, CloudWatch, Stackdriver, Application Insights, Datadog, ELK, Loki |
| Error tracking | Sentry, Rollbar, Bugsnag, Raygun, Honeybadger — DSN key *name* only, never the value |
| Level per environment | config overrides, env vars like `LOG_LEVEL` |
| Structure | plain text or JSON; which fields every line carries (request ID, user ID, tenant) |
| Correlation | is a request ID generated and propagated to logs, responses and downstream calls? |
| What is never logged | PII scrubbing, password filters — or the absence of them, which is a finding |

Then write **how to read them** as commands a developer can run, with the real paths and
names from this repo:

```
Local:      docker compose logs -f api               [config: docker-compose.yml:30]
            tail -f logs/app.log  (rotates daily, keeps 14) [code: app/logging.py:22]
Staging:    Vercel → project → Logs, or `vercel logs <deployment>` [config: vercel.json]
Production: CloudWatch log group /ecs/orders-api      [config: infra/ecs.tf:88]
Errors:     Sentry project "orders-api", env tag from SENTRY_ENV [code: app/main.py:15]
```

If a destination cannot be determined from the repo — logs shipped by an agent installed
on the server, say — write what you know and make the rest an open question. Never
invent a dashboard URL.

If there is no logging beyond `print` or `console.log`, say exactly that. It is a hard
constraint on debugging, and a developer is better off knowing it on day one.

## 2. The error model

Document how errors are **represented**, **raised**, **translated** and **shown**.

**Custom error types.** Inventory every custom exception or error class:

```
| Type | Base | Raised where | Means | HTTP / exit | User sees |
|---|---|---|---|---|---|
| OrderLockedError | DomainError | services/order.py:88, :141 | order past cut-off | 409 | "This order can no longer be changed" |
| PaymentDeclined | IntegrationError | gateways/razorpay.py:52 | gateway said no | 402 | gateway message, passed through ⚠ |
```

**Error codes.** If the system has an error-code catalogue (`E1042`, `ORDER_LOCKED`),
transcribe it in full with meanings. Codes are a contract: front ends, mobile apps and
partner integrations branch on them, and renaming one is a breaking change.

**The global handler.** Where exceptions become responses: exception middleware,
`@ControllerAdvice`, `app.exception_handler`, `errorHandler` in Express, `ErrorBoundary`
in React. Record what it does with each type — which status, which body shape, what it
logs, and what an unexpected exception turns into. A handler that returns the stack trace
in production is a `10-security.md` finding.

**The response envelope.** The exact JSON shape of an error response, from the code, with
one real example.

**Front-end handling.** How the UI reacts: a central interceptor that toasts every error,
per-call handling, a redirect to login on 401, silent retries. A developer adding a
field needs to know whether a new validation error will appear by itself or needs wiring.

## 3. Failure behaviour — the part that bites

These are the findings that cause incidents. Hunt each one deliberately:

- **Swallowed exceptions** — empty `catch`, `except: pass`, `.catch(() => {})`, errors
  logged at DEBUG and then ignored. Each one goes in `12-landmines.md` with what it hides.
- **Partial writes** — several writes with no transaction around them, or an external call
  in the middle of a transaction. What state is left behind if step 3 of 5 fails?
- **Retries** — which calls retry, how many times, with what backoff, and whether the
  operation is idempotent. A retried non-idempotent payment call is the classic
  double-charge.
- **Timeouts** — set or defaulted, per external call. A missing timeout on an HTTP client
  is a hung worker waiting to happen.
- **Fallbacks and circuit breakers** — what the system does when a dependency is down:
  degrade, queue, fail the request, or pretend it worked.
- **Background job failures** — dead-letter queue, retry policy, alerting, or nothing.
- **Validation split** — rules enforced on the client but not the server are a security
  finding; rules on the server but not the client are a UX finding. Record both.

## 4. "When X breaks, look here" — the runbook table

Close `14-errors.md` with the table a developer on call actually reads. One row per
failure that is likely or expensive:

```
| Symptom | Likely cause | Look at | Evidence |
|---|---|---|---|
| Orders stuck "processing" | Celery worker down; tasks queue silently | `celery -A app inspect active`; Redis queue length | tasks.py:12 |
| Users logged out every hour | JWT expiry 60 min, no refresh token | auth/jwt.py:19 | auth/jwt.py:19 |
| 500 on settlement save, "division by zero" | settlement with gross 0, R-14 | Sentry, settlement.py:219 | settlement.py:219 |
```

Every row cites the code that makes it true. Nothing here is generic advice — "check the
logs" is not a row.

## 5. Read-only, still

Discovering how logs are read does not mean reading production logs. Commands in the
runbook table are for the developer; this skill writes them down and does not run them
against anything but local output, and never against production (`access-escalation.md`
§T3). Log files committed to the repo may hold PII or secrets — read them only to learn
the format, and redact anything quoted.
