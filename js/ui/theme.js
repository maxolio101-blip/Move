// Theme: 'system' | 'light' | 'dark'. Also keeps the iOS status bar /
// theme-color in sync with the resolved background.

const BG = { dark: '#0B0B0F', light: '#F2F2F5' };
const mql = matchMedia('(prefers-color-scheme: light)');
let mode = 'system';

export function resolvedTheme() {
  if (mode === 'light' || mode === 'dark') return mode;
  return mql.matches ? 'light' : 'dark';
}

export function applyTheme(next = mode) {
  mode = next;
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  document.getElementById('meta-theme')?.setAttribute('content', BG[resolvedTheme()]);
}

mql.addEventListener?.('change', () => { if (mode === 'system') applyTheme('system'); });
