/**
 * SimpleSensorApiWrapper — Promise-based wrapper for widgetbuilder.sensorsdataprovider.
 *
 * Usage:
 *   const sensorApi = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider, 5000);
 *   const value = await sensorApi.getSensorValue(sensorId);
 */
class SimpleSensorApiWrapper extends IcueWidgetApiWrapper {
  constructor(plugin, timeoutMs = 5000) {
    super(plugin, timeoutMs);
  }

  /** @returns {Promise<string>} current sensor value string */
  getSensorValue(sensorId)      { return this._request('getSensorValue',    sensorId); }

  /** @returns {Promise<string>} unit label, e.g. "°C", "%" */
  getSensorUnits(sensorId)      { return this._request('getSensorUnits',    sensorId); }

  /** @returns {Promise<string>} human-readable sensor name */
  getSensorName(sensorId)       { return this._request('getSensorName',     sensorId); }

  /** @returns {Promise<string>} name of the device that owns this sensor */
  getSensorDeviceName(sensorId) { return this._request('getSensorDeviceName', sensorId); }

  /** @returns {Promise<string>} sensor type string, e.g. "load", "temperature" */
  getSensorType(sensorId)       { return this._request('getSensorType',     sensorId); }

  /** @returns {Promise<string>} sensor kind, e.g. "gpu-load", "cpu-temp" */
  getSensorKind(sensorId)       { return this._request('getSensorKind',     sensorId); }

  /** @returns {Promise<string[]>} all available sensor IDs on this system */
  getAllSensorIds()              { return this._request('getAllSensorIds'); }

  /** @returns {Promise<boolean>} true if the sensor is currently connected */
  sensorIsConnected(sensorId)   { return this._request('sensorIsConnected', sensorId); }
}
