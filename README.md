# WeldDoc

Welder qualification document management system for **EN ISO 9606-1:2017**. WeldDoc digitises the full welder performance qualification (WPQ) lifecycle: welder registry with QR codes, an auto range-of-approval engine, certificate & ID-card generation, batch qualification reports, expiry/continuity tracking with email alerts, a master list, and a public QR-scannable auditor verification page.

## Tech stack

- **Next.js 16.2.9** (App Router, React Server Components, Server Actions + Route Handlers)
- **Supabase** — PostgreSQL, Auth (Welding Engineer login), Storage (photos, NDT PDFs, signatures, stamps)
- **TanStack Query** — client-side data cache
- **@react-pdf/renderer** — certificate / ID-card / report PDFs inside route handlers
- **qrcode** — server-side QR generation
- **Resend** — expiry alert emails
- **Tailwind CSS v4** with the WeldDoc brand system (Space Grotesk + Inter)
- **Recharts** — dashboard pie charts

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

3. Create the Supabase schema by running the SQL files in [`supabase/migrations`](supabase/migrations) **in order** (`0001` → `0004`) against your project, via the SQL editor or the Supabase CLI. This creates all tables, enums, RLS policies, storage buckets and the report/UID sequence functions, and seeds a single default organisation.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), go to **Sign in → Create an account** to register the first welding engineer (they are auto-attached to the seeded organisation), then visit **Settings** to set the company name, alert recipients and add signatories (signature + stamp images used on certificates and report sheets).

## First run checklist

1. Sign up an engineer account.
2. In **Settings**, set the org name, report prefix, alert recipients and add at least one *manufacturer* and one *examining body* signatory.
3. Add a welder (a UID + QR token are generated automatically).
4. Run the 4-step **Qualify** workflow, or create a batch **Test report**.
5. Download the certificate / ID card / report sheet PDFs, and scan the QR to open the public verification page.

## Linting

Next 16 removed `next lint`; run ESLint directly:

```bash
npx eslint .
```

## Project structure

```
src/
  app/
    (marketing)/        Public landing / marketing site
    (auth)/             Login
    (app)/              Authenticated app (dashboard, welders, reports, master list, settings)
    verify/[token]/     Public QR auditor verification page (QR encodes the welder's qr_token)
    api/                Route handlers (PDF, QR, cron)
  components/           Shared UI + feature components
  lib/
    range-engine/       ISO 9606-1 range-of-approval rules engine
    supabase/           Supabase clients (browser, server, admin)
  types/                Shared domain types
supabase/
  migrations/           SQL schema + RLS
```

## Scope

MVP covers **ISO 9606-1 only**. The `standard` column is kept as an enum so ASME IX and AWS D1.1 can be added later without a migration rewrite. Single-tenant for now, but the schema is organization-scoped to allow multi-tenant SaaS later.
