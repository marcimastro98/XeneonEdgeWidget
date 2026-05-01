# Media Data Provider

Media player data transfer between iCUE and HTML widgets: currently playing track information and playback controls.

## Overview

-   **Module name**: `widgetbuilder.mediadataprovider`
-   **Plugin name**: `Media`
-   **Version**: `1.0`

Manifest entry:

```json
"required_plugins": [
  "widgetbuilder.mediadataprovider:Media:1.0"
]
```

## Properties

| Property   | Type     | Description         |
| ---------- | -------- | ------------------- |
| `songName` | `string` | Current song name   |
| `artist`   | `string` | Current artist name |

## Methods

### `getSongName(requestId)`

Gets the current song name asynchronously.

| Parameter   | Type  | Description                |
| ----------- | ----- | -------------------------- |
| `requestId` | `int` | Request ID for correlation |

**Response**: `string`

---

### `getArtist(requestId)`

Gets the current artist name asynchronously.

| Parameter   | Type  | Description                |
| ----------- | ----- | -------------------------- |
| `requestId` | `int` | Request ID for correlation |

**Response**: `string`

---

### `triggerPlayPause()`

Toggles play/pause state.

---

### `triggerNextTrack()`

Skips to the next track.

---

### `triggerPreviousTrack()`

Returns to the previous track.

## Signals

### `asyncResponse(requestId, value)`

Emitted when an async method completes.

| Parameter   | Type  | Description         |
| ----------- | ----- | ------------------- |
| `requestId` | `int` | Original request ID |
| `value`     | `var` | Response value      |

## SimpleMediaApiWrapper

Promise-based wrapper for the Media plugin.

**Location**: `<<iCUE install dir>>/widgets/common/plugins/SimpleMediaApiWrapper.js`

### Initialization

```javascript
const api = new SimpleMediaApiWrapper(window.plugins.Mediadataprovider);
```

| Parameter                          | Type     | Default | Description     |
| ---------------------------------- | -------- | ------- | --------------- |
| `window.plugins.Mediadataprovider` | `object` | -       | Plugin instance |

### Methods

#### `getSongName()`

Returns `Promise<string>` with the current song name.

#### `getArtist()`

Returns `Promise<string>` with the current artist name.

### Example

`manifest.json`

```json
"required_plugins": [
  "widgetbuilder.mediadataprovider:Media:1.0"
]
```

`index.html`

```javascript
// <script src="common/plugins/IcueWidgetApiWrapper.js"></script>
// <script src="common/plugins/SimpleMediaApiWrapper.js"></script>

const mediaApi = new SimpleMediaApiWrapper(window.plugins.Mediadataprovider);

async function displayCurrentTrack() {
    const [songName, artist] = await Promise.all([
        mediaApi.getSongName(),
        mediaApi.getArtist(),
    ]);
    console.log(`Now playing: ${songName} by ${artist}`);
}

// Playback controls
window.plugins.Mediadataprovider.triggerPlayPause();
window.plugins.Mediadataprovider.triggerNextTrack();
window.plugins.Mediadataprovider.triggerPreviousTrack();
```

`IcueWidgetApiWrapper` and `SimpleMediaApiWrapper` are available in the `<<iCUE install dir>>/widgets/common/plugins` directory.
