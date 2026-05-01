# Link Provider

Plugin for opening links in the system browser.

_If you open a link with standard JavaScript APIs, it opens inside the widget web view._

_Use this plugin to open the link in the system's default browser instead._


## Overview

-   **Module name**: `widgetbuilder.linkprovider`
-   **Plugin name**: `Url`
-   **Version**: `1.0`

Manifest entry:

```json
"required_plugins": [
  "widgetbuilder.linkprovider:Url:1.0"
]
```

## Methods

### `open(link)`

Opens a link in the system browser.

| Parameter | Type     | Description  |
| --------- | -------- | ------------ |
| `link`    | `string` | Link to open |

### Example

`manifest.json`

```json
"required_plugins": [
  "widgetbuilder.linkprovider:Url:1.0"
]
```

`index.html`

```javascript
function openLink(url) {
    if (window.plugins && window.plugins.Linkprovider && pluginLinkprovider_initialized) {
        window.plugins.Linkprovider.open(url);
    } else {
        console.error("Linkprovider plugin not available");
    }
}

openLink("https://www.corsair.com/ww/en");
```
