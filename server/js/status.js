'use strict';

function setOnline() {
  statusDot.classList.remove('offline');
  statusDot.title = t('online');
}

function setOffline() {
  statusDot.classList.add('offline');
  statusDot.title = t('offline');
}
