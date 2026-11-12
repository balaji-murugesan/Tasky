---
name: ship-change
description: Run the full autonomous delivery loop for one GitHub issue - OpenSpec proposal, implementation, verification, screenshots, and a pull request with risk assessment. Use when given an issue number to build, in nightly agent runs, or when asked to "ship" or "build" an issue end to end.
---

# Ship one change end to end

Input: an issue number `N`. Output: one PR (ready, or draft if blocked) linked to the issue.

## 0. Claim and branch

```bash
gh issue view N --json title,body,labels,comments
gh issue edit N --add-label agent:building --remove-label agent:ready
```

Pick a kebab-case change id from the title (e.g. `add-task-due-dates`), then `git switch -c agent/<change-id>`.

## 1. Plan with OpenSpec

Use the `openspec-propose` skill with the issue title and body as the request. Then:

```bash
npx openspec validate <change-id>
```

Fix until valid. Re-read `proposal.md`, `specs/**/spec.md`, `design.md` and `tasks.md` as a reviewer would: are the scenarios testable, is the scope tight, does `tasks.md` follow the rules in `openspec/config.yaml`? Commit as `spec: <change-id>`.

If the request is too ambiguous to spec without guessing, go to **Blocked**.

## 2. Implement

Use the `openspec-apply-change` skill for `<change-id>`. Work task by task, ticking boxes in `tasks.md`, committing in small steps.

## 3. Verify (the loop)

```bash
npm run app:up
npm run verify
```

Red → read the failure, fix, rerun. Max 5 iterations; after that go to **Blocked** with the last failure output.

## 4. Evidence

Run the `screenshot-changes` skill and look at every image.

## 5. Risk

```bash
npm run risk -- origin/main
```

If the result is `high` and the issue lacks `agent:allow-high-risk`, you touched something you shouldn't have: revert those files, or go to **Blocked**.

## 6. Open the PR

```bash
git push -u origin HEAD
gh pr create --title "<issue title>" --body-file artifacts/pr-body.md
```

Build `artifacts/pr-body.md` from `.github/pull_request_template.md`: `Closes #N`, a link to the OpenSpec change folder, the spec scenarios, test evidence (tail of the verify output), the screenshots section and the risk JSON. Then run `bash scripts/post-screenshots.sh <pr>`.

Remove `agent:building` from the issue and stop the app. CI applies the `risk:*` label and decides on auto-merge; don't set it yourself.

## Blocked

Commit whatever is useful, push, then:

```bash
gh pr create --draft --label needs-human --title "[blocked] <issue title>" --body-file artifacts/pr-body.md
```

The body starts with **Question for a human:** and the exact decision needed. Never guess past a real ambiguity.
