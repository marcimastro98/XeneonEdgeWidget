---
name: xenonedgehub
description: 'Builds, modifies, debugs, reviews and packages the XenonEdge Hub iCUE native widget (com.marcimastro98.xenonedgewidget) for the CORSAIR Xeneon Edge 14.5" dashboard LCD. Use this skill whenever the user asks to add a feature, fix a bug, refactor code, debug runtime behavior, validate, package, or prepare the widget for Marketplace submission.'
argument-hint: 'Describe the feature, fix, or question about the XenonEdge Hub iCUE widget'
---

# XenonEdge Hub iCUE Widget

When the user asks to work on the XenonEdge Hub iCUE widget, follow this workflow.
This skill mirrors the official Corsair `WidgetBuilder/WidgetBuilder/skill.md` structure
but is scoped to the concrete decisions, constraints, and architecture of THIS widget.

## Documentation Authority

Treat the following as the source of truth, in this order:

1. `WidgetBuilder/WidgetBuilder/docs/` — official iCUE Widget Builder specification (offline mirror)
2. `WidgetBuilder/WidgetBuilder/references/` — official implementation references (offline mirror)
3. `WidgetBuilder/WidgetBuilder/skill.md` — official Corsair AI skill (offline mirror)
4. `skill.md` (repo root) — top-level copy of the official Corsair skill
5. `https://docs.elgato.com/icue/widgets/` — only as fallback when the offline mirror is silent
6. `.github/skills/xenonedgehub/SKILL.md` (this file) — project-specific decisions for XenonEdge Hub

If older code, comments, or instructions in `widget/` conflict with the docs/references,
the docs/references win. Never invent unsupported meta properties, undocumented package
layouts, or internal installation-path assumptions.

Packaging is wrapped by `npm run icue:package` (`tools/package-icue-widget.mjs`), which
copies `widget/` (including the `common/` plugin wrappers) into a temp build dir,
inlines the component HTML, and runs `icuewidget validate` + `icuewidget package`.

## Phase 1: Requirements Gathering (fast path applies)

This widget has a complete design spec in `.github/copilot-instructions.md`. Use the
**fast path** unless the user is asking for a brand-new feature.

For a small edit, ask only:
1. Which file/section should change?
2. What exact behavior should change, and what must stay unchanged?
3. Which device sizes must still be supported after the edit?
4. Should existing property names/IDs remain backward compatible?
5. Any plugin/API/SDK implications (sensors, media, link, localStorage)?

For a **new feature** touching sensors, media, audio, or a new panel, also ask:
1. Does the SDK actually expose what's needed? (cross-check `WidgetBuilder/WidgetBuilder/docs/plugins/`)
2. If the SDK does NOT expose it, do we degrade gracefully and report it to Corsair?
3. Loading / content / stale / error state behavior for the new panel.

## Phase 2: Project-Specific Constraints

### 2.1 Identity (immutable)

| Field | Value |
|-------|-------|
| Widget Name | `XenonEdge Hub` |
| Widget ID | `com.marcimastro98.xenonedgewidget` |
| Author | `marcimastro98` |
| SDK API version | `1.0.1` |
| OS | `windows` |
| Target device | `dashboard_lcd` (Xeneon Edge 14.5") |
| Marketplace intent | Public, free |

### 2.2 Required plugins (`manifest.json` → `plugins`)

```json
[
  "widgetbuilder.sensorsdataprovider:Sensors:1.0",
  "widgetbuilder.mediadataprovider:Media:1.0",
  "widgetbuilder.linkprovider:Url:1.0"
]
```

Official Corsair plugin wrappers are vendored under `widget/common/plugins/`:
`IcueWidgetApiWrapper.js`, `SimpleSensorApiWrapper.js`, `SimpleMediaApiWrapper.js`.
They load in `index.html` BEFORE any project module.

### 2.3 Confirmed SDK gaps (do not try to "fix" — report to Corsair/Roricas)

| Gap | Consequence | Workaround |
|-----|-------------|------------|
| Media: only `getSongName`, `getArtist`, `triggerPlayPause`, `triggerNextTrack`, `triggerPreviousTrack` | No playback status, no album/app/thumbnail | Assume `Playing` while title/artist returned, else `Paused` |
| No `throughput` sensor type | Network upload/download may not be available | `data-default="''"` for network sensors; user picks manually |
| No audio device API (mic mute, volume, default device) | Cannot replicate mic mute / device picker | `Linkprovider.open('ms-settings:sound')` |
| No app launcher / window enumeration | Cannot build open-apps panel | `Linkprovider` deep links to `ms-settings:*` URIs |

When the user asks for one of these, do NOT silently fail — degrade visibly, log via
`console.warn`, and surface the stale/offline UI state if relevant.

### 2.4 Folder structure (`widget/`)

```
widget/
├── manifest.json
├── index.html                      ← meta properties, x-icue-groups, script load order
├── translation.json                ← nested: { "en": { "translation": {...} }, "it": {...} }
├── common/plugins/                 ← official Corsair wrappers (vendored)
├── styles/main.css
├── components/                     ← HTML fragments inlined at package time
├── modules/
│   ├── state.js    ← Hub.state, makeResponse, clampPercent
│   ├── i18n.js     ← tr() and locale helpers
│   ├── ui.js       ← Hub.readProps, Hub.applyAppearance (CSS vars only)
│   ├── storage.js  ← localStorage helpers
│   ├── calendar.js ← Hub.getEvents / setEvents
│   ├── notes.js    ← Hub.getNotes / setNotes
│   ├── sensors.js  ← SimpleSensorApiWrapper bindings
│   ├── media.js    ← SimpleMediaApiWrapper + Linkprovider
│   ├── apps.js     ← saved app links
│   └── icue-adapter.js ← lifecycle hooks + hybrid fetch() bridge
└── resources/icon.svg
```

**The web widget under `server/` is FROZEN.** Do not touch it during iCUE work.

### 2.5 Property declarations order

1. **Sensors group**: `cpuLoadSensor`, `cpuTempSensor`, `gpuLoadSensor`, `gpuTempSensor`, `ramLoadSensor`, `diskTempSensor`, `netUploadSensor`, `netDownloadSensor`
2. **Behavior group**: `defaultLanguage`, `use24h`, `showSeconds`
3. **Appearance group** (LAST): `textColor`, `accentColor`, `backgroundColor`, `backgroundMedia`, `bgBrightness`, `glassBlur`, `transparency`

Sensor `data-default` rules:
- CPU/GPU/RAM load → `plugins.Sensorsdataprovider.getDefaultSensorIdBlock('load')`
- Temps → `plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')`
- Network → `data-default="''"` (no `throughput` type in SDK)

### 2.6 Hub.state shape (in `modules/state.js`)

```js
Hub.state = {
  sensors: { cpuLoad, cpuTemp, gpuLoad, gpuTemp, ramLoad, diskTemp, netUp, netDown },
  cpuName: "", gpuName: "", ramTotalBytes: 0,
  media: { active, title, artist, album, app, thumbnail, playbackStatus },
  mediaWrapper: null,
  audio: { speakerVolume, speakerMuted, micVolume, micMuted },
  notes: "", events: [], startTime
};
```

### 2.7 Lifecycle wiring (`modules/icue-adapter.js`)

Wire all of:
- `icueEvents.onICUEInitialized` AND `icueEvents.onInitialized`
- `pluginSensorsdataproviderEvents.onInitialized` + check `pluginSensorsdataprovider_initialized`
- `pluginMediadataproviderEvents.onInitialized` + check `pluginMediadataprovider_initialized`
- `icueEvents.onDataUpdated` → re-apply appearance + refresh sensors

Script load order in `index.html`:
`common/plugins/*` → `state.js` → `i18n.js` → `ui.js` → `storage.js` → domain modules → `icue-adapter.js`

### 2.8 Translation format

Nested format only:
```json
{ "en": { "translation": { "Key": "Value" } }, "it": { "translation": { "Key": "Valore" } } }
```

### 2.9 Layout (CSS only — no JS layout switching)

- `--layout-unit: 1vmin;` in `:root`. All sizes via semantic tokens.
- Breakpoints via `@media (aspect-ratio: ...)` ONLY. Never `detectLayout()` JS.
- Hero survives every size. S-horizontal (840×344): hide all secondary panels.
- S-vertical (696×416): canonical baseline for vertical orientations.

## Phase 3: Implementation Conventions

### JS rules
- `"use strict"`, IIFE per module, `window.XenonEdgeHub` namespace.
- `const` default; `let` only when needed; no `var` in new code.
- `?.` and `??` for all external data access (sensor values, API responses, iCUE props).
- `textContent` for DOM writes; `innerHTML` only for trusted static markup.
- No `eval`, no `new Function(string)`, no `setTimeout("string")`.
- HTTPS only for external calls, with timeout and shape validation.

### JS sets, CSS renders
JS only writes documented CSS variables: `--icue-text`, `--icue-accent`, `--icue-bg`,
`--icue-bg-brightness`, `--icue-blur`, `--icue-transparency`, `--icue-bg-image`.
No ad-hoc `element.style.*` writes.

### UI state machine
Each data panel implements `data-state` attribute with values: `loading`, `content`, `stale`, `error`.
CSS renders each state. Never show raw error strings.

### Sensor bindings
`new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider, 5000)`.
Connect `provider.sensorValueChanged` for live updates; do NOT poll.
Parse values with `toNumber()` (handles `","` decimal separator).

### Media
`new SimpleMediaApiWrapper(window.plugins.Mediadataprovider, 5000)`.
ONLY: `getSongName`, `getArtist`, `triggerPlayPause`, `triggerNextTrack`, `triggerPreviousTrack`.
After transport command, schedule `Hub.refreshMediaState()` ~400ms later.

### Links
`Hub.tryOpenLink(url)` — tries `Linkprovider.open(url)` first, falls back to `window.open`.

### localStorage keys
- `xeneonhub.notes` (string), `xeneonhub.events` (JSON array), `xeneonhub.audio` (JSON object), `xeneonhub.applinks` (JSON array)

### Diagnostics
`window.__XEH_DEBUG = true` → `[XEH/sensors]` and `[XEH/media]` console output.
`XenonEdgeHub.debugSensors()` → dumps all sensor IDs + current bindings.

## Phase 4: Verification

Before declaring done:
1. `npm run icue:package` → must show `Validation passed` + `Package created successfully`.
2. Test at: `840×344`, `696×416`, `840×696`, `696×840`, `1688×696`, `696×1688`, `2536×696`, `696×2536`.
3. All four panel states reachable (loading/content/stale/error).
4. Appearance properties update live.
5. `console.error` count is zero.
6. Text never clips/overflows.

## Phase 5: Final Response

Include: files changed (workspace-relative links), `npm run icue:package` result, SDK gaps surfaced, manual steps for user.

## Quick Reference — Things That Bite

- `<meta name="x-icue-property" content="X">` → property arrives as **JS global `X`**, NOT `iCUE.properties[X]`. `Hub.readProps()` handles both.
- `sensors-combobox` value can be object or string — always use `extractSensorId()`.
- `getDefaultSensorIdBlock(type)` valid types: `load`, `temperature`, `fan`, `voltage`, `current`, `power`, `pump`, `battery-charge`, `fps`, `cas-latency`. NOT `'throughput'` or `'utilization'`.
- Qt WebChannel requires request/asyncResponse pattern. Official wrappers handle it — never re-implement.
- Translation runtime expects NESTED format. Flat format silently no-ops `tr()` for non-default locales.
- `data-default` for string values needs inner quotes: `data-default='"#1ED760"'`.
- Packager (`tools/package-icue-widget.mjs`) inlines `<div data-component-path="...">` fragments. New HTML components must use this attribute.
