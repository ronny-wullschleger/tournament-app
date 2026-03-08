# Tournament App — Plan

> **Keep this file in sync with `tournament.jsx` at all times.**
> Every code change that affects features, architecture, or data must be reflected here.

---

## Overview

A single-file React app (`tournament.jsx`) for running round-robin football tournaments with knockout rounds. Supports multiple tournaments — each persisted individually with full history. Designed to run embedded in a host environment that provides `window.storage` (async key-value store), with a local Vite dev environment for development and testing.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React (hooks only, no external state lib) |
| Build / Dev server | Vite + `@vitejs/plugin-react` |
| Styling | Inline styles, dark theme |
| Fonts | Google Fonts — DM Sans, Playfair Display |
| Persistence | `window.storage` (async get/set, key: `rr-tournaments-v3`) |
| App entry point | Default export `TournamentApp` from `tournament.jsx` |
| Dev entry point | `main.jsx` — mounts app, injects `localStorage`-backed `window.storage` mock |

---

## Dev Setup

```
npm run dev     # starts Vite at http://localhost:5173
npm run build   # production build
npm run preview # preview production build
```

`main.jsx` provides a `window.storage` mock backed by `localStorage` so the app works identically in the browser as it would in the host environment.

---

## Application Phases

```
GROUP → SEMI → FINAL → DONE
```

| Phase | Description |
|---|---|
| `group` | Round-robin group stage; admin enters scores match by match |
| `semi` | Top 4 teams by pts/GD/GF play semifinals (1v4, 2v3) |
| `final` | Semi winners play final; losers play 3rd-place match |
| `done` | Both final and 3rd-place played; champion crowned |

> There is no `setup` phase constant — `activeId === "new"` triggers `SetupView`.

---

## Persisted Envelope Shape

```js
{
  tournaments: [
    {
      id: string,           // uid()
      createdAt: number,    // Date.now()
      name: string,
      teams: [{ id, name }],
      rounds: [{
        round: number,
        matches: [{ id, round, home, away, homeScore, awayScore, played }]
      }],
      phase: 'group'|'semi'|'final'|'done',
      semis: [match] | null,
      thirdPlace: match | null,
      final: match | null,
      winner: string | null
    }
  ],
  activeId: string | null   // null = list view, "new" = setup, id = tournament detail
}
```

---

## Root State

```js
const [tournaments, setTournaments] = useState([]);
const [activeId, setActiveId] = useState(null);
```

`activeTournament` is derived: `tournaments.find(t => t.id === activeId) ?? null`

All handlers use `updateActive(updater)` — a private helper that maps over `tournaments` and applies `updater` only to the active entry.

---

## Module-Level Helpers

| Helper | Purpose |
|---|---|
| `shuffle(arr)` | Fisher-Yates shuffle |
| `uid()` | Random 6-char ID |
| `createMatch(id, home, away)` | Factory for match objects |
| `computeTeamStats(teams, rounds)` | Accumulates P W D L GF GA Pts; returns sorted array (pts → GD → GF) |
| `generateRoundRobin(teams)` | Circle-method draw |
| `save(envelope)` | Async write `{ tournaments, activeId }` to `window.storage` |
| `migrateIfNeeded()` | On mount: reads v3 key; if absent, reads v2 key and migrates; else returns empty envelope |

---

## Components

| Component | Role |
|---|---|
| `TournamentApp` | Root — loads/saves state, routes views and tabs |
| `TournamentListView` | List of all tournaments sorted newest-first; empty state; "＋ New Tournament" button |
| `SetupView` | Team entry form, 4–12 teams, validates unique non-empty names; `onCancel` prop shows "← Back to list" |
| `StandingsTable` | Live group stage table: P W D L GF GA GD Pts, top 4 highlighted |
| `MatchCard` | Single match row; always shows score inputs in admin mode; auto-saves when focus leaves the card and both scores are valid integers ≥ 0 |
| `KnockoutView` | Renders a list of `MatchCard`s under a heading (semis / 3rd place / final) |
| `WinnerBanner` | Trophy banner shown when phase is `done` |
| `Badge` | Pill label |
| `Button` | Styled button, variants: `primary` / `secondary` / `danger` / `gold` |
| `Card` | Surface container with optional glow border |
| `Input` | Styled text input |

---

## Key Algorithms

### Round-Robin Draw (`generateRoundRobin`)
- Adds BYE if team count is odd
- Circle method: one team fixed, rest rotate each round
- BYE matchups are excluded from the match list
- Produces `n-1` rounds for `n` teams (padded to even)

### Standings & Top-4 (`computeTeamStats`)
Sort priority: Points → Goal Difference → Goals For.

### Score Handlers
All handlers (`handleScoreSave`, `handleSemiSave`, `handleFinalSave`) use `updateActive` with targeted immutable spreads.

---

## Views & Tabs

### Render Path

```
loading         → spinner
activeId === null   → TournamentListView
activeId === "new"  → SetupView (admin) or "Admin Only" prompt (public)
activeId === <id>   → tournament detail UI (reads activeTournament)
```

### Header (sticky)

- **List / setup view:** `⚽  All Tournaments`
- **Tournament detail:** `⚽  [← All Tournaments]  /  [Name]  [Phase Badge]`
- Live / Admin toggle always visible

### Tabs (shown when tournament active)
- 📊 Standings
- 📋 Matches (group rounds)
- 🏆 Knockout (visible once semis generated)

### Admin Actions (tournament detail)
| Action | Condition |
|---|---|
| Generate Semifinals | Phase = `group` AND all group matches played |
| Generate Final | Phase = `semi` AND both semis played |
| ＋ New Tournament | Always available |
| 🗑️ Delete Tournament | Always available; requires `window.confirm` |

---

## Team Constraints

- Min: 4, Max: 12
- All names must be non-empty and unique (case-insensitive)
- Teams are shuffled randomly before the draw

---

## Persistence

- Storage key: `rr-tournaments-v3`
- Persists `{ tournaments, activeId }` envelope on every state change
- On mount: `migrateIfNeeded()` — auto-migrates existing `rr-tournament-v2` data into the first entry of the `tournaments` array
- Loads on mount; renders a loading spinner while waiting
- In dev: `window.storage` is mocked with `localStorage` in `main.jsx`

## Live Updates (no reload required)

Viewers see score and standings changes in real time without refreshing:

| Mechanism | Scope | Latency |
|---|---|---|
| `BroadcastChannel("rr-tournaments-v3")` | Same browser, other tabs | Instant |
| `setInterval` poll every 5 s | Any device sharing the same `window.storage` backend | ≤ 5 s |

- Only `tournaments` is synced from external updates — each viewer keeps their own `activeId` (navigation state).
- A `JSON.stringify` equality check prevents unnecessary re-renders when nothing has changed.
- The channel is created at module level; `save()` calls `postMessage("update")` after every write.

---

## Planned / Future Features

- [ ] Penalty shootout support for drawn knockout matches
- [ ] Configurable points per win (default: 3)
- [ ] Export results as PDF or image
- [ ] Multiple groups (group A / B)
- [ ] Match scheduling with time slots
