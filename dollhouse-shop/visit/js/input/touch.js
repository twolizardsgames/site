// Pointer events -> tap / drag / pinch / wheel gestures. Works for touch and mouse.

const TAP_MAX_MOVE = 8;   // px
const TAP_MAX_MS = 400;
const HOLD_MS = 350;      // a still press this long is a hold (moving rooms, GDD #157)

/**
 * `onHold(x, y)` (optional) is asked after a still one-finger press; if it returns true the press is a
 * hold: further moves go to `onHoldMove(x, y)` instead of onDrag, and lifting the finger (or a second
 * finger) calls `onHoldEnd(x, y, cancelled)`.
 */
export function attachGestures(el, { onTap, onDrag, onPinch, onWheel, onHold, onHoldMove, onHoldEnd }) {
  const pointers = new Map();
  let moved = 0, downAt = 0, pinchDist = 0;
  let holdTimer = 0, holding = false, last = { x: 0, y: 0 };
  const clearHold = () => { clearTimeout(holdTimer); holdTimer = 0; };
  const endHold = (cancelled) => {
    clearHold();
    if (!holding) return;
    holding = false;
    onHoldEnd?.(last.x, last.y, cancelled);
  };

  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  el.addEventListener('pointerdown', (e) => {
    try { el.setPointerCapture(e.pointerId); } catch { /* a pointer that's already gone */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    last = { x: e.clientX, y: e.clientY };
    if (pointers.size === 1) {
      moved = 0;
      downAt = performance.now();
      if (onHold) holdTimer = setTimeout(() => { holdTimer = 0; if (pointers.size === 1 && moved < TAP_MAX_MOVE) holding = !!onHold(last.x, last.y); }, HOLD_MS);
    }
    if (pointers.size === 2) { endHold(true); pinchDist = distance(); }
  });

  el.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    last = { x: e.clientX, y: e.clientY };
    if (holding) return void onHoldMove?.(e.clientX, e.clientY);
    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved >= TAP_MAX_MOVE) clearHold();
      onDrag?.(dx, dy);
    } else if (pointers.size === 2) {
      moved = Infinity;
      const d = distance();
      if (pinchDist > 0) onPinch?.(d / pinchDist);
      pinchDist = d;
    }
  });

  el.addEventListener('pointerup', (e) => {
    if (holding) {
      pointers.delete(e.pointerId);
      return endHold(false);
    }
    clearHold();
    if (pointers.size === 1 && moved < TAP_MAX_MOVE && performance.now() - downAt < TAP_MAX_MS) {
      onTap?.(e.clientX, e.clientY);
    }
    pointers.delete(e.pointerId);
  });
  el.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); endHold(true); });

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    onWheel?.(e.deltaY);
  }, { passive: false });
}
