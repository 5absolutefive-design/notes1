# My Notebooks

A browser-based notebook app where users can create, organize, and write in notebooks — all data is saved locally in the browser using localStorage. No server or database required.

## Run & Operate

- `bash start.sh` — start the app (runs the frontend on port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS 4 + Radix UI
- Routing: wouter
- Data storage: browser localStorage (no backend, no database)
- Build: Vite

## Where things live

- `artifacts/notebook/` — the React frontend (the entire app)
- `artifacts/notebook/src/lib/store.ts` — localStorage store (source of truth for all data)
- `artifacts/notebook/src/pages/` — Home, BookView, PageEditor pages
- `lib/` — unused library packages (api-server, db, api-spec) kept for reference only

## Architecture decisions

- **100% browser-based**: All data lives in `localStorage` under keys `nb_books` and `nb_pages`. No API calls are made.
- **No login system**: Each user's data is isolated to their own browser. Different users on different browsers see different data.
- **Backup/Import**: Users can export their data as a JSON file and re-import it to avoid data loss on cache clear.
- **API server not used**: The `artifacts/api-server` and `lib/db` packages exist in the repo but are not started or used.

## Product

- Create colorful notebooks with custom covers (colors, patterns, images)
- Write pages inside each notebook with different page types (blank, lined, spreadsheet)
- Soft-delete pages to trash and restore or permanently delete
- Search notebooks by title
- Backup all data to a JSON file and import it back

## User preferences

- App should be browser-based (localStorage only), not server-based
- No login system needed
- Server/backend should not run

## Gotchas

- Data is lost if the user clears browser cache/localStorage — remind users to use the Backup button
- The `artifacts/api-server` code exists but is NOT started — `start.sh` only runs the frontend
- `DATABASE_URL` env var is provisioned but not used by the app
