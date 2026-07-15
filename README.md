# SMA Webbox Dashboard

[![hacs_badge](https://img.shields.io/badge/HACS-Plugin-41BDF5.svg)](https://github.com/hacs/integration)
[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=mobiletru&repository=sma-webbox-dashboard&category=plugin)
[![Open Dashboard](https://my.home-assistant.io/badges/local_url.svg)](https://my.home-assistant.io/redirect/local/community/sma-webbox-dashboard/index.html)

A standalone web dashboard for monitoring **EVTV Tesla BMS + SMA Sunny WebBox** data from the [`tesla_evtv_bms`](https://github.com/mobiletru/tesla_evtv_bms) Home Assistant integration.

Live metrics include pack state of charge, voltage, current, temperature, WebBox solar power/yield, and Enphase solar context (if configured separately) — all updated in real time over the Home Assistant WebSocket API.

**Configure first:** edit `PACK_NAME` at the top of `dist/js/config.js` (or `js/config.js` after install) to match your `tesla_evtv_bms` pack's device slug — see that repo's README for the exact value.

## Install with HACS

1. [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=mobiletru&repository=sma-webbox-dashboard&category=plugin)
2. Or manually: **HACS → Frontend** → ⋮ → **Custom repositories** → add `https://github.com/mobiletru/sma-webbox-dashboard` as type **Dashboard**
3. **HACS → Frontend** → search **SMA Webbox Dashboard** → **Download**
4. Open the dashboard: [![Open SMA Webbox Dashboard](https://my.home-assistant.io/badges/local_url.svg)](https://my.home-assistant.io/redirect/local/community/sma-webbox-dashboard/index.html)

   Or navigate to:

   ```
   http://<your-ha-host>:8123/local/community/sma-webbox-dashboard/index.html
   ```

5. On first visit, paste a **long-lived access token** from **Profile → Security → Long-Lived Access Tokens**

## Manual install

```bash
git clone https://github.com/mobiletru/sma-webbox-dashboard.git
cp -r sma-webbox-dashboard/dist /config/www/community/sma-webbox-dashboard
```

Or use the deploy script on Home Assistant:

```bash
./scripts/deploy.sh
```

## Lovelace shortcut (optional)

HACS registers a small Lovelace module. Add a **Manual** card with:

```yaml
type: custom:sma-webbox-dashboard-link
```

This renders a link to the full dashboard.

## Configuration

Edit `dist/js/config.js` (or `www/community/sma-webbox-dashboard/js/config.js` after install): set `PACK_NAME` once at the top, entity IDs are built from it.

| Metric | Entity ID | Source |
|--------|-----------|--------|
| State of Charge | `sensor.<pack>_state_of_charge` | tesla_evtv_bms (CAN 0x650) |
| Pack Power | `sensor.<pack>_power` | tesla_evtv_bms (CAN 0x150/0x151) |
| Pack Voltage | `sensor.<pack>_volts` | tesla_evtv_bms |
| Pack Current | `sensor.<pack>_current` | tesla_evtv_bms |
| Battery Temp (High) | `sensor.<pack>_highest_temp` | tesla_evtv_bms |
| Solar Power | `sensor.<pack>_webbox_power` | tesla_evtv_bms (WebBox `home.ajax`) |
| Solar Today | `sensor.<pack>_webbox_daily_yield` | tesla_evtv_bms (WebBox) |
| Solar Lifetime | `sensor.<pack>_webbox_total_yield` | tesla_evtv_bms (WebBox) |
| Solar Production (Envoy) | `sensor.envoy_..._current_power_production` | separate Enphase Envoy integration, if installed |

Grid power/feed-in, plant/device status, and a separate "battery charge" figure
were dropped from this dashboard — the WebBox only exposes power + daily/total
yield over `home.ajax` (its unauthenticated interface); nothing on this hardware
currently supplies those other fields (see below).

## Parameter controls

Not currently wired up. Writable Sunny Island settings (charge current limits,
float voltage, feed-in limits, etc.) require the WebBox's RPC interface
(`GetParameterChannels`/`GetParameter` against a specific device key), which is
**disabled by default** in the WebBox's security settings and unconfirmed on
this hardware — `tesla_evtv_bms`'s `webbox.py` attempts RPC best-effort for
extra read-only fields but doesn't fabricate write controls it can't verify
work. Enable RPC on the WebBox, extend `tesla_evtv_bms` with the matching
`number`/`select` entities, then repopulate `DASHBOARD_CONFIG.parameters` in
`config.js`.

## Features

- Real-time WebSocket updates (no polling)
- Writable SI6048 parameter controls with apply confirmation
- SOC gauge with charge-level coloring
- Animated energy flow diagram (solar · battery · grid · home)
- Plant power sparkline trend
- Grouped metric cards for battery, grid, plant, and solar
- Mobile-responsive layout
- Dark theme with SMA orange branding

## Links

| Link | URL |
|------|-----|
| GitHub repository | https://github.com/mobiletru/sma-webbox-dashboard |
| Open in HACS | https://my.home-assistant.io/redirect/hacs_repository/?owner=mobiletru&repository=sma-webbox-dashboard&category=plugin |
| Open dashboard | https://my.home-assistant.io/redirect/local/community/sma-webbox-dashboard/index.html |
| Report issues | https://github.com/mobiletru/sma-webbox-dashboard/issues |
| HACS documentation | https://www.hacs.xyz/docs/publish/plugin/ |

## Development

Pure static HTML/CSS/JS in `dist/` — no build step required.

```bash
# Edit dashboard files in dist/, then deploy to local HA www folder
./scripts/deploy.sh

# Push to GitHub
./scripts/push.sh
```

## License

MIT — see [LICENSE](LICENSE)