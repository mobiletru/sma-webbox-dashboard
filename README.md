# SMA Webbox Dashboard

[![hacs_badge](https://img.shields.io/badge/HACS-Plugin-41BDF5.svg)](https://github.com/hacs/integration)
[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=mobiletru&repository=sma-webbox-dashboard&category=plugin)
[![Open Dashboard](https://my.home-assistant.io/badges/local_url.svg)](https://my.home-assistant.io/redirect/local/community/sma-webbox-dashboard/index.html)

A standalone web dashboard for monitoring and controlling **SMA Sunny Island SI6048UM** inverter data via Home Assistant WebBox MQTT sensors.

Live metrics include state of charge, DC voltage/current, battery temperature, grid power, plant power, energy today, and Enphase solar context — all updated in real time over the Home Assistant WebSocket API.

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

Edit `dist/js/config.js` (or `www/community/sma-webbox-dashboard/js/config.js` after install) to change entity IDs.

| Metric | Entity ID |
|--------|-----------|
| State of Charge | `sensor.sunny_island_si_soc_webbox` |
| Inverter Power | `sensor.sunny_island_si_power_webbox` |
| Plant Power | `sensor.sunny_island_webbox_plant_power` |
| DC Voltage | `sensor.sunny_island_si_dc_voltage_webbox` |
| DC Current | `sensor.sunny_island_si_dc_current_webbox` |
| Battery Temp | `sensor.sunny_island_si_battery_temp_webbox` |
| Grid Power | `sensor.sunny_island_si_grid_power_webbox` |
| Grid Feed-in | `sensor.sunny_island_si_grid_feed_in_webbox` |
| Energy Today | `sensor.sunny_island_webbox_energy_today` |
| Device Status | `sensor.sunny_island_webbox_device_status` |

## Parameter controls

Writable SI6048UM settings via WebBox `number` and `select` entities:

- Battery charge current limits, float voltage, protection SOC
- Grid feed-in current limits
- Power limits and charge power start
- Manual grid start (select)
- External current monitoring (read-only)

Each writable parameter has a slider, numeric input, and **Apply** button.

**Note:** Parameter entities require the WebBox integration to be active. If controls show "Unavailable", re-add the WebBox device integration.

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
# Deploy to local HA www folder
./scripts/deploy.sh

# Push to GitHub
./scripts/push.sh
```

## License

MIT — see [LICENSE](LICENSE)