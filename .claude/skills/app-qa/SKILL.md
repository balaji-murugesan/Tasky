---
name: app-qa
description: Exploratory QA of the running Tasky app - run the suites, hunt for bugs the tests don't cover, verify each finding, and file deduplicated GitHub issues ready for an agent to fix. Use for scheduled continuous QA, after a batch of merges, or when asked to "test the app".
---

# Continuous app QA

Goal: find real, reproducible problems on `main` and turn each into an issue an agent can fix overnight. Quality over quantity: a false alarm costs a whole agent run.

## 1. Baseline

```bash
npm ci && npm run app:up
npm run verify        # record any failure verbatim; a red main is the #1 finding
npm run screenshots
```

Read every PNG in `artifacts/screenshots/` and note visual defects.

## 2. Explore beyond the tests

Write throwaway Playwright scripts under `artifacts/qa/` (not committed) and run them with `npx tsx`. Check each requirement in `openspec/specs/**` against the real app, then probe the edges the spec implies:

- Boundaries: 120 vs 121 characters, whitespace, unicode/emoji, HTML-looking input (`<b>x</b>` must render as text).
- Repetition: double-click Add, rapid toggling, delete then refresh.
- The API directly with curl: bad JSON, wrong types, unknown ids, wrong methods.
- Mobile viewport (390×844): overflow, tap targets.
- Browser console errors (`page.on('console')`) and failed network requests.

## 3. Verify before filing

Reproduce each finding **twice** from a fresh `POST /api/__reset`. Drop anything flaky or anything that matches the spec's intended behaviour.

## 4. Deduplicate

```bash
gh issue list --state open --label bug --search "<key words>" --json number,title
```

If an open issue already covers it, comment with the new evidence instead of filing.

## 5. File

```bash
gh issue create --title "<short, specific>" --label "bug,source:qa" --body-file artifacts/qa/<id>.md
```

The body must contain **Steps to reproduce**, **Expected** (quote the spec requirement), **Actual**, **Evidence** (command output or screenshot path) and a **Suggested acceptance test** (a WHEN/THEN scenario).

Add `agent:ready` only if the expected behaviour is unambiguous from the spec; otherwise leave it for a human.

## 6. Report

Finish with a short table: finding · issue number · agent:ready yes/no. File at most 5 new issues per run (the most severe); list the rest in the report. Run `npm run app:down`.
