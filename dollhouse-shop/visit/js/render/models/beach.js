// Beach things for the Beach pack (GDD #136, #166): a striped deck chair, a beach umbrella, a sandcastle, a surfboard,
// a beach ball, a starfish and shells, each built round its foot at (0, 0, 0) with its front to +z. Used by the outside
// scene (render/environment.js), the Beach Hut look (models/scenes.js) and the surfboard corner piece (models/furniture.js).
// `s` = size (1 = room size, a chair comes up to a shopper's waist).

import * as THREE from 'three';
import { box, cyl, ball, mesh } from './prims.js';

const WOOD = '#c99a62', WOOD_DARK = '#a07448', SAND_CASTLE = '#e9c98a', SAND_DARK = '#d4ae6a';
export const SAND = '#f3dfae';
export const BEACH_STRIPES = [['#ff7a9a', '#ffffff'], ['#3fb6e0', '#ffffff'], ['#ffd23f', '#ff9a3c'], ['#7ee0b0', '#ffffff']];

const put = (parent, g, x, z, rot, s) => {
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  g.scale.setScalar(s);
  parent.add(g);
  return g;
};

/** A wooden deck chair with a striped cloth seat sloping back. */
export function deckChair(parent, x, z, rot = 0, s = 1, [a, b] = BEACH_STRIPES[0]) {
  const g = new THREE.Group();
  const tilt = -0.75; // the top leans back toward -z
  const cloth = new THREE.Group();
  for (let i = 0; i < 5; i++) box(cloth, 0.09, 0.8, 0.02, i % 2 ? b : a, -0.18 + i * 0.09, 0, 0);
  cloth.position.set(0, 0.48, -0.06);
  cloth.rotation.x = tilt;
  g.add(cloth);
  for (const side of [-1, 1]) {
    const rail = box(g, 0.035, 0.86, 0.035, WOOD, side * 0.25, 0.48, -0.06);
    rail.rotation.x = tilt;
    cyl(g, 0.02, 0.02, 0.24, 5, WOOD_DARK, side * 0.25, 0.12, 0.2); // front legs
    cyl(g, 0.02, 0.02, 0.62, 5, WOOD_DARK, side * 0.25, 0.31, -0.26); // back legs
    box(g, 0.05, 0.03, 0.42, WOOD, side * 0.27, 0.4, -0.02); // arm rests
  }
  return put(parent, g, x, z, rot, s);
}

/** A beach umbrella: a pole and a canopy of eight coloured panels, tipped by `tilt`. */
export function umbrella(parent, x, z, s = 1, [a, b] = BEACH_STRIPES[0], tilt = 0.12) {
  const g = new THREE.Group();
  const top = new THREE.Group();
  cyl(top, 0.02, 0.02, 1.7, 5, '#f4f0e8', 0, 0.85, 0);
  for (let i = 0; i < 8; i++) {
    mesh(top, new THREE.ConeGeometry(0.75, 0.32, 2, 1, false, (i / 8) * Math.PI * 2, Math.PI / 4), i % 2 ? b : a, 0, 1.62, 0);
  }
  ball(top, 0.04, a, 0, 1.8, 0, 0);
  top.rotation.z = tilt;
  g.add(top);
  return put(parent, g, x, z, 0, s);
}

/** A sandcastle: a wall with four towers, a keep in the middle with a pink flag, on a little mound. */
export function sandcastle(parent, x, z, s = 1) {
  const g = new THREE.Group();
  const mound = cyl(g, 0.34, 0.4, 0.05, 10, SAND_DARK, 0, 0.025, 0);
  mound.castShadow = false;
  box(g, 0.44, 0.12, 0.32, SAND_CASTLE, 0, 0.11, 0);
  for (const dx of [-0.22, 0.22]) for (const dz of [-0.16, 0.16]) {
    cyl(g, 0.06, 0.07, 0.22, 8, SAND_CASTLE, dx, 0.16, dz);
    mesh(g, new THREE.ConeGeometry(0.07, 0.09, 8), SAND_DARK, dx, 0.315, dz);
  }
  cyl(g, 0.1, 0.12, 0.3, 10, SAND_CASTLE, 0, 0.3, 0);
  for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; box(g, 0.05, 0.05, 0.05, SAND_CASTLE, Math.cos(t) * 0.09, 0.47, Math.sin(t) * 0.09); }
  cyl(g, 0.006, 0.006, 0.2, 3, '#8a6a5a', 0, 0.56, 0).castShadow = false;
  const flag = mesh(g, new THREE.ConeGeometry(0.04, 0.1, 3), '#ff7a9a', 0.05, 0.63, 0);
  flag.rotation.z = -Math.PI / 2;
  flag.castShadow = false;
  const door = box(g, 0.08, 0.08, 0.01, SAND_DARK, 0, 0.1, 0.165);
  door.castShadow = false;
  return put(parent, g, x, z, 0, s);
}

/** A bucket and spade. */
export function bucket(parent, x, z, s = 1, color = '#e8394f') {
  const g = new THREE.Group();
  cyl(g, 0.09, 0.07, 0.14, 10, color, 0, 0.07, 0);
  const handle = mesh(g, new THREE.TorusGeometry(0.085, 0.008, 4, 10, Math.PI), '#ffd23f', 0, 0.14, 0);
  handle.castShadow = false;
  const spade = new THREE.Group();
  box(spade, 0.018, 0.22, 0.018, '#ffd23f', 0, 0.11, 0);
  box(spade, 0.08, 0.09, 0.012, '#3fb6e0', 0, -0.02, 0);
  spade.position.set(0.15, 0.06, 0.02);
  spade.rotation.z = -0.5;
  g.add(spade);
  return put(parent, g, x, z, 0, s);
}

/** A surfboard standing up on its tail, `len` long, leaning by `lean` (radians, toward -z) and turned by `rot`. */
export function surfboard(parent, x, y, z, len = 1, color = '#3fb6e0', stripe = '#ffffff', lean = 0.12, rot = 0) {
  const g = new THREE.Group();
  const board = new THREE.Group();
  const body = ball(board, len / 2, color, 0, 0, 0, 2);
  body.scale.set(0.3, 1.0, 0.06);
  box(board, 0.045 * len * 2, 0.85 * len, 0.02 * len * 2, stripe, 0, 0, 0.03 * len).castShadow = false;
  for (const dy of [-0.2, 0.2]) box(board, 0.26 * len, 0.04 * len, 0.02 * len, stripe, 0, dy * len, 0.03 * len).castShadow = false;
  box(board, 0.02 * len, 0.12 * len, 0.1 * len, '#2a5a7a', 0, -0.36 * len, -0.06 * len).castShadow = false; // the fin
  board.position.y = len / 2;
  g.add(board);
  g.position.set(x, y, z);
  g.rotation.set(-lean, rot, 0);
  parent.add(g);
  return g;
}

/** A beach ball: six coloured segments and a white cap. */
export function beachBall(parent, x, z, r = 0.12, y = 0) {
  const colors = ['#e8394f', '#ffffff', '#3fb6e0', '#ffffff', '#ffd23f', '#ffffff'];
  for (let i = 0; i < 6; i++) {
    const seg = mesh(parent, new THREE.SphereGeometry(r, 4, 8, (i / 6) * Math.PI * 2, Math.PI / 3), colors[i], x, y + r, z);
    seg.rotation.z = 0.5;
  }
}

/** A starfish lying on the ground: five little cones pointing out. */
const UP = new THREE.Vector3(0, 1, 0), out = new THREE.Vector3();
export function starfish(parent, x, y, z, r = 0.08, color = '#ff9a6a') {
  for (let i = 0; i < 5; i++) {
    const t = (i / 5) * Math.PI * 2 + 0.3;
    const arm = mesh(parent, new THREE.ConeGeometry(r * 0.32, r, 4), color, x + Math.cos(t) * r * 0.5, y + 0.015, z + Math.sin(t) * r * 0.5);
    arm.quaternion.setFromUnitVectors(UP, out.set(Math.cos(t), 0, Math.sin(t)));
    arm.castShadow = false;
  }
  cyl(parent, r * 0.3, r * 0.3, 0.025, 6, color, x, y + 0.015, z).castShadow = false;
}

/** A few little shells. */
export function shells(parent, x, y, z, n = 3) {
  for (let i = 0; i < n; i++) {
    const shell = mesh(parent, new THREE.ConeGeometry(0.04, 0.05, 6), ['#ffc2b0', '#fff3e0', '#ffd6e8'][i % 3], x - 0.12 + i * 0.12, y + 0.025, z + (i % 2) * 0.06);
    shell.rotation.x = -Math.PI / 2 + 0.3;
    shell.castShadow = false;
  }
}
