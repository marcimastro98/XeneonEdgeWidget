'use strict';

/**
 * modules/notes.js — Scratch-pad notes with debounced auto-save.
 * When server is online, also persists to /notes.
 */
(function () {
  const Hub = window.XenonEdgeHub;

  const MAX_BYTES   = 200 * 1024; // 200 KB guard
  let   _saveTimer  = null;
  let   _statusTimer = null;

  function _showSaveIndicator (state) {
    const dot = document.getElementById('notes-status-dot');
    if (!dot) return;
    dot.classList.remove('saving', 'saved', 'error');
    if (state) dot.classList.add(state);
    clearTimeout(_statusTimer);
    if (state === 'saved') {
      _statusTimer = setTimeout(() => dot.classList.remove('saved'), 2000);
    }
  }

  async function _persist (text) {
    Hub.saveNotes(text);
    _showSaveIndicator('saved');

    if (!Hub.state.serverOnline) return;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      await fetch(Hub.state.serverUrl + '/notes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes: text }),
        signal:  ctrl.signal
      });
    } catch (_) { /* server unreachable — already saved locally */ }
  }

  Hub.onNotesInput = function (value) {
    if (value.length > MAX_BYTES) return; // silently ignore oversized input
    _showSaveIndicator('saving');
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => _persist(value), 800);
  };

  /** Loads notes from server first (if online), then falls back to localStorage. */
  Hub.initNotes = async function () {
    Hub.loadNotes(); // populate from localStorage immediately

    if (!Hub.state.serverOnline) return;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      const res  = await fetch(Hub.state.serverUrl + '/notes', { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.notes === 'string') {
        Hub.state.notes = data.notes;
        Hub.saveNotes(data.notes);
        const area = document.getElementById('notes-area');
        if (area) area.value = data.notes;
      }
    } catch (_) { /* keep localStorage version */ }
  };
}());
