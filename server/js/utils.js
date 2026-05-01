'use strict';

const $ = id => document.getElementById(id);

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function parseAppFavorites(raw) {
  try {
    const data = JSON.parse(raw || '[]');
    return Array.isArray(data) ? data.filter(item => item && item.key).slice(0, 12) : [];
  } catch {
    return [];
  }
}

function toDateInputValue(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function combineDateTime(dateValue, timeValue) {
  if (!dateValue) return null;
  const time = timeValue || '09:00';
  const date = new Date(`${dateValue}T${time}`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function toLocalDateTimeValue(date) {
  const d = new Date(date);
  const day = toDateInputValue(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}T${hours}:${minutes}:00`;
}

function formatBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b >= 1024 ** 4) return (b / 1024 ** 4).toFixed(1) + ' TB';
  if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(1) + ' GB';
  if (b >= 1024 ** 2) return (b / 1024 ** 2).toFixed(0) + ' MB';
  return b + ' B';
}

function formatUptime(seconds) {
  const h = Math.floor((seconds || 0) / 3600);
  const m = Math.floor(((seconds || 0) % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function brandFromName(name) {
  if (!name) return '';
  const n = name.toUpperCase();
  if (n.includes('NVIDIA') || n.includes('GEFORCE') || n.includes('RTX') || n.includes('GTX')) return 'NVIDIA';
  if (n.includes('AMD') || n.includes('RADEON') || n.includes('RYZEN')) return 'AMD';
  if (n.includes('INTEL') || n.includes('CORE')) return 'INTEL';
  if (n.includes('APPLE')) return 'APPLE';
  return '';
}

function cleanTitle(title) {
  let s = (title || '').trim();
  s = s.replace(/^(?:[A-Za-z]:\\|(?:\/[^/]+)+\/|.*[\\/])([^\\/]+)$/, '$1');
  s = s.replace(/\.(mp3|mp4|m4a|m4v|flac|wav|ogg|opus|aac|wma|wmv|avi|mkv|mov|aiff|alac)$/i, '');
  s = s.replace(/\s+-\s+(YouTube|SoundCloud|Spotify|Deezer|Tidal|Apple Music)$/i, '').trim();
  s = s.replace(/\s*[\[(](?:official\s*(?:video|audio|music\s*video|lyric\s*video)?|lyrics?|audio|hd|4k|mv|clip)[\])]\s*$/i, '').trim();
  if (/^[A-Za-z.]+_[A-Za-z0-9]+![A-Za-z.]+$/.test(s)) return '';
  return s;
}

function prettyAppName(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'App';
  const known = {
    chrome: 'Chrome', msedge: 'Edge', firefox: 'Firefox', explorer: 'Explorer', spotify: 'Spotify',
    code: 'VS Code', discord: 'Discord', steam: 'Steam', notepad: 'Notepad', powershell: 'PowerShell',
    pwsh: 'PowerShell', cmd: 'Command Prompt', taskmgr: 'Task Manager', icue: 'iCUE'
  };
  const key = raw.toLowerCase();
  return known[key] || raw.replace(/(^|\s)\S/g, s => s.toUpperCase());
}

function appWindowKey(win) {
  return `${String(win && win.app || '').trim()}|${String(win && win.title || '').trim()}`.toLowerCase();
}

function formatBandwidth(bps) {
  if (bps == null || !isFinite(bps)) return { value: '--', unit: 'Mbps' };
  const bits = bps * 8;
  if (bits >= 1e9) return { value: (bits / 1e9).toFixed(2), unit: 'Gbps' };
  if (bits >= 1e6) return { value: (bits / 1e6).toFixed(1), unit: 'Mbps' };
  if (bits >= 1e3) return { value: (bits / 1e3).toFixed(0), unit: 'Kbps' };
  return { value: String(Math.round(bits)), unit: 'bps' };
}

function setFill(el, value) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  el.style.width = safe + '%';
}
