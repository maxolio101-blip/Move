// App chrome: tabs, full-screen sheet, toast, update banner.
import { t } from '../strings.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---- Tabs ---------------------------------------------------------------

const TABS = ['today', 'history', 'progress', 'settings'];
let currentTab = null;
const tabListeners = new Set();

export function onTabChange(fn) { tabListeners.add(fn); return () => tabListeners.delete(fn); }

export function selectTab(name, { focus = false } = {}) {
  if (!TABS.includes(name)) name = 'today';
  if (name === currentTab) {
    // Tapping the active tab scrolls it back to top, as on iOS.
    const view = $(`#view-${name}`);
    view?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return;
  }
  currentTab = name;
  for (const tab of TABS) {
    const on = tab === name;
    const btn = $(`#tab-${tab}`);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    $(`#view-${tab}`).hidden = !on;
  }
  if (focus) $(`#tab-${name}`).focus();
  history.replaceState(null, '', `#${name}`);
  tabListeners.forEach((fn) => fn(name));
}

export function initTabs() {
  const bar = $('.tabbar');
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (btn) selectTab(btn.dataset.tab);
  });
  // Arrow-key navigation (WAI-ARIA tabs pattern)
  bar.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = TABS.indexOf(currentTab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    selectTab(next, { focus: true });
  });
  selectTab(location.hash.slice(1) || 'today');
}

// ---- Sheet --------------------------------------------------------------

let lastFocus = null;
let onSheetClose = null;

/**
 * Open the full-screen sheet with `content` (Node).
 * `dismissible: false` disables scrim-tap closing (used for the active workout).
 */
export function openSheet(content, { label = '', dismissible = true, onClose = null } = {}) {
  const layer = $('#sheet-layer');
  const sheet = $('#sheet');
  sheet.replaceChildren(content);
  sheet.setAttribute('aria-label', label);
  layer.dataset.dismissible = String(dismissible);
  onSheetClose = onClose;
  lastFocus = document.activeElement;
  layer.hidden = false;
  $('.views').setAttribute('aria-hidden', 'true');
  $('.tabbar').setAttribute('aria-hidden', 'true');
  // Next frame so the transition runs from the off-screen state.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    layer.classList.add('is-open');
    sheet.focus({ preventScroll: true });
  }));
}

export function closeSheet() {
  const layer = $('#sheet-layer');
  if (layer.hidden) return;
  layer.classList.remove('is-open');
  $('.views').removeAttribute('aria-hidden');
  $('.tabbar').removeAttribute('aria-hidden');
  const done = () => {
    layer.hidden = true;
    $('#sheet').replaceChildren();
    lastFocus?.focus?.({ preventScroll: true });
    const cb = onSheetClose; onSheetClose = null; cb?.();
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) done();
  else $('#sheet').addEventListener('transitionend', done, { once: true });
}

export function initSheet() {
  const layer = $('#sheet-layer');
  layer.addEventListener('click', (e) => {
    if (e.target.closest('[data-sheet-close]') && (layer.dataset.dismissible !== 'false' || e.target.closest('.sheet'))) closeSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !layer.hidden && layer.dataset.dismissible !== 'false') closeSheet();
  });
}

// ---- Toast --------------------------------------------------------------

let toastTimer = null;
export function toast(message, ms = 2200) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  // restart the entry animation
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

// ---- Update banner ------------------------------------------------------

export function showUpdateBanner(apply) {
  const banner = $('#banner-update');
  const btn = $('#banner-update-btn');
  banner.hidden = false;
  btn.onclick = () => { btn.disabled = true; btn.textContent = '…'; apply(); };
}

export { $, $$, t };
