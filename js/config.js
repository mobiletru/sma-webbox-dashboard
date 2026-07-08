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
  },
};