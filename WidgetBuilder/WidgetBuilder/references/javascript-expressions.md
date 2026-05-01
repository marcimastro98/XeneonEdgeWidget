# JavaScript Expressions in Meta Parameters

ECMAScript expressions in meta parameters enable dynamic, context-aware widget configurations evaluated at runtime.

## What They Enable

- Generate dynamic option lists based on system capabilities
- Calculate default values from current system state
- Create conditional parameter configurations
- Provide localized content and labels
- Integrate with external data sources and APIs

## Basic Syntax

ECMAScript expressions are supported in any `data-*` attribute except `data-type`:

```html
<!-- Static value -->
<meta name="x-icue-property" content="brightness" data-label="tr('Brightness')" data-type="slider" data-default="50" data-min="0" data-max="100" data-step="1">

<!-- Dynamic expression -->
<meta name="x-icue-property" content="brightness" data-label="tr('Brightness')" data-type="slider" data-default="SystemUtils.getSystemVolume()" data-min="0" data-max="100" data-step="1">
```

---

## Module Integration

### Declaring Modules

Declare JavaScript modules in `manifest.json` under the `modules` key:

```json
{
  "modules": [
    "modules/SystemUtils.mjs",
    "modules/DeviceCapabilities.js"
  ]
}
```

### Module File Structure

**File: `modules/SystemUtils.mjs`**

```javascript
// Export functions for use in meta parameter expressions
export function getCurrentTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getAvailableTimezones() {
    return ['America/New_York', 'Europe/London', 'Europe/Kyiv', 'Asia/Tokyo', 'Australia/Sydney'];
}

export function getSystemVolume() {
    return 75; // Default fallback
}

export function isLowLightMode() {
    const hour = new Date().getHours();
    return hour < 7 || hour > 20;
}
```

### Using Module Functions

Once declared, exported functions are available via the module's filename (without extension):

`manifest.json`:
```json
{
  "modules": ["modules/SystemUtils.mjs"]
}
```

`index.html`:
```html
<meta name="x-icue-property" content="timezone"
      data-label="tr('Time Zone')"
      data-type="combobox"
      data-values="SystemUtils.getAvailableTimezones()"
      data-default="SystemUtils.getCurrentTimezone()">

<meta name="x-icue-property" content="nightMode"
      data-label="tr('Night Mode')"
      data-type="switch"
      data-default="SystemUtils.isLowLightMode()">
```

### Module Requirements

- **File extensions:** `.mjs` or `.js`
- **Export format:** ES6 module exports (`export function name() {}`)
- **Location:** Relative paths from the widget's `index.html`
- **Multiple modules:** Declare multiple entries in the `modules` array

---

## Plugin Functions

Plugin functions are available in expressions. Only **blocking (synchronous)** functions are supported — asynchronous functions cannot be used in meta parameter expressions.

Example using the Sensors Data Provider plugin:

`manifest.json`:
```json
{
  "required_plugins": [
    "widgetbuilder.sensorsdataprovider:Sensors:1.0"
  ]
}
```

`index.html`:
```html
<meta name="x-icue-property"
      content="selectedSensorId"
      data-label="tr('Sensor')"
      data-type="sensors-combobox"
      data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')">
```

`getDefaultSensorIdBlock()` is the synchronous (blocking) variant — it is safe to use in meta parameter expressions. The async `getDefaultSensorId(requestId, sensorType)` variant cannot be used here.
