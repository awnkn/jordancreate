# Jordan Create OS

An internal operating system for the studio. Eight sections, one database, everything
cross-linked so a speaker, an article and a press hit can all point at the same topic.

```
Operations        Projects → Tasks
Content           The publishing pipeline
Experience        Events → Speakers, Topics (and the bookings between them)
Public Relations  Guests, split into rosters — General Guests, Executives,
                  Government, Creators, Artists, Designers
Sponsors          The sales CRM: deals by stage, value, next step, contact log
Ticket Buyers     Orders per event — seats, revenue, refunds, check-in
People            The team roster, staff and freelancers
Access            Who holds which account/tool, at what level — the offboarding list
```

Plus a dashboard that reads across the sections: what's due, what's shipping, who's on
the next stage.

## Running it

```bash
npm install
cp .env.example .env      # DATABASE_URL for the local SQLite file
npm run setup             # migrate, generate the client, seed sample data
npm run dev               # http://localhost:3000
```

`npm run setup` seeds a realistic studio — five projects, a summit with a part-booked
line-up, a content pipeline and a PR funnel — so every screen has something in it.
The seed is re-runnable and wipes first; its dates are relative to today, so the data
never goes stale.

To start from nothing instead, run `npm run db:reset` and skip the seed.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` then a production build |
| `npm run setup` | Migrate + generate + seed, for a fresh checkout |
| `npm run db:migrate` | Create and apply a new migration after a schema edit |
| `npm run db:seed` | Re-seed sample data |
| `npm run db:reset` | Drop and rebuild the database |
| `npm run db:studio` | Prisma Studio, for poking at rows directly |
| `npm run lint` | ESLint |

## How it fits together

**Data.** `prisma/schema.prisma` is the source of truth. SQLite has no enum type, so
every status and format column is a plain string constrained in the app layer by
`src/lib/taxonomy.ts` — that file lists the allowed values *and* the tone each one
renders as, and every server action clamps submitted values against it with
`constrain()`. Adding a status means editing that one file.

**Writes.** All mutations are server actions colocated with their section
(`src/app/<section>/actions.ts`). No API routes, no client-side fetching. Forms post
directly to an action, which writes, revalidates the affected paths and redirects.
The only client components in the app are the sidebar and the submit/delete buttons.

**Reads.** Pages are server components querying Prisma directly. Filters and search
live in the URL (`?status=Active&q=northwind`), so a filtered view is shareable and
survives a refresh.

**Cross-links.** Topics are the connective tissue: a topic joins speakers, content and
guests, and its detail page shows all three. Projects link to their tasks, content and
events; events carry their bookings, sponsors and ticket orders. `Interaction` is a
shared contact log used by speakers, guests and sponsor deals alike. Access grants
hang off people, and the Access page flags active grants still held by alumni.

### Where things live

```
src/
  app/
    page.tsx                 Dashboard
    operations/              Projects + tasks (actions.ts, forms, list, detail)
    content/                 Content pipeline
    experience/              Events, and speakers/ + topics/ beneath it
    public-relations/        Guests (+ per-category rosters at /[category])
    sponsors/                Sales CRM
    tickets/                 Ticket orders
    people/                  Team roster
    access/                  Access register
  components/
    ui.tsx                   Badge, Panel, Stat, PageHeader, EmptyState, …
    form.tsx                 Field, Input, Select, TopicPicker
    form-actions.tsx         Submit/delete buttons (the only client components)
    filters.tsx              Status filter bar + search box
    interaction-log.tsx      Shared contact history
    sidebar.tsx              Navigation
  lib/
    taxonomy.ts              Every controlled vocabulary
    db.ts, format.ts, nav.ts, models.ts
```

## Design

The direction is *the production schedule, well printed*: a warm paper ground, ink
text, hairline rules instead of drop-shadow cards, and a single clay accent. The
signature move is the oversized tabular numerals under small-caps labels — the stat
rows are meant to read like a printed call sheet. Tokens are defined once at the top
of `src/app/globals.css`; nothing is styled ad hoc.

It commits to a single light theme on purpose. The paper ground *is* the design, and a
dark inversion would be a different product.

## Notes for whoever extends this

- Adding a field: edit `prisma/schema.prisma`, run `npm run db:migrate`, then add it to
  that section's `*-form.tsx` and its `actions.ts` data mapper.
- Adding a status value: add it to the vocabulary in `src/lib/taxonomy.ts` with a tone.
  Filter bars, badges and selects all pick it up automatically.
- SQLite's `contains` filter is case-sensitive for non-ASCII; search is deliberately
  simple. Moving to Postgres later means changing the datasource and the adapter in
  `src/lib/db.ts` — the queries themselves are portable.
