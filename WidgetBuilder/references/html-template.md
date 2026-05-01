# HTML Widget Template

Use this as the starting point for every new iCUE widget. Adapt it to the specific widget requirements — don't copy it verbatim without adjusting to the use case.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>tr('[Widget Name]')</title>
  <link rel="icon" type="image/svg+xml" href="resources/[widgetname].svg">

  <!-- Device restrictions: JSON format only — see references/widget-meta-parameters.md -->
  <meta name="x-icue-restrictions" data-restrictions='[{ "device": "dashboard_lcd" }]'>

  <!-- Optional: x-icue-interactive | x-icue-widget-group | x-icue-widget-preview | x-icue-module -->

  <!-- MediaViewer for background image support -->
  <script type="text/javascript" src="../common/tools/media_viewer/MediaViewer.js"></script>
  <link rel="stylesheet" type="text/css" href="../common/tools/media_viewer/MediaViewer.css">

  <!-- Feature Properties -->
  <!-- Add widget-specific properties here -->

  <!-- Widget Personalization (recommended — place as last group) -->
  <meta name="x-icue-property" content="backgroundMedia" data-label="tr('Background Image')" data-type="media-selector" data-filters="['*.png','*.jpg','*.jpeg','*.webp']">
  <meta name="x-icue-property" content="glassBlur" data-label="tr('Glass Blur')" data-type="slider" data-default="0" data-min="0" data-max="30" data-step="1">
  <meta name="x-icue-property" content="textColor" data-label="tr('Text Color')" data-type="color" data-default="'#ffffff'">
  <meta name="x-icue-property" content="accentColor" data-label="tr('Accent Color')" data-type="color" data-default="'#ffffff'">
  <meta name="x-icue-property" content="backgroundColor" data-label="tr('Background')" data-type="color" data-default="'#000000'">
  <meta name="x-icue-property" content="transparency" data-label="tr('Transparency')" data-type="slider" data-default="100" data-min="0" data-max="100" data-step="1">

  <!-- Property grouping - Personalization should be last -->
  <script id="x-icue-groups" type="application/json">
  [
    { "title": "tr('[Widget Name]')", "properties": [...] },
    { "title": "tr('Widget Personalization')", "properties": ["backgroundMedia", "glassBlur", "textColor", "accentColor", "backgroundColor", "transparency"] }
  ]
  </script>

  <link rel="stylesheet" type="text/css" href="styles/[WidgetName].css">
</head>
<body>
  <div class="widget-root">
    <!-- Optional background stack. Use any equivalent solid-color layer; `.main-glass`
         is a common pattern in existing widgets, not a required element name. -->
    <div class="widget-background" aria-hidden="true">
      <div class="main-glass"></div>
      <div id="media-background"></div>
    </div>

    <div class="main-content">
      <!-- Widget content -->
      <div class="loading-state">Loading...</div>
      <div class="error-state" style="display:none;">Unable to load data</div>
      <div class="empty-state" style="display:none;">No data available</div>
      <div class="content" style="display:none;">
        <!-- Main content here -->
      </div>
    </div>
  </div>

  <script>
    // iCUE API binding — bare assignment is intentional.
    // Do NOT add var/let/const: if iCUE evaluates this script in a sandboxed
    // function context (new Function()), a declared variable stays local and
    // window.icueEvents is never set, silently breaking the event bridge.
    icueEvents = {
      'onDataUpdated': onIcueDataUpdated,
      'onICUEInitialized': onIcueInitialized
      // 'onUpdateRequested': onUpdateRequested  // For refresh button support
    };

    let languageCode = 'en';

    // Required: iCUE may run the widget in a sandboxed Function() context where
    // injected properties are locals, not window properties. Both paths are needed.
    function getIcueProperty(name) {
      if (typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, name)) {
        const value = window[name];
        if (value !== undefined && value !== null && value !== '') return value;
      }
      try {
        const value = Function('return typeof ' + name + ' !== "undefined" ? ' + name + ' : undefined')();
        if (value !== undefined && value !== null && value !== '') return value;
      } catch (e) {}
      return undefined;
    }

    function clampRange(v, min, max, d) {
      v = Number(v);
      if (!Number.isFinite(v)) return d;
      return Math.max(min, Math.min(max, v));
    }

    function resolveMediaPath(value) {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (value.pathToAsset) return value.pathToAsset;
      if (value.path) return value.path;
      return '';
    }

    // --- MediaViewer wrapper ---
    const mediaMount = document.getElementById('media-background');

    function createMediaBackgroundComponent(container) {
      if (!container) {
        return { clear: function() {}, loadMedia: function() {} };
      }

      if (typeof MediaViewer === 'function') {
        const viewer = new MediaViewer({
          container: container,
          onMediaLoaded: function() {
            container.classList.add('has-media');
          },
          onMediaError: function(error) {
            container.classList.remove('has-media');
            console.error('Media background error:', error);
          }
        });
        return {
          clear: function() {
            viewer.clear();
            container.classList.remove('has-media');
          },
          loadMedia: function(config) {
            viewer.loadMedia(config);
          }
        };
      }

      // Static fallback when MediaViewer is unavailable (e.g., browser testing)
      console.warn('MediaViewer is unavailable; using static background fallback.');
      return {
        clear: function() {
          container.style.backgroundImage = '';
          container.classList.remove('has-media');
        },
        loadMedia: function(config) {
          const assetPath = resolveMediaPath(config ? (config.pathToAsset || config.path) : '');
          if (!assetPath) {
            container.style.backgroundImage = '';
            container.classList.remove('has-media');
            return;
          }
          container.style.backgroundImage = "url('" + assetPath + "')";
          container.style.backgroundRepeat = 'no-repeat';
          container.style.backgroundPosition = 'center';
          container.style.backgroundSize = 'cover';
          container.classList.add('has-media');
        }
      };
    }

    const mediaBackgroundComponent = createMediaBackgroundComponent(mediaMount);

    // --- Styles & background ---
    function applyStyles() {
      const root = document.documentElement;

      // IMPORTANT: Always use getIcueProperty() for all iCUE-injected values —
      // never reference the variable name directly (e.g. `glassBlur`, `transparency`).
      // Direct references crash in browser preview where iCUE hasn't injected them,
      // leaving the widget stuck on the loading screen.

      // Background transparency: controls overall background opacity (image + color).
      // At 0% the widget background is fully transparent (desktop shows through).
      const bgTransparency = clampRange(getIcueProperty('transparency'), 0, 100, 100) / 100;
      root.style.setProperty('--bg-opacity', bgTransparency);

      // Apply colors
      const tc  = getIcueProperty('textColor');
      const ac  = getIcueProperty('accentColor');
      const bgc = getIcueProperty('backgroundColor');
      root.style.setProperty('--text-color',   (typeof tc  === 'string' && tc)  ? tc  : '#ffffff');
      root.style.setProperty('--accent-color', (typeof ac  === 'string' && ac)  ? ac  : '#ffffff');
      root.style.setProperty('--bg-color',     (typeof bgc === 'string' && bgc) ? bgc : '#000000');
      root.style.setProperty('--bg-blur', clampRange(getIcueProperty('glassBlur'), 0, 30, 0) + 'px');

      // Determine if a background image is set. Keep the full media object,
      // not just the file path, so scale/position/rotation still work.
      const bgMedia = getIcueProperty('backgroundMedia');

      if (!bgMedia) {
        mediaBackgroundComponent.clear();
        return;
      }

      mediaBackgroundComponent.loadMedia({
        path: bgMedia.pathToAsset,
        baseWidth: bgMedia.baseWidth,
        baseHeight: bgMedia.baseHeight,
        scale: bgMedia && typeof bgMedia === 'object' ? bgMedia.scale : undefined,
        positionX: bgMedia && typeof bgMedia === 'object' ? bgMedia.positionX : undefined,
        positionY: bgMedia && typeof bgMedia === 'object' ? bgMedia.positionY : undefined,
        angle: bgMedia && typeof bgMedia === 'object' ? bgMedia.angle : undefined
      });
    }

    function showState(state) {
      const states = ['loading-state', 'error-state', 'empty-state', 'content'];
      states.forEach(s => {
        const el = document.querySelector('.' + s);
        if (el) el.style.display = s === state ? '' : 'none';
      });
    }

    function updateWidget() {
      // Widget-specific update logic
      showState('content');
    }

    function onIcueDataUpdated() {
      applyStyles();
      updateWidget();
    }

    function onIcueInitialized() {
      if (typeof iCUE !== 'undefined' && iCUE.iCUELanguage) {
        languageCode = iCUE.iCUELanguage;
      }
      onIcueDataUpdated();
    }

    // Initial render for browser testing
    if (typeof iCUE_initialized !== 'undefined' && iCUE_initialized) {
      onIcueInitialized();
    } else {
      onIcueDataUpdated();
    }
  </script>
</body>
</html>
```

## Key Patterns

### iCUE Event Binding

`icueEvents` maps iCUE signals to your handler functions:
- `onDataUpdated` — called each time a user adjusts a meta-parameter control. The `content` attribute value becomes a local variable containing the current value.
- `onICUEInitialized` — called once when iCUE finishes loading the widget.
- `onUpdateRequested` — called when the user clicks a refresh button (if supported).

### Property Existence Checks

**Always use `getIcueProperty(name)` for every iCUE-injected value** — never reference the variable name directly (`transparency`, `glassBlur`, `backgroundMedia`, etc.). Direct references throw `ReferenceError` in browser preview where iCUE hasn't injected them, crashing `applyStyles()` silently and leaving the widget permanently on the loading screen.

```javascript
// CORRECT
const blur = clampRange(getIcueProperty('glassBlur'), 0, 30, 0);
const bgMedia = getIcueProperty('backgroundMedia');

// WRONG — crashes in browser preview
const blur = clampRange(glassBlur, 0, 30, 0);
const bgMedia = typeof backgroundMedia !== 'undefined' ? backgroundMedia : undefined;
```

### Media Background Guidance

This template shows one example implementation. For normative media-background behavior (include paths, full media object handling, normalization, layer model, and optional `.main-glass`), follow `references/media-backgrounds.md`.

### State Management

Use the `showState()` pattern to toggle between loading, error, empty, and content states. Every API-driven widget needs all four states.

### Browser Testing

The `if (typeof iCUE_initialized ...)` block at the bottom ensures the widget renders when opened directly in a browser (outside iCUE), which is essential for development and testing.
