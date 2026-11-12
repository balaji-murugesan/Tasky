---
name: run-app
description: Start, health-check, debug and stop the Tasky app (Express API + Vite web). Use before any manual check, e2e run, screenshot or QA session, and whenever the app seems down or a port is busy.
---

# Run the app

The app is two processes started together by `npm run dev`: the API on `API_PORT` (3001) and the Vite web server on `WEB_PORT` (5173), which proxies `/api` to the API. `scripts/run-app.sh` wraps this so it is background, idempotent and health-checked.

## Start

```bash
npm run app:up
```

Success prints `app up → http://localhost:5173`. It waits up to 60 s for `GET /api/health` **through the web port**, so a green result proves both processes and the proxy work.

## Verify it is really working

```bash
curl -s localhost:5173/api/health          # {"ok":true}
curl -s localhost:5173/api/tasks           # JSON array
curl -s -X POST localhost:5173/api/__reset # 204, clears data (non-production only)
```

## When it fails

1. `bash scripts/run-app.sh logs 80` — read the error, don't guess.
2. Port busy (`EADDRINUSE` / `strictPort`): `npm run app:down`, then `up` again.
3. TypeScript/import error in the API: fix the code; `tsx watch` reloads automatically.
4. Still failing after two attempts: stop, report the log excerpt, do not loop.

## Stop

```bash
npm run app:down
```

Always stop the app at the end of a session you started it in, unless another skill in the same session still needs it.

## Rules

- Never change ports or the proxy to "make it work"; those are medium-risk config files.
- Data is in-memory. Use `/api/__reset` for a clean state instead of restarting.
