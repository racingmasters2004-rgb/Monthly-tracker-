# MASTER PROMPT — "Monthly Planner" (paste this whole file into the AI app builder)

You are a senior full-stack + mobile engineer and product designer. Build a **complete, working, production-quality, multi-user, mobile-first planner and expense-tracker app** that can be published to the Google Play Store and Apple App Store and sold on a subscription.

An attached zip contains a **working v8 prototype** (PHP + MySQL + vanilla JS) that is the *behavioural and visual reference*. Read it first. **Re-implement it faithfully on a modern stack; do not paste the PHP.** Where this prompt and the code disagree, this prompt wins. Supporting documents are in `docs/`:

| File | Purpose |
|---|---|
| `docs/REQUIREMENTS.md` | Every feature, rule and formula of the planner (v8, already working) |
| `docs/EXPENSE_TRACKER_SPEC.md` | The new module that does NOT exist yet and must be built |
| `docs/DATA_MODEL.md` | Target multi-user database schema |
| `docs/DESIGN_SYSTEM.md` | Colours, type, components, animation rules |
| `docs/ROADMAP_AND_COMMERCIAL.md` | Auth, subscriptions, store compliance, phasing |
| `reference-v8/` | The prototype source (`app.js`, `style.css`, `api.php`, `functions.php`, `schema.sql`) |
| `original-requirements/user-answers.md` | The owner's own decisions |

---

## 1. Product in one paragraph
A personal-productivity app where a user organises life in **Domains → Tasks → Subtasks** (e.g. Company, Self), with priorities, tags, deadlines, recurring habits, an Eisenhower matrix, annual/quarterly/monthly goals, a calendar, weekly review, a free-write journal, daily motivational quotes, and celebratory animations. A second module, the **Expense Tracker**, records income and expenses with customizable categories, optional budgets, payment methods, recurring entries and a polished PDF statement export. The two modules are switched from the header with two icons side by side (Calendar/Planner icon and Expenses icon). The look is a **clean paper-and-navy** interface that feels premium enough to sell to business clients, but stays calm and uncluttered for daily use.

## 2. Hard constraints (do not violate)
1. **Keep the structure simple.** Domain → Task → Subtask only. Do not add Projects, Goals-as-parents or deeper hierarchy. (The owner explicitly declined it.)
2. **Do not restyle into a dark/neon/"luxury" theme.** Use the paper/navy design system in `docs/DESIGN_SYSTEM.md`. Premium comes from spacing, typography, motion and polish, not from changing the palette.
3. **Do not rebuild** estimated/actual hours or the task timer. They were removed on purpose.
4. **Mobile-first.** Design at 390 px wide first; desktop is a centered max-width layout. Bottom-sheet modals on phones. Touch targets ≥ 44 px.
5. **Every row belongs to a user.** `user_id` on every table, enforced server-side (row-level security or equivalent). No user may ever read or write another user's data.
6. **All date logic uses the user's timezone** (default `Asia/Kolkata`, stored per user) computed on the **server**, never the device clock. Today / Tomorrow / Overdue / streaks / calendar highlight depend on this.
7. Add / edit / delete must be possible **anywhere** without disturbing the layout. Adding never shuffles the page unexpectedly, and the add form opens **at the point of the button the user pressed**.
8. Must work **offline-tolerant**: show cached data when offline, queue writes, sync on reconnect, and never lose typed text (journal autosave, unsent drafts).
9. No secrets in client code. No placeholder "lorem" in shipped UI. No dead buttons.

## 3. Recommended stack (adapt only if your platform forces otherwise)
- **Frontend:** React + TypeScript + Vite, Tailwind or CSS variables (tokens in `docs/DESIGN_SYSTEM.md`), Framer Motion or CSS for animation, TanStack Query for data/offline cache.
- **Backend/DB:** Supabase (Postgres + Auth + Row-Level Security + Edge Functions) **or** an equivalent managed Postgres + auth. Server-side "get_data"-style aggregate endpoint is acceptable and preferred for the planner to keep mobile round-trips low.
- **Mobile:** wrap with **Capacitor** for iOS + Android (status bar, safe-area insets, splash, app icon, local notifications, deep links, biometric unlock optional).
- **PDF:** client-side with jsPDF + jspdf-autotable (as in the prototype), or a server function if you prefer. Must work inside the Capacitor WebView (use share-sheet / Filesystem plugin to save/share).
- **Billing:** RevenueCat (wraps Apple IAP and Google Play Billing). Do not use Stripe for in-app digital subscriptions on mobile (store rules); Stripe is acceptable only for a web checkout.
- If your tool can only produce a pure web app, deliver a **PWA** (installable, service worker, offline) with Capacitor-ready structure, and say what remains for store packaging.

## 4. Modules and screens to build

### 4.1 Planner (reference: `docs/REQUIREMENTS.md`, `reference-v8/`)
Build every item below. Section numbers refer to `REQUIREMENTS.md`.
- Header: app title, Home button, Calendar toggle, **Expenses icon (new)**, rotating quote bar (R1)
- 2×2 clickable stat dashboard (R2)
- Weekly review Mon–Sun (R3)
- Calendar with month navigation, today highlight, per-day counts, ghost recurring dots, day detail (R4)
- View bar (All / Today / Tomorrow / Overdue / This week etc.) + tag dropdown filter with counts + search (R5)
- Idle-task banner with jump + 3× blink (R6)
- Domains with tasks and subtasks, completed collapsibles, auto-complete of parent, bulk-add subtasks (R7)
- Recurring habits, daily / chosen weekdays, task-level or subtask-under-task, streaks, lazy generation (R8)
- Goals: Annual, Quarterly (Q1–Q4 editable), Monthly (navigable, defaults to current month) with checklist items (R9)
- Eisenhower matrix, clickable and dynamic (R10)
- Journal scratchpad on lined-paper pad, autosave (R11)
- Celebrations: small confetti on subtask, big confetti + "TASK COMPLETE" seal on task (R12)
- Clean human-readable **Planner PDF report** with date range, grouped by domain, no JSON (R13)
- Optional JSON backup/export button for the user's own data (separate from the PDF)

### 4.2 Expense Tracker (NEW, full spec in `docs/EXPENSE_TRACKER_SPEC.md`)
Reached by an icon placed **beside the calendar icon** in the header. Income and expense entries, customizable categories/types with icons and colours, optional budgets, recurring entries, payment method (Cash / Card / UPI, extensible), dashboard totals per category and per method, search/filter, and a **PDF statement** (summary dashboard on top, bank-statement style transaction table below; monthly by default, custom date range available).

### 4.3 Accounts, onboarding, settings (Phase 2 but REQUIRED in this build — see §7)
Sign up / sign in (email + password, Google, Apple), email verification, password reset, optional phone OTP, profile (name, timezone, currency), settings, data export, **account deletion** (mandatory for store approval), subscription screen, legal pages (Privacy, Terms).

## 5. Behavioural rules you must reproduce exactly
These are the details most easily lost. Full text in `REQUIREMENTS.md`; the non-negotiables:

- **Priority weights:** high 2.0 / medium 1.5 / low 1.0.
- **Domain score** = Σ(weight of done subtasks) / Σ(weight of all subtasks) × 100; `null` ("—") if no subtasks.
- **Eisenhower:** important+urgent = *Do now*; important only = *Plan it*; urgent only = *Delegate*; neither = *Drop / later*. Independent of High/Med/Low priority.
- **Idle task:** not done AND has ≥1 open subtask AND created > 3 days ago AND no subtask completed in the last 3 days (or none ever). Banner lists them; click scrolls to the task and applies `blink-3x` (3 background blinks).
- **Auto-complete:** checking the last open subtask completes the parent task and fires the big celebration. Unchecking a subtask re-opens the parent.
- **Completed items** move into collapsed "Completed" lists under their parent; nothing is deleted.
- **Tags:** stored uppercase, comma-separated (or a join table), normalized on every write path. Chip input with live filtering and a "+ Add NEW" option; picker stays open while typing. **Subtask tags may only be chosen from the parent task's tags** (checklist UI). Global tag filter is a dropdown with counts. Autosuggest, e.g. typing "N" suggests "NAYAN SIR".
- **Recurring engine (no cron required):** on every data load, for each active template, create today's instance if one does not already exist (dedupe on `recurring_template_id` + deadline date). Weekly templates store a set of weekdays 0=Sun..6=Sat; all seven = daily. A template with a `task_id` creates a **subtask** under that task, otherwise a new **task**. Instances flag `is_recurring_instance`. Recurring items support Important/Urgent flags and Priority. Prefer a scheduled server job in the new stack, but keep lazy generation as a safety net.
- **Ghost dots:** days strictly after today show `+N` for active templates that match that weekday. Never persisted.
- **Streak:** consecutive *scheduled* days completed, stepping back across scheduled weekdays only; an unfinished today does not break the streak.
- **Buckets** (Today / Tomorrow / Overdue) use the server date.
- **Background refresh** every 60 s, **paused while any modal or inline form is open**; the journal textarea is never overwritten while focused.
- **Quote generator:** word-bank templates (~26 subjects, 12 verbs, 14 outcomes, …) yielding thousands of unique motivational lines, a new one each refresh, no external API. Seed list in `reference-v8/assets/quotes-data.js`.
- Failed saves must show a clear message; never fail silently.

## 6. Design and motion
Follow `docs/DESIGN_SYSTEM.md`. Motion budget is **about 20–25 % richer than the prototype's ~10 %**: staggered card entrance, animated progress bars (empty → full, red → amber → green), number count-up on stat tiles, spring check-marks, smooth expand/collapse, soft hover/press feedback, ghost-dot pulse, confetti/seal on completion. Respect `prefers-reduced-motion`. No animation may delay input or shift layout.

## 7. Commercial requirements (the app will be sold)
Details in `docs/ROADMAP_AND_COMMERCIAL.md`. Build:
1. Multi-user auth with RLS; per-user timezone and currency.
2. **Free tier + paid tier.** Suggested: free = 2 domains, 30 active tasks, no expense PDF, no recurring; Pro = everything. Pricing is configurable (suggest USD 2.99–9.99/month or ~USD 29–69/year, plus 7-day trial). Gate features through one `entitlements` helper, not scattered checks.
3. RevenueCat integration with a restore-purchases button, paywall screen, and server-side entitlement check.
4. Onboarding: 3 short screens, create first domain, optional sample data ("Load sample data").
5. Push/local notifications: daily reminder, overdue digest, idle-task nudge, recurring due today (user-configurable, off by default until permission granted).
6. Account deletion that really deletes data; privacy policy and terms pages; data export.
7. App icon (navy + paper motif, **original artwork only**), splash screen, store listing copy (title, subtitle, description, keywords), screenshot plan.
8. Basic analytics events and crash reporting hooks (privacy-respecting, opt-out).

## 8. Quality bar and acceptance checklist
The build is accepted only if **all** hold:
- [ ] Sign up → create domain → add task with subtasks, tags, deadline, priority, important/urgent → check subtasks → parent auto-completes with big celebration.
- [ ] Today / Tomorrow / Overdue buckets correct near midnight IST regardless of phone clock.
- [ ] Recurring: a weekly Mon/Wed/Fri subtask appears under its task on those days only, ghost dots show on future matching days, no duplicates after repeated reloads.
- [ ] Idle banner appears for a task with open subtasks and no completion in 3 days; tap jumps and blinks 3×.
- [ ] Goals Q1–Q4 editable; monthly goals default to the current month and navigate cleanly.
- [ ] Eisenhower matrix reflects toggles live and items are clickable.
- [ ] Planner PDF: readable, grouped, date-range selectable, no JSON.
- [ ] Expense module: add income + expense, custom category with icon/colour, optional budget with progress, recurring expense auto-adds, payment-method totals correct, PDF has summary then bank-style table, custom range works.
- [ ] Two different accounts cannot see each other's data (write an automated test for it).
- [ ] Offline: open app in airplane mode → cached data shows; add a task → syncs when back online.
- [ ] Lighthouse mobile performance ≥ 85, no layout shift on add/edit, reduced-motion respected.
- [ ] Builds for Android and iOS via Capacitor with documented commands; app icon and splash present.

## 9. Deliverables
1. Full source, with a README: setup, env vars (`.env.example`), DB migrations, seed script, run, test, build-for-Android, build-for-iOS.
2. Database migrations (SQL) including RLS policies and indexes.
3. Automated tests for: server-date buckets, recurring generation/dedupe, domain score, idle rule, streak, tag normalization, RLS isolation, expense totals.
4. `STORE_LISTING.md` (Play + App Store copy, privacy-label answers, screenshot list).
5. A short `KNOWN_GAPS.md` honestly listing anything not completed.

## 10. How to work
1. First, summarize back in ≤ 15 lines what you will build and the stack you chose. Do not ask questions that these documents already answer; if something is truly missing, choose a sensible default and list it in `KNOWN_GAPS.md`.
2. Build in this order: auth + schema + RLS → Planner core (domains/tasks/subtasks/tags) → recurring + calendar → goals/matrix/journal/review → celebrations + animation → Planner PDF → Expense module + PDF → entitlements/billing → notifications → Capacitor packaging → tests → store assets.
3. Keep screens and component names close to the prototype so the owner recognises them.
4. Do not stop at a skeleton. Every feature listed must be reachable and functional in the UI.
