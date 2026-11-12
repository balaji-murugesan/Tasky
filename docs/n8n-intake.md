# Wiring team chat and customer email into the loop with n8n

The repo only needs one thing from the outside world: a `repository_dispatch` call with event type `intake`. Everything after that (triage, dedupe, spec, build, PR) happens in GitHub.

## Credentials

Create a fine-grained GitHub token (or reuse the agent GitHub App) with **Contents: read & write** on this repo only (`repository_dispatch` requires contents write). Store it in n8n as a *Header Auth* credential: `Authorization: Bearer <token>`.

## Workflow A: Slack / Teams / Google Chat → intake

1. **Trigger**: Slack Trigger node, event *Reaction added*, filter reaction = `:robot_face:` (people opt a message in by reacting; the bot never reads everything).
2. **Slack → Get message** (channel + ts from the trigger) to fetch the full text and permalink.
3. **HTTP Request**
   - Method `POST`, URL `https://api.github.com/repos/<owner>/<repo>/dispatches`
   - Headers: `Accept: application/vnd.github+json`, auth credential above
   - JSON body:
     ```json
     {
       "event_type": "intake",
       "client_payload": {
         "source": "chat",
         "author": "{{ $json.user_name }}",
         "subject": "#{{ $json.channel_name }}",
         "text": "{{ $json.text }}",
         "link": "{{ $json.permalink }}"
       }
     }
     ```
4. **Slack → Reply in thread**: "Got it, triaging → GitHub" (optional).

## Workflow B: support inbox → intake

1. **Trigger**: IMAP Email (or Gmail Trigger) on a dedicated label/folder such as `feature-requests`, so only mail support has routed is processed.
2. **Code node**: strip quoted replies and signatures; keep only the sender's first name (no email address goes to GitHub).
3. **HTTP Request**: same as above with `"source": "email"` and `"subject": "{{ $json.subject }}"`.

## Closing the loop back to the requester (optional)

Add a third n8n workflow on a **GitHub Trigger** (*pull_request closed* with merged = true) that looks for `via chat`/`via email` + link in the linked issue and posts "Shipped in #123" back to the Slack thread.

## Test without n8n

```bash
GH_REPO=<owner>/<repo> bash scripts/send-intake.sh chat "Priya" "Can open tasks be listed before done ones?"
```
