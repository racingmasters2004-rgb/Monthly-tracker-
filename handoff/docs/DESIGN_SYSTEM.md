# Design System — paper & navy

Philosophy: calm, clean, minimal, motivational, long-term daily use. Looks like a good paper planner. **Do not switch to dark/neon.** Provide an optional dark mode only as a later extra using the same structure.

## Tokens (from reference-v8/assets/style.css)
```
--ink:#10202B  --paper:#FBFAF7  --paper-2:#F1EEE6  --line:#DCD6C7
--navy:#1F3A52 --teal:#2A7F73   --plum:#7A4F82     --grey:#5B6670
--high:#D9531E --med:#D9A017    --low:#4C8557
--overdue:#C4331E  --tomorrow:#2A6FA3
```
Fonts: **IBM Plex Sans** (UI), **Inter** (numerals/labels), **IBM Plex Mono** (small meta). Tabular numerals for amounts.

## Components
Cards (paper-2 / 1px line, soft radius ~14), bottom-sheet modals on mobile, tag chips (uppercase, small), priority dots, week bars, 2×2 stat tiles, goal tabs, journal lined-paper pad, calendar grid with count badges and ghost dots, progress bars (red→amber→green), idle banner, confetti + circular "TASK COMPLETE" seal.

## Layout
390 px first; centered column max ~720 px on desktop; 16 px gutters; safe-area insets; sticky header. Generous spacing, one primary action per screen, large tap targets.

## Motion (target ≈ 20–25 % richer than v8)
Staggered card entrance (40 ms steps), progress fill animation, count-up on stat numbers, spring check animation, smooth expand/collapse (height + opacity), press scale 0.97, ghost-dot soft pulse, `.blink-3x` for idle jump, confetti. 150–300 ms, ease-out. Honour `prefers-reduced-motion`. Never animate layout in a way that moves what the user is about to tap.

## Expense module accents
Same neutrals; per-category colours from a muted palette (navy, teal, plum, ochre, brick, sage, slate, rose) with matching line icons. Income = teal, expense = brick/navy, never garish.

## Premium cues (without changing palette)
Consistent 8-pt spacing, hairline dividers, subtle paper grain optional, elegant empty states with a single line of encouraging copy, polished PDF layouts, branded splash/icon (original artwork).
