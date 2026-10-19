// Keeps the frame rate up on slower phones: if it stays under TARGET_FPS, render at a lower pixel
// ratio (fewer pixels to shade). It only ever steps down, so it can't flip back and forth.

import { MAX_FPS } from '../core/loop.js';

const TARGET_FPS = MAX_FPS * 0.9; // the frame cap (core/loop.js), give or take a missed frame
const WINDOW = 2;       // seconds per measurement
const WARMUP = 4;       // seconds to ignore after loading (shaders compiling, textures uploading)
const SLOW_WINDOWS = 2; // slow windows in a row before stepping down
const STEPS = [2, 1.5, 1.25];

export function createQuality(renderer, onChange) {
  let steps, level, frames = 0, time = 0, warm = 0, slow = 0, hitch = false, fps = 0;
  /** At most `max` pixels per screen dot (the Graphics slider, render/lighting.js GRAPHICS); starts over from the top. */
  function setMax(max) {
    const device = Math.min(globalThis.devicePixelRatio ?? 1, STEPS[0], max);
    steps = [device, ...STEPS.filter((r) => r < device)];
    level = 0;
    warm = slow = 0;
  }
  setMax(STEPS[0]);

  return {
    setMax,
    get pixelRatio() { return steps[level]; },
    get fps() { return fps; },

    frame(dt) {
      if (warm < WARMUP) { warm += dt; return; }
      frames++;
      time += dt;
      if (dt >= 0.25) hitch = true; // the tab was hidden or the phone stalled: don't count it
      if (time < WINDOW) return;
      fps = frames / time;
      if (!hitch) slow = fps < TARGET_FPS ? slow + 1 : 0;
      frames = time = 0;
      hitch = false;
      if (slow >= SLOW_WINDOWS && level < steps.length - 1) {
        level++;
        slow = 0;
        onChange(steps[level]);
      }
    },
  };
}
