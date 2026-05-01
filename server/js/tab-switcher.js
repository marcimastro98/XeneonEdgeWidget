'use strict';

function renderTabSwitcher() {
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    const isActive = btn.dataset.tabTarget === activePanel;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function toggleTabSwitcher(forceOpen) {
  const bd = document.getElementById('tab-switcher');
  if (!bd) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : bd.hidden;
  bd.hidden = !shouldOpen;
  if (shouldOpen) {
    closeAppSwitcher();
    renderTabSwitcher();
    const active = bd.querySelector('.tab-card.active') || bd.querySelector('.tab-card');
    setTimeout(() => { if (active) active.focus(); }, 0);
  }
}

function closeTabSwitcher() {
  const bd = document.getElementById('tab-switcher');
  if (bd) bd.hidden = true;
}

function openWidgetTab(panel) {
  if (panel === activePanel) {
    closeTabSwitcher();
    return;
  }
  const url = new URL(window.location.href);
  if (panel === 'full') url.searchParams.delete('panel');
  else url.searchParams.set('panel', panel);
  window.location.href = url.toString();
}
