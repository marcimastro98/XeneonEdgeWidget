# switch

Boolean toggle switch.

## Attributes

| Attribute      | Type      | Description                       |
|----------------|-----------|-----------------------------------|
| `data-default` | `boolean` | Initial state (`true` or `false`) |

## Output Value

`boolean` - `true` or `false`

## Example

```html
<meta name="x-icue-property" content="showLabel"
      data-label="tr('Show Label')"
      data-type="switch"
      data-default="true">
```

## Usage in JavaScript

```javascript
console.log(showLabel); // true
element.style.display = showLabel ? "block" : "none";
```

## Complete Widget Example

Manifest:

```json
{
  "author": "Corsair Team",
  "id": "com.corsair.switchdemo",
  "name": "Switch Demo",
  "description": "Switch Demo",
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
      "type": "dashboard_lcd",
      "features": ["sensor-screen"]
    },
    {
      "type": "pump_lcd"
    },
    {
      "type": "keyboard_lcd"
    }
  ]
}
```

HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>'Switch Demo'</title>
    <link rel="icon" type="image/svg+xml" href="resources/icon.svg">

    <meta name="x-icue-property" content="showLabel"
          data-label="'Show Label'" data-type="switch" data-default="true">

    <script type="application/json" id="x-icue-groups">
    [{"title": "'Settings'", "properties": ["showLabel"]}]
    </script>
</head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;font-family:sans-serif;">
    <div id="demo" style="font-size:48px;">ON</div>
    <script>
        icueEvents = { "onDataUpdated": update, "onICUEInitialized": update };
        function update() { document.getElementById("demo").textContent = showLabel ? "ON" : "OFF"; }
        if (iCUE_initialized) update();
    </script>
</body>
</html>
```

For the example to work, you also need to add icon.svg
