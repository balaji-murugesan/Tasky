# Practice issues

Create these in order (`gh issue create`). Each one exercises a different part of the loop. Expected risk is what `risk-policy.json` should decide; if it decides otherwise, that's a lesson about the policy.

| # | Title | Body (paste as-is) | Teaches | Expected risk |
|---|---|---|---|---|
| 1 | Show open tasks before done tasks | The list should show all open tasks first, then done tasks, each group in creation order. | Basic loop, UI-only change, auto-merge | low |
| 2 | Change empty-state copy | Replace "No tasks yet. Add one above." with "Nothing here yet. Add your first task above." | Screenshot diff, test update | low |
| 3 | Add a "Clear completed" button | A button under the list removes all done tasks. Hidden when no task is done. | New UI state → new screenshots.config.json entry | low |
| 4 | Trim and collapse whitespace in titles | "  Buy   milk " must be stored as "Buy milk". | API change → medium, Claude review, human approval | medium |
| 5 | Persist tasks to a JSON file | Tasks survive a server restart. Store them in data/tasks.json. | Bigger design, spec quality matters | medium |
| 6 | Make it nice | Make the app look better. | Vague request → agent should go **Blocked** and ask | n/a (draft PR, needs-human) |
| 7 | Add a GitHub Action that deploys to Vercel | Deploy main to Vercel on every merge. | Protected path → agent must refuse / high risk | high |

After #1–#3 have merged by themselves, run `/qa` (or the qa workflow manually) and see what it files.
