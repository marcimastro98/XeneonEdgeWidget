# color

Color picker control.

## Attributes

| Attribute      | Type     | Description              |
|----------------|----------|--------------------------|
| `data-default` | `string` | Initial color (hex)      |

## Output Value

`string` - Hex color value (e.g., `"#FFFFFF"`)

## Example

```html
<meta name="x-icue-property" content="textColor"
      data-label="tr('Text Color')"
      data-type="color"
      data-default="'#FFFFFF'">
```

## Usage in JavaScript

```javascript
console.log(textColor); // "#FFFFFF"
element.style.color = textColor;
```

## Complete Widget Example

Manifest:

```json
{
  "author": "Corsair Team",
  "id": "com.corsair.colordemo",
  "name": "Color Demo",
  "description": "Color Demo",
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
    <title>'Color Demo'</title>
    <link rel="icon" type="image/svg+xml" href="resources/icon.svg">

    <meta name="x-icue-property" content="textColor"
          data-label="'Text Color'" data-type="color" data-default="'#e94560'">

    <script type="application/json" id="x-icue-groups">
    [{"title": "'Settings'", "properties": ["textColor"]}]
    </script>
</head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a2e;font-family:sans-serif;">
    <div id="demo" style="font-size:48px;">Hello</div>
    <script>
        icueEvents = { "onDataUpdated": update, "onICUEInitialized": update };
        function update() { document.getElementById("demo").style.color = textColor; }
        if (iCUE_initialized) update();
    </script>
</body>
</html>
```

For the example to work, you also need to add icon.svg
