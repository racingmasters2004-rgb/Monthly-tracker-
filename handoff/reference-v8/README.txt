MONTHLY PLANNER — SETUP GUIDE (v8 — Batch B1: Goals rewrite + PDF export)
=============================================================================

REQUIRED ONE-TIME DATABASE CHANGE FOR THIS UPDATE
------------------------------------------------------
This rewrites how Goals are stored. Run these in phpMyAdmin's SQL tab, one at a time:

    ALTER TABLE goals MODIFY COLUMN type ENUM('annual','quarterly','monthly') NOT NULL;
    ALTER TABLE goals ADD COLUMN year INT DEFAULT NULL AFTER type;
    ALTER TABLE goals ADD COLUMN quarter TINYINT DEFAULT NULL AFTER year;
    ALTER TABLE goals ADD COLUMN month TINYINT DEFAULT NULL AFTER quarter;
    ALTER TABLE goals ADD COLUMN done TINYINT(1) NOT NULL DEFAULT 0 AFTER progress_percent;
    UPDATE goals SET year = YEAR(CURDATE()) WHERE year IS NULL;

    CREATE TABLE IF NOT EXISTS goal_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      goal_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      done TINYINT(1) NOT NULL DEFAULT 0,
      completed_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

If you had already added any Annual/Quarterly goals before this update, they'll
keep their title/notes/target date, and the migration backfills their year to
the current year automatically -- but they'll start with 0 sub-goals (the old
"progress %" slider is gone, replaced by real sub-goal checklists you'll need
to re-add). Nothing is deleted.

WHAT CHANGED IN v8 (this update) -- "Batch B1"
--------------------------------------------------
- Goals section is now three tabs: Annual, Quarterly, Monthly.
  - Annual and Quarterly goals can each have sub-goals (a checklist, same
    pattern as tasks -> subtasks) -- progress % is now computed automatically
    from how many sub-goals are checked off, not manually dragged.
  - Quarterly has its own Q1/Q2/Q3/Q4 switcher with a light animated
    transition when you change quarters.
  - Monthly goals are deliberately simple: a flat checklist for whichever
    month you're viewing (defaults to the current month), with Prev/This
    month/Next navigation -- no sub-goals, kept clean on purpose.
  - A year switcher sits above Annual and Quarterly so past/future years
    don't clutter the current one.
- New PDF Report export (next to the existing JSON export button): generates
  a clean, readable PDF of your domains/tasks/subtasks -- by default
  everything, or pick a From/To date range first. Runs entirely in your
  browser (via the jsPDF library, loaded from a CDN), so it works reliably
  regardless of InfinityFree's server limits.

This round does NOT include the Expense Tracker yet -- that's "Batch B2",
next.

WHAT CHANGED IN v7 (this update) -- "Batch A"
--------------------------------------------------
- Eisenhower matrix is now dynamic: tapping any task listed in Do Now / Plan It /
  Delegate / Drop jumps straight to that task in your list.
- "+ Add Task" and "+ Add Subtask" now open their form exactly where you tapped --
  both the top "+" icon and the bottom button have their own slot, so you never
  have to scroll back up to fill in what you just asked to add.
- The weighted-score number is gone. In its place: a 2x2 dashboard (Completed
  today / Open tasks / Stalled / Overall progress) -- tap any tile to expand a
  live, clickable list of exactly those items, right there on the dashboard.
- New Journal section: a decorated, lined free-write scratchpad at the bottom
  of the page. Autosaves ~1 second after you stop typing, no save button needed.
- A round of hover/press/entrance animation polish across buttons, cards,
  subtasks, and list items -- purely visual, no structural or behavioural changes.

This round intentionally does NOT include (queued for "Batch B" next):
the Annual/Quarterly/Monthly Goals rewrite with sub-goals, either PDF export
(Planner or Expenses), or the new Expense Tracker module.

EARLIER CHANGE SUMMARY (v4 -> v6, already live on your site before this update)
------------------------------------------------------------------------------------
- v6: bulk subtask entry (paste multiple lines at once), recurring-habit streak
  badges, and an automatic weekly review card (Mon-Sun planned vs done).
- v5: recurring tasks can repeat on any combination of weekdays (not just
  daily/one day), can be marked Important/Urgent so they show correctly in the
  Eisenhower matrix, the calendar shows "ghost" projected dots for upcoming
  recurring items, plus a search box and a one-click JSON data export.
- Also already live: server-date-based Today/Overdue calculations (immune to
  phone clock/timezone drift), forced-uppercase tag normalization, the
  interactive tag chip picker, and clear on-screen error messages if a save
  ever fails instead of failing silently.

This is a COMPLETE snapshot of every file, current as of this update. If
you're setting this up fresh, follow the steps below top to bottom. If
you're already running an earlier version, see "WHAT CHANGED" first --
some updates needed a one-time database change that only needs doing once.

WHAT CHANGED IN v4 (this update)
-----------------------------------
- Fixed a subtle date-mismatch bug: Today/Tomorrow/Overdue/the calendar's
  "today" highlight were computed from your PHONE's clock. If your phone's
  clock/timezone ever drifted even slightly from the server's, items could
  silently vanish from "Today" or the calendar without any error. Every date
  comparison now uses the SERVER's date (returned with every data load) as
  the single source of truth, so this class of bug can't happen again.
- If a recurring task still doesn't appear where expected after this fix,
  check: open the domain it belongs to (e.g. "Self") and look for a task
  literally named "<your recurring name> (YYYY-MM-DD)" -- if it's there but
  not in Today/Calendar, tell me and we'll dig further; if it's not there at
  all, the recurring generator hasn't fired yet (it only runs when the page
  loads data) -- refresh the page once and check again.

WHAT CHANGED IN v3.1 (tag picker + timer removal)
-----------------------------------------------------
- Task tags are now an interactive autocomplete chip picker (type to filter,
  tap to add, "+ Add" for a brand-new name) instead of manual retyping.
- All tags are forced UPPERCASE automatically (client and server side) so
  "Nayan sir" / "nayan sir" duplicates can't happen going forward. A one-time
  SQL cleanup for tags entered before this update:
    UPDATE tasks SET tags = UPPER(tags) WHERE tags IS NOT NULL AND tags <> '';
    UPDATE subtasks SET tags = UPPER(tags) WHERE tags IS NOT NULL AND tags <> '';
  (Run once in phpMyAdmin's SQL tab. Safe -- only changes letter casing,
  deletes nothing.)
- Removed Estimated Hours and the Start/Stop timer entirely (unused).

WHAT CHANGED IN v3 (recurring subtasks + filter fix)
----------------------------------------------------------
- Fixed: a task with a deadline but no subtasks yet (e.g. any recurring
  task) now correctly appears under Today/Tomorrow/Overdue/This Week.
- Recurring templates can now target "a subtask under an existing task"
  (e.g. a weekly LinkedIn-post subtask attached to your "Linkedin post 4"
  task) in addition to "a brand-new task each time".
- Required a one-time database change (only if upgrading from an older
  version than this):
    ALTER TABLE recurring_templates ADD COLUMN task_id INT DEFAULT NULL AFTER domain_id;
    ALTER TABLE recurring_templates ADD CONSTRAINT fk_recurring_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

WHAT CHANGED IN v2 (calendar overhaul + home button + tag autocomplete v1)
------------------------------------------------------------------------------
- Calendar: today is solid-highlighted, Prev/Today/Next month navigation,
  each day shows a task/item count, tapping a day lists exactly what's due
  and lets you jump straight to that task.
- Added a Home button (top-right) to close the calendar and scroll to top.
- Kept the original clean paper/navy visual style (a dark redesign was
  tried and reverted after feedback -- noted here so future-you knows why).

WHAT CHANGED IN v1 → v2 EARLY (editing UX overhaul)
--------------------------------------------------------
- Kept the original clean paper/navy look you preferred (reverted the dark
  "Ledger" redesign after feedback) -- same visual style as your first version,
  now loading the actual IBM Plex Sans / IBM Plex Mono / Inter fonts properly
  via Google Fonts instead of falling back to system fonts, plus subtle card
  animations, hover states, and a gold wax-seal pop on task completion.
- Editing a task, subtask, domain, or goal now opens ONE form with every field
  on it (name, priority, tags, deadline, important/urgent, hours) instead of
  a chain of separate pop-up questions.
- Subtask tags are now a checklist pulled from the parent task's own tags
  (tag the task once with the people/projects involved, then just tick which
  ones apply to each subtask) instead of retyping tags freehand.
- The tag filter (top of page) is now a single dropdown showing every tag with
  a count next to it, instead of a horizontal row you had to scroll through.
- A "Daily Report" card now sits at the very top of the dashboard: today's
  weighted score front and center, plus a "View breakdown by domain" toggle.
- The periodic 60-second background refresh now pauses itself while you have
  an add/edit form open, so it won't wipe out something you're mid-typing.

Re-upload index.php, api.php, and everything inside assets/ to overwrite the
previous version. config.php and schema.sql are unchanged -- no need to
re-import anything or touch your database.


ONE HONEST NOTE ON THE $299/MONTH QUESTION
---------------------------------------------
The visual overhaul above will make demos land much better. But charging real
companies real money is a different project on top of this one: individual
logins, encrypted credentials, backups, uptime guarantees, and support. None
of that exists yet on free InfinityFree hosting with no login system. Treat
this version as a working prototype to show the vision, not a billable product
-- that's a separate build (and separate hosting) when you're ready for it.


WHAT'S IN THIS FOLDER
----------------------

WHAT'S IN THIS FOLDER
----------------------
index.php              - the dashboard page (open this in your browser)
api.php                - handles every add/edit/delete/timer action
config.php             - EDIT THIS FIRST with your InfinityFree DB details
schema.sql              - import this into your database (creates tables + seeds your task list)
includes/db.php         - database connection (no edits needed)
includes/functions.php  - scoring / idle detection / recurring-task logic (no edits needed)
assets/style.css        - all visual styling
assets/app.js           - all interactive behaviour
assets/quotes-data.js   - the quote generator word banks


STEP-BY-STEP UPLOAD (InfinityFree)
------------------------------------
1. Log in to your InfinityFree account > go to your hosting's Control Panel (cPanel/vPanel).

2. Create the database:
   - Open "MySQL Databases".
   - Create a new database (note the full DB name it gives you, something like if0_12345678_planner).
   - Note the DB username, password, and hostname (something like sql200.infinityfree.com — NOT "localhost").

3. Import the schema:
   - Open "phpMyAdmin" from the control panel.
   - Select your new database on the left.
   - Click "Import" tab, choose schema.sql from this folder, click Go.
   - This creates all tables AND pre-loads your Company + Self task list from the message you sent me.

4. Edit config.php:
   - Open config.php in this folder with any text editor.
   - Fill in DB_HOST, DB_NAME, DB_USER, DB_PASS with the values from step 2.
   - Save.

5. Upload everything:
   - Open "File Manager" (or use FTP/FileZilla with the credentials InfinityFree gave you).
   - Go into the htdocs folder (this is your website's root).
   - Upload ALL files and folders from this package into htdocs, keeping the folder
     structure exactly as it is here (index.php at the root, includes/ and assets/ as subfolders).

6. Visit your site:
   - Open your InfinityFree subdomain (or your custom domain) in your phone's browser.
   - You should see the dashboard load with your Company and Self tasks already there.

If you see a blank page or a database error, it's almost always config.php —
double check the 4 values, especially DB_HOST (it is never "localhost" on InfinityFree).


PHASE 1 — WHAT'S BUILT NOW
----------------------------
- Domain -> Task -> Subtask structure (kept simple, as you asked)
- Add / edit / delete at every level, independently
- Priority (High / Medium / Low) with color coding
- Tags on tasks and subtasks + tag-based filtering (tap a tag to isolate everyone/everything tied to it)
- Deadlines on subtasks with automatic Overdue / Today / Tomorrow / This Week / All views
- Eisenhower matrix: mark a task Important / Urgent, quadrant (Do now / Plan it / Delegate / Drop) is computed
  automatically and shown as its own section, alongside your normal priority field (not replacing it)
- Idle-task detection: a task with no subtask progress in 3+ days is flagged, surfaced in a banner at the
  top of the dashboard, and clicking it jumps to the task and blinks its background 3 times
- Weighted domain score: High = 2x, Medium = 1.5x, Low = 1x, shown as a % and progress bar per domain
- Completed tasks/subtasks are automatically moved into a collapsed "Completed" section, out of your way
- Daily scorecard: how many items you finished today + your weighted score for today
- Recurring tasks: set up a daily or weekly habit once, and a fresh instance is auto-created for you
  each day/week when you open the dashboard (no manual re-entry)
- Annual / Quarterly goals: a lightweight separate section for big-picture targets with a progress bar
- Automatic task completion: finishing the last subtask automatically marks the parent task done and
  moves it to your Completed list — this is what eliminates the need for a separate "monthly chart",
  since the Domain/Task/Subtask view already IS your live monthly view
- Deadline spotlight: a High-priority task with something due in the next 2 days gets a distinct
  highlighted border so it visually stands out from ordinary overdue/today coloring
- Celebration animation: small confetti burst when you check off a subtask, bigger confetti + a
  "Task complete!" banner when a whole task finishes
- Calendar view: tap the calendar icon top-right for a month grid with colored dots showing what's due
  each day; the view tabs already give you a "This Week" list view
- Time tracking: Estimated hours field, plus a real Start/Stop timer. Important: this timer is based on
  server timestamps, not a running browser clock — so you CAN start it, close the site, come back later,
  and click Stop, and it will correctly calculate the elapsed time. No need to keep the tab open.
- Quote of the day: an original template-based generator (assets/quotes-data.js) that combines word banks
  into thousands of unique motivational/money-mindset lines — a new one every time you refresh, with no
  external API calls (which free hosting can't reliably support anyway)


PHASE 2 — NOTED FOR LATER (not built yet, on purpose)
--------------------------------------------------------
- Login system with individual accounts (email + password — OTP is skipped because InfinityFree's free
  tier does not reliably support outbound email, so OTP delivery would fail often)
- Multi-user roles, sharing tasks with others, delegation between people
- Deeper hierarchy (Domain -> Goal -> Project -> Task -> Checklist Item) if you decide you want it later
  — the database and code are written so this can be added without rebuilding what exists
- Push/email notifications for idle tasks and approaching deadlines
- Any commercial/billing layer (accounts, payments, plans)

Every table already has a user_id column defaulting to 1, specifically so Phase 2 login can be added
later without restructuring the database.
