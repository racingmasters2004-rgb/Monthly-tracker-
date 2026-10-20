# Monthly Planner & Expense Tracker (v8 Pro)

A mobile-first, paper-and-navy personal productivity planner and financial expense tracker engineered for daily clarity, habit discipline, and executive-grade reporting.

---

## 1. Stack & Architecture
- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling & Design System:** Tailwind CSS v4 + Paper & Navy design system tokens (`--ink: #10202B`, `--paper: #FBFAF7`, `--navy: #1F3A52`, `--teal: #2A7F73`)
- **Sensory & Animation:** Web Audio API synth chimes, mobile haptic vibration feedback, canvas-confetti, and gold seal stamp animations
- **PDF Engine:** jsPDF + jspdf-autotable (Client-side, human-readable planner reports & client-facing bank statement ledgers)
- **Offline & Persistence:** LocalStorage & IndexedDB with instant responsiveness, automatic 60s background refresh, debounced journal autosave, and JSON backup/restore
- **Timezone Engine:** Timezone-aware date calculations (default `Asia/Kolkata`) computing exact server midnight rollovers, streaks, and ghost recurring dots

---

## 2. Quick Start & Commands

### Running Locally
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Run automated test suite (33 tests covering scores, streaks, idle tasks, RLS, expenses)
npm test

# Build production bundle
npm run build
```

---

## 3. Running Directly on Your Mobile Phone

To use this app on your phone with zero app store downloads:
1. Open the preview URL on your phone's browser (**Safari on iPhone** or **Chrome on Android**).
2. Tap the browser menu:
   - **On iPhone (Safari):** Tap the **Share** button (box with upward arrow) &rarr; tap **"Add to Home Screen"**.
   - **On Android (Chrome):** Tap the **three dots menu (⋮)** &rarr; tap **"Install App"** or **"Add to Home Screen"**.
3. The app will appear on your phone's home screen with the app icon and will launch full-screen without any browser address bar!
4. It works offline and saves all your tasks, habits, goals, and expense entries automatically.

---

## 4. Key Features & How to Use

### 📅 Module 1: Monthly Planner
- **2×2 Stat Grid:** Clickable tiles for *Completed Today*, *Open Tasks*, *Stalled Tasks*, and *Overall Progress*. Tap any tile to expand details or jump directly to tasks.
- **Weekly Review (Mon–Sun):** Planned vs. done week bars derived automatically from task deadlines.
- **Calendar Panel:** Month grid with task counts and projected ghost recurring dots (`+N`).
- **Domain → Task → Subtask:** Weighted progress scoring (High = 2.0x, Med = 1.5x, Low = 1.0x).
- **Auto-Complete & Celebration:** Checking the last open subtask completes the parent task and triggers celebratory sound, haptics, confetti, and the gold "TASK COMPLETE" seal.
- **Idle / Stalled Detection:** Banner appears for tasks older than 3 days with open subtasks and no recent completions; tap jumps to the task and blinks 3 times.
- **Eisenhower Matrix:** Dynamic 2×2 grid mapping tasks into *Do Now*, *Plan It*, *Delegate*, or *Drop*.
- **Habit Streaks:** Recurring templates (daily or selected weekdays) with consecutive streak counters (🔥 N days).
- **Goals Section:** Annual, Quarterly (Q1–Q4), and Monthly goals with checklist progress.
- **Lined-Paper Journal:** Free-write scratchpad with 900ms debounced autosave.
- **Planner PDF Report:** Grouped by domain with indented subtasks ↳ and clean navy header.

### 💰 Module 2: Expense Tracker (Header Icon)
- Switch between Planner and Expenses from the header icon.
- **Month Overview:** Hero summary (Total Income, Total Expense, Net Balance), stacked category distribution bar, and payment method totals (Cash, Card, UPI, Bank).
- **Category Budgets:** Set optional monthly spending limits with progress bars (calm &rarr; amber &ge; 80% &rarr; red &gt; 100%).
- **Transaction History:** Grouped by day with search, filters (Income vs. Expense, category, payment method), and quick edit/delete.
- **Recurring Expenses:** Schedule rent, subscriptions, and retainers.
- **Client Financial Statement PDF:** Generates a professional statement with executive KPI cards, category breakdown, payment method shares, and a bank-statement-style transaction history ledger.

---

## 5. Database Schema & Multi-User Migrations
For deploying to Supabase / PostgreSQL in multi-user mode:
- Migration script is provided in `migrations/001_initial_schema.sql`.
- Includes complete Row-Level Security (RLS) policies: `auth.uid() = user_id`.
- Covers profiles, domains, tasks, subtasks, recurring templates, goals, journal, expense categories, payment methods, transactions, and budgets.
