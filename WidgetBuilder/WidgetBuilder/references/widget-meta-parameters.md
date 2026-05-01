# Widget Meta Parameters

To set parameters for an HTML widget, use `<meta>` tags in the `<head>` section. Each tag defines a user control (slider, color picker, switch, etc.) that appears in the iCUE widget settings panel.

## Default Meta Tag Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Must always be `"x-icue-property"` |
| `content` | Declares the variable name used in code. Must be unique per parameter. Latin letters (A–Z, a–z) and digits (0–9) only. |
| `data-label` | User-facing label for the control |
| `data-type` | Control type: `slider`, `color`, `switch`, `combobox`, etc. |
| `data-default` | The default value of the control |

> **Note:** JavaScript expressions are supported in all `data-*` attributes except `data-type`. Standard JS functions, iCUE global object, and plugin functions are available. For localized labels, use `tr('...')`. For string defaults and option values, use explicit string literals such as `"'Medium'"`.

---

## Available Types

| Type | Description |
|------|-------------|
| `slider` | Numeric slider |
| `switch` | Boolean toggle |
| `color` | Color picker |
| `combobox` | Dropdown selector |
| `search-combobox` | Searchable dropdown |
| `tab-buttons` | Tab-style button group |
| `textfield` | Text input |
| `media-selector` | Media file selector with transformations |
| `sensors-combobox` | Sensor selector (requires Sensors plugin) |
| `sensors-factory` | Multiple sensors with colors (requires Sensors plugin) |

---

### Number Slider (`slider`)

A numerical slider for selecting a value within a range.

| Attribute | Description |
|-----------|-------------|
| `data-min` | The minimum selectable value |
| `data-max` | The maximum selectable value |
| `data-step` | The increment between selectable values |
| `data-unit-label` | Unit of measurement label (e.g., `'%'`, `'ms'`) displayed next to the value |

```html
<meta name="x-icue-property" content="opacity"
      data-label="tr('Opacity')"
      data-type="slider"
      data-default="100"
      data-min="0"
      data-max="100"
      data-step="1"
      data-unit-label="'%'">
```

```javascript
element.style.opacity = opacity / 100;
```

---

### Tab Buttons (`tab-buttons`)

A set of buttons displayed as tabs for switching between options or modes. Supports simple string arrays or key-value pairs.

| Attribute | Description |
|-----------|-------------|
| `data-values` | Array of options — simple strings or `[{key, value}]` pairs |

```html
<!-- Simple array -->
<meta name="x-icue-property" content="direction" data-label="tr('Direction')" data-type="tab-buttons"
      data-values="['Left', 'Right', 'Up', 'Down']" data-default="'Right'">

<!-- Key-value pairs (key is stored, value is displayed) -->
<meta name="x-icue-property" content="alignment" data-label="tr('Alignment')" data-type="tab-buttons"
      data-default="'center'"
      data-values="[{'key':'left','value':tr('Left')},{'key':'center','value':tr('Center')},{'key':'right','value':tr('Right')}]">
```

```javascript
console.log(alignment); // "center"
```

---

### Combobox (`combobox`)

A drop-down menu for selecting one option from a predefined list. Supports simple string arrays or key-value pairs.

| Attribute | Description |
|-----------|-------------|
| `data-values` | Array of options — simple strings or `[{key, value}]` pairs |

```html
<!-- Simple array -->
<meta name="x-icue-property" content="fruit" data-label="tr('Fruit')" data-type="combobox"
      data-default="'apple'" data-values="['apple', 'banana', 'orange']">

<!-- Key-value pairs -->
<meta name="x-icue-property" content="position" data-label="tr('Position')" data-type="combobox"
      data-default="'left'"
      data-values="[{'key':'left','value':tr('Left')},{'key':'center','value':tr('Center')},{'key':'right','value':tr('Right')}]">
```

```javascript
console.log(position); // "left"
```

---

### Search Combobox (`search-combobox`)

A searchable dropdown with dynamic search functionality. The search function receives the query string and returns matching results.

| Attribute | Description |
|-----------|-------------|
| `data-values` | Search function reference (receives query, returns results) |
| `data-default` | Function returning the default value |
| `data-placeholder` | Placeholder text for the search input |

Declare the search module in `manifest.json`:
```json
"modules": ["modules/CitySearch.mjs"]
```

```html
<meta name="x-icue-property" content="city"
      data-label="tr('City')"
      data-type="search-combobox"
      data-values="CitySearch.search"
      data-default="CitySearch.getDefault"
      data-placeholder="tr('Search city...')">
```

```javascript
console.log(city); // selected value (e.g., a city ID)
```

---

### Switch (`switch`)

A toggle for binary on/off state.

```html
<meta name="x-icue-property" content="showLabel" data-label="tr('Show Label')" data-type="switch" data-default="true">
```

```javascript
element.style.display = showLabel ? "block" : "none";
```

---

### Color (`color`)

A color picker using a color wheel or palette.

```html
<meta name="x-icue-property" content="textColor" data-label="tr('Text Color')" data-type="color" data-default="'#ffffff'">
```

```javascript
element.style.color = textColor; // "#FFFFFF"
```

---

### Text Field (`textfield`)

A text input field for custom text.

```html
<meta name="x-icue-property" content="message" data-label="tr('Message')" data-type="textfield" data-default="'My Custom Text'">
```

---

### Media Selector (`media-selector`)

Lets users select media files (images, videos) from their device. Returns an object with transform properties.

**Platform notes:**
- Windows: supports `AV1`, `VP8`, `VP9` video codecs
- macOS: video codecs are not supported

| Attribute | Description |
|-----------|-------------|
| `data-filters` | File type filters (e.g., `['*.png', '*.jpg', '*.gif']`) |

```html
<meta name="x-icue-property" content="backgroundImage"
      data-label="tr('Background Image')"
      data-type="media-selector"
      data-filters="['*.png', '*.jpg', '*.gif']">
```

**Accessing the selected media data:**

```javascript
if (typeof backgroundImage !== "undefined") {
    console.log(backgroundImage.pathToAsset); // URL/path to selected file
    console.log(backgroundImage.scale);       // Scale factor
    console.log(backgroundImage.positionX);   // X position offset
    console.log(backgroundImage.positionY);   // Y position offset
    console.log(backgroundImage.baseSizeX);     // Original image width
    console.log(backgroundImage.baseSizeY);     // Original image height
    console.log(backgroundImage.angle);       // Rotation angle in degrees
}
```

Use `MediaViewer` from iCUE's common tools to handle media display. See `references/html-template.md` for the full implementation pattern.

Use the full returned object, not only `pathToAsset`, so user-selected cropping, scaling, positioning, and rotation are preserved.

---

### Sensors Combobox (`sensors-combobox`)

A drop-down for selecting from the system sensor list. Returns a sensor ID string. Requires the Sensors Data Provider plugin.

Declare the plugin in `manifest.json`:
```json
"required_plugins": ["widgetbuilder.sensorsdataprovider:Sensors:1.0"]
```

```html
<meta name="x-icue-property" content="sensorId"
      data-label="tr('Sensor')"
      data-type="sensors-combobox"
      data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')">
```

```javascript
console.log(sensorId); // "cpu_temp_0" — sensor ID string

// Use SimpleSensorApiWrapper to fetch sensor data:
const api = new SimpleSensorApiWrapper(window.plugins.Sensorsdataprovider);
const value = await api.getSensorValue(sensorId);
const units = await api.getSensorUnits(sensorId);
```

See `plugins/Plugin_SensorsDataProvider.md` for full plugin documentation.

---

### Sensors Factory (`sensors-factory`)

A control for managing multiple sensors with associated colors — ideal for graphs and charts. Returns an array of `{sensorId, color}` objects. Requires the Sensors Data Provider plugin.

Declare the plugin in `manifest.json`:
```json
"required_plugins": ["widgetbuilder.sensorsdataprovider:Sensors:1.0"]
```

```html
<meta name="x-icue-property" content="sensors"
      data-label="tr('Sensors')"
      data-type="sensors-factory"
      data-default="plugins.Sensorsdataprovider.getDefaultSensorIdBlock('temperature')">
```

```javascript
// sensors is an array of {sensorId, color} objects
sensors.forEach(item => {
    console.log(item.sensorId); // "cpu_temp_0"
    console.log(item.color);    // "#FF0000"
});
```

---

## Meta Parameters Grouping

Group parameters into separate iCUE sidebar panels using a `<script>` tag inside `<head>`. JavaScript expressions are supported in `title` and `info` fields.

```html
<meta name="x-icue-property" content="background" data-label="tr('Background')" data-type="color" data-default="'#3c4bff'">
<meta name="x-icue-property" content="dataColor" data-label="tr('Data Color')" data-type="color" data-default="'#ffffff'">
<meta name="x-icue-property" content="hoursFormat" data-label="tr('24-Hour Time')" data-type="switch" data-default="true">

<script id="x-icue-groups" type="application/json">
[
  {
    "title": "tr('Color Settings')",
    "properties": ["background", "dataColor"]
  },
  {
    "title": "tr('Clock Settings')",
    "properties": ["hoursFormat"],
    "info": "tr('Optional help text for this group')"
  }
]
</script>
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Group header label (supports `tr()`) |
| `properties` | `string[]` | Array of property `content` names |
| `info` | `string` | Optional tooltip/help text (supports `tr()`) |

**Rules:**
- Each group must have at least one property.
- If a property appears in multiple groups, it shows only in the first.
- Ungrouped parameters appear in the panel named after the widget title.
- A group with the same title as the widget merges with the widget's default panel.

**Xeneon Edge behavior:** Groups containing `textColor`, `accentColor`, or `backgroundColor` properties display a "Custom Style" switch. When disabled, device default colors are applied.

---

## Widget Grouping

Group related widgets together in the iCUE widget picker:

```html
<meta name="x-icue-widget-group" content="tr('Clock Face')">
<meta name="x-icue-widget-preview" content="resources/MyWidgetPreview.png">
```

- `x-icue-widget-group` — group name; all widgets sharing the same name are combined
- `x-icue-widget-preview` — preview image shown in the widget selector (128x56 pixels)
- Group icon comes from the first widget loaded by iCUE
- Sorting within a group is not controlled

---

## Sensor Types (`sensorType`)

Used with the Sensors Data Provider plugin's `getSensorType()` method.

| Value | Description |
|-------|-------------|
| `temperature` | Temperature sensor |
| `pump` | Pump speed sensor |
| `fan` | Fan speed sensor |
| `voltage` | Voltage sensor |
| `load` | Load/usage sensor |
| `led` | LED sensor (deprecated) |
| `cas-latency` | CAS latency (RAM timing) |
| `command-rate` | Command rate (RAM timing) |
| `cycle-time` | Cycle time (RAM timing) |
| `dram-frequency` | DRAM frequency |
| `ras-precharge` | RAS precharge (RAM timing) |
| `ras-to-cas-delay` | RAS to CAS delay (RAM timing) |
| `current` | Current sensor |
| `power` | Power sensor |
| `battery-charge` | Battery charge level |
| `battery-status` | Battery status |
| `efficiency` | Efficiency sensor |
| `fps` | Frames per second |
| `pin-protect` | Pin protection sensor |

## Sensor Kinds (`sensorKind`)

Used with the Sensors Data Provider plugin's `getSensorKind()` method.

| Value | Description |
|-------|-------------|
| `default` | Defined for most sensors |
| `core` | Processor core parameters |
| `package` | CPU package |
| `power-in` | Input power (e.g., PSU) |
| `power-out` | Output power (e.g., PSU) |
| `power-3-3` | 3.3V power |
| `power-5` | 5V power |
| `power-12` | 12V power |
| `total-power-draw` | Total power consumption |
| `voltage-bat` | Battery voltage |
| `voltage-core` | Core voltage |
| `voltage-in` | Input voltage (e.g., PSU) |
| `voltage-3-3` | 3.3V voltage |
| `voltage-5` | 5V voltage |
| `voltage-12` | 12V voltage |
| `voltage-vdd` | VDD voltage (RAM) |
| `voltage-vddq` | VDDQ voltage (RAM) |
| `voltage-vpp` | VPP voltage (RAM) |
| `current-3-3` | Current on the 3.3V line |
| `current-5` | Current on the 5V line |
| `current-item-12v` | Current on the 12V item's line |
| `current-item-12v-2x6` | Current on the 12V 2x6 line |
| `current-12v` | Current on the 12V line |
| `current-item-atx` | Current on the ATX line |
| `current-item-sata` | Current on the SATA line |
| `cpu-temp` | CPU temperature |
| `gpu-temp` | GPU temperature |
| `cpu-pump` | CPU pump |
| `gpu-pump` | GPU pump |
| `gpu-load` | GPU load |
| `pin-protect-status` | Pin protection status |
| `pin-protect-current` | Pin protection current |
| `pin-protect` | Pin protection |
| `memory-load` | Memory load |
| `frame-buffer-load` | Frame buffer load |
| `video-engine-load` | Video engine load |
| `bus-interface-load` | Bus interface load |
| `invalid` | Invalid kind |
