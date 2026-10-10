# Kids Daily Learning 🌟

**Learn. Play. Grow. Every Day.** Safe, joyful daily learning for children aged 4–12, with short lessons, quizzes, stories, games, creative activities and good-habit challenges. Parents get a calm dashboard and full control.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · PostgreSQL + Prisma · jose (JWT sessions) · bcrypt · zod
- **Two data modes, one UI:** `NEXT_PUBLIC_DATA_MODE=api` (production: API routes + Postgres) or `mock` (everything in the browser, no database)

---

## Quick start

```bash
cp .env.example .env              # set DATABASE_URL and AUTH_SECRET
npm install
npm run db:deploy                 # create tables (applies prisma/migrations)
npm run db:seed:demo              # curriculum + demo family (dev only)
npm run dev                       # http://localhost:3000
```

Demo login: **demo@kidsdaily.app / learn2day**. The demo parent is also a content admin.

**No account needed to learn.** Visitors tap *Start Learning*, pick a nickname, age and avatar, and use lessons, quizzes, stories, games, rewards and their profile straight away. Guest progress is kept on that device only (`src/state/guestService.ts`) and never sent to the database; Buddy (AI) stays off until a grown-up creates a parent account. Parent accounts add synced progress, multiple children, goals, screen-time limits and the dashboard. Parent pages (`/parent`, `/profiles`) and content admin (`/admin`) still require a login, and admin also requires the ADMIN role.

### Deploying to Vercel

Set these Environment Variables (Production, and Preview if used) before deploying:

| Variable | Value |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase, Vercel Postgres…). On Supabase use the **session** pooler (port 5432), or add `?pgbouncer=true` to a transaction-pooler URL. |
| `AUTH_SECRET` | 32+ random characters (`openssl rand -base64 48`). Changing it logs everyone out. |
| `NEXT_PUBLIC_DATA_MODE` | `api` |

The Vercel build (`npm run build`) never touches the database. Create the tables separately — once now, and again whenever `prisma/migrations` changes — by running this from your machine with the production connection string:

```bash
DATABASE_URL="<production url>" npm run db:deploy
```

`migrate deploy` only applies pending migrations; it never resets or deletes data. Then run `npm run db:seed` the same way to load the curriculum (until then the built-in curriculum is served). If the database already has tables from an earlier `db:push`, baseline it once with `npx prisma migrate resolve --applied 20261005000000_init` instead.

No database yet? Run `npm run dev:mock` and the whole app runs on in-browser demo data. The same mock powers the single-file playable demo: run `npm run demo:build` to produce `demo/dist/kids-daily-learning-demo.html`.

```bash
npm test          # engine unit tests (vitest)
npm run typecheck
npm run lint
```

---

## Architecture

```
src/
  core/                 Framework-agnostic domain — no React, no Next, no DB
    types.ts            Domain model (Child, Activity, Question, Completion, …)
    content/            Built-in curriculum: subjects, age groups, 50 words, 15 units,
                        7 stories, creative prompts, habits, 16 badges
    engine/             The learning engine (pure functions, unit-tested)
      levels.ts           age → base level; recent scores → ±1 adaptive level
      generators/         math, english and brain-game question generators (seeded)
      plan.ts             buildDailyPlan() — Today's Adventure; resolveActivity(id)
      scoring.ts          checkAnswer / scoreAttempt for all 6 question types
      rewards.ts          stars, XP, streaks, badge rules
      progress.ts         summary, mastery, 7/14-day stats, recommendations
      complete.ts         completeActivity(): score → XP → streak → badges → notifications
    buddy/              Buddy safety layer (input + output filters) and mock tutor
    validation.ts       Shared input rules (client feedback; server mirrors in zod)
  state/                Data boundary used by every screen
    service.ts          DataService interface
    apiService.ts       ▶ PRODUCTION implementation (fetch → /api/*)
    mockService.ts      Mock implementation (browser; same rules & guards)
    mockSeed.ts         Demo family built by *playing* past days through the engine
  ui/                   Design system: primitives, charts, quiz components, shells
  screens/              One component per page (child / parent / public / admin)
  nav/                  Tiny router abstraction (Next adapter + demo hash adapter)
  app/                  Next.js routes: thin page files + API route handlers
  server/               Server-only: Prisma client, sessions, authz guards, rate
                        limits, zod schemas, content loader, progress repository, Buddy
  middleware.ts         CSRF origin check, page auth redirects, security headers
prisma/schema.prisma    PostgreSQL schema
demo/main.tsx           Playable demo entry (same screens + MockDataService)
tests/engine.test.ts    Engine tests (daily plan, adaptivity, scoring, streaks, badges, Buddy)
```

### How a day works

1. `buildDailyPlan(child, history, content, day)` picks 5–7 activities: English, Math, Science or World (alternating days), Story, Brain Game, Creativity and Good Habit, filtered by the parent's allowed subjects.
2. Difficulty = the age group's base level, adjusted by at most one level from the last five scores in that subject (avg ≥ 85% → up, < 50% → down). Only history from *before* today is used, so a day's plan never shifts mid-day.
3. Activities are **deterministic from their id** (`d.2026-09-24.math`). The server rebuilds the activity and scores the raw answers itself. Clients never send a score or XP.
4. `completeActivity()` returns score, stars (finishing always earns at least one), XP (repeats earn practice XP only), streak (missing a day restarts gently at 1), new badges and parent notifications. In production `recordCompletion()` persists all of it in one transaction.

### Pages (all 20 required, plus extras)

| # | Page | Route |
|---|------|-------|
| 1 | Landing | `/` |
| 2 | Parent Sign Up | `/signup` |
| 3 | Parent Login | `/login` |
| 4 | Child Profile Selection | `/profiles` |
| 5 | Child Home | `/home` |
| 6 | Learn | `/learn` |
| 7 | Subject | `/learn/[subject]` |
| 8 | Lesson | `/lesson/[id]` |
| 9 | Quiz | `/quiz/[id]` |
| 10 | Activity Completion | `/complete/[id]` |
| 11 | Games (+ Memory Match) | `/games`, `/memory/[id]` |
| 12 | Stories (+ reader with 🔊 Listen) | `/stories`, `/read/[id]` |
| 13 | Rewards | `/rewards` |
| 14 | Badges | `/badges` |
| 15 | Child Profile | `/me` |
| 16 | Parent Dashboard | `/parent` |
| 17 | Progress | `/parent/progress` |
| 18 | Parent Settings | `/parent/settings` |
| 19 | AI Buddy | `/buddy` |
| 20 | Privacy / Safety | `/safety` |
| + | Children management, Creative canvas, Habit checklist, Content admin | `/parent/children`, `/create/[id]`, `/habit/[id]`, `/admin` |

Quiz question types: multiple choice, true/false, picture choice (image-based), matching (tap or drag), typing, and drag-and-drop ordering (pointer drag plus ▲▼ buttons for keyboard).

---

## বাংলা সংখ্যা ও গণিত (Bangla numbers & math) — `/bangla-math`

Open to everyone: **no login, no email**. Bangla is the default language in this section; English numerals and names are shown alongside.

| Route | What it does |
|---|---|
| `/bangla-math` | Hub: age-group picker (৩–৪ / ৫–৬ / ৭–৮, changeable any time) and topics ordered for that age |
| `/bangla-math/numbers` | ১–১০০ in ten groups of ten + a tappable শতক বোর্ড (hundred chart) |
| `/bangla-math/numbers/[1-10]` | Each number: Bangla numeral, English numeral, Bangla & English names, place value, tap-to-count (≤ ২০), read-aloud |
| `/bangla-math/learn/[add\|sub\|mul\|div]` | যোগ / বিয়োগ / গুণ / ভাগ explained in simple Bangla with pictures (আম, কলা, ফুল, খেলনা…), "নিজে করে দেখো" builder, নামতা ২–১০ |
| `/bangla-math/quiz/[id]` | Short Bangla quizzes (`numbers-1..3`, `numbers-g1..g10`, `add-1..3`, …) using the shared `QuizRunner` |
| `/bangla-math/progress` | Stars, badges, best score per level, sound toggle |

- **Code:** content and generators in `src/core/bangla/` (pure, unit-tested); screens in `src/screens/bangla/`; guest storage in `src/state/bnGuestStore.ts`.
- **Correctness:** every math question id encodes its problem (`bnm.add.2.3.res`); `tests/bangla.test.ts` regenerates thousands of quizzes and recomputes every answer independently. Division is always exact; subtraction never goes below zero.
- **Stars:** one ⭐ per correct answer, once per distinct problem (re-submitting or replaying never pays twice). Badges for passing each level (≥ 60%), exploring all of ১–১০০ and reading all four lessons.
- **Guest progress** is stored in `localStorage` on the device only (`kdl-bangla-math-v1`); the page tells children/parents it can be lost if browser data is cleared. No database tables or environment variables were added.
- **Audio:** the 🔊 button uses the device's Bangla text-to-speech voice when one exists and is hidden otherwise — nothing depends on audio.
- **Font:** Hind Siliguri via `next/font` (`--font-bangla`), placed after the Latin fonts so Bangla glyphs pick it up everywhere.

---

## Security & privacy

| Requirement | Implementation |
|---|---|
| Secure authentication | bcrypt (cost 12) passwords; signed HS256 JWT in an httpOnly, Secure, SameSite=Lax cookie; `sessionVersion` for revocation; timing-safe login for unknown emails |
| Parent/child role separation | Sessions have `mode: parent \| child`. Kid mode is locked to one child; leaving it needs the parent PIN (server-checked, rate-limited) or the parental gate |
| Authorization / no cross-family access | `requireChild()` checks `child.parentId === session.parentId` on every child route; kid mode can only reach its own profile |
| Input validation | zod on every API body; shared rules in `core/validation.ts` |
| Safe queries | Prisma (parameterized); no raw SQL |
| Rate limiting | Login, signup, PIN and Buddy (20 per 10 min + 150 per day per child) |
| CSRF | Middleware rejects mutating `/api` requests from other origins |
| Minimal child data | First name or nickname, age, emoji avatar. No DOB, photos, school or location. Drawings stay on the device. Buddy transcripts are not stored |

**Buddy 🤖:** every message goes through the input filter (personal info, secrets, unsafe, mature, distress), then the model with a strict child-safe system prompt, then the output filter. Distress triggers a kind "talk to a grown-up" reply and an always-on parent safety alert that does *not* include the child's words. Parents can switch Buddy off per child.

---

## ▶ Where production connections plug in

Search the code for `▶ PRODUCTION`.

| Area | Now | Production |
|---|---|---|
| Data | `ApiDataService` → API routes → Prisma | Set `DATABASE_URL` + `AUTH_SECRET`; migrations run on deploy; `db:seed` once |
| Buddy model | `BUDDY_PROVIDER=mock` | `BUDDY_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (`src/server/buddy.ts`) |
| Rate-limit store | In-memory (single instance) | Redis/Upstash in `src/server/rateLimit.ts` |
| Parent email/push | Dashboard feed | Enqueue delivery in `recordCompletion()` (`src/server/progressRepo.ts`) |
| Story illustrations | Emoji scenes | `Story.imageUrl` column is ready |
| Legal | Safety page describes the design | Review for COPPA / GDPR-K before launch; add verifiable parental consent if required in your market |

---

## Verification status

- ✅ Engine unit tests pass (12 tests, ~3,000 assertions), including the exact sample program for a 7-year-old.
- ✅ All UI, state and engine code type-checks strictly against React 19 types.
- ✅ End-to-end flow tested in Chromium on the playable demo: Parent signup → Create child → Child dashboard → Activity → Quiz → Score → XP → Badge → Streak → Parent progress; plus Buddy safety, parental gate, lessons, story, drawing, habit, admin.
- ✅ `npm run build` passes; the initial migration applies cleanly with `prisma migrate deploy` and matches `schema.prisma` (no drift); signup → session → login verified against PostgreSQL.
