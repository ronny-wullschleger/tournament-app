# Tournament App — Plan

> **Keep this file in sync with the codebase at all times.**
> Every code change that affects features, architecture, or data must be reflected here.

---

## Overview

A modular React app for running round-robin football tournaments with knockout rounds. Supports multiple tournaments — each persisted individually with full history. Designed to run embedded in a host environment that provides `window.storage` (async key-value store), with a local Vite dev environment for development and testing.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 19 (hooks only, no external state lib) |
| Build / Dev server | Vite 7.3.1 + `@vitejs/plugin-react` 5.1.4 |
| Styling | Tailwind CSS 3.4.19 with custom theme, dark mode |
| Fonts | Google Fonts — DM Sans, Playfair Display |
| Persistence | `window.storage` (async get/set, key: `rr-tournaments-v3`) |
| App entry point | Default export `TournamentApp` from `src/App.jsx` |
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

## Project Structure

```
tournament-app/
├── src/
│   ├── components/        # React components
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── MatchCard.jsx
│   │   ├── KnockoutView.jsx
│   │   ├── SetupView.jsx
│   │   ├── StandingsTable.jsx
│   │   ├── TournamentListView.jsx
│   │   └── WinnerBanner.jsx
│   ├── hooks/             # Custom React hooks
│   │   └── useTournament.js    # Main tournament state management
│   ├── utils/             # Utility functions
│   │   ├── constants.js        # Phase constants and helpers
│   │   ├── storage.js          # Storage operations & migration
│   │   └── tournament.js       # Tournament logic (draw, stats, etc.)
│   ├── styles/            # CSS files
│   │   └── index.css           # Tailwind directives & fonts
│   └── App.jsx            # Main app component
├── main.jsx               # Dev entry point with storage mock
├── index.html             # HTML shell
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── package.json           # Dependencies
└── PLAN.md                # This file
```

---

## Module-Level Helpers

Located in `src/utils/tournament.js`:

| Helper | Purpose |
|---|---|
| `shuffle(arr)` | Fisher-Yates shuffle |
| `uid()` | Random 6-char ID |
| `createMatch(id, home, away)` | Factory for match objects |
| `computeTeamStats(teams, rounds)` | Accumulates P W D L GF GA Pts; returns sorted array (pts → GD → GF) |
| `generateRoundRobin(teams)` | Circle-method draw |

Located in `src/utils/storage.js`:

| Helper | Purpose |
|---|---|
| `save(envelope)` | Async write `{ tournaments, activeId }` to `window.storage` |
| `migrateIfNeeded()` | On mount: reads v3 key; if absent, reads v2 key and migrates; else returns empty envelope |

---

## Components

All components are in `src/components/` except for the root `App.jsx`.

| Component | Role | File |
|---|---|---|
| `TournamentApp` | Root — uses `useTournament` hook, routes views and tabs | `src/App.jsx` |
| `TournamentListView` | List of all tournaments sorted newest-first; empty state; "＋ New Tournament" button | `TournamentListView.jsx` |
| `SetupView` | Team entry form, 4–12 teams, validates unique non-empty names; `onCancel` prop shows "← Back to list" | `SetupView.jsx` |
| `StandingsTable` | Live group stage table: P W D L GF GA GD Pts, top 4 highlighted; shows ⓘ hover tooltip with tiebreak explanation when teams are separated by H2H or other tiebreaker | `StandingsTable.jsx` |
| `MatchCard` | Single match row; always shows score inputs in admin mode; auto-saves when focus leaves the card and both scores are valid integers ≥ 0 | `MatchCard.jsx` |
| `KnockoutView` | Renders a list of `MatchCard`s under a heading (semis / 3rd place / final) | `KnockoutView.jsx` |
| `WinnerBanner` | Trophy banner shown when phase is `done` | `WinnerBanner.jsx` |
| `Badge` | Pill label (Tailwind-styled) | `Badge.jsx` |
| `Button` | Styled button, variants: `primary` / `secondary` / `danger` / `gold` | `Button.jsx` |
| `Card` | Surface container with optional glow border | `Card.jsx` |
| `Input` | Styled text input | `Input.jsx` |

---

## Custom Hooks

Located in `src/hooks/`:

| Hook | Purpose |
|---|---|
| `useTournament` | Manages all tournament state (tournaments, activeId, view, tab), handles persistence, live updates, and provides all action handlers |

---

## Key Algorithms

### Round-Robin Draw (`generateRoundRobin`)
- Adds BYE if team count is odd
- Circle method: one team fixed, rest rotate each round
- BYE matchups are excluded from the match list
- Produces `n-1` rounds for `n` teams (padded to even)

### Standings & Top-4 (`computeTeamStats`)
Teams are first sorted by points. Within a group of teams tied on points, the following tiebreakers are applied in order:
1. Head-to-head points (mini-table of only matches between the tied teams)
2. Head-to-head goal difference
3. Head-to-head goals scored
4. Overall goal difference
5. Overall goals scored
6. Drawing of lots (deterministic: lexicographic team ID comparison — stable across all views)

When a team is placed via tiebreaker, a `tiebreakNote` string is attached to its stat object and shown as a hover tooltip (ⓘ) in the standings table, explaining which criterion decided the position and the team's value for that criterion.

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
