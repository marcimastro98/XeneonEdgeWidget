# Security and Testing Checklists

Use this reference during verification and before final delivery.

## Security Review

### No malicious or harmful code

- Never include code that damages files, processes, or system state
- Never include cryptocurrency miners, keyloggers, clipboard hijackers, or malware
- Never obfuscate JavaScript to hide intent
- Never use `eval()` or `document.write()` with dynamic strings
- Never use remote `<script src>` tags or remote web fonts
- Use `Function()` only for the narrowly-scoped compatibility helper described in the lifecycle reference

### Data privacy

- No network requests by default
- If external requests are required, send only the minimum data needed
- Never send device identifiers, hardware details, file paths, localStorage contents, or personal data to third parties
- Use HTTPS only
- Explain outbound behavior to the user and get approval before testing an API

### API keys and storage

- Never hardcode API keys
- Use a `textfield` property for user-supplied keys
- Never store tokens or credentials in `localStorage`
- Store only widget-display state under the widget's own key

## Browser Testing

Open the HTML file in a browser and test each supported target size.

### Target resolutions

**Xeneon Edge (`dashboard_lcd`)**

| Size | Horizontal | Vertical |
|------|-----------|----------|
| Small | 840x344 | 696x416 |
| Medium | 840x696 | 696x840 |
| Large | 1688x696 | 696x1688 |
| Extra Large | 2536x696 | 696x2536 |

**Other devices**

- Pump LCD: 480x480
- Keyboard LCD: 320x170

### Quality checks

- information remains readable at every declared size
- small layouts simplify secondary content when necessary
- preview rendering remains compositionally consistent with the intended real-device layout
- vertical Xeneon Edge previews do not inflate secondary text on M/L/XL when S-vertical is intended as the canonical baseline
- text contrast is at least 4.5:1, or 3:1 for large text/UI elements
- information is not conveyed by color alone
- no content flashes more than 3 times per second
- `prefers-reduced-motion` is respected if animations are used

## Preflight Checklist

### Documentation alignment

- all generated meta tags exist in the docs/references
- property types and attributes match the docs exactly
- device identifiers match the docs exactly
- plugin names/access patterns match the docs exactly
- package layout does not rely on internal install paths

### Structure

- `data-restrictions` uses JSON format
- `x-icue-interactive` exists only when needed
- `x-icue-groups` is valid JSON with no empty groups
- file paths match exact case

### Properties

- `content` names are unique and alphanumeric
- labels do not contain raw `&`
- sliders use integer ranges where expected
- CSS variables used by the stylesheet are actually set in JS
- direct property access uses existence checks
- component sizing uses semantic CSS tokens instead of scattered raw viewport units in selectors

### Media backgrounds

- `normalizeMediaConfig()` is used before `loadMedia()`
- the fallback path escapes backslashes and single quotes
- `#media-background` uses `visibility`, not `display: none`
- `data-values` strings avoid ambiguous slash-heavy formats

### Personalization

- personalization group is last
- color/transparency changes apply in real time

### Localization

- every `tr('...')` key exists in `translation.json`
- labels and state messages are covered consistently
- `<title>` uses `tr('...')` (iCUE evaluates it — plain text produces `{}` in the settings panel)
- no `tr('...')` in `aria-label` or HTML body text — those render as literal strings

### User experience

- loading/empty/error/content states are implemented
- empty/error states guide the user toward a fix
- content remains inside display bounds
- layouts adapt to declared orientations/sizes
- preview/device-specific baseline overrides are used when raw `vmin` behavior would diverge between preview and device
- offline-capable widgets preserve last known data when appropriate

### Graphics

- widget icon is a white single-color SVG with transparent background
- Marketplace packages include both `icon.png` and `icon@2x.png` when required
