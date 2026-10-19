// Fixed-step simulation + per-frame rendering.
// The sim ticks at a steady rate for deterministic logic; rendering runs every animation frame
// and gets `alpha` (0..1, how far we are into the next tick) to interpolate movement.
// requestAnimationFrame already stops while the tab is hidden; the dt cap stops a huge
// catch-up burst when it comes back (offline time is handled separately by the sim).

/** Frames a second at most (user, 2026-10-17): the phone does half the work on a 60 Hz screen and runs cooler. */
export const MAX_FPS = 30;
// A frame may come this early (ms): screen refreshes don't land exactly on the 33.3 ms beat.
const SLACK = 4;

/**
 * Says which animation frames to draw so there are at most `maxFps` a second: every 2nd on a 60 Hz screen, every 4th
 * at 120 Hz. A phone that can't keep up draws every frame it gets.
 */
export function createPacer(maxFps = MAX_FPS) {
  const interval = 1000 / maxFps;
  let next = -Infinity;
  return (now) => {
    if (now < next - SLACK) return false;
    next = (now - next > interval ? now : next) + interval; // keep the beat, unless far behind
    return true;
  };
}

export function startLoop({ tickRate = 10, tick, frame }) {
  const step = 1 / tickRate;
  const due = createPacer();
  let acc = 0;
  let last = performance.now();
  let elapsed = 0;

  function onFrame(now) {
    requestAnimationFrame(onFrame);
    if (!due(now)) return;
    // The first frame's timestamp can be earlier than `last` (it's when that frame began, and a slow
    // boot sets `last` after it), so dt is never below 0: a negative one ran pop-ins backwards at load.
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.25));
    last = Math.max(last, now);
    elapsed += dt;
    acc += dt;
    while (acc >= step) {
      tick(step);
      acc -= step;
    }
    frame(dt, elapsed, acc / step);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) last = performance.now();
  });
  requestAnimationFrame(onFrame);
}
