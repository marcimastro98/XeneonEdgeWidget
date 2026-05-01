# slider

Numeric slider control.

## Attributes

| Attribute         | Type     | Description                 |
|-------------------|----------|-----------------------------|
| `data-default`    | `number` | Initial value               |
| `data-min`        | `number` | Minimum value               |
| `data-max`        | `number` | Maximum value               |
| `data-step`       | `number` | Step increment              |
| `data-unit-label` | `string` | Unit label (e.g., `"%"`)    |

## Output Value

`number` - Current slider value

## Example

```html
<meta name="x-icue-property" content="opacity"
      data-label="tr('Opacity')"
      data-type="slider"
      data-default="100"
      data-min="0"
      data-max="100"
      data-step="1"
      data-unit-label="'%'">
```

## Usage in JavaScript

```javascript
console.log(opacity); // 75
element.style.opacity = opacity / 100;
```

## Complete Widget Example

Manifest:

```json
{
  "author": "Corsair Team",
  "id": "com.corsair.sliderdemo",
  "name": "Slider Demo",
  "description": "Slider Demo",
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
    <title>'Slider Demo'</title>
    <link rel="icon" type="image/svg+xml" href="resources/icon.svg">

    <meta name="x-icue-property" content="opacity"
          data-label="'Opacity'" data-type="slider"
          data-default="100" data-min="0" data-max="100" data-step="1" data-unit-label="'%'">

    <script type="application/json" id="x-icue-groups">
    [{"title": "'Settings'", "properties": ["opacity"]}]
    </script>
</head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;font-family:sans-serif;">
    <div id="demo" style="font-size:48px;">100%</div>
    <script>
        icueEvents = { "onDataUpdated": update, "onICUEInitialized": update };
        function update() { document.getElementById("demo").textContent = opacity + "%"; }
        if (iCUE_initialized) update();
    </script>
</body>
</html>
```

For the example to work, you also need to add icon.svg
