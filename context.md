# Change Log

## 2026-04-06

### Created `CLAUDE.md`
- Defined project rules: change tracking in `context.md`, agent workflow (Opus for planning, Sonnet for execution)

### Created `implementation.md` (v1)
- Initial 15-step high-level implementation plan based on PDD_MD.md specification

### Rewrote `implementation.md` (v2 — detailed decomposition)
- Expanded to 17 steps, 2925 lines with atomic sub-steps for Claude Sonnet 4.6 execution
- Every sub-step includes: exact shell commands, file paths, code snippets, dependency lists, verification criteria
- Covers: scaffolding, database/Prisma, auth, tickets, sessions, stats, images, health check, frontend layout/i18n, auth pages, quiz runner, stats/profile, admin panel, AI content pipeline, testing, Docker deployment, CI/CD
- Ends with execution order summary table (dependency graph)
- Source spec: `c:\Users\dimak\Downloads\PDD_MD.md`

## 2026-04-08

### Executed Step 1: Project Scaffolding & Monorepo Setup
- Initialized git repository
- Created root configs: `.gitignore`, `.nvmrc`, `.editorconfig`, `.prettierrc`, `.prettierignore`
- Created monorepo config: `package.json` (pnpm workspaces), `pnpm-workspace.yaml`, `turbo.json`
- Scaffolded Next.js 16 frontend (`apps/web`) — App Router, TypeScript, Tailwind CSS 4
- Scaffolded NestJS 11 backend (`apps/api`) — with helmet, JWT, passport, bcrypt, class-validator
- Created module directories in API: auth, tickets, sessions, stats, admin, images, common
- Created shared package (`packages/shared`) with enums and TypeScript interfaces
- Created `docker-compose.yml` (PostgreSQL 16 + pgAdmin)
- Installed pnpm 10.7.0 globally, turbo as root dev dependency
- Verified: `pnpm run build` succeeds for all 3 packages
- Files affected: 20+ files across root, apps/web, apps/api, packages/shared

### Executed Step 2: Database & Prisma ORM
- Installed Prisma 6 + @prisma/client (Prisma 7 requires Node 22+, project uses Node 20)
- Defined full Prisma schema with 8 models: User, Ticket, TicketOption, ImageAsset, TicketImage, Session, SessionTicket, SessionAnswer
- 7 enums: TicketStatus, SessionMode, Lang, Difficulty, TicketImageRole, UserRole
- GIN index on tags[], composite unique constraints, cascading deletes
- Created PrismaService + PrismaModule (@Global) integrated into AppModule
- Connected to local PostgreSQL (password: 1234), created `road_rules` database
- Ran initial migration `20260408000659_init`
- Created seed script (tsx) with 2 users (admin + regular) and 5 sample tickets with 4 options each
- Verified: all data in DB, `pnpm run build` passes for all packages
- Note: local PostgreSQL uses password `1234` (not Docker), `.env` updated accordingly
- Note: Switched from `prisma-client` (ESM-only) to `prisma-client-js` generator for CJS compatibility with NestJS. Import via `@prisma/client`
- Files affected: prisma/schema.prisma, prisma/seed.ts, prisma.config.ts, src/prisma/*.ts, src/app.module.ts, package.json, .env

### Executed Step 3: Backend — Auth Module
- Created common decorators: `@Public()`, `@CurrentUser()` in `src/common/decorators/`
- Created `RolesGuard` + `@Roles()` decorator in `src/common/guards/`
- Created auth DTOs: RegisterDto, LoginDto, RefreshDto with class-validator decorators
- Created `JwtStrategy` (passport-jwt, validates user from DB by JWT `sub` claim)
- Created `JwtAuthGuard` (global, respects `@Public()` decorator to skip auth)
- Created `AuthService` with: register, login, refreshTokens, logout, getProfile
  - Password hashing with bcrypt (10 rounds)
  - Access token (15min) + refresh token (7d) pair
  - Refresh token stored as bcrypt hash in DB for rotation/invalidation
- Created `AuthController` with 5 endpoints:
  - `POST /api/auth/register` (public) — returns token pair
  - `POST /api/auth/login` (public) — returns token pair
  - `POST /api/auth/refresh` (public) — rotates tokens
  - `POST /api/auth/logout` (authenticated) — clears refresh token
  - `GET /api/auth/me` (authenticated) — returns user profile
- Registered `AuthModule` in `AppModule`, `JwtAuthGuard` as global `APP_GUARD`
- Removed NestJS boilerplate (app.controller, app.service, app.controller.spec)
- Verified all endpoints with curl: register, login, me, refresh, 401 on unauthorized
- Full build passes for all 3 packages
- Files affected: src/auth/*.ts, src/auth/dto/*.ts, src/common/decorators/*.ts, src/common/guards/*.ts, src/app.module.ts

### Executed Step 4: Backend — Tickets Module
- Created `TicketsService` with 5 methods:
  - `findById(id)` — ticket with options and images
  - `findMany(filters)` — paginated listing with difficulty/status/tags/search filters
  - `importBulk(tickets[])` — validates 4 options + 1 correct, checks scenarioHash uniqueness
  - `publish(id)` — transitions DRAFT → PUBLISHED
  - `selectForSession(params)` — random selection via `ORDER BY RANDOM()` with SQL filters
- Created `TicketsController` (public endpoints):
  - `GET /api/tickets` — paginated list of PUBLISHED tickets, `isCorrect` included in options
  - `GET /api/tickets/:id` — single ticket, `isCorrect` stripped from options for public
- Created `AdminTicketsController` (ADMIN role required):
  - `GET /api/admin/tickets` — list all tickets including drafts
  - `GET /api/admin/tickets/:id` — full ticket with `isCorrect` visible
  - `POST /api/admin/tickets/import` — bulk import with validation report
  - `POST /api/admin/tickets/:id/publish` — publish a draft ticket
- Created DTOs: `TicketFilterDto`, `ImportTicketDto`, `ImportTicketsDto`, `ImportTicketOptionDto`
- Created `TicketsModule` (exports TicketsService) and `AdminModule` (imports TicketsModule)
- Registered both modules in AppModule
- Verified: all endpoints tested — public listing, difficulty filter, isCorrect hidden, admin import (1 created), publish draft, 403 for non-admin
- Files affected: src/tickets/*.ts, src/tickets/dto/*.ts, src/admin/*.ts, src/app.module.ts

### Executed Step 5: Backend — Sessions Module
- Created `SessionsService` with 4 methods:
  - `create(dto, userId?)` — selects random published tickets, creates Session + SessionTickets
  - `getSession(id)` — returns full session state with tickets, options, answers, progress counters
  - `submitAnswer(sessionId, dto)` — validates ticket in session, checks not already answered, computes isCorrect, returns explanation + next ticket
  - `finish(sessionId)` — calculates score (percentage), passed (exam: ≤2 errors), error breakdown by topic
- Created `SessionsController` (all endpoints @Public for guest access):
  - `POST /api/sessions` — create session (guest or authenticated)
  - `GET /api/sessions/:id` — session state with progress
  - `POST /api/sessions/:id/answer` — submit answer
  - `POST /api/sessions/:id/finish` — finish and get results
- Key behaviors verified:
  - `isCorrect` hidden on unanswered tickets, revealed after answer
  - Double-answer returns 400 "This ticket was already answered"
  - Double-finish returns 400 "Session already finished"
  - Answer returns explanation + pddRef + nextTicketId
  - Finish returns score, passed, errors with pddRef/tags
- Created DTOs: `CreateSessionDto`, `SubmitAnswerDto`
- Created `SessionsModule` (imports TicketsModule), registered in AppModule
- Files affected: src/sessions/*.ts, src/sessions/dto/*.ts, src/app.module.ts

### Executed Step 6: Backend — Stats Module
- Created `StatsService` with 2 methods:
  - `getOverview(userId)` — totalSessions, avgScore, bestScore, currentStreak, accuracyByDifficulty (raw SQL), sessionsOverTime (last 30 days)
  - `getTopicStats(userId)` — per-tag accuracy aggregation, weakest topics (sorted by error rate, min 2 answers)
- Created `StatsController` (auth required):
  - `GET /api/stats/overview` — full user stats overview
  - `GET /api/stats/topics` — per-topic accuracy breakdown + weakest topics
- Created `StatsModule`, registered in AppModule
- Fixed `JwtAuthGuard` to support optional auth on `@Public()` routes — tries to extract user from token but doesn't fail if absent. This fixes session creation to properly capture `userId` when authenticated.
- Verified stats with real data: 1 session, score 33, EASY 67%, MEDIUM 0%, HARD 0%, weakest topics: intersections, priority
- Verified: 401 on unauthorized, auth/guest session userId properly captured
- Files affected: src/stats/*.ts, src/auth/jwt-auth.guard.ts, src/app.module.ts

### Executed Step 7: Backend — Images Module
- Installed `axios` for HTTP requests to Wikimedia Commons API
- Created `ImagesService` with 2 methods:
  - `searchWikimedia(query)` — searches Commons API with `generator=search`, `prop=imageinfo`, `iiprop=url|extmetadata|size`, filters by allowed licenses (CC0/PD/CC-BY/CC-BY-SA), builds TASL attribution strings. Requires `User-Agent` header (Wikimedia returns 403 without it).
  - `attachImage(ticketId, imageData)` — downloads image, computes sha256, deduplicates by hash, saves to `uploads/images/{sha256}.{ext}`, creates ImageAsset + TicketImage records. Handles role-based linking (PRIMARY/SECONDARY).
- Created `AdminImagesController` (ADMIN only):
  - `POST /api/admin/images/resolve` — search Wikimedia, returns candidates with pageUrl, fileUrl, license, author, attribution
  - `POST /api/admin/images/attach` — download and attach image to ticket
- Created DTOs: `ResolveImageDto`, `AttachImageDto`
- Created `ImagesModule`, registered in AppModule
- Created `uploads/images/` directory, added `uploads/` to `.gitignore`
- Verified: search returns 10 candidates for "UA road sign 2.1 svg", attach downloads SVG (955 bytes), 403 for non-admin
- Files affected: src/images/*.ts, src/images/dto/*.ts, src/app.module.ts, .gitignore

### Executed Step 8: Backend — Health Check & Final API Assembly
- Created `HealthController` with `GET /api/health` (@Public) — returns `{"status":"ok","timestamp":"..."}`
- Created `HealthModule`, registered in AppModule
- Finalized AppModule with all 8 modules in clean order: Prisma, Auth, Tickets, Sessions, Stats, Images, Admin, Health
- All 17 routes mapped and verified:
  - Auth: 5 routes (register, login, refresh, logout, me)
  - Tickets: 2 routes (list, getById)
  - Sessions: 4 routes (create, get, answer, finish)
  - Stats: 2 routes (overview, topics)
  - Admin/Tickets: 4 routes (list, get, import, publish)
  - Admin/Images: 2 routes (resolve, attach)
  - Health: 1 route (check)
- Backend is feature-complete for Steps 1-8
- Files affected: src/health/*.ts, src/app.module.ts

### Executed Step 9: Frontend — Core Layout & i18n
- Installed next-intl, zustand, axios in apps/web
- Created i18n system:
  - `messages/ru.json` — full Russian translations (common, quiz, stats, auth, footer)
  - `messages/uk.json` — full Ukrainian translations
  - `src/i18n/request.ts` — server-side locale detection from cookie
  - `next.config.ts` — integrated next-intl plugin
- Created API client (`src/lib/api.ts`):
  - Axios instance with baseURL from `NEXT_PUBLIC_API_URL`
  - Request interceptor: auto-attaches JWT from localStorage
  - Response interceptor: auto-refresh on 401 with retry
- Created auth store (`src/store/auth.ts`) with Zustand:
  - login, register, logout, fetchProfile actions
  - Token persistence in localStorage
- Created layout components:
  - `Header` — nav links (Practice, Exam, Stats), LanguageSwitcher, login/logout button
  - `Footer` — disclaimer text (translated)
  - `LanguageSwitcher` — RU/UA toggle via cookie + router.refresh()
- Updated root layout: NextIntlClientProvider, Header, Footer, Geist font
- Created placeholder pages: `/`, `/practice`, `/exam`, `/stats`, `/login` — all with translations
- Added `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- Full monorepo build passes (all 3 packages, 5 frontend routes)
- Files affected: apps/web — 15+ files (components, i18n, lib, store, pages, config)

### Executed Step 10: Frontend — Auth Pages
- Created `/login` page — email/password form, auth store login(), error display, loading state, link to register
- Created `/register` page — same structure, auth store register(), minLength=6 validation, link to login
- Both pages use `useTranslations("auth")` for RU/UA i18n
- On success: stores tokens in localStorage, fetches profile, redirects to `/`
- On error: displays server error message (e.g. "Email already registered", "Invalid credentials")
- Build passes: 6 frontend routes (/, /practice, /exam, /stats, /login, /register)
- Files affected: apps/web/src/app/login/page.tsx, apps/web/src/app/register/page.tsx

### Executed Step 11: Frontend — Quiz Runner (Core Feature)
- Created quiz store (`src/store/quiz.ts`) with Zustand:
  - `startSession(mode, lang)` — creates session via API, fetches full data with questions
  - `submitAnswer(ticketId, optionId, timeMs)` — posts answer, stores result
  - `nextTicket()` — advances currentIndex, clears lastAnswer
  - `finishSession()` — finishes via API, stores FinishResult
  - `reset()` — clears all state
- Created `/practice` page — language picker (RU/UA), starts PRACTICE session
- Created `/exam` page — language picker, starts EXAM session, shows 20min/2errors rule
- Created quiz components:
  - `TicketCard` — question text (RU/UA), 4 option buttons (A/B/C/D), answer submission, green/red highlights, explanation panel, Next/Finish buttons
  - `QuizProgress` — progress bar + "Question X of Y" + error counter
  - `QuizTimer` — 20-minute countdown (MM:SS), red when <2min, auto-finish on timeout
- Created `/quiz` page — orchestrates TicketCard + Progress + Timer, redirects if no session or finished
- Created `/results` page — score display (e.g. "4/6"), passed/failed, error list with pddRef+tags, Try Again / Stats buttons, total time display
- Full monorepo build passes: 8 frontend routes (/, /practice, /exam, /quiz, /results, /stats, /login, /register)
- Files affected: store/quiz.ts, app/practice/page.tsx, app/exam/page.tsx, app/quiz/page.tsx, app/results/page.tsx, components/quiz/*.tsx

### Executed Step 12: Frontend — Stats & Profile
- Installed `recharts` for charts
- Created `ProtectedRoute` component — checks auth via fetchProfile(), redirects to /login if unauthenticated, shows loading state
- Created `/stats` page (protected):
  - 4 overview cards: Total Sessions, Avg Score, Best Score, Current Streak
  - LineChart (recharts): score over last 30 days
  - BarChart (recharts): accuracy per topic (horizontal bars)
  - Weakest topics section with tag badges
  - Fetches from `GET /api/stats/overview` + `GET /api/stats/topics`
- Created `/history` page (protected):
  - Paginated table: Date, Mode (EXAM/PRACTICE badge), Score (green/red), Time
  - Pagination (Back/Next) with page counter
  - Empty state with link to /practice
  - Fetches from new `GET /api/stats/history` endpoint
- Added `GET /api/stats/history` endpoint to backend StatsController/StatsService — paginated user session list
- Added "History" nav link to Header (shown when logged in)
- Added `history` i18n key to ru.json ("История") and uk.json ("Історія")
- Full monorepo build passes: 9 frontend routes, 21 API routes
- Files affected: apps/web (stats, history pages, ProtectedRoute, Header, messages), apps/api (stats service/controller)

### Executed Step 13: Admin Panel
- Created admin layout (`/admin/layout.tsx`):
  - Sidebar navigation: Dashboard, Tickets, Import, Images
  - Active link highlighting based on pathname
  - Role check: non-ADMIN users see "Access denied"
  - Wrapped in ProtectedRoute for auth
- Created `/admin` dashboard:
  - 4 stat cards: Total Tickets, Published, Draft, Archived (fetched via 3 parallel API calls)
  - Quick action buttons: Import Tickets, Manage Tickets
- Created `/admin/tickets` management page:
  - Paginated ticket table: Ref, Question (truncated), Difficulty badge, Status badge, Actions
  - Filters: status dropdown, difficulty dropdown, search input
  - Actions: View (→ detail page), Publish (for DRAFT tickets)
  - Pagination with total count
- Created `/admin/tickets/[id]` detail page:
  - Full ticket view: question RU/UK, options (correct highlighted green), explanation RU/UK
  - Status/difficulty/tags badges
  - Publish button (for DRAFT)
  - Image attachments section
  - Metadata (ID, scenarioHash, imageBrief)
- Created `/admin/import` page:
  - JSON textarea for pasting ticket data
  - Validate button (previews ticket count)
  - Import button → calls POST /admin/tickets/import
  - Result display: total, created, errors list with index + message
- Created `/admin/images` page:
  - Ticket ID input field
  - Wikimedia Commons search (query input → POST /admin/images/resolve)
  - Candidate grid: title, author, license, dimensions, "View on Commons" link
  - Attach button per candidate → POST /admin/images/attach
  - Success/error feedback
- Full monorepo build passes: 14 frontend routes (9 public + 5 admin), 21 API routes
- Files affected: apps/web/src/app/admin/ (layout, page, tickets, import, images — 6 files)

### Executed Step 14: Content Generation Pipeline (AI Agents)
- Created `agents/` directory structure: `prompts/`, `scripts/`, `data/`
- Created 3 agent prompts (for use with Claude Opus 4.6):
  - `pdd-extractor.md` — extracts rules from official PDD into JSONL (pddRef, ua_excerpt_short ≤25 words, keywords, exceptions, applicability). Target: 150–300 rule cards.
  - `ticket-generator.md` — generates exam tickets from rules. Schema matches ImportTicketDto. Quotas: EASY:200, MEDIUM:500, HARD:300. Bilingual RU+UK. Batches of 50.
  - `ticket-validator.md` — independent QA: derives correct answer from PDD evidence, checks ambiguity, distractor quality, language, explanation, metadata. Verdicts: pass/fail/needs_review.
- Created 2 executable scripts (TypeScript, run with tsx):
  - `search-images.ts` — reads tickets JSONL, queries Wikimedia Commons API per ticket, ranks by license (PD > CC-BY > CC-BY-SA), outputs `images.resolved.jsonl`. Rate-limited 1 req/sec.
  - `import-tickets.ts` — reads tickets JSONL, validates schema locally (4 opts, 1 correct, required fields), imports in batches of 50 via POST /admin/tickets/import. Auto-login as admin.
- Files affected: agents/prompts/*.md, agents/scripts/*.ts, agents/data/.gitkeep

### Executed Step 15: Testing
- Created 3 unit test suites (31 tests total, all pass):
  - `auth.service.spec.ts` (8 tests): register (success + duplicate email), login (success + wrong email + wrong password), logout, getProfile (success + not found)
  - `tickets.service.spec.ts` (12 tests): findById (success + not found), findMany (pagination + search filter), importBulk (valid + wrong correct count + duplicate hash), publish (success + non-draft + not found), selectForSession (success + no available)
  - `sessions.service.spec.ts` (11 tests): create, getSession (success + not found), submitAnswer (success + double answer + finished session + invalid option + wrong ticket), finish (score calculation + double finish + not found)
- Created E2E test suite (16 tests, all pass):
  - Health: GET /api/health returns ok
  - Auth flow: register, login, get profile, 401 without token, refresh
  - Tickets: list published, difficulty filter
  - Session flow: create guest session, get state, submit answer, double answer rejected (400), finish, double finish rejected (400)
  - Admin: list tickets as admin, import ticket, 403 for non-admin
- All tests use mocked Prisma for unit tests, real DB for E2E
- Total: 47 tests (31 unit + 16 E2E), all passing
- Full monorepo build passes: 3 packages, 14 frontend routes, 21 API routes
- Files affected: apps/api/src/**/*.spec.ts (3 files), apps/api/test/app.e2e-spec.ts

### Executed Step 16: Containerization & Deployment
- Created API Dockerfile (`apps/api/Dockerfile`):
  - Multi-stage: base (node:20-alpine + pnpm) → deps (install) → build (prisma generate + nest build) → production (dist + prisma + node_modules)
  - Runs `dist/src/main.js` on port 3001
- Created Web Dockerfile (`apps/web/Dockerfile`):
  - Multi-stage: base → deps → build (next build) → production (standalone output)
  - Copies `.next/standalone`, `.next/static`, `public`
  - Runs `apps/web/server.js` on port 3000
- Created production Docker Compose (`docker-compose.prod.yml`):
  - 4 services: postgres, api, web, nginx
  - Internal network, env vars from `.env` file
  - Nginx reverse proxy on ports 80/443
- Created Nginx config (`nginx.conf`):
  - `/api/` → upstream api:3001
  - `/` → upstream web:3000
  - Certbot ACME challenge location
  - Proxy headers (X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
- Created `.env.production.example` with all required env vars
- Created `.dockerignore` to exclude node_modules, .next, dist, .git, uploads, .env files
- Full monorepo build passes
- Files affected: apps/api/Dockerfile, apps/web/Dockerfile, docker-compose.prod.yml, nginx.conf, .env.production.example, .dockerignore

### Executed Step 17: CI/CD Pipeline (Final Step)
- Created `.github/workflows/ci.yml` with 3 parallel jobs:
  - **lint-and-typecheck**: pnpm install → prisma generate → lint API + lint Web → tsc --noEmit API
  - **test-api**: PostgreSQL 16 service container → prisma generate → migrate deploy → seed → unit tests + E2E tests
  - **build**: (depends on lint + test) → pnpm install → prisma generate → pnpm run build (all 3 packages)
- CI triggers: push to main/develop, PR to main/develop
- Concurrency: cancels in-progress runs for same branch
- Environment: Node 20, pnpm 10, ubuntu-latest
- Final verification: 47 tests pass (31 unit + 16 E2E), full monorepo build succeeds
- Files affected: .github/workflows/ci.yml

## PROJECT COMPLETE
All 17 steps of the implementation plan have been executed:
- Backend: 8 NestJS modules, 21 API routes, Prisma ORM, PostgreSQL
- Frontend: 14 Next.js routes, i18n (RU/UA), Zustand state, Tailwind CSS
- Testing: 47 tests (unit + E2E)
- Infrastructure: Docker (multi-stage), Docker Compose (prod), Nginx, CI/CD
- Content pipeline: 3 AI agent prompts + 2 scripts
