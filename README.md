# Callhalla

API testing workbench inspired by Postman/Insomnia.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui primitives (`components.json`) in `src/shared/ui`
- Supabase Auth + Postgres
- Vitest
- ESLint flat config
- Chaperone deterministic architecture checks

## Setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

## Run

```bash
npm run dev
```

## Quality Gates

```bash
npm run lint
npm run test:run
npm run build
npm run check:architecture
```

## Current Scope

- Supabase auth gate for the whole app (`/` + API routes)
- Sign up / sign in flow at `/auth`
- Multi-workspace context (create/switch/rename)
- Per-workspace environments (create/switch)
- Per-workspace variable definitions with per-environment values
- Send HTTP requests with method, URL, headers
- JSON/text request body modes
- Server proxy (`/api/proxy`) for CORS-safe browser UX with server-side `{{variable}}` interpolation
- Save requests per authenticated user within the active workspace, with tags, and load/delete them later
- Search saved requests by name, method, URL, and tags

## Supabase Schema

SQL migration is in:

- `supabase/migrations/20260224113000_create_saved_requests.sql`
- `supabase/migrations/20260224130000_add_saved_request_tags.sql`
- `supabase/migrations/20260224181500_workspace_context_and_interpolation.sql`

It creates workspace/environment/variable tables plus updates `public.saved_requests` workspace scoping under RLS.

## Next Scope

- Collections and folders
- Auth presets (Bearer/API key/Basic)
- Webhook capture inbox
