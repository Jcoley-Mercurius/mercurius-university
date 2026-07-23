# Mercurius database setup

This package owns the PostgreSQL migration, development seed data, connection checks,
and quote persistence. The pure pricing domain remains in `packages/domain`.

## Prerequisites

- A hosted Supabase project
- PostgreSQL's `psql` client and `curl` on `PATH`
- Node.js and Corepack (the repository pins pnpm 10.14.0)

The operational scripts use `psql` directly and need no JavaScript database driver.

## 1. Create the Supabase project

1. Sign in at <https://supabase.com/dashboard> and select **New project**.
2. Choose an organization, name the project, save a strong database password, choose
   a region, and wait for provisioning.
3. Open the project's **Connect** dialog and copy the direct PostgreSQL URI. Prefer port
   `5432` for migrations. If your network lacks IPv6, use the session pooler URI shown
   by Connect.
4. URL-encode special characters in the password before placing it in the URI.

See Supabase's [Postgres connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 2. Copy the URL and keys

Open **Project Settings > API Keys**, or use the **Connect** dialog:

- Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key (or legacy `anon`) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Secret key (or legacy `service_role`) -> `SUPABASE_SERVICE_ROLE_KEY`
- PostgreSQL connection URI -> `DATABASE_URL`

The secret/service-role key bypasses RLS. It is server-only: never put it in a
`NEXT_PUBLIC_` variable, browser bundle, log, or committed file. See Supabase's
[API-key documentation](https://supabase.com/docs/guides/getting-started/api-keys).

Create local files:

```bash
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
```

Replace every `YOUR_...` placeholder. DB scripts prefer `packages/db/.env`, then root
`.env`. Override this with `ENV_FILE=/absolute/path/to/file`.

## 3. Run migration 0001

From the repository root:

```bash
corepack pnpm --filter @mercurius/db db:migrate
```

Equivalent raw command:

```bash
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f packages/db/migrations/0001_quote_lab.sql
```

The migration creates tenancy prerequisites, quote tables, constraints, indexes, RLS
policies, and the immutable-snapshot trigger in one transaction. Apply it once to a fresh
project. You can alternatively paste it into Supabase **SQL Editor** and select **Run**.

## 4. Create the seed rep

Memberships reference `auth.users`, so the seed deliberately does not invent an Auth row:

1. In Supabase, open **Authentication > Users**.
2. Select **Add user**, create a test rep, and copy the user's UUID.
3. Put that UUID in `SEED_REP_USER_ID` inside `packages/db/.env`.

## 5. Run the idempotent seed

```bash
corepack pnpm --filter @mercurius/db db:seed
```

It creates or updates the `Mercurius Solutions` organization, one active rep membership,
three fictional vendors, and two practice scenarios for catalog `2026-06-30`. It is safe
to rerun. Seed contacts use reserved `.invalid` emails and fictional `555` phone numbers.

## 6. Verify everything

```bash
corepack pnpm --filter @mercurius/db db:verify
```

The verifier rejects missing/placeholder values, calls the Supabase REST API using the
public key, connects through `DATABASE_URL`, and confirms all five quote-related tables.
A successful run ends with:

```text
Supabase REST endpoint accepted the configured anon key (HTTP 200).
Postgres connected and all 5 quote-related tables exist.
```

## Persistence boundary

Application requests should use authenticated-user context so RLS remains the final
authorization boundary. `saveQuote` performs server-side pricing and all inserts in one
transaction; production adapters must begin it at `SERIALIZABLE` isolation. Reserve the
secret/service-role key for trusted administrative operations.
