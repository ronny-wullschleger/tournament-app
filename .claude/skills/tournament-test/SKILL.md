---
name: tournament-test
description: End-to-end test of the tournament app using Playwright. Fills in 4 teams and random match results through the full group stage. Use when the user wants to quickly smoke-test the app.
---

# Tournament App — Quick Test Skill

When this skill is invoked, execute the following steps using the Playwright MCP tools.

## Step 1 — Ensure dev server is running

Run this bash command to check:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```
If the result is not `200`, inform the user to start the server with `npm run dev` and stop.

## Step 2 — Navigate to the app

Use `mcp__playwright__browser_navigate` to open `http://localhost:5173`.

## Step 3 — Open Admin mode

Click the `🔧 Admin` button.

## Step 4 — Fill in 4 team names

Fill the four team textboxes with these names (or any 4 distinct names you choose):
- Ajax
- Barcelona
- Chelsea
- Dortmund

Then click **Generate Draw & Start →**.

## Step 5 — Enter results for all group matches

There will be 3 rounds with 2 matches each (6 matches total). For every match:
1. Fill the left spinbutton (home score) and right spinbutton (away score) with random plausible scores (0–4).
2. Click the `✓` confirm button for that match.
3. Wait for the score display to update before moving to the next match.

Suggested scores (feel free to vary):
| Match | Home | Away |
|-------|------|------|
| R1 M1 | 2 | 1 |
| R1 M2 | 0 | 3 |
| R2 M1 | 1 | 1 |
| R2 M2 | 2 | 2 |
| R3 M1 | 3 | 0 |
| R3 M2 | 1 | 4 |

## Step 6 — Verify completion

After the last result is confirmed:
- All 3 rounds should show a **Complete** badge.
- The **🏟️ Generate Semifinals** button must be enabled (not disabled).

Take a full-page screenshot to show the final state.

## Step 7 — Report

Tell the user:
- Which teams were entered
- All 6 results
- Whether the Semifinals button is unlocked (pass/fail)
