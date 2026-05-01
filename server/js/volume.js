'use strict';

function refreshSlider(v) {
  const safe = Math.max(0, Math.min(100, Number(v) || 0));
  volSlider.style.background = `linear-gradient(to right, #dfe7e3 0%, #dfe7e3 ${safe}%, #171c1c ${safe}%, #171c1c 100%)`;
}

function refreshMicSlider(v) {
  const safe = Math.max(0, Math.min(100, Number(v) || 0));
  const isMuted = micVolSlider.classList.contains('muted');
  if (micVolTrack) {
    micVolTrack.style.setProperty('--mic-level', safe + '%');
    micVolTrack.classList.toggle('muted', isMuted);
  }
  micVolSlider.style.background = 'transparent';
}

function onSliderInput(v) {
  const level = parseInt(v, 10);
  volVal.textContent = level + '%';
  refreshSlider(level);
  clearTimeout(volDebounce);
  volDebounce = setTimeout(() => sendVolume(level), 120);
}

async function sendVolume(level) {
  try {
    const res = await fetch(SERVER + '/volume/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    if (!res.ok) throw new Error('Volume failed');
    setOnline();
  } catch { setOffline(); }
}

async function toggleSpeakerMute() {
  const previous = speakerMuted;
  applySpeakerMute(!speakerMuted);
  try {
    const res = await fetch(SERVER + '/speaker/mute', { method: 'POST' });
    if (!res.ok) throw new Error('Speaker mute failed');
    setOnline();
    setTimeout(fetchAudio, 350);
  } catch {
    applySpeakerMute(previous);
    setOffline();
  }
}

function applySpeakerMute(m) {
  speakerMuted = m;
  volMuteBtn.classList.toggle('speaker-muted', m);
  volSlider.classList.toggle('speaker-muted', m);
  spkIconOn.style.display = m ? 'none' : '';
  spkIconOff.style.display = m ? '' : 'none';
}

function applyAudio(data) {
  audioData = data;
  if (data.speaker) {
    const speaker = data.speaker.name || data.speaker.label;
    spkName.textContent = speaker;
    const vol = data.speaker.volume;
    volSlider.value = vol;
    volVal.textContent = vol + '%';
    refreshSlider(vol);
    applySpeakerMute(data.speaker.muted);
  }
  if (data.mic) {
    const mic = data.mic.name || data.mic.label;
    micName.textContent = mic;
    micContext.textContent = mic;
    const mv = Number(data.mic.volume);
    if (Number.isFinite(mv) && document.activeElement !== micVolSlider) {
      micVolSlider.value = mv;
      micVolVal.textContent = mv + '%';
    }
    micVolSlider.classList.toggle('muted', !!data.mic.muted);
    refreshMicSlider(micVolSlider.value);
  }
}

function onMicVolumeInput(v) {
  const level = parseInt(v, 10);
  micVolVal.textContent = level + '%';
  refreshMicSlider(level);
  clearTimeout(micVolDebounce);
  micVolDebounce = setTimeout(() => sendMicVolume(level), 150);
}

async function sendMicVolume(level) {
  try {
    const res = await fetch(SERVER + '/mic/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    if (!res.ok) throw new Error('Mic volume failed');
    setOnline();
  } catch { setOffline(); }
}

async function fetchAudio() {
  if (fetchingAudio) return;
  fetchingAudio = true;
  try {
    const res = await fetch(SERVER + '/audio');
    const data = await res.json();
    applyAudio(data);
    setOnline();
  } catch { setOffline(); }
  fetchingAudio = false;
}
