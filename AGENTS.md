# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **static HACS frontend plugin** (vanilla HTML/CSS/JS in `dist/`). There is no `package.json`, no build step, and no in-repo backend or database.

### Services

| Service | Required | Notes |
|---------|----------|-------|
| Static file server for `dist/` | Yes (local UI work) | e.g. `python3 -m http.server 8765 --bind 127.0.0.1` from `dist/` |
| Home Assistant (`https://home.mobileccs.com`) | Yes (live data) | Dashboard WebSocket uses **same-origin** `detectHAUrl()` → `wss://<host>/api/websocket`. Serving from localhost will not talk to HA unless you reverse-proxy `/api/websocket` or open the dashboard on HA itself. |
| Live panel path | Yes (E2E) | `https://home.mobileccs.com/local_webbox` (HA frontend panel; requires HA login). HACS static path `/local/community/sma-webbox-dashboard/index.html` may 404 if not installed that way. |

### Lint / test / build / run

- **Lint / test / build:** none defined in-repo. Optional smoke check: `node --check dist/js/*.js dist/sma-webbox-dashboard.js`.
- **Run (dev):** serve `dist/` with any static server (see above). First load shows the auth overlay until a HA long-lived access token is stored in `localStorage` key `sma_webbox_ha_token`.
- **Deploy into HA www:** `./scripts/deploy.sh` (default dest `/config/www/community/sma-webbox-dashboard`) — see README.
- **Config:** set `PACK_NAME` in `dist/js/config.js` to match the `tesla_evtv_bms` device slug.

### Gotchas

- Opening the local static server alone only proves UI load; core functionality (subscribe to BMS/WebBox entities) needs a valid HA long-lived token **and** same-origin (or proxied) WebSocket to that HA host.
- No npm/pip refresh is required between sessions; the update script is intentionally a no-op beyond verifying `dist/` is present.
