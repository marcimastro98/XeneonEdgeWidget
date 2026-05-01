# media-selector

Media file selector with transformation controls (scale, position, rotation).

**Platform notes:**

-   Windows: supports `AV1`, `VP8`, `VP9` video codecs
-   macOS: video codecs are **not** supported

## Attributes

| Attribute      | Type       | Description       |
| -------------- | ---------- | ----------------- |
| `data-filters` | `string[]` | File type filters |

## Output Value

`object` (or `undefined` if no media selected):

| Property      | Type     | Description               |
| ------------- | -------- | ------------------------- |
| `pathToAsset` | `string` | URL/path to selected file |
| `scale`       | `number` | Scale factor (1.0)        |
| `positionX`   | `number` | X position offset         |
| `positionY`   | `number` | Y position offset         |
| `baseSizeX`   | `number` | Original image width      |
| `baseSizeY`   | `number` | Original image height     |
| `angle`       | `number` | Rotation angle in degrees |

## Example

```html
<meta
    name="x-icue-property"
    content="backgroundImage"
    data-label="tr('Background Image')"
    data-type="media-selector"
    data-filters="['*.png', '*.jpg', '*.gif']"
/>
```

```javascript
if (typeof backgroundImage !== "undefined") {
    console.log(backgroundImage.pathToAsset); // "file:///path/to/image.png"
    console.log(backgroundImage.scale); // 1.5
    console.log(backgroundImage.angle); // 45
}
```

## MediaViewer Helper

See [MediaViewer documentation](../common-tools.mdx) for simplified media handling.
It can be found in the iCUE files: `<<iCUE install dir>>/widgets/common`

**Location:** `<<iCUE install dir>>/widgets/common`

## Complete Widget Example

Manifest:

```json
{
    "author": "Corsair Team",
    "id": "com.corsair.mediaselectordemo",
    "name": "Media Selector Demo",
    "description": "Media Selector Demo",
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
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>'Media Selector Demo'</title>
        <link rel="icon" type="image/svg+xml" href="resources/icon.svg" />

        <meta
            name="x-icue-property"
            content="backgroundImage"
            data-label="'Background'"
            data-type="media-selector"
            data-filters="['*.png', '*.jpg', '*.gif']"
        />

        <script type="application/json" id="x-icue-groups">
            [{ "title": "'Settings'", "properties": ["backgroundImage"] }]
        </script>

        <script src="common/tools/media_viewer/MediaViewer.js"></script>
        <link rel="stylesheet" href="common/tools/media_viewer/MediaViewer.css" />
    </head>
    <body style="margin:0;height:100vh;background:#1a1a2e;color:#fff;font-family:sans-serif;">
        <div id="media" style="position:absolute;width:100%;height:100%;"></div>
        <div id="info" style="position:relative;z-index:1;padding:20px;">No media</div>
        <script>
            const viewer = new MediaViewer({ container: document.getElementById("media") });
            icueEvents = { onDataUpdated: update, onICUEInitialized: update };
            function update() {
                if (typeof backgroundImage === "undefined") {
                    viewer.clear();
                    document.getElementById("info").textContent = "No media";
                } else {
                    viewer.loadMedia({
                        path: backgroundImage.pathToAsset,
                        baseSizeX: backgroundImage.baseSizeX,
                        baseSizeY: backgroundImage.baseSizeY,
                        scale: backgroundImage.scale,
                        positionX: backgroundImage.positionX,
                        positionY: backgroundImage.positionY,
                        angle: backgroundImage.angle,
                    });
                    document.getElementById("info").textContent = "Scale: " + backgroundImage.scale.toFixed(1);
                }
            }
            if (iCUE_initialized) update();
        </script>
    </body>
</html>
```

For the example to work, you also need to add icon.svg

`MediaViewer` is bundled with iCUE under `<<iCUE install dir>>/widgets/common/tools/media_viewer/`.
