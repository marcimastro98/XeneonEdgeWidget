# XenonEdge Hub — iCUE SDK Technical Notes for Corsair Review

**Widget ID:** `com.marcimastro98.xenonedgehub`  
**Author:** marcimastro98  
**SDK API version:** 1.0.1  
**Target device:** `dashboard_lcd` (Corsair Xeneon Edge 14.5")  
**Date:** 2026-05-02 (last revised 2026-05-02)

---

## 1. Widget Purpose and Architecture Overview

XenonEdge Hub is an all-in-one dashboard widget for the Xeneon Edge 14.5" LCD. It displays:
- Real-time hardware sensors (CPU, GPU, RAM, disk, network)
- Now-playing media info with transport controls
- Microphone mute state and audio volume
- A full calendar with event management and reminder notifications
- Sticky notes
- System uptime and clock

The **companion web dashboard** (served at `localhost:3030`) additionally supports: one-tap screen lock, app-switcher (window enumeration + focus), and custom keyboard shortcut buttons. These features require OS-level APIs not available in the iCUE widget sandbox (see §3.8, §3.9, §3.10).

The widget uses a **hybrid data model**: the iCUE SDK provides sensor values and basic media info; a **companion Node.js server** (`http://localhost:3030`, optional) enriches the experience with features the SDK does not expose. All panels degrade gracefully when the server is offline — they show a disabled overlay and, where relevant, a `ms-settings:` deep link as fallback.

```
┌──────────────────────────────────────────────────────────────────┐
│                        XenonEdge Hub Widget                       │
│                                                                   │
│  iCUE SDK (always)           Local Server (optional, :3030)       │
│  ─────────────────           ───────────────────────────────────  │
│  • Sensor values (load,      • Mic mute state + volume control    │
│    temp, fan, etc.)          • Speaker volume + mute              │
│  • Media title / artist      • Album art (thumbnail)              │
│  • Media transport           • Playback status (play/paused)      │
│    (play/pause/next/prev)    • Current app name                   │
│  • Appearance properties     • Network throughput (up/down)       │
│  • Link opening              • Disk usage (all drives)            │
│                              • System uptime                      │
│                              • Screen lock (LockWorkStation)      │
│                              • App switcher + window focus        │
│                              • Custom keyboard shortcuts          │
│                                                                   │
│  Always offline (no SDK/server needed)                            │
│  ─────────────────────────────────────────────────────────────   │
│  • Calendar + events (localStorage)                               │
│  • Notes (localStorage)                                           │
│  • Clock + appearance settings                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. SDK Capabilities Used Successfully

The following SDK features work as documented and power the widget in fully offline (server-less) mode:

### 2.1 Sensorsdataprovider (via `SimpleSensorApiWrapper`)

| Feature | Status | Notes |
|---|---|---|
| `sensors-combobox` property type | ✅ Works | User selects sensor IDs per panel in widget settings |
| `getDefaultSensorIdBlock('load')` | ✅ Works | Valid types: `load`, `temperature`, `fan`, `voltage`, `current`, `power`, `pump`, `battery-charge`, `fps`, `cas-latency` |
| `sensorValueChanged` event | ✅ Works | Used for live updates — no polling required |
| `getSensorValue(id)` async | ✅ Works | Used for initial value fetch on binding |
| `getDeviceName(id)` async | ✅ Works | Used to display "Intel Core i9-..." labels |

### 2.2 Mediadataprovider (via `SimpleMediaApiWrapper`)

| Feature | Status | Notes |
|---|---|---|
| `getSongName()` | ✅ Works | Returns current track title |
| `getArtist()` | ✅ Works | Returns current artist |
| `triggerPlayPause()` | ✅ Works | Sends play/pause to media player |
| `triggerNextTrack()` | ✅ Works | Sends skip-next |
| `triggerPreviousTrack()` | ✅ Works | Sends skip-previous |

### 2.3 Linkprovider

| Feature | Status | Notes |
|---|---|---|
| `open(url)` | ✅ Works | Opens URLs and `ms-settings:*` deep links |

### 2.4 Property types

All of the following `data-type` values were validated and work correctly at runtime:

`color`, `slider`, `switch`, `textfield`, `media-selector`, `sensors-combobox`

---

## 3. SDK Gaps — What Is Not Possible with the SDK Alone

These are features we attempted or designed for, hit a wall, and had to work around.
Each entry includes the consequence and the workaround implemented.

---

### 3.1 No Playback Status API

**Gap:** The Mediadataprovider has no method to query whether the player is currently playing or paused. There is no `getPlaybackStatus()`, no `isPlaying()`, and no event fired when the state changes.

**Consequence:** The widget cannot know if the user manually paused from outside (e.g., keyboard shortcut, another app). The play/pause button icon is always inferred, never authoritative.

**Workaround implemented:**
- When `getSongName()` and `getArtist()` both return non-empty strings → assume `Playing`.
- When both return empty → assume `Paused` / no media.
- After `triggerPlayPause()`, toggle the local state optimistically.
- When the companion server is online, `/media` endpoint returns the actual `status` field from Windows Media Session API, which is authoritative.

**Feature request:** Add a `getPlaybackStatus()` method (or a `playbackStatusChanged` signal) to `SimpleMediaApiWrapper`. The underlying Windows `GlobalSystemMediaTransportControlsSession` exposes `PlaybackStatus` — this is available to Corsair's existing Windows integration.

---

### 3.2 No Album Art / Thumbnail API

**Gap:** The Mediadataprovider has no method to retrieve album artwork or any media thumbnail.

**Consequence:** The widget cannot show album art in iCUE-only mode.

**Workaround implemented:**
- Show an animated equalizer placeholder when no thumbnail is available.
- When the companion server is online, the `/media` endpoint fetches the thumbnail from Windows `GlobalSystemMediaTransportControls` (base64-encoded) and returns it.
- Album art is shown only when the server is reachable.

**Feature request:** Add a `getThumbnail()` method that returns a base64-encoded image or a `file://` path to a cached thumbnail. This is readily available via `GlobalSystemMediaTransportControlsSession.TryGetMediaPropertiesAsync().Thumbnail`.

---

### 3.3 No Current App / Source Name API

**Gap:** The Mediadataprovider has no way to identify which application is producing the currently-playing media (e.g., "Spotify", "YouTube", "Chrome").

**Consequence:** The "App" label in the media panel always shows a generic "Media" text in iCUE-only mode.

**Workaround implemented:**
- Companion server reads `GlobalSystemMediaTransportControlsSession.SourceAppUserModelId` and returns it in the `/media` response.

---

### 3.4 No Audio Device / Volume API

**Gap:** There is no Corsair SDK plugin for:
- Querying or setting microphone mute state
- Querying or setting microphone volume
- Querying or setting speaker/output volume
- Querying or setting speaker mute state
- Enumerating audio devices

**Consequence:** The entire audio and microphone section of the widget is **fully non-functional** in iCUE-only mode. The panel renders its buttons and sliders, but none of them perform any actual audio operation. The only action available is opening `ms-settings:sound` via `Linkprovider.open()`, which is a passive link — it opens the Windows Sound settings page in the background and does nothing to the audio state itself.

Specifically, the following features are **completely unavailable** without the companion server:
- Reading microphone mute state (the icon is always indeterminate)
- Toggling microphone mute
- Reading or changing microphone volume
- Reading or changing speaker volume
- Muting/unmuting the speaker
- Listing or switching between audio devices (microphone and speaker)

**Workaround implemented:**
- Companion server exposes: `/status` (mic mute state), `/toggle` (toggle mic mute), `/audio` (all current volumes), `/mic/volume` (set mic volume), `/volume/set` (set speaker volume), `/speaker/mute` (toggle speaker mute), audio device picker endpoints.
- All of these call Windows Core Audio (`IAudioEndpointVolume`, `IMMDeviceEnumerator`) through Node.js native bindings.
- When the server is offline, the audio panel shows a "Server required" overlay with a link that opens `ms-settings:sound`. This is purely informational — it does not give the user any control.

**Feature request:** Add an `Audiodataprovider` plugin with:
- `getMicMuted(): boolean`
- `setMicMuted(muted: boolean): void`
- `getMicVolume(): number` (0–100)
- `setMicVolume(level: number): void`
- `getSpeakerVolume(): number`
- `setSpeakerVolume(level: number): void`
- `getSpeakerMuted(): boolean`
- `setSpeakerMuted(muted: boolean): void`
- `getDefaultMicName(): string`
- `getDefaultSpeakerName(): string`

The Windows Core Audio (`IAudioEndpointVolume`) and MMDevice APIs are well-supported and already in use by iCUE for its own audio features.

---

### 3.5 No Network Throughput Sensor Type

**Gap:** The `sensors-combobox` property type does not include a `throughput` type in `getDefaultSensorIdBlock()`. Valid types are: `load`, `temperature`, `fan`, `voltage`, `current`, `power`, `pump`, `battery-charge`, `fps`, `cas-latency` — none of these maps to network upload/download speed.

**Consequence:** Network throughput sensors cannot be auto-defaulted. Users must find and manually select the correct sensor ID from the combobox, which is not obvious.

**Workaround implemented:**
- `data-default="''"` for the `netUploadSensor` and `netDownloadSensor` properties (empty default — user must configure).
- When the companion server is online, network throughput is read from `os.networkInterfaces()` and differential measurements instead, bypassing the SDK sensor entirely.

**Feature request:** Add `'throughput'` or `'network'` as a valid type for `getDefaultSensorIdBlock()`, since network adapters are already present as sensor sources in iCUE's hardware monitor.

---

### 3.6 No RAM Utilization Sensor Type

**Gap:** There is no sensor type that maps to RAM utilization (percentage of RAM in use). The available types (`load`, `temperature`, `fan`, `voltage`, `current`, `power`, `pump`, `battery-charge`, `fps`, `cas-latency`) do not include memory load.

**Observed:** On the test system (Windows 11, DDR5), the iCUE hardware monitor shows RAM speed (MHz) and RAM temperature sensors but no percentage-utilization sensor for memory. The `load` type auto-selects a CPU or GPU load sensor, never a RAM utilization value.

**Consequence:** The `ramLoadSensor` combobox has `data-default="''"` (empty). Users must find and manually select the correct sensor — if one even exists for their hardware configuration. In practice, most users will see the RAM panel showing `--` until they configure it or until the companion server is online (which reads `os.totalmem()` / `os.freemem()` directly).

**Workaround:** Companion server reads `os.totalmem()` and `os.freemem()` and computes usage percentage. This is the primary RAM utilization source.

**Feature request:** Add `'memory'` or `'ram-utilization'` as a valid type for `getDefaultSensorIdBlock()`, or provide a dedicated property that reads available/used memory without requiring a sensor.

---

### 3.7 No GPU VRAM Utilization Default Sensor

**Gap:** GPU VRAM load (video memory usage percentage) is exposed in iCUE's hardware monitor as a sensor (observed: "NVIDIA GeForce RTX 5080 GPU Carico di memoria"), but there is no sensor type to auto-default it via `getDefaultSensorIdBlock()`.

**Consequence:** The `gpuMemLoadSensor` combobox defaults to empty. Users must manually select the VRAM sensor from a long sensor list.

**Workaround:** `data-default="''"`. The `gpu-vram-value` detail line in the GPU panel shows "VRAM --" until the user configures the sensor.

**Feature request:** Add `'gpu-memory'` or `'vram'` as a valid type for `getDefaultSensorIdBlock()`.

---

### 3.8 No App Launcher / Window Enumeration / Focus API

**Gap:** There is no SDK method to:
- Enumerate currently running applications or open windows
- Launch a local executable by path
- Focus or bring a running window to the foreground (equivalent to Alt+Tab navigation)

**Consequence:**
- An **app switcher** panel (show open windows, click to focus — like Alt+Tab) is not implementable. On the companion server this works via `GET /windows` (Win32 `EnumWindows`) and `POST /windows/focus` (`SetForegroundWindow`), but there is no equivalent in the widget sandbox.
- A **quick-launch panel** (click to open Spotify, VS Code, etc.) cannot open executables — only URLs and `ms-settings:*` deep links are available via `Linkprovider`.
- **Alt+Tab style navigation** from the widget is impossible in iCUE-only mode.

**How it works in the companion server:**
- `GET /windows` returns a list of all open windows with app name, title, icon, and preview thumbnail.
- `POST /windows/focus` calls `SetForegroundWindow(hwnd)` to switch to a specific window.
- The web widget renders a scrollable app-switcher panel with clickable window cards and a "favorites" quick bar.

**Workaround in iCUE widget:** Not implemented — excluded from iCUE widget scope. The feature requires OS-level process enumeration and Win32 window management calls that are not available from a sandboxed WebView.

**Feature request:** Add a `Launchprovider` plugin with:
- `launch(path: string): void` — open a local executable
- `getOpenWindows(): Promise<WindowInfo[]>` — enumerate open windows
- `focusWindow(id: string): void` — bring a window to the foreground

---

### 3.9 No Screen Lock API

**Gap:** There is no SDK method to lock the Windows session (equivalent to Win+L or `rundll32.exe user32.dll,LockWorkStation`).

**Consequence:** The one-tap screen lock button, which is a top-bar feature in the companion web widget, cannot be implemented in the iCUE widget sandbox. The widget cannot execute processes or make Win32 API calls.

**How it works in the companion server:** The web widget has a lock button in the top bar (`qbtn-lock`). On click, it calls `POST /lock` on the local server, which executes:
```js
exec('rundll32.exe user32.dll,LockWorkStation', ...)
```
This immediately locks the Windows session. The feature is fully functional in the server version.

**Workaround in iCUE widget:** `Linkprovider.open('ms-settings:lockscreen')` opens the Lock Screen settings page — it does **not** lock the session. There is no usable fallback; the feature must be omitted from the iCUE widget version.

**Feature request:** Add a `SystemProvider` plugin (or extend `Linkprovider`) with:
- `lockScreen(): void` — locks the current Windows session
- Optionally: `sleep(): void`, `shutdown(): void`, `restart(): void`

The underlying Win32 call (`LockWorkStation`) is trivial and poses no security risk beyond what iCUE already does with its lighting and device control capabilities.

---

### 3.10 No Keyboard Shortcut / SendKeys API

**Gap:** There is no SDK method to inject keyboard input into the OS — no equivalent of `SendKeys`, `SendInput`, or `keybd_event`. It is not possible to programmatically press a key combination (e.g., Ctrl+Shift+S, Win+D) from within the widget sandbox.

**Consequence:** A **custom shortcuts panel** — where users define labeled buttons that fire arbitrary key combinations — is not implementable in the iCUE widget. On the companion server this is implemented via `POST /shortcut`, which uses a native Node.js addon or `robotjs` to call `SendInput()` with the requested key sequence. The web widget exposes a full shortcut builder UI (label, key combo recorder, color picker) that renders as colored quick-action buttons in the toolbar.

**How it works in the companion server:**
- User defines shortcuts in the web widget UI (e.g., label "Mute Discord", keys `Ctrl+Shift+M`).
- Shortcut data is persisted in `localStorage`.
- On button press, the widget calls `POST /shortcut` with the key combo.
- The server calls `SendInput()` / `robotjs.keyTap()` to fire the keystrokes system-wide, regardless of which application is in focus.

**Workaround in iCUE widget:** Not implemented. The `apps.js` module exists in the project structure but is not loaded in the iCUE widget's `index.html` because keyboard injection requires the companion server. A partial version (bookmarks/`ms-settings:*` links only) is a future candidate.

**Feature request:** Add a `KeyboardProvider` plugin or extend `Linkprovider` with:
- `sendKeys(combo: string): void` — fires a key combination OS-wide (e.g., `"ctrl+shift+m"`)

This would enable macro/shortcut buttons directly from a widget without requiring a companion process.

---

## 4. Technical Constraints Discovered During Development

These are implementation-level constraints not documented in the official spec that required non-obvious workarounds.

---

### 4.0 `getDefaultSensorIdBlock()` Returns the Same Sensor ID for All Fields of the Same Type

**What happens:** When multiple `sensors-combobox` properties all use `data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('load')"`, they all resolve to the **same sensor ID** — the single "best match" iCUE finds for that category. There is no round-robin or per-field differentiation.

**Example observed on the test system:**

| Property | Configured default type | Actual sensor assigned |
|---|---|---|
| `cpuLoadSensor` | `'load'` | NVIDIA GeForce RTX 5080 GPU Carico #1 (GPU load!) |
| `gpuLoadSensor` | `'load'` | NVIDIA GeForce RTX 5080 GPU Carico #1 (same) |
| `cpuTempSensor` | `'temperature'` | VENGEANCE RGB DD...5 Temperatura #1 (RAM temp!) |
| `gpuTempSensor` | `'temperature'` | VENGEANCE RGB DD...5 Temperatura #1 (same) |

The "best match" iCUE selects depends on hardware and sensor order in the iCUE database — it may not be what the label implies. On this system, the default temperature sensor was a DDR5 module rather than the CPU or GPU.

**Consequence:** Out-of-the-box, the CPU panel might show GPU load, and both temperature panels might show RAM temperature. Users must manually correct each sensor in widget settings.

**Fix applied:** We set `data-default="''"` for `ramLoadSensor` (no RAM utilization sensor exists anyway) and `gpuMemLoadSensor`. For the core CPU/GPU load and temp sensors, we keep `getDefaultSensorIdBlock` defaults since there is no better API, but we document that manual reconfiguration is expected.

**Feature request:** Add typed overloads that hint at the target device, e.g.:
- `getDefaultSensorIdBlock('load', 'cpu')` → CPU load
- `getDefaultSensorIdBlock('load', 'gpu')` → GPU load
- `getDefaultSensorIdBlock('temperature', 'cpu')` → CPU temp
- `getDefaultSensorIdBlock('temperature', 'gpu')` → GPU temp

This would dramatically improve first-run experience without requiring manual configuration.

---

### 4.1 V4 JS Engine Evaluates Inline `<head>` Scripts Before Settings Groups

**What happens:** iCUE uses a Qt V4 JavaScript engine (separate from Chromium/V8) to evaluate widget settings groups. Before evaluating `data-default`, `data-label`, and `x-icue-groups` expressions, the V4 engine parses and executes **all inline `<script>` tags in `<head>`**.

**Observed error:**  
```
cue.js.executor: JS error: "SyntaxError: Expected token ','"
```
This appeared immediately after validation (within 9ms), before the settings groups phase even started.

**Root cause:** Our inline `MediaViewer` class in `<head>` used ES6 default parameters:
```js
constructor(options = {})   // causes SyntaxError in V4
applyTransform(params = {}) // causes SyntaxError in V4
loadMedia(params = {})      // causes SyntaxError in V4
```
The V4 engine does not support ES6 default parameter syntax. When parsing a parameter list, it expects either `,` (next parameter) or `)` (end), not `=`. The `SyntaxError: Expected token ','` is V4's way of reporting this.

Additionally, template literals (`` `translate(${x}px)` ``) were replaced with string concatenation as a precaution.

**Fix applied — all three ES6 patterns removed from inline `<head>` scripts:**

1. Default parameters → manual fallback:
```js
// Before:
constructor(options = {}) { ... }
applyTransform(params = {}) { ... }
loadMedia(params = {}) { ... }
// After:
constructor(options) { options = options || {}; ... }
```

2. Rest parameters + spread → explicit two-param signatures:
```js
// Before:
log(...a)   { if (this.debug) console.log('[MediaViewer]', ...a); }
warn(...a)  { if (this.debug) console.warn('[MediaViewer]', ...a); }
error(...a) { console.error('[MediaViewer]', ...a); }
// After:
log(a, b)   { if (this.debug) console.log('[MediaViewer]', a, b); }
warn(a, b)  { if (this.debug) console.warn('[MediaViewer]', a, b); }
error(a, b) { console.error('[MediaViewer]', a, b); }
```

3. Template literals → string concatenation:
```js
// Before: `translate(${x}px, ${y}px)`
// After:  'translate(' + x + 'px, ' + y + 'px)'
```

**Why this is hard to find:** The `icuewidget validate` CLI does not run the settings groups phase — it only checks file structure and manifest. The error only surfaces at iCUE runtime, and iCUE silently deletes the widget folder as a consequence, making the symptom (import fails) appear unrelated to its cause.

**Official widget pattern:** Official Corsair widgets (Weather, Sensor, MediaSession, Calendar) avoid this entirely by loading MediaViewer from an **external file** (`../common/tools/media_viewer/MediaViewer.js`) that the V4 engine does not evaluate. Third-party widgets that bundle MediaViewer inline must ensure no default parameters or unsupported syntax.

**Recommendation for documentation:** Add a note to the Widget Builder docs clarifying that all inline `<script>` tags in `<head>` are evaluated by the V4 engine during settings initialization, not by Chromium. ES2020+ syntax (`?.`, `??`) is unsupported, and ES6 default parameters cause `SyntaxError: Expected token ','`.

---

### 4.2 Import Dialog Error Diagnostic Chain — "File not supported or corrupted" Masks Other Failures

**What happens:** The iCUE import dialog returns the generic error "File not supported or corrupted" (`File non supportato o danneggiato`) as a catch-all for multiple different failure types. This error is shown both when the zip file itself is malformed AND when the widget inside fails settings groups validation.

**The actual cascade we experienced:**

1. **Initial state** (V4 syntax errors present): Import dialog opens zip → V4 engine evaluates inline `<head>` scripts → throws `SyntaxError: Expected token ','` → import reports "File not supported or corrupted".

2. **After V4 fix** (default parameters removed): Import dialog opens zip → V4 evaluation succeeds → `html_parser` looks for `index.html` at zip root → **found** → import proceeds correctly.

The log trace that helped identify stage 2:
```
10:42:17.607 W cue.mod.widgets.html_parser: Widget file is missing: index.html
```
This appeared only after the V4 fix was applied (using a zip with a wrong subfolder structure added as an earlier false fix). Removing the subfolder resolved it.

**Correct zip structure** (flat, files at root — produced by `icuewidget package` by default):
```
manifest.json
index.html
styles/main.css
modules/app.js
...
```

**False lead documented:** At an earlier stage, before the V4 fix, we mistakenly added a `repackWithSubfolder()` step to our packager believing the subfolder was required. Log evidence later showed the flat structure is correct and the subfolder causes `html_parser: Widget file is missing: index.html`. That step has been removed.

**Recommendation:** The import dialog should return distinct error messages for:
- Malformed zip → "File not supported or corrupted" (current, appropriate)
- Widget JS validation failure → "Widget settings could not be loaded — check JS syntax"
- Missing `index.html` → "Widget package is missing index.html"

Collapsing all three into the same error message blocks developers from diagnosing the root cause.

---

### 4.3 `icuewidget validate` Does Not Validate Settings Groups JavaScript

**What happens:** The `icuewidget validate` CLI reports `Validation passed` for widgets whose `data-default` expressions or inline scripts cause a runtime `SyntaxError` in V4.

**Consequence:** A widget that passes CLI validation can still fail at iCUE runtime, causing silent deletion of the widget folder with no user-facing error message.

**Recommendation:** The CLI validator should run the same V4-based settings groups evaluation phase that the runtime uses, so developers get actionable errors during `npm run build` / `icuewidget validate` rather than discovering silent failures at install time.

---

### 4.4 `media-selector` Property Does Not Accept `data-default`

**Observed behavior:** All official Corsair widgets that use `data-type="media-selector"` omit `data-default`. Adding `data-default="''"` works at validation but may behave unexpectedly at runtime (unverified).

**Recommendation:** Document whether `data-default` is valid for `media-selector`. If it is not supported, `icuewidget validate` should warn when it is present.

---

### 4.5 `data-filters` Is a Required Attribute for `media-selector`

**What happens:** Omitting `data-filters` on a `data-type="media-selector"` property causes `icuewidget validate` to fail with:
```
Missing attribute: "data-filters"
```

**This is not documented** in the Widget Builder specification (as of SDK 1.0.1). The attribute is effectively required but not listed in the required attributes table.

**Fix applied:** Added `data-filters` with the standard Corsair glob patterns:
```html
data-filters="['*.webm', '*.mp4', '*.mkv', '*.gif', '*.png', '*.jpg', '*.jpeg', '*.bmp', '*.ico']"
```

**Recommendation:** Add `data-filters` to the required attributes table for `media-selector` in the Widget Builder documentation.

---

### 4.6 Widget Folder Silently Deleted on Settings Groups Failure

**What happens:** When the V4 engine throws any error during settings groups evaluation, iCUE:
1. Logs the error to `%LOCALAPPDATA%\Corsair\Logs\CUE5\*.log` as `cue.js.executor: JS error`
2. Waits ~5 minutes
3. Logs `cue.mod.widgets.html_registry: Removing widget folder "..."`
4. Deletes the entire `html_widgets/<widget-id>/` directory

**Consequence:** The widget disappears silently. There is no error dialog, no notification, no way for the user to know what happened. The next iCUE restart finds no widget folder and does not re-import it.

**Recommendation:** Show a user-facing error notification ("Widget could not be loaded — see logs") instead of silently deleting the folder. Preserve the folder and mark the widget as "incompatible" so the user can take action.

---

### 4.7 Calendar Reminders — In-Widget Toast Works; Desktop Notifications Are Best-Effort

**What is implemented:** The widget includes a full event/reminder engine in `modules/calendar.js`. Events are persisted in `localStorage`. When a reminder's scheduled time arrives, the engine (polled every 30 seconds via `setInterval`):
1. Shows an in-widget slide-up toast at the bottom of the display with the event title and time.
2. Plays a two-tone chime via the **Web Audio API** (`AudioContext` oscillator — no external file required).
3. Attempts a browser-style `new Notification(title, { body, requireInteraction: true })` for a desktop notification.

**What works reliably:** The in-widget toast is guaranteed to fire as long as iCUE is running with the widget loaded. The toast is fully implemented and tested.

**What is uncertain:**
- **Web Audio API in iCUE's WebView**: `AudioContext` is a Chromium API. Most Chromium-based environments allow audio from timers/intervals as long as the page has received at least one prior user gesture. If the WebView has never received a pointer event, the AudioContext may be suspended and the chime will not play. The code falls back silently (`try/catch`); the toast still shows.
- **`Notification` API in iCUE's WebView**: iCUE uses a Chromium-based WebView. Whether `Notification.requestPermission()` succeeds and whether desktop notifications actually appear as OS-level notifications in this sandboxed context has not been confirmed. The code tries it, catches any failure silently, and falls back to the in-widget toast.
- **Widget must be active**: Reminders only fire while iCUE is running AND the widget is loaded. If iCUE is closed, no reminder will trigger — there is no background process that can fire notifications independently of iCUE.

**Recommendation:** A native `pushNotification(title, body)` method in the SDK would allow widgets to fire OS-level notifications through iCUE's own notification system, which has the correct process permissions and could persist across widget unloads.

---

### 4.8 `user-select: none` on `<body>` Blocks Keyboard Input in Qt WebEngine

**What happens:** Setting `user-select: none` (or `-webkit-user-select: none`) on `html` or `body` is standard practice in widget UIs to prevent accidental text selection on drag/tap. However, in Qt WebEngine (the rendering engine used by iCUE), this CSS property **cascades into form fields** (`<input>`, `<textarea>`) and silently disables keyboard input — the fields receive focus and click events, but typed characters are never inserted.

**Symptom:** Clicking on any text input or textarea in the widget appears to focus it (cursor may blink), but typing on the keyboard has no effect. The field stays empty.

**Root cause:** Unlike standard desktop Chrome, Qt WebEngine does not automatically override the inherited `user-select: none` for editable form elements. The restriction propagates all the way down, including to elements that should inherently accept text.

**Fix applied in `widget/styles/main.css`:**
```css
/* Restore keyboard input for all form fields, overriding body's user-select: none */
input, textarea { outline: none; -webkit-user-select: text; user-select: text; }
```

The `-webkit-` prefix is needed because Qt WebEngine uses a WebKit-derived rendering pipeline even though it is Chromium-based.

**Note for other widget developers:** If your widget uses `user-select: none` on a high-level element (common for preventing selection in drag UI or touchscreen-style widgets), always add `user-select: text` explicitly to any `<input>`, `<textarea>`, or `[contenteditable]` element. Do not rely on the browser's automatic override — Qt WebEngine does not apply it.

---

### 4.9 Qt WebEngine Blocks `fetch()` and `XMLHttpRequest` from Local Widget Pages

**What happens:** iCUE loads widget HTML as a local resource. Qt WebEngine defaults to `LocalContentCanAccessRemoteUrls = false`, which **silently blocks all `fetch()` and `XMLHttpRequest` calls** to any URL — including `http://127.0.0.1:3030` — even with correct CORS headers on the target server. Unlike standard browser CORS behavior, the request is never sent; `fetch()` silently times out with no indication it was blocked rather than unreachable.

**Related server-side finding:** Qt WebEngine also sends `Origin: null` (opaque origin) for requests from local HTML files. If the companion server's CORS validation calls `new URL("null")` to parse that origin, it throws and the server returns 403. Fix: treat `origin === 'null'` as a valid loopback origin.

**Root cause confirmation:** Opening `http://127.0.0.1:3030/status` in standard Chrome returned `{"muted": false}` correctly — the server was running fine. The failure was exclusively inside the widget WebView.

**Workarounds implemented:**

1. **Connectivity probe** — replaced `fetch('/ping')` with an `Image()` subresource load, which uses a different Qt code path and is not subject to the restriction. The server returns a 1×1 transparent GIF at `/ping`.
2. **Data reads** — replaced all `fetch()` GET calls with **JSONP** (dynamic `<script>` tag injection). The server wraps every JSON response in a callback when `?cb=<name>` is present in the request URL.
3. **Write/action endpoints** — converted all previously POST-only endpoints to also accept `GET` with query parameters (e.g., `GET /toggle`, `GET /volume/set?level=75`, `GET /events?save=1&data=…`) so JSONP covers the full API surface.

**Server additions required for this workaround:**
- `/ping` endpoint returning a `1×1` transparent GIF
- `?cb=<name>` JSONP wrapper on all JSON responses
- `GET` method support on all action/write endpoints
- `Origin: null` accepted as a valid loopback origin in CORS validation
- `Access-Control-Allow-Private-Network: true` header (Chrome 104+ Private Network Access spec requirement)

**Recommendation for Corsair:** Document that `LocalContentCanAccessRemoteUrls = false` blocks `fetch()` / XHR from widget pages and provide an official communication channel for companion-process integrations — either a `LocalFetchProvider` plugin that allows opt-in loopback requests, or document the JSONP pattern as the recommended workaround so developers are not left debugging silent failures.

---

## 5. Summary Table — SDK Gaps and Feature Requests

| Missing Feature | Impact | Suggested Plugin / Method |
|---|---|---|
| Playback status (playing/paused) | Cannot show authoritative play/pause icon in SDK-only mode | `Mediadataprovider.getPlaybackStatus()` or `playbackStatusChanged` signal |
| Album art / thumbnail | No artwork in SDK-only mode | `Mediadataprovider.getThumbnail()` returning base64 or file path |
| Current media source app name | Cannot identify player app | `Mediadataprovider.getSourceAppName()` |
| Mic mute / volume | Entire mic section disabled without server | New `Audiodataprovider` plugin |
| Speaker volume / mute | Entire audio section disabled without server | New `Audiodataprovider` plugin |
| Default audio device names | Cannot label inputs/outputs | `Audiodataprovider.getDefaultMicName()`, `getDefaultSpeakerName()` |
| Network throughput sensor type | Network panel requires server | `getDefaultSensorIdBlock('throughput')` |
| RAM utilization sensor type | RAM panel always `--` in SDK-only mode | `getDefaultSensorIdBlock('memory')` or dedicated memory API |
| GPU VRAM load default | VRAM panel always `--` until manually configured | `getDefaultSensorIdBlock('gpu-memory')` or `'vram'` |
| Per-device sensor defaults | All same-type sensors share one default — wrong first-run values | `getDefaultSensorIdBlock(type, device)` typed overload |
| App launch / open executable | No quick-launch panel possible | New `Launchprovider` plugin with `launch(path)` |
| Window enumeration + focus (Alt+Tab) | No app-switcher panel; cannot bring window to foreground | `Launchprovider.getOpenWindows()` + `focusWindow(id)` |
| Keyboard shortcut injection | Custom macro/shortcut buttons not possible | New `KeyboardProvider` plugin with `sendKeys(combo)` |
| Screen lock | Lock button omitted from iCUE version; `ms-settings:lockscreen` does not lock the session | New `SystemProvider` plugin with `lockScreen()` |
| Reliable push notifications | Desktop reminders unverified in sandboxed WebView | Native `pushNotification(title, body)` in SDK |
| Reminder audio chime | Web Audio API attempted; may be silenced if no prior user gesture | Native `playNotificationSound()` or permission bypass for trusted widgets |

---

## 6. Toolchain Issues Summary

| Issue | Severity | Status |
|---|---|---|
| Import dialog returns same generic error for JS failures AND structural errors | High — impossible to diagnose root cause | Document each failure mode |
| `icuewidget validate` does not run V4 settings groups evaluation | High — hides runtime errors | No workaround; need CLI fix |
| V4 evaluates inline `<head>` scripts — ES6 default params unsupported | High — silent widget deletion | Fixed by replacing default params |
| `data-filters` required but undocumented for `media-selector` | Medium — blocks validation | Fixed; needs doc update |
| Widget folder silently deleted on V4 error | High — no UX feedback | Needs runtime fix from Corsair |
| `user-select: none` on body disables form input in Qt WebEngine | Medium — all text inputs break silently | Fixed: `user-select: text` on `input, textarea` in CSS |
| Qt WebEngine blocks `fetch()` / XHR from local pages (`LocalContentCanAccessRemoteUrls = false`) | High — companion server unreachable via all standard HTTP mechanisms | Workaround: Image ping + JSONP + GET-based write endpoints |
| `Origin: null` from widget pages causes CORS 403 on companion servers | High — all server responses rejected | Fixed: treat `origin === 'null'` as valid loopback origin |

---

## 7. Development Environment

- **OS:** Windows 11 Pro 10.0.26200
- **iCUE version:** iCUE 5 (CUE5)
- **icuewidget CLI:** v0.2.3
- **SDK API version target:** 1.0.1
- **Plugin wrappers used:** `IcueWidgetApiWrapper.js`, `SimpleSensorApiWrapper.js`, `SimpleMediaApiWrapper.js` (official Corsair vendored copies)
- **Companion server:** Node.js 20, `server/server.js`, runs as a Windows startup task

---

*This document was written based on direct implementation experience building XenonEdge Hub for the Xeneon Edge 14.5". All SDK gaps and toolchain issues listed here were encountered and verified in a live iCUE 5 environment.*
