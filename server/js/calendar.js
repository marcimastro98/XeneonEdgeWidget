'use strict';

function showCalendar(show, automatic) {
  if (automatic === undefined) automatic = false;
  calendarMode = !!show;
  if (!automatic) calendarAutoShown = false;
  $('media-panel').classList.toggle('calendar-mode', calendarMode);
  updateCalendarMiniPlayer();
  if (calendarMode) {
    renderCalendar();
    if ('Notification' in window && Notification.permission === 'default') {
      try { Promise.resolve(Notification.requestPermission()).catch(() => {}); } catch {}
    }
  }
}

function eventsForDate(dateValue) {
  return calendarEvents
    .filter(event => String(event.startsAt || '').slice(0, 10) === dateValue)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

function renderCalendar() {
  const locale = t('locale');
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendarViewDate);
  $('calendar-month').textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const weekdays = $('calendar-weekdays');
  weekdays.innerHTML = '';
  t('weekdays').forEach(day => {
    const el = document.createElement('span');
    el.textContent = day;
    weekdays.appendChild(el);
  });

  const days = $('calendar-days');
  days.innerHTML = '';
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayValue = toDateInputValue(new Date());
  days.style.setProperty('--calendar-weeks', String(Math.ceil((offset + totalDays) / 7)));

  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('button');
    empty.className = 'day-cell empty';
    empty.tabIndex = -1;
    days.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateValue = toDateInputValue(new Date(year, month, day));
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    if (dateValue === todayValue) cell.classList.add('today');
    if (dateValue === selectedCalendarDate) cell.classList.add('selected');
    if (eventsForDate(dateValue).length) cell.classList.add('has-events');
    cell.textContent = day;
    cell.onclick = () => openDayModal(dateValue);
    days.appendChild(cell);
  }

  renderUpcoming();
}

function renderUpcoming() {
  const list = $('upcoming-list');
  if (!list) return;
  const now = Date.now();
  const upcoming = calendarEvents
    .filter(e => Date.parse(e.startsAt) >= now - 60000)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 5);
  list.innerHTML = '';
  if (!upcoming.length) {
    const empty = document.createElement('div');
    empty.className = 'event-empty';
    empty.textContent = t('no_upcoming');
    list.appendChild(empty);
    return;
  }
  const fmt = new Intl.DateTimeFormat(t('locale'), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  upcoming.forEach(e => {
    const item = document.createElement('div');
    item.className = 'upcoming-item';
    item.style.cursor = 'pointer';
    item.onclick = () => openDayModal(String(e.startsAt).slice(0, 10));
    const dot = document.createElement('span');
    dot.className = 'upcoming-dot';
    const name = document.createElement('span');
    name.className = 'upcoming-name';
    name.textContent = e.title || t('ph_title');
    const when = document.createElement('span');
    when.className = 'upcoming-when';
    when.textContent = fmt.format(new Date(e.startsAt));
    item.appendChild(dot);
    item.appendChild(name);
    item.appendChild(when);
    list.appendChild(item);
  });
}

function updateDayModalTitle() {
  if (!modalDateValue) return;
  const formatted = new Intl.DateTimeFormat(t('locale'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(modalDateValue + 'T00:00:00'));
  $('day-modal-title').textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function openDayModal(dateValue) {
  modalDateValue = dateValue;
  selectedCalendarDate = dateValue;
  updateDayModalTitle();
  renderDayModalEvents();
  $('event-title').value = '';
  $('event-notes').value = '';
  $('event-time').value = '09:00';
  $('event-reminder').value = '0';
  $('day-modal').classList.add('open');
  setTimeout(() => $('event-title').focus(), 80);
  if (calendarMode) renderCalendar();
}

function closeDayModal() {
  $('day-modal').classList.remove('open');
  modalDateValue = null;
}

function renderDayModalEvents() {
  const list = $('day-modal-events');
  if (!list) return;
  list.innerHTML = '';
  const events = eventsForDate(modalDateValue || selectedCalendarDate);
  if (!events.length) {
    const empty = document.createElement('div');
    empty.className = 'event-empty';
    empty.textContent = t('no_events');
    list.appendChild(empty);
    return;
  }
  const fmt = new Intl.DateTimeFormat(t('locale'), { hour: '2-digit', minute: '2-digit' });
  events.forEach(event => {
    const item = document.createElement('div');
    item.className = 'event-item';
    const top = document.createElement('div');
    top.className = 'event-item-top';
    const name = document.createElement('div');
    name.className = 'event-name';
    name.textContent = event.title || t('ph_title');
    const time = document.createElement('div');
    time.className = 'event-time';
    time.textContent = fmt.format(new Date(event.startsAt));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'event-delete';
    del.title = t('delete_event');
    del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    del.onclick = () => deleteCalendarEvent(event.id);
    top.appendChild(name);
    top.appendChild(time);
    top.appendChild(del);
    item.appendChild(top);
    if (event.notes) {
      const meta = document.createElement('div');
      meta.className = 'event-meta';
      meta.textContent = event.notes;
      item.appendChild(meta);
    }
    list.appendChild(item);
  });
}

function selectCalendarDate(dateValue) {
  selectedCalendarDate = dateValue;
  renderCalendar();
}

function moveCalendarMonth(delta) {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + delta, 1);
  renderCalendar();
}

function jumpCalendarToday() {
  const today = new Date();
  selectedCalendarDate = toDateInputValue(today);
  calendarViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
}

async function loadCalendarEvents() {
  try {
    const res = await fetch(SERVER + '/events');
    if (!res.ok) throw new Error('events unavailable');
    const data = await res.json();
    calendarEvents = Array.isArray(data.events) ? data.events : [];
    calendarLoaded = true;
    if (calendarMode) renderCalendar();
    renderUpcoming();
  } catch {
    calendarLoaded = true;
    calendarEvents = [];
    if (calendarMode) renderCalendar();
    renderUpcoming();
  }
}

async function persistCalendarEvents() {
  await fetch(SERVER + '/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: calendarEvents }),
  });
}

async function saveCalendarEvent() {
  const title = $('event-title').value.trim();
  const dateValue = modalDateValue || selectedCalendarDate;
  const starts = combineDateTime(dateValue, $('event-time').value);
  if (!title || !starts) return;
  const reminderMinutes = Number($('event-reminder').value);
  const reminderAt = reminderMinutes >= 0 ? toLocalDateTimeValue(new Date(starts.getTime() - reminderMinutes * 60000)) : '';
  calendarEvents.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    notes: $('event-notes').value.trim(),
    startsAt: toLocalDateTimeValue(starts),
    reminderAt,
    notifiedAt: '',
    createdAt: toLocalDateTimeValue(new Date()),
  });
  $('event-title').value = '';
  $('event-notes').value = '';
  selectedCalendarDate = dateValue;
  calendarViewDate = new Date(starts.getFullYear(), starts.getMonth(), 1);
  await persistCalendarEvents().catch(() => {});
  if (calendarMode) renderCalendar();
  renderDayModalEvents();
  renderUpcoming();
  if ('Notification' in window && Notification.permission === 'default') {
    try { Promise.resolve(Notification.requestPermission()).catch(() => {}); } catch {}
  }
}

async function deleteCalendarEvent(id) {
  calendarEvents = calendarEvents.filter(event => event.id !== id);
  await persistCalendarEvents().catch(() => {});
  if (calendarMode) renderCalendar();
  if ($('day-modal').classList.contains('open')) renderDayModalEvents();
  renderUpcoming();
}

function showReminder(event) {
  const fmt = new Intl.DateTimeFormat(t('locale'), { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  const meta = fmt.format(new Date(event.startsAt));
  const toast = $('event-toast');
  $('toast-kicker').textContent = t('reminder');
  $('toast-title').textContent = event.title || t('ph_title');
  $('toast-meta').textContent = meta;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(dismissReminderToast, 14000);
  playReminderSound();
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(t('desktop_title'), { body: `${event.title || t('ph_title')} - ${meta}`, silent: false, requireInteraction: true });
    } catch { }
  }
}

async function checkReminders() {
  if (!calendarLoaded || !calendarEvents.length) return;
  const now = Date.now();
  let changed = false;
  calendarEvents.forEach(event => {
    if (!event.reminderAt || event.notifiedAt) return;
    const reminderTime = Date.parse(event.reminderAt);
    if (Number.isFinite(reminderTime) && reminderTime <= now) {
      event.notifiedAt = new Date().toISOString();
      changed = true;
      showReminder(event);
    }
  });
  if (changed) await persistCalendarEvents().catch(() => {});
}
