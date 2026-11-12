#!/usr/bin/env bash
# Publish artifacts/screenshots/*.png to the `pr-screenshots` branch and
# create/update ONE sticky comment on the PR showing them.
#   bash scripts/post-screenshots.sh <pr-number>
# Needs: gh (authenticated), git push rights. Works in CI and locally.
set -euo pipefail
cd "$(dirname "$0")/.."

PR="${1:?usage: post-screenshots.sh <pr-number>}"
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
SHA="$(git rev-parse --short HEAD)"
BRANCH="pr-screenshots"
DEST="pr-${PR}/${SHA}"
MARKER="<!-- tasky-screenshots -->"

shopt -s nullglob
pngs=(artifacts/screenshots/*.png)
[[ ${#pngs[@]} -eq 0 ]] && { echo "no screenshots to post"; exit 0; }

# Check out (or create) the orphan screenshots branch in a temp worktree.
WT="$(mktemp -d)"
trap 'git worktree remove --force "$WT" >/dev/null 2>&1 || true' EXIT
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git fetch -q origin "$BRANCH"
  git worktree add -q "$WT" "origin/$BRANCH"
  git -C "$WT" switch -q -C "$BRANCH"
else
  git worktree add -q --detach "$WT"
  git -C "$WT" switch -q --orphan "$BRANCH"
  git -C "$WT" rm -rfq . >/dev/null 2>&1 || true
fi

mkdir -p "$WT/$DEST"
cp "${pngs[@]}" "$WT/$DEST/"
git -C "$WT" add "$DEST"
# Re-runs on the same commit may produce identical PNGs: only commit/push if something changed.
if ! git -C "$WT" diff --cached --quiet; then
  git -C "$WT" -c user.name="tasky-bot" -c user.email="tasky-bot@users.noreply.github.com" \
    commit -qm "screenshots for PR #${PR} @ ${SHA}"
  git -C "$WT" push -q origin "$BRANCH"
fi

# Build the comment: a table per page, desktop | mobile side by side.
# ?raw=true works for private repos when the viewer is signed in.
url() { echo "https://github.com/${REPO}/blob/${BRANCH}/${DEST}/$1?raw=true"; }
body="${MARKER}
### 📸 Screenshots @ \`${SHA}\`

| Page | Desktop | Mobile |
|---|---|---|"
for page in $(ls artifacts/screenshots/*.png | xargs -n1 basename | sed 's/--.*//' | sort -u); do
  d="${page}--desktop.png"; m="${page}--mobile.png"
  body+="
| \`${page}\` | <img src=\"$(url "$d")\" width=\"420\"> | <img src=\"$(url "$m")\" width=\"160\"> |"
done
body+="

<sub>Captured by \`npm run screenshots\` from screenshots.config.json</sub>"

# Upsert the sticky comment.
existing="$(gh api "repos/${REPO}/issues/${PR}/comments" --paginate \
  -q ".[] | select(.body | startswith(\"${MARKER}\")) | .id" | head -n1)"
if [[ -n "$existing" ]]; then
  gh api -X PATCH "repos/${REPO}/issues/comments/${existing}" -f body="$body" >/dev/null
else
  gh pr comment "$PR" --body "$body" >/dev/null
fi
echo "posted ${#pngs[@]} screenshots to PR #${PR}"
