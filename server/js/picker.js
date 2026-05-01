'use strict';

function openPicker(type) {
  if (!audioData) return;
  const isSpeaker = type === 'speaker';
  pickerTitle.textContent = isSpeaker ? t('picker_speaker') : t('picker_mic');
  const devices = isSpeaker ? audioData.speakers : audioData.mics;
  const currentId = isSpeaker ? (audioData.speaker && audioData.speaker.id) : (audioData.mic && audioData.mic.id);
  pickerList.innerHTML = '';

  devices.forEach(dev => {
    const item = document.createElement('div');
    item.className = 'picker-item';
    const text = document.createElement('div');
    text.className = 'picker-item-text';
    const name = document.createElement('div');
    name.className = 'picker-item-name';
    name.textContent = dev.name || dev.label;
    const lbl = document.createElement('div');
    lbl.className = 'picker-item-label';
    lbl.textContent = dev.label;
    const check = document.createElement('div');
    check.className = 'picker-check' + (dev.id === currentId ? ' checked' : '');
    text.appendChild(name);
    text.appendChild(lbl);
    item.appendChild(text);
    item.appendChild(check);
    item.addEventListener('click', () => selectDevice(type, dev.id));
    pickerList.appendChild(item);
  });

  pickerOverlay.classList.add('open');
}

function closePicker() {
  pickerOverlay.classList.remove('open');
}

async function selectDevice(type, id) {
  closePicker();
  const endpoint = type === 'speaker' ? '/speaker/set' : '/mic/set';
  try {
    const res = await fetch(SERVER + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Device switch failed');
    setOnline();
    setTimeout(fetchAudio, 600);
  } catch { setOffline(); }
}
