// Today: steps ring, paste/enter steps, 6 habit chips, week strip, actions.
import { h, CHECK_SVG } from '../ui/dom.js';
import { t } from '../strings.js';
import { openSheet, closeSheet, toast } from '../ui/shell.js';
import { toISODate, fromISODate, formatDay, weekDates } from '../lib/date.js';
import { parseStepsClipboard, parseStepNumber } from '../lib/steps.js';
import { summarizeWeek, stepsProgress } from '../lib/week.js';
import { HABITS } from '../lib/model.js';
import { loadSettings, getHabits, setHabit, getSteps, saveSteps, loadWeek, getActiveSessionId } from '../repo.js';
import { startOrResume } from './workout.js';

const nf = new Intl.NumberFormat('en-GB');
const R = 54, C = 2 * Math.PI * R;          // ring geometry (viewBox 128)

let state = { date: null, settings: null, steps: null, habits: null, week: null };
const refs = {};

export async function renderToday() {
  const today = toISODate();
  const dates = weekDates();
  const [settings, steps, habits, weekData, activeId] = await Promise.all([
    loadSettings(), getSteps(today), getHabits(today), loadWeek(dates), getActiveSessionId(),
  ]);
  state = { date: today, dates, settings, steps, habits, activeId, week: summarizeWeek(dates, weekData, settings, today) };

  document.getElementById('today-date').textContent = formatDay(new Date());
  document.getElementById('today-body').replaceChildren(
    stepsCard(), habitsCard(), weekCard(), actionsCard(),
  );
}

/** Re-render if the calendar day changed while the app sat in the background. */
export function refreshTodayIfStale() {
  if (state.date && state.date !== toISODate()) renderToday();
}

// ---- Steps --------------------------------------------------------------

function stepsCard() {
  const target = state.settings.stepTarget;
  const value = state.steps?.steps ?? null;
  const p = stepsProgress(value, target);
  const met = value != null && value >= target;

  refs.ring = h('button', {
    class: 'ring', type: 'button', onclick: openManualSteps,
    'aria-label': `${t('steps.title')}: ${value == null ? 0 : nf.format(value)} ${t('steps.of')} ${nf.format(target)}. ${t('steps.manualTitle')}`,
    html: `<svg viewBox="0 0 128 128" aria-hidden="true">
      <circle class="ring__track" cx="64" cy="64" r="${R}" fill="none" stroke-width="14"/>
      <circle class="ring__bar" cx="64" cy="64" r="${R}" fill="none" stroke-width="14" stroke-linecap="round"
        stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" ${p === 0 ? 'opacity="0"' : ''}/>
    </svg>`,
  }, h('span', { class: 'ring__center num' }, `${Math.round(p * 100)}%`));

  const sub = value == null
    ? h('p', { class: 'steps__sub' }, t('steps.noData'))
    : met
      ? h('p', { class: 'steps__sub' }, h('b', {}, t('steps.goalMet')), ` · ${t('steps.of')} ${nf.format(target)}`)
      : h('p', { class: 'steps__sub num' }, `${nf.format(target - value)} ${t('steps.toGo')} · ${t('steps.of')} ${nf.format(target)}`);

  return h('section', { class: 'card', 'aria-labelledby': 'h-steps' },
    h('div', { class: 'card__head' }, h('h2', { class: 'card__title', id: 'h-steps' }, t('steps.title'))),
    h('div', { class: 'steps' },
      refs.ring,
      h('div', {},
        h('div', { class: 'steps__value num' }, value == null ? '—' : nf.format(value)),
        sub)),
    h('div', { class: 'steps__actions' },
      h('button', { class: 'btn btn--steps', type: 'button', onclick: pasteSteps },
        h('span', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 4.5V3.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8v.7" fill="none" stroke="currentColor" stroke-width="2"/></svg>' }),
        t('steps.paste')),
      h('button', { class: 'btn btn--secondary', type: 'button', onclick: openManualSteps }, t('steps.manual'))),
  );
}

async function pasteSteps() {
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    toast(t('steps.clipboardDenied'), 3500);
    return;
  }
  const res = parseStepsClipboard(text, toISODate());
  if (!res.ok) { toast(t(res.error), 3500); return; }
  await commitSteps(res.date, res.steps, 'shortcut');
}

/** Save with a guard: a lower value never silently replaces a higher one. */
async function commitSteps(date, steps, source) {
  const existing = await getSteps(date);
  if (existing && steps < existing.steps && !confirm(`${t('steps.lowerConfirm')}\n\n${nf.format(existing.steps)} → ${nf.format(steps)}`)) return false;
  await saveSteps(date, steps, source);
  toast(date === toISODate() ? `${t('steps.savedToday')} · ${nf.format(steps)}`
    : `${t('steps.savedFor')} ${formatDay(fromISODate(date), false)} · ${nf.format(steps)}`);
  await renderToday();
  refs.ring?.classList.add('pop');
  return true;
}

function openManualSteps() {
  const today = toISODate();
  const dateIn = h('input', { class: 'input num', type: 'date', id: 'f-date', value: today, max: today, required: true });
  const countIn = h('input', {
    class: 'input input--big num', id: 'f-steps', type: 'text', inputmode: 'numeric', pattern: '[0-9]*',
    autocomplete: 'off', enterkeyhint: 'done', placeholder: '0',
    value: state.steps?.steps != null ? String(state.steps.steps) : '',
  });
  const err = h('p', { class: 'field__error', role: 'alert', hidden: true });

  dateIn.addEventListener('change', async () => {
    const rec = await getSteps(dateIn.value);
    countIn.value = rec ? String(rec.steps) : '';
  });

  const submit = async (e) => {
    e?.preventDefault();
    const n = parseStepNumber(countIn.value);
    if (n == null || !fromISODate(dateIn.value) || dateIn.value > today) {
      err.textContent = t('steps.invalidManual'); err.hidden = false; return;
    }
    if (await commitSteps(dateIn.value, n, 'manual')) closeSheet();
  };

  const form = h('form', { onsubmit: submit, novalidate: true },
    h('div', { class: 'sheet__grab', 'aria-hidden': 'true' }),
    h('div', { class: 'sheet__head' },
      h('button', { class: 'link-btn', type: 'button', onclick: closeSheet }, t('steps.cancel')),
      h('h2', { class: 'sheet__title' }, t('steps.manualTitle')),
      h('button', { class: 'link-btn link-btn--strong', type: 'submit' }, t('steps.save'))),
    h('div', { class: 'sheet__body' },
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'f-steps' }, t('steps.count')), countIn),
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'f-date' }, t('steps.date')), dateIn),
      err),
  );
  openSheet(form, { label: t('steps.manualTitle') });
  setTimeout(() => countIn.focus(), 450);
}

// ---- Habits -------------------------------------------------------------

function habitsCard() {
  const meta = h('span', { class: 'card__meta num' });
  const updateMeta = () => { meta.textContent = `${HABITS.filter((k) => state.habits[k]).length}/${HABITS.length}`; };
  updateMeta();

  const chips = HABITS.map((key) => h('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(!!state.habits[key]),
    onclick: async (e) => {
      const btn = e.currentTarget;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(next));          // optimistic: instant feedback
      try {
        state.habits = await setHabit(state.date, key, next);
        updateMeta();
        refreshWeek();
      } catch {
        btn.setAttribute('aria-pressed', String(!next));
        toast('Could not save. Try again.');
      }
    },
  }, h('span', { class: 'chip__dot', html: CHECK_SVG }), t(`habits.${key}`)));

  return h('section', { class: 'card', 'aria-labelledby': 'h-habits' },
    h('div', { class: 'card__head' }, h('h2', { class: 'card__title', id: 'h-habits' }, t('habits.title')), meta),
    h('div', { class: 'habits' }, chips));
}

// ---- Week ---------------------------------------------------------------

function weekCard() {
  refs.weekBody = h('div', {});
  fillWeek();
  return h('section', { class: 'card', 'aria-labelledby': 'h-week' },
    h('div', { class: 'card__head' }, h('h2', { class: 'card__title', id: 'h-week' }, t('week.title'))),
    refs.weekBody);
}

async function refreshWeek() {
  const data = await loadWeek(state.dates);
  state.week = summarizeWeek(state.dates, data, state.settings, state.date);
  fillWeek();
}

function fillWeek() {
  const { days, done, targets } = state.week;
  const labels = t('week.days'), long = t('week.daysLong');

  const strip = h('ol', { class: 'week' }, days.map((d, i) => {
    const dots = [
      ...Array(d.gym).fill('strength'), ...Array(d.climb).fill('climb'), ...Array(d.swim).fill('swim'),
      ...(d.stepsMet ? ['steps'] : []),
    ];
    const desc = [
      long[i],
      d.gym && `${t('week.gym')} ${d.gym}`, d.climb && `${t('week.climbing')} ${d.climb}`, d.swim && `${t('week.swim')} ${d.swim}`,
      d.stepsMet && t('week.stepsGoal'), `${d.habitsDone}/${HABITS.length} ${t('week.habitsOf')}`,
    ].filter(Boolean).join(', ');
    return h('li', { class: `day${d.isToday ? ' day--today' : ''}${d.isFuture ? ' day--future' : ''}`, 'aria-label': desc, ...(d.isToday ? { 'aria-current': 'date' } : {}) },
      h('span', { class: 'day__label', 'aria-hidden': 'true' }, labels[i]),
      h('span', { class: 'day__num num', 'aria-hidden': 'true' }, String(Number(d.date.slice(8)))),
      h('span', { class: 'day__dots', 'aria-hidden': 'true' }, dots.map((c) => h('span', { class: `dot dot--${c}` }))),
      h('span', { class: 'day__habits', 'aria-hidden': 'true' },
        h('span', { style: { transform: `scaleX(${d.habitsDone / HABITS.length})` } })));
  }));

  const counter = (key, label, accent) => {
    const v = done[key], tgt = targets[key];
    return h('div', { class: `counter${v >= tgt ? ' counter--done' : ''}`, style: v >= tgt ? { color: `var(--${accent})` } : {} },
      h('span', { class: 'counter__label' }, h('span', { class: `dot dot--${accent}`, 'aria-hidden': 'true' }), label),
      h('div', { class: 'counter__value num' }, String(v), h('small', {}, `/${tgt}`)));
  };

  refs.weekBody.replaceChildren(strip, h('div', { class: 'counters' },
    counter('gym', t('week.gym'), 'strength'),
    counter('climbing', t('week.climbing'), 'climb'),
    counter('swim', t('week.swim'), 'swim')));
}

// ---- Actions ------------------------------------------------------------

function actionsCard() {
  const icon = (d) => h('span', { html: `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>` });
  return h('section', { class: 'actions', 'aria-label': 'Actions' },
    h('button', { class: `btn btn--lg ${state.activeId ? 'btn--resume' : 'btn--strength'}`, type: 'button', onclick: () => startOrResume(state.activeId) },
      icon('<path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
      state.activeId ? t('wk.resume') : t('actions.startWorkout')),
    h('button', { class: 'btn btn--tint-climb', type: 'button', onclick: () => toast(t('actions.comingPhase4')) },
      icon('<path d="M3 20l6-9 3.5 4.5L15 12l6 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
      t('actions.logClimb')),
    h('button', { class: 'btn btn--tint-swim', type: 'button', onclick: () => toast(t('actions.comingPhase4')) },
      icon('<path d="M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15M3 19.5c2 0 2-1.5 4.5-1.5S10 19.5 12 19.5s2.5-1.5 4.5-1.5S19 19.5 21 19.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/>'),
      t('actions.logSwim')),
  );
}

