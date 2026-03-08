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

Click the `🔧 Admin` button. If a tournament is already open, click `← All Tournaments` first.

## Step 4 — Fill in 4 team names

Click **＋ New Tournament**. Fill the four team textboxes with:
- Ajax, Barcelona, Chelsea, Dortmund

Then click **Generate Draw & Start →**.

## Step 5 — Enter all group stage results in one batch

Take a snapshot to get all spinbutton refs. Then use a **single `browser_fill_form` call** to fill all 12 spinbuttons at once (6 matches × 2 scores):

Use these scores in order (home then away for each match):
| Match | Home | Away |
|-------|------|------|
| R1 M1 | 2 | 1 |
| R1 M2 | 0 | 3 |
| R2 M1 | 1 | 1 |
| R2 M2 | 2 | 2 |
| R3 M1 | 3 | 0 |
| R3 M2 | 1 | 4 |

After the single fill_form call, click **📊 Standings** tab to trigger blur and save all scores at once.

## Step 6 — Verify completion

- All 3 rounds should show a **Complete** badge.
- The **🏟️ Generate Semifinals** button must be enabled (not disabled).

Take a full-page screenshot to show the final state.

## Step 7 — Report

Tell the user:
- Which teams were entered
- All 6 results
- Whether the Semifinals button is unlocked (pass/fail)
