// Little birds for the Jungle pack (GDD #161): a parrot and a toucan, and the Beach pack's seagull (GDD #166), built round their feet at (0, 0, 0), beak to +z.
// Used by the outside scene (render/environment.js), the parrot corner piece (models/furniture.js) and the Treehouse look
// (models/scenes.js). `s` = size (1 = about a third as tall as a shopper).

import * as THREE from 'three';
import { mesh, ball, cyl } from './prims.js';

const EYE = '#2a1f2a', WHITE = '#ffffff';

/** Parrot colours: body, wing, tail, beak. */
export const PARROTS = {
  red: ['#e8394f', '#3d7ff0', '#ffcf3a', '#f4ead8'],
  green: ['#4fc06a', '#2f8a50', '#e8394f', '#ffcf3a'],
  blue: ['#3d9cf0', '#ffcf3a', '#2f6ad0', '#3a3040'],
};

/**
 * A parrot sitting up. With `wings` given (a group per side, pivoting at the shoulder), its wings go there so they can
 * flap; otherwise they lie folded against the body in `g`.
 */
export function parrot(g, colors, s = 1, wings = null) {
  const [body, wing, tail, beak] = colors;
  const b = ball(g, 0.11 * s, body, 0, 0.17 * s, 0, 1);
  b.scale.set(0.85, 1.25, 0.9);
  ball(g, 0.085 * s, body, 0, 0.33 * s, 0.03 * s, 0); // the head
  const bk = mesh(g, new THREE.ConeGeometry(0.035 * s, 0.08 * s, 6), beak, 0, 0.32 * s, 0.11 * s);
  bk.rotation.x = Math.PI / 2 + 0.5;
  bk.castShadow = false;
  for (const side of [-1, 1]) {
    ball(g, 0.022 * s, WHITE, side * 0.05 * s, 0.35 * s, 0.07 * s, 0).castShadow = false;
    ball(g, 0.012 * s, EYE, side * 0.055 * s, 0.355 * s, 0.085 * s, 0).castShadow = false;
  }
  const t = mesh(g, new THREE.ConeGeometry(0.05 * s, 0.24 * s, 5), tail, 0, 0.02 * s, -0.09 * s);
  t.rotation.x = -2.6;
  t.castShadow = false;
  for (const side of [-1, 1]) {
    const host = wings ? wings[side < 0 ? 0 : 1] : g;
    const w = ball(host, 0.075 * s, wing, wings ? side * 0.07 * s : side * 0.085 * s, wings ? 0 : 0.17 * s, wings ? 0 : -0.01 * s, 0);
    w.scale.set(wings ? 1.2 : 0.35, wings ? 0.25 : 1.2, wings ? 0.8 : 0.9);
    w.castShadow = false;
    if (wings) { // pivot at the shoulder
      wings[side < 0 ? 0 : 1].position.set(side * 0.06 * s, 0.2 * s, 0);
    }
  }
  for (const side of [-1, 1]) cyl(g, 0.008 * s, 0.008 * s, 0.05 * s, 4, '#8a6a5a', side * 0.035 * s, 0.025 * s, 0.01 * s).castShadow = false;
}

/** A toucan: black with a white bib and a big orange beak. */
export function toucan(g, s = 1) {
  const b = ball(g, 0.12 * s, '#2a2530', 0, 0.18 * s, 0, 1);
  b.scale.set(0.85, 1.3, 0.9);
  const bib = ball(g, 0.07 * s, '#fff6e0', 0, 0.27 * s, 0.07 * s, 0);
  bib.scale.set(1, 1, 0.5);
  bib.castShadow = false;
  ball(g, 0.09 * s, '#2a2530', 0, 0.35 * s, 0.02 * s, 0);
  const beak = ball(g, 0.06 * s, '#ff9a2b', 0, 0.34 * s, 0.15 * s, 0);
  beak.scale.set(0.7, 0.75, 1.9);
  beak.castShadow = false;
  ball(g, 0.02 * s, '#e8394f', 0, 0.35 * s, 0.25 * s, 0).castShadow = false; // the beak's red tip
  for (const side of [-1, 1]) {
    ball(g, 0.03 * s, '#9ee6ff', side * 0.05 * s, 0.37 * s, 0.06 * s, 0).castShadow = false; // blue round the eye
    ball(g, 0.013 * s, EYE, side * 0.06 * s, 0.375 * s, 0.075 * s, 0).castShadow = false;
  }
  const t = mesh(g, new THREE.BoxGeometry(0.07 * s, 0.18 * s, 0.03 * s), '#2a2530', 0, 0.05 * s, -0.1 * s);
  t.rotation.x = -0.6;
  t.castShadow = false;
}

/**
 * A seagull: white with grey wings, a yellow beak and orange feet. Like the parrot, `wings` (a group per side) takes
 * the wings so they can flap; otherwise they lie folded.
 */
export function seagull(g, s = 1, wings = null) {
  const b = ball(g, 0.11 * s, WHITE, 0, 0.16 * s, 0, 1);
  b.scale.set(0.8, 0.85, 1.35);
  ball(g, 0.075 * s, WHITE, 0, 0.27 * s, 0.1 * s, 0); // the head
  const bk = mesh(g, new THREE.ConeGeometry(0.025 * s, 0.09 * s, 5), '#ffcf3a', 0, 0.26 * s, 0.2 * s);
  bk.rotation.x = Math.PI / 2;
  bk.castShadow = false;
  ball(g, 0.012 * s, '#e8394f', 0, 0.245 * s, 0.22 * s, 0).castShadow = false; // the red spot on the beak
  for (const side of [-1, 1]) ball(g, 0.014 * s, EYE, side * 0.045 * s, 0.29 * s, 0.14 * s, 0).castShadow = false;
  const t = mesh(g, new THREE.ConeGeometry(0.05 * s, 0.12 * s, 4), '#3a3a48', 0, 0.17 * s, -0.17 * s); // black tail tip
  t.rotation.x = -Math.PI / 2;
  t.castShadow = false;
  for (const side of [-1, 1]) {
    const host = wings ? wings[side < 0 ? 0 : 1] : g;
    const w = ball(host, 0.1 * s, '#a9b4c2', wings ? side * 0.12 * s : side * 0.08 * s, wings ? 0 : 0.18 * s, wings ? 0 : -0.02 * s, 0);
    w.scale.set(wings ? 1.6 : 0.3, wings ? 0.2 : 0.7, wings ? 0.6 : 1.3);
    w.castShadow = false;
    if (wings) {
      const tip = ball(host, 0.04 * s, '#3a3a48', side * 0.27 * s, 0, -0.01 * s, 0); // black wing tips
      tip.scale.set(1.2, 0.4, 0.8);
      tip.castShadow = false;
      wings[side < 0 ? 0 : 1].position.set(side * 0.06 * s, 0.2 * s, 0);
    }
  }
  for (const side of [-1, 1]) cyl(g, 0.008 * s, 0.008 * s, 0.06 * s, 4, '#ff9a3c', side * 0.035 * s, 0.03 * s, 0).castShadow = false;
}
