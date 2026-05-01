# Responsive Layout and Scaling

Use this reference to make iCUE preview rendering and real-device rendering behave consistently, while preserving readability on small screens (especially keyboard LCD) and avoiding under-utilized Large/XL layouts.

## Goals

- prevent clipping/cutoff in smaller preview webviews
- keep primary values readable on-device
- avoid tiny center-only composition on Large/XL slots
- maintain one responsive system instead of device-specific hardcoded pixel ladders
- keep preview and real-device rendering compositionally consistent

## Core Strategy

### 1) Use token-driven sizing with an explicit baseline

Drive typography, spacing, radii, and key visual dimensions from CSS variables (`--layout-unit`, `--fs-primary`, `--space-pad`, chart/ring size vars).

Recommended structure:

```css
:root {
  --layout-unit: 1vmin;

  /* Named baselines */
  --device-vertical-s-unit: 4.16px;
  --preview-vertical-s-unit: calc(100vw * 416 / 69600);

  /* Semantic tokens */
  --fs-primary: calc(var(--layout-unit) * 22);
  --fs-secondary: calc(var(--layout-unit) * 7);
  --fs-label: calc(var(--layout-unit) * 3.5);
  --space-pad: calc(var(--layout-unit) * 6);
  --space-gap: calc(var(--layout-unit) * 4);
  --radius-card: calc(var(--layout-unit) * 3.5);
}
```

Avoid fixed `px` values per size class for primary dimensions, and avoid raw `vmin` values directly in component selectors.

### 2) Default to baseline-driven CSS; use hybrid runtime scaling only when needed

For many widgets, CSS-only sizing is enough if all component tokens derive from a single baseline variable and media queries override only the baseline.

Use runtime hybrid scaling when the widget truly needs container-aware growth across large canvases (for example, charts, dense dashboards, or widgets where Large/XL should intentionally gain occupancy).

Hybrid base example:

```js
const shortEdge = Math.min(width, height);
const areaEdge = Math.sqrt(width * height);
const layoutBase = shortEdge * 0.7 + areaEdge * 0.3;
```

This keeps orientation robustness while allowing large canvases to scale up meaningfully.

If you use runtime scaling, write results to CSS variables and keep the semantic token structure intact.

### 3) Add device-aware readability floors

Use stronger minimum font sizes for keyboard widgets.

Example:

- keyboard primary text floor: `24px`
- keyboard secondary text floor: `13px`

For dashboard/pump, use lower floors where appropriate.

For Xeneon Edge Small horizontal (`840x344`), enforce hard minimums after scaling:

- secondary text: `>=11px`
- interactive labels/buttons: `>=12px`

If computed responsive tokens fall below these floors, clamp upward.

### 4) Separate device mode from preview mode

Preview surfaces are not guaranteed to preserve the same `vmin` behavior as real device slots. When preview and device diverge, calibrate preview with an explicit baseline instead of tweaking individual font sizes.

For Xeneon Edge vertical widgets, default rule:

- treat `696x416` (Small vertical) as the canonical vertical baseline
- for larger vertical sizes, keep S-vertical typography/component proportions unless the user explicitly wants size-based scaling
- use extra height for centering, spacing, or extra content density

Preview override example:

```css
/* Real device vertical */
@media (min-width: 680px) and (max-width: 712px) and (min-height: 416px) {
  :root { --layout-unit: var(--device-vertical-s-unit); }
}

/* Vertical preview card */
@media (min-width: 180px) and (max-width: 360px) and (max-aspect-ratio: 0.9) {
  :root { --layout-unit: var(--preview-vertical-s-unit); }
}
```

### 5) Use layout modes, not only scalar resizing

Keep separate layout compositions:

- compact (small/limited space)
- balanced (medium)
- expanded (large/xl)

Expanded mode should add information density or span width/height, not just enlarge small-layout spacing.

### 6) Avoid inline responsive dimension overrides

For responsive dimensions such as chart/ring heights:

- set CSS variables from JS
- consume those variables in CSS
- avoid persistent `element.style.height = ...` per update cycle unless absolutely required

## Recommended Runtime Pattern

```js
function computeTokens(width, height, deviceType, fontScalePct) {
  const shortEdge = Math.min(width, height);
  const areaEdge = Math.sqrt(width * height);
  const layoutBase = shortEdge * 0.7 + areaEdge * 0.3;

  const deviceMultiplier = deviceType === 'keyboard_lcd' ? 1.25 : 1;
  const userScale = Math.max(70, Math.min(150, Number(fontScalePct) || 100)) / 100;

  const primaryMin = deviceType === 'keyboard_lcd' ? 24 : 18;
  const secondaryMin = deviceType === 'keyboard_lcd' ? 13 : 12;

  return {
    fsPrimary: Math.max(primaryMin, Math.min(180, layoutBase * 0.11 * deviceMultiplier * userScale)),
    fsSecondary: Math.max(secondaryMin, Math.min(72, layoutBase * 0.05 * deviceMultiplier * userScale)),
    spacePad: Math.max(8, Math.min(48, layoutBase * 0.025)),
    spaceGap: Math.max(6, Math.min(36, layoutBase * 0.02))
  };
}
```

Apply on init + resize (`ResizeObserver`) and write values to CSS vars.

Use one canonical floor set across skill docs/templates/checklists. If floor values are changed, update all references in the same patch.

## Occupancy Targets

Unless compact-centered layout is explicitly requested:

- for `dashboard_lcd` Large/XL, content should occupy most of the slot
- avoid restrictive wrapper `max-width`/`max-height` values that create large empty gutters
- increase panel/chart spans in expanded mode

Practical target:

- primary axis content footprint ~`>=80%`
- secondary axis content footprint ~`>=70%`

## Preview vs Device Calibration

When preview and device differ:

1. Prioritize real-device readability and occupancy.
2. First try solving the difference by overriding the active baseline (`--layout-unit`) for preview/device mode.
3. Adjust token formula, floors, and mode thresholds only if a baseline override is not enough.
4. Avoid ad-hoc per-widget pixel patches for one viewport.

## Validation Matrix

At minimum test:

- a reduced preview-like viewport for each targeted form factor
- native-sized slot(s) for each targeted form factor
- keyboard readability (primary values still glanceable)
- Large/XL occupancy (no tiny center island by default)
- vertical Xeneon Edge S/M/L/XL preview parity when vertical layouts are supported
- stable secondary typography across same-width vertical variants unless intentional growth is part of the design

## Related References

- `references/html-template.md`
- `references/css-template.md`
- `references/security-and-testing-checklists.md`
