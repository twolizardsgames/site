// Textures drawn on a 2D canvas (wallpaper and floor patterns, the roof sign, count badges, snowflakes) that survive the
// phone's graphics being reset. Phones keep canvases in graphics memory; when the browser resets it (low memory, or the
// tab coming back from the background), an accelerated canvas comes back empty, and the WebGL context is restored by
// re-uploading every texture from its image: an empty canvas uploads as solid black (docs/ISSUES.md, 2026-10-12).
// So these textures upload a copy of the pixels in ordinary memory (ImageData), which nothing can wipe.

import * as THREE from 'three';

/** A 2D context for drawing a texture (read back once, so the browser keeps it out of graphics memory). */
export const drawContext = (canvas) => canvas.getContext('2d', { willReadFrequently: true });

const pixels = (canvas) => drawContext(canvas).getImageData(0, 0, canvas.width, canvas.height);

/** A texture of what's on `canvas` now; call texture.redraw() after drawing on the canvas again. */
export function canvasTexture(canvas) {
  const t = new THREE.Texture(pixels(canvas));
  t.needsUpdate = true;
  t.redraw = () => {
    t.image = pixels(canvas);
    t.needsUpdate = true;
  };
  return t;
}
