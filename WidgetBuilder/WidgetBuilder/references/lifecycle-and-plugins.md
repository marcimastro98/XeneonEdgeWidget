# Lifecycle and Plugin Runtime Guide

Use this reference when wiring widget runtime behavior.

## iCUE Event Binding

Use bare assignment for `icueEvents`:

```js
icueEvents = {
  onDataUpdated: onIcueDataUpdated,
  onICUEInitialized: onIcueInitialized
  // onUpdateRequested: onUpdateRequested
};
```

Do **not** add `var`/`let`/`const` in front of `icueEvents`. In some iCUE execution contexts that prevents the runtime bridge from seeing the handlers.

## Safe Property Access

iCUE may inject properties as globals in a sandboxed function context. Use a helper that checks both `window[name]` and the sandbox-local variable path:

```js
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
```

Also use `typeof prop !== 'undefined'` checks before direct property access.

## Lifecycle Rules

Generated widgets should:

- initialize safely before iCUE is ready
- handle `onICUEInitialized`
- handle `onDataUpdated`
- initialize plugins independently when needed
- tolerate missing plugin/data state without crashing
- render meaningful loading/empty/error/content states

If the widget depends on both iCUE properties and plugin readiness, do not assume a fixed initialization order unless the docs guarantee one.

## Initial Browser Render

Support direct browser opening during development:

```js
if (typeof iCUE_initialized !== 'undefined' && iCUE_initialized) {
  onIcueInitialized();
} else {
  onIcueDataUpdated();
}
```

## Plugin Naming Model

When using plugins, keep these names distinct:

- manifest plugin identifier
- runtime `window.plugins.*` object name
- plugin event global name
- wrapper/helper names used in examples

Do not mix similar names unless the docs explicitly require them.

## Translation Runtime Notes

`tr('...')` in `<title>` and `data-label` is often correct iCUE syntax. Do not replace it with plain text unless the docs for that field say otherwise.

## Programmatic Refresh

If the widget uses `onUpdateRequested` or another programmatic update path, rate-limit it to no more than 10 updates per second.
