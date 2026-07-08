/**
 * SMA Webbox Dashboard — entity map for Sunny Island SI6048 + site solar
 * Edit entity IDs here if your Home Assistant names differ.
 */
const DASHBOARD_CONFIG = {
  title: 'SMA Webbox Dashboard',
  subtitle: 'Sunny Island SI6048UM · WebBox MQTT',
  refreshIntervalMs: 5000,

  entities: {
    // Sunny Island / WebBox (primary)
    soc: 'sensor.sunny_island_si_soc_webbox',
    siPower: 'sensor.sunny_island_si_power_webbox',
    plantPower: 'sensor.sunny_island_webbox_plant_power',
    batteryCharge: 'sensor.sunny_island_si_battery_charge_webbox',
    dcVoltage: 'sensor.sunny_island_si_dc_voltage_webbox',
    dcCurrent: 'sensor.sunny_island_si_dc_current_webbox',
    batteryTemp: 'sensor.sunny_island_si_battery_temp_webbox',
    gridPower: 'sensor.sunny_island_si_grid_power_webbox',
    gridFeedIn: 'sensor.sunny_island_si_grid_feed_in_webbox',
    energyToday: 'sensor.sunny_island_webbox_energy_today',
    deviceStatus: 'sensor.sunny_island_webbox_device_status',
    plantStatus: 'sensor.sunny_island_webbox_plant_status',

    // Enphase Envoy (site context)
    solarProduction: 'sensor.envoy_122039004946_current_power_production',
    solarProductionToday: 'sensor.envoy_122039004946_energy_production_today',
    consumption: 'sensor.envoy_122039004946_current_power_consumption',
    consumptionToday: 'sensor.envoy_122039004946_energy_consumption_today',
    netConsumption: 'sensor.envoy_122039004946_current_net_power_consumption',
  },

  labels: {
    soc: 'State of Charge',
    siPower: 'Inverter Power',
    plantPower: 'Plant Power',
    batteryCharge: 'Battery Charge',
    dcVoltage: 'DC Voltage',
    dcCurrent: 'DC Current',
    batteryTemp: 'Battery Temp',
    gridPower: 'Grid Power',
    gridFeedIn: 'Grid Feed-in',
    energyToday: 'Energy Today',
    deviceStatus: 'Device Status',
    plantStatus: 'Plant Status',
    solarProduction: 'Solar Production',
    solarProductionToday: 'Solar Today',
    consumption: 'Consumption',
    consumptionToday: 'Consumed Today',
    netConsumption: 'Net Consumption',
    extCur: 'External Current',
    totExtCur: 'Total External Current',
  },

  // Writable SI6048UM parameters (WebBox integration number/select entities)
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

function getAllEntityIds() {
  const ids = new Set(Object.values(DASHBOARD_CONFIG.entities));
  for (const group of DASHBOARD_CONFIG.parameters || []) {
    for (const item of group.items) ids.add(item.entity);
  }
  return [...ids];
}