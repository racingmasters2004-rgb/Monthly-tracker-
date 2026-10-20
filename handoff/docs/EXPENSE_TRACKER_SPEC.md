# Expense Tracker — full specification (NOT implemented in v8; build it)

Goal: professional, customizable, sellable-to-clients quality; its own area, switched from the Planner via an icon beside the Calendar icon in the header.

## Entry model
- `type`: income | expense (a transaction can be either)
- amount (decimal, > 0), currency from user setting
- date (default today, user timezone), optional time
- category (user-defined, see below), optional sub-label/note
- payment method: Cash | Card | UPI (+ user can add more, e.g. Bank transfer, Wallet)
- optional: vendor/payee, tags (reuse tag system, uppercase), attachment photo (receipt) – optional but nice
- recurring flag (see below)

## Categories / types (fully customizable)
- User can add, rename, recolour, re-icon, reorder, archive, delete (with reassign) categories, separately for income and expense.
- Each category: name, icon (pick from a curated set of ~60 clean line icons), colour (from palette), type (income/expense), optional monthly budget.
- Ship sensible defaults (Food, Transport, Rent, Bills, Shopping, Health, Entertainment, Travel, Business, Salary, Freelance, Other…) that the user can freely edit/delete.

## Budgets (optional — the user decides)
- Budget is per category per month, **optional**; no budget = no bar shown.
- Show spent / budget progress bar with state colours (calm → amber ≥ 80% → red > 100%). Optional overall monthly budget.

## Recurring expenses/income
Reuse the recurring engine used by the planner: daily / chosen weekdays / monthly-on-day (add monthly, since rent and subscriptions need it). Lazy generation on load plus scheduled job; dedupe by template + date. Edit/pause/delete template. Ghost "upcoming" list for next 30 days.

## Screens
1. **Expense home (month view):** month switcher; hero summary (Income, Expense, Net/Balance); category breakdown (donut or stacked bar + list with icons); **payment-method totals** (Cash/Card/UPI cards); budget bars; quick-add floating button.
2. **Transactions list:** grouped by day, search, filters (type, category, method, tag, date range), swipe to edit/delete.
3. **Add/Edit sheet:** big amount keypad, income/expense segmented control, category grid with icons, payment method chips, date, note. Opens as bottom sheet, one-handed use.
4. **Categories & budgets manager.**
5. **Recurring manager.**
6. **Reports:** trend by month (last 6/12), category share, method share, top expenses.
7. **Export PDF** (below).

Presentation: different icons and colours per section, beautifully balanced, same paper/navy design system. Must look credible when shown to business clients.

## PDF export (client-facing quality)
- Options: **Monthly (default) covering all sections**, or **custom date range**. Optional filter by category/method.
- **Page 1 – Summary dashboard at top:** title, user/business name, period, generated date; KPI row (Total income, Total expenditure, Net); **category-wise expenditure** table with amount and % and a bar/pie chart; **breakdown by payment method** (Cash / Card / UPI totals); budget vs actual if budgets exist; top 5 expenses.
- **Then: bank-statement-style transaction history:** columns Date | Description/Category | Method | Debit | Credit | Running Balance. Opening and closing balance rows. Alternating row tint, repeated header on each page, page numbers "Page x of y", footer with app name.
- Navy header band, paper-white body, tabular figures, right-aligned amounts, currency symbol and thousands separators per locale (₹ with Indian grouping when currency is INR).
- Must save/share correctly inside the Capacitor app (share sheet).

## Data rules
- `user_id` on every table; RLS.
- Amounts stored as integer minor units (or DECIMAL(12,2)); never float.
- Dashboard totals computed server-side/SQL in the user's timezone.
- Soft-delete or undo toast on delete.

## Tests
Totals per category/method/month, running balance, recurring dedupe, budget thresholds, timezone month boundaries, RLS isolation.
