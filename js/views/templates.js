// Template picker (start a workout), template editor, exercise picker & form.
import { h } from '../ui/dom.js';
import { t } from '../strings.js';
import { toast } from '../ui/shell.js';
import { EQUIPMENT } from '../lib/model.js';
import { moveItem, slugify, parseLoad, parseReps, formatLoad } from '../lib/workout.js';
import { uid } from '../db.js';
import {
  getTemplates, getTemplate, putTemplate, deleteTemplate,
  getExercises, exerciseMap, putExercise, loadSettings,
} from '../repo.js';
import { incrementFor } from '../lib/model.js';

const chevron = () => h('span', { class: 'row__chev', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' });

// ---- Picker: choose a template to start ---------------------------------

export function templatePickerView(stack, { onStart, onClose, plannedTemplateId = null }) {
  const list = h('div', { class: 'list' });
  const load = async () => {
    const [all, exMap] = await Promise.all([getTemplates(), exerciseMap()]);
    const templates = [...all.filter((x) => x.id === plannedTemplateId), ...all.filter((x) => x.id !== plannedTemplateId)];
    list.replaceChildren(...templates.map((tpl) => h('div', { class: 'tpl-row' },
      h('button', { class: 'tpl-row__main', type: 'button', onclick: () => onStart(tpl) },
        h('span', { class: 'tpl-row__name' }, tpl.name, tpl.id === plannedTemplateId && h('span', { class: 'badge' }, t('plan.today'))),
        h('span', { class: 'tpl-row__sub' }, tpl.exercises.map((e) => exMap.get(e.exerciseId)?.name || '?').join(' · ') || t('tpl.empty'))),
      h('button', { class: 'tpl-row__edit', type: 'button', 'aria-label': `${t('tpl.edit')} ${tpl.name}`, onclick: () => stack.push(templateEditorView(stack, tpl.id)) }, t('tpl.edit')))));
    if (!templates.length) list.replaceChildren(h('p', { class: 'empty' }, t('tpl.none')));
  };
  return {
    title: t('tpl.chooseTitle'),
    leading: { label: t('common.close'), onClick: onClose },
    onShow: load,
    render: () => h('div', { class: 'sheet__body' },
      h('p', { class: 'hint' }, t('tpl.tapToStart')),
      list,
      h('button', { class: 'btn btn--secondary btn--block', type: 'button', onclick: () => stack.push(templateEditorView(stack, null)) }, `+ ${t('tpl.new')}`)),
  };
}

// ---- Template editor ----------------------------------------------------

export function templateEditorView(stack, templateId) {
  let draft = null;                 // { id, name, exercises: [{exerciseId, sets, reps, load}] }
  let exMap = new Map();
  let isNew = !templateId;
  const root = h('div', { class: 'sheet__body' });

  async function init() {
    exMap = await exerciseMap();
    if (!draft) {
      draft = templateId ? structuredClone(await getTemplate(templateId))
        : { id: uid(), name: '', order: Date.now(), exercises: [] };
    }
    paint();
  }

  function paint() {
    const nameIn = h('input', { class: 'input', id: 'tpl-name', value: draft.name, placeholder: t('tpl.namePlaceholder'), autocomplete: 'off', enterkeyhint: 'done' });
    nameIn.addEventListener('input', () => { draft.name = nameIn.value; });

    const rows = draft.exercises.map((te, i) => {
      const ex = exMap.get(te.exerciseId);
      const num = (key, mode, label, parse, fmt) => {
        const input = h('input', {
          class: 'input input--cell num', inputmode: mode, value: fmt(te[key]), 'aria-label': `${ex?.name} ${label}`,
          autocomplete: 'off', enterkeyhint: 'done',
        });
        input.addEventListener('change', () => {
          const v = parse(input.value);
          if (v == null || (key === 'sets' && v < 1)) { input.value = fmt(te[key]); return; }
          te[key] = v; input.value = fmt(v);
        });
        return h('label', { class: 'cell' }, input, h('span', { class: 'cell__label' }, label));
      };
      return h('li', { class: 'tpl-ex' },
        h('div', { class: 'tpl-ex__top' },
          h('button', { class: 'tpl-ex__name', type: 'button', onclick: () => stack.push(exerciseFormView(stack, { exercise: ex, onSaved: () => {} })) }, ex?.name || '?'),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `${t('tpl.moveUp')} ${ex?.name}`, disabled: i === 0 || null, onclick: () => { draft.exercises = moveItem(draft.exercises, i, i - 1); paint(); } }, '↑'),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `${t('tpl.moveDown')} ${ex?.name}`, disabled: i === draft.exercises.length - 1 || null, onclick: () => { draft.exercises = moveItem(draft.exercises, i, i + 1); paint(); } }, '↓'),
          h('button', { class: 'icon-btn icon-btn--danger', type: 'button', 'aria-label': `${t('tpl.remove')} ${ex?.name}`, onclick: () => { draft.exercises.splice(i, 1); paint(); } }, '×')),
        h('div', { class: 'tpl-ex__cells' },
          num('sets', 'numeric', t('tpl.sets'), parseReps, String),
          h('span', { class: 'tpl-ex__x', 'aria-hidden': 'true' }, '×'),
          num('reps', 'numeric', t('tpl.reps'), parseReps, String),
          num('load', 'decimal', 'kg', parseLoad, formatLoad)));
    });

    root.replaceChildren(...[
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'tpl-name' }, t('tpl.name')), nameIn),
      h('h3', { class: 'section-label', style: { padding: '8px 4px 0' } }, t('tpl.exercises')),
      rows.length ? h('ol', { class: 'tpl-ex-list' }, rows) : h('p', { class: 'empty', style: { padding: '16px' } }, t('tpl.noExercises')),
      h('button', {
        class: 'btn btn--secondary btn--block', type: 'button',
        onclick: () => stack.push(exercisePickerView(stack, {
          title: t('tpl.addExercise'),
          onPick: (ex) => { draft.exercises.push({ exerciseId: ex.id, sets: 3, reps: 10, load: 0 }); stack.pop(); },
        })),
      }, `+ ${t('tpl.addExercise')}`),
      !isNew && h('button', {
        class: 'btn btn--danger btn--block', type: 'button',
        onclick: async () => {
          if (!confirm(t('tpl.deleteConfirm').replace('{name}', draft.name))) return;
          await deleteTemplate(draft.id); toast(t('tpl.deleted')); stack.pop();
        },
      }, t('tpl.delete')),
    ].filter(Boolean));
  }

  async function save() {
    draft.name = draft.name.trim();
    if (!draft.name) { toast(t('tpl.nameRequired')); return; }
    if (!draft.exercises.length) { toast(t('tpl.exercisesRequired')); return; }
    await putTemplate(draft);
    isNew = false;
    toast(t('tpl.saved'));
    stack.pop();
  }

  return {
    title: templateId ? t('tpl.editTitle') : t('tpl.newTitle'),
    trailing: { label: t('common.save'), strong: true, onClick: save },
    onShow: init,
    render: () => root,
  };
}

// ---- Exercise picker ----------------------------------------------------

export function exercisePickerView(stack, { title, onPick, excludeIds = [], extraTop = null }) {
  const list = h('ul', { class: 'list' });
  const search = h('input', { class: 'input', type: 'search', placeholder: t('ex.search'), 'aria-label': t('ex.search'), autocomplete: 'off', enterkeyhint: 'search' });
  let all = [];
  const paint = () => {
    const q = search.value.trim().toLowerCase();
    const items = all.filter((e) => !excludeIds.includes(e.id) && (!q || e.name.toLowerCase().includes(q)));
    list.replaceChildren(...items.map((e) => h('li', {},
      h('button', { class: 'list__row list__row--btn', type: 'button', onclick: () => onPick(e) },
        h('span', {}, h('span', { class: 'list__label' }, e.name), h('span', { class: 'list__hint' }, t(`equipment.${e.equipment}`))),
        chevron()))));
    if (!items.length) list.replaceChildren(h('li', { class: 'empty' }, t('ex.noMatch')));
  };
  search.addEventListener('input', paint);
  return {
    title,
    onShow: async () => { all = await getExercises(); paint(); },
    render: () => h('div', { class: 'sheet__body' },
      extraTop,
      search,
      list,
      h('button', {
        class: 'btn btn--secondary btn--block', type: 'button',
        onclick: () => stack.push(exerciseFormView(stack, {
          prefillName: search.value.trim(),
          onSaved: (ex) => { stack.pop(); onPick(ex); },
        })),
      }, `+ ${t('ex.new')}`)),
  };
}

// ---- Exercise form (create / edit) -------------------------------------

export function exerciseFormView(stack, { exercise = null, prefillName = '', onSaved }) {
  const draft = exercise ? { ...exercise } : { id: null, name: prefillName, equipment: 'dumbbell', increment: null };
  const root = h('div', { class: 'sheet__body' });
  let settings = null;

  function paint() {
    const nameIn = h('input', { class: 'input', id: 'ex-name', value: draft.name, placeholder: t('ex.namePlaceholder'), autocomplete: 'off' });
    nameIn.addEventListener('input', () => { draft.name = nameIn.value; });

    const equip = h('div', { class: 'choice-grid', role: 'radiogroup', 'aria-label': t('ex.equipment') },
      EQUIPMENT.map((k) => h('button', {
        type: 'button', role: 'radio', class: 'choice', 'aria-checked': String(draft.equipment === k),
        onclick: () => { draft.equipment = k; paint(); },
      }, t(`equipment.${k}`))));

    const defInc = settings ? incrementFor({ equipment: draft.equipment }, settings) : '';
    const incIn = h('input', {
      class: 'input num', id: 'ex-inc', inputmode: 'decimal', autocomplete: 'off',
      value: draft.increment > 0 ? formatLoad(draft.increment) : '',
      placeholder: `${t('ex.incDefault')} (${formatLoad(defInc)} kg)`,
    });
    incIn.addEventListener('change', () => {
      const v = parseLoad(incIn.value);
      draft.increment = v > 0 ? v : null;
      incIn.value = draft.increment ? formatLoad(draft.increment) : '';
    });

    root.replaceChildren(
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'ex-name' }, t('ex.name')), nameIn),
      h('div', { class: 'field' }, h('span', { class: 'field__label' }, t('ex.equipment')), equip),
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'ex-inc' }, t('ex.increment')), incIn,
        h('p', { class: 'hint' }, t('ex.incHint'))),
    );
  }

  async function save() {
    const name = draft.name.trim();
    if (!name) { toast(t('ex.nameRequired')); return; }
    const existing = await getExercises();
    if (existing.some((e) => e.name.toLowerCase() === name.toLowerCase() && e.id !== draft.id)) { toast(t('ex.duplicate')); return; }
    let id = draft.id;
    if (!id) {
      id = slugify(name);
      if (existing.some((e) => e.id === id)) id = `${id}-${uid().slice(0, 6)}`;
    }
    const rec = { id, name, equipment: draft.equipment, increment: draft.increment };
    await putExercise(rec);
    toast(t('ex.saved'));
    if (onSaved) onSaved(rec); else stack.pop();
    if (exercise) stack.pop();
  }

  return {
    title: exercise ? t('ex.editTitle') : t('ex.newTitle'),
    trailing: { label: t('common.save'), strong: true, onClick: save },
    onShow: async () => { settings = await loadSettings(); paint(); },
    render: () => root,
  };
}
