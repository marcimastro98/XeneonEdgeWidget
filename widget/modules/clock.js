'use strict';

/**
 * modules/clock.js — Real-time clock and date display.
 */
(function () {
  const Hub = window.XenonEdgeHub;

  let _clockInterval = null;

  function _tick () {
    const now  = new Date();
    const use24 = Hub.state.use24h;
    const secs  = Hub.state.showSeconds;

    let h = now.getHours();
    let suffix = '';
    if (!use24) {
      suffix = h >= 12 ? ' PM' : ' AM';
      h = h % 12 || 12;
    }
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const timeStr = String(h).padStart(use24 ? 2 : 1, '0') + ':' + mm
      + (secs ? ':' + ss : '')
      + suffix;

    const timeEl = document.getElementById('clock-time');
    if (timeEl) timeEl.textContent = timeStr;

    const locale = Hub.tr('locale');
    const dateEl = document.getElementById('clock-date');
    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat(locale, {
        weekday: 'short', day: 'numeric', month: 'short'
      }).format(now);
    }

    // Uptime (shown when server is offline)
    const uptimeEl = document.getElementById('uptime-text');
    if (uptimeEl && !Hub.state.serverOnline) {
      const sec  = Math.floor((Date.now() - Hub.state.startTime) / 1000);
      const hh   = Math.floor(sec / 3600);
      const minn = Math.floor((sec % 3600) / 60);
      uptimeEl.textContent = `${hh}h ${minn}m`;
    }
  }

  Hub.startClock = function () {
    if (_clockInterval) clearInterval(_clockInterval);
    _tick();
    _clockInterval = setInterval(_tick, 1000);
  };
}());
