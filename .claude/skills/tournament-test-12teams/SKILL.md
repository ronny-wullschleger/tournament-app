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
- Click **🔧 Admin** to enable admin mode.
- Click **＋ New Tournament**.
- Click **+ Add Team** 8 times to reach 12 team inputs.
- Fill all 12 team name textboxes in one `browser_fill_form` call:
  1. Ajax, 2. Barcelona, 3. Chelsea, 4. Dortmund, 5. Everton, 6. Feyenoord,
  7. Galatasaray, 8. Hamburg, 9. Inter, 10. Juventus, 11. Köln, 12. Liverpool
- Click **Generate Draw & Start →**.

## Step 3 — Enter all group stage results round by round

With 12 teams there are **11 rounds × 6 matches = 66 matches (132 spinbuttons total)**.

Scores auto-save when focus leaves a match card. Process **one round at a time**:

For each round:
1. Take a snapshot to get the spinbutton refs for that round's 12 inputs (6 matches × 2).
2. Use a **single `browser_fill_form` call** to fill all 12 spinbuttons for that round at once.
3. Use this alternating score pattern: odd-numbered matches → **2 : 1**, even-numbered matches → **1 : 1**.

After completing all 11 rounds, click the **📊 Standings** tab to trigger the final blur/save.

## Step 4 — Verify group stage complete

- All 11 rounds must show a **Complete** badge (scroll to check all).
- **🏟️ Generate Semifinals** must be **enabled**.
- Take a full-page screenshot of the Matches tab.
- Switch to **📊 Standings** and take a second screenshot of the 12-team table.

## Step 5 — Report

Tell the user:
- All 12 team names
- Total matches entered (should be 66)
- Whether all 11 rounds show Complete (pass/fail)
- Whether the Generate Semifinals button is unlocked (pass/fail)
- The top 4 teams from the standings (who advance to semis)
