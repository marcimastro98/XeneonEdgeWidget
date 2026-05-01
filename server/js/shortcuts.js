'use strict';

function saveScStorage() {
  localStorage.setItem('customShortcuts', JSON.stringify(scShortcuts));
}

function renderQbtnCustom() {
  document.querySelectorAll('.qbtn-custom').forEach(el => el.remove());
  const sep = document.getElementById('qbtn-separator');
  const bar = document.getElementById('quickbar');
  if (!bar || !sep) return;
  scShortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'qbtn qbtn-custom';
    btn.title = s.label + ' (' + s.displayKeys + ')';
    const dot = document.createElement('span');
    dot.className = 'qbtn-dot';
    dot.style.background = s.color || '#4ade80';
    btn.appendChild(dot);
    btn.addEventListener('click', () => fireShortcut(s.id));
    bar.insertBefore(btn, sep.nextSibling);
  });
}

function renderScSwatches() {
  const box = document.getElementById('sc-swatches');
  if (!box) return;
  box.innerHTML = SC_PALETTE.map(c =>
    `<span class="sc-swatch${c === scSelectedColor ? ' selected' : ''}" style="background:${c}" onclick="selectScColor(this,'${c}')"></span>`
  ).join('');
}

function selectScColor(el, color) {
  scSelectedColor = color;
  document.querySelectorAll('.sc-swatch').forEach(s => s.classList.toggle('selected', s === el));
}

function renderScList() {
  const list = document.getElementById('sc-list');
  if (!list) return;
  if (scShortcuts.length === 0) {
    list.innerHTML = `<div class="sc-empty">${escHtml(t('sc_none')).replace('\n','<br>')}</div>`;
  } else {
    list.innerHTML = scShortcuts.map(s => `
      <div class="sc-item" onclick="fireShortcut('${escHtml(s.id)}')">
        <span class="sc-item-dot" style="background:${escHtml(s.color||'#4ade80')}"></span>
        <div class="sc-item-info">
          <div class="sc-item-label">${escHtml(s.label)}</div>
          <div class="sc-item-keys">${escHtml(s.displayKeys)}</div>
        </div>
        <button class="sc-item-del" onclick="event.stopPropagation();deleteScShortcut('${escHtml(s.id)}')" title="${escHtml(t('sc_del'))}">✕</button>
      </div>
    `).join('');
  }
  renderQbtnCustom();
}

async function fireShortcut(id) {
  const s = scShortcuts.find(x => x.id === id);
  if (!s) return;
  try {
    await fetch('/shortcut', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: s.sendKeys })
    });
  } catch {}
}

function deleteScShortcut(id) {
  scShortcuts = scShortcuts.filter(s => s.id !== id);
  saveScStorage();
  renderScList();
}

function toggleScModal() {
  const bd = document.getElementById('sc-backdrop');
  if (!bd) return;
  bd.hidden = !bd.hidden;
  if (!bd.hidden) { renderScList(); cancelScForm(); renderScSwatches(); }
}

function showScForm() {
  scSelectedColor = SC_PALETTE[0];
  document.getElementById('sc-add-form').hidden = false;
  document.getElementById('sc-add-btn').hidden = true;
  document.getElementById('sc-label').value = '';
  const ki = document.getElementById('sc-keys');
  ki.value = ''; ki.dataset.sendkeys = '';
  ki.placeholder = t('sc_keys_ph');
  ki.classList.remove('recording');
  renderScSwatches();
}

function cancelScForm() {
  const form = document.getElementById('sc-add-form');
  const btn = document.getElementById('sc-add-btn');
  if (form) form.hidden = true;
  if (btn) btn.hidden = false;
  stopScRecording();
}

function saveScShortcut() {
  const color = scSelectedColor || '#4ade80';
  const label = document.getElementById('sc-label').value.trim();
  const ki = document.getElementById('sc-keys');
  const sendKeys = ki.dataset.sendkeys || '';
  const displayKeys = ki.value.trim();
  if (!label) { document.getElementById('sc-label').focus(); return; }
  if (!sendKeys) { ki.click(); return; }
  scShortcuts.push({ id: Date.now().toString(36), color, label, sendKeys, displayKeys });
  saveScStorage();
  renderScList();
  cancelScForm();
}

function scKeysToSendKeys(mods, key) {
  let s = '';
  if (mods.ctrl) s += '^';
  if (mods.shift) s += '+';
  if (mods.alt) s += '%';
  const special = {
    'enter':'{ENTER}','tab':'{TAB}','escape':'{ESC}','backspace':'{BACKSPACE}',
    'delete':'{DEL}','home':'{HOME}','end':'{END}','insert':'{INS}',
    'pageup':'{PGUP}','pagedown':'{PGDN}',
    'arrowup':'{UP}','arrowdown':'{DOWN}','arrowleft':'{LEFT}','arrowright':'{RIGHT}',
    'f1':'{F1}','f2':'{F2}','f3':'{F3}','f4':'{F4}','f5':'{F5}','f6':'{F6}',
    'f7':'{F7}','f8':'{F8}','f9':'{F9}','f10':'{F10}','f11':'{F11}','f12':'{F12}',
  };
  const lk = key.toLowerCase();
  s += special[lk] || (key.length === 1 ? key.toLowerCase() : '');
  return s;
}

function startScRecording(input) {
  if (scRecording) stopScRecording();
  scRecording = true;
  scRecordInput = input;
  input.classList.add('recording');
  input.value = '';
  input.placeholder = t('sc_keys_rec');
  input.dataset.sendkeys = '';
}

function stopScRecording() {
  scRecording = false;
  if (scRecordInput) {
    scRecordInput.classList.remove('recording');
    scRecordInput.placeholder = t('sc_keys_ph');
    scRecordInput = null;
  }
}
