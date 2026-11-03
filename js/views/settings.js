// Phase 1 Settings: theme + storage status + about.
// Targets, timers, increments, backup and import arrive in phase 6.
import { h } from '../ui/dom.js';
import { t } from '../strings.js';
import { getKV, setKV, storageEstimate } from '../db.js';
import { updateSettings } from '../repo.js';
import { parseLoad, formatLoad } from '../lib/workout.js';
import { toast } from '../ui/shell.js';
import { withDefaults } from '../lib/model.js';
import { applyTheme } from '../ui/theme.js';
import { APP_VERSION } from '../version.js';

export async function renderSettings({ standalone, onThemeChange, onGoalChange }) {
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

  const goalInput = (key, label) => {
    const id = `goal-${key}`;
    const input = h('input', { class: 'input input--inline num', id, inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done', value: formatLoad(settings.weightGoal[key]) });
    input.addEventListener('change', async () => {
      const v = parseLoad(input.value);
      const cur = withDefaults(await getKV('settings'));
      if (v == null || v < 20 || v > 300) { input.value = formatLoad(cur.weightGoal[key]); return; }
      input.value = formatLoad(v);
      await updateSettings({ weightGoal: { ...cur.weightGoal, [key]: v } });
      toast(t('settings.goalSaved'));
      onGoalChange?.();
    });
    return h('div', { class: 'list__row' }, h('label', { class: 'list__label', for: id }, label), input);
  };

  body.replaceChildren(
    h('h2', { class: 'section-label' }, t('settings.goal')),
    h('div', { class: 'list' },
      goalInput('start', t('settings.goalStart')),
      goalInput('target', t('settings.goalTarget'))),

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
