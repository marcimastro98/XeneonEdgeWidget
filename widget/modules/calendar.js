'use strict';

/**
 * modules/calendar.js — Calendar rendering, CRUD and reminder engine.
 * Persists via storage.js (localStorage + optional server sync).
 */
(function () {
  const Hub = window.XenonEdgeHub;

  let _toastTimer = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _eventsForDate (dateValue) {
    return Hub.state.events
      .filter(e => String(e.startsAt || '').slice(0, 10) === dateValue)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }

  function _q (id) { return document.getElementById(id); }

  // ── Rendering ─────────────────────────────────────────────────────────────

  Hub.renderCalendar = function () {
    const locale = Hub.tr('locale');
    const viewDate = Hub.state.calendarViewDate || new Date();
    const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewDate);
    const monthEl = _q('calendar-month');
    if (monthEl) monthEl.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    // Weekday header
    const weekdaysEl = _q('calendar-weekdays');
    if (weekdaysEl) {
      weekdaysEl.innerHTML = '';
      Hub.tr('weekdays').forEach(day => {
        const span = document.createElement('span');
        span.textContent = day;
        weekdaysEl.appendChild(span);
      });
    }

    // Day cells
    const daysEl = _q('calendar-days');
    if (!daysEl) return;
    daysEl.innerHTML = '';
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const offset     = (first.getDay() + 6) % 7; // Monday-first offset
    const totalDays  = new Date(year, month + 1, 0).getDate();
    const todayValue = Hub.toDateValue(new Date());
    daysEl.style.setProperty('--calendar-weeks', String(Math.ceil((offset + totalDays) / 7)));

    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('button');
      empty.className = 'day-cell empty';
      empty.tabIndex  = -1;
      daysEl.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateValue = Hub.toDateValue(new Date(year, month, day));
      const cell = document.createElement('button');
      cell.type      = 'button';
      cell.className = 'day-cell';
      cell.textContent = day;
      if (dateValue === todayValue)                        cell.classList.add('today');
      if (dateValue === Hub.state.selectedCalendarDate)    cell.classList.add('selected');
      if (_eventsForDate(dateValue).length)                cell.classList.add('has-events');
      cell.onclick = () => Hub.openDayModal(dateValue);
      daysEl.appendChild(cell);
    }

    Hub.renderUpcoming();
  };

  Hub.renderUpcoming = function () {
    const list = _q('upcoming-list');
    if (!list) return;
    const now      = Date.now();
    const upcoming = Hub.state.events
      .filter(e => Date.parse(e.startsAt) >= now - 60000)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 5);

    list.innerHTML = '';
    if (!upcoming.length) {
      const empty = document.createElement('div');
      empty.className   = 'event-empty';
      empty.textContent = Hub.tr('no_upcoming');
      list.appendChild(empty);
      return;
    }

    const fmt = new Intl.DateTimeFormat(Hub.tr('locale'), {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    upcoming.forEach(e => {
      const item = document.createElement('div');
      item.className = 'upcoming-item';
      item.onclick   = () => Hub.openDayModal(String(e.startsAt).slice(0, 10));

      const dot  = document.createElement('span'); dot.className  = 'upcoming-dot';
      const name = document.createElement('span'); name.className = 'upcoming-name';
      name.textContent = e.title || Hub.tr('ph_title');
      const when = document.createElement('span'); when.className = 'upcoming-when';
      when.textContent = fmt.format(new Date(e.startsAt));

      item.append(dot, name, when);
      list.appendChild(item);
    });
  };

  // ── Day modal ─────────────────────────────────────────────────────────────

  Hub.openDayModal = function (dateValue) {
    Hub.state.modalDateValue      = dateValue;
    Hub.state.selectedCalendarDate = dateValue;
    _updateDayModalTitle();
    _renderDayModalEvents();

    const titleInput = _q('event-title');
    const notesInput = _q('event-notes');
    const timeInput  = _q('event-time');
    const remInput   = _q('event-reminder');
    if (titleInput) titleInput.value = '';
    if (notesInput) notesInput.value = '';
    if (timeInput)  timeInput.value  = '09:00';
    if (remInput)   remInput.value   = '0';

    const modal = _q('day-modal');
    if (modal) modal.classList.add('open');
    if (titleInput) setTimeout(() => titleInput.focus(), 80);
    if (Hub.state.calendarMode) Hub.renderCalendar();
  };

  Hub.closeDayModal = function () {
    Hub.state.modalDateValue = null;
    const modal = _q('day-modal');
    if (modal) modal.classList.remove('open');
  };

  function _updateDayModalTitle () {
    const dateValue = Hub.state.modalDateValue;
    if (!dateValue) return;
    const formatted = new Intl.DateTimeFormat(Hub.tr('locale'), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateValue + 'T00:00:00'));
    const el = _q('day-modal-title');
    if (el) el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function _renderDayModalEvents () {
    const list      = _q('day-modal-events');
    if (!list) return;
    const dateValue = Hub.state.modalDateValue || Hub.state.selectedCalendarDate;
    const events    = _eventsForDate(dateValue);
    list.innerHTML  = '';

    if (!events.length) {
      const empty = document.createElement('div');
      empty.className   = 'event-empty';
      empty.textContent = Hub.tr('no_events');
      list.appendChild(empty);
      return;
    }

    const fmt = new Intl.DateTimeFormat(Hub.tr('locale'), { hour: '2-digit', minute: '2-digit' });
    events.forEach(event => {
      const item = document.createElement('div');
      item.className = 'event-item';

      const top  = document.createElement('div'); top.className = 'event-item-top';
      const name = document.createElement('div'); name.className = 'event-name';
      name.textContent = event.title || Hub.tr('ph_title');
      const time = document.createElement('div'); time.className = 'event-time';
      time.textContent = fmt.format(new Date(event.startsAt));

      const del = document.createElement('button');
      del.type      = 'button';
      del.className = 'event-delete';
      del.title     = Hub.tr('delete_event');
      del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      del.onclick   = () => Hub.deleteEvent(event.id);

      top.append(name, time, del);
      item.appendChild(top);

      if (event.notes) {
        const meta = document.createElement('div');
        meta.className   = 'event-meta';
        meta.textContent = event.notes;
        item.appendChild(meta);
      }
      list.appendChild(item);
    });
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  Hub.saveCalendarEvent = async function () {
    const titleEl  = _q('event-title');
    const notesEl  = _q('event-notes');
    const timeEl   = _q('event-time');
    const remEl    = _q('event-reminder');
    if (!titleEl) return;

    const title = titleEl.value.trim();
    const date  = Hub.state.modalDateValue || Hub.state.selectedCalendarDate;
    const starts = Hub.combineDateTime(date, timeEl ? timeEl.value : '09:00');
    if (!title || !starts) return;

    const reminderMins = Number(remEl ? remEl.value : -1);
    const reminderAt   = reminderMins >= 0
      ? Hub.toLocalDateTimeValue(new Date(starts.getTime() - reminderMins * 60000))
      : '';

    Hub.state.events.push({
      id:         `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      notes:      notesEl ? notesEl.value.trim() : '',
      startsAt:   Hub.toLocalDateTimeValue(starts),
      reminderAt,
      notifiedAt: '',
      createdAt:  Hub.toLocalDateTimeValue(new Date())
    });

    if (titleEl) titleEl.value = '';
    Hub.state.selectedCalendarDate = date;
    Hub.state.calendarViewDate     = new Date(starts.getFullYear(), starts.getMonth(), 1);

    await Hub.persistEvents();
    if (Hub.state.calendarMode) Hub.renderCalendar();
    _renderDayModalEvents();
    Hub.renderUpcoming();

    if ('Notification' in window && Notification.permission === 'default') {
      try { Promise.resolve(Notification.requestPermission()).catch(() => {}); } catch (_) {}
    }
  };

  Hub.deleteEvent = async function (id) {
    Hub.state.events = Hub.state.events.filter(e => e.id !== id);
    await Hub.persistEvents();
    if (Hub.state.calendarMode) Hub.renderCalendar();
    const modal = _q('day-modal');
    if (modal && modal.classList.contains('open')) _renderDayModalEvents();
    Hub.renderUpcoming();
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  Hub.moveCalendarMonth = function (delta) {
    const d = Hub.state.calendarViewDate || new Date();
    Hub.state.calendarViewDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
    Hub.renderCalendar();
  };

  Hub.jumpCalendarToday = function () {
    const today = new Date();
    Hub.state.selectedCalendarDate = Hub.toDateValue(today);
    Hub.state.calendarViewDate     = new Date(today.getFullYear(), today.getMonth(), 1);
    Hub.renderCalendar();
  };

  // ── Reminder engine ───────────────────────────────────────────────────────

  Hub.checkReminders = async function () {
    if (!Hub.state.calendarLoaded || !Hub.state.events.length) return;
    const now     = Date.now();
    let   changed = false;

    Hub.state.events.forEach(event => {
      if (!event.reminderAt || event.notifiedAt) return;
      const when = Date.parse(event.reminderAt);
      if (Number.isFinite(when) && when <= now) {
        event.notifiedAt = new Date().toISOString();
        changed = true;
        _showReminder(event);
      }
    });

    if (changed) await Hub.persistEvents();
  };

  function _playReminderSound () {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      function _beep (freq, startOffset, dur) {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
        g.gain.setValueAtTime(0, ctx.currentTime + startOffset);
        g.gain.linearRampToValueAtTime(0.28, ctx.currentTime + startOffset + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + dur);
      }
      _beep(880, 0,    0.35);
      _beep(660, 0.38, 0.48);
      setTimeout(function () { try { ctx.close(); } catch (_) {} }, 1500);
    } catch (_) { /* Web Audio not available in this WebView context */ }
  }

  function _showReminder (event) {
    const fmt  = new Intl.DateTimeFormat(Hub.tr('locale'), { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    const meta = fmt.format(new Date(event.startsAt));
    const toast = _q('event-toast');
    const kick  = _q('toast-kicker');
    const ttl   = _q('toast-title');
    const tmeta = _q('toast-meta');

    if (kick)  kick.textContent  = Hub.tr('reminder');
    if (ttl)   ttl.textContent   = event.title || Hub.tr('ph_title');
    if (tmeta) tmeta.textContent = meta;

    if (toast) {
      toast.classList.remove('show');
      // Force reflow so the CSS transition restarts
      void toast.offsetWidth;
      toast.classList.add('show');
    }

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(Hub.dismissReminderToast, 14000);

    _playReminderSound();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(Hub.tr('desktop_title'), {
          body:             `${event.title || Hub.tr('ph_title')} — ${meta}`,
          silent:           false,
          requireInteraction: true
        });
      } catch (_) { /* may fail in sandboxed WebView */ }
    }
  }

  Hub.dismissReminderToast = function () {
    clearTimeout(_toastTimer);
    const toast = _q('event-toast');
    if (toast) toast.classList.remove('show');
  };
}());
