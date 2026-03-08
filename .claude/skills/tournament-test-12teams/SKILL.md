---
name: tournament-test-12teams
description: Stress test of the tournament app using Playwright with the maximum 12 teams. Runs the full group stage (66 matches across 11 rounds) and verifies the Generate Semifinals button unlocks correctly. Use when you want to verify the app handles the maximum team count.
---

# Tournament App — 12-Team Stress Test Skill

When this skill is invoked, execute the following steps using the Playwright MCP tools.

## Step 1 — Ensure dev server is running

Run this bash command to check:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```
If the result is not `200`, inform the user to start the server with `npm run dev` and stop.

## Step 2 — Navigate and start a new tournament

- Navigate to `http://localhost:5173`.
- Click **← All Tournaments** if a tournament is already open.
- Click **＋ New Tournament**.
- Click **+ Add Team** repeatedly until there are 12 team inputs (8 more clicks after the default 4).
- Fill all 12 team name textboxes:
  1. Ajax
  2. Barcelona
  3. Chelsea
  4. Dortmund
  5. Everton
  6. Feyenoord
  7. Galatasaray
  8. Hamburg
  9. Inter
  10. Juventus
  11. Köln
  12. Liverpool
- Click **Generate Draw & Start →**.

## Step 3 — Enter all group stage results

With 12 teams there are **11 rounds with 6 matches each = 66 matches total**.

Scores auto-save when focus leaves a match card. For each match fill both spinbuttons then move focus to the next match's home spinbutton. After the very last match of each round, move focus to the next round's first match or, after the final match of all, click the **📊 Standings** tab.

Use a simple repeating pattern for all 66 matches — alternate these two score lines and cycle through them:
- Odd-numbered matches: **2 – 1**
- Even-numbered matches: **1 – 1**

Work through each round sequentially: Round 1 through Round 11.

## Step 4 — Verify group stage complete

After all 66 matches:
- All 11 rounds must show a **Complete** badge (scroll down to check all rounds).
- **🏟️ Generate Semifinals** button must be **enabled** (not disabled/greyed out).
- Take a full-page screenshot of the Matches tab.
- Switch to the **📊 Standings** tab and take a second screenshot showing the 12-team standings table.

## Step 5 — Report

Tell the user:
- All 12 team names
- Total matches entered (should be 66)
- Whether all 11 rounds show Complete (pass/fail)
- Whether the Generate Semifinals button is unlocked (pass/fail)
- The top 4 teams from the standings table (who will advance to semis)
