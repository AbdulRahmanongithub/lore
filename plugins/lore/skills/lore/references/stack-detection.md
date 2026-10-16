# Stack detection — this skill is stack-agnostic

Never assume an ecosystem. Detect it, state what you detected, and adapt. Assuming a
stack is how you end up describing a `services/` folder that is actually Terraform.

A codebase is frequently polyglot — a .NET API, a React frontend, Python ETL jobs,
Terraform infra. In that case run the whole eleven-step sweep **per component**, and
record the boundaries between components in the architecture section of the output.
The boundaries are where agents cause the most damage, because a change on one side
silently breaks a contract on the other.

## Manifests and dependency files by ecosystem

| Ecosystem | Look for |
|---|---|
| .NET | `*.csproj`, `*.sln`, `Directory.Packages.props`, `paket.dependencies` |
| JS/TS | `package.json`, workspace/monorepo configs (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`) |
| Python | `pyproject.toml`, `requirements*.txt`, `Pipfile`, `setup.py`, `environment.yml` |
| Java/Kotlin | `pom.xml`, `build.gradle(.kts)`, `settings.gradle` |
| Go | `go.mod` |
| Rust | `Cargo.toml` |
| PHP | `composer.json` |
| Ruby | `Gemfile`, `*.gemspec` |
| Dart/Flutter | `pubspec.yaml` |
| Swift/iOS | `Package.swift`, `Podfile`, `*.xcodeproj` |
| Android | `build.gradle`, `AndroidManifest.xml` |
| Elixir | `mix.exs` |
| C/C++ | `CMakeLists.txt`, `conanfile.txt`, `vcpkg.json` |
| Scala | `build.sbt` |
| Perl / R / Julia | `cpanfile`, `DESCRIPTION` / `renv.lock`, `Project.toml` |
| Shell / legacy | no manifest — infer from imports, includes and deploy scripts |

If you find no recognised manifest, say so and derive the stack from imports, file
extensions, server config and deploy scripts. Legacy and COBOL/VB/Delphi-era systems
are fully in scope; they just need inference instead of parsing, and they are exactly
the systems where nobody remembers the business rules any more.

Record **versions**, not just names, and flag end-of-life runtimes. "Runs on .NET
Framework 4.6.1" changes what an agent is allowed to propose far more than any
architectural preference.

## Data stores — relational is not assumed

| Kind | Examples | What to extract |
|---|---|---|
| Relational | PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, SQLite, DB2 | Tables, columns, FKs, indexes, **check/unique constraints**, views, stored procs, triggers, enum/lookup contents |
| Document | MongoDB, CouchDB, Firestore, DynamoDB, Cosmos DB | Collections, the *de facto* shape per collection, required fields, discriminators, indexes, schema drift between documents |
| Key-value / cache | Redis, Memcached, etcd | Key naming patterns, TTLs, what is cached vs authoritative, eviction risk |
| Graph | Neo4j, Neptune, ArangoDB | Node labels, relationship types, traversal patterns |
| Time-series | InfluxDB, TimescaleDB, Prometheus | Measurements, tags, retention and downsampling policies |
| Search | Elasticsearch, OpenSearch, Meilisearch, Solr | Indices, mappings, analyzers, what re-indexes them and when |
| Spatial | PostGIS, spatial extensions | SRIDs, geometry columns, spatial indexes |
| Columnar / warehouse | BigQuery, Snowflake, Redshift, ClickHouse | Datasets, partitioning, who loads them |
| Event log | Kafka, Pulsar, EventStore | Topics, schemas/registry, partitioning keys, consumer groups, replay semantics |
| File-as-database | CSV/Excel/JSON on disk or object storage | Location, owner, update cadence — common in internal tools and genuinely load-bearing |

For schemaless stores the schema lives in the application code and in the actual
documents. Derive it from the code first. With dev database access granted you may sample
document *shapes* with values redacted — field names and presence rates, never records.

The "file-as-database" row is easy to dismiss and often wrong to. A spreadsheet that
someone updates monthly and a job reads at 2am is a production dependency; an agent
that doesn't know it exists will cheerfully break it.

## Architecture styles to recognise

Monolith (layered, modular, vertical-slice), MVC or MVVM, Clean/Hexagonal/Onion,
microservices, service-oriented, serverless/FaaS, event-driven, CQRS and event
sourcing, SPA + API, SSR/SSG, BFF, mobile client + backend, desktop app, batch/ETL
pipeline, plugin or extension architecture, monorepo vs polyrepo.

Name the pattern **and** say where the real code deviates from it. The deviation is
what trips agents up: a codebase that is "Clean Architecture, except the reporting
module queries the DB directly from the controller" will produce confidently wrong
code from any agent that believes the stated pattern.

## CI/CD and infrastructure

Detect the pipeline wherever it lives: GitHub Actions (`.github/workflows/`), GitLab CI
(`.gitlab-ci.yml`), Jenkins (`Jenkinsfile`), Azure Pipelines (`azure-pipelines.yml`),
CircleCI, Travis, Bitbucket Pipelines, TeamCity, Bamboo, Drone, Woodpecker, Argo or
Flux (GitOps), Tekton, Spinnaker, AWS CodePipeline, Google Cloud Build, Netlify or
Vercel configs, Fastlane for mobile, or a plain `Makefile` / shell deploy script.

For each pipeline record:

- Trigger conditions
- Stages in order
- Test and lint gates
- Build artifacts
- **How database migrations are applied** — automatic on deploy, a manual step, or not
  at all. This single fact changes how an agent is allowed to write a migration.
- Approval and manual gates
- Target environments
- Secret injection mechanism (names only, never values)
- Rollback procedure
- Who can run it

Also capture containerisation (Dockerfile, compose, Helm, Kubernetes manifests) and IaC
(Terraform, Pulumi, CloudFormation, Bicep, Ansible).

If there is no CI/CD — manual FTP, publish-from-IDE, RDP into a server and copy the
folder — document that plainly. It is a hard constraint on every change an agent
proposes, and inventing a pipeline that doesn't exist is worse than admitting there
isn't one.
