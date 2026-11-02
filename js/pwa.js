// Standalone detection + service worker registration with a discreet
// "New version available — Reload" banner.

export function isStandalone() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
}

/** `?preview` lets the shell be reviewed in a desktop browser. Data stays in that browser. */
export function isPreview() {
  return new URLSearchParams(location.search).has('preview');
}

export function registerServiceWorker({ onUpdateReady }) {
  if (!('serviceWorker' in navigator)) return;
  // Already installed and offline: don't touch the network at all.
  if (!navigator.onLine && navigator.serviceWorker.controller) {
    window.addEventListener('online', () => registerServiceWorker({ onUpdateReady }), { once: true });
    return;
  }

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const offer = (worker) => onUpdateReady(() => worker.postMessage({ type: 'SKIP_WAITING' }));

    // An update finished installing while the app was closed.
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);

    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        // `controller` is null on the very first install: nothing to announce then.
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
      });
    });

    // iOS keeps PWAs alive in the background: check again when we come back.
    // Skipped offline: a network attempt in airplane mode makes iOS show its alert.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
    });
  }).catch((err) => console.warn('[sw] registration failed', err));
}
