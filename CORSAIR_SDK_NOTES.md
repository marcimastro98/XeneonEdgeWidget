# XenonEdge Hub — iCUE SDK Technical Notes for Corsair Review

**Widget ID:** `com.marcimastro98.xenonedgehub`  
**Author:** marcimastro98  
**SDK API version:** 1.0.1  
**Target device:** `dashboard_lcd` (Corsair Xeneon Edge 14.5")  
**Date:** 2026-05-02

---

## 1. Widget Purpose and Architecture Overview

XenonEdge Hub is an all-in-one dashboard widget for the Xeneon Edge 14.5" LCD. It displays:
- Real-time hardware sensors (CPU, GPU, RAM, disk, network)
- Now-playing media info with transport controls
- Microphone mute state and audio volume
- A full calendar with event management
- Sticky notes
- System uptime and clock

The widget uses a **hybrid data model**: the iCUE SDK provides sensor values and basic media info; a **companion Node.js server** (`http://localhost:3030`, optional) enriches the experience with features the SDK does not expose. All panels degrade gracefully when the server is offline — they show a disabled overlay and, where relevant, a `ms-settings:` deep link as fallback.

```
┌─────────────────────────────────────────────────────────────────┐
│                       XenonEdge Hub Widget                       │
│                                                                  │
│  iCUE SDK (always)          Local Server (optional, :3030)       │
│  ─────────────────          ───────────────────────────────────  │
│  • Sensor values (load,     • Mic mute state + volume control    │
│    temp, fan, etc.)         • Speaker volume + mute              │
│  • Media title / artist     • Album art (thumbnail)              │
│  • Media transport          • Playback status (play/paused)      │
│    (play/pause/next/prev)   • Current app name                   │
│  • Appearance properties    • Network throughput (up/down)       │
│  • Link opening             • Disk usage (all drives)            │
│                             • System uptime                      │
└─────────────────────────────────────────────────────────────────┘
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

**Consequence:** The entire mic-mute and audio-volume section of the widget cannot function in iCUE-only mode.

**Workaround implemented:**
- Companion server uses the Windows Core Audio API (via the `node-speaker-volume` / `naudiodon` / `win-audio` Node.js packages) to expose `/status` (mic mute), `/toggle` (toggle mic mute), `/audio` (all volumes), `/mic/volume`, `/volume/set`, `/speaker/mute`.
- When the server is offline, the mic panel shows a "Server required" overlay. Tapping the button opens `ms-settings:sound` via `Linkprovider.open()` as a fallback.

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

### 3.6 No App Launcher / Window Enumeration API

**Gap:** There is no SDK method to enumerate running applications, launch executables, or switch to a running window.

**Consequence:** An "App shortcuts" panel (quick launch / app switcher) is not implementable with the SDK alone.

**Workaround:** Not implemented — excluded from this widget's scope. Noted as a future feature pending SDK support or a dedicated `Launchprovider` plugin.

**Feature request:** Add a `Launchprovider` plugin with `launch(path: string): void` to complement the existing `Linkprovider`, specifically for local executables.

---

## 4. Technical Constraints Discovered During Development

These are implementation-level constraints not documented in the official spec that required non-obvious workarounds.

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

**Fix applied:** Replaced all default parameters with manual fallbacks:
```js
constructor(options) {
  options = options || {};
  // ...
}
```

**Why this is hard to find:** The `icuewidget validate` CLI does not run the settings groups phase — it only checks file structure and manifest. The error only surfaces at iCUE runtime, and iCUE silently deletes the widget folder as a consequence, making the symptom (import fails) appear unrelated to its cause.

**Official widget pattern:** Official Corsair widgets (Weather, Sensor, MediaSession, Calendar) avoid this entirely by loading MediaViewer from an **external file** (`../common/tools/media_viewer/MediaViewer.js`) that the V4 engine does not evaluate. Third-party widgets that bundle MediaViewer inline must ensure no default parameters or unsupported syntax.

**Recommendation for documentation:** Add a note to the Widget Builder docs clarifying that all inline `<script>` tags in `<head>` are evaluated by the V4 engine during settings initialization, not by Chromium. ES2020+ syntax (`?.`, `??`) is unsupported, and ES6 default parameters cause `SyntaxError: Expected token ','`.

---

### 4.2 `icuewidget package` Produces a Flat Zip (No Subfolder)

**What happens:** The `icuewidget package` CLI (v0.2.3) creates a `.icuewidget` archive with all files at the **root of the zip**, e.g.:
```
manifest.json
index.html
styles/main.css
...
```

**Problem:** iCUE's import dialog (`cue.mod.widgets.html_registry`) expects files to be inside a **subfolder named after the widget ID**:
```
com.marcimastro98.xenonedgehub/manifest.json
com.marcimastro98.xenonedgehub/index.html
com.marcimastro98.xenonedgehub/styles/main.css
...
```
Without this subfolder, the import dialog shows "File not supported or corrupted" (`File non supportato o danneggiato` in Italian) and rejects the package.

**Fix applied:** Added a `repackWithSubfolder()` step to our custom packager (`tools/package-icue-widget.mjs`) that runs after `icuewidget package`. It uses PowerShell's `System.IO.Compression.ZipFile` to rewrite the archive with all entries prefixed by the widget ID.

**Recommendation:** Fix the `icuewidget package` CLI to produce archives with the required subfolder structure, or document this requirement explicitly. Currently, the produced `.icuewidget` file is structurally invalid for the import dialog.

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
| App launch / open executable | No app-launcher panel possible | New `Launchprovider` plugin with `launch(path)` |

---

## 6. Toolchain Issues Summary

| Issue | Severity | Status |
|---|---|---|
| `icuewidget package` produces flat zip (no subfolder) | Blocker for import dialog | Worked around in custom packager |
| `icuewidget validate` does not run V4 settings groups evaluation | High — hides runtime errors | No workaround; need CLI fix |
| V4 evaluates inline `<head>` scripts — ES6 default params unsupported | High — silent widget deletion | Fixed by replacing default params |
| `data-filters` required but undocumented for `media-selector` | Medium — blocks validation | Fixed; needs doc update |
| Widget folder silently deleted on V4 error | High — no UX feedback | Needs runtime fix from Corsair |

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
