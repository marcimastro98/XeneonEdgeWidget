'use strict';

function tickClock() {
  const now = new Date();
  const locale = t('locale');
  $('clock-time').textContent = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(now);
  $('clock-date').textContent = new Intl.DateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: 'long' }).format(now);
}
