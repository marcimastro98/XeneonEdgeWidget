# textfield

Text input field.

## Attributes

| Attribute      | Type     | Description        |
|----------------|----------|--------------------|
| `data-default` | `string` | Initial text value |

## Output Value

`string` - Entered text

## Example

```html
<meta name="x-icue-property" content="title"
      data-label="tr('Title')"
      data-type="textfield"
      data-default="'Hello World'">
```

## Usage in JavaScript

```javascript
console.log(title); // "Hello World"
element.textContent = title;
```

## Complete Widget Example

Manifest:

```json
{
  "author": "Corsair Team",
  "id": "com.corsair.textfielddemo",
  "name": "Textfield Demo",
  "description": "Textfield Demo",
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
    <title>'Textfield Demo'</title>
    <link rel="icon" type="image/svg+xml" href="resources/icon.svg">

    <meta name="x-icue-property" content="title"
          data-label="'Title'" data-type="textfield" data-default="'Hello World'">

    <script type="application/json" id="x-icue-groups">
    [{"title": "'Settings'", "properties": ["title"]}]
    </script>
</head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;font-family:sans-serif;">
    <div id="demo" style="font-size:48px;">Hello World</div>
    <script>
        icueEvents = { "onDataUpdated": update, "onICUEInitialized": update };
        function update() { document.getElementById("demo").textContent = title; }
        if (iCUE_initialized) update();
    </script>
</body>
</html>
```

For the example to work, you also need to add icon.svg
