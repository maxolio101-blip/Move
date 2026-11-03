import { h, CHECK_SVG } from './dom.js';
import { t } from '../strings.js';
import { toast } from './shell.js';
import { HABITS } from '../lib/model.js';
import { setHabit } from '../repo.js';

/** Reusable 2×3 grid of habit toggles for any date. */
export function habitChips(date, habits, onSaved) {
  return h('div', { class: 'habits' }, HABITS.map((key) => h('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(!!habits[key]),
    onclick: async (e) => {
      const btn = e.currentTarget;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(next));          // optimistic: instant feedback
      try {
        onSaved?.(await setHabit(date, key, next));
      } catch {
        btn.setAttribute('aria-pressed', String(!next));
        toast('Could not save. Try again.');
      }
    },
  }, h('span', { class: 'chip__dot', html: CHECK_SVG }), t(`habits.${key}`))));
}

