'use strict';

function cycleDisk() {
  if (!systemDisks || systemDisks.length < 2) return;
  diskIndex = (diskIndex + 1) % systemDisks.length;
  renderDisk(systemDisks[diskIndex]);
}

function renderDisk(disk) {
  if (!disk) {
    $('disk-label').textContent = t('disk_label');
    $('disk-value').textContent = '--%';
    $('disk-small').textContent = '';
    $('disk-sub').textContent = '--';
    $('disk-detail').textContent = '--';
    setFill($('disk-fill'), 0);
    return;
  }
  $('disk-label').textContent = `${t('disk_label')} ${disk.drive}`;
  $('disk-value').textContent = disk.percent + '%';
  $('disk-small').textContent = formatBytes(disk.free) + ' ' + t('gb_free');
  $('disk-sub').textContent = formatBytes(disk.used) + ' / ' + formatBytes(disk.total);
  const diskDetails = [disk.label, disk.fileSystem, disk.driveType]
    .map(part => String(part || '').trim())
    .filter(Boolean);
  $('disk-detail').textContent = diskDetails.length ? diskDetails.join(' - ') : t('disk_detail_unavailable');
  setFill($('disk-fill'), disk.percent);
}

function applySystem(data) {
  if ($('host-name')) $('host-name').textContent = data.hostname || 'Local cockpit';
  $('uptime-text').textContent = `${t('uptime_prefix')} ${formatUptime(data.uptime)}`;

  const cpu = Number.isFinite(data.cpu) ? data.cpu : 0;
  $('cpu-value').textContent = cpu + '%';
  setFill($('cpu-fill'), cpu);
  $('cpu-name').textContent = data.cpuName || '--';
  const cpuHT = $('cpu-head-temp');
  const cpuTemp = Number(data.cpuTemp);
  if (Number.isFinite(cpuTemp) && cpuTemp > 0) {
    cpuHT.textContent = Math.round(cpuTemp) + '°C';
  } else {
    cpuHT.textContent = '';
  }

  const ram = data.memory ? data.memory.percent : 0;
  $('ram-value').textContent = ram + '%';
  $('ram-small').textContent = data.memory ? formatBytes(data.memory.total) : '';
  setFill($('ram-fill'), ram);
  if (data.memory) {
    $('ram-sub').textContent = formatBytes(data.memory.used) + ' / ' + formatBytes(data.memory.total);
  } else {
    $('ram-sub').textContent = '--';
  }
  const ramDetail = data.ramDetail || {};
  $('ram-detail').textContent = ramDetail.detail || data.ramName || t('ram_detail_unavailable');
  $('ram-name').textContent = ramDetail.moduleName || '';

  if (data.gpu === null || data.gpu === undefined) {
    $('gpu-value').textContent = '--%';
    setFill($('gpu-fill'), 0);
  } else {
    $('gpu-value').textContent = data.gpu + '%';
    setFill($('gpu-fill'), data.gpu);
  }
  $('gpu-name').textContent = data.gpuName || t('gpu_loading');
  const gpuHT = $('gpu-head-temp');
  const gpuTemp = Number(data.gpuTemp);
  if (Number.isFinite(gpuTemp) && gpuTemp > 0) {
    gpuHT.textContent = Math.round(gpuTemp) + '°C';
  } else {
    gpuHT.textContent = '';
  }

  if (data.disks && data.disks.length > 0) {
    systemDisks = data.disks;
    if (diskIndex >= systemDisks.length) diskIndex = 0;
    renderDisk(systemDisks[diskIndex]);
    const cycleBtn = $('disk-cycle-btn');
    if (cycleBtn) cycleBtn.style.display = systemDisks.length > 1 ? '' : 'none';
  } else {
    systemDisks = null;
    renderDisk(null);
    const cycleBtn = $('disk-cycle-btn');
    if (cycleBtn) cycleBtn.style.display = 'none';
  }
}

async function fetchSystem() {
  if (fetchingSystem) return;
  fetchingSystem = true;
  try {
    const res = await fetch(SERVER + '/system');
    if (!res.ok) throw new Error('System unavailable');
    const data = await res.json();
    applySystem(data);
  } catch { }
  fetchingSystem = false;
}
