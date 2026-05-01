# sensors-combobox

Dropdown for selecting a system sensor. Requires the [Sensors plugin](../plugins/sensors-data-provider.md).

## Attributes

| Attribute      | Type     | Description       |
| -------------- | -------- | ----------------- |
| `data-default` | `string` | Default sensor ID |

## Output Value

`string` - Selected sensor ID

## Requirements

This control requires the Sensors plugin to be declared in manifest.json:

```json
"required_plugins": [
  "widgetbuilder.sensorsdataprovider:Sensors:1.0"
]
```

## Example

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
    content="sensorId"
    data-label="tr('Sensor')"
    data-type="sensors-combobox"
    data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')"
/>
```

## Usage in JavaScript

```javascript
console.log(sensorId); // "cpu_temp_0"
```

## Complete Widget Example

Manifest:

```json
{
    "author": "Corsair Team",
    "id": "com.corsair.sensorscomboboxdemo",
    "name": "Sensors Combobox Demo",
    "description": "Sensors Combobox Demo",
    "version": "1.0.0",
    "preview_icon": "icon.png",
    "min_framework_version": "1.0.0",
    "os": [
        {
            "platform": "windows"
        },
        {
            "platform": "mac"
        }
    ],
    "supported_devices": [
        {
            "type": "dashboard_lcd"
        },
        {
            "type": "pump_lcd"
        },
        {
            "type": "keyboard_lcd"
        }
    ],
    "required_plugins": [
        "widgetbuilder.sensorsdataprovider:Sensors:1.0"
    ]
}
```

HTML:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>'Sensors Combobox Demo'</title>
        <link rel="icon" type="image/svg+xml" href="resources/icon.svg" />

        <meta
            name="x-icue-property"
            content="sensorId"
            data-label="'Sensor'"
            data-type="sensors-combobox"
            data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')"
        />

        <script type="application/json" id="x-icue-groups">
            [{ "title": "'Settings'", "properties": ["sensorId"] }]
        </script>

        <script src="common/plugins/IcueWidgetApiWrapper.js"></script>
        <script src="common/plugins/SimpleSensorApiWrapper.js"></script>
    </head>
    <body
        style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;font-family:sans-serif;"
    >
        <div>
            <span id="value" style="font-size:48px;">--</span>
            <span id="units" style="font-size:24px;"></span>
        </div>
        <script>
            let api = null;
            icueEvents = { onDataUpdated: update, onICUEInitialized: update };
            pluginSensorsdataproviderEvents = { onInitialized: onPluginReady };

            function onPluginReady() {
                api = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider);
                window.plugins.Sensorsdataprovider.sensorValueChanged.connect((id, val) => {
                    if (id === sensorId) document.getElementById("value").textContent = parseFloat(val).toFixed(1);
                });
                update();
            }

            async function update() {
                if (!api || !sensorId) return;
                const [val, units] = await Promise.all([api.getSensorValue(sensorId), api.getSensorUnits(sensorId)]);
                document.getElementById("value").textContent = parseFloat(val).toFixed(1);
                document.getElementById("units").textContent = units;
            }

            if (iCUE_initialized) update();
            if (typeof pluginSensorsdataprovider_initialized !== "undefined" && pluginSensorsdataprovider_initialized)
                onPluginReady();
        </script>
    </body>
</html>
```

For the example to work, you also need to add icon.svg

`IcueWidgetApiWrapper` and `SimpleSensorApiWrapper` are available in the `common` folder of the iCUE installation directory.
