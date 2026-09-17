# Vee Platform

The production web platform for Vee (formerly TapWave): a public marketing
site + product catalogue, a business-owner dashboard (public profile,
digital menu, links, staff, leads), and an internal Vee Super Admin panel.
Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and
Supabase (Postgres + Auth + Storage, secured with Row-Level Security).

This is a real, working application — not a design mockup. Forms save to
the database, uploads go to Supabase Storage, auth is real Supabase Auth,
and every admin/dashboard route is protected both by the UI and by a
server-side check (see "How access control works" below), backed by
Postgres RLS as the final enforcement layer.

## Requirements

- Node.js 20+
- A Supabase project (free tier is enough to start) — see "Database setup"

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase dashboard → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase dashboard → Project Settings → API → `service_role` key. **Server-only — never exposed to the browser.** Used for staff invitations and admin-only operations. |
| `NEXT_PUBLIC_SITE_URL` | Yes | The public URL the app is served from, e.g. `https://vee.iq` in production or `http://localhost:3000` locally. Used for SEO metadata, sitemap, and auth email redirect links. |
| `LEADS_NOTIFY_WEBHOOK_URL` | No | Any webhook URL (Slack incoming webhook, email API, etc.) that should be pinged when a visitor submits the public contact form. Leave blank to skip notifications — leads are always saved to the database either way. |

No secret ever lives in frontend code. `SUPABASE_SERVICE_ROLE_KEY` is read
only in server-only files (`lib/actions/*`, marked `"use server"`) and is
never sent to the browser.

## 3. Database setup

The full schema — tables, enums, RLS policies, storage buckets, and seed
data (plans, feature flags, the 8-product catalogue skeleton) — lives in
`supabase/migrations/`, in order:

1. `0001_extensions_and_enums.sql` — Postgres extensions + enum types
2. `0002_core_tables.sql` — every table (profiles, businesses, locations,
   staff, links, menu categories/items/options, catalogue products, plans,
   subscriptions, NFC devices, orders, analytics events, leads, feature
   flags, site content, nav menu items, audit log)
3. `0003_helpers_and_rls.sql` — helper functions (`is_vee_staff()`,
   `has_business_permission()`, …) and Row-Level Security policies on every
   table
4. `0004_seed_data.sql` — the 4 subscription plans, the initial feature
   flag set, and the 8 catalogue products (with placeholder copy — replace
   via Super Admin → Catalogue once you're ready, or before generating
   real product photography)
5. `0005_storage.sql` — two public-read Storage buckets
   (`business-media`, `platform-media`) with per-path RLS so a business
   can only write under its own folder
6. `0006_leads_metadata.sql` — small follow-up migration for lead tracking

**Apply them** with the Supabase CLI (recommended):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or paste each file's contents into the Supabase dashboard's SQL Editor, in
order, if you'd rather not install the CLI.

### Creating the first Super Admin

There is deliberately no self-serve way to become Super Admin — it's a
one-time manual step after your own account exists:

1. Sign up normally through the app at `/signup` (this creates a `profiles`
   row for you and an initial business, same as any customer).
2. In the Supabase SQL Editor, run:
   ```sql
   update profiles set internal_role = 'super_admin' where id =
     (select id from auth.users where email = 'you@yourcompany.com');
   ```
3. Log out and back in. `/admin` is now available to that account. From
   there you can invite other internal Vee staff with scoped roles.

## 4. Run it

```bash
npm run dev
```

Open http://localhost:3000. First visit shows the language chooser
(English / العربية / کوردی); your choice is saved for a year (and, once
you're signed in, to your profile so it follows you across devices).

## Project structure

```
app/(marketing)/     Public site: homepage, product catalogue, contact, legal
app/[username]/      Public business profile + digital menu (vee.iq/:username)
app/login, /signup, /reset-password   Auth
app/dashboard/       Business-owner dashboard (profile, menu, links, staff, orders, analytics)
app/admin/           Vee Super Admin (businesses, leads, catalogue, feature flags)
lib/actions/         Server Actions — all writes go through here, validated with Zod
lib/auth/dal.ts       Data Access Layer — the authoritative, DB-backed auth/role checks
lib/data/            Read-side data fetching helpers
lib/supabase/        Browser/server Supabase clients + hand-written DB types
lib/i18n/            EN/AR/KU dictionaries + locale helpers
proxy.ts             Next.js 16's replacement for middleware.ts — optimistic
                      cookie-based redirect for signed-out users; NOT the
                      security boundary (see below)
supabase/migrations/ The database schema, in order
```

## How access control works (three layers)

1. **`proxy.ts`** — a fast, optimistic check that redirects an obviously
   signed-out visitor away from `/dashboard` and `/admin` before any page
   code runs. This is a UX nicety, not security.
2. **The Data Access Layer (`lib/auth/dal.ts`)** — `requireUser()`,
   `requireStaff()`, `requireBusinessMembership()`, etc. Every dashboard
   page, admin page, and Server Action calls one of these, which makes a
   real database round-trip to confirm the session and the caller's role
   before doing anything. This is what actually stops an unauthorized
   request, even if `proxy.ts` were bypassed entirely.
3. **Postgres Row-Level Security** — the final backstop. Every table has
   RLS policies keyed off `auth.uid()`, so even a bug in application code
   (or a direct API call with a user's own token) cannot read or write
   another business's data.

## Internationalization

- Locale is cookie-based (`vee-lang`), not a URL prefix — URLs stay
  `vee.iq/:username`, matching the original site and the NFC/QR
  requirement that a physical device's link never needs to change.
- `<html lang>` / `<html dir>` are set server-side from that cookie on
  every request, and the in-page language switcher applies a change
  immediately (it calls the locale Server Action directly and forces a
  client refresh, rather than relying on a same-page redirect, which this
  version of Next.js doesn't reliably reflect in the `<html>` tag on its
  own).
- Kurdish (Sorani) is a first-class locale, not "Arabic with the font
  swapped" — it has its own font stack and typography rules
  (`lib/fonts.ts`, `:lang(ku)` rules in `app/globals.css`) so it doesn't
  visually default to worse Arabic rendering.

## Known limitations in this environment

- **Fonts**: `lib/fonts.ts` currently ships the real `next/font/google`
  wiring (Inter / Tajawal / Noto Sans Arabic). If you ever see a stub
  there instead (plain objects, no real font loading), that's a temporary
  state left over from a sandbox that couldn't reach
  `fonts.googleapis.com` — a normal dev machine or deployment host has no
  such restriction, since `next/font/google` self-hosts the font files at
  build time.
- **Rate limiting** (`lib/rate-limit.ts`) is an in-memory sliding window
  keyed by IP. That's fine for a single instance; running more than one
  server instance in production needs a shared store (Redis, or a
  Postgres table) instead.

## Deployment

This is a standard Next.js app — it deploys to Vercel, or any host that
runs `next build` / `next start` (or a Node server) with the environment
variables above set. Run the Supabase migrations against your production
project *before* pointing the deployed app at it. **Do not deploy until
you're ready to go live — nothing in this repo does that automatically.**

```bash
npm run build
npm run start
```
