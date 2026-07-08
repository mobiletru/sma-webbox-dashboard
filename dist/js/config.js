/**
 * SMA Webbox Dashboard — canonical entity registry
 */
const BAD_STATES = new Set(['unknown', 'unavailable', 'none', '']);

const DASHBOARD_CONFIG = {
  title: 'SMA Webbox Dashboard',
  subtitle: 'Sunny Island SI6048UM · WebBox MQTT',

  metricGroups: [
    { title: 'Battery', keys: ['siPower', 'batteryCharge', 'dcVoltage', 'dcCurrent', 'batteryTemp'] },
    { title: 'Grid', keys: ['gridPower', 'gridFeedIn'] },
    { title: 'Plant', keys: ['plantPower', 'energyToday', 'plantStatus'] },
    { title: 'Solar (Envoy)', keys: ['solarProduction', 'solarProductionToday', 'consumption', 'consumptionToday', 'netConsumption'] },
  ],

  parameters: [
    {
      title: 'Battery Charging',
      items: [
        { key: 'batChrgCurMax', entity: 'number.si6048um_1260044036_si6048um_1260044036_batchrgcurmax', label: 'Charge Current Max', type: 'number' },
        { key: 'invChrgCurMax', entity: 'number.si6048um_1260044036_si6048um_1260044036_invchrgcurmax', label: 'Inverter Charge Current Max', type: 'number' },
        { key: 'chrgVtgFlo', entity: 'number.si6048um_1260044036_si6048um_1260044036_chrgvtgflo', label: 'Float Charge Voltage', type: 'number' },
        { key: 'aptTmFul', entity: 'number.si6048um_1260044036_si6048um_1260044036_apttmful', label: 'Absorption Time Full', type: 'number' },
        { key: 'batPro1Soc', entity: 'number.si6048um_1260044036_si6048um_1260044036_batpro1soc', label: 'Battery Protection SOC 1', type: 'number' },
        { key: 'slfCsmpSocMin', entity: 'number.si6048um_1260044036_si6048um_1260044036_slfcsmpsocmin', label: 'Self-Consumption SOC Min', type: 'number' },
      ],
    },
    {
      title: 'Grid & Feed-in',
      items: [
        { key: 'fedInCurAt', entity: 'number.si6048um_1260044036_si6048um_1260044036_fedincurat', label: 'Feed-in Current (Absolute)', type: 'number' },
        { key: 'fedInCurRt', entity: 'number.si6048um_1260044036_si6048um_1260044036_fedincurrt', label: 'Feed-in Current (Relative)', type: 'number' },
        { key: 'gdCurNom', entity: 'number.si6048um_1260044036_si6048um_1260044036_gdcurnom', label: 'Grid Current Nominal', type: 'number' },
        { key: 'gdManStr', entity: 'select.si6048um_1260044036_si6048um_1260044036_manual_grid_start', label: 'Manual Grid Start', type: 'select' },
      ],
    },
    {
      title: 'Power Limits',
      items: [
        { key: 'pLimit', entity: 'number.si6048um_1260044036_si6048um_1260044036_plimit', label: 'Power Limit', type: 'number' },
        { key: 'chpPwrStr', entity: 'number.si6048um_1260044036_si6048um_1260044036_chppwrstr', label: 'Charge Power Start', type: 'number' },
      ],
    },
    {
      title: 'Monitoring',
      readOnly: true,
      items: [
        { key: 'extCur', entity: 'sensor.si6048um_1260044036_si6048um_1260044036_ext_cur', label: 'External Current', type: 'readonly' },
        { key: 'totExtCur', entity: 'sensor.si6048um_1260044036_si6048um_1260044036_tot_ext_cur', label: 'Total External Current', type: 'readonly' },
      ],
    },
  ],
};

const METRICS = {
  soc: { entity: 'sensor.sunny_island_si_soc_webbox', label: 'State of Charge', format: 'percent' },
  siPower: { entity: 'sensor.sunny_island_si_power_webbox', label: 'Inverter Power', format: 'power', flow: true },
  plantPower: { entity: 'sensor.sunny_island_webbox_plant_power', label: 'Plant Power', format: 'power', flow: true },
  batteryCharge: { entity: 'sensor.sunny_island_si_battery_charge_webbox', label: 'Battery Charge', format: 'power', flow: true },
  dcVoltage: { entity: 'sensor.sunny_island_si_dc_voltage_webbox', label: 'DC Voltage', format: 'number' },
  dcCurrent: { entity: 'sensor.sunny_island_si_dc_current_webbox', label: 'DC Current', format: 'number' },
  batteryTemp: { entity: 'sensor.sunny_island_si_battery_temp_webbox', label: 'Battery Temp', format: 'number' },
  gridPower: { entity: 'sensor.sunny_island_si_grid_power_webbox', label: 'Grid Power', format: 'power', flow: true },
  gridFeedIn: { entity: 'sensor.sunny_island_si_grid_feed_in_webbox', label: 'Grid Feed-in', format: 'power', flow: true },
  energyToday: { entity: 'sensor.sunny_island_webbox_energy_today', label: 'Energy Today', format: 'energy' },
  deviceStatus: { entity: 'sensor.sunny_island_webbox_device_status', label: 'Device Status', format: 'text', status: true },
  plantStatus: { entity: 'sensor.sunny_island_webbox_plant_status', label: 'Plant Status', format: 'text', status: true },
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