# Jordan Create OS — Project Rundown

The complete reference for this project. If the chat that built it, the person
who deployed it, or the hosting itself is ever gone, this file plus the repo is
enough to understand, run, and rebuild everything.

Last updated: August 2026.

---

## 1. What this is

An internal operating system for **Jordan Create** — a creative studio that
runs client projects, produces content, stages events, and rents parts of its
building to partners. One Next.js app, one PostgreSQL database, everything
cross-linked through shared Topics and People.

**The live instance runs on Render (web) + Supabase (Postgres).** Deploys are
automatic: every push to the `claude/jordan-create-os-zv6tab` branch on
`github.com/awnkn/jordancreate` triggers a Render build.

## 2. Sections

| Route | Section | What it holds |
| --- | --- | --- |
| `/` | Dashboard — "The Frame, today" | Due tasks, next event, shipping content, roster + PR funnels |
| `/operations` | Projects | Client engagements: status, owner, budget, dates |
| `/operations/tasks` | Tasks | Everything owed, with one-click done/reopen |
| `/content` | Content pipeline | Pieces from Idea → Published, with formats, **platforms** multi-select, topics |
| `/experience` | Events | Conferences, workshops, dinners — each with a speaker line-up (Bookings) and covered Topics |
| `/experience/speakers` | Speakers | The roster: photo, fee, contact history, topics they cover |
| `/experience/topics` | Topics | The connective tissue — links speakers, content, guests **and events**; speaker matching lives here |
| `/public-relations` | Guests | Press/appearance pipeline, split into six category rosters (General Guests, Executives, Government, Creators, Artists, Designers) |
| `/sponsors` | Sponsors | Sales CRM: Lead → Won pipeline, tiers, deal values, weighted pipeline stat |
| `/tickets` | Ticket Buyers | Orders per event: seats, revenue, check-in |
| `/vendors` | Vendors | Two rosters: **Suppliers** (what they provide) and **Space Partners** (space, rent, lease dates, rent-roll stat) |
| `/people` | People | The team, with roles, photos-less profiles, and an "Owns" summary |
| `/people/responsibilities` | Roles & responsibilities | The accountability chart: area + level (Owner/Backup/Support) per person |
| `/access` | Access | Who holds which system/tool/key, grant/revoke, offboarding checklist |
| `/login` | Sign in | Username + password; first-run setup when nobody has credentials |
| `/api/seed` | Demo data loader | GET with `?token=<SETUP_TOKEN>`; refuses on non-empty DB without `&force=1`; 404 when SETUP_TOKEN unset |

## 3. Stack

- **Next.js 16** (App Router, server components, server actions — no API
  routes except `/api/seed`), React 19, TypeScript.
- **Tailwind CSS v4** — tokens declared in `@theme` inside
  `src/app/globals.css`; no tailwind.config file.
- **Prisma 7** with the `prisma-client` generator (output in
  `src/generated/prisma`, gitignored, rebuilt by `prisma generate`) and the
  **`@prisma/adapter-pg`** driver adapter. Connection string comes from
  `DATABASE_URL` only — `prisma.config.ts` feeds the CLI, `src/lib/db.ts`
  feeds the app.
- **PostgreSQL** — any host. Production uses Supabase (see §6).

## 4. Architecture conventions

These are the rules the whole codebase follows; keep following them.

- **Reads**: pages are server components querying Prisma directly. List
  filters and search live in the URL (`?status=…&q=…`), so filtered views are
  shareable. Every page exports `dynamic = "force-dynamic"`.
- **Writes**: server actions colocated per section (`src/app/<section>/actions.ts`).
  Every mutation ends with `revalidateAll()` (`src/lib/revalidate.ts`) — the
  records are too cross-linked for per-path revalidation to be safe — and
  redirects to the record it touched. Forgetting `revalidateAll()` causes
  "the write worked but the page didn't update" bugs.
- **Vocabularies**: every status/kind/level/format is a plain string column
  constrained by `src/lib/taxonomy.ts`. Server actions clamp submitted values
  with `constrain()`. Adding a value = edit that one file (badges, filters and
  selects pick it up automatically); removing one = also migrate existing rows.
- **People are always structured names**: `firstName` + `lastName` columns
  everywhere (Speaker, Guest, Person, Sponsor contact, Ticket buyer, Vendor
  contact). Display goes through `fullName()` in `src/lib/format.ts`. Never
  add a single free-text name column.
- **Shared components**: `src/components/ui.tsx` (Badge, Panel, Stat,
  PageHeader, EmptyState, DueDate…), `form.tsx` (Field, Input, Select,
  ChipPicker, TopicPicker), `filters.tsx` (status pills + search),
  `interaction-log.tsx` (contact history used by speakers, guests, sponsors,
  vendors), `avatar.tsx` (photo or initials on brand gradient).
- **Client components are rare on purpose**: only the sidebar and the
  submit/delete buttons. Everything else is server-rendered.
- **Authentication** (`src/lib/auth.ts`, `src/proxy.ts`): usernames and
  scrypt-hashed passwords live on Person; sessions are HMAC-signed HttpOnly
  cookies (30 days). `src/proxy.ts` walls off every route except `/login`,
  `/api/seed` and static assets; the `(os)` layout re-checks the session
  against the database, so removing a login locks that person out on their
  next page load. Logins are managed on each person's profile; when no login
  exists at all, `/login` offers one-time first-run setup. Route structure:
  the app shell lives in `src/app/(os)/…`, the bare login page outside it.

## 5. Data model (summary — `prisma/schema.prisma` is authoritative)

```
Project 1—* Task            ContentPiece *—* Topic      Event *—* Topic
Project 1—* ContentPiece    Speaker *—* Topic           Guest *—* Topic
Project 1—* Event           Event 1—* Booking *—1 Speaker (unique per pair)
Event 1—* Sponsor           Event 1—* TicketOrder
Person 1—* AccessGrant      Person 1—* Responsibility
Interaction —> one of: Speaker | Guest | Sponsor | Vendor (contact history)
Vendor: kind = Supplier | Space Partner (rent/lease fields for partners)
Guest: category = the six PR rosters
ContentPiece.platforms: String[] (Website, Instagram, TikTok, YouTube,
  LinkedIn, X, Newsletter, Podcast)
```

All deletes either cascade (bookings, interactions, grants, responsibilities)
or `SetNull` (project links), so removing a record never strands children.

## 6. Production setup (Render + Supabase)

- **Render**: created from the repo's `render.yaml` Blueprint (New + →
  Blueprint). Build = `npm ci && npm run render-build` (prisma generate →
  **prisma migrate deploy** → next build), start = `npm run start`. Schema
  changes ship themselves on deploy. Free plan sleeps when idle; bump
  `plan:` in render.yaml for always-on.
- **Supabase**: the database. `DATABASE_URL` on Render must be the
  **Session pooler** string (port 5432, host `…pooler.supabase.com`) — the
  direct connection is IPv6-only and unreachable from Render. Found in
  Supabase → Connect → Session pooler; replace `[YOUR-PASSWORD]`.
- **SETUP_TOKEN**: optional Render env var enabling `/api/seed`. Delete it
  once real data is in.
- **AUTH_SECRET**: optional but recommended — signs session cookies. Without
  it the secret is derived from `DATABASE_URL`, so rotating the database
  password logs everyone out.

## 7. Running locally

```bash
npm install
cp .env.example .env    # point DATABASE_URL at any Postgres
npm run setup           # migrate deploy + generate + seed demo data
npm run dev             # http://localhost:3000
```

Useful scripts: `db:migrate` (new migration after schema edits), `db:seed`
(re-seed, wipes first), `db:reset`, `db:studio`, `lint`, `build`, `qa`.

## 8. QA suite

`scripts/qa.mjs` — ~106 browser checks driving the real app: every route,
CRUD in every section, bookings, topic/speaker matching, pipelines, quick
actions, access grants, responsibility assignment, cascade deletes, seed-route
guards, and search. Run it against a freshly seeded dev server:

```bash
npm i --no-save playwright   # once
npm run db:seed && npm run dev &
npm run qa
```

It exits non-zero on any failure and prints console errors. Run it before
every substantial change lands.

## 9. Design system

Direction: *"the production schedule, well printed."* Warm paper ground, ink
text, hairline rules, oversized tabular numerals under small-caps labels.

- **Tokens** live at the top of `src/app/globals.css` in `@theme`. Never
  style ad hoc.
- **Brand orange `#EA8F2D`** and shades: `--color-clay` `#A85E0C` for
  text-sized accents (keeps 4.5:1 contrast on paper), `--color-clay-bright`
  `#EA8F2D` on dark grounds, gradients (light → `#EA8F2D` → deep) on primary
  buttons, pipeline bars, and the active-nav wash (`.bg-accent-gradient`).
- **Rail**: near-black `#0D0B09` (`--color-rail`), distinct from text ink
  `#1A1613`. Fills the viewport on short pages (`lg:min-h-dvh` on the layout
  flex container).
- **Type**: Fraunces (display/numerals) + Inter (UI), via `next/font`.
- **Logo**: `public/brand-lockup.png` is the untouched source asset
  (transparent ground; JORDAN is set in **white** — invisible on white
  previews, deliberate). `public/logo-full.png` (sidebar) and
  `public/logo.png` / `src/app/icon.png` (mark/favicon) are cropped from it
  with **no color processing**. Never "clean up" white pixels in these files.
- Single light theme by design; the black rail is the one dark surface.

## 10. Recovery playbook

**App host lost (Render gone):** any Node host works. Set `DATABASE_URL`,
run `npm ci && npm run build && npm start`. For Render specifically, the
Blueprint recreates the service from `render.yaml` in one step. A
`vercel-build` script also exists for Vercel.

**Database lost:** create any new Postgres, set `DATABASE_URL`, then
`npx prisma migrate deploy` builds the schema from the committed migration
history (`prisma/migrations/`). Restore data from a dump (below) or load demo
data via `/api/seed`.

**Backing up the data** (run periodically, keep the file somewhere safe):

```bash
pg_dump "$DATABASE_URL" --no-owner --format=custom -f jordancreate-$(date +%F).dump
# restore with:
pg_restore --no-owner --clean --if-exists -d "$NEW_DATABASE_URL" jordancreate-<date>.dump
```

Supabase also keeps its own daily backups (Dashboard → Database → Backups)
on paid plans.

**Repo lost:** the GitHub repo *is* the project. Everything generated
(`src/generated/`, `node_modules/`, `.next/`) rebuilds from `npm install` +
`prisma generate`. The only non-reproducible artifacts are the brand images
in `public/` — which is why the original `brand-lockup.png` is committed.

## 11. Decision log

- **Postgres over SQLite** (was SQLite first) — needed a hosted DB for Render.
- **Structured names** — single `name` columns were split into first/last
  with a data-preserving migration; the rule is permanent.
- **`revalidateAll()` over per-path revalidation** — cross-links made path
  lists unmaintainable; every page is force-dynamic so it costs nothing.
- **Free-text channel → `platforms[]`** — controlled vocabulary prevents
  "IG" vs "Instagram" drift.
- **One Vendor/Guest model with a kind/category column** rather than separate
  tables per roster — same workflow, different slice; new rosters are one
  taxonomy entry away.
- **Auth is self-contained** (no Supabase Auth/OAuth) — the People section
  already existed as the user registry, sessions need no extra service, and
  password reset is a teammate action rather than an email flow. Revisit if
  the team outgrows shared-trust password management.
