// Today: plan of the day (1-tap start), two scores (consistency, weight goal),
// 6 habit chips, week strip (tap → monthly calendar), quick logs.
import { h } from '../ui/dom.js';
import { habitChips } from '../ui/habits.js';
import { t } from '../strings.js';
import { toISODate, fromISODate, formatDay, weekDates } from '../lib/date.js';
import { summarizeWeek } from '../lib/week.js';
import { consistency, currentWeight, goalProgress } from '../lib/scores.js';
import { HABITS } from '../lib/model.js';
import { formatLoad } from '../lib/workout.js';
import { remainingPlanned, plannedTemplateId } from '../lib/plan.js';
import { GUIDANCE } from '../data/phase1.js';
import {
  loadSettings, getHabits, loadWeek, getActiveSessionId, loadActivity, getWeights,
  getAllPlan, getTemplates,
} from '../repo.js';
import { startOrResume, startTemplate } from './workout.js';
import { openMonth, openWeightSheet } from './calendar.js';
import { openClimbLog, openSwimLog } from './quicklog.js';

let state = {};
const refs = {};

export async function renderToday() {
  const today = toISODate();
  const dates = weekDates();
  const [settings, habits, weekData, activeId, activity, weights, plan, templates] = await Promise.all([
    loadSettings(), getHabits(today), loadWeek(dates), getActiveSessionId(), loadActivity(), getWeights(),
    getAllPlan(), getTemplates(),
  ]);
  state = {
    date: today, dates, settings, habits, activeId, plan,
    planToday: plan.find((d) => d.date === today) || null,
    templates: new Map(templates.map((x) => [x.id, x])),
    week: summarizeWeek(dates, weekData, settings, today, plan),
    consistency: consistency(activity, settings.weeklyTargets, today, plan),
    weight: currentWeight(weights, today),
  };

  document.getElementById('today-date').textContent = formatDay(new Date());
  document.getElementById('today-body').replaceChildren(
    planCard(), scoresCard(), habitsCard(), weekCard(), actionsCard(),
  );
}

/** Re-render if the calendar day changed while the app sat in the background. */
export function refreshTodayIfStale() {
  if (state.date && state.date !== toISODate()) renderToday();
}

// ---- Plan of the day ----------------------------------------------------

const KIND_ACCENT = { strength: 'strength', climb: 'climb', swim: 'swim' };
const DUMBBELL = '<path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>';

function planCard() {
  const day = state.planToday;
  const todayDone = state.week.days.find((d) => d.isToday) || { gym: 0, climb: 0, swim: 0 };
  const left = remainingPlanned(day?.items, todayDone);
  const tplId = plannedTemplateId({ items: left });
  const tpl = tplId ? state.templates.get(tplId) : null;
  const icon = h('span', { html: `<svg viewBox="0 0 24 24" aria-hidden="true">${DUMBBELL}</svg>` });

  const weekNo = day?.week;
  const head = h('div', { class: 'card__head' },
    h('h2', { class: 'card__title' }, weekNo ? `${t('plan.title')} · ${t('plan.week')} ${weekNo}/8` : t('plan.title')),
    h('span', { class: 'card__meta' }, t('plan.today')));

  let title, sub, main;
  if (state.activeId) {
    title = t('wk.resume'); sub = null;
    main = h('button', { class: 'btn btn--lg btn--block btn--resume', type: 'button', onclick: () => startOrResume(state.activeId) }, icon, t('wk.resume'));
  } else if (tpl) {
    title = tpl.name;
    sub = `${tpl.exercises.length} exercises · ${tpl.exercises.reduce((n, e) => n + e.sets, 0)} sets`;
    main = h('button', { class: 'btn btn--lg btn--block btn--strength', type: 'button', onclick: () => startTemplate(tpl.id, state.activeId) }, icon, `${t('plan.start')} ${tpl.name}`);
  } else if (left.some((i) => i.kind === 'climb')) {
    title = t('plan.climbToday'); sub = null;
    main = h('button', { class: 'btn btn--lg btn--block btn--climb', type: 'button', onclick: () => openClimbLog({ onSaved: renderToday }) }, t('plan.logIt'));
  } else if (left.some((i) => i.kind === 'swim')) {
    title = t('plan.swimToday'); sub = null;
    main = h('button', { class: 'btn btn--lg btn--block btn--swim', type: 'button', onclick: () => openSwimLog({ onSaved: renderToday }) }, t('plan.logIt'));
  } else if (day && day.items.length) {
    title = t('plan.done'); sub = null; main = null;
  } else {
    title = day ? t('plan.rest') : t('actions.startWorkout');
    sub = day ? t('plan.restSub') : null;
    main = day ? null : h('button', { class: 'btn btn--lg btn--block btn--strength', type: 'button', onclick: () => startOrResume(null) }, icon, t('actions.startWorkout'));
  }

  const guidance = weekNo ? GUIDANCE[Math.min(3, Math.floor((weekNo - 1) / 2))] : null;
  return h('section', { class: 'card plan-card' },
    head,
    h('p', { class: 'plan-card__title' }, title),
    sub && h('p', { class: 'plan-card__sub num' }, sub),
    guidance && h('p', { class: 'plan-card__hint' }, guidance),
    main);
}

// ---- Scores -------------------------------------------------------------

const R = 30, C = 2 * Math.PI * R;
function ring(p, accent) {
  const v = p == null ? 0 : p;
  return h('span', {
    class: 'score__ring', 'aria-hidden': 'true',
    html: `<svg viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="${R}" fill="none" stroke="var(--${accent}-soft)" stroke-width="9"/>
      <circle cx="36" cy="36" r="${R}" fill="none" stroke="var(--${accent})" stroke-width="9" stroke-linecap="round"
        stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - v)}" ${v === 0 ? 'opacity="0"' : ''}/>
    </svg>`,
  });
}
const pct = (p) => (p == null ? '—' : `${Math.round(p * 100)}%`);
const shortDate = (iso) => formatDay(fromISODate(iso), false).slice(4);   // '2 Nov'

function scoresCard() {
  const c = state.consistency;
  const goal = state.settings.weightGoal;
  const w = state.weight;
  const gp = goalProgress(w?.kg, goal);

  const consistencyEl = h('div', { class: 'score' },
    ring(c.pct, 'strength'),
    h('div', { class: 'score__text' },
      h('span', { class: 'score__label' }, t('scores.consistency')),
      h('span', { class: 'score__value num', style: { color: 'var(--strength)' } }, pct(c.pct)),
      h('span', { class: 'score__sub' }, c.since ? `${t('scores.since')} ${shortDate(c.since)}` : t('scores.noSessions'))));

  const goalEl = h('button', { class: 'score score--btn', type: 'button', onclick: () => openWeightSheet({ onSaved: renderToday }), 'aria-label': `${t('scores.goal')} ${pct(gp)}. ${t('scores.logWeight')}` },
    ring(gp, 'steps'),
    h('div', { class: 'score__text' },
      h('span', { class: 'score__label' }, t('scores.goal')),
      h('span', { class: 'score__value num', style: { color: 'var(--steps)' } }, pct(gp)),
      h('span', { class: 'score__sub num' }, w
        ? `${formatLoad(w.kg)} → ${formatLoad(goal.target)} kg`
        : t('scores.noWeight'))));

  const weightLine = h('div', { class: 'weight-line' },
    h('span', { class: 'weight-line__text num' },
      w ? `${formatLoad(w.kg)} kg · ${w.count > 1 ? t('scores.avg7') : t('scores.oneWeighIn')}`
        : `${t('scores.goal')}: ${formatLoad(goal.start)} → ${formatLoad(goal.target)} kg`),
    h('button', { class: 'btn btn--tint-goal', type: 'button', onclick: () => openWeightSheet({ onSaved: renderToday }) }, `+ ${t('scores.logWeight')}`));

  return h('section', { class: 'card', 'aria-label': `${t('scores.consistency')}, ${t('scores.goal')}` },
    h('div', { class: 'scores' }, consistencyEl, goalEl),
    weightLine);
}

// ---- Habits -------------------------------------------------------------

function habitsCard() {
  const meta = h('span', { class: 'card__meta num' });
  const updateMeta = () => { meta.textContent = `${HABITS.filter((k) => state.habits[k]).length}/${HABITS.length}`; };
  updateMeta();
  return h('section', { class: 'card', 'aria-labelledby': 'h-habits' },
    h('div', { class: 'card__head' }, h('h2', { class: 'card__title', id: 'h-habits' }, t('habits.title')), meta),
    habitChips(state.date, state.habits, (rec) => { state.habits = rec; updateMeta(); refreshWeek(); }));
}

// ---- Week ---------------------------------------------------------------

function weekCard() {
  refs.weekBody = h('div', {});
  fillWeek();
  return h('section', { class: 'card' },
    h('button', { class: 'week-btn', type: 'button', onclick: () => openMonth({ onChange: renderToday }), 'aria-label': t('week.open') },
      h('div', { class: 'card__head' },
        h('h2', { class: 'card__title' }, t('week.title')),
        h('span', { class: 'card__meta card__chev', 'aria-hidden': 'true' }, `${t('month.title')} ›`)),
      refs.weekBody));
}

async function refreshWeek() {
  state.week = summarizeWeek(state.dates, await loadWeek(state.dates), state.settings, state.date, state.plan);
  fillWeek();
}

function fillWeek() {
  const { days, done, targets } = state.week;
  const labels = t('week.days');
  const strip = h('ol', { class: 'week', 'aria-hidden': 'true' }, days.map((d, i) => {
    const dots = [...Array(d.gym).fill('strength'), ...Array(d.climb).fill('climb'), ...Array(d.swim).fill('swim')];
    const todo = remainingPlanned(d.planned, d).map((it) => `${KIND_ACCENT[it.kind]} dot--plan${d.date < state.date ? ' dot--missed' : ''}`);
    return h('li', { class: `day${d.isToday ? ' day--today' : ''}${d.isFuture ? ' day--future' : ''}` },
      h('span', { class: 'day__label' }, labels[i]),
      h('span', { class: 'day__num num' }, String(Number(d.date.slice(8)))),
      h('span', { class: 'day__dots' }, dots.map((c) => h('span', { class: `dot dot--${c}` })), todo.map((c) => h('span', { class: `dot dot--${c}` }))),
      h('span', { class: 'day__habits' }, h('span', { style: { transform: `scaleX(${d.habitsDone / HABITS.length})` } })));
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
    h('button', { class: 'btn btn--tint-climb', type: 'button', onclick: () => openClimbLog({ onSaved: renderToday }) },
      icon('<path d="M3 20l6-9 3.5 4.5L15 12l6 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
      t('actions.logClimb')),
    h('button', { class: 'btn btn--tint-swim', type: 'button', onclick: () => openSwimLog({ onSaved: renderToday }) },
      icon('<path d="M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15M3 19.5c2 0 2-1.5 4.5-1.5S10 19.5 12 19.5s2.5-1.5 4.5-1.5S19 19.5 21 19.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/>'),
      t('actions.logSwim')),
    !state.activeId && h('button', { class: 'btn btn--secondary actions__wide', type: 'button', onclick: () => startOrResume(null, { plannedTemplateId: plannedTemplateId(state.planToday) }) },
      icon(DUMBBELL), t('plan.other')),
  );
}
