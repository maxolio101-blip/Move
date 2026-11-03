// Rest-over beep (Web Audio) and screen wake lock during a workout.
//
// iOS rules: audio can only start after a user tap, so `unlockAudio()` is
// called on every ✓ tap. Web Audio mixes with music already playing and
// follows the ring/silent switch. A web app is suspended when the screen
// locks, so the wake lock keeps the screen on while a workout is open.

let ctx = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    // A silent tick inside the gesture fully unlocks output on iOS.
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch { /* no audio: the visual alert remains */ }
}

/** Three short high beeps (~0.9 s). */
export function beep() {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    [0, 0.3, 0.6].forEach((dt, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1320 : 880;
      gain.gain.setValueAtTime(0.0001, t0 + dt);
      gain.gain.exponentialRampToValueAtTime(0.5, t0 + dt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + dt);
      osc.stop(t0 + dt + 0.22);
    });
  } catch { /* ignore */ }
}

// ---- Wake lock ------------------------------------------------------------

let lock = null;
let wanted = false;

export async function keepAwake(on) {
  wanted = on;
  try {
    if (on && !lock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch { lock = null; }
}

// The lock is dropped by the system when the app is hidden: take it back.
document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible') keepAwake(true);
});
