// Entry point.
import { applyI18n, t } from './strings.js';
import { isStandalone, isPreview, registerServiceWorker } from './pwa.js';
import { openDB, getKV, setKV, requestPersistence } from './db.js';
import { seedIfNeeded } from './seed.js';
import { withDefaults } from './lib/model.js';
import { applyTheme } from './ui/theme.js';
import { initTabs, initSheet, showUpdateBanner, onTabChange } from './ui/shell.js';
import { renderToday, refreshTodayIfStale } from './views/today.js';
import { renderSettings } from './views/settings.js';

async function boot() {
  applyI18n();
  registerServiceWorker({ onUpdateReady: showUpdateBanner });

  const standalone = isStandalone();
  if (!standalone && !isPreview()) {
    showInstallScreen();
    return;                                   // never open storage in a browser tab
  }

  await openDB();
  const meta = await seedIfNeeded();
  if (meta.persisted !== true) {
    const persisted = await requestPersistence();
    await setKV('meta', { ...meta, persisted });
  }

  const settings = withDefaults(await getKV('settings'));
  applyTheme(settings.theme);

  document.getElementById('app').hidden = false;
  initSheet();

  const refreshSettings = () => renderSettings({ standalone });
  onTabChange((tab) => { if (tab === 'settings') refreshSettings(); });
  initTabs();
  await renderToday();
  refreshSettings();

  // Day rollover while the app sat in the background (iOS keeps PWAs alive).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshTodayIfStale();
  });
}

function showInstallScreen() {
  applyTheme('system');
  document.getElementById('install').hidden = false;
  const btn = document.getElementById('install-copy');
  btn.addEventListener('click', async () => {
    const url = location.origin + location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = t('install.copied');
    } catch {
      window.prompt('Copy this link:', url);
    }
  });
}

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend',
    `<p style="padding:24px;color:var(--danger)">Move could not start: ${String(err?.message || err).replace(/[<>&]/g, '')}</p>`);
});
