/**
 * SMA Webbox Dashboard — canonical entity registry
 *
 * Backed by the `tesla_evtv_bms` HA integration (EVTV CAN-DUE v2 BMS +
 * optional SMA Sunny WebBox polling). Set PACK_NAME to your pack's device
 * name from that integration's setup, lowercased with spaces -> underscores
 * (e.g. pack name "Pack1" -> PACK_NAME = 'pack1'). It must match the
 * entity_id prefix Home Assistant generated for your config entry.
 */
const PACK_NAME = 'evtv_name';

const BAD_STATES = new Set(['unknown', 'unavailable', 'none', '']);

const DASHBOARD_CONFIG = {
  title: 'SMA Webbox Dashboard',
  subtitle: 'EVTV Tesla BMS · Sunny WebBox',

  metricGroups: [
    { title: 'Battery', keys: ['siPower', 'dcVoltage', 'dcCurrent', 'batteryTemp'] },
    { title: 'Solar (WebBox)', keys: ['plantPower', 'energyToday', 'totalYield'] },
    { title: 'Solar (Envoy)', keys: ['solarProduction', 'solarProductionToday', 'consumption', 'consumptionToday', 'netConsumption'] },
  ],

  // No writable parameter controls: those required the WebBox's RPC interface
  // (GetParameterChannels/GetParameter against a specific Sunny Island device
  // key), which is disabled by default and unconfirmed on this hardware. Wire
  // this back up once RPC is enabled on the box and tesla_evtv_bms exposes
  // number/select entities for it — see webbox.py's RPC notes.
  parameters: [],
};

const METRICS = {
  soc: { entity: `sensor.${PACK_NAME}_state_of_charge`, label: 'State of Charge', format: 'percent' },
  siPower: { entity: `sensor.${PACK_NAME}_power`, label: 'Pack Power', format: 'power', flow: true },
  plantPower: { entity: `sensor.${PACK_NAME}_webbox_power`, label: 'Solar Power', format: 'power', flow: true },
  dcVoltage: { entity: `sensor.${PACK_NAME}_volts`, label: 'Pack Voltage', format: 'number' },
  dcCurrent: { entity: `sensor.${PACK_NAME}_current`, label: 'Pack Current', format: 'number' },
  batteryTemp: { entity: `sensor.${PACK_NAME}_highest_temp`, label: 'Battery Temp (High)', format: 'number' },
  energyToday: { entity: `sensor.${PACK_NAME}_webbox_daily_yield`, label: 'Solar Today', format: 'energy' },
  totalYield: { entity: `sensor.${PACK_NAME}_webbox_total_yield`, label: 'Solar Lifetime', format: 'energy' },
  solarProduction: { entity: 'sensor.envoy_122039004946_current_power_production', label: 'Solar Production', format: 'power', flow: true, forceKw: true },
  solarProductionToday: { entity: 'sensor.envoy_122039004946_energy_production_today', label: 'Solar Today', format: 'energy' },
  consumption: { entity: 'sensor.envoy_122039004946_current_power_consumption', label: 'Consumption', format: 'power', flow: true, forceKw: true },
  consumptionToday: { entity: 'sensor.envoy_122039004946_energy_consumption_today', label: 'Consumed Today', format: 'energy' },
  netConsumption: { entity: 'sensor.envoy_122039004946_current_net_power_consumption', label: 'Net Consumption', format: 'power', flow: true, forceKw: true },
};

const ENTITY_INDEX = (() => {
  const byEntity = new Map();
  const flowKeys = new Set();

  for (const [key, meta] of Object.entries(METRICS)) {
    byEntity.set(meta.entity, { key, ...meta, kind: 'metric' });
    if (meta.flow) flowKeys.add(key);
  }

  for (const group of DASHBOARD_CONFIG.parameters) {
    for (const item of group.items) {
      byEntity.set(item.entity, { ...item, kind: item.type === 'readonly' ? 'readonly' : 'control' });
    }
  }

  return { byEntity, flowKeys };
})();

function getAllEntityIds() {
  return [...ENTITY_INDEX.byEntity.keys()];
}

function getMetricLabel(key) {
  return METRICS[key]?.label || key;
}
