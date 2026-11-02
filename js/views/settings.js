// Phase 1 Settings: theme + storage status + about.
// Targets, timers, increments, backup and import arrive in phase 6.
import { h } from '../ui/dom.js';
import { t } from '../strings.js';
import { getKV, setKV, storageEstimate } from '../db.js';
import { withDefaults } from '../lib/model.js';
import { applyTheme } from '../ui/theme.js';
import { APP_VERSION } from '../version.js';

export async function renderSettings({ standalone, onThemeChange }) {
  const body = document.getElementById('settings-body');
  const settings = withDefaults(await getKV('settings'));
  const meta = (await getKV('meta')) || {};
  const est = await storageEstimate();

  const themes = ['system', 'light', 'dark'];
  const seg = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': t('settings.theme') },
    themes.map((mode) => h('button', {
      type: 'button', role: 'radio',
      'aria-checked': String(settings.theme === mode),
      onclick: async (e) => {
        seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', 'false'));
        e.currentTarget.setAttribute('aria-checked', 'true');
        applyTheme(mode);
        await setKV('settings', { ...withDefaults(await getKV('settings')), theme: mode });
        onThemeChange?.();
      },
    }, t(`settings.theme${mode[0].toUpperCase()}${mode.slice(1)}`))));

  const persisted = meta.persisted === true ? t('settings.granted')
    : meta.persisted === false ? t('settings.notGranted') : t('settings.unknown');
  const used = est?.usage != null ? `${(est.usage / 1024).toFixed(0)} KB` : '—';

  const row = (label, value) => h('div', { class: 'list__row' },
    h('span', { class: 'list__label' }, label),
    h('span', { class: 'list__value num' }, value));

  body.replaceChildren(
    h('h2', { class: 'section-label' }, t('settings.appearance')),
    h('div', { class: 'list' }, h('div', { class: 'list__stack' }, seg)),

    h('h2', { class: 'section-label' }, t('settings.storage')),
    h('div', { class: 'list' },
      row(t('settings.persistent'), persisted),
      row(t('settings.used'), used)),

    h('h2', { class: 'section-label' }, t('settings.about')),
    h('div', { class: 'list' },
      row(t('settings.version'), APP_VERSION),
      row(t('settings.mode'), standalone ? t('settings.modeStandalone') : t('settings.modeBrowser'))),
  );
}
