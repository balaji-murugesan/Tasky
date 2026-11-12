#!/usr/bin/env bash
# Print a markdown summary of the last 24 h of agent activity. Used by morning-digest.yml.
set -euo pipefail
since="$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)"

merged=$(gh pr list --state merged --search "merged:>=$since" --limit 100 \
  --json number,title,labels,author -q '.[] | "- #\(.number) \(.title) `\([.labels[].name | select(startswith("risk:"))] | join(","))`"')
waiting=$(gh pr list --state open --search "label:risk:medium,risk:high" --limit 50 \
  --json number,title,labels -q '.[] | "- #\(.number) \(.title) `\([.labels[].name | select(startswith("risk:"))] | join(","))`"')
blocked=$(gh pr list --state open --label needs-human --limit 50 --json number,title -q '.[] | "- #\(.number) \(.title)"')
newbugs=$(gh issue list --state open --label source:qa --search "created:>=$since" --limit 50 --json number,title -q '.[] | "- #\(.number) \(.title)"')
queue=$(gh issue list --state open --label agent:ready --json number -q 'length')

count() { [ -z "$1" ] && echo 0 || echo "$1" | wc -l | tr -d ' '; }

cat <<EOF
## 🌅 Overnight: $(count "$merged") merged · $(count "$waiting") awaiting review · $(count "$blocked") blocked

### ✅ Merged (last 24 h)
${merged:-_none_}

### 👀 Needs your review (medium/high risk)
${waiting:-_none_}

### 🛑 Agent blocked — question for a human
${blocked:-_none_}

### 🐞 New bugs from QA
${newbugs:-_none_}

_Queue for tonight: ${queue} issue(s) labelled agent:ready._
EOF
