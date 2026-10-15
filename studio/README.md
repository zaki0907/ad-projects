# AD Studio

The app supports a loopback-only local preview and authenticated Vercel/Neon cloud storage. Production requires DATABASE_URL and a random STUDIO_ACCESS_KEY of at least 32 characters. Never commit records, credentials, or exports.

## Run

Requires Node.js 20+. From the repository root:

```sh
node studio/preview-server.mjs /absolute/path/to/original-projects.json
```

Open http://127.0.0.1:4317. On later runs the snapshot argument is optional because `.preview-data/state.json` persists. The service listens on loopback only. Do not expose it publicly; it has no user account authentication.

```sh
node --test tests/model.test.mjs
```

## Data preservation

- First run creates a separate v2 workspace and an untouched original snapshot.
- All original project fields and original milestone objects remain present.
- Explicit milestone `checked` values take precedence. Otherwise old status is retained, and automatically-derived legacy completion is flagged for review.
- Existing photo and separate copy milestones are retained. New projects use the eight requested stages (B-co owned by A; copywriting owned by me).
- Missing historical hours and split amounts are null, not zero or guessed defaults.
- Existing payDate becomes actual date only when payStatus is received; otherwise it is retained as expected date. Original fields also remain.
- New project defaults are snapshots; later template changes do not mutate old cases.
- PUT validates input, requires same-origin, checks revision, backs up the previous file, then atomically replaces the preview file. Conflicts fail instead of silently overwriting another tab.
- Real client records are ignored by Git and are never embedded into static source or deployment artifacts.

## Implemented

Overview, project edit/create, independent stage dates/statuses/owners, multiple daily work allocations, responsive shared-date Gantt (7 days desktop / 3 days mobile, previous/next date navigation, ongoing projects only), per-person capacity, strict >80% calendar-day streak warnings, zero-capacity conflicts, configurable warning horizon, single-settlement production fees, expected/actual date filters, separate quote/cost/split accounting, CSV export, weekly/exception capacity settings, editable/reorderable workflow templates, editable split defaults, preview audit history, JSON backup/restore, A reminder JSON export with stable task IDs.

Initial capacity defaults: weekdays 6h; weekends 0h, editable. Stage-hour defaults are editable estimates, not measured actuals. Local warnings are visible in the app; there are no push notifications.

## Production release

- Root routes serve Studio; localhost uses `/preview/state`, HTTPS uses `/api/state` with a shared bearer access code stored only for the browser session. The two partners share access; there is no individual identity or role separation yet.
- API access fails closed without the environment key. Old read/write APIs return 401 without credentials and 410 with credentials, preventing stale clients from overwriting data.
- One-time authenticated POST to `/api/state` imports `{state, legacy}` only if the original database snapshot still matches and no Studio state exists. Real data is supplied privately, never bundled in Git.
- Neon keeps legacy `projects` intact. Studio uses `studio_state` and transactional `studio_backups`; PUT requires the current revision and rejects concurrent stale writes.
- Existing LINE scheduling reads Studio task dates once migrated. Apple Reminders is still JSON export only and is not connected.
- Rotate STUDIO_ACCESS_KEY in Vercel and redeploy to revoke existing access. Backups contain private client and financial data.
- Before promoting, verify cloud save/reload, conflict rejection, unauthorized requests and all 39 migrated records. For rollback, export current Studio state first; the preserved legacy table does not include new Studio changes.

## Verification

Model tests cover migration, defaults, daily loads, calendar streaks, zero capacity, payment date filtering, reminder identity/filtering, and invalid data. Browser checks completed using the in-app browser for project creation with work allocation, persistence, settings updates across reload, capacity display and financial rendering. Desktop/mobile visual inspection performed. Automated Playwright launching was blocked by the host sandbox; no claim of that automated suite passing.

## Advertising license fees
Independent licensing contracts linked to existing projects (including completed ones). Each calendar month has a stable-ID receipt record owned entirely by me. Tracks labor-form signed date, expected remittance, and actual receipt separately. Income source filters apply to both finance display and CSV export. New month generation is explicit via the through-month field, not a background job; amounts for partial months are manually editable. Rate changes only affect records not yet generated. Ending a contract blocks new generation, preserving receivables. Added model tests and browser create/sign/save/finance flow checks. Updated preview runs at port 4318 to load new server-side validation; the old 4317 process could not be terminated from the current sandbox.
