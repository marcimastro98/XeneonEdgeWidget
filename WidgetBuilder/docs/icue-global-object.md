# iCUE Global Object

The `iCUE` global object provides utility functions and properties for HTML widgets. Automatically available in the JavaScript context of every widget.

## Properties

| Property       | Type     | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `iCUELanguage` | `string` | Current iCUE interface language (`"en"`, `"de"`, etc) |
| `fpsLimit`     | `number` | FPS limit for widget rendering (default: `30`)        |

```javascript
console.log(iCUE.iCUELanguage); // "en"
console.log(iCUE.fpsLimit); // 30
```

---

## Methods

`defaultTemperatureUnit()` returns: `string` - `"°C"` (metric) or `"°F"` (imperial) based iCUE settings.

```javascript
const unit = iCUE.defaultTemperatureUnit(); // "°C"
```
