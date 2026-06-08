# Wikala Admin

Staff admin dashboard for **Wikala** (MENA classifieds marketplace). Next.js 14 (App Router) · TypeScript (strict) · RTL-first Arabic UI. Consumes the Wikala backend API.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) · React 18 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS · shadcn/ui · design tokens (CSS vars) |
| Server state | TanStack Query |
| Tables | TanStack Table (server-side pagination/sorting) |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Realtime | socket.io-client (`/admin` namespace) |
| Maps | Google Maps (`@react-google-maps/api`) |
| Icons | Iconify (Fluent Emoji) · lucide-react |
| Testing | Vitest + Testing Library · Playwright (e2e) |

---

## Requirements

- **Node.js 20+** and npm (this project uses **npm**, not pnpm)
- A running **Wikala backend API** (default `http://localhost:3000`) — see the `backend/` service

---

## Quick start

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env.local      # then set NEXT_PUBLIC_API_URL (and Maps key if needed)

# 3. run (the backend must be running too)
npm run dev                     # http://localhost:4000
```

> Sign in with a staff account (email + password → TOTP 2FA). For local dev, seed/reset the staff account from the backend: `node scripts/seed-staff.js` (creates `superadmin@wikala.dev` / `Staff@1234`, then enroll an authenticator on first login).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **4000** |
| `npm run build` | Production build |
| `npm start` | Serve production build (port 4000) |
| `npm run lint` | ESLint (next lint) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write `src/**` |
| `npm test` | Vitest (run once) |
| `npm run test:watch` | Vitest watch |
| `npm run e2e` | Playwright end-to-end tests |

---

## Environment

| Var | Required | Default | Purpose |
|-----|:--:|---------|---------|
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:3000/api/v1` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no | — | Google Maps (location pickers/maps) |

Put these in `.env.local` (git-ignored). See [`.env.example`](.env.example).

---

## Project structure

```
admin/src/
├── app/
│   ├── layout.tsx            # root layout — fonts, globals.css, RTL <html dir="rtl">
│   ├── globals.css           # design tokens (CSS custom properties)
│   ├── (dashboard)/          # authenticated route group (AppShell)
│   │   └── <page>/page.tsx   # one directory per admin route
│   └── login/                # auth pages (outside the dashboard group)
├── components/
│   ├── shell/                # AppShell, Sidebar, Topbar
│   ├── ui/                   # base primitives (shadcn/ui + Icon)
│   └── <feature>/            # feature components
├── features/                 # per-feature hooks: data fetching + mutations
│   └── <feature>/use-*.ts
├── lib/
│   ├── api/                  # API client helpers
│   ├── socket/               # admin socket client
│   ├── fonts.ts · nav.ts · maps.ts · utils.ts
└── test/render.tsx           # renderWithProviders helper for Vitest
```

---

## Conventions

- **RTL-first:** `<html lang="ar" dir="rtl">`. Use Tailwind **logical** properties (`ms-`, `me-`, `ps-`, `pe-`) — never physical `left`/`right`.
- **Arabic-only UI:** strings are inline Arabic (no i18n catalog).
- **Design tokens:** all colors/radii/shadows come from CSS custom properties in `globals.css` + the Tailwind theme — no raw hex in components.
- **Fonts:** IBM Plex Sans Arabic (UI), IBM Plex Mono (prices/IDs/counts), Cairo (fallback).
- **Data:** never use mock/static data — every view fetches real data from the API via TanStack Query.
- **State:** server state → TanStack Query; client/UI + auth → Zustand; forms → React Hook Form + Zod; tables → TanStack Table (server-side).
- **Path alias:** `@/*` → `src/*`.

---

## Auth

Staff sign-in is two-step against the backend: `POST /admin/auth/login` (email + password) → `challengeToken` → `POST /admin/auth/2fa/verify` (TOTP) → staff JWT (access + refresh). The access token is attached to API requests and refreshed automatically.

---

## Testing

```bash
npm test            # unit (Vitest)
npm run e2e         # end-to-end (Playwright)
npm run typecheck   # types
npm run lint        # lint
```
