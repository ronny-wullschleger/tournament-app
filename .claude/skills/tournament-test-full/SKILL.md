---
name: tournament-test-full
description: Full end-to-end test of the tournament app using Playwright. Runs a complete tournament with 4 teams from group stage through semifinals and final to a crowned champion. Use when you want to verify the entire tournament flow works correctly.
---

# Tournament App — Full Flow Test Skill

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
- Enter these 4 team names: **Arsenal**, **Bayern**, **Celtic**, **Dynamo**.
- Click **Generate Draw & Start →**.

## Step 3 — Enter all group stage results

There will be 3 rounds (6 matches total). Scores auto-save when focus leaves a match card — no confirm button.

For each match fill both spinbuttons then move focus to the next match's home spinbutton. After the very last match, click the **📊 Standings** tab to trigger the final blur/save.

Use these scores:
| Match | Home | Away |
|-------|------|------|
| R1 M1 | 3 | 0 |
| R1 M2 | 1 | 2 |
| R2 M1 | 2 | 2 |
| R2 M2 | 0 | 1 |
| R3 M1 | 1 | 1 |
| R3 M2 | 4 | 2 |

## Step 4 — Verify group stage complete

- All 3 rounds must show a **Complete** badge.
- **🏟️ Generate Semifinals** button must be enabled.
- Take a screenshot of the Matches tab.

## Step 5 — Generate Semifinals

- Click **🏟️ Generate Semifinals**.
- The phase badge in the header must change to **Semifinals**.
- The **🏆 Knockout** tab must now be visible — click it.

## Step 6 — Enter semifinal results

There are 2 semifinal matches. Fill both spinbuttons per match, move focus between matches to trigger save. After the last match, click somewhere else (e.g. the Standings tab) to trigger final save.

Use these scores:
| Match | Home | Away |
|-------|------|------|
| Semi 1 | 2 | 0 |
| Semi 2 | 1 | 3 |

## Step 7 — Verify semifinals complete and generate final

- Both semi matches must show saved scores.
- **🏆 Generate Final** button must be enabled — click it.
- The phase badge must change to **Finals**.

## Step 8 — Enter final and 3rd place results

There are 2 matches (3rd place + final). Fill both. Move focus after each to save. After the last match click away.

Use these scores:
| Match | Home | Away |
|-------|------|------|
| 3rd place | 1 | 2 |
| Final     | 3 | 1 |

## Step 9 — Verify champion

- A **🏆 Winner** banner must appear showing the winning team.
- The phase badge in the header must show **Completed**.
- Take a full-page screenshot of the final state.

## Step 10 — Report

Tell the user:
- Teams entered
- All group stage results (6 matches)
- Semifinal results (2 matches)
- Final + 3rd place results (2 matches)
- The name of the crowned champion
- Pass/fail for each phase transition (group → semi → final → done)
