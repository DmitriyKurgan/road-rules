# Change Log

## 2026-04-06

### Created `CLAUDE.md`
- Defined project rules: change tracking in `context.md`, agent workflow (Opus for planning, Sonnet for execution)

### Created `implementation.md` (v1 → v2)
- Full 17-step implementation plan, 2925 lines, atomic sub-steps for Claude Sonnet 4.6
- Source spec: `c:\Users\dimak\Downloads\PDD_MD.md`

## 2026-04-08

### Steps 1-8: Backend complete
- **Step 1**: Monorepo (pnpm + turbo), Next.js 16, NestJS 11, shared types
- **Step 2**: Prisma 6, PostgreSQL, 8 models, 7 enums, seed data
- **Step 3**: Auth (JWT + bcrypt + refresh tokens, 5 endpoints)
- **Step 4**: Tickets (CRUD, import, publish, random selection)
- **Step 5**: Sessions (create, answer, finish, guest mode)
- **Step 6**: Stats (overview, topics, optional auth on @Public routes)
- **Step 7**: Images (Wikimedia search, download, attach, User-Agent fix)
- **Step 8**: Health check, final 21 API routes

### Steps 9-13: Frontend complete
- **Step 9**: i18n (RU/UA), API client with auto-refresh, Zustand auth store, Header/Footer/LanguageSwitcher
- **Step 10**: Login/Register pages with error handling
- **Step 11**: Quiz runner (TicketCard, QuizProgress, QuizTimer, Results page)
- **Step 12**: Stats dashboard (recharts), session history, ProtectedRoute
- **Step 13**: Admin panel (dashboard, ticket management, import, image search)

### Steps 14-17: Infrastructure & Pipeline
- **Step 14**: AI agent prompts (extractor, generator, validator) + scripts (search-images, import-tickets)
- **Step 15**: 47 tests (31 unit + 16 E2E), all passing
- **Step 16**: Docker multi-stage, Docker Compose prod, Nginx reverse proxy
- **Step 17**: GitHub Actions CI (lint, test, build)

## 2026-04-09

### Content Generation: 984 tickets
- Created `agents/data/rules.jsonl` — 40 PDD norms for ticket generation
- Generated batch-001.json (47 tickets) and imported manually
- Generated batches 002-020 using 6 parallel Sonnet agents:
  - batch-002: Warning signs (1.x) — 54 tickets
  - batch-003: Priority signs (2.x) — 44 tickets
  - batch-004: Prohibitory signs (3.x) — 48 tickets
  - batch-005: Mandatory signs (4.x) — 51 tickets
  - batch-006: Informational signs (5-6.x) — 50 tickets
  - batch-007: Traffic lights (8.x) — 48 tickets
  - batch-008: Road markings (9.x) — 51 tickets
  - batch-009: Speed rules (11-12) — 49 tickets
  - batch-010: Maneuvering (10.x) — 48 tickets
  - batch-011: Overtaking (14.x) — 51 tickets
  - batch-012: Stopping & parking (15.x) — 46 tickets
  - batch-013: Regulated intersections (16.1-9) — 48 tickets
  - batch-014: Unregulated intersections (16.10-15) — 55 tickets
  - batch-015: Pedestrians (17-18) — 49 tickets
  - batch-016: Railway crossings (20.x) — 50 tickets
  - batch-017: Towing/cargo/passengers (21-23) — 50 tickets
  - batch-018: Driver duties (1-2) — 50 tickets
  - batch-019: First aid — 50 tickets
  - batch-020: Mixed hard exam — 50 tickets
- Created `agents/scripts/import-all-batches.ts` — chunked import (10 per request to avoid 413)
- Fixed API body limit: `app.useBodyParser("json", { limit: "10mb" })`
- All 984 tickets published. Distribution: EASY 257, MEDIUM 432, HARD 295
- Files: agents/data/batch-*.json, agents/scripts/import-all-batches.ts, apps/api/src/main.ts

### Image System: Curated mapping + Generated situational images
- **Problem**: Wikimedia search returned random PDFs and wrong signs for many tickets
- **Fix 1**: Added PDF/DjVu filter to `ImagesService.searchWikimedia()` — skips non-image files
- **Fix 2**: Created curated `agents/data/image-map.json` — maps pddRef → exact Wikimedia sign filename
- **Fix 3**: Created `agents/scripts/fix-images.ts` — uses API search to resolve real download URLs, then attaches correct signs
- **Fix 4**: Auto-attach on import — `AdminTicketsController.importBulk()` now calls `ImagesService` in background after import
- Added `findByScenarioHash()` to TicketsService
- Updated `AdminModule` to import `ImagesModule`
- Session API now returns images: updated `getSession()` to include `ticket.images` with URL/title/attribution
- Added static file serving: `app.useStaticAssets("uploads", { prefix: "/uploads" })` with `crossOriginResourcePolicy: "cross-origin"`
- Updated `TicketCard` component to render images between question and options

### Generated Situational Images (26 custom illustrations)
- Created `agents/data/image-prompts.md` — 26 prompts for ChatGPT/DALL-E image generation
- Created `agents/data/situational-images.md` — detailed descriptions of 12 categories needing generated images
- User generated 26 PNG images and placed in `agents/data/generated-images/`:
  - 01-06: Intersections (equal 2-car, equal 3-car, left turn, main+secondary, T-junction, main road turns)
  - 10-11: Traffic lights (filter arrow + red, left turn on green)
  - 12-14: Overtaking (oncoming, chain prohibited, at crosswalk)
  - 15: Simultaneous lane change
  - 16: Roundabout
  - 17-18: Pedestrians (crossing, jaywalking)
  - 19-20: Railway (stalled on tracks, barrier closed)
  - 21: Towing
  - 22: Night headlights
  - 23-26: First aid (CPR, tourniquet, fracture splint, recovery position)
- Images stored in `apps/api/uploads/images/` and served as static files
- Created `image_assets` records with `sha256 LIKE 'gen-%'` for generated images
- Linked to tickets via SQL UPDATE based on scenarioHash patterns

### Image Audit & Fixes
- Identified mismatches: 70 warning signs showing 1.1 for all, 50 first aid with road signs, 51 railway with intersection sign, 17 documents with warning sign
- Fixed: Railway (20.x) → sign 1.16, First aid → removed wrong signs → linked to generated medical images (23-26), Documents → removed wrong signs → linked to generic sign
- Final state: **984/984 tickets with images** (264 generated + 720 road signs)

### Premium UI Redesign
- Installed `framer-motion` for animations
- New design system in `globals.css`:
  - CSS variables for light/dark themes (tropical color palette: teal/emerald/cyan)
  - Glassmorphism `.glass-card` with backdrop-filter blur
  - Ambient glow blobs with `ambientFloat` animation
  - Gradient progress bar with glowing head
  - Spring easing transitions `cubic-bezier(0.22, 1, 0.36, 1)`
  - Custom scrollbar, focus-visible rings
- Tropical background: radial gradients (teal, emerald, golden accents) for both light and dark
- Header: sticky glassmorphism, mobile hamburger menu with animated lines, teal accent
- Home page: Framer Motion staggered entrance, shimmer hover on CTA, feature cards
- TicketCard: AnimatePresence slide transitions, hover scale(1.01)/glow, click scale(0.98), wrong answer shake, correct green glow, animated feedback reveal, click debounce (isLocked)
- QuizProgress: animated gradient fill bar with Framer Motion
- QuizTimer: pulsing red animation when <2min
- Results: spring scale animation on score circle, staggered reveals
- Login/Register: glass cards, rounded inputs with focus rings
- Practice/Exam: glass cards with emoji icons, language picker buttons
- All pages responsive: mobile hamburger, compact quiz cards, touch-friendly targets

### Dark Theme Fix
- Moved CSS variables out of `@layer base` to root level (Tailwind 4 compatibility)
- `classList.add/remove` instead of `toggle` for reliability
- Inline `<script>` in layout head for flash prevention (reads localStorage before render)
- `suppressHydrationWarning` on `<html>`

### Quiz Card Compact Fix (no-scroll)
- Quiz page padding: `py-8` → `py-3`, card: `p-6` → `p-4 sm:p-5`
- Options: `p-4 space-y-3` → `px-3 py-2.5 space-y-2`
- Image: `max-h-44` → `max-h-24 sm:max-h-28`
- Question font: `text-lg` → `text-[15px] sm:text-base`
- Added `html { overflow-x: hidden }` to prevent glow blob scrollbar
- Header: short "ПДД" on mobile, full name on sm+
- Progress bar: `w-40` → `w-24 sm:w-44`

## Current State
- **984 published tickets** with images (264 generated + 720 Wikimedia signs)
- **21 API routes** across 8 NestJS modules
- **14 frontend routes** (9 public + 5 admin)
- **47 tests** (31 unit + 16 E2E)
- **Dark/light theme** with localStorage persistence
- **RU/UA i18n** with cookie-based locale
- **Premium UI** with Framer Motion animations, glassmorphism, tropical theme
- **Mobile responsive** with hamburger menu, compact quiz cards
- **Docker + CI/CD** ready for deployment
