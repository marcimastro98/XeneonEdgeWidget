# tab-buttons

Tab-style button group for selecting one option.

## Attributes

| Attribute      | Type                                | Description          |
|----------------|-------------------------------------|----------------------|
| `data-default` | `string`                            | Initial selected key |
| `data-values`  | `string[]` \| `array<{key, value}>` | Available options    |

## Output Value

`string` - Selected key value

## Example

```html
<meta name="x-icue-property" content="alignment"
      data-label="tr('Alignment')"
      data-type="tab-buttons"
      data-default="'center'"
      data-values="[{'key':'left','value':tr('Left')},{'key':'center','value':tr('Center')},{'key':'right','value':tr('Right')}]">
```

## Usage in JavaScript

```javascript
console.log(alignment); // "center"
```

## Complete Widget Example

Manifest:

```json
{
  "author": "Corsair Team",
  "id": "com.corsair.tabbuttonsdemo",
  "name": "Tab Buttons Demo",
  "description": "Tab Buttons Demo",
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
    <title>'Tab Buttons Demo'</title>
    <link rel="icon" type="image/svg+xml" href="resources/icon.svg">

    <meta name="x-icue-property" content="alignment"
          data-label="'Alignment'" data-type="tab-buttons"
          data-default="'center'"
          data-values="[{'key':'left','value':'Left'},{'key':'center','value':'Center'},{'key':'right','value':'Right'}]">

    <script type="application/json" id="x-icue-groups">
    [{"title": "'Settings'", "properties": ["alignment"]}]
    </script>
</head>
<body style="margin:0;height:100vh;display:flex;align-items:center;background:#1a1a2e;color:#fff;font-family:sans-serif;">
    <div id="demo" style="width:100%;font-size:48px;">Hello</div>
    <script>
        icueEvents = { "onDataUpdated": update, "onICUEInitialized": update };
        function update() { document.getElementById("demo").style.textAlign = alignment; }
        if (iCUE_initialized) update();
    </script>
</body>
</html>
```

For the example to work, you also need to add icon.svg
