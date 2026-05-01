# CSS Widget Template

Use this as the starting point for widget stylesheets. Adapt the typography scale, colors, and layout to each widget's needs.

```css
:root {
  --text-color: #ffffff;
  --accent-color: #ffffff;
  --bg-color: #000000;
  --bg-opacity: 1;
  --bg-blur: 0px;

  /* Sizing architecture
     - Components consume semantic tokens only.
     - Media queries override the active baseline, not every individual font. */
  --layout-unit: 1vmin;
  --device-vertical-s-unit: 4.16px; /* 416px / 100 */
  --preview-vertical-s-unit: calc(100vw * 416 / 69600);

  --space-gap: calc(var(--layout-unit) * 4);
  --space-pad: calc(var(--layout-unit) * 6);
  --radius-card: calc(var(--layout-unit) * 3.5);
  --font-hero: calc(var(--layout-unit) * 20);
  --font-secondary: calc(var(--layout-unit) * 6);
  --font-label: calc(var(--layout-unit) * 3.5);
}

html { overflow: hidden; }

body {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: OpenSans, Arial, sans-serif;
  background: transparent;
}

.widget-root {
  position: relative;
  width: 100%;
  height: 100%;
  color: var(--text-color);
  box-sizing: border-box;
  overflow: hidden;
}

/* Background stack: overall opacity controlled by --bg-opacity.
   "Background Transparency" fades the entire stack so the desktop shows through.
   Image overrides bg color when present.
   Content stays fully visible and is never affected by transparency. */
.widget-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  opacity: var(--bg-opacity);
  transition: opacity 0.2s ease;
}

/* Optional solid-color base layer. `.main-glass` is a conventional class name,
   not a required API contract. */
.main-glass {
  position: absolute;
  inset: 0;
  background-color: var(--bg-color);
  z-index: 0;
}

#media-background {
  width: 100%;
  height: 100%;
  position: relative;
  filter: blur(var(--bg-blur));
}

.main-content {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  height: 100%;
  /* Apply padding based on layout needs — see safe area recommendations in the skill */
}

/* Typography — consume semantic tokens, not raw viewport units */
.primary-text   { font-size: var(--font-hero); }      /* hero number / headline */
.secondary-text { font-size: var(--font-secondary); } /* supporting values */
.label-text     { font-size: var(--font-label); }     /* labels, timestamps, captions */

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: calc(var(--layout-unit) * 4);
  opacity: 0.7;
}

/* Accessibility: respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Design Notes

### Typography — Use a Baseline Variable + Semantic Tokens

Use `vmin` or another viewport-derived unit only to define the active baseline variable. Components should consume semantic tokens derived from that baseline.

```css
:root {
  --layout-unit: 1vmin;
  --font-hero: calc(var(--layout-unit) * 22);
  --font-secondary: calc(var(--layout-unit) * 7);
  --font-label: calc(var(--layout-unit) * 3.5);
}

/* ✅ Correct — components consume semantic tokens */
.ping-value { font-size: var(--font-hero); }
.stat-value { font-size: var(--font-secondary); }
.label-text { font-size: var(--font-label); }

/* ❌ Avoid — raw viewport units scattered across components */
.ping-value { font-size: 22vmin; }
.stat-value { font-size: 7vmin; }
```

Recommended multipliers by role:

| Role | Multiplier | Example token |
|------|------------|---------------|
| Hero number (countdown, big stat) | `20–22` | `calc(var(--layout-unit) * 22)` |
| Supporting value | `6–8` | `calc(var(--layout-unit) * 7)` |
| Label / caption | `3–4` | `calc(var(--layout-unit) * 3.5)` |
| Badge / pill text | `3` | `calc(var(--layout-unit) * 3)` |

Use the same pattern for spacing too:
```css
.content-box  { gap: calc(var(--layout-unit) * 4); padding: calc(var(--layout-unit) * 6); }
.stat-tile    { padding: calc(var(--layout-unit) * 4) calc(var(--layout-unit) * 2); border-radius: calc(var(--layout-unit) * 3.5); }
```

### Vertical Device/Preview Baselines

For Xeneon Edge vertical layouts, use Small vertical (`696x416`) as the canonical baseline unless the user explicitly wants typography to grow with vertical size.

Example:

```css
/* Real vertical device slots */
@media (min-width: 680px) and (max-width: 712px) and (min-height: 416px) {
  :root { --layout-unit: var(--device-vertical-s-unit); }
}

/* Vertical preview cards */
@media (min-width: 180px) and (max-width: 360px) and (max-aspect-ratio: 0.9) {
  :root { --layout-unit: var(--preview-vertical-s-unit); }
}
```

This avoids the common preview bug where S looks correct but M/L/XL vertical previews inflate secondary text because raw `vmin` switches behavior.

### Responsive Layout — CSS Aspect-Ratio Media Queries (No JS Classes)

Do **not** use JavaScript to detect size/orientation and add body classes for standard layout switching. Use CSS `@media (aspect-ratio)` rules instead. They fire the instant the viewport changes, require no JS maintenance, and work well with baseline overrides.

**Known device aspect ratios:**

| Device / Slot | Dimensions | Aspect Ratio |
|---------------|-----------|--------------|
| Pump LCD | 480×480 | `1/1` |
| Keyboard LCD | 320×170 | ≈ 1.88 |
| Dashboard S-H | 840×344 | ≈ 2.44 |
| Dashboard S-V | 696×416 | ≈ 1.67 |
| Dashboard M-H | 840×696 | ≈ 1.21 |
| Dashboard M-V | 696×840 | ≈ 0.83 |
| Dashboard L-H | 1688×696 | ≈ 2.43 |
| Dashboard L-V | 696×1688 | ≈ 0.41 |
| Dashboard XL-H | 2536×696 | ≈ 3.64 |
| Dashboard XL-V | 696×2536 | ≈ 0.27 |

**S-H (2.44) and L-H (2.43) have nearly identical ratios.** When you need to target only one, combine aspect-ratio with `max-height`:
```css
/* Targets S-H (344px tall) but NOT L-H (696px tall) */
@media (min-aspect-ratio: 2.2) and (max-height: 400px) { … }
```

**Starter breakpoint set** — covers all iCUE devices:
```css
/* Pump LCD — square 1:1 */
@media (aspect-ratio: 1/1) { … }

/* Keyboard LCD — narrow landscape ~320×170 */
@media (min-aspect-ratio: 1.8) and (max-height: 200px) { … }

/* Short wide landscape — S-H (840×344) only */
@media (min-aspect-ratio: 2.2) and (max-height: 400px) { … }

/* Wide landscape — all wide slots incl. L-H, XL-H */
@media (min-aspect-ratio: 2.2) { … }

/* Moderate short landscape — S-V (696×416) */
@media (min-aspect-ratio: 1.5) and (max-aspect-ratio: 1.8) and (max-height: 450px) { … }

/* Portrait */
@media (orientation: portrait) { … }

/* Tall portrait — L-V, XL-V */
@media (max-aspect-ratio: 0.5) { … }
```

### Hide, Don't Shrink

When a screen is too small to show everything, **hide secondary elements** rather than trying to squeeze them smaller. The primary data element should always survive. `vmin` sizing handles scaling — media queries only control what's visible:

```css
/* Pump: remove everything except the hero and the progress bar */
@media (aspect-ratio: 1/1) {
  .day-row      { display: none; }
  .week-bar     { display: none; }
  .secondary-row { display: none; }
}

/* Keyboard: strip down to hero + label only */
@media (min-aspect-ratio: 1.8) and (max-height: 200px) {
  .day-row        { display: none; }
  .progress-bar   { display: none; }
  .secondary-row  { display: none; }
  .motivational   { display: none !important; }
}
```

### One Hero Element — Always Centered, Always Visible

Every widget must have one dominant element that survives all screen sizes. Make it large (20–22vmin), centered, and the last thing to ever be hidden:

```css
.hero-value {
  position: absolute;   /* or large flex item */
  font-size: var(--font-hero);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
}
```

### Layout Distribution — `justify-content`

Use `space-evenly` (not `center`) as the default for content panels so elements fill the full slot height naturally:
```css
.state-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}
```

For tall portrait slots (L-V, XL-V) where items would spread too far, constrain with `max-width` and switch to `center + gap`:
```css
@media (max-aspect-ratio: 0.5) {
  .state-panel {
    max-width: 80vmin;
    justify-content: center;
    gap: 3vmin;
  }
}
```

### CSS Percentage Padding Pitfall

CSS percentage padding (top/bottom included) is **always relative to the element's width**. In S-H (840×344), `padding: 8%` means 8% × 840px = 67px top/bottom — consuming 40% of the 344px height. Use `vmin` for padding instead:
```css
/* ✅ vmin padding scales safely with screen */
.state-panel { padding: 5vmin 8vmin; }
```

### iCUE Preview vs Device

The iCUE settings panel preview is a **scaled-down screenshot** of the widget at full resolution — not a separate viewport. No CSS or JS can specifically target it. Optimize for the device; the preview will be denser. (Known platform limitation.)

### Background Layers

For authoritative layer rules, `.main-glass` optionality, and media background interaction details, follow `references/media-backgrounds.md`.

### Colors and Transparency

CSS custom properties (`--text-color`, `--bg-color`, `--bg-opacity`, etc.) are set by JavaScript in `applyStyles()`. The CSS template declares matching defaults so the widget renders correctly in a plain browser without iCUE.

### Accessibility

The `prefers-reduced-motion` media query is included by default and costs nothing — leave it in.
