'use strict';

const i18n = {
  it: {
    locale: 'it-IT',
    weekdays: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
    online: 'Online', offline: 'Offline',
    open_calendar: 'Calendario',
    media_empty_title: 'Niente in riproduzione',
    media_empty_sub: 'Spotify, YouTube e altri player compariranno qui',
    media_unknown_title: 'Titolo non disponibile',
    tip_prev: 'Precedente', tip_play: 'Play/Pausa', tip_next: 'Successivo',
    agenda: 'Agenda personale', calendar: 'Calendario', media: 'Musica',
    today: 'Oggi', prev_month: 'Mese precedente', next_month: 'Mese successivo',
    add: 'Aggiungi', close: 'Chiudi', delete_event: 'Elimina',
    ph_title: 'Titolo evento', ph_notes: 'Nota breve',
    no_events: 'Nessun evento per questo giorno',
    upcoming: 'Prossimi eventi', no_upcoming: 'Nessun evento in programma',
    reminder: 'Promemoria', desktop_title: 'Promemoria Xenon Edge',
    now_playing: 'Musica in riproduzione', active_player: 'Player attivo',
    reminder_at: "All'orario", reminder_5: '5 min prima', reminder_15: '15 min prima',
    reminder_30: '30 min prima', reminder_60: '1 ora prima', reminder_1440: '1 giorno prima',
    reminder_none: 'Nessuna notifica',
    mic_active: 'Microfono attivo', mic_muted: 'Microfono mutato',
    mic_input_live: 'Ingresso live', mic_sensitivity: 'Sensibilità ingresso',
    mic_mute_tip: 'Microfono mute',
    notes_title: 'Appunti',
    notes_placeholder: 'Scrivi qui i tuoi appunti — vengono salvati automaticamente…',
    section_system: 'Sistema', uptime_prefix: 'Acceso da',
    sys_tab_main: 'Sistema', sys_tab_net: 'Rete & Gaming',
    net_ping: 'PING', net_ping_sub: 'Risposta server DNS',
    net_fps: 'FPS', net_fps_sub: 'Richiede PresentMon / FrameView',
    net_latency: 'LATENZA', net_latency_sub: 'Variazione del ping',
    net_bandwidth: 'RETE', net_bandwidth_sub: 'Throughput istantaneo',
    metric_na: 'N/D',
    gpu_loading: 'GPU in rilevamento',
    disk_cycle_tip: 'Disco successivo', disk_label: 'DISCO',
    disk_detail_unavailable: 'Dettaglio non disponibile',
    ram_detail_unavailable: 'Dettaglio RAM non disponibile',
    gb_free: 'liberi',
    vol_title: 'Volume', vol_mute_tip: 'Muta altoparlante',
    device_speaker: 'Altoparlante', device_mic: 'Microfono',
    picker_speaker: 'Seleziona altoparlante', picker_mic: 'Seleziona microfono',
    media_player_dynamic: 'Lettore Multimediale',
    tip_lock: 'Blocca schermo', tip_tabs: 'Apri tab', tip_apps: 'Applicazioni aperte',
    apps_title: 'Applicazioni aperte', apps_loading: 'Caricamento applicazioni…',
    apps_empty: 'Nessuna finestra aperta trovata', apps_refresh: 'Aggiorna',
    apps_active: 'Attiva', apps_open: 'Apri applicazione', apps_minimized: 'Minimizzata',
    apps_favorite: 'Aggiungi ai preferiti', apps_unfavorite: 'Rimuovi dai preferiti', apps_favorite_open: 'Apri preferito',
    tip_shortcuts: 'Shortcut personalizzate',
    tabs_title: 'Tab widget', tab_current: 'Attivo',
    tab_full: 'Dashboard', tab_full_sub: 'Vista completa',
    tab_media: 'Media', tab_media_sub: 'Musica e calendario',
    tab_mic: 'Microfono', tab_mic_sub: 'Mute e sensibilità',
    tab_notes: 'Appunti', tab_notes_sub: 'Note rapide',
    tab_system: 'Sistema', tab_system_sub: 'CPU, GPU, RAM',
    tab_audio: 'Audio', tab_audio_sub: 'Volume e dispositivi',
    sc_title: 'Shortcut personalizzate', sc_none: 'Nessuna shortcut ancora.\nAggiungine una!',
    sc_add: '+ Aggiungi shortcut', sc_name_ph: 'Nome shortcut',
    sc_keys_ph: 'Clicca qui e premi i tasti…',
    sc_keys_rec: '⌨ Premi i tasti…',
    sc_save: 'Salva', sc_cancel: 'Annulla', sc_del: 'Rimuovi'
  },
  en: {
    locale: 'en-US',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    online: 'Online', offline: 'Offline',
    open_calendar: 'Calendar',
    media_empty_title: 'Nothing playing',
    media_empty_sub: 'Spotify, YouTube and other players will appear here',
    media_unknown_title: 'Title unavailable',
    tip_prev: 'Previous', tip_play: 'Play/Pause', tip_next: 'Next',
    agenda: 'Personal agenda', calendar: 'Calendar', media: 'Music',
    today: 'Today', prev_month: 'Previous month', next_month: 'Next month',
    add: 'Add', close: 'Close', delete_event: 'Delete',
    ph_title: 'Event title', ph_notes: 'Short note',
    no_events: 'No events for this day',
    upcoming: 'Upcoming events', no_upcoming: 'No upcoming events',
    reminder: 'Reminder', desktop_title: 'Xenon Edge Reminder',
    now_playing: 'Music playing', active_player: 'Active player',
    reminder_at: 'At time', reminder_5: '5 min before', reminder_15: '15 min before',
    reminder_30: '30 min before', reminder_60: '1 hour before', reminder_1440: '1 day before',
    reminder_none: 'No notification',
    mic_active: 'Microphone active', mic_muted: 'Microphone muted',
    mic_input_live: 'Live input', mic_sensitivity: 'Input sensitivity',
    mic_mute_tip: 'Mute microphone',
    notes_title: 'Notes',
    notes_placeholder: 'Type your notes here — they are saved automatically…',
    section_system: 'System', uptime_prefix: 'Up for',
    sys_tab_main: 'System', sys_tab_net: 'Network & Gaming',
    net_ping: 'PING', net_ping_sub: 'DNS server response',
    net_fps: 'FPS', net_fps_sub: 'Requires PresentMon / FrameView',
    net_latency: 'LATENCY', net_latency_sub: 'Ping variation',
    net_bandwidth: 'NETWORK', net_bandwidth_sub: 'Live throughput',
    metric_na: 'N/A',
    gpu_loading: 'Detecting GPU',
    disk_cycle_tip: 'Next disk', disk_label: 'DISK',
    disk_detail_unavailable: 'Detail unavailable',
    ram_detail_unavailable: 'RAM detail unavailable',
    gb_free: 'free',
    vol_title: 'Volume', vol_mute_tip: 'Mute speaker',
    device_speaker: 'Speaker', device_mic: 'Microphone',
    picker_speaker: 'Select speaker', picker_mic: 'Select microphone',
    media_player_dynamic: 'Media Player',
    tip_lock: 'Lock screen', tip_tabs: 'Open tabs', tip_apps: 'Open applications',
    apps_title: 'Open applications', apps_loading: 'Loading applications…',
    apps_empty: 'No open windows found', apps_refresh: 'Refresh',
    apps_active: 'Active', apps_open: 'Open application', apps_minimized: 'Minimized',
    apps_favorite: 'Add to favorites', apps_unfavorite: 'Remove from favorites', apps_favorite_open: 'Open favorite',
    tip_shortcuts: 'Custom shortcuts',
    tabs_title: 'Widget tabs', tab_current: 'Active',
    tab_full: 'Dashboard', tab_full_sub: 'Full view',
    tab_media: 'Media', tab_media_sub: 'Music and calendar',
    tab_mic: 'Microphone', tab_mic_sub: 'Mute and sensitivity',
    tab_notes: 'Notes', tab_notes_sub: 'Quick notes',
    tab_system: 'System', tab_system_sub: 'CPU, GPU, RAM',
    tab_audio: 'Audio', tab_audio_sub: 'Volume and devices',
    sc_title: 'Custom shortcuts', sc_none: 'No shortcuts yet.\nAdd one!',
    sc_add: '+ Add shortcut', sc_name_ph: 'Shortcut name',
    sc_keys_ph: 'Click here and press keys…',
    sc_keys_rec: '⌨ Press keys…',
    sc_save: 'Save', sc_cancel: 'Cancel', sc_del: 'Remove'
  }
};

function t(key) {
  return (i18n[lang] && i18n[lang][key]) ?? i18n.it[key] ?? key;
}

function localizeAppName(name) {
  if (!name) return '';
  if (lang === 'en' && /lettore\s+multimediale/i.test(name)) return 'Media Player';
  if (lang === 'it' && /^media\s+player$/i.test(name)) return 'Lettore Multimediale';
  return name;
}

function applyTranslations() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('.lang-seg').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  if (statusDot) statusDot.title = statusDot.classList.contains('offline') ? t('offline') : t('online');
  if (typeof muted === 'boolean') applyUI(muted);
  if (mediaData) applyMedia(mediaData); else refreshMediaEmpty();
  if (audioData) applyAudio(audioData);
  if (calendarMode) renderCalendar();
  renderUpcoming();
  if ($('day-modal').classList.contains('open') && modalDateValue) {
    updateDayModalTitle();
    renderDayModalEvents();
  }
  tickClock();
  renderAppFavorites();
  if ($('app-switcher') && !$('app-switcher').hidden) renderAppWindows();
  if ($('sc-backdrop') && !$('sc-backdrop').hidden) renderScList();
}

function setLang(l) {
  if (!i18n[l] || l === lang) return;
  lang = l;
  localStorage.setItem('uiLang', l);
  applyTranslations();
}
