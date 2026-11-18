# Deploy PumpFlow

## Recommended architecture

- **Vercel:** Next.js application
- **Supabase:** PostgreSQL database, authentication, and storage
- **Render:** Not required for this app because Next.js runs its API and frontend on Vercel

## 1. Create the Supabase project

1. Create a project in Supabase.
2. Open **SQL Editor**.
3. Run `supabase/migrations/20260101000000_pumpflow_schema.sql`.
4. In **Project Settings → API**, copy:
   - Project URL
   - Publishable key (new projects) or anon key (legacy projects)

Do not commit the service-role key or database password.

## 2. Configure local environment

Copy `.env.example` to `.env.local`, then fill in the values:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

## 3. Push to GitHub

Create a GitHub repository and push this local repository:

```sh
git branch -M main
git remote add origin <github-repository-url>
git push -u origin main
```

## 4. Deploy on Vercel

1. Import the GitHub repository in Vercel.
2. Keep the detected framework as **Next.js**.
3. Add the two Supabase environment variables.
4. Deploy.

The application build command and framework settings are in `vercel.json`.

## 5. Production database requirements

The supplied application currently persists data in browser `localStorage`. Supabase migration/schema setup alone does not connect CRUD operations to PostgreSQL.

Before accepting real business data, complete:

- Replace localStorage state with Supabase reads/writes.
- Add Supabase Auth sign-in and sign-out.
- Enable and test Row Level Security policies.
- Run database transactions for sales and stock updates.
- Seed initial settings, categories, brands, and users.

## 6. Verify

After deployment:

- Open the Vercel URL on mobile and desktop.
- Test navigation and PWA installation.
- Configure the Supabase Auth redirect URL to the Vercel domain.
- Confirm the production database is not publicly writable.
