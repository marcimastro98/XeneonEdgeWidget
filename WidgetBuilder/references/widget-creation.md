# Widget Creation

## Overview

HTML widgets are web pages with embedded HTML, CSS, and JavaScript that interact with the iCUE API to create dynamic views for displaying data and providing controls. Widgets allow users to create personalized workspaces for many use cases.

Rendering engine: QtWebEngine 6.9.3 (Chromium 130.0.6723.192).

## Widget Storage Structure

Each widget resides in its own folder. The folder name serves as the internal widget identifier.

Required files:
- `index.html` — main entry point (required)
- `manifest.json` — widget manifest (required)

Optional files:
- `translation.json` — localization file (in root folder)
- `modules/*.mjs` — JavaScript modules for dynamic expressions
- `scripts/*.js` — additional JavaScript
- `styles/*.css` — stylesheets
- `resources/` — icons, images, thumbnails

Example structure (includes optional `translation.json`):
```
widgets/
└── mywidget/
    ├── index.html
    ├── manifest.json
    ├── translation.json
    ├── modules/
    │   └── CitySearch.mjs
    ├── scripts/
    │   └── widget.js
    ├── styles/
    │   └── style.css
    └── resources/
        ├── icon.png
        └── thumbnail.png
```

## Basic Structure of an HTML Widget

A properly structured HTML widget contains four main sections:

- **`<head>`** — Contains all metadata, including adjustable parameters such as sliders, switches, or color pickers. Also contains widget type info: `<title>` (mandatory) for the type name, and a favicon link for the widget icon.
- **`<style>`** — All styles applied to HTML elements.
- **`<body>`** — The widget DOM. Contains any elements required for widget display.
- **`<script>`** — All logic for how the widget operates. User-defined variables and iCUE-provided data variables are available here.

Minimal head section:
```html
<head>
    <title>My Widget</title>
    <link rel="icon" type="image/x-icon" href="resources/icon.png">
</head>
```

## Manifest

The `manifest.json` file describes the main parameters of the widget and information for the Marketplace.

Required fields:

| Field | Type | Description |
|-------|------|-------------|
| `author` | `string` | Widget author |
| `id` | `string` | Unique ID in reverse domain notation (e.g., `com.corsair.mywidget`) |
| `name` | `string` | Widget name |
| `description` | `string` | Widget description |
| `version` | `string` | Version in `major.minor.patch` format (e.g., `1.0.0`) |
| `preview_icon` | `string` | Path to icon file relative to manifest |
| `min_framework_version` | `string` | Minimum framework version (e.g., `1.0.0`) |
| `os` | `object[]` | Supported operating systems |
| `supported_devices` | `object[]` | Supported device types and features |

Optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `interactive` | `boolean` | Enable touch/click interaction (default: `false`) |
| `required_plugins` | `string[]` | Required plugins (format: `namespace:Name:version`) |
| `modules` | `string[]` | JS modules for dynamic meta expressions |

Example manifest:
```json
{
   "author": "Corsair Team",
   "id": "com.corsair.mywidget",
   "name": "My Widget",
   "description": "My Widget description",
   "version": "1.0.0",
   "preview_icon": "resources/icon.png",
   "min_framework_version": "1.0.0",
   "os": [
      { "platform": "windows" },
      { "platform": "mac" }
   ],
   "supported_devices": [
      { "type": "dashboard_lcd", "features": ["sensor-screen"] },
      { "type": "pump_lcd" },
      { "type": "keyboard_lcd" }
   ],
   "interactive": true,
   "required_plugins": [
      "widgetbuilder.sensorsdataprovider:Sensors:1.0"
   ],
   "modules": [
      "modules/MyModule.mjs"
   ]
}
```

### Device Types

| Device | `type` value | Description |
|--------|-------------|-------------|
| Xeneon Edge | `dashboard_lcd` | Dashboard LCD with touch support |
| Pump LCD | `pump_lcd` | Pump with LCD display |
| Keyboard | `keyboard_lcd` | Keyboard with LCD |

### Device Features

| Feature | Description |
|---------|-------------|
| `sensor-screen` | Requires touch capability |

### OS Platforms

| Value | Description |
|-------|-------------|
| `windows` or `win` | Windows |
| `macos` or `mac` | macOS |

## iCUE Data

Customize widget appearance by interacting with controls provided via `<meta>` parameters. Example:

```html
<head>
  <meta name="x-icue-property" content="backgroundColor" data-label="tr('Background')" data-type="color" data-default="'#3c4bff'">
  <style>
    .widget-background {
      width: 100%;
      height: 100%;
      background-color: black;
      border-radius: 50%;
      position: relative;
    }
  </style>
</head>
<body>
  <div class="widget-background"></div>
  <script>
    icueEvents = {
      'onDataUpdated': onIcueDataUpdated
    };

    function onIcueDataUpdated() {
      document.querySelector('.widget-background').style.backgroundColor = backgroundColor;
    };
  </script>
</body>
```

`icueEvents` is an object in the iCUE API. It lets you subscribe to update signals by mapping `onDataUpdated` to your handler function. That function is called each time a user adjusts a meta-parameter control. The `content` attribute value becomes a local variable in your script that contains the current control value.

## iCUE Events

iCUE injects script blocks into the widget's HTML page at runtime, providing:

- **Global variables** for each meta parameter (e.g., `textColor`, `fontSize`)
- **`iCUE` global object** with utility functions
- **`iCUE_initialized`** flag indicating API readiness
- **Plugin objects** in `window.plugins` namespace

Register callbacks via the global `icueEvents` object:

```javascript
icueEvents = {
    "onDataUpdated": onIcueDataUpdated,
    "onICUEInitialized": onIcueInitialized
};

function onIcueInitialized() {
    // Called once when iCUE API is ready
}

function onIcueDataUpdated() {
    // Called on property change; properties available as global variables
}

// Handle late script loading
if (iCUE_initialized) {
    onIcueInitialized();
    onIcueDataUpdated();
}
```

| Event | Description |
|-------|-------------|
| `onICUEInitialized` | Called once when iCUE API and all data are ready |
| `onDataUpdated` | Called when any meta parameter value changes |

## Widget Grouping

Group related widgets together in the iCUE widget picker using HTML meta tags:

```html
<meta name="x-icue-widget-group" content="tr('Clock Face')">
<meta name="x-icue-widget-preview" content="resources/MyWidgetPreview.png">
```

- `x-icue-widget-group` — group name; all widgets sharing the same name are combined
- `x-icue-widget-preview` — preview image for the widget selector (expected size: 128x56 pixels)
- Group icon comes from the first widget loaded by iCUE
- Sorting within a group is not controlled

## Example: Widget Displaying a Sensor Value

`manifest.json`:
```json
{
  "author": "Corsair Team",
  "id": "com.corsair.sensorview",
  "name": "Sensor View",
  "description": "Displays a selected sensor value",
  "version": "1.0.0",
  "preview_icon": "resources/icon.png",
  "min_framework_version": "1.0.0",
  "os": [{ "platform": "windows" }, { "platform": "mac" }],
  "supported_devices": [
    { "type": "dashboard_lcd" },
    { "type": "pump_lcd" },
    { "type": "keyboard_lcd" }
  ],
  "required_plugins": [
    "widgetbuilder.sensorsdataprovider:Sensors:1.0"
  ]
}
```

`index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="resources/icon.svg">
  <title>tr('Sensor view')</title>
  <meta name="x-icue-property" content="sensorId" data-label="tr('Sensor')" data-type="sensors-combobox"
        data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')">
  <style>
    body {
      background-color: #2B2B2B;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: Arial, sans-serif;
    }
    #sensor-value {
      position: absolute;
      font-size: 10vmin;
      text-align: center;
      width: 90%;
      bottom: 20%;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div id="sensor-value">--</div>
  <script src="common/plugins/IcueWidgetApiWrapper.js"></script>
  <script src="common/plugins/SimpleSensorApiWrapper.js"></script>
  <script>
    // Wrapper classes are loaded from local common/plugins files bundled with the widget
  </script>
  <script>
    let sensorApi = null;
    icueEvents = {
      'onDataUpdated': onIcueDataUpdated,
      'onICUEInitialized': onIcueDataUpdated
    };
    pluginSensorsdataproviderEvents = {
      'onInitialized': onPluginReady
    };

    function getIcueProperty(name) {
      if (typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, name)) {
        const value = window[name];
        if (value !== undefined && value !== null && value !== '') return value;
      }
      try {
        const value = Function('return typeof ' + name + ' !== "undefined" ? ' + name + ' : undefined')();
        if (value !== undefined && value !== null && value !== '') return value;
      } catch (e) {}
      return undefined;
    }

    function onPluginReady() {
      sensorApi = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider);
      window.plugins.Sensorsdataprovider.sensorValueChanged.connect((id, val) => {
        if (id === getIcueProperty('sensorId')) updateDisplay(val, null);
      });
      onIcueDataUpdated();
    }

    async function onIcueDataUpdated() {
      const selectedSensorId = getIcueProperty('sensorId');
      if (!sensorApi || !selectedSensorId) return;
      const [val, units] = await Promise.all([
        sensorApi.getSensorValue(selectedSensorId),
        sensorApi.getSensorUnits(selectedSensorId)
      ]);
      updateDisplay(val, units);
    }

    function updateDisplay(val, units) {
      document.getElementById('sensor-value').textContent =
        parseFloat(val).toFixed(1) + (units ? ' ' + units : '');
    }

    if (iCUE_initialized) onIcueDataUpdated();
    if (typeof pluginSensorsdataprovider_initialized !== 'undefined' && pluginSensorsdataprovider_initialized) onPluginReady();
  </script>
</body>
</html>
```
