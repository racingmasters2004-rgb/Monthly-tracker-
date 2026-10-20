# Target data model (multi-user). Postgres/Supabase flavour; adapt freely.

Every table: `id uuid pk`, `user_id uuid not null references auth.users`, `created_at`, `updated_at`; RLS: `user_id = auth.uid()` for select/insert/update/delete. Add indexes on `(user_id, …)`.

## Planner
- profiles(user_id, display_name, timezone default 'Asia/Kolkata', currency default 'INR', plan, onboarding_done)
- domains(name, sort_order)
- tasks(domain_id, name, priority enum high|medium|low, tags text[] uppercase, important bool, urgent bool, status active|done, deadline date, is_recurring_instance bool, recurring_template_id, completed_at)
- subtasks(task_id, name, priority, tags text[], deadline date, done bool, is_recurring_instance, recurring_template_id, completed_at)
- recurring_templates(domain_id, task_id null, name, frequency daily|weekly, weekdays smallint[] (0=Sun..6=Sat; 7 days = daily), priority, tags, important, urgent, active)
- goals(domain_id null, title, type annual|quarterly|monthly, year, quarter 1-4, month 1-12, target_date, notes, done)
- goal_items(goal_id, name, done, completed_at)   -- annual/quarterly only
- journal(content text, updated_at)               -- one row per user

## Expenses
- expense_categories(name, kind income|expense, icon, color, sort_order, archived, monthly_budget numeric null)
- payment_methods(name, icon, sort_order, archived)   -- defaults Cash, Card, UPI
- transactions(kind income|expense, amount_minor bigint, currency, occurred_on date, occurred_at timestamptz null, category_id, payment_method_id, note, payee, tags text[], recurring_template_id null, receipt_path null)
- expense_recurring_templates(kind, amount_minor, category_id, payment_method_id, note, frequency daily|weekly|monthly, weekdays smallint[], day_of_month smallint, start_on, end_on null, active)
- budgets_overall(month date, amount_minor)   -- optional

## Commercial
- entitlements(user_id, plan free|pro, source apple|google|stripe|manual, expires_at, rc_customer_id)
- notification_settings(user_id, daily_reminder_time, overdue_digest bool, idle_nudge bool, recurring_due bool)
- devices(user_id, push_token, platform)

## Reference
v8 MySQL schema: `reference-v8/schema.sql` (single-user, `user_id` default 1). Seed data in it is the owner's personal task list — **do not ship it**; use generic sample data behind a "Load sample data" button.

## Key queries to replicate (see reference-v8/includes/functions.php)
`generate_recurring_instances`, `is_task_idle`, `domain_score`, `deadline_bucket`, `daily_scorecard`, `weekly_review`, `recurring_streak`, `eisenhower_quadrant`, `normalize_tags`.
