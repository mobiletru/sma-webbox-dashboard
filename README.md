# SMA Webbox Dashboard

A standalone web dashboard for monitoring **SMA Sunny Island SI6048UM** inverter data streamed via Home Assistant WebBox MQTT sensors.

Live metrics include state of charge, DC voltage/current, battery temperature, grid power, plant power, energy today, and Enphase solar context — all updated in real time over the Home Assistant WebSocket API.

## Quick start

### 1. Deploy to Home Assistant

Copy the dashboard into your HA `www` folder:

```bash
cp -r sma-webbox-dashboard /config/www/
```

Or use the included script:

```bash
./scripts/deploy.sh
```

### 2. Open the dashboard

Navigate to:

```
http://<your-ha-host>:8123/local/sma-webbox-dashboard/index.html
```

### 3. Authenticate

On first visit, paste a **long-lived access token** from Home Assistant:

**Profile → Security → Long-Lived Access Tokens → Create Token**

The token is stored in your browser's `localStorage` and reused on subsequent visits.

## Configuration

Edit `js/config.js` to change entity IDs if your Home Assistant naming differs.

Default entities:

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

The **Parameter Controls** section lets you read and write Sunny Island SI6048UM settings through Home Assistant WebBox `number` and `select` entities:

- Battery charge current limits, float voltage, protection SOC
- Grid feed-in current limits
- Power limits and charge power start
- Manual grid start (select)
- External current monitoring (read-only)

Each writable parameter has a slider, numeric input, and **Apply** button. Changes are sent via `number.set_value` or `select.select_option` services.

Edit `parameters` in `js/config.js` to add or remove controls. Entity IDs follow the WebBox integration naming:

```
number.si6048um_1260044036_si6048um_1260044036_<param>
```

**Note:** Parameter entities require the WebBox integration to be active in Home Assistant. If controls show "Unavailable", re-add the WebBox device integration.

## Features

- Real-time WebSocket updates (no polling)
- Writable SI6048 parameter controls with apply confirmation
- SOC gauge with charge-level coloring
- Animated energy flow diagram (solar · battery · grid · home)
- Plant power sparkline trend
- Grouped metric cards for battery, grid, plant, and solar
- Mobile-responsive layout
- Dark theme with SMA orange branding

## Development

Pure static HTML/CSS/JS — no build step required. Edit files and refresh the browser.

Serve locally for testing (must still connect to a running Home Assistant instance):

```bash
cd sma-webbox-dashboard
python3 -m http.server 8080
```

## License

MIT