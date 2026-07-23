# Mercurius University web

Next.js 15 application for Mercurius University. The first implemented route is the
responsive Quote Lab at `/quote-lab`.

## Run locally

From the repository root:

```bash
corepack pnpm install
corepack pnpm --filter @mercurius/web dev
```

Open <http://localhost:3000/quote-lab>.

Copy `apps/web/.env.local.example` to `apps/web/.env.local` and provide the Supabase
and PostgreSQL values before testing authenticated saves. A user must have an active
`organization_memberships` row. Browsing and live calculations work without a session;
the save action provides a sign-in message when no authenticated session is present.

## Test authentication and saving

1. In Supabase, open **Authentication > Providers > Email** and confirm email/password
   authentication is enabled.
2. Open **Authentication > Users**, create a test user with a known password, and mark
   the email confirmed for local testing.
3. Copy that user's UUID into `SEED_REP_USER_ID` in `packages/db/.env` and run:

   ```bash
   corepack pnpm --filter @mercurius/db db:seed
   ```

   The Auth user UUID and membership `profile_id` must match.
4. Start the web app and visit <http://localhost:3000/login>.
5. Sign in with the test user's email and password. You will be redirected to Quote Lab;
   the header shows the resolved rep and organization.
6. Build a quote and select **Save quote**. A successful result displays in the sticky
   action bar. Clicking **Log out** clears the Supabase session and returns to login.

To test the missing-membership state, sign in as a second confirmed Auth user that does
not have an `organization_memberships` row. Quote Lab remains usable for calculations,
shows an explanatory warning, and disables saving.

## Quote Lab architecture

- `app/quote-lab/page.tsx`: route entry
- `features/quote-lab/quote-lab-screen.tsx`: interactive draft and save orchestration
- `features/quote-lab/core-package-select.tsx`: catalog-driven core selector
- `features/quote-lab/enhancement-picker.tsx`: software/service grouping
- `features/quote-lab/calculation-panel.tsx`: domain calculation presentation
- `app/actions/save-quote.ts`: authenticated server save action
- `app/actions/auth.ts`: password login and logout actions
- `middleware.ts`: session refresh and `/quote-lab` route protection
- `features/auth/login-form.tsx`: accessible login form and error/loading states
- `lib/db/server.ts`: serializable PostgreSQL transaction adapter

Pricing is never duplicated in the UI. Both preview and persistence call the exported
pure domain functions from `@mercurius/domain`.
