# Common Tools

## Overview

Coomon tools are JavaScript and CSS utilities that ship with iCUE that can be used in your widgets to enhance the user experience with widget configuration.

:::important How to Use Common Tools
To use any common tool in your widget, you must **copy the `common` folder** (or the specific tool subfolder you need) from iCUE widgets folder `<<iCUE install dir>>/widgets/` into your widget's root directory. Your widget references these files via relative paths (e.g., `common/tools/media_viewer/MediaViewer.js`), so the files must be present alongside your `index.html`.

Your widget folder should look like this:

```text
MyWidget/
├── index.html
├── manifest.json
└── common/
    └── tools/
        └── media_viewer/
            ├── MediaViewer.js
            └── MediaViewer.css
```

:::

---

## MediaViewer

Displays and transforms images and videos selected via a `media-selector` property. Handles zoom, pan, and rotation exactly as configured in the iCUE media editor.

**File:** `tools/media_viewer/MediaViewer.js` + `tools/media_viewer/MediaViewer.css`

**When to use:** Any widget with a `backgroundImage` (or similar) `media-selector` property.

#### Constructor

```javascript
const viewer = new MediaViewer(options);
```

| Option          | Type          | Required | Description                            |
| --------------- | ------------- | -------- | -------------------------------------- |
| `container`     | `HTMLElement` | Yes      | Element that receives the media        |
| `onMediaLoaded` | `function`    | No       | Callback when media loads successfully |
| `onMediaError`  | `function`    | No       | Callback on load failure               |
| `debug`         | `boolean`     | No       | Enable verbose logging                 |

#### Methods

| Method              | Description                            |
| ------------------- | -------------------------------------- |
| `loadMedia(params)` | Load and display media with transforms |
| `clear()`           | Remove current media, hide container   |
| `destroy()`         | Clean up all resources                 |

#### `loadMedia(params)` Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `path`       | `string` | Path/URL to the media file                           |
| `baseWidth`  | `number` | Original media width (from `media-selector` output)  |
| `baseHeight` | `number` | Original media height (from `media-selector` output) |
| `scale`      | `number` | Scale factor (default: `1`)                          |
| `positionX`  | `number` | X offset in pixels                                   |
| `positionY`  | `number` | Y offset in pixels                                   |
| `angle`      | `number` | Rotation in degrees                                  |

**Note:** Parameters are `baseWidth`/`baseHeight` — iCUE's `media-selector` output uses these exact field names.

#### Container CSS Requirements

```css
#media-background {
	width: 100%;
	height: 100%;
	position: relative; /* Required — MediaViewer uses absolute children */
	/* Do NOT add overflow: hidden — breaks MediaViewer's translate positioning */
	/* Do NOT add visibility: hidden — MediaViewer manages its own visibility */
}
```

#### Supported Formats

| Type   | Extensions                                               |
| ------ | -------------------------------------------------------- |
| Images | `jpg`, `jpeg`, `png`, `gif`, `bmp`, `webp`, `svg`, `ico` |
| Videos | `mp4`, `webm`, `ogg`, `mov`, `avi`, `mkv`                |

#### Example

```html
<!-- Inline in <head> -->
<style>
	.position-container {
		position: absolute;
		transform-origin: top left;
	}
	.scale-container {
		transform-origin: top left;
	}
	.rotation-container {
		transform-origin: center center;
	}
	.rotation-container img,
	.rotation-container video {
		display: block;
		object-fit: contain;
	}
</style>
<script>
	class MediaViewer {
		/* ... inline full source ... */
	}
</script>
```

```javascript
const viewer = new MediaViewer({ container: document.getElementById("media-background") });

function applyBackground() {
	if (typeof backgroundImage === "undefined" || !backgroundImage) {
		viewer.clear();
		return;
	}
	viewer.loadMedia({
		path: backgroundImage.pathToAsset,
		baseWidth: backgroundImage.baseWidth,
		baseHeight: backgroundImage.baseHeight,
		scale: backgroundImage.scale,
		positionX: backgroundImage.positionX,
		positionY: backgroundImage.positionY,
		angle: backgroundImage.angle,
	});
}
```

See the `media-selector` control documentation for full integration guidance.

:::tip
Remember to copy the `common/tools/media_viewer/` folder from your iCUE installation into your widget directory before packaging.
:::
