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
- Click **🔧 Admin** to enable admin mode.
- Click **＋ New Tournament**.
- Fill all 4 team name textboxes: **Arsenal**, **Bayern**, **Celtic**, **Dynamo**.
- Click **Generate Draw & Start →**.

## Step 3 — Enter all group stage results in one batch

Take a snapshot to get all spinbutton refs. Use a **single `browser_fill_form` call** to fill all 12 spinbuttons at once (6 matches × 2 scores):

| Match | Home | Away |
|-------|------|------|
| R1 M1 | 3 | 0 |
| R1 M2 | 1 | 2 |
| R2 M1 | 2 | 2 |
| R2 M2 | 0 | 1 |
| R3 M1 | 1 | 1 |
| R3 M2 | 4 | 2 |

After the fill, click **📊 Standings** tab to trigger blur and save all at once.

## Step 4 — Verify group stage and generate semifinals

- All 3 rounds must show **Complete** badge.
- Click **🏟️ Generate Semifinals** (must be enabled).
- Verify the phase badge changes to **Semifinals**.
- Take a screenshot of the Matches tab.

## Step 5 — Enter semifinal results in one batch

Click the **🏆 Knockout** tab. Take a snapshot to get spinbutton refs for the 2 semi matches. Use a **single `browser_fill_form` call** to fill all 4 spinbuttons:

| Match | Home | Away |
|-------|------|------|
| Semi 1 | 2 | 0 |
| Semi 2 | 1 | 3 |

After the fill, click **📊 Standings** tab to save.

## Step 6 — Verify semifinals and generate final

- **🏆 Generate Final** must be enabled — click it.
- Verify the phase badge changes to **Finals**.

## Step 7 — Enter final and 3rd place results in one batch

Click **🏆 Knockout** tab. Take a snapshot. Use a **single `browser_fill_form` call** to fill all 4 spinbuttons for the 3rd place and final matches:

| Match | Home | Away |
|-------|------|------|
| 3rd place | 1 | 2 |
| Final     | 3 | 1 |

After the fill, click **📊 Standings** tab to save.

## Step 8 — Verify champion

- A **🏆 Winner** banner must appear showing the winning team.
- The phase badge must show **Completed**.
- Take a full-page screenshot of the Knockout tab.

## Step 9 — Report

Tell the user:
- Teams entered
- All group stage results (6 matches)
- Semifinal results (2 matches)
- Final + 3rd place results (2 matches)
- The crowned champion
- Pass/fail for each phase transition (group → semi → final → done)
