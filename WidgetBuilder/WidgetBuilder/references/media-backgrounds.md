# Media Backgrounds

Use this reference only when a widget exposes a `media-selector` property such as `backgroundMedia` or `backgroundImage`.

## When to Use

This section applies when the widget supports user-selected background images or media-driven personalization. Skip it entirely for widgets that only use solid colors.

## Include CORSAIR's MediaViewer

**Always inline MediaViewer directly in the widget `<head>`.** Do not use an external `<script src>` tag.

iCUE loads user widgets from `file://` URLs in a GUID-named folder inside the user's AppData directory (e.g. `html_widgets/f13d1158-.../index.html`). QtWebEngine silently blocks loading external scripts from `file://` subdirectories — the script tag appears in the DOM but never executes, leaving `MediaViewer` undefined and causing the CSS fallback to run instead.

The built-in Corsair widgets (Weather, etc.) are co-located with `common/` in the iCUE install dir and can use `../common/tools/media_viewer/...`. User widgets cannot.

Inline both the CSS and JS directly:

```html
<!-- MediaViewer — inlined to avoid iCUE file:// script-loading restrictions -->
<style>
.position-container { position: absolute; transform-origin: top left; }
.scale-container { transform-origin: top left; }
.rotation-container { transform-origin: center center; }
.rotation-container img, .rotation-container video { display: block; object-fit: contain; }
</style>
<script>
class MediaViewer {
  constructor(options = {}) {
    this.container = options.container;
    this.onMediaLoaded = options.onMediaLoaded || (() => {});
    this.onMediaError = options.onMediaError || (() => {});
    this.debug = options.debug || false;
    this.positionContainer = null; this.scaleContainer = null; this.rotationContainer = null;
    this.mediaElement = null; this.currentMediaPath = null;
    this.supportedImageFormats = ["jpg","jpeg","png","gif","bmp","webp","svg","ico"];
    this.supportedVideoFormats = ["mp4","webm","ogg","mov","avi","mkv"];
    if (!this.container) throw new Error("MediaViewer: container is required");
  }
  getFileExtension(p) { return p.split(".").pop().toLowerCase(); }
  isImageFile(e) { return this.supportedImageFormats.includes(e); }
  isVideoFile(e) { return this.supportedVideoFormats.includes(e); }
  log(...a) { if (this.debug) console.log("[MediaViewer]", ...a); }
  warn(...a) { if (this.debug) console.warn("[MediaViewer]", ...a); }
  error(...a) { console.error("[MediaViewer]", ...a); }
  createImageElement(filePath) {
    const img = document.createElement("img");
    img.src = filePath;
    img.onerror = () => { this.error("Failed to load image:", filePath); this.onMediaError(new Error("Failed to load image: " + filePath)); };
    img.onload  = () => { this.log("Image loaded:", filePath); this.onMediaLoaded(img); };
    return img;
  }
  createVideoElement(filePath) {
    const video = document.createElement("video");
    video.controls = false; video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
    video.addEventListener("loadeddata", () => {
      video.play().then(() => { this.onMediaLoaded(video); }).catch(e => { this.error("Error playing video:", e); this.onMediaError(e); });
    });
    video.addEventListener("error", e => { this.error("Video error:", e); this.onMediaError(new Error("Video error: " + (video.error?.message || "Unknown"))); });
    video.src = filePath;
    return video;
  }
  createMediaElement(filePath) {
    const ext = this.getFileExtension(filePath);
    if (this.isImageFile(ext)) return this.createImageElement(filePath);
    if (this.isVideoFile(ext)) return this.createVideoElement(filePath);
    this.error("Unsupported format:", ext); this.onMediaError(new Error("Unsupported format: " + ext)); return null;
  }
  createContainers() {
    this.positionContainer = document.createElement("div"); this.positionContainer.className = "position-container";
    this.scaleContainer    = document.createElement("div"); this.scaleContainer.className    = "scale-container";
    this.rotationContainer = document.createElement("div"); this.rotationContainer.className = "rotation-container";
    this.rotationContainer.appendChild(this.mediaElement);
    this.scaleContainer.appendChild(this.rotationContainer);
    this.positionContainer.appendChild(this.scaleContainer);
    return this.positionContainer;
  }
  applyTransform(params = {}) {
    if (!this.positionContainer) return;
    const baseWidth = params.baseWidth || 100; const baseHeight = params.baseHeight || 100;
    const scaleValue = params.scale !== undefined ? params.scale : 1;
    const posX = params.positionX || 0; const posY = params.positionY || 0; const rotation = params.angle || 0;
    const minScale = Math.min(this.container.clientWidth / baseWidth, this.container.clientHeight / baseHeight);
    this.positionContainer.style.transform = `translate(${posX * minScale}px, ${posY * minScale}px)`;
    this.scaleContainer.style.transform    = `scale(${scaleValue * minScale})`;
    this.rotationContainer.style.transform = `rotate(${rotation}deg)`;
  }
  loadMedia(params = {}) {
    const filePath = params.path; if (!filePath) { this.clear(); return; }
    const decoded = decodeURIComponent(filePath);
    if (this.currentMediaPath === decoded) { this.applyTransform(params); return; }
    this.clear();
    this.mediaElement = this.createMediaElement(decoded); if (!this.mediaElement) return;
    this.container.appendChild(this.createContainers());
    this.container.style.visibility = "visible";
    this.applyTransform(params); this.currentMediaPath = decoded;
  }
  clear() {
    this.container.innerHTML = ""; this.container.style.visibility = "hidden";
    this.positionContainer = this.scaleContainer = this.rotationContainer = this.mediaElement = this.currentMediaPath = null;
  }
  destroy() { this.clear(); this.container = this.onMediaLoaded = this.onMediaError = null; }
}
</script>
```

## Use the Full Media Object

`media-selector` values can include transform properties such as:

- `pathToAsset`
- `baseWidth`
- `baseHeight`
- `scale`
- `positionX`
- `positionY`
- `angle`

Do not extract only the file path. Pass the normalized full object to `MediaViewer.loadMedia()`.

**Important:** The field names are `baseWidth` / `baseHeight` (NOT `baseSizeX` / `baseSizeY`). MediaViewer.js reads `params.baseWidth` and `params.baseHeight` internally — passing the wrong names causes them to default to 100, breaking all transform math.

## Normalize Before `loadMedia()`

```js
function resolveMediaPath(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.pathToAsset) return value.pathToAsset;
  if (value.path) return value.path;
  if (value.value) return value.value;
  return '';
}

function normalizeMediaConfig(rawMedia) {
  var mediaPath = resolveMediaPath(rawMedia);
  if (!mediaPath) return null;
  var base = (rawMedia && typeof rawMedia === 'object') ? rawMedia : {};
  return {
    path:        base.pathToAsset || mediaPath,
    baseWidth:   Number(base.baseWidth)  || Number(base.baseSizeX) || 0,
    baseHeight:  Number(base.baseHeight) || Number(base.baseSizeY) || 0,
    scale:       Number.isFinite(Number(base.scale)) ? Number(base.scale) : 1,
    positionX:   Number(base.positionX) || 0,
    positionY:   Number(base.positionY) || 0,
    angle:       Number(base.angle)     || 0
  };
}
```

Always pass the output of `normalizeMediaConfig()` to `loadMedia()`, never a bare string path.

## Dedicated Background Layer

Place the media mount inside a dedicated background layer:

```html
<div class="widget-root">
  <div class="widget-background" aria-hidden="true">
    <div id="media-background"></div>
  </div>
  <!-- widget content -->
</div>
```

The background layer should fill the widget and sit behind content. Do NOT add `overflow: hidden` to `#media-background` — MediaViewer uses `position: absolute` with `transform-origin: top left` on its internal containers, so overflow clipping would break positioning.

If the widget also uses a solid background color layer (often named `.main-glass` in existing widgets), treat that layer as optional implementation detail rather than a required convention.

Recommended stack:

| Layer | Element | Purpose | Optional? |
|-------|---------|---------|-----------|
| 0 | `.widget-background` | Wrapper controlling overall background opacity | No |
| 0a | `.main-glass` or equivalent | Solid background-color base behind media | Yes |
| 0b | `#media-background` | Media layer shown when `media-selector` has a value | Only when media backgrounds are supported |
| 1 | `.main-content` | Main widget UI, unaffected by background transparency | No |

## CSS for the Media Container

MediaViewer manages its own internal visibility — do NOT set `visibility: hidden` or toggle a `.has-media` class. The container must use `position: relative` (not `absolute`) because MediaViewer creates nested absolutely-positioned children that need a positioned parent as their containing block.

```css
#media-background {
  width: 100%;
  height: 100%;
  position: relative;
  filter: blur(var(--bg-blur, 0px));
}
```

**Critical rules:**
- `position: relative` — required for MediaViewer's internal absolute positioning
- NO `overflow: hidden` — MediaViewer's `.position-container` uses `translate()` from `transform-origin: top left`; clipping breaks this
- NO `visibility: hidden` — MediaViewer sets `container.style.visibility` internally
- NO `.has-media` class toggling — unnecessary; MediaViewer handles show/hide

## Initialize MediaViewer Once

```js
function createMediaBackgroundComponent(container) {
  if (!container) return { clear: function() {}, loadMedia: function() {} };

  if (typeof MediaViewer === 'function') {
    var viewer = new MediaViewer({
      container: container,
      onMediaLoaded: function() {},
      onMediaError: function(e) { console.error('Media error:', e); }
    });
    return {
      clear: function() { viewer.clear(); },
      loadMedia: function(config) { viewer.loadMedia(config); }
    };
  }

  // Static fallback for browser testing (no transform support)
  return {
    clear: function() { container.style.backgroundImage = ''; },
    loadMedia: function(config) {
      var p = (config && config.path) ? config.path : resolveMediaPath(config);
      if (!p) { container.style.backgroundImage = ''; return; }
      container.style.backgroundImage = "url('" + String(p).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "')";
      container.style.backgroundRepeat = 'no-repeat';
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.visibility = 'visible';
    }
  };
}
```

**Important:** Do NOT toggle a `.has-media` CSS class — MediaViewer manages `container.style.visibility` internally. The fallback sets `visibility` directly for browser testing only.

If `MediaViewer` is unavailable during browser testing, the fallback renders a static background-image without transform support.

## Update on Every Data Refresh

```js
function applyBackground() {
  const mediaConfig = normalizeMediaConfig(getIcueProperty('backgroundMedia'));
  if (!mediaConfig) {
    mediaBackgroundComponent.clear();
  } else {
    mediaBackgroundComponent.loadMedia(mediaConfig);
  }
}
```

## Blur and Brightness

If the widget exposes `glassBlur` and `bgBrightness`, apply them via CSS variables:

```css
#media-background {
  filter: blur(var(--bg-blur, 0px)) brightness(var(--bg-brightness, 100%));
  will-change: filter;
}
```

```js
const blur = Number(typeof glassBlur !== 'undefined' ? glassBlur : 0);
const brightness = Number(typeof bgBrightness !== 'undefined' ? bgBrightness : 100);
root.style.setProperty('--bg-blur', (Number.isFinite(blur) ? blur : 0) + 'px');
root.style.setProperty('--bg-brightness', (Number.isFinite(brightness) ? brightness : 100) + '%');
```

## Fallback Behavior

| Scenario | Expected behavior |
|----------|------------------|
| No media selected | Show the default background color or transparent background |
| Media load failure | Keep rendering the widget UI and log the error |
| Offline / missing asset | Clear the media and fall back to the default background |

The widget must never block rendering because of media failure.
