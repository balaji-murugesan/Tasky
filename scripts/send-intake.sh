#!/usr/bin/env bash
# Simulate a chat message / customer email arriving, by firing the intake workflow.
#   GH_REPO=owner/tasky bash scripts/send-intake.sh chat "Priya" "Can we sort tasks so open ones come first?"
#   GH_REPO=owner/tasky bash scripts/send-intake.sh email "customer@acme" "Your app lets me add a task with only spaces??"
# n8n / Zapier / Make send exactly this request (see docs/n8n-intake.md).
set -euo pipefail
source_="${1:?chat|email}"; author="${2:?author}"; text="${3:?message text}"
repo="${GH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

jq -n --arg s "$source_" --arg a "$author" --arg t "$text" \
  '{event_type:"intake", client_payload:{source:$s, author:$a, subject:"", text:$t, link:""}}' |
  gh api "repos/${repo}/dispatches" --input -
echo "intake sent → watch: gh run list -R ${repo} --workflow intake.yml"
