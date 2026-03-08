# Claude Code Rules — Tournament App

## Auto-push
Every commit must be immediately pushed to `origin main` without asking for confirmation.

## Plan sync (mandatory)
`PLAN.md` is the source of truth for what the app does. It must always reflect the actual code in `tournament.jsx`.

**After any code change, update `PLAN.md` before committing if the change affects:**
- Application phases or their transitions
- State shape (fields added, removed, or renamed)
- Component list (new, removed, or significantly changed components)
- Key algorithms (standings sort, draw generation, top-4 selection)
- Team constraints or validation rules
- Persistence behaviour (storage key, load/save logic)
- Tabs, views, or admin actions
- Any item in the "Planned / Future Features" list (mark done or remove)

**What does NOT require a `PLAN.md` update:**
- Pure style/color tweaks
- Refactors that don't change behaviour
- Bug fixes that don't change documented behaviour

## Commit message convention
- `feat: <description>` — new feature
- `fix: <description>` — bug fix
- `style: <description>` — visual/style only
- `refactor: <description>` — no behaviour change
- `docs: <description>` — PLAN.md or docs only

## Single source file
The entire app lives in `tournament.jsx`. Do not split it into multiple files unless explicitly asked.
