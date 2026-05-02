'use strict';

/**
 * modules/media.js — Media info from iCUE SDK + server-side enhancement.
 *
 * iCUE SDK provides: getSongName, getArtist, triggerPlayPause/Next/Previous.
 * Server provides: album art (thumbnail), app name, more accurate title,
 *                  playback status, speaker volume/mute.
 *
 * SDK gaps documented in CLAUDE.md:
 *   - No playback status API → assume Playing when title/artist present
 *   - No artwork API → server provides; shown as disabled badge when offline
 *   - No audio device/volume API → server provides; ms-settings link as fallback
 */
(function () {
  const Hub = window.XenonEdgeHub;

  // ── iCUE media polling ────────────────────────────────────────────────────

  /**
   * Refreshes title/artist from the iCUE media provider.
   * Runs every ~5 s when server is offline; server data takes priority.
   */
  Hub.refreshMediaState = async function () {
    const wrapper = Hub.state.mediaWrapper;
    if (!wrapper) return;

    try {
      const [title, artist] = await Promise.all([
        wrapper.getSongName(),
        wrapper.getArtist()
      ]);

      const active = !!(title || artist);
      Hub.state.media.active = active;
      Hub.state.media.title  = title  || '';
      Hub.state.media.artist = artist || '';
      // Infer playback status (SDK gap: no direct status field)
      if (!Hub.state.serverOnline) {
        Hub.state.media.playbackStatus = active ? 'Playing' : 'Paused';
      }

      Hub.log('media', 'iCUE → title:', title, 'artist:', artist);

      // Apply to DOM only when server is offline (server data wins when online)
      if (!Hub.state.serverOnline) Hub.renderMediaState();
    } catch (err) {
      Hub.warn('media', 'iCUE refresh failed:', err.message);
    }
  };

  // ── DOM rendering ─────────────────────────────────────────────────────────

  Hub.renderMediaState = function () {
    const m      = Hub.state.media;

    // Mirror server logic: auto-show calendar when no media is active
    if (!m.active) {
      Hub.state.calendarAutoShown = true;
      Hub.showCalendar(true, true);
    } else if (Hub.state.calendarAutoShown) {
      Hub.state.calendarAutoShown = false;
      Hub.showCalendar(false, true);
    }

    const titleEl  = document.getElementById('media-title');
    const artistEl = document.getElementById('media-artist');
    const artEl    = document.getElementById('media-art');
    const appEl    = document.getElementById('media-app');

    if (titleEl)  titleEl.textContent  = m.title  || Hub.tr('media_empty_title');
    if (artistEl) artistEl.textContent = m.artist || Hub.tr('media_empty_sub');
    if (appEl)    appEl.textContent    = m.app    || 'Media';

    // Album art
    if (artEl) {
      if (m.thumbnail) {
        // Server provided a URL/base64 thumbnail
        artEl.innerHTML = `<img src="${m.thumbnail}" alt="" class="media-cover-img" loading="lazy">`;
      } else {
        // Show placeholder equalizer animation
        artEl.innerHTML = `<div class="media-placeholder">
          <div class="ph-eq"><span></span><span></span><span></span><span></span><span></span></div>
          <div class="ph-label">${m.active ? 'Playing' : 'No Media'}</div>
        </div>`;
      }
    }

    Hub._syncPlayPauseIcons();
    Hub.updateCalendarMiniPlayer();
  };

  // ── Server media fetch ───────────────────────────────────────────────────

  Hub.fetchMediaFromServer = async function () {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      const res  = await fetch(Hub.state.serverUrl + '/media', { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json();

      Hub.state.media = {
        active:         !!(data.title || data.artist),
        title:          data.title     || '',
        artist:         data.artist    || '',
        album:          data.album     || '',
        app:            data.app       || '',
        thumbnail:      data.thumbnail || '',
        playbackStatus: data.status    || (data.title ? 'Playing' : 'Paused')
      };
      Hub.log('media', 'server → ', Hub.state.media.title, 'status:', Hub.state.media.playbackStatus);
      Hub.renderMediaState();
    } catch (_) { /* server unavailable — keep iCUE data */ }
  };

  // ── Playback controls ────────────────────────────────────────────────────

  Hub.mediaAction = async function (action) {
    // Try server first (more reliable for certain players)
    if (Hub.state.serverOnline) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 2000);
        await fetch(Hub.state.serverUrl + '/media/' + action, {
          method: 'POST', signal: ctrl.signal
        });
        // Refresh state after a short delay for the player to respond
        setTimeout(Hub.fetchMediaFromServer, 400);
        return;
      } catch (_) { /* fall through to iCUE */ }
    }

    // iCUE SDK transport controls
    const provider = window.plugins && window.plugins.Mediadataprovider;
    if (!provider) return;
    switch (action) {
      case 'playpause': provider.triggerPlayPause();    break;
      case 'next':      provider.triggerNextTrack();    break;
      case 'previous':  provider.triggerPreviousTrack(); break;
    }
    // Infer state change (SDK gap: no status signal)
    if (action === 'playpause') {
      Hub.state.media.playbackStatus =
        Hub.state.media.playbackStatus === 'Playing' ? 'Paused' : 'Playing';
      Hub._syncPlayPauseIcons();
    }
    setTimeout(Hub.refreshMediaState, 400);
  };

  // ── Audio section (server-only) ──────────────────────────────────────────

  Hub.fetchAudioFromServer = async function () {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      const res  = await fetch(Hub.state.serverUrl + '/audio', { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json();

      Hub.state.audio.speakerVolume = (data.speaker && data.speaker.volume  != null) ? data.speaker.volume  : 50;
      Hub.state.audio.speakerMuted  = (data.speaker && data.speaker.muted   != null) ? data.speaker.muted   : false;
      Hub.state.audio.micVolume     = (data.mic     && data.mic.volume      != null) ? data.mic.volume      : 50;
      Hub.state.audio.micMuted      = (data.mic     && data.mic.muted       != null) ? data.mic.muted       : false;
      Hub.state.audio.speakerName   = (data.speakers && data.speakers[0] && data.speakers[0].name) || '';
      Hub.state.audio.micName       = (data.mics     && data.mics[0]     && data.mics[0].name)     || '';

      Hub.renderAudioState();
    } catch (_) { /* keep previous state */ }
  };

  Hub.fetchMicStateFromServer = async function () {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 2000);
      const res  = await fetch(Hub.state.serverUrl + '/status', { signal: ctrl.signal });
      if (!res.ok) return;
      const data = await res.json();
      Hub.state.audio.micMuted = !!data.muted;
      Hub.renderMicState();
    } catch (_) { /* ignore */ }
  };

  Hub.toggleMicMute = async function () {
    if (!Hub.state.serverOnline) {
      Hub.tryOpenLink('ms-settings:sound');
      return;
    }
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 2000);
      await fetch(Hub.state.serverUrl + '/toggle', { method: 'POST', signal: ctrl.signal });
      await Hub.fetchMicStateFromServer();
    } catch (_) { /* ignore */ }
  };

  Hub.setMicVolume = async function (value) {
    if (!Hub.state.serverOnline) return;
    Hub.state.audio.micVolume = value;
    _renderMicVolumeUI(value);
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 2000);
      await fetch(Hub.state.serverUrl + '/mic/volume', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ level: value }),
        signal:  ctrl.signal
      });
    } catch (_) { /* ignore */ }
  };

  Hub.setSpeakerVolume = async function (value) {
    if (!Hub.state.serverOnline) return;
    Hub.state.audio.speakerVolume = value;
    _renderSpeakerVolumeUI(value);
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 2000);
      await fetch(Hub.state.serverUrl + '/volume/set', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ level: value }),
        signal:  ctrl.signal
      });
    } catch (_) { /* ignore */ }
  };

  Hub.toggleSpeakerMute = async function () {
    if (!Hub.state.serverOnline) {
      Hub.tryOpenLink('ms-settings:sound');
      return;
    }
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 2000);
      await fetch(Hub.state.serverUrl + '/speaker/mute', { method: 'POST', signal: ctrl.signal });
      await Hub.fetchAudioFromServer();
    } catch (_) { /* ignore */ }
  };

  // ── DOM: mic panel ────────────────────────────────────────────────────────

  Hub.renderMicState = function () {
    const muted   = Hub.state.audio.micMuted;
    const online  = Hub.state.serverOnline;
    const btn     = document.getElementById('mic-btn');
    const ring    = document.getElementById('ring');
    const ring2   = document.getElementById('ring2');
    const glow    = document.getElementById('glow');
    const label   = document.getElementById('status-label');
    const context = document.getElementById('mic-context');
    const svgOn   = document.getElementById('svg-on');
    const svgOff  = document.getElementById('svg-off');
    const overlay = document.getElementById('mic-offline-overlay');

    // Offline overlay
    if (overlay) overlay.style.display = online ? 'none' : '';

    if (!online) {
      // Neutral state when server is offline
      [btn, ring, ring2, glow].forEach(el => {
        if (el) { el.classList.remove('active', 'muted'); el.classList.add('offline'); }
      });
      if (label)   label.textContent = Hub.tr('mic_server_required');
      if (context) context.textContent = '';
      return;
    }

    // Active / muted state
    const isActive = !muted;
    [btn, ring, ring2, glow].forEach(el => {
      if (!el) return;
      el.classList.remove('offline');
      el.classList.toggle('active', isActive);
      el.classList.toggle('muted',  !isActive);
    });

    if (label) {
      label.textContent = Hub.tr(muted ? 'mic_muted' : 'mic_active');
      label.classList.toggle('active', isActive);
    }
    if (context) context.textContent = Hub.tr('mic_input_live');
    if (svgOn)  svgOn.style.display  = muted ? 'none' : '';
    if (svgOff) svgOff.style.display = muted ? ''     : 'none';

    _renderMicVolumeUI(Hub.state.audio.micVolume);
  };

  function _renderMicVolumeUI (value) {
    const valEl    = document.getElementById('mic-vol-val');
    const slider   = document.getElementById('mic-vol-slider');
    if (valEl)  valEl.textContent = value + '%';
    if (slider) slider.value      = value;
  }

  // ── DOM: audio section ───────────────────────────────────────────────────

  Hub.renderAudioState = function () {
    const online  = Hub.state.serverOnline;
    const overlay = document.getElementById('audio-offline-overlay');
    if (overlay) overlay.style.display = online ? 'none' : '';

    if (!online) return;

    _renderSpeakerVolumeUI(Hub.state.audio.speakerVolume);

    const spkMuted = Hub.state.audio.speakerMuted;
    const iconOn  = document.getElementById('spk-icon-on');
    const iconOff = document.getElementById('spk-icon-off');
    if (iconOn)  iconOn.style.display  = spkMuted ? 'none' : '';
    if (iconOff) iconOff.style.display = spkMuted ? ''     : 'none';

    const spkName = document.getElementById('spk-name');
    const micName = document.getElementById('mic-name');
    if (spkName) spkName.textContent = Hub.state.audio.speakerName || '--';
    if (micName) micName.textContent = Hub.state.audio.micName     || '--';
  };

  function _renderSpeakerVolumeUI (value) {
    const valEl  = document.getElementById('vol-val');
    const slider = document.getElementById('vol-slider');
    if (valEl)  valEl.textContent = value + '%';
    if (slider) slider.value      = value;
  }

  // ── Link helper ──────────────────────────────────────────────────────────

  Hub.tryOpenLink = function (url) {
    const provider = window.plugins && window.plugins.Linkprovider;
    const ready    = typeof pluginLinkprovider_initialized !== 'undefined' && pluginLinkprovider_initialized;
    if (provider && ready) {
      provider.open(url);
    } else {
      window.open(url, '_blank');
    }
  };
}());
