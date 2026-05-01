# Sensors Data Provider

Sensor data transfer between iCUE and HTML widgets: sensor types, units, values, device names, and more.

## Overview

-   **Module name**: `widgetbuilder.sensorsdataprovider`
-   **Plugin name**: `Sensors`
-   **Version**: `1.0`

Manifest entry:

```json
"required_plugins": [
  "widgetbuilder.sensorsdataprovider:Sensors:1.0"
]
```

All data retrieval methods are asynchronous using `requestId` for correlation.

## Async Request Pattern

1. Call a method with unique `requestId`
2. Listen for `asyncResponse(requestId, value)` signal
3. Match response `requestId` to request

```javascript
let nextRequestId = 0;
const requestId = nextRequestId++;
window.plugins.Sensorsdataprovider.asyncResponse.connect((id, value) => {
    if (id === requestId) {
        console.log("Sensor value:", value);
    }
});
window.plugins.Sensorsdataprovider.getSensorValue(requestId, sensorId);
```

## Methods

### `getSensorValue(requestId, sensorId)`

Gets current sensor value.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `string`

---

### `getSensorUnits(requestId, sensorId)`

Gets units of measurement.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `string` (e.g., "C", "%", "RPM")

---

### `getSensorName(requestId, sensorId)`

Gets sensor display name.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `string`

---

### `getSensorDeviceName(requestId, sensorId)`

Gets device name containing the sensor.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `string`

---

### `getSensorType(requestId, sensorId)`

Gets sensor type.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `string` - See [sensor types](#sensor-types)

---

### `getSensorKind(requestId, sensorId)`

Gets sensor kind/category.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `string` - See [sensor kind](#sensor-kind)

---

### `getAllSensorIds(requestId)`

Gets all available sensor identifiers.

| Parameter   | Type  | Description |
| ----------- | ----- | ----------- |
| `requestId` | `int` | Request ID  |

**Response**: `string[]`

---

### `sensorIsConnected(requestId, sensorId)`

Checks sensor availability.

| Parameter   | Type     | Description       |
| ----------- | -------- | ----------------- |
| `requestId` | `int`    | Request ID        |
| `sensorId`  | `string` | Sensor identifier |

**Response**: `bool`

---

### `getDefaultSensorId(requestId, sensorType)`

Gets default sensor ID for a type.

| Parameter    | Type     | Description                                     |
| ------------ | -------- | ----------------------------------------------- |
| `requestId`  | `int`    | Request ID                                      |
| `sensorType` | `string` | Sensor type (see [sensor types](#sensor-types)) |

**Response**: `string` - Default sensor ID (may vary between systems and iCUE versions)

---

### `getDefaultSensorIdBlock(sensorType)`

Synchronously gets default sensor ID. **Blocking call.**

| Parameter    | Type     | Description                                     |
| ------------ | -------- | ----------------------------------------------- |
| `sensorType` | `string` | Sensor type (see [sensor types](#sensor-types)) |

**Returns**: `string` - Default sensor ID (may vary between systems and iCUE versions)

## Signals

### `asyncResponse(requestId, value)`

Emitted when async method completes.

| Parameter   | Type  | Description         |
| ----------- | ----- | ------------------- |
| `requestId` | `int` | Original request ID |
| `value`     | `var` | Response value      |

---

### `sensorAdded(sensorId)`

Emitted when new sensor becomes available.

| Parameter  | Type     | Description     |
| ---------- | -------- | --------------- |
| `sensorId` | `string` | Added sensor ID |

---

### `sensorRemoved(sensorId)`

Emitted when sensor is no longer available.

| Parameter  | Type     | Description       |
| ---------- | -------- | ----------------- |
| `sensorId` | `string` | Removed sensor ID |

---

### `sensorDataChanged(sensorId)`

Emitted when sensor data changes.

| Parameter  | Type     | Description       |
| ---------- | -------- | ----------------- |
| `sensorId` | `string` | Changed sensor ID |

---

### `sensorValueChanged(sensorId, value)`

Emitted when sensor value changes.

| Parameter  | Type     | Description      |
| ---------- | -------- | ---------------- |
| `sensorId` | `string` | Sensor ID        |
| `value`    | `string` | New sensor value |

---

### `sensorUnitsChanged(sensorId, units)`

Emitted when sensor units change (e.g., Celsius to Fahrenheit).

| Parameter  | Type     | Description |
| ---------- | -------- | ----------- |
| `sensorId` | `string` | Sensor ID   |
| `units`    | `string` | New units   |

## SimpleSensorApiWrapper

Promise-based wrapper for the Sensors plugin.

**Location**: `<<iCUE install dir>>/widgets/common/plugins/SimpleSensorApiWrapper.js`

### Initialization

```javascript
const api = new SimpleSensorApiWrapper(sensorsplugin);
```

| Parameter      | Type     | Default | Description     |
| -------------- | -------- | ------- | --------------- |
| `sensorPlugin` | `object` | -       | Plugin instance |
| `timeoutMs`    | `number` | `5000`  | Timeout (ms)    |

### Methods

All methods return a `Promise`.

-   `getSensorValue(sensorId)` - Returns sensor value
-   `getSensorUnits(sensorId)` - Returns measurement units
-   `getSensorName(sensorId)` - Returns sensor name
-   `getSensorDeviceName(sensorId)` - Returns device name
-   `getSensorType(sensorId)` - Returns sensor type
-   `getSensorKind(sensorId)` - Returns sensor kind
-   `getAllSensorIds()` - Returns all sensor IDs
-   `sensorIsConnected(sensorId)` - Returns connection status

### Example

`manifest.json`

```json
"required_plugins": [
  "widgetbuilder.sensorsdataprovider:Sensors:1.0"
]
```

`index.html`

```javascript
// <script src="common/plugins/IcueWidgetApiWrapper.js"></script>
// <script src="common/plugins/SimpleSensorApiWrapper.js"></script>
const sensorApi = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider);

async function displayAllSensors() {
    const sensorIds = await sensorApi.getAllSensorIds();
    for (const sensorId of sensorIds) {
        const [name, value, units] = await Promise.all([
            sensorApi.getSensorName(sensorId),
            sensorApi.getSensorValue(sensorId),
            sensorApi.getSensorUnits(sensorId),
        ]);
        console.log(`${name}: ${value} ${units}`);
    }
}
displayAllSensors();
```

`IcueWidgetApiWrapper` and `SimpleSensorApiWrapper` are available in the `common` folder of the iCUE installation directory.

## Appendixes

### Sensor Types

| Value            | Description            |
| ---------------- | ---------------------- |
| temperature      | Temperature            |
| pump             | Pump speed             |
| fan              | Fan speed              |
| voltage          | Voltage                |
| load             | Load/usage             |
| led              | LED (deprecated)       |
| cas-latency      | CAS latency (RAM)      |
| command-rate     | Command rate (RAM)     |
| cycle-time       | Cycle time (RAM)       |
| dram-frequency   | DRAM frequency         |
| ras-precharge    | RAS precharge (RAM)    |
| ras-to-cas-delay | RAS to CAS delay (RAM) |
| current          | Current                |
| power            | Power                  |
| battery-charge   | Battery charge level   |
| battery-status   | Battery status         |
| efficiency       | Efficiency             |
| fps              | Frames per second      |
| pin-protect      | Pin protection         |

### Sensor Kind

| Value                | Description             |
| -------------------- | ----------------------- |
| default              | Default                 |
| core                 | Processor core          |
| package              | CPU package             |
| power-in             | Input power             |
| power-out            | Output power            |
| power-3-3            | 3.3V power              |
| power-5              | 5V power                |
| power-12             | 12V power               |
| total-power-draw     | Total power consumption |
| voltage-bat          | Battery voltage         |
| voltage-core         | Core voltage            |
| voltage-in           | Input voltage           |
| voltage-3-3          | 3.3V voltage            |
| voltage-5            | 5V voltage              |
| voltage-12           | 12V voltage             |
| voltage-vdd          | VDD voltage (RAM)       |
| voltage-vddq         | VDDQ voltage (RAM)      |
| voltage-vpp          | VPP voltage (RAM)       |
| current-3-3          | 3.3V current            |
| current-5            | 5V current              |
| current-item-12v     | 12V item current        |
| current-item-12v-2x6 | 12V 2x6 current         |
| current-12v          | 12V current             |
| current-item-atx     | ATX current             |
| current-item-sata    | SATA current            |
| cpu-temp             | CPU temperature         |
| gpu-temp             | GPU temperature         |
| cpu-pump             | CPU pump                |
| gpu-pump             | GPU pump                |
| gpu-load             | GPU load                |
| pin-protect-status   | Pin protection status   |
| pin-protect-current  | Pin protection current  |
| pin-protect          | Pin protection          |
| memory-load          | Memory load             |
| frame-buffer-load    | Frame buffer load       |
| video-engine-load    | Video engine load       |
| bus-interface-load   | Bus interface load      |
| invalid              | Invalid kind            |
