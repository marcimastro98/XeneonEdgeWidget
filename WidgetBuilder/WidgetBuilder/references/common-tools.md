# iCUE Common Tools & Plugin Wrappers

Corsair ships reusable utilities and plugin wrappers with iCUE. They live in:
```
<<iCUE install dir>>/widgets/common/tools/      ← Tools (standalone, no manifest changes)
<<iCUE install dir>>/widgets/common/plugins/    ← Plugin wrappers (require manifest.json entry)
```

## Important: All JS Must Be Inlined

iCUE loads user widgets from `file://` URLs in a GUID-named AppData folder. QtWebEngine silently blocks loading external JS via `<script src>`. The script tag appears in the DOM but never executes. **All tool and plugin JS must be pasted inline as a `<script>` block in the widget's `<head>`.** CSS can be inlined in a `<style>` block too for consistency.

During widget creation, copy the relevant tool/plugin code blocks below directly into the widget HTML.

---

## Terminology

| Term | Meaning |
|------|---------|
| **Tool** | Standalone utility — works without any manifest.json changes |
| **Plugin wrapper** | Requires `required_plugins` entry in manifest.json and access to `window.plugins.*` |

---

## Tools (no manifest changes needed)

### MediaViewer

Displays and transforms user-selected images and videos. Required for any widget with a `media-selector` / `backgroundImage` property.

**When to include:** Widget has a `backgroundImage` (`media-selector`) property.

**Full inline block — paste in `<head>` before widget scripts:**

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

See `references/media-backgrounds.md` for full usage (normalizeMediaConfig, createMediaBackgroundComponent, CSS rules).

---

### ColorTools

Converts a hex color string to an RGB triplet string (e.g. `"#FF0000"` → `"255, 0, 0"`). Useful for CSS `rgba()` values when the user picks a color via a `color` property.

**When to include:** Widget uses a `color` property AND needs `rgba()` transparency (e.g. `rgba(${hexToRGB(textColor)}, 0.8)`).

```html
<script>
function hexToRGB(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}
</script>
```

**Usage:**
```javascript
element.style.color = `rgba(${hexToRGB(textColor)}, 0.9)`;
element.style.backgroundColor = `rgba(${hexToRGB(backgroundColor)}, 0.5)`;
```

---

### DateFormatter

Localized date formatting class. Formats dates in multiple regional styles respecting the user's locale and timezone. Integrates with iCUE's `iCUE.formatUserLocaleDate()` for the system locale format.

**When to include:** Widget displays a date and needs locale-aware formatting or a user-selectable date format.

```html
<script>
class DateFormatter {
  constructor(locale = navigator.language, timeZone, date = new Date()) {
    this.date = new Date(); this.locale = locale; this.timeZone = timeZone;
  }
  pad2(n) { return String(n).padStart(2, "0"); }
  capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
  localize(options) {
    return new Intl.DateTimeFormat(this.locale, { timeZone: this.timeZone, ...options }).format(this.date);
  }
  localizePart(type, value) {
    const options = { timeZone: this.timeZone };
    if (type === "day")     options.day     = value || "numeric";
    else if (type === "month")  options.month   = value || "numeric";
    else if (type === "year")   options.year    = value || "numeric";
    else if (type === "weekday") options.weekday = value || "short";
    const parts = new Intl.DateTimeFormat(this.locale, options).formatToParts(this.date);
    const part = parts.find(p => p.type === type);
    return part ? part.value : "";
  }
  formatDDMMYYYY() {
    return `${this.pad2(this.localizePart("day"))}/${this.pad2(this.localizePart("month","numeric"))}/${this.localizePart("year","numeric")}`;
  }
  formatMMDDYYYY() {
    return `${this.pad2(this.localizePart("month","numeric"))}/${this.pad2(this.localizePart("day"))}/${this.localizePart("year","numeric")}`;
  }
  formatDD_MMM_YY() {
    return `${this.pad2(this.localizePart("day"))} ${this.capitalizeFirst(this.localize({month:"short"}))} ${String(this.localizePart("year","2-digit")).padStart(2,"0")}`;
  }
  formatddd_D_MMM() {
    return `${this.capitalizeFirst(this.localize({weekday:"short"}))} ${this.localizePart("day")} ${this.capitalizeFirst(this.localize({month:"short"}))}`;
  }
  formatdddd_D_MMMM() {
    return `${this.capitalizeFirst(this.localize({weekday:"long"}))} ${this.localizePart("day")} ${this.capitalizeFirst(this.localize({month:"long"}))}`;
  }
  getDateText(dateText = "", lastDay = 0, forceUpdate = false) {
    const nowDate = new Date();
    if (lastDay === nowDate.getDay() && !forceUpdate) return Promise.resolve(undefined);
    this.date = nowDate;
    switch (dateText) {
      case "None":           return Promise.resolve("");
      case "04/05/2020":     return Promise.resolve(this.formatMMDDYYYY());
      case "05/04/2020":     return Promise.resolve(this.formatDDMMYYYY());
      case "05 Apr 20":      return Promise.resolve(this.formatDD_MMM_YY());
      case "Sun 5 Apr":      return Promise.resolve(this.formatddd_D_MMM());
      case "Sunday 5 April": return Promise.resolve(this.formatdddd_D_MMMM());
      case "System":
      default:               return iCUE.formatUserLocaleDate(this.timeZone, this.locale);
    }
  }
}
</script>
```

**Usage:**
```javascript
// Pair with a combobox property for format selection:
// data-options='[{"key":"System","value":"System"},{"key":"05/04/2020","value":"DD/MM/YYYY"},...]'
const df = new DateFormatter(navigator.language, timeZone);
df.getDateText(dateFormat, lastDay).then(text => {
  if (text !== undefined) { dateEl.textContent = text; lastDay = new Date().getDay(); }
});
```

---

### TickerTracker

Horizontally scrolling text ticker. Automatically scrolls text when it overflows the container width; shows it centered when it fits. Scroll speed scales with font size.

**When to include:** Widget displays text that may be longer than the container (song name, notification text, custom messages).

**Requires both JS (inlined) and CSS (inlined):**

```html
<style>
.ticker {
  --gap: 32px; --ticker-text-color: #ffffff; --ticker-text-opacity: 1;
  --font-size: 9vmin; --font-family: OpenSansSemiBold, sans-serif; --font-weight: 600;
  --vertical-align: 30%; --view-max-width: 80vmin;
  position: absolute; top: var(--vertical-align); left: 50%;
  transform: translate(-50%, -50%);
  width: var(--view-max-width); max-width: var(--view-max-width);
  display: flex; align-items: center; overflow: hidden;
  background: transparent; color: var(--ticker-text-color);
  opacity: var(--ticker-text-opacity); font-family: var(--font-family); box-sizing: border-box;
}
.ticker-track {
  display: inline-flex; align-items: center; white-space: nowrap;
  gap: var(--gap); will-change: transform; min-width: 100%;
}
.ticker-item {
  display: inline-block; white-space: nowrap; color: var(--ticker-text-color);
  font-weight: var(--font-weight); font-size: var(--font-size); flex-shrink: 0;
}
.is-scrolling .ticker-track {
  animation: ticker-scroll linear infinite running;
  animation-duration: var(--duration, 10s); justify-content: flex-start;
}
.ticker:hover .ticker-track, .ticker:focus-within .ticker-track { animation-play-state: paused; }
@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(var(--shift) * -1)); } }
.not-scrolling .ticker-track { animation: none; transform: none; justify-content: center; width: 100%; }
.not-scrolling .ticker-item { text-align: center; }
</style>
<script>
window.TickerTracker = (function() {
  "use strict";
  let ticker=null, track=null, textEl=null, isInitialized=false;
  const SETUP_DELAY=100, RESIZE_DEBOUNCE=200, TEXT_UPDATE_DELAY=50;
  function debounce(fn,wait){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>{clearTimeout(t);fn(...a);},wait);};}
  function setupTicker(){
    while(track.children.length>1)track.removeChild(track.lastChild);
    ticker.style.visibility="hidden"; ticker.offsetHeight; ticker.style.visibility="visible";
    const cw=Math.ceil(ticker.clientWidth), tw=Math.ceil(textEl.scrollWidth);
    if(tw<=cw){ticker.classList.remove("is-scrolling");ticker.classList.add("not-scrolling");track.style.removeProperty("--duration");track.style.removeProperty("--shift");track.style.justifyContent="center";return;}
    ticker.classList.remove("not-scrolling"); ticker.classList.add("is-scrolling"); track.style.removeProperty("justify-content");
    const clone=textEl.cloneNode(true); track.appendChild(clone);
    const gap=parseInt(getComputedStyle(track).getPropertyValue("--gap"))||32;
    const shift=tw+gap, fs=parseFloat(getComputedStyle(textEl).fontSize);
    track.style.setProperty("--shift",shift+"px");
    track.style.setProperty("--duration",(shift/(fs*1.5))+"s");
  }
  function init(tickerId,trackId,textId){
    ticker=document.getElementById(tickerId); track=document.getElementById(trackId); textEl=document.getElementById(textId);
    if(!ticker||!track||!textEl)return false;
    window.addEventListener("load",()=>setTimeout(setupTicker,SETUP_DELAY));
    window.addEventListener("resize",debounce(setupTicker,RESIZE_DEBOUNCE));
    isInitialized=true;
    if(document.readyState==="complete")setTimeout(setupTicker,SETUP_DELAY);
    return true;
  }
  function setText(t){if(!isInitialized||!textEl)return false;if(textEl.textContent!==t){textEl.textContent=t;setTimeout(setupTicker,TEXT_UPDATE_DELAY);}return true;}
  function getText(){return(isInitialized&&textEl)?textEl.textContent:"";}
  function recalculate(){if(!isInitialized)return false;setupTicker();return true;}
  function setVerticalAlign(a){
    if(!isInitialized||!ticker)return false;
    const v={top:"10%",center:"50%",middle:"50%",bottom:"90%",header:"15%",footer:"85%"}[a]||(typeof a==="number"?a+"%":a);
    ticker.style.setProperty("--vertical-align",v); return true;
  }
  function isReady(){return isInitialized&&ticker&&track&&textEl;}
  function destroy(){
    window.removeEventListener("load",setupTicker); window.removeEventListener("resize",debounce(setupTicker,RESIZE_DEBOUNCE));
    ticker=track=textEl=null; isInitialized=false; return true;
  }
  return{init,setText,getText,recalculate,setVerticalAlign,isReady,destroy};
})();
</script>
```

**Required HTML structure:**
```html
<div class="ticker" id="ticker" tabindex="0" role="region" aria-live="polite" aria-label="scrolling text">
  <div class="ticker-track" id="tickerTrack">
    <span class="ticker-item" id="tickerText">Text goes here</span>
  </div>
</div>
```

**Usage:**
```javascript
// Initialize once after DOM ready
TickerTracker.init('ticker', 'tickerTrack', 'tickerText');

// Update text whenever it changes
TickerTracker.setText(songName);

// Adjust vertical position
TickerTracker.setVerticalAlign('center'); // or 'top', 'bottom', '40%'
```

---

## Plugin Wrappers (require manifest.json entry)

Plugin wrappers provide Promise-based access to iCUE system data. They all extend `IcueWidgetApiWrapper` — include the base class whenever any plugin wrapper is used.

Officially supported plugins: **Sensors**, **Media**, **Link**. FPS data is available as a sensor type (`"fps"`) via the Sensors plugin — no separate FPS plugin exists.

### How Plugins Work

iCUE injects Qt WebChannel plugin objects into `window.plugins.*` before widget scripts run. The wrapper classes turn the callback-based Qt API into Promises.

**manifest.json entry pattern:**
```json
"required_plugins": [
  "widgetbuilder.sensorsdataprovider:Sensors:1.0"
]
```

**Initialization pattern:**
```javascript
// Plugin objects are available immediately — no need to wait
const api = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider);
```

---

### IcueWidgetApiWrapper (base — always include with any plugin wrapper)

```html
<script>
class IcueWidgetApiWrapper {
  constructor(plugin, timeoutMs = 5000) {
    this.plugin = plugin; this.timeoutMs = timeoutMs;
    this.pendingRequests = new Map(); this.nextRequestId = 0;
    if (this.plugin && this.plugin.asyncResponse)
      this.plugin.asyncResponse.connect(this._handleAsyncResponse.bind(this));
  }
  _nextRequestId() { return this.nextRequestId++; }
  _handleAsyncResponse(requestId, value) {
    const pending = this.pendingRequests.get(requestId);
    if (pending) { clearTimeout(pending.timeoutId); pending.resolve(value); this.pendingRequests.delete(requestId); }
  }
  request(method, ...args) {
    return new Promise((resolve, reject) => {
      const requestId = this._nextRequestId();
      method.call(this.plugin, requestId, ...args);
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) { this.pendingRequests.delete(requestId); reject(new Error("Request timeout")); }
      }, this.timeoutMs);
      this.pendingRequests.set(requestId, { resolve, reject, timeoutId });
    });
  }
}
</script>
```

---

### SimpleSensorApiWrapper

Reads hardware sensor values (CPU/GPU temperature, fan speeds, RAM usage, etc.).

**manifest.json:** `"widgetbuilder.sensorsdataprovider:Sensors:1.0"`

```html
<script>
class SimpleSensorApiWrapper extends IcueWidgetApiWrapper {
  constructor(plugin, timeoutMs = 5000) { super(plugin, timeoutMs); }
  getSensorValue(sensorId)      { return this.request(this.plugin.getSensorValue, sensorId); }
  getSensorUnits(sensorId)      { return this.request(this.plugin.getSensorUnits, sensorId); }
  getSensorName(sensorId)       { return this.request(this.plugin.getSensorName, sensorId); }
  getSensorDeviceName(sensorId) { return this.request(this.plugin.getSensorDeviceName, sensorId); }
  getSensorType(sensorId)       { return this.request(this.plugin.getSensorType, sensorId); }
  getSensorKind(sensorId)       { return this.request(this.plugin.getSensorKind, sensorId); }
  getAllSensorIds()              { return this.request(this.plugin.getAllSensorIds); }
  sensorIsConnected(sensorId)   { return this.request(this.plugin.sensorIsConnected, sensorId); }
}
</script>
```

**Usage:**
```javascript
const sensorApi = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider);
sensorApi.getSensorValue(selectedSensorId).then(value => {
  sensorApi.getSensorUnits(selectedSensorId).then(units => {
    display.textContent = `${parseFloat(value).toFixed(1)} ${units}`;
  });
});
```

**FPS via sensors:** To read current frame rate, find the sensor with type `"fps"` using `getAllSensorIds()` + `getSensorType()`. No separate FPS plugin is needed.

---

### SimpleMediaApiWrapper

Reads currently playing media track info (song name, artist).

**manifest.json:** `"widgetbuilder.mediadataprovider:Media:1.0"`

```html
<script>
class SimpleMediaApiWrapper extends IcueWidgetApiWrapper {
  constructor(plugin, timeoutMs = 5000) { super(plugin, timeoutMs); }
  getSongName() { return this.request(this.plugin.getSongName); }
  getArtist()   { return this.request(this.plugin.getArtist); }
}
</script>
```

**Usage:**
```javascript
const mediaApi = new SimpleMediaApiWrapper(window.plugins.Mediadataprovider);
mediaApi.getSongName().then(name => { songEl.textContent = name || 'Nothing playing'; });
mediaApi.getArtist().then(artist => { artistEl.textContent = artist; });
```

---

### LinkProvider

Opens a URL in the user's default system browser. Without this plugin, links opened from a widget navigate inside the widget's WebEngine view instead of the browser. No wrapper class needed — the API is synchronous.

**manifest.json:** `"widgetbuilder.linkprovider:Url:1.0"`

**Inline snippet — paste in widget script (no `<script>` block needed, just the function):**
```javascript
function openLink(url) {
  if (window.plugins && window.plugins.Linkprovider && pluginLinkprovider_initialized) {
    window.plugins.Linkprovider.open(url);
  } else {
    // Fallback for browser testing outside iCUE
    window.open(url, '_blank');
  }
}
```

**Usage:**
```javascript
document.getElementById('my-link').addEventListener('click', () => openLink('https://example.com'));
```

Note: `pluginLinkprovider_initialized` is set by iCUE before `onICUEInitialized` fires. The `window.open` fallback keeps the widget functional during browser testing.

---

## Phase 1 Questions to Ask the User

During requirements gathering, ask these after the core widget questions:

> **Available iCUE tools & plugins — which do you need?**
>
> **Tools** (no extra setup):
> - **Background Image** — Should users be able to set a custom background image or video with zoom/pan/rotation controls? *(adds MediaViewer + `backgroundImage` property)*
> - **Scrolling Text** — Do you need a text ticker that auto-scrolls when content is too long? *(adds TickerTracker)*
> - **Date Formatting** — Does the widget display dates? Should the format be user-selectable and locale-aware? *(adds DateFormatter)*
> - **Color Utilities** — Do you need `rgba()` transparency from user-picked hex colors? *(adds ColorTools / hexToRGB)*
>
> **Plugins** (require iCUE plugin registration):
> - **Sensor Data** — Should the widget display hardware sensor values (CPU/GPU temp, fan speed, RAM, FPS, etc.)? *(adds SimpleSensorApiWrapper — FPS is a sensor type, no separate plugin needed)*
> - **Now Playing** — Should the widget show the currently playing song/artist? *(adds SimpleMediaApiWrapper)*
> - **Open Links in Browser** — Does the widget have any clickable links that should open in the system browser rather than inside the widget? *(adds LinkProvider)*

When the user confirms a tool or plugin, include its inline code block in `<head>` of the generated `index.html` and add any required `required_plugins` entries to `manifest.json`.
