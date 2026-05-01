# combobox

Dropdown selection control.

## Attributes

| Attribute      | Type                                            | Description           |
|----------------|-------------------------------------------------|-----------------------|
| `data-default` | `string`                                        | Initial selected key  |
| `data-values`  | `string[]` \| `object` \| `array<{key, value}>` | Available options     |

## Output Value

`string` - Selected key value

## Example

### Simple array format

```html
<meta name="x-icue-property" content="fruit"
      data-label="tr('Fruit')"
      data-type="combobox"
      data-default="'apple'"
      data-values="['apple', 'banana', 'orange']">
```

### Key-value array format

```html
<meta name="x-icue-property" content="position"
      data-label="tr('Position')"
      data-type="combobox"
      data-default="'left'"
      data-values="[{'key':'left','value':tr('Left')},{'key':'center','value':tr('Center')},{'key':'right','value':tr('Right')}]">
```

## Usage in JavaScript

```javascript
console.log(fruit);    // "banana"
console.log(position); // "left"
```

## Complete Widget Example

Manifest:

```json
{
  "author": "Corsair Team",
  "id": "com.corsair.comboboxdemo",
  "name": "Combobox Demo",
  "description": "Combobox Demo",
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
    <title>'Combobox Demo'</title>
    <link rel="icon" type="image/svg+xml" href="resources/icon.svg">

    <meta name="x-icue-property" content="fruit"
          data-label="'Fruit'" data-type="combobox"
          data-default="'apple'" data-values="['apple', 'banana', 'orange']">

    <script type="application/json" id="x-icue-groups">
    [{"title": "'Settings'", "properties": ["fruit"]}]
    </script>
</head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;font-family:sans-serif;">
    <div id="demo" style="font-size:48px;">apple</div>
    <script>
        icueEvents = { "onDataUpdated": update, "onICUEInitialized": update };
        function update() { document.getElementById("demo").textContent = fruit; }
        if (iCUE_initialized) update();
    </script>
</body>
</html>
```

For the example to work, you also need to add icon.svg
