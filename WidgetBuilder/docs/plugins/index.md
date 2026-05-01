# HTML Widget Plugins

HTML widget plugins extend iCUE widget functionality, and are registered using the `required_plugins` property in manifest.json.

## Supported Plugins

| Plugin                                              | Module name                       | Plugin name | Version | Description                        |
| --------------------------------------------------- | --------------------------------- | ----------- | ------- | ---------------------------------- |
| [Sensors Data Provider](./sensors-data-provider.md) | widgetbuilder.sensorsdataprovider | Sensors     | 1.0     | Sensor data from connected devices |
| [Media Data Provider](./media-data-provider.md)     | widgetbuilder.mediadataprovider   | Media       | 1.0     | Media playback control             |
| [Link Provider](./link-provider.md)                 | widgetbuilder.linkprovider        | Url         | 1.0     | Open links in the system browser   |

## Declaration

Plugins are declared in the manifest.json file in the "required_plugins" section.

Single plugin:

```json title="manifest.json"
"required_plugins": [
    "widgetbuilder.sensorsdataprovider:Sensors:1.0"
]
```

Multiple plugins:

```json title="manifest.json"
"required_plugins": [
    "widgetbuilder.sensorsdataprovider:Sensors:1.0",
    "widgetbuilder.mediadataprovider:Media:1.0"
]
```

## Plugin Interface

### Initialization Check

Boolean variable indicating plugin load status: `plugin<<module_name>>_initialized`

Examples:

- `pluginSensorsdataprovider_initialized`
- `pluginMediadataprovider_initialized`
- `pluginLinkprovider_initialized`

### Initialization Callback

```javascript
plugin<<module_name>>Events = {
    "onInitialized": <<callback_function>>
};
```

Sensors plugin example:

```javascript
pluginSensorsdataproviderEvents = {
	onInitialized: onSensorsdataproviderInitialized,
};
```

Media plugin example:

```javascript
pluginMediadataproviderEvents = {
	onInitialized: onMediadataproviderInitialized,
};
```

Link plugin example:

```javascript
pluginLinkproviderEvents = {
	onInitialized: onLinkproviderInitialized,
};
```

### Plugin Access

Access plugins via `window.plugins.<<module_name>>`:

- `window.plugins.Sensorsdataprovider`
- `window.plugins.Mediadataprovider`
- `window.plugins.Linkprovider`

Each plugin has its own interface documented in the plugin-specific documentation.
