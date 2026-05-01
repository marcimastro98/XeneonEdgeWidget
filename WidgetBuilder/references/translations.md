# Translations and `tr()` Usage

Use this reference when generating localized labels or translation files.

## Core Rules

- Use `tr()` where the docs/references expect iCUE to resolve translated labels
- Every `tr()` key must have a matching entry in `translation.json`
- Keep plain HTML strings, JavaScript expressions, translated labels, and runtime translation usage distinct
- For production or Marketplace-ready widgets, use translation coverage consistently for user-facing labels

## Typical Translation Template

```json
{
  "[Widget Name]": "[Widget Name]",
  "Widget Personalization": "Widget Personalization",
  "Text Color": "Text Color",
  "Accent Color": "Accent Color",
  "Background": "Background",
  "Transparency": "Background Transparency",
  "Loading...": "Loading...",
  "Unable to load data": "Unable to load data",
  "No data available": "No data available"
}
```

## Where `tr()` Is and Is NOT Valid

`tr()` is evaluated by iCUE in these locations:

| Location | Valid? | Notes |
|----------|--------|-------|
| `data-label="tr('...')"` | ✅ Yes | |
| `data-values="[{..., 'value': tr('...')}]"` | ✅ Yes | |
| `x-icue-groups` JSON title | ✅ Yes | |
| `<title>tr('...')</title>` | ✅ Yes | iCUE evaluates `<title>` as an expression — used for settings panel widget name |
| `aria-label="tr('...')"` | ❌ No | Renders as literal string |
| `<span>tr('...')</span>` | ❌ No | Renders as literal string |
| `<button>tr('...')</button>` | ❌ No | Renders as literal string |

For HTML body text and aria attributes, use plain strings. The `<title>` tag is the only HTML element iCUE evaluates — do not strip `tr()` from it.

## Review Guidance

When reviewing an existing widget, do not flag `tr('...')` in supported iCUE metadata fields as an unresolved token just because it is not plain text.

## Minimum Verification

Before finalizing a widget:

- verify every `tr('...')` key exists in `translation.json`
- verify settings labels and state messages are covered
- verify the translation file path and name match the documented package layout
