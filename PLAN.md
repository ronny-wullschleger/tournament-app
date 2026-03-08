# Tournament App — Plan

> **Keep this file in sync with `tournament.jsx` at all times.**
> Every code change that affects features, architecture, or data must be reflected here.

---

## Overview

A single-file React app (`tournament.jsx`) for running a round-robin football tournament with knockout rounds. Designed to run embedded in a host environment that provides `window.storage` (async key-value store).

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React (hooks only, no external state lib) |
| Styling | Inline styles, dark theme |
| Fonts | Google Fonts — DM Sans, Playfair Display |
| Persistence | `window.storage` (async get/set, key: `rr-tournament-v2`) |
| Entry point | Default export `TournamentApp` |

---

## Application Phases

```
SETUP → GROUP → SEMI → FINAL → DONE
```

| Phase | Description |
|---|---|
| `setup` | Admin configures tournament name and teams |
| `group` | Round-robin group stage, all matches played |
| `semi` | Top 4 teams by pts/GD/GF play semifinals (1v4, 2v3) |
| `final` | Winners play final; losers play 3rd-place match |
| `done` | Champion crowned, tournament complete |

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
  phase: 'setup'|'group'|'semi'|'final'|'done',
  semis: [match] | null,      // SF1 (1v4), SF2 (2v3)
  thirdPlace: match | null,   // 3rd-place match
  final: match | null,        // F1
  winner: string | null       // Winning team name
}
```

---

## Components

| Component | Role |
|---|---|
| `TournamentApp` | Root — loads/saves state, routes views and tabs |
| `SetupView` | Team entry form, 4–12 teams, validates unique non-empty names |
| `StandingsTable` | Live group stage table: P W D L GF GA GD Pts, top 4 highlighted |
| `MatchCard` | Single match row; inline score input in admin mode, click-to-edit if played |
| `KnockoutView` | Renders a list of `MatchCard`s under a heading (semis / final / 3rd place) |
| `WinnerBanner` | Trophy banner shown when phase is `done` |
| `Badge` | Pill label |
| `Button` | Styled button, variants: primary / secondary / danger / gold |
| `Card` | Surface container with optional glow border |
| `Input` | Styled text input |

---

## Key Algorithms

### Round-Robin Draw (`generateRoundRobin`)
- Adds BYE if team count is odd
- Circle method: one team fixed, rest rotate each round
- BYE matchups are excluded from the match list
- Produces `n-1` rounds for `n` teams (padded to even)

### Standings Sort (`StandingsTable` → `useMemo`)
Priority: Points → Goal Difference → Goals For

### Top-4 Selection (`getTopFour`)
Same sort logic, takes first 4 entries

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
| Generate Semifinals | Phase = group AND all group matches played |
| Generate Final | Phase = semi AND both semis played |
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

---

## Planned / Future Features

- [ ] Penalty shootout support for drawn knockout matches
- [ ] Configurable points per win (default: 3)
- [ ] Export results as PDF or image
- [ ] Multiple groups (group A / B)
- [ ] Match scheduling with time slots
