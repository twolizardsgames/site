import * as THREE from 'three';

/**
 * iPhones and iPads (the store app and Safari alike; an iPad says it's a Mac but has touch). Their WebGL draws
 * everything as if in shadow with three.js's PCF shadows (hardware depth compare), so the rooms looked dark and unlit
 * (user, 2026-10-12, iOS simulator); plain shadows work there, with harder edges.
 */
const APPLE_MOBILE = typeof navigator !== 'undefined'
  && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = APPLE_MOBILE ? THREE.BasicShadowMap : THREE.PCFShadowMap;
  // The browser can drop the WebGL context (low memory, back from the background); three.js restores it. Counted for
  // the ?debug panel, so a report of a freeze or odd colours can say whether it happened (docs/ISSUES.md).
  renderer.contextLosses = 0;
  canvas.addEventListener('webglcontextlost', () => { renderer.contextLosses++; console.warn('WebGL context lost'); });
  canvas.addEventListener('webglcontextrestored', () => console.warn('WebGL context restored'));
  return renderer;
}
