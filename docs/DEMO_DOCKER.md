# Isolated local Docker demo

Prerequisites: Docker Engine/Desktop running, Docker Compose v2, and a free local port 3000.
Run from the repository root:

```sh
docker compose -f compose.demo.yml up --build -d --wait
```

Open [the storefront](http://localhost:3000) or [password login](http://localhost:3000/auth/password).
The first build installs the locked dependencies and builds the production Next.js standalone
application. Startup waits for PostgreSQL 18, applies the existing Drizzle migrations, seeds the
repository's demo catalog/users, and starts the server only after initialization succeeds.
No manual migration or seed command is required. Subsequent starts retain the database and uploads.

Use the existing password flow; no SMS or email code is needed in this isolated demo:

| Role            | Login                   | Password        | Destination |
| --------------- | ----------------------- | --------------- | ----------- |
| Administrator   | `admin@stroyhub.tj`     | `Admin123!`     | `/admin`    |
| Sales manager   | `sales@stroyhub.tj`     | `Sales123!`     | `/admin`    |
| Content manager | `content@stroyhub.tj`   | `Content123!`   | `/admin`    |
| Logistics       | `logistics@stroyhub.tj` | `Logistics123!` | `/admin`    |
| Customer        | `client@example.com`    | `Client123!`    | `/account`  |

For a customer, open `http://localhost:3000/auth/password?next=/account`.
Use the literal hostname `localhost`: modern browsers permit the application's production
`Secure` session cookie on localhost. Authentication cookie security and production auth code
are unchanged. Supplier accounts from the baseline seed remain unavailable for login, as in the app.
Code-based registration, password recovery, SMS and email delivery are intentionally unavailable.

## Isolation and persistence

- This is a separate Compose file, image (`Dockerfile.demo`) and project (`stroysnab-local-demo`).
  It does not extend the existing production or development Compose configuration.
- No `.env`/host credentials are injected; the Docker build context excludes `.env` files, and
  this Dockerfile copies only the application inputs. The database URL is a fixed demo literal.
- The startup guard refuses missing demo mode, any other database URL (including URL query
  overrides), remote application origins, external service credentials, or enabled transports.
  Both initialization and server startup invoke the guard before accessing the database.
- The app and database share only an internal Docker network with no outbound internet route.
  The database has no published port. Only `127.0.0.1:3000` is published for the app.
- SMS/email transports and AI quotation are disabled; there are no notification/AI workers.
  Local demo staff login uses the existing password flow with the demo-only environment
  `STAFF_EMAIL_OTP_REQUIRED=false`. Production settings are untouched.
- Separate project volumes persist PostgreSQL and uploaded files:
  `stroysnab-local-demo_demo_postgres18` and `stroysnab-local-demo_demo_uploads`.
  PostgreSQL 18 mounts `/var/lib/postgresql` for its versioned data layout.
- Public demo passwords and signing secrets are deliberately local-only. Do not expose this
  Compose project publicly or reuse its credentials with a production database.

The server cannot call external maps/geocoding or other providers on the internal network.
Browser-loaded external map tiles may still require the browser's internet connection.

## Inspect, stop, reset

```sh
docker compose -f compose.demo.yml ps
docker compose -f compose.demo.yml logs --tail=100 demo-app demo-db
docker compose -f compose.demo.yml down
```

`down` preserves demo data. To deliberately discard **this demo's database and uploads**, run:

```sh
docker compose -f compose.demo.yml down --volumes
```

Then repeat the startup command to recreate the original demo data. Never combine this file
with production Compose files or rename its database endpoint to a real service.

## Verification

Run the database-independent startup safeguards:

```sh
node --test scripts/demo-guard.test.mjs
```

The guards were exercised against valid demo settings, remote/ambiguous database URLs,
accidentally injected credentials, and enabled external transports. The initializer was bundled
with esbuild and its refusal path was executed. YAML parsing and local source checks were run.

Docker is not installed/available in the implementation environment (the `docker` command is
not found), so image build, Compose validation by Docker, PostgreSQL 18 startup, browser login,
and persistence across container restarts have **not** been executed there. Before treating
this as a verified running demo, execute the startup command on a Docker host and check:

1. Both services are healthy and the catalog loads.
2. The administrator and customer can log in via the password URLs above.
3. A cart/order and an uploaded file survive `down` followed by `up -d --wait`.
4. An override with a remote `DATABASE_URL` refuses startup before migration or seeding.
