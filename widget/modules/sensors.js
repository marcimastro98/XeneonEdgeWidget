'use strict';

/**
 * modules/sensors.js — iCUE sensor bindings with server-side enhancement.
 *
 * Priority:
 *   1. Server data (when online) → more detail, exact names, multiple disks
 *   2. iCUE SimpleSensorApiWrapper → live sensor values from user-configured IDs
 *
 * SDK gap: no "throughput" sensor type → netUp/netDown always come from server.
 */
(function () {
  const Hub = window.XenonEdgeHub;

  // Tracks previous sensor IDs to detect combobox changes between onDataUpdated calls
  let _prevIds = {};

  // ── Sensor value parsing ──────────────────────────────────────────────────

  function _extractSensorId (value) {
    // sensors-combobox can return an object { sensorId, ... } or a plain string
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.sensorId || value.id || String(value);
  }

  // ── iCUE sensor subscription ─────────────────────────────────────────────

  /**
   * Called from app.js after the Sensorsdataprovider plugin is ready.
   * Re-runs every time onDataUpdated fires (sensor IDs may have changed).
   */
  Hub.bindSensors = function () {
    const wrapper = Hub.state.sensorWrapper;
    if (!wrapper) return;

    const ids = Hub.state.sensorIds;

    // Check if any ID changed to avoid redundant re-subscriptions
    const changed = Object.keys(ids).some(k => ids[k] !== _prevIds[k]);
    if (!changed) return;
    _prevIds = Object.assign({}, ids);

    Hub.log('sensors', 'binding sensor IDs:', ids);

    // Fetch initial values for each configured sensor
    _fetchSensorValue('cpuLoad',  _extractSensorId(ids.cpuLoad));
    _fetchSensorValue('cpuTemp',  _extractSensorId(ids.cpuTemp));
    _fetchSensorValue('gpuLoad',  _extractSensorId(ids.gpuLoad));
    _fetchSensorValue('gpuTemp',  _extractSensorId(ids.gpuTemp));
    _fetchSensorValue('ramLoad',  _extractSensorId(ids.ramLoad));
    _fetchSensorValue('diskTemp', _extractSensorId(ids.diskTemp));
    // netUp / netDown intentionally skipped — SDK has no throughput sensor type

    // Device names (fetch once per unique sensor)
    _fetchDeviceName('cpuLoad', _extractSensorId(ids.cpuLoad), 'cpuName');
    _fetchDeviceName('gpuLoad', _extractSensorId(ids.gpuLoad), 'gpuName');
  };

  async function _fetchSensorValue (key, sensorId) {
    if (!sensorId || !Hub.state.sensorWrapper) return;
    try {
      const raw   = await Hub.state.sensorWrapper.getSensorValue(sensorId);
      const value = Hub.clampPercent(raw);
      Hub.state.sensors[key] = value;
      Hub.log('sensors', key, '=', value, 'raw=', raw);
      // Only update DOM if server is not providing better data
      if (!Hub.state.serverOnline) Hub.renderSensorValue(key, value);
    } catch (err) {
      Hub.warn('sensors', `fetch failed for ${key}:`, err.message);
    }
  }

  async function _fetchDeviceName (sensorKey, sensorId, stateKey) {
    if (!sensorId || !Hub.state.sensorWrapper) return;
    // Only fetch if still empty (avoid overwriting server data)
    if (Hub.state[stateKey]) return;
    try {
      const name = await Hub.state.sensorWrapper.getSensorDeviceName(sensorId);
      Hub.state[stateKey] = name || '';
      Hub.log('sensors', stateKey, '=', Hub.state[stateKey]);
    } catch (_) { /* ignore */ }
  }

  /**
   * Wires the sensorValueChanged signal for live updates without polling.
   * Called once after plugin init.
   */
  Hub.connectSensorSignals = function () {
    const provider = window.plugins && window.plugins.Sensorsdataprovider;
    if (!provider || typeof provider.sensorValueChanged !== 'object') return;

    provider.sensorValueChanged.connect((sensorId, rawValue) => {
      // Map incoming sensorId to one of our tracked keys
      const ids = Hub.state.sensorIds;
      const keyMap = {
        [_extractSensorId(ids.cpuLoad)]:  'cpuLoad',
        [_extractSensorId(ids.cpuTemp)]:  'cpuTemp',
        [_extractSensorId(ids.gpuLoad)]:  'gpuLoad',
        [_extractSensorId(ids.gpuTemp)]:  'gpuTemp',
        [_extractSensorId(ids.ramLoad)]:  'ramLoad',
        [_extractSensorId(ids.diskTemp)]: 'diskTemp'
      };
      const key = keyMap[sensorId];
      if (!key) return;

      const value = Hub.clampPercent(rawValue);
      Hub.state.sensors[key] = value;
      Hub.log('sensors', 'live update', key, '=', value);
      // Prefer server data when available
      if (!Hub.state.serverOnline) Hub.renderSensorValue(key, value);
    });
  };

  // ── DOM rendering ─────────────────────────────────────────────────────────

  /** Updates a single sensor metric in the DOM. */
  Hub.renderSensorValue = function (key, value) {
    switch (key) {
      case 'cpuLoad':  _setMetric('cpu',  value, null); break;
      case 'cpuTemp':  _setTemp('cpu-head-temp',  value, '°C'); break;
      case 'gpuLoad':  _setMetric('gpu',  value, null); break;
      case 'gpuTemp':  _setTemp('gpu-head-temp',  value, '°C'); break;
      case 'ramLoad':  _setMetric('ram',  value, null); break;
      case 'diskTemp': _setTemp('disk-small',     value, '°C'); break;
    }
  };

  function _setMetric (prefix, pct, _unused) {
    const val  = document.getElementById(`${prefix}-value`);
    const fill = document.getElementById(`${prefix}-fill`);
    if (val)  val.textContent  = pct != null ? pct + '%' : '--%';
    if (fill) fill.style.width = (pct || 0) + '%';
  }

  function _setTemp (elId, temp, unit) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = temp != null ? temp + (unit || '') : '';
  }

  // ── Server data rendering ────────────────────────────────────────────────

  /**
   * Applies richer system data received from the server to the DOM.
   * Called by app.js after a successful /system fetch.
   */
  Hub.renderSystemFromServer = function (data) {
    if (!data) return;

    // CPU
    if (data.cpu != null) {
      _setMetric('cpu', data.cpu.load, null);
      const nameEl = document.getElementById('cpu-name');
      if (nameEl && data.cpu.name) nameEl.textContent = data.cpu.name;
      _setTemp('cpu-head-temp', data.cpu.temp, '°C');
    }

    // GPU
    if (data.gpu != null) {
      _setMetric('gpu', data.gpu.load, null);
      const nameEl = document.getElementById('gpu-name');
      if (nameEl && data.gpu.name) nameEl.textContent = data.gpu.name;
      _setTemp('gpu-head-temp', data.gpu.temp, '°C');
      const caption = document.getElementById('gpu-caption');
      if (caption) caption.textContent = data.gpu.name || '';
    }

    // RAM
    if (data.ram != null) {
      _setMetric('ram', data.ram.load, null);
      const sub  = document.getElementById('ram-sub');
      const det  = document.getElementById('ram-detail');
      const small = document.getElementById('ram-small');
      if (sub)   sub.textContent   = data.ram.used  || '';
      if (det)   det.textContent   = data.ram.total  || '';
      if (small) small.textContent = data.ram.free   ? data.ram.free + ' free' : '';
    }

    // Disks
    if (Array.isArray(data.disks) && data.disks.length) {
      Hub.state.disksData      = data.disks;
      Hub.state.currentDiskIdx = 0;
      Hub.renderDisk();
    }

    // Uptime
    const uptimeEl = document.getElementById('uptime-text');
    if (uptimeEl && data.uptime) uptimeEl.textContent = data.uptime;
  };

  Hub.renderNetworkFromServer = function (data) {
    if (!data) return;

    _setNetValue('net-ping-value', data.ping, '--');
    _setNetBar('net-ping-fill', data.ping, 300);

    _setNetValue('net-fps-value', data.fps, '--');
    _setNetBar('net-fps-fill', data.fps, 144);

    _setNetValue('net-latency-value', data.jitter, '--');
    _setNetBar('net-latency-fill', data.jitter, 50);

    const downEl   = document.getElementById('net-down-value');
    const downUnit = document.getElementById('net-down-unit');
    const upEl     = document.getElementById('net-up-value');
    const upUnit   = document.getElementById('net-up-unit');
    const iface    = document.getElementById('net-bw-iface');

    if (downEl)   downEl.textContent   = (data.download && data.download.value != null) ? data.download.value : '--';
    if (downUnit) downUnit.textContent = (data.download && data.download.unit  != null) ? data.download.unit  : 'Mbps';
    if (upEl)     upEl.textContent     = (data.upload   && data.upload.value   != null) ? data.upload.value   : '--';
    if (upUnit)   upUnit.textContent   = (data.upload   && data.upload.unit    != null) ? data.upload.unit    : 'Mbps';
    if (iface)    iface.textContent    = (data.interface != null) ? data.interface : '';

    // Hide "requires server" notice
    const notice = document.getElementById('net-server-notice');
    if (notice) notice.style.display = 'none';
  };

  Hub.showNetworkOffline = function () {
    const naTag = Hub.tr('metric_na');
    ['net-ping-value', 'net-fps-value', 'net-latency-value', 'net-down-value', 'net-up-value']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '--'; });
    const fpsTag = document.getElementById('net-fps-tag');
    if (fpsTag) fpsTag.textContent = naTag;
    const notice = document.getElementById('net-server-notice');
    if (notice) notice.style.display = '';
  };

  function _setNetValue (id, val, fallback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val != null ? val : fallback;
  }

  function _setNetBar (id, val, max) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = val != null ? Math.min(100, (val / max) * 100) + '%' : '0%';
  }
}());
