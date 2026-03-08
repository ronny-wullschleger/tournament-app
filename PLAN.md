# Tournament App — Plan

> **Keep this file in sync with `tournament.jsx` at all times.**
> Every code change that affects features, architecture, or data must be reflected here.

---

## Overview

A single-file React app (`tournament.jsx`) for running a round-robin football tournament with knockout rounds. Designed to run embedded in a host environment that provides `window.storage` (async key-value store), with a local Vite dev environment for development and testing.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React (hooks only, no external state lib) |
| Build / Dev server | Vite + `@vitejs/plugin-react` |
| Styling | Inline styles, dark theme |
| Fonts | Google Fonts — DM Sans, Playfair Display |
| Persistence | `window.storage` (async get/set, key: `rr-tournament-v2`) |
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

> There is no `setup` phase constant — the app starts with `state = null` and renders `SetupView` until the tournament is started.

---

## State Shape

```js
{
  name: string,           // Tournament name
  teams: [{ id, name }], // 4–12 teams, shuffled on start
  rounds: [{             // Round-robin rounds
    round: number,
    matches: [{ id, round, home, away, homeScore, awayScore, played }]
  }],
  phase: 'group'|'semi'|'final'|'done',
  semis: [match] | null,      // SF1 (1v4), SF2 (2v3)
  thirdPlace: match | null,   // 3RD
  final: match | null,        // F1
  winner: string | null       // Winning team name
}
```

---

## Module-Level Helpers

| Helper | Purpose |
|---|---|
| `shuffle(arr)` | Fisher-Yates shuffle |
| `uid()` | Random 6-char ID for team objects |
| `createMatch(id, home, away)` | Factory for match objects — `{ id, home, away, homeScore: null, awayScore: null, played: false }` |
| `computeTeamStats(teams, rounds)` | Accumulates P W D L GF GA Pts from played matches; returns sorted array (pts → GD → GF). Used by both `StandingsTable` and `getTopFour` |
| `generateRoundRobin(teams)` | Circle-method draw; uses `createMatch` internally |
| `save(state)` | Async write to `window.storage` |
| `load()` | Async read from `window.storage` |

---

## Components

| Component | Role |
|---|---|
| `TournamentApp` | Root — loads/saves state, routes views and tabs |
| `SetupView` | Team entry form, 4–12 teams, validates unique non-empty names |
| `StandingsTable` | Live group stage table: P W D L GF GA GD Pts, top 4 highlighted; uses `computeTeamStats` |
| `MatchCard` | Single match row; inline score input in admin mode, click-to-edit if already played |
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
- Uses `createMatch` factory for each match object

### Standings & Top-4 (`computeTeamStats`)
Single shared helper used by both `StandingsTable` (via `useMemo`) and `getTopFour`.
Sort priority: Points → Goal Difference → Goals For.

### Score Handlers
All three handlers (`handleScoreSave`, `handleSemiSave`, `handleFinalSave`) use targeted immutable spreads — no full deep-clone.

---

## Views & Tabs

### Header (sticky)
- Tournament name + phase badge
- **Live** (public, read-only) / **Admin** (score entry) toggle

### Tabs (shown when tournament active)
- 📊 Standings
- 📋 Matches (group rounds)
- 🏆 Knockout (visible once semis generated)

### Admin Actions
| Action | Condition |
|---|---|
| Generate Semifinals | Phase = `group` AND all group matches played |
| Generate Final | Phase = `semi` AND both semis played |
| Reset Tournament | Always available |

---

## Team Constraints

- Min: 4, Max: 12
- All names must be non-empty and unique (case-insensitive)
- Teams are shuffled randomly before the draw

---

## Persistence

- Auto-saves state to `window.storage` on every state change
- Loads on mount; renders a loading spinner while waiting
- Storage key: `rr-tournament-v2`
- In dev: `window.storage` is mocked with `localStorage` in `main.jsx`

---

## Planned / Future Features

- [ ] Penalty shootout support for drawn knockout matches
- [ ] Configurable points per win (default: 3)
- [ ] Export results as PDF or image
- [ ] Multiple groups (group A / B)
- [ ] Match scheduling with time slots
