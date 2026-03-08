# Claude Code Rules — Tournament App

## Auto-push
Every commit must be immediately pushed to `origin main` without asking for confirmation.

## Testing after every change (mandatory)
After every code change to `tournament.jsx`, test the application using the Playwright MCP:
1. Ensure the Vite dev server is running (`npm run dev` at `http://localhost:5173`)
2. Use Playwright MCP browser tools to open the app and verify the changed behaviour works correctly
3. Only commit once the test passes

If the Playwright MCP is not available in the current session, note it explicitly and do not skip testing silently.

## Plan sync (mandatory)
`PLAN.md` is the living source of truth for what the app does. It must always match the actual code.

**Update `PLAN.md` before committing when a change affects:**
- Application phases or their transitions
- State shape (fields added, removed, or renamed)
- Component list (new, removed, or significantly changed)
- Key algorithms (standings sort, draw generation, top-4 selection, helpers)
- Team constraints or validation rules
- Persistence behaviour (storage key, load/save logic)
- Dev setup (build tool, entry point, storage mock)
- Tabs, views, or admin actions
- Any item in the "Planned / Future Features" list (mark done or remove)

**No `PLAN.md` update needed for:**
- Pure style/color tweaks
- Internal refactors with no behaviour change
- Bug fixes that don't change documented behaviour

## Commit message convention
- `feat: <description>` — new feature
- `fix: <description>` — bug fix
- `style: <description>` — visual/style only
- `refactor: <description>` — no behaviour change
- `docs: <description>` — PLAN.md or docs only
- `chore: <description>` — tooling, config, dependencies

## Project structure
| File | Purpose |
|---|---|
| `tournament.jsx` | Entire app — do not split unless explicitly asked |
| `main.jsx` | Dev entry point; mounts app and provides `window.storage` mock via `localStorage` |
| `index.html` | Minimal HTML shell for Vite |
| `vite.config.js` | Vite + React plugin config |
| `package.json` | Dependencies: React 19, Vite, `@vitejs/plugin-react` |
| `PLAN.md` | Living spec — must stay in sync with code |
| `.mcp.json` | Local MCP server config (Playwright); not committed |

## Dev environment
- Start dev server: `npm run dev` → `http://localhost:5173`
- `window.storage` is mocked with `localStorage` in `main.jsx`
- Playwright MCP is configured in `.mcp.json` for browser-based testing
