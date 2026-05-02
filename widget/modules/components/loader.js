'use strict';

/**
 * modules/components/loader.js — Development-only component loader.
 *
 * In production (after `npm run icue:package`), this file is removed and
 * components/dashboard.html + components/overlays.html are inlined directly
 * into index.html by the packager. modules/app.js is then injected as the
 * final script tag.
 *
 * In development, this script:
 *   1. Fetches dashboard.html and overlays.html (resolving nested data-component-path)
 *   2. Injects the markup into #xenonedge-root and #xenonedge-overlays
 *   3. Dynamically loads modules/app.js to boot the widget
 */
(async function () {
  async function fetchText (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.text();
  }

  async function resolveComponents (html) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const slots  = doc.querySelectorAll('[data-component-path]');
    for (const slot of slots) {
      const path   = slot.getAttribute('data-component-path');
      const inner  = await fetchText(path);
      const resolved = await resolveComponents(inner);
      slot.outerHTML = resolved;
    }
    return doc.body.innerHTML;
  }

  try {
    const [dashboardHtml, overlaysHtml] = await Promise.all([
      fetchText('components/dashboard.html'),
      fetchText('components/overlays.html')
    ]);

    const rootEl     = document.getElementById('xenonedge-root');
    const overlaysEl = document.getElementById('xenonedge-overlays');

    if (rootEl)     rootEl.innerHTML     = await resolveComponents(dashboardHtml);
    if (overlaysEl) overlaysEl.innerHTML = await resolveComponents(overlaysHtml);

    // Boot the app exactly as the packager would
    const script = document.createElement('script');
    script.src   = 'modules/app.js';
    document.body.appendChild(script);
  } catch (err) {
    console.error('[XEH/loader] Failed to load components:', err);
    const rootEl = document.getElementById('xenonedge-root');
    if (rootEl) rootEl.textContent = 'Component load error — see console.';
  }
}());
