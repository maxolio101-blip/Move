// Monthly calendar (from the week strip), day editor (habits + weight +
// sessions of any past day), and the weigh-in sheet.
import { h } from '../ui/dom.js';
import { t } from '../strings.js';
import { openSheet, closeSheet, toast } from '../ui/shell.js';
import { createStack } from '../ui/stack.js';
import { habitChips } from '../ui/habits.js';
import { toISODate, fromISODate, formatDay, startOfWeek, addDays, formatDuration } from '../lib/date.js';
import { HABITS } from '../lib/model.js';
import { parseLoad, formatLoad } from '../lib/workout.js';
import { loadRange, getHabits, getWeights, getWeight, saveWeight, deleteWeight, sessionsOn, getPlanRange, getPlanDay, setPlanDay, getTemplates } from '../repo.js';
import { remainingPlanned } from '../lib/plan.js';

// ---- Month --------------------------------------------------------------

export function openMonth({ onChange } = {}) {
  const stack = createStack({ onEmpty: closeSheet });
  stack.push(monthView(stack));
  openSheet(stack.el, { label: t('month.title'), onClose: () => onChange?.() });
}

function monthView(stack) {
  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth();
  const root = h('div', { class: 'sheet__body' });

  async function paint() {
    const first = new Date(y, m, 1);
    const gridStart = startOfWeek(first);
    const last = new Date(y, m + 1, 0);
    const gridEnd = addDays(startOfWeek(last), 6);
    const from = toISODate(gridStart), to = toISODate(gridEnd);
    const [data, weights, plan] = await Promise.all([loadRange(from, to), getWeights(), getPlanRange(from, to)]);
    const planBy = new Map(plan.map((p) => [p.date, p]));
    const today = toISODate();

    const count = (list, d, finishedOnly) => (list || []).filter((s) => s.date === d && (!finishedOnly || s.endedAt)).length;
    const habitsBy = new Map(data.habits.map((r) => [r.date, r]));
    const weightBy = new Set(weights.map((w) => w.date));

    const cells = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
      const iso = toISODate(d);
      const inMonth = d.getMonth() === m;
      const future = iso > today;
      const hr = habitsBy.get(iso);
      const done = hr ? HABITS.filter((k) => hr[k]).length : 0;
      const doneC = { gym: count(data.strength, iso, true), climb: count(data.climbs, iso), swim: count(data.swims, iso) };
      const dots = [
        ...Array(doneC.gym).fill('strength'),
        ...Array(doneC.climb).fill('climb'),
        ...Array(doneC.swim).fill('swim'),
      ];
      const todo = remainingPlanned(planBy.get(iso)?.items, doneC)
        .map((it) => `${it.kind} dot--plan${iso < today ? ' dot--missed' : ''}`);
      const label = [
        formatDay(d), dots.length ? `${dots.length} session${dots.length > 1 ? 's' : ''}` : null,
        todo.length ? `${todo.length} ${t('plan.planned')}` : null,
        `${done}/${HABITS.length} ${t('week.habitsOf')}`, weightBy.has(iso) ? t('day.weight') : null,
      ].filter(Boolean).join(', ');
      cells.push(h('button', {
        type: 'button',
        class: `mday${inMonth ? '' : ' mday--out'}${iso === today ? ' mday--today' : ''}${future ? ' mday--future' : ''}`,
        'aria-label': label,
        onclick: () => stack.push(dayView(stack, iso, paint)),
      },
        h('span', { class: 'mday__num num' }, String(d.getDate())),
        h('span', { class: 'mday__dots', 'aria-hidden': 'true' }, [...dots, ...todo].slice(0, 4).map((c) => h('span', { class: `dot dot--${c}` }))),
        h('span', { class: 'day__habits mday__habits', 'aria-hidden': 'true' }, h('span', { style: { transform: `scaleX(${done / HABITS.length})` } }))));
    }

    const isCurrent = false;   // future months reachable: the plan runs ahead
    root.replaceChildren(
      h('div', { class: 'month__head' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('month.prev'), onclick: () => { m -= 1; if (m < 0) { m = 11; y -= 1; } paint(); } }, '‹'),
        h('h3', { class: 'month__title', 'aria-live': 'polite' }, `${t('month.names')[m]} ${y}`),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('month.next'), disabled: isCurrent || null, onclick: () => { m += 1; if (m > 11) { m = 0; y += 1; } paint(); } }, '›')),
      h('div', { class: 'month__dow', 'aria-hidden': 'true' }, t('week.days').map((d) => h('span', {}, d))),
      h('div', { class: 'month__grid' }, cells),
      h('div', { class: 'legend', 'aria-hidden': 'true' },
        h('span', {}, h('span', { class: 'dot dot--strength' }), t('week.gym')),
        h('span', {}, h('span', { class: 'dot dot--climb' }), t('week.climbing')),
        h('span', {}, h('span', { class: 'dot dot--swim' }), t('week.swim')),
        h('span', {}, h('span', { class: 'legend__bar' }), t('habits.title')),
        h('span', {}, h('span', { class: 'dot dot--strength dot--plan' }), t('plan.planned'))),
      h('p', { class: 'hint' }, t('month.tapDay')));
  }

  return {
    title: t('month.title'),
    leading: { label: t('common.close'), onClick: closeSheet },
    onShow: paint,
    render: () => root,
  };
}

// ---- Day editor ---------------------------------------------------------

function dayView(stack, date, onChanged) {
  const root = h('div', { class: 'sheet__body' });

  async function paint() {
    const [habits, weight, sessions, planDay, templates] = await Promise.all([getHabits(date), getWeight(date), sessionsOn(date), getPlanDay(date), getTemplates()]);
    const future = date > toISODate();
    const cur = planDay?.items?.[0];
    const curVal = !cur ? 'rest' : cur.kind === 'strength' ? `tpl:${cur.templateId}` : cur.kind;
    const planSel = h('select', { class: 'input select', id: 'day-plan', 'aria-label': t('plan.dayPlan') },
      h('option', { value: 'rest', selected: curVal === 'rest' || null }, t('plan.restOption')),
      templates.map((tp) => h('option', { value: `tpl:${tp.id}`, selected: curVal === `tpl:${tp.id}` || null }, tp.name)),
      h('option', { value: 'climb', selected: curVal === 'climb' || null }, t('plan.climbOption')),
      h('option', { value: 'swim', selected: curVal === 'swim' || null }, t('plan.swimOption')));
    planSel.addEventListener('change', async () => {
      const v = planSel.value;
      const items = v === 'rest' ? [] : v.startsWith('tpl:') ? [{ kind: 'strength', templateId: v.slice(4) }] : [{ kind: v }];
      await setPlanDay(date, items);
      toast(t('plan.saved'));
      onChanged?.();
    });
    const planField = h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'day-plan' }, t('plan.dayPlan')), planSel);
    if (future) { root.replaceChildren(planField, h('p', { class: 'hint' }, t('day.future'))); return; }
    const kgIn = h('input', {
      class: 'input num', id: 'day-kg', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done',
      value: weight ? formatLoad(weight.kg) : '', placeholder: 'kg',
    });
    const saveW = async () => {
      const kg = parseLoad(kgIn.value);
      if (kgIn.value.trim() === '' && weight) { await deleteWeight(date); toast(t('weight.deleted')); onChanged?.(); paint(); return; }
      if (kg == null || kg < 20 || kg > 300) { toast(t('weight.invalid')); return; }
      await saveWeight(date, kg); toast(t('weight.saved')); onChanged?.(); paint();
    };

    const rows = [
      ...sessions.strength.map((s) => [`${s.templateName}`, formatDuration((s.endedAt || s.startedAt) - s.startedAt), 'strength']),
      ...sessions.climbs.map((c) => [`${t('climb.session')} · ${t(`climb.${c.location || 'indoor'}`)}`, [c.grade, c.durationMin && `${c.durationMin} ${t('min')}`].filter(Boolean).join(' · '), 'climb']),
      ...sessions.swims.map((s) => [t('swim.session'), [s.durationMin && `${s.durationMin} ${t('min')}`, s.distanceM && `${s.distanceM} m`].filter(Boolean).join(' · '), 'swim']),
    ];

    root.replaceChildren(
      planField,
      h('h3', { class: 'section-label', style: { padding: '0 4px' } }, t('day.habits')),
      habitChips(date, habits, () => onChanged?.()),
      h('h3', { class: 'section-label', style: { padding: '8px 4px 0' } }, t('day.weight')),
      h('div', { class: 'inline-form' }, kgIn, h('button', { class: 'btn btn--tint-goal', type: 'button', onclick: saveW }, t('common.save'))),
      h('h3', { class: 'section-label', style: { padding: '8px 4px 0' } }, t('day.sessions')),
      rows.length
        ? h('ul', { class: 'list' }, rows.map(([a, b, accent]) => h('li', { class: 'list__row' },
          h('span', { class: 'list__label' }, h('span', { class: `dot dot--${accent}`, style: { display: 'inline-block', marginRight: '8px' } }), a),
          h('span', { class: 'list__value num' }, b))))
        : h('p', { class: 'hint' }, t('day.none')));
  }

  return {
    title: formatDay(fromISODate(date)),
    onShow: paint,
    render: () => root,
  };
}

// ---- Weigh-in sheet -----------------------------------------------------

export async function openWeightSheet({ onSaved } = {}) {
  const today = toISODate();
  const stack = createStack({ onEmpty: closeSheet });
  const existing = await getWeight(today);
  const latest = (await getWeights()).sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  const kgIn = h('input', {
    class: 'input input--big num', id: 'w-kg', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done',
    placeholder: latest ? formatLoad(latest.kg) : '75.5', value: existing ? formatLoad(existing.kg) : '',
  });
  const dateIn = h('input', { class: 'input num', id: 'w-date', type: 'date', value: today, max: today });
  dateIn.addEventListener('change', async () => {
    const rec = await getWeight(dateIn.value);
    kgIn.value = rec ? formatLoad(rec.kg) : '';
  });

  const save = async () => {
    const kg = parseLoad(kgIn.value);
    if (kg == null || kg < 20 || kg > 300 || !fromISODate(dateIn.value) || dateIn.value > today) { toast(t('weight.invalid')); return; }
    await saveWeight(dateIn.value, kg);
    toast(`${t('weight.saved')} · ${formatLoad(kg)} kg`);
    closeSheet();
    onSaved?.();
  };

  stack.push({
    title: t('weight.title'),
    leading: { label: t('common.cancel'), onClick: closeSheet },
    trailing: { label: t('common.save'), strong: true, onClick: save },
    render: () => h('form', { class: 'sheet__body', novalidate: true, onsubmit: (e) => { e.preventDefault(); save(); } },
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'w-kg' }, t('weight.kg')), kgIn),
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'w-date' }, t('weight.date')), dateIn)),
  });
  openSheet(stack.el, { label: t('weight.title') });
  setTimeout(() => kgIn.focus(), 450);
}
