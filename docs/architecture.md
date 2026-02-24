# Callhalla Architecture

Updated: 2026-02-24

## Layers

1. `src/app`
2. `src/widgets`
3. `src/features`
4. `src/entities`
5. `src/shared`
6. `src/actions`
7. `src/db`

## Dependency Direction

1. `app` -> `widgets`, `features`, `entities`, `shared`, `actions`
2. `widgets` -> `features`, `entities`, `shared`, `actions`
3. `features` -> `entities`, `shared`, `actions`
4. `entities` -> `shared`, `actions`
5. `shared` -> `shared`
6. `actions` -> `entities`, `shared`, `db`
7. `db` -> `db`

## Naming

1. `*.presentational.tsx` for render-only components.
2. `*.container.tsx` for state and side-effects.
3. `*.api.ts` for IO boundaries.
4. `*.pure.ts` for pure logic with required sibling `*.pure.test.ts`.
5. `*.types.ts` for local slice types.

## Shared UI

- shadcn/ui primitives are hosted in `src/shared/ui`.
- All upper layers consume shared UI through `@/shared` public exports.
- `components.json` aliases point shadcn generation to `src/shared/ui` and `src/shared/lib`.

## Vertical Slices

### API workbench

- Widget: request console shell and page composition.
- Feature: request composer, proxy execution client, response rendering.
- App route: `POST /api/proxy` executes outbound requests server-side.

### Auth and persistence

- Route: `/auth` for sign up/sign in.
- App and API routes require authenticated user.
- Saved request API: `GET/POST /api/saved-requests`, `DELETE /api/saved-requests/:id`.
- Supabase table `public.saved_requests` is protected by RLS (`auth.uid() = user_id`).
- Saved requests include flat tags and client-side search over name, URL, method, and tags.

## CORS Strategy

Browser-side direct fetches hit CORS policy checks. Callhalla routes requests through server-side `POST /api/proxy`, then the Next.js server performs outbound fetches and returns raw results.
