# JavaScript Expressions

ECMAScript expressions in meta parameters enable dynamic, context-aware iCUE widget configurations evaluated at runtime.

## Overview

JavaScript expressions enable widgets to:

- Generate dynamic option lists based on system capabilities
- Calculate default values from current system state
- Create conditional parameter configurations
- Provide localized content and labels
- Integrate with external data sources and APIs

## Basic Syntax

ECMAScript expressions are supported in any `data-*` attribute except `data-type`:

```html
<!-- Static value -->
<meta
	name="x-icue-property"
	content="brightness"
	data-label="'Brightness'"
	data-type="slider"
	data-default="50"
	data-min="0"
	data-max="100"
	data-step="1"
/>
<!-- Dynamic expression -->
<meta
	name="x-icue-property"
	content="brightness"
	data-label="tr('Brightness')"
	data-type="slider"
	data-default="SystemUtils.getSystemVolume()"
	data-min="0"
	data-max="100"
	data-step="1"
/>
```

## Module Integration

### Declaring Modules

Declare JavaScript modules using the `modules` tag in the widget's manifest:

Manifest:

```json
"modules": [
    "modules/SystemUtils.mjs",
    "modules/DeviceCapabilities.js"
]
```

### Module File Structure

File: `modules/SystemUtils.mjs`

```javascript
export function getCurrentTimezone() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
export function getAvailableTimezones() {
	return ["America/New_York", "Europe/London", "Europe/Kyiv", "Asia/Tokyo", "Australia/Sydney"];
}
export function getSystemVolume() {
	return 75;
}
export function isLowLightMode() {
	const hour = new Date().getHours();
	return hour < 7 || hour > 20;
}
```

### Using Module Functions

Exported functions are available through the module's filename (without extension):

Manifest:

```json
"modules": [
    "modules/SystemUtils.mjs"
]
```

HTML:

```html
<meta
	name="x-icue-property"
	content="timezone"
	data-label="'Time Zone'"
	data-type="combobox"
	data-values="SystemUtils.getAvailableTimezones()"
	data-default="SystemUtils.getCurrentTimezone()"
/>
<meta
	name="x-icue-property"
	content="nightMode"
	data-label="'Night Mode'"
	data-type="switch"
	data-default="SystemUtils.isLowLightMode()"
/>
```

## Module Requirements

- **File extensions**: `.mjs` or `.js`
- **Export format**: ES6 module exports (`export function name() {}`)
- **Location**: Relative paths from the widget's HTML file
- **Multiple modules**: Supported for different functionality

## Plugin Functions

Plugin functions are available in expressions. Only blocking (synchronous) functions are supported. Asynchronous
functions cannot be used in meta parameter expressions.
Example with Sensors Data Provider:

Manifest:

```json
 "required_plugins": [
     "widgetbuilder.sensorsdataprovider:Sensors:1.0"
 ]
```

HTML:

```html
<meta
	name="x-icue-property"
	content="selectedSensorId"
	data-label="'Sensor'"
	data-type="sensors-combobox"
	data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')"
/>
<!-- Only blocking (synchronous) functions are supported. Asynchronous functions cannot be used in meta parameter expressions. -->
```
