// Climbing & swim quick logs: one short sheet each, defaults from the last
// entry, so a typical log is 1 tap (Save).
import { h } from '../ui/dom.js';
import { t } from '../strings.js';
import { openSheet, closeSheet, toast } from '../ui/shell.js';
import { createStack } from '../ui/stack.js';
import { uid } from '../db.js';
import { toISODate, fromISODate } from '../lib/date.js';
import { GRADES } from '../lib/model.js';
import { saveClimb, saveSwim, lastOf } from '../repo.js';

function minuteStepper(id, value, step, label) {
  let v = value;
  const out = h('span', { class: 'stepper__value num', id, role: 'status', 'aria-live': 'polite' }, `${v} ${t('min')}`);
  const set = (n) => { v = Math.max(step, Math.min(600, n)); out.textContent = `${v} ${t('min')}`; };
  const el = h('div', { class: 'stepper stepper--wide', role: 'group', 'aria-label': label },
    h('button', { class: 'stepper__btn', type: 'button', 'aria-label': `− ${step} ${t('min')}`, onclick: () => set(v - step) }, '−'),
    out,
    h('button', { class: 'stepper__btn', type: 'button', 'aria-label': `+ ${step} ${t('min')}`, onclick: () => set(v + step) }, '+'));
  return { el, get: () => v };
}

function dateField(id) {
  const today = toISODate();
  const input = h('input', { class: 'input num', id, type: 'date', value: today, max: today });
  return {
    el: h('div', { class: 'field' }, h('label', { class: 'field__label', for: id }, t('weight.date')), input),
    get: () => (fromISODate(input.value) && input.value <= today ? input.value : today),
  };
}

function sheet(title, body, save) {
  const stack = createStack({ onEmpty: closeSheet });
  stack.push({
    title,
    leading: { label: t('common.cancel'), onClick: closeSheet },
    trailing: { label: t('common.save'), strong: true, onClick: save },
    render: () => body,
  });
  openSheet(stack.el, { label: title });
}

// ---- Climbing -----------------------------------------------------------

export async function openClimbLog({ onSaved } = {}) {
  const last = await lastOf('climbs');
  let location = last?.location || 'indoor';

  const seg = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': t('climb.where') },
    ['indoor', 'outdoor'].map((k) => h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(location === k),
      onclick: (e) => {
        location = k;
        seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b === e.currentTarget)));
      },
    }, t(`climb.${k}`))));

  const dur = minuteStepper('c-dur', last?.durationMin || 90, 15, t('climb.duration'));
  const grade = h('select', { class: 'input select num', id: 'c-grade' },
    h('option', { value: '' }, t('climb.noGrade')),
    GRADES.map((g) => h('option', { value: g, selected: (last?.grade || '6a') === g || null }, g)));
  const date = dateField('c-date');

  const body = h('div', { class: 'sheet__body' },
    h('div', { class: 'field' }, h('span', { class: 'field__label' }, t('climb.where')), seg),
    h('div', { class: 'field' }, h('span', { class: 'field__label' }, t('climb.duration')), dur.el),
    h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'c-grade' }, t('climb.grade')), grade),
    date.el,
    h('button', { class: 'btn btn--climb btn--lg btn--block', type: 'button', onclick: () => save() }, t('common.save')));

  async function save() {
    await saveClimb({ id: uid(), date: date.get(), location, durationMin: dur.get(), grade: grade.value || null, createdAt: Date.now() });
    toast(t('climb.saved'));
    closeSheet();
    onSaved?.();
  }
  sheet(t('climb.title'), body, save);
}

// ---- Swim ---------------------------------------------------------------

export async function openSwimLog({ onSaved } = {}) {
  const last = await lastOf('swims');
  const dur = minuteStepper('s-dur', last?.durationMin || 30, 5, t('swim.duration'));
  const dist = h('input', {
    class: 'input num', id: 's-dist', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off',
    placeholder: last?.distanceM ? String(last.distanceM) : '1000',
  });
  const date = dateField('s-date');

  const body = h('div', { class: 'sheet__body' },
    h('div', { class: 'field' }, h('span', { class: 'field__label' }, t('swim.duration')), dur.el),
    h('div', { class: 'field' }, h('label', { class: 'field__label', for: 's-dist' }, t('swim.distance')), dist),
    date.el,
    h('button', { class: 'btn btn--swim btn--lg btn--block', type: 'button', onclick: () => save() }, t('common.save')));

  async function save() {
    const m = /^\d{1,5}$/.test(dist.value.trim()) ? Number(dist.value.trim()) : null;
    await saveSwim({ id: uid(), date: date.get(), durationMin: dur.get(), distanceM: m, createdAt: Date.now() });
    toast(t('swim.saved'));
    closeSheet();
    onSaved?.();
  }
  sheet(t('swim.title'), body, save);
}
