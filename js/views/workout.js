// Active strength workout: one section per exercise, set rows
// [reps stepper] [load stepper] [✓], rest timer, swap, finish summary.
// Every tap is saved immediately; the session survives the app being closed.
import { h } from '../ui/dom.js';
import { t } from '../strings.js';
import { openSheet, closeSheet, toast, setSheetDismissible } from '../ui/shell.js';
import { createStack } from '../ui/stack.js';
import { uid } from '../db.js';
import { toISODate, formatDuration } from '../lib/date.js';
import { incrementFor } from '../lib/model.js';
import {
  buildSession, swapBlock, addSet, removeSet, stepLoad, stepReps, parseLoad, parseReps,
  formatLoad, restRemaining, elapsed, sessionStats, loadIncreases, firstOpenBlock,
  propagate, lastSetsFor, formatLast, formatTarget,
} from '../lib/workout.js';
import { unlockAudio, beep, keepAwake } from '../ui/sound.js';
import {
  loadSettings, exerciseMap, getAllStrength, getSession, saveSession, deleteSession,
  setActiveSessionId, getTemplate,
} from '../repo.js';
import { templatePickerView, exercisePickerView } from './templates.js';

const WARN_AFTER_MS = 45 * 60 * 1000;
const REST_LINGER_MS = 60 * 1000;     // "Rest over" stays visible for 1 min, then clears

let onChangeCb = () => {};
export function setWorkoutChangeHandler(fn) { onChangeCb = fn; }

// ---- Entry points -------------------------------------------------------

async function createSession(tpl) {
  const sessions = await getAllStrength();
  const session = buildSession({ id: uid(), template: tpl, sessions, now: Date.now(), date: toISODate() });
  await saveSession(session);
  await setActiveSessionId(session.id);
  onChangeCb();
  return session;
}

/** Resume the active session, or pick a template (planned one listed first). */
export async function startOrResume(activeId, { plannedTemplateId = null } = {}) {
  if (activeId) {
    const s = await getSession(activeId);
    if (s && !s.endedAt) return openWorkout(s);
    await setActiveSessionId(null);
  }
  const stack = createStack({ onEmpty: closeSheet });
  stack.push(templatePickerView(stack, {
    plannedTemplateId,
    onClose: closeSheet,
    onStart: async (tpl) => {
      if (!tpl.exercises.length) { toast(t('tpl.exercisesRequired')); return; }
      const session = await createSession(tpl);
      setSheetDismissible(false);
      stack.reset(workoutView(stack, session));
    },
  }));
  openSheet(stack.el, { label: t('tpl.chooseTitle'), dismissible: true, onClose: () => onChangeCb() });
}

/** One tap from Today: start the planned template directly. */
export async function startTemplate(templateId, activeId) {
  if (activeId) return startOrResume(activeId);
  const tpl = await getTemplate(templateId);
  if (!tpl || !tpl.exercises.length) return startOrResume(null);
  openWorkout(await createSession(tpl));
}

export async function openWorkout(session) {
  const stack = createStack({ onEmpty: closeSheet });
  stack.push(workoutView(stack, session));
  openSheet(stack.el, { label: session.templateName, dismissible: false, onClose: () => onChangeCb() });
}

// ---- Workout view -------------------------------------------------------

function workoutView(stack, session) {
  let settings, exMap, sessions;
  let ticker = null;
  const root = h('div', { class: 'workout' });
  const timerEl = h('span', { class: 'wk-timer__value num' }, '0:00');
  const warnEl = h('span', { class: 'wk-timer__warn', hidden: true }, t('wk.over45'));
  const blocksEl = h('div', { class: 'wk-blocks' });
  const rest = restBar();

  const persist = () => saveSession(session).catch(() => toast(t('wk.saveError')));

  // -- timers --
  function tick() {
    const now = Date.now();
    const ms = elapsed(session.startedAt, now);
    timerEl.textContent = formatDuration(ms);
    const over = ms >= WARN_AFTER_MS;
    timerEl.parentElement?.classList.toggle('is-over', over);
    warnEl.hidden = !over;
    rest.update(now);
  }
  const startTicker = () => { stopTicker(); tick(); ticker = setInterval(tick, 250); };
  const stopTicker = () => { clearInterval(ticker); ticker = null; };
  const onVis = () => { if (document.visibilityState === 'visible') tick(); };

  // -- rest bar --
  function restBar() {
    const label = h('span', { class: 'rest__label' });
    const value = h('span', { class: 'rest__value num' });
    const fill = h('span', { class: 'rest__fill' });
    const adj = (d) => () => {
      if (!session.restEndsAt) return;
      session.restEndsAt = Math.max(Date.now(), session.restEndsAt + d * 1000);
      session.restTotal = Math.max(1, (session.restTotal || 0) + d);
      persist(); tick();
    };
    const skip = () => { session.restEndsAt = null; persist(); tick(); };
    const el = h('div', { class: 'rest', role: 'timer', 'aria-live': 'off', hidden: true },
      h('span', { class: 'rest__track', 'aria-hidden': 'true' }, fill),
      h('button', { class: 'rest__btn', type: 'button', onclick: adj(-15), 'aria-label': t('wk.rest15minus') }, '−15'),
      h('div', { class: 'rest__center' }, label, value),
      h('button', { class: 'rest__btn', type: 'button', onclick: adj(15), 'aria-label': t('wk.rest15plus') }, '+15'),
      h('button', { class: 'rest__btn rest__btn--skip', type: 'button', onclick: skip, 'aria-label': t('wk.restSkip') }, '✕'));
    let wasDone = false;
    let wasRunning = false;   // beep only when the countdown is seen reaching 0
    return {
      el,
      update(now) {
        if (!session.restEndsAt) { el.hidden = true; wasDone = false; wasRunning = false; return; }
        const left = restRemaining(session.restEndsAt, now);
        if (left <= 0 && now - session.restEndsAt > REST_LINGER_MS) { session.restEndsAt = null; persist(); el.hidden = true; return; }
        el.hidden = false;
        const done = left <= 0;
        el.classList.toggle('is-done', done);
        label.textContent = done ? t('wk.restOver') : t('wk.rest');
        value.textContent = done ? t('wk.go') : formatDuration(left * 1000);
        const total = Math.max(1, session.restTotal || settings?.restTimerSec || 90);
        fill.style.transform = `scaleX(${done ? 1 : Math.max(0, Math.min(1, left / total))})`;
        if (done && !wasDone && wasRunning) { el.setAttribute('aria-live', 'assertive'); beep(); }
        if (!done) el.setAttribute('aria-live', 'off');
        wasDone = done;
        wasRunning = !done;
      },
    };
  }

  // -- blocks --
  function renderBlock(bi) {
    const block = session.exercises[bi];
    const ex = exMap.get(block.exerciseId) || { name: block.exerciseId, equipment: 'machine' };
    const orig = block.substitutedFrom ? exMap.get(block.substitutedFrom) : null;
    const inc = incrementFor(ex, settings);
    const isBW = ex.equipment === 'bodyweight';

    const inputs = [];          // [{ repsIn, loadIn }] per set, for in-place propagation
    const spread = (si, field, value) => {
      const next = propagate(block, si, field, value);
      next.sets.forEach((s, j) => {
        if (j <= si || block.sets[j].completed) return;
        block.sets[j][field] = s[field];
        const r = inputs[j];
        if (field === 'reps') r.repsIn.value = String(s.reps); else r.loadIn.value = formatLoad(s.load);
      });
    };

    const rows = block.sets.map((set, si) => {
      const repsIn = h('input', {
        class: 'stepper__value num', inputmode: 'numeric', pattern: '[0-9]*', value: String(set.reps),
        'aria-label': `${ex.name}, ${t('wk.set')} ${si + 1}, ${t('wk.reps')}`, autocomplete: 'off', enterkeyhint: 'done',
      });
      const loadIn = h('input', {
        class: 'stepper__value num', inputmode: 'decimal', value: formatLoad(set.load),
        'aria-label': `${ex.name}, ${t('wk.set')} ${si + 1}, ${t('wk.load')}`, autocomplete: 'off', enterkeyhint: 'done',
      });
      inputs[si] = { repsIn, loadIn };
      const selectAll = (e) => setTimeout(() => e.target.select(), 0);
      repsIn.addEventListener('focus', selectAll);
      loadIn.addEventListener('focus', selectAll);
      repsIn.addEventListener('change', () => {
        const v = parseReps(repsIn.value);
        if (v == null) { repsIn.value = String(set.reps); return; }
        set.reps = v; repsIn.value = String(v); spread(si, 'reps', v); persist();
      });
      loadIn.addEventListener('change', () => {
        const v = parseLoad(loadIn.value);
        if (v == null) { loadIn.value = formatLoad(set.load); return; }
        set.load = v; loadIn.value = formatLoad(v); spread(si, 'load', v); persist();
      });
      const step = (kind, dir) => () => {
        if (kind === 'reps') { set.reps = stepReps(set.reps, dir); repsIn.value = String(set.reps); spread(si, 'reps', set.reps); }
        else { set.load = stepLoad(set.load, inc, dir); loadIn.value = formatLoad(set.load); spread(si, 'load', set.load); }
        persist();
      };
      const doneBtn = h('button', {
        class: 'set-done', type: 'button', 'aria-pressed': String(set.completed),
        'aria-label': `${t('wk.complete')} ${t('wk.set')} ${si + 1}`,
        onclick: () => {
          document.activeElement?.blur?.();       // commit a value being typed
          unlockAudio();                           // iOS: audio must start from a tap
          set.completed = !set.completed;
          doneBtn.setAttribute('aria-pressed', String(set.completed));
          row.classList.toggle('is-done', set.completed);
          if (set.completed) {
            const sec = block.target?.restSec || settings.restTimerSec;
            session.restEndsAt = Date.now() + sec * 1000;
            session.restTotal = sec;
          }
          persist(); tick();
        },
      }, h('span', { class: 'set-done__num num' }, String(si + 1)),
         h('span', { class: 'set-done__check', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' }));

      const stepper = (kind, input, unit) => h('div', { class: 'stepper' },
        h('button', { class: 'stepper__btn', type: 'button', onclick: step(kind, -1), 'aria-label': `${t('wk.decrease')} ${unit}` }, '−'),
        input,
        h('button', { class: 'stepper__btn', type: 'button', onclick: step(kind, 1), 'aria-label': `${t('wk.increase')} ${unit}` }, '+'));

      const row = h('li', { class: `set-row${set.completed ? ' is-done' : ''}` },
        stepper('reps', repsIn, t('wk.reps')), stepper('load', loadIn, t('wk.load')), doneBtn);
      return row;
    });

    const sub = [
      t(`equipment.${ex.equipment}`),
      isBW ? t('wk.addedLoad') : null,
      `±${formatLoad(inc)} kg`,
    ].filter(Boolean).join(' · ');

    const targetText = formatTarget(block.substitutedFrom ? null : block.target);
    const lastText = formatLast(lastSetsFor(sessions, block.exerciseId, session.id), isBW);

    const section = h('section', { class: 'block', 'data-block': bi, 'aria-labelledby': `blk-${bi}` },
      h('header', { class: 'block__head' },
        h('div', { class: 'block__titles' },
          h('h3', { class: 'block__name', id: `blk-${bi}` }, ex.name),
          h('p', { class: 'block__sub' }, sub),
          targetText && h('p', { class: 'block__target num' }, `${t('wk.target')}: ${targetText}`),
          lastText && h('p', { class: 'block__last num' }, `${t('wk.last')}: ${lastText}`),
          orig && h('p', { class: 'block__swap' }, `${t('wk.insteadOf')} ${orig.name}`)),
        h('button', { class: 'pill-btn', type: 'button', onclick: () => openSwap(bi), 'aria-label': `${t('wk.swap')} ${ex.name}` }, `⇄ ${t('wk.swap')}`)),
      h('div', { class: 'set-cols', 'aria-hidden': 'true' },
        h('span', {}, t('wk.reps')), h('span', {}, isBW ? `+kg` : 'kg'), h('span', {}, t('wk.done'))),
      h('ol', { class: 'set-list' }, rows),
      h('div', { class: 'block__foot' },
        h('button', { class: 'ghost-btn', type: 'button', onclick: () => { session.exercises[bi] = addSet(block); persist(); repaintBlock(bi); } }, `+ ${t('wk.addSet')}`),
        h('button', { class: 'ghost-btn', type: 'button', disabled: block.sets.length <= 1 || null, onclick: () => { session.exercises[bi] = removeSet(block); persist(); repaintBlock(bi); } }, `− ${t('wk.removeSet')}`),
        h('button', { class: 'ghost-btn ghost-btn--danger', type: 'button', onclick: () => removeExercise(bi, ex.name) }, `× ${t('wk.removeExercise')}`)));
    return section;
  }

  function removeExercise(bi, name) {
    if (session.exercises.length <= 1) { toast(t('wk.lastExercise'), 3000); return; }
    if (!confirm(t('wk.removeExerciseConfirm').replace('{name}', name))) return;
    session.exercises.splice(bi, 1);      // this session only — the template is untouched
    persist();
    blocksEl.replaceChildren(...session.exercises.map((_, i) => renderBlock(i)));
  }

  function repaintBlock(bi) {
    const old = blocksEl.querySelector(`[data-block="${bi}"]`);
    old?.replaceWith(renderBlock(bi));
  }

  function openSwap(bi) {
    const block = session.exercises[bi];
    const original = block.substitutedFrom || block.exerciseId;
    const origEx = exMap.get(original);
    stack.push(exercisePickerView(stack, {
      title: t('wk.swapTitle'),
      excludeIds: [block.exerciseId],
      extraTop: block.substitutedFrom ? h('button', {
        class: 'btn btn--secondary btn--block', type: 'button',
        onclick: () => pick({ id: original }),
      }, `↺ ${t('wk.backTo')} ${origEx?.name || ''}`) : h('p', { class: 'hint' }, t('wk.swapHint')),
      onPick: (ex) => pick(ex),
    }));
    async function pick(ex) {
      exMap = await exerciseMap();
      session.exercises[bi] = swapBlock(block, ex.id, sessions);
      persist();
      repaintBlock(bi);
      stack.pop();
    }
  }

  // -- finish / discard --
  async function finish() {
    document.activeElement?.blur?.();
    const { completedSets } = sessionStats(session, Date.now());
    if (completedSets === 0) {
      if (confirm(t('wk.noSetsDiscard'))) await discard(true);
      return;
    }
    if (!confirm(t('wk.finishConfirm'))) return;
    session.endedAt = Date.now();
    session.restEndsAt = null;
    await saveSession(session);
    await setActiveSessionId(null);
    stopTicker();
    keepAwake(false);
    stack.reset(summaryView(session, sessions, exMap));
  }

  async function discard(skipConfirm = false) {
    if (!skipConfirm && !confirm(t('wk.discardConfirm'))) return;
    stopTicker();
    keepAwake(false);
    await deleteSession(session.id);
    await setActiveSessionId(null);
    closeSheet();
    toast(t('wk.discarded'));
  }

  async function init() {
    [settings, exMap, sessions] = await Promise.all([loadSettings(), exerciseMap(), getAllStrength()]);
    blocksEl.replaceChildren(...session.exercises.map((_, i) => renderBlock(i)));
    startTicker();
    keepAwake(true);
    document.addEventListener('visibilitychange', onVis);
    // Resume where you left off
    const open = firstOpenBlock(session);
    if (open > 0) requestAnimationFrame(() => blocksEl.querySelector(`[data-block="${open}"]`)?.scrollIntoView({ block: 'start' }));
  }

  root.append(
    h('div', { class: 'wk-timer' }, h('span', { class: 'wk-timer__label' }, t('wk.duration')), timerEl, warnEl),
    blocksEl,
    h('button', { class: 'btn btn--danger btn--block', type: 'button', onclick: () => discard() }, t('wk.discard')),
    rest.el,
  );

  let inited = false;
  return {
    title: session.templateName,
    leading: { label: t('wk.hide'), onClick: () => { stopTicker(); keepAwake(false); document.removeEventListener('visibilitychange', onVis); closeSheet(); } },
    trailing: { label: t('wk.finish'), strong: true, onClick: finish },
    onShow: () => { if (!inited) { inited = true; init(); } else { exerciseMap().then((m) => { exMap = m; }); startTicker(); keepAwake(true); } },
    render: () => root,
  };
}

// ---- Summary ------------------------------------------------------------

function summaryView(session, sessions, exMap) {
  const stats = sessionStats(session);
  const ups = loadIncreases(session, sessions);
  return {
    title: t('wk.summary'),
    leading: null,
    trailing: { label: t('common.done'), strong: true, onClick: closeSheet },
    render: () => h('div', { class: 'sheet__body summary' },
      h('p', { class: 'summary__name' }, session.templateName),
      h('div', { class: 'summary__stats' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value num', style: { color: 'var(--strength)' } }, formatDuration(stats.durationMs)),
          h('span', { class: 'metric__label' }, t('wk.duration'))),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value num' }, `${stats.completedSets}`, h('span', { class: 'metric__unit' }, `/${stats.totalSets}`)),
          h('span', { class: 'metric__label' }, t('wk.setsCompleted')))),
      h('div', { class: 'card' },
        h('h3', { class: 'card__title' }, t('wk.loadsUp')),
        ups.length
          ? h('ul', { class: 'ups' }, ups.map((u) => h('li', { class: 'ups__row' },
            h('span', {}, exMap.get(u.exerciseId)?.name || u.exerciseId),
            h('span', { class: 'num ups__val' }, `${formatLoad(u.from)} → `, h('b', {}, `${formatLoad(u.to)} kg`)))))
          : h('p', { class: 'hint' }, t('wk.noLoadsUp'))),
      h('button', { class: 'btn btn--primary btn--lg btn--block', type: 'button', onclick: closeSheet }, t('common.done'))),
  };
}
