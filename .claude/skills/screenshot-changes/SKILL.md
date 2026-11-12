---
name: screenshot-changes
description: Capture screenshots of every screen affected by the current change and attach them to the pull request. Use after implementation is verified and before (or right after) opening a PR, and whenever a reviewer asks to "show me" a UI change.
---

# Screenshot every change

Reviewers (and the auto-merge gate) trust a UI change only when they can see it. This skill makes the evidence.

## 1. Decide which screens are affected

```bash
git diff --name-only origin/main...HEAD
```

- Anything under `web/src/` → UI changed. Find the screens that render the changed components.
- A **new** screen or a **new state** (error, empty, loading, modal) → add an entry to `screenshots.config.json` with the steps that reach it. Steps support `fill` (input label), `click` (button name), `check` (checkbox label), `waitFor` (visible text).
- API-only change → still capture the screen that shows the affected data, so reviewers see the end-to-end effect.

## 2. Capture

```bash
npm run app:up
npm run screenshots                       # all pages, desktop + mobile
npm run screenshots -- home-with-tasks    # or only the affected ones
```

Output: `artifacts/screenshots/<page>--<viewport>.png` and `manifest.json`.

## 3. Look at every image yourself

Open each PNG with the Read tool and check:
- The change is actually visible and matches the spec scenario.
- Nothing is clipped, overlapping, unstyled, or showing an unexpected error.
- The mobile layout still works.

If something looks wrong, fix the code and recapture. Never post a screenshot you haven't looked at.

## 4. Before/after (preferred for visual changes)

```bash
git stash -u && npm run screenshots -- <pages> && mkdir -p artifacts/before && mv artifacts/screenshots/*.png artifacts/before/
git stash pop && npm run screenshots -- <pages>
```

## 5. Attach to the PR

CI does this automatically (`.github/workflows/ci.yml` pushes PNGs to the `pr-screenshots` branch and updates a sticky comment). In an agent run, do the same with:

```bash
bash scripts/post-screenshots.sh <pr-number>
```

Then add one line per screenshot to the PR body's **Screenshots** section saying what the reviewer should notice.
