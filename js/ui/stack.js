// Push/pop navigation inside a sheet (iOS-style), transform-only transitions.
//
// A view is { title, render(): Node, leading?, trailing?, onShow? }
//   leading / trailing: { label, onClick, strong?, danger?, ariaLabel? }
//   leading defaults to a Back button on pushed pages.
import { h } from './dom.js';
import { t } from '../strings.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createStack({ onEmpty } = {}) {
  const el = h('div', { class: 'stack' });
  const pages = [];

  function pageFor(view, isRoot) {
    const btn = (cfg, side) => {
      if (!cfg) return h('span', { class: `stack__side stack__side--${side}` });
      return h('button', {
        type: 'button',
        class: `link-btn stack__side stack__side--${side}${cfg.strong ? ' link-btn--strong' : ''}${cfg.danger ? ' link-btn--danger' : ''}`,
        'aria-label': cfg.ariaLabel || null,
        onclick: cfg.onClick,
      }, cfg.label);
    };
    const leading = view.leading !== undefined ? view.leading
      : (!isRoot ? { label: `‹ ${t('common.back')}`, onClick: () => pop() } : null);

    const body = h('div', { class: 'stack__body' });
    const page = h('section', { class: 'stack__page', 'aria-label': view.title || '' },
      h('div', { class: 'sheet__grab', 'aria-hidden': 'true' }),
      h('header', { class: 'sheet__head' },
        btn(leading, 'lead'),
        h('h2', { class: 'sheet__title' }, view.title || ''),
        btn(view.trailing, 'trail')),
      body);
    page._view = view;
    page._body = body;
    body.replaceChildren(view.render());
    return page;
  }

  function animateIn(page, from) {
    if (reduced()) return;
    page.animate([{ transform: from }, { transform: 'translate3d(0,0,0)' }], { duration: 340, easing: 'cubic-bezier(0.32,0.72,0,1)' });
  }

  function push(view) {
    const prev = pages[pages.length - 1];
    const page = pageFor(view, pages.length === 0);
    pages.push(page);
    el.append(page);
    if (prev) {
      animateIn(page, 'translate3d(100%,0,0)');
      if (!reduced()) prev.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate3d(-25%,0,0)', opacity: 0 }], { duration: 340, easing: 'cubic-bezier(0.32,0.72,0,1)', fill: 'forwards' })
        .finished.then(() => { prev.hidden = true; }).catch(() => {});
      else prev.hidden = true;
    }
    view.onShow?.();
    return page;
  }

  function pop() {
    if (pages.length <= 1) { onEmpty?.(); return; }
    const page = pages.pop();
    const prev = pages[pages.length - 1];
    prev.hidden = false;
    prev.getAnimations().forEach((a) => a.cancel());
    prev._view.onShow?.();
    if (reduced()) { page.remove(); return; }
    animateIn(prev, 'translate3d(-25%,0,0)');
    page.animate([{ transform: 'none' }, { transform: 'translate3d(100%,0,0)' }], { duration: 300, easing: 'cubic-bezier(0.32,0.72,0,1)', fill: 'forwards' })
      .finished.then(() => page.remove()).catch(() => page.remove());
  }

  /** Re-render the top page body (and its header) after data changed. */
  function refresh() {
    const page = pages[pages.length - 1];
    if (!page) return;
    const scroll = page._body.scrollTop;
    const fresh = pageFor(page._view, pages.length === 1);
    page.replaceWith(fresh);
    pages[pages.length - 1] = fresh;
    fresh._body.scrollTop = scroll;
  }

  /** Replace the whole stack with a single root view. */
  function reset(view) {
    pages.splice(0).forEach((p) => p.remove());
    push(view);
  }

  return { el, push, pop, refresh, reset, depth: () => pages.length };
}
