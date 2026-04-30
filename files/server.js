const http = require('http');
const { exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

let isMuted = false;
let cachedSpeakerId   = null; // full CLI ID — for SetDefault
let cachedSpeakerName = null; // short endpoint name — for SetVolume/ToggleMute
let cachedMicId       = null;

const SVV = path.join(__dirname, 'soundvolumeview-x64', 'SoundVolumeView.exe');
const CSV = path.join(__dirname, 'soundvolumeview-x64', 'tmp.csv');

// CSV column indices for SoundVolumeView /scomma (no header row)
const F = { NAME: 0, TYPE: 1, DIR: 2, DEVICE_NAME: 3, DEFAULT: 4, STATE: 7, MUTED: 8, VOL_PCT: 10, CLI_ID: 18 };

function parseCsvLine(line) {
  const fields = [];
  let cur = '', inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; }
    else { cur += ch; }
  }
  fields.push(cur);
  return fields;
}

function getAudioInfo() {
  return new Promise((resolve, reject) => {
    execFile(SVV, ['/scomma', CSV, '/AvoidPrompts'], err => {
      if (err) return reject(err);
      setTimeout(() => {
        try {
          const rows = fs.readFileSync(CSV, 'latin1')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .map(parseCsvLine)
            .filter(f => f[F.TYPE] === 'Device' && f[F.STATE] === 'Active');

          const speakers = rows.filter(f => f[F.DIR] === 'Render');
          const mics     = rows.filter(f => f[F.DIR] === 'Capture');

          const defSpk = speakers.find(f => f[F.DEFAULT] === 'Render') || speakers[0];
          const defMic = mics.find(f => f[F.DEFAULT] === 'Capture')    || mics[0];

          if (defSpk) { cachedSpeakerId = defSpk[F.CLI_ID]; cachedSpeakerName = defSpk[F.NAME]; }
          if (defMic) cachedMicId     = defMic[F.CLI_ID];

          const toDevice = (f, isDefault) => ({
            name:      f[F.DEVICE_NAME],
            label:     f[F.NAME],
            id:        f[F.CLI_ID],
            isDefault,
            volume:    parseInt(f[F.VOL_PCT]) || 0,
            muted:     f[F.MUTED] === 'Yes',
          });

          resolve({
            speaker:  defSpk ? toDevice(defSpk, true)  : null,
            mic:      defMic ? toDevice(defMic, true)   : null,
            speakers: speakers.map(f => toDevice(f, f === defSpk)),
            mics:     mics.map(f => toDevice(f, f === defMic)),
          });
        } catch (e) { reject(e); }
      }, 300);
    });
  });
}

function setMicMute(mute) {
  const action = mute ? '/Mute' : '/Unmute';
  exec(`"${SVV}" ${action} "Microfono"`,       err => { if (err) console.error(err.message); });
  exec(`"${SVV}" ${action} "Gruppo microfoni"`, err => { if (err) console.error(err.message); });
}

function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end',  () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const json   = data => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  const err500 = msg  => { res.writeHead(500); res.end(String(msg)); };

  if (req.url === '/' && req.method === 'GET') {
    const html = fs.readFileSync(path.join(__dirname, 'widget.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);

  } else if (req.url === '/toggle' && req.method === 'POST') {
    isMuted = !isMuted;
    setMicMute(isMuted);
    json({ muted: isMuted });

  } else if (req.url === '/status' && req.method === 'GET') {
    json({ muted: isMuted });

  } else if (req.url === '/audio' && req.method === 'GET') {
    try   { json(await getAudioInfo()); }
    catch (e) { err500(e.message); }

  } else if (req.url === '/volume/set' && req.method === 'POST') {
    try {
      const { level } = JSON.parse(await readBody(req));
      const vol = Math.max(0, Math.min(100, parseInt(level)));
      if (!cachedSpeakerId) { err500('Cache not ready'); return; }
      execFile(SVV, ['/SetVolume', cachedSpeakerId, String(vol)], e => {
        if (e) err500(e.message); else json({ ok: true, level: vol });
      });
    } catch (e) { err500(e.message); }

  } else if (req.url === '/speaker/mute' && req.method === 'POST') {
    if (!cachedSpeakerId) { err500('Cache not ready'); return; }
    execFile(SVV, ['/Switch', cachedSpeakerId], e => {
      if (e) err500(e.message); else json({ ok: true });
    });

  } else if (req.url === '/speaker/set' && req.method === 'POST') {
    try {
      const { id } = JSON.parse(await readBody(req));
      execFile(SVV, ['/SetDefault', id, 'all'], e => {
        if (e) err500(e.message); else { cachedSpeakerId = id; json({ ok: true }); }
      });
    } catch (e) { err500(e.message); }

  } else if (req.url === '/mic/set' && req.method === 'POST') {
    try {
      const { id } = JSON.parse(await readBody(req));
      execFile(SVV, ['/SetDefault', id, 'all'], e => {
        if (e) { err500(e.message); return; }
        cachedMicId = id;
        if (isMuted) setMicMute(true);
        json({ ok: true });
      });
    } catch (e) { err500(e.message); }

  } else {
    res.writeHead(404); res.end();
  }
});

server.listen(3030, '127.0.0.1', () => {
  console.log('Widget server running on http://127.0.0.1:3030');
  setMicMute(false);
  // Pre-populate device cache so mute/volume work immediately without waiting for /audio
  getAudioInfo().then(d => {
    console.log('Speaker cache:', cachedSpeakerId);
    console.log('Mic cache:', cachedMicId);
  }).catch(e => console.error('Audio init failed:', e.message));
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('Porta 3030 già in uso. Chiudi l\'altro processo node prima di riavviare.');
    process.exit(1);
  } else {
    throw err;
  }
});
