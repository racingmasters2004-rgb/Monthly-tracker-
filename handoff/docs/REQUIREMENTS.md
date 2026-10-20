# Planner Requirements (v8 behaviour — already working in the prototype)

Source of truth for behaviour = this file + `reference-v8/assets/app.js`, `reference-v8/includes/functions.php`, `reference-v8/api.php`.

## R1 Header & quotes
- Title "Monthly Planner". Buttons: Home (scrolls/resets filters to All, collapses panels), Calendar toggle, **Expenses (new)**.
- Quote bar: a new generated motivational quote on every refresh. Word-bank generator (see `assets/quotes-data.js`), ~13,600 combinations, no API.

## R2 Stat dashboard (2×2, each tile clickable, expands a panel beneath)
1. **Completed today** – count + list of items done today.
2. **Open tasks** – count + list.
3. **Stalled** – count of idle tasks + list (click jumps to task).
4. **Overall progress** – average of domain scores; "--" when none.
The old single weighted-score card was deliberately replaced by this grid.

## R3 Weekly review (Mon–Sun, derived automatically from deadlines)
Planned vs done per weekday and per domain, shown as week bars. Navigable by week.

## R4 Calendar
- Month grid, previous/next month, today highlighted.
- Each day shows counts of tasks and subtasks due. Click a day → list of that day's items.
- Future days show ghost dots `+N` for matching active recurring templates (not persisted).
- Calendar must not be "useless": it must show work, not just dates.

## R5 Filtering
- View bar: **All, Overdue, Today, Tomorrow, This Week** (week = next 7 days incl. overdue/today/tomorrow).
- Tag dropdown filter (with counts) applies everywhere (tasks, subtasks, calendar, recurring).
- Search box (name/tag).
- Buckets use server date: diff<0 overdue, 0 today, 1 tomorrow, ≤7 week, else future; done items bucket "done"; no deadline "none".

## R6 Idle / stalled
Task not done, has ≥1 open subtask, older than 3 days, and no subtask completed in the last 3 days. Banner at top lists them; click → scroll to task, `.blink-3x` (3 blinks) on its background.

## R7 Domains / tasks / subtasks
- Domains: add, rename, delete (cascade). Domain card shows score (weights high 2.0 / med 1.5 / low 1.0; weighted % of subtasks done; null if no subtasks).
- Task fields: name, priority (high/medium/low), tags, important, urgent, deadline, status (active/done), recurring flags.
- Subtask fields: name, priority, tags (only from parent task's tags), deadline, done.
- One combined form for creating a task (name + priority + tags + important + urgent + deadline + optional bulk subtasks, one per line). No chained prompt() dialogs.
- Bulk-add subtasks (multi-line).
- Last open subtask checked ⇒ task auto-completes (+ big celebration). Unchecking re-opens.
- Completed tasks/subtasks live in collapsed "Completed" lists.
- "+ Add task" opens its form **in place** at the bottom button the user pressed.
- Progress bar per task animates empty→full, red→amber→green.
- High-priority items near deadline are visually highlighted.

## R8 Recurring
- Create: name, domain, optional target task (→ generates subtasks under it), daily or weekday checkboxes (Sun..Sat; all seven = daily), priority, tags, important, urgent.
- Lazy generation on load (dedupe by template id + today's date). Instances flagged. Active toggle, delete.
- Shows streak per template. Appears in Today view, calendar and under its task/domain folder.
- Recurring must not be compromised by other features.

## R9 Goals
- Types: **annual**, **quarterly** (Q1–Q4, each editable), **monthly**.
- Annual/quarterly: have a checklist of items (goal_items); progress = % items done (computed).
- Monthly: flat single-level checklist, `done` flag; month navigation, **defaults to current month**.
- Tabs for the three types; add/edit/delete/toggle everything.

## R10 Eisenhower matrix
2×2: Do now (I+U) / Plan it (I) / Delegate (U) / Drop/later (neither). Dynamic from task toggles; items clickable (jump to task).

## R11 Journal
Single free-write lined-paper pad per user, autosave with 900 ms debounce, status text ("Saved"), never overwritten while focused.

## R12 Celebrations
Subtask done → small confetti. Task done → large confetti + "TASK COMPLETE" seal. Must not block input.

## R13 Planner PDF
Modal with optional date range. Output: title, generated date, range, then one section per domain with a table: Task/Subtask, Type, Priority, Status, Deadline (subtasks indented "↳"). Human readable. Ranges filter by deadline. Separate small "JSON" backup button exists for data export only.

## R14 Sync & robustness
60 s background refresh paused while any modal/inline form is open. All writes show an error message on failure. Tags uppercase-normalized everywhere.

## R15 Phase record (owner asked for a record)
Phase 1 built: R1–R14, idle, scores, recurring, goals, matrix, calendar, weekly review, journal, celebrations, PDF, quotes, tags.
Phase 1.5 (this build): Expense Tracker, animation +, accounts, billing.
Phase 2+: notifications refinements, team/sharing, widgets, AI assistant (optional), web dashboard.
