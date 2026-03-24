# MangaStream

A modern manga/manhwa reading platform with a movie-streaming style interface.

## Architecture

- **Frontend**: React + Vite, TanStack Query, Wouter (routing), shadcn/ui, Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect via passport.js)

## Key Design Decisions

- Dark mode by default (CSS variables in `index.css`)
- Reader page (`/read/:id`) is full-screen with NO sidebar layout
- All other pages use the `<Layout>` component with a sticky sidebar
- Only `neshananashi@gmail.com` has `isAdmin = true` (set in `replitAuth.ts`)
- Admin users see a "Creator Studio" nav item and can access `/upload`
- Backend enforces admin-only on POST `/api/series` and POST `/api/series/:id/chapters`

## Project Structure

```
client/src/
  App.tsx              # Router — Reader gets no Layout, all other pages get Layout
  pages/
    Home.tsx           # Hero carousel + trending/new sections
    Browse.tsx         # Filterable grid of all series
    SeriesDetail.tsx   # Series info + chapter list
    Reader.tsx         # Full-screen vertical scroll reader (no Layout)
    Upload.tsx         # Admin-only creator dashboard
  components/
    Layout.tsx         # Sidebar nav + mobile header
    SeriesCard.tsx     # Card used in grid views
  hooks/
    use-auth.ts        # Auth state via /api/auth/user
    use-series.ts      # Series queries
    use-chapters.ts    # Chapter queries
    use-progress.ts    # Reading progress mutations

server/
  routes.ts            # All API routes + seeding logic
  storage.ts           # IStorage interface + DatabaseStorage implementation
  replit_integrations/auth/
    replitAuth.ts      # Passport OIDC setup, admin email check
    storage.ts         # User upsert for auth

shared/
  schema.ts            # Drizzle tables: series, chapters, pages, readingProgress
  routes.ts            # Typed API route definitions
  models/auth.ts       # User model (from Replit auth integration)
```

## Running

Workflow "Start application" runs `npm run dev`, which starts both the Express backend and Vite frontend on the same port.

## Database

PostgreSQL is available via `DATABASE_URL`. Run `npm run db:push` to sync schema changes.
