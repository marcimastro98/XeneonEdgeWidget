'use strict';

// ── Panel routing ─────────────────────────────────────────────
const panelParam = (new URLSearchParams(window.location.search).get('panel') || '').toLowerCase();
const VALID_PANELS = ['media', 'mic', 'notes', 'system', 'audio'];
const activePanel = VALID_PANELS.includes(panelParam) ? panelParam : 'full';
if (activePanel !== 'full') document.body.dataset.panel = activePanel;

// ── Initial render ────────────────────────────────────────────
tickClock();
applyTranslations();
refreshSlider(50);
refreshMicSlider(50);
renderTabSwitcher();

// ── Per-panel data needs ──────────────────────────────────────
const need = {
  status: ['full', 'mic', 'media'].includes(activePanel),
  audio:  ['full', 'audio', 'mic'].includes(activePanel),
  media:  ['full', 'media'].includes(activePanel),
  system: ['full', 'system'].includes(activePanel),
  events: ['full', 'media'].includes(activePanel),
  notes:  ['full', 'notes'].includes(activePanel),
};

setInterval(tickClock, 1000);
if (need.status) { pollStatus(); setInterval(pollStatus, 3000); }
if (need.audio)  { fetchAudio(); setInterval(fetchAudio, 5000); }
if (need.media)  { fetchMedia(); setInterval(fetchMedia, 2000); }
if (need.system) { fetchSystem(); setInterval(fetchSystem, 7000); }
if (need.events) { loadCalendarEvents(); setInterval(checkReminders, 15000); }
if (need.notes)  { loadNotes(); }

// ── Init custom shortcut buttons ──────────────────────────────
renderAppFavorites();
renderQbtnCustom();

// ── Keyboard listener (Escape + shortcut recording) ───────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (scRecording) {
      e.preventDefault();
      stopScRecording();
      return;
    }
    const appSwitcher = document.getElementById('app-switcher');
    if (appSwitcher && !appSwitcher.hidden) {
      e.preventDefault();
      closeAppSwitcher();
      return;
    }
    const tabSwitcher = document.getElementById('tab-switcher');
    if (tabSwitcher && !tabSwitcher.hidden) {
      e.preventDefault();
      closeTabSwitcher();
      return;
    }
    return;
  }
  if (!scRecording || !scRecordInput) return;
  if (['Control','Shift','Alt','Meta'].includes(e.key)) return;
  e.preventDefault();
  e.stopPropagation();
  const mods = { ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey };
  const parts = [];
  if (mods.ctrl) parts.push('Ctrl');
  if (mods.shift) parts.push('Shift');
  if (mods.alt) parts.push('Alt');
  const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(keyName);
  scRecordInput.value = parts.join('+');
  scRecordInput.dataset.sendkeys = scKeysToSendKeys(mods, e.key);
  stopScRecording();
}, true);

// ── Sync language across iframes via storage event ────────────
window.addEventListener('storage', e => {
  if (e.key === 'uiLang' && e.newValue && e.newValue !== lang && i18n[e.newValue]) {
    lang = e.newValue;
    applyTranslations();
  }
  if (e.key === 'appFavorites') {
    appFavorites = parseAppFavorites(e.newValue || '[]');
    renderAppFavorites();
    if ($('app-switcher') && !$('app-switcher').hidden) renderAppWindows();
  }
});

// ── Quick-action buttons ──────────────────────────────────────
async function quickLock() {
  try { await fetch('/lock', { method: 'POST' }); } catch {}
}

// ── Save notes on unload ──────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (notesSaveTimer) {
    clearTimeout(notesSaveTimer);
    const ta = document.getElementById('notes-area');
    if (ta && notesLoaded) {
      try {
        navigator.sendBeacon('/notes', new Blob([JSON.stringify({ text: ta.value })], { type: 'application/json' }));
      } catch {}
    }
  }
});
