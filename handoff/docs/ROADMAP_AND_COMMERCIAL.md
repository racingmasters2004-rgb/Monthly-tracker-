# Roadmap and commercial notes

## Business direction
Owner wants a paid app on Google Play and the App Store. Earlier a target of USD 299/month was floated; that is unrealistic for a consumer planner. Realistic consumer pricing: **USD 2–10/month or USD 20–70/year**, with a free tier and a 7-day trial. A higher price is only plausible for a team/business plan with shared workspaces, admin and reporting (Phase 3). Build the entitlement system so price/plan changes need no code change.

## Phases
- **Phase 1 (done in v8 prototype):** single-user planner on free PHP hosting.
- **Phase 1.5 (THIS BUILD):** rebuild on production stack; multi-user auth; Expense Tracker + PDFs; animations; billing; notifications; Capacitor builds.
- **Phase 2:** team/family sharing, widgets, calendar sync (Google/Apple), home-screen quick-add, optional AI assistant, web app.
- **Phase 3:** business/team plan (workspaces, roles, admin, reports).

## Must-have for store approval
- Apple: Sign in with Apple if any third-party login is offered; in-app **account deletion**; privacy nutrition labels; IAP for digital subscriptions (no external payment links); working restore purchases; subscription terms text on the paywall; ATT not needed if no tracking.
- Google: Data-safety form; account-deletion URL + in-app path; Play Billing via RevenueCat; target latest API level; 64-bit builds.
- Both: Privacy Policy + Terms URLs, support email, age rating questionnaire (planner = 4+/Everyone), original icon/screenshots (no third-party marks).
- Developer accounts needed by the owner: Apple Developer (USD 99/yr), Google Play (USD 25 one-time).

## Security
RLS everywhere, HTTPS only, no secrets in client, rate-limited auth, email verification, password reset, input validation server-side, parameterised queries, daily backups, minimal PII, export + delete on request.

## Notifications
Local notifications (Capacitor) for daily reminder; push (FCM/APNs) for overdue digest, idle-task nudge, recurring due today. All user-configurable.

## Hosting
Managed Postgres/Supabase (or equivalent) + static hosting/CDN for the web build. Not InfinityFree (no cron, no reliable SMTP, no SLA, ads/limits unsuitable for paying users).

## Migration
Provide an **importer** that accepts the v8 JSON backup (domains → tasks → subtasks, recurring, goals, journal) so the owner can bring existing data into his new account.
