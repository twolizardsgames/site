// The street around the shop: grass, sidewalk, road, trees, bushes, and a street lamp.
// `outside` is the pack whose outside scene is on (GDD #109), or null: 'christmas' (GDD #116) adds snow on the
// ground, trees and roofs, lights along the roofs, a wreath on each gable, decorated trees, a snowman, presents and
// falling snowflakes. 'fairy' (GDD #161) adds giant toadstools, fairy doors in the street trees, flowers along the eaves,
// a flower arch round the shop's front, drifting sparkle dust and fireflies that glow at dusk. Kept cheap for big houses
// 'jungle' (GDD #161) has palm trees, big leafy plants, vines on the house, a toucan and parrots on the roofs and two
// parrots flying loops (each one merged body and two wings, moved by its transform). 'space' (GDD #161) puts a starry
// sky with big planets behind the house (one unlit backdrop, twinkling stars as one Points), a rocket on its launch pad,
// a satellite dish on the tallest roof and a UFO hovering over the shop with blinking lights (one InstancedMesh). 'beach'
// (GDD #166) is sand and a boardwalk with the sea in front (three foam lines rolling in), beach chairs and umbrellas,
// surfboards, sandcastles, palm trees, a sailboat bobbing out at sea, a gull on the roofs and two flying loops. Kept cheap for big houses
// (docs/TECH.md §5.4): every bulb, flower or vine leaf is one InstancedMesh, the snow, the dust and the fireflies one Points each,
// and none of them casts shadows.

import * as THREE from 'three';
import { box, cyl, ball, mesh, mergeStatic, mergeColors } from './models/prims.js';
import { PALETTE as P } from './toon.js';
import { ROOM } from './building.js';
import { canvasTexture, drawContext } from './canvasTexture.js';
import { parrot, toucan, PARROTS, seagull } from './models/critters.js';
import { deckChair, umbrella, sandcastle, bucket, surfboard, beachBall, starfish, shells, SAND, BEACH_STRIPES } from './models/beach.js';

const GROUND_Y = -0.4;
const SNOW = '#f7fbff', SNOW_SHADE = '#e3eef8', XRED = '#d8283f', XGREEN = '#2f8a4e', XGOLD = '#ffcf4a';
const FLAKE = 0.16; // a snowflake's size in world units
const FLAKES_PER_AREA = 2.4, FLAKES_MAX = 2500; // per square unit of the house's front, and at most
const BULBS = ['#ff5a6e', '#ffd34d', '#5ad1ff', '#7ee07a', '#ff9be0'];
const GROUND_BACK = 60; // how far the ground runs behind the house

/**
 * How big the ground has to be so a pinch-out on a wide or tall house never shows its edges: `w` across, `ahead` in front
 * of the house (the camera looks down only 9°, so the bottom of a zoomed-out screen is ground far in front), and `dash`,
 * how far either side of the middle road dashes and boardwalk boards go.
 */
function groundSize(layout) {
  const big = Math.max(layout.width, layout.roofTop);
  return { w: Math.max(80, 2 * big + 80), ahead: 8 * Math.max(layout.roofTop, 1.3 * layout.width) + 60, dash: layout.width / 2 + 30 };
}

/**
 * Sits a bird (feet at its origin) upright on a roof at `x`: the roof is a gable with its ridge along z, so the surface
 * is lower the further from the middle. A hair below it, so neither foot floats on the slope.
 */
function perch(bird, { left, right, y, h }, x, z) {
  const half = (right - left) / 2, off = Math.min(Math.abs(x - (left + right) / 2), half);
  bird.position.set(x, y + h * (1 - off / half) - (off > 0.01 ? 0.04 : 0.02), z);
}

/** The ground slab, from GROUND_BACK behind the house to `ahead` in front of it. */
function ground(group, g, color) {
  return box(group, g.w, 0.4, GROUND_BACK + g.ahead, color, 0, GROUND_Y - 0.2, (g.ahead - GROUND_BACK) / 2);
}

export function createEnvironment(layout, lighting, outside = null) {
  if (outside === 'fairy') return fairyStreet(layout, lighting);
  if (outside === 'jungle') return jungleStreet(layout, lighting);
  if (outside === 'space') return spaceStreet(layout, lighting);
  if (outside === 'beach') return beachStreet(layout, lighting);
  const group = new THREE.Group();
  const front = ROOM.D / 2;
  const half = layout.width / 2, g = groundSize(layout);
  const snowy = outside === 'christmas';

  ground(group, g, snowy ? SNOW : P.grass);
  // The sidewalk sits a little higher than the road and they don't overlap, so their edge never
  // flickers (z-fighting, worst on phones).
  box(group, g.w, 0.02, 1.8, snowy ? '#e6edf5' : P.sidewalk, 0, GROUND_Y + 0.01, front + 1.05);
  box(group, g.w, 0.02, 2.55, snowy ? '#b9b3c4' : P.road, 0, GROUND_Y - 0.005, front + 3.225);
  for (let x = -g.dash; x < g.dash; x += 1.6) box(group, 0.7, 0.01, 0.12, P.cream, x, GROUND_Y + 0.03, front + 3.2);

  const trees = [[-half - 1.5, -0.4, 1.2], [half + 1.7, -0.7, 1.4], [-half - 3.6, -1.6, 1.0], [half + 3.8, -1.5, 1.1]];
  for (const [x, z, s] of trees) tree(group, x, z, s, snowy);
  for (const x of [-half - 0.6, half + 0.6]) {
    ball(group, 0.35, P.leaf, x, GROUND_Y + 0.15, front - 0.2, 0);
    if (snowy) ball(group, 0.3, SNOW, x, GROUND_Y + 0.27, front - 0.22, 0).scale.y = 0.55;
    else ball(group, 0.12, P.pink, x + 0.1, GROUND_Y + 0.4, front, 0);
  }
  lighting.addStreetLamp(group, half + 0.9, GROUND_Y, front + 0.4);

  let update = () => {};
  if (snowy) update = christmas(group, layout, trees, front, half);
  mergeStatic(mergeColors(group)); // the street, trees and any outside scene: a few draw calls in all
  return { group, update };
}

function tree(group, x, z, s, snowy) {
  cyl(group, 0.1 * s, 0.14 * s, 0.9 * s, 6, P.trunk, x, GROUND_Y + 0.45 * s, z);
  ball(group, 0.6 * s, P.leaf, x, GROUND_Y + 1.2 * s, z, 0);
  ball(group, 0.45 * s, P.leafLight, x + 0.25 * s, GROUND_Y + 1.55 * s, z + 0.1, 0);
  if (snowy) { // a cap of snow on each crown
    ball(group, 0.5 * s, SNOW, x - 0.04 * s, GROUND_Y + 1.42 * s, z - 0.02, 0).scale.y = 0.5;
    ball(group, 0.38 * s, SNOW, x + 0.25 * s, GROUND_Y + 1.74 * s, z + 0.06, 0).scale.y = 0.5;
  }
}

/** The Christmas outside scene (GDD #116). Returns its per-frame update (twinkling lights, falling snow). */
function christmas(group, layout, trees, front, half) {
  const bulbs = []; // [x, y, z] for every light: roofs, then trees

  for (const { left, right, y, h, d } of layout.roofs) {
    const w = right - left, cx = (left + right) / 2, fz = d / 2;
    // Snow lying on both slopes: a thick white slab along each, a little proud of the roof.
    const ang = Math.atan2(h, w / 2), len = Math.hypot(w / 2, h) + 0.08, th = 0.09;
    for (const side of [-1, 1]) {
      const slab = box(group, len, th, d + 0.1, SNOW, cx + side * (w / 4 + Math.sin(ang) * th / 2), y + h / 2 + Math.cos(ang) * th / 2, 0);
      slab.rotation.z = -side * ang;
      slab.castShadow = false;
    }
    box(group, w + 0.04, 0.07, d + 0.04, SNOW, cx, y + 0.02, 0).castShadow = false; // a line of snow along the eaves
    // Lights along both front slopes and the eaves.
    const slope = Math.hypot(w / 2, h), n = Math.max(4, Math.round(slope / 0.32));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      bulbs.push([left + (w / 2) * t, y + h * t - 0.04, fz + 0.09], [right - (w / 2) * t, y + h * t - 0.04, fz + 0.09]);
    }
    for (let x = left + 0.3; x < right - 0.15; x += 0.32) bulbs.push([x, y - 0.06, fz + 0.04]);
    wreath(group, cx, y + h * 0.66, fz + 0.03);
  }

  // Ornaments and lights on the street trees.
  trees.forEach(([x, z, s], ti) => {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.2 + ti, r = 0.55 * s, yy = GROUND_Y + 1.05 * s + (i % 3) * 0.18 * s;
      const p = [x + Math.cos(a) * r * 0.85, yy, z + Math.abs(Math.sin(a)) * r * 0.8 + 0.05];
      if (i % 2) ball(group, 0.07 * s, i % 4 === 1 ? XRED : XGOLD, ...p, 0).castShadow = false;
      else bulbs.push(p);
    }
    ball(group, 0.1 * s, XGOLD, x + 0.25 * s, GROUND_Y + 2.0 * s, z + 0.1, 0); // a star on top
  });

  snowman(group, -half - 1.05, front - 0.05);
  presents(group, half + 1.15, front - 0.4);

  // Every bulb in one draw call, unlit so it glows; colours swap round now and then to twinkle.
  const lights = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.055, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }), bulbs.length);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  bulbs.forEach((p, i) => {
    lights.setMatrixAt(i, m.makeTranslation(...p));
    lights.setColorAt(i, color.set(BULBS[i % BULBS.length]));
  });
  group.add(lights);

  const flakes = snowfall(group, layout, front);
  let since = 0, step = 0;
  return (dt) => {
    flakes(dt);
    if ((since += dt) < 0.7) return;
    since = 0;
    step++;
    for (let i = 0; i < bulbs.length; i++) lights.setColorAt(i, color.set(BULBS[(i + step) % BULBS.length]));
    lights.instanceColor.needsUpdate = true;
  };
}

function wreath(group, x, y, z) {
  const ring = mesh(group, new THREE.TorusGeometry(0.2, 0.075, 6, 14), XGREEN, x, y, z);
  ring.castShadow = false;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    ball(group, 0.035, i % 2 ? XGOLD : XRED, x + Math.cos(a) * 0.2, y + Math.sin(a) * 0.2, z + 0.07, 0).castShadow = false;
  }
  ball(group, 0.06, XRED, x - 0.06, y - 0.2, z + 0.08, 0).scale.set(1, 0.7, 0.6);
  ball(group, 0.06, XRED, x + 0.06, y - 0.2, z + 0.08, 0).scale.set(1, 0.7, 0.6);
}

function snowman(group, x, z) {
  const y = GROUND_Y;
  ball(group, 0.32, SNOW, x, y + 0.28, z, 1);
  ball(group, 0.23, SNOW, x, y + 0.72, z, 1);
  ball(group, 0.17, SNOW, x, y + 1.05, z, 1);
  mesh(group, new THREE.ConeGeometry(0.035, 0.16, 6), '#ff8a3c', x, y + 1.05, z + 0.22).rotation.x = Math.PI / 2;
  for (const dx of [-0.06, 0.06]) ball(group, 0.022, P.ink, x + dx, y + 1.1, z + 0.15, 0).castShadow = false;
  for (const dy of [0.66, 0.78]) ball(group, 0.026, P.ink, x, y + dy, z + 0.22, 0).castShadow = false;
  cyl(group, 0.19, 0.19, 0.06, 10, XRED, x, y + 0.9, z); // scarf
  box(group, 0.08, 0.2, 0.04, XRED, x + 0.1, y + 0.8, z + 0.17).castShadow = false;
  cyl(group, 0.13, 0.13, 0.02, 10, P.ink, x, y + 1.18, z); // hat
  cyl(group, 0.09, 0.09, 0.16, 10, P.ink, x, y + 1.27, z);
  for (const side of [-1, 1]) { // twig arms
    const arm = cyl(group, 0.012, 0.012, 0.36, 4, P.trunk, x + side * 0.34, y + 0.8, z);
    arm.rotation.z = side * 1.0;
    arm.castShadow = false;
  }
}

function presents(group, x, z) {
  const y = GROUND_Y;
  for (const [dx, dz, w, h, c, ribbon] of [[0, 0, 0.36, 0.28, XRED, XGOLD], [0.34, 0.12, 0.26, 0.22, XGREEN, XRED], [0.08, 0.02, 0.22, 0.18, P.lilac, '#ffffff', 0.28]]) {
    const yy = c === P.lilac ? y + 0.28 : y; // the little one sits on top
    box(group, w, h, w, c, x + dx, yy + h / 2, z + dz);
    box(group, w + 0.01, h + 0.01, 0.05, ribbon, x + dx, yy + h / 2, z + dz).castShadow = false;
    box(group, 0.05, h + 0.01, w + 0.01, ribbon, x + dx, yy + h / 2, z + dz).castShadow = false;
    ball(group, 0.045, ribbon, x + dx, yy + h + 0.03, z + dz, 0).castShadow = false;
  }
}

/** Gently falling snow over the house and the street: one Points object, flakes wrapping round to the top. */
function snowfall(group, layout, front) {
  // Only in front of the house (not inside the open rooms), and as many flakes as the house is big so a tall, wide
  // house gets the same snowfall as a small one: one draw call however many there are.
  const w = layout.width + 14, top = layout.roofTop + 2, z0 = front + 0.4, z1 = front + 5;
  const N = Math.min(FLAKES_MAX, Math.round(w * (top - GROUND_Y) * FLAKES_PER_AREA));
  const pos = new Float32Array(N * 3), drift = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * w;
    pos[i * 3 + 1] = GROUND_Y + Math.random() * (top - GROUND_Y);
    pos[i * 3 + 2] = z0 + Math.random() * (z1 - z0);
    drift[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // The camera is orthographic, and three.js only scales points by distance for perspective cameras, so `size` is in
  // screen pixels: each frame it's set from the flake's world size and the camera's zoom (it was 0.16 px, invisible).
  const material = new THREE.PointsMaterial({ map: flakeTexture(), sizeAttenuation: false, transparent: true, depthWrite: false, color: '#ffffff' });
  const points = new THREE.Points(geo, material);
  const view = new THREE.Vector2();
  points.onBeforeRender = (renderer, scene, camera) => {
    const tall = camera.isOrthographicCamera ? (camera.top - camera.bottom) / camera.zoom : 10;
    material.size = Math.max(2, FLAKE * renderer.getSize(view).y / tall);
  };
  points.frustumCulled = false;
  group.add(points);
  let time = 0;
  return (dt) => {
    time += dt;
    for (let i = 0; i < N; i++) {
      let y = pos[i * 3 + 1] - dt * (0.35 + (i % 5) * 0.06);
      if (y < GROUND_Y) y = top;
      pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(time * 0.8 + drift[i]) * dt * 0.12;
    }
    geo.attributes.position.needsUpdate = true;
  };
}

let flakeTex = null;
function flakeTexture() {
  if (flakeTex) return flakeTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = drawContext(c);
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  flakeTex = canvasTexture(c);
  flakeTex.userData.keep = true;
  return flakeTex;
}

// The Fairy pack's outside scene (GDD #161): "Fairy Garden".
const CAP = '#e8394f', STALK = '#fff3e0', MOSS = '#7cc77a', DOOR = '#b0703f';
const BLOOMS = ['#ff9ec4', '#ffd98a', '#c8b6ff', '#ffffff', '#ffb8a0'];
const DUST = ['#ffd6f0', '#fff3b0', '#e6d6ff', '#ffffff', '#c9f4ff'];
const DUST_PER_AREA = 0.9, DUST_MAX = 900, DUST_SIZE = 0.11, FIREFLIES = 40, FIREFLY_SIZE = 0.14;

function fairyStreet(layout, lighting) {
  const group = new THREE.Group();
  const front = ROOM.D / 2, half = layout.width / 2, g = groundSize(layout);

  ground(group, g, '#9ad98a'); // a lusher green
  box(group, g.w, 0.02, 1.8, P.sidewalk, 0, GROUND_Y + 0.01, front + 1.05);
  box(group, g.w, 0.02, 2.55, P.road, 0, GROUND_Y - 0.005, front + 3.225);
  for (let x = -g.dash; x < g.dash; x += 1.6) box(group, 0.7, 0.01, 0.12, P.cream, x, GROUND_Y + 0.03, front + 3.2);

  const trees = [[-half - 1.5, -0.4, 1.2], [half + 1.7, -0.7, 1.4], [-half - 3.6, -1.6, 1.0], [half + 3.8, -1.5, 1.1]];
  for (const [x, z, s] of trees) {
    tree(group, x, z, s, false);
    fairyDoor(group, x, z + 0.15 * s + 0.01, s);
  }
  lighting.addStreetLamp(group, half + 0.9, GROUND_Y, front + 0.4);

  // Giant toadstools beside the house, and little ones in the grass.
  toadstool(group, -half - 0.8, front - 0.3, 1.35);
  toadstool(group, -half - 2.1, front + 0.05, 0.6);
  toadstool(group, -half - 2.6, -0.3, 1.0);
  toadstool(group, half + 1.45, front - 0.4, 1.15);
  toadstool(group, half + 2.5, front - 0.05, 0.55);
  toadstool(group, half + 3.0, -0.5, 0.9);

  // Flowers: along every roof's eaves, round the shop's front (the arch), and dotted in the grass. One draw call.
  const flowers = [];
  for (const { left, right, y, d } of layout.roofs) {
    for (let x = left + 0.15, i = 0; x < right - 0.1; x += 0.16, i++) flowers.push([x, y - 0.05 + (i % 2 ? 0.03 : -0.02), d / 2 + 0.04, 0.045 + (i % 3) * 0.008]);
  }
  const ax = layout.shopX ?? 0, aw = ROOM.W / 2 + 0.12, ah = ROOM.H + 0.05;
  for (let t = 0; t <= 1.0001; t += 1 / 30) { // a soft curve over the top, joining the two sides
    const a = Math.PI * t;
    if (t > 0.04 && t < 0.96) flowers.push([ax - Math.cos(a) * aw * 0.92, GROUND_Y + ah - 0.1 + Math.sin(a) * 0.12, front + 0.06, 0.05]);
  }
  for (let y = GROUND_Y + 0.12; y < GROUND_Y + ah; y += 0.13) for (const side of [-1, 1]) flowers.push([ax + side * aw, y, front + 0.06, 0.045]);
  for (let i = 0; i < 40; i++) {
    const x = (i % 2 ? 1 : -1) * (half + 0.4 + ((i * 0.37) % 1) * 4.5), z = -1.8 + ((i * 0.61) % 1) * (front + 1.6);
    flowers.push([x, GROUND_Y + 0.05, z, 0.05]);
  }
  const blooms = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toonFlat(), flowers.length);
  const m = new THREE.Matrix4(), color = new THREE.Color(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  flowers.forEach(([x, y, z, r], i) => {
    blooms.setMatrixAt(i, m.compose(pv.set(x, y, z), q, sc.set(r, r, r * 0.45))); // flat, facing the street
    blooms.setColorAt(i, color.set(BLOOMS[i % BLOOMS.length]));
  });
  group.add(blooms);
  // Leaves behind the arch's flowers, merged with the rest of the street.
  for (let t = 0; t <= 1; t += 1 / 13) for (const side of [-1, 1]) {
    const leaf = ball(group, 0.07, MOSS, ax + side * aw, GROUND_Y + 0.1 + t * (ah - 0.1), front + 0.02, 0);
    leaf.scale.set(1.4, 0.7, 0.4);
    leaf.castShadow = false;
  }

  const dust = sparkleDust(group, layout, front);
  const flies = fireflies(group, trees, half, front);
  mergeStatic(mergeColors(group));
  let glow = lighting.twilight;
  dust(0); // colour them in now, so a still picture (the pack card) shows them too
  flies(0, glow);
  return {
    group,
    update(dt) {
      glow += (lighting.twilight - glow) * Math.min(1, dt * 1.5);
      dust(dt);
      flies(dt, glow);
    },
  };
}

/** One plain material for the instanced flowers: lit like everything else, coloured per instance. */
function toonFlat() { return new THREE.MeshLambertMaterial({ color: '#ffffff' }); }

/** A spotted toadstool `s` tall-ish (1 = as tall as a shopper). */
function toadstool(group, x, z, s) {
  cyl(group, 0.12 * s, 0.16 * s, 0.75 * s, 8, STALK, x, GROUND_Y + 0.375 * s, z);
  const cap = mesh(group, new THREE.SphereGeometry(0.42 * s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), CAP, x, GROUND_Y + 0.7 * s, z);
  cap.scale.y = 0.75;
  cyl(group, 0.4 * s, 0.14 * s, 0.05 * s, 12, '#f6e3c8', x, GROUND_Y + 0.69 * s, z).castShadow = false; // the gills underneath
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, up = 0.35 + (i % 3) * 0.2, r = 0.42 * s * Math.cos(up);
    const dot = ball(group, 0.06 * s, '#ffffff', x + Math.cos(a) * r, GROUND_Y + 0.7 * s + Math.sin(up) * 0.42 * s * 0.75, z + Math.sin(a) * r, 0);
    dot.scale.y = 0.5;
    dot.castShadow = false;
  }
}

/** A little round fairy door at the foot of a street tree, with a window, a step and a lantern. */
function fairyDoor(group, x, z, s) {
  const y = GROUND_Y, w = 0.16 * s;
  box(group, w, w * 1.1, 0.03, DOOR, x, y + w * 0.55, z).castShadow = false;
  const top = cyl(group, w / 2, w / 2, 0.03, 10, DOOR, x, y + w * 1.1, z);
  top.rotation.x = Math.PI / 2;
  top.castShadow = false;
  ball(group, 0.012 * s, '#ffcf4a', x + w * 0.3, y + w * 0.55, z + 0.02, 0).castShadow = false; // the knob
  const win = cyl(group, w * 0.16, w * 0.16, 0.035, 8, '#fff3b0', x, y + w * 1.05, z + 0.005);
  win.rotation.x = Math.PI / 2;
  win.castShadow = false;
  box(group, w * 1.3, 0.03, 0.08, '#c9b9a8', x, y + 0.015, z + 0.04).castShadow = false; // a stone step
  ball(group, 0.025 * s, '#ffe680', x + w * 0.85, y + w * 1.0, z + 0.02, 0).castShadow = false; // a lantern
}

/**
 * Sparkle dust drifting down over the house and the street, swirling a little and twinkling, in pastel colours:
 * one Points object, as many specks as the house is big (like the snow).
 */
function sparkleDust(group, layout, front) {
  const w = layout.width + 14, top = layout.roofTop + 2, z0 = front + 0.4, z1 = front + 5;
  const N = Math.min(DUST_MAX, Math.round(w * (top - GROUND_Y) * DUST_PER_AREA));
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3), phase = new Float32Array(N);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    pos.set([(Math.random() - 0.5) * w, GROUND_Y + Math.random() * (top - GROUND_Y), z0 + Math.random() * (z1 - z0)], i * 3);
    c.set(DUST[i % DUST.length]);
    base.set([c.r, c.g, c.b], i * 3);
    phase[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = glowPoints(geo, DUST_SIZE, sparkleTexture());
  group.add(points);
  let time = 0;
  return (dt) => {
    time += dt;
    for (let i = 0; i < N; i++) {
      let y = pos[i * 3 + 1] - dt * (0.12 + (i % 4) * 0.03);
      if (y < GROUND_Y) y = top;
      pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(time * 0.6 + phase[i]) * dt * 0.18;
      const k = 0.35 + 0.65 * Math.max(0, Math.sin(time * 2.2 + phase[i] * 3)); // twinkle
      col[i * 3] = base[i * 3] * k; col[i * 3 + 1] = base[i * 3 + 1] * k; col[i * 3 + 2] = base[i * 3 + 2] * k;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };
}

/** Fireflies wandering in slow loops round the trees and toadstools: faint by day, glowing at dusk. One Points object. */
function fireflies(group, trees, half, front) {
  const homes = [...trees.map(([x, z, s]) => [x, z + 0.4, 0.6 + s * 0.6]), [-half - 0.9, front, 0.6], [half + 1.4, front - 0.2, 0.6]];
  const N = FIREFLIES, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) seed.set([i % homes.length, Math.random() * 6.3, 0.4 + Math.random() * 0.5, 0.5 + Math.random()], i * 4);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  group.add(glowPoints(geo, FIREFLY_SIZE, flakeTexture()));
  let time = 0;
  return (dt, glow) => {
    time += dt;
    const bright = 0.25 + 0.75 * glow;
    for (let i = 0; i < N; i++) {
      const [h, ph, r, sp] = seed.subarray(i * 4, i * 4 + 4), [hx, hz, hy] = homes[h], t = time * sp * 0.4 + ph;
      pos[i * 3] = hx + Math.cos(t) * r + Math.sin(t * 2.3) * 0.15;
      pos[i * 3 + 1] = GROUND_Y + hy + Math.sin(t * 1.7) * 0.35;
      pos[i * 3 + 2] = hz + Math.sin(t) * r * 0.6 + 0.3;
      const k = bright * (0.4 + 0.6 * Math.max(0, Math.sin(time * 1.6 + ph * 5))); // each one blinks on its own
      col[i * 3] = 0.85 * k; col[i * 3 + 1] = 1.0 * k; col[i * 3 + 2] = 0.45 * k;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };
}

/** Glowing points: added on top (so they shine at night), coloured per point, sized in world units like the snow. */
function glowPoints(geo, worldSize, map) {
  const material = new THREE.PointsMaterial({ map, vertexColors: true, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, material);
  const view = new THREE.Vector2();
  points.onBeforeRender = (renderer, scene, camera) => {
    const tall = camera.isOrthographicCamera ? (camera.top - camera.bottom) / camera.zoom : 10;
    material.size = Math.max(2, worldSize * renderer.getSize(view).y / tall);
  };
  points.frustumCulled = false;
  return points;
}

let sparkleTex = null;
/** A four-pointed glint with a soft middle. */
function sparkleTexture() {
  if (sparkleTex) return sparkleTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = drawContext(c);
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 9);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  g.fillStyle = '#ffffff';
  g.beginPath();
  for (const [dx, dy] of [[0, -16], [3, -3], [16, 0], [3, 3], [0, 16], [-3, 3], [-16, 0], [-3, -3]]) g.lineTo(16 + dx, 16 + dy);
  g.fill();
  sparkleTex = canvasTexture(c);
  sparkleTex.userData.keep = true;
  return sparkleTex;
}

// The Jungle pack's outside scene (GDD #161): "Jungle Street".
const PALM = '#a8784f', PALM_RING = '#8e6040', FROND = '#3fa45a', FROND_LIGHT = '#5cc074', BIGLEAF = '#2f9a55';
const VINE = '#3f8f4a', VINE_LEAVES = ['#3fa45a', '#5cc074', '#2f8a4e'], HIBISCUS = ['#ff5a7a', '#ff9a3c', '#ffd23f'];

function jungleStreet(layout, lighting) {
  const group = new THREE.Group();
  const front = ROOM.D / 2, half = layout.width / 2, g = groundSize(layout);

  ground(group, g, '#8fd27e');
  box(group, g.w, 0.02, 1.8, '#efe2c8', 0, GROUND_Y + 0.01, front + 1.05); // a sandy path
  box(group, g.w, 0.02, 2.55, P.road, 0, GROUND_Y - 0.005, front + 3.225);
  for (let x = -g.dash; x < g.dash; x += 1.6) box(group, 0.7, 0.01, 0.12, P.cream, x, GROUND_Y + 0.03, front + 3.2);
  lighting.addStreetLamp(group, half + 0.9, GROUND_Y, front + 0.4);

  palm(group, -half - 1.4, -0.3, 1.25, 1);
  palm(group, half + 1.8, -0.6, 1.4, -1);
  palm(group, -half - 3.4, -1.4, 1.05, -1);
  palm(group, half + 3.9, -1.5, 1.1, 1);
  for (const [x, z, s] of [[-half - 0.75, front - 0.25, 1.3], [half + 1.3, front - 0.15, 1.15], [-half - 2.4, front - 0.6, 1.6], [half + 2.9, front - 0.5, 1.5], [-half - 4.6, -0.6, 1.4], [half + 5.0, -0.4, 1.3]]) bigLeaves(group, x, z, s);

  // Vines: hanging from every roof's eaves and climbing both ends of the house, all their leaves in one draw call.
  const leaves = [];
  const strand = (x, top, len, z) => {
    const v = cyl(group, 0.012, 0.012, len, 4, VINE, x, top - len / 2, z);
    v.castShadow = false;
    for (let y = top - 0.06; y > top - len; y -= 0.09) leaves.push([x + (leaves.length % 2 ? 0.035 : -0.035), y, z + 0.01, leaves.length]);
  };
  for (const { left, right, y, d } of layout.roofs) {
    for (let x = left + 0.25, i = 0; x < right - 0.2; x += 0.42, i++) strand(x, y + 0.02, 0.18 + ((i * 7) % 5) * 0.08, d / 2 + 0.02);
  }
  const climb = layout.roofs.length ? Math.max(...layout.roofs.map((r) => r.y)) : ROOM.H;
  for (const side of [-1, 1]) {
    const x = side * (half + ROOM.T + 0.02);
    for (let y = GROUND_Y + 0.1; y < climb * 0.7; y += 0.08) leaves.push([x + Math.sin(y * 3) * 0.04, y, front - 0.02, leaves.length]);
  }
  const leafMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#ffffff' }), leaves.length);
  const m = new THREE.Matrix4(), color = new THREE.Color(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3(), e = new THREE.Euler();
  leaves.forEach(([x, y, z, i], k) => {
    const flower = i % 11 === 5;
    q.setFromEuler(e.set(0, 0, (i % 2 ? 0.7 : -0.7)));
    leafMesh.setMatrixAt(k, m.compose(pv.set(x, y, z), q, flower ? sc.set(0.035, 0.035, 0.02) : sc.set(0.055, 0.03, 0.015)));
    leafMesh.setColorAt(k, color.set(flower ? HIBISCUS[i % 3] : VINE_LEAVES[i % 3]));
  });
  group.add(leafMesh);

  // A toucan and parrots sitting on the roofs.
  layout.roofs.forEach((roof, i) => {
    const { left, right } = roof;
    const cx = (left + right) / 2;
    const bird = new THREE.Group();
    if (i % 2 === 0) toucan(bird, 1.4); else parrot(bird, PARROTS.green, 1.4);
    perch(bird, roof, cx + (i % 2 ? 0.4 : -0.3), 0.05);
    bird.rotation.y = 0.3;
    group.add(bird);
    if (right - left > 3) {
      const p = new THREE.Group();
      parrot(p, PARROTS.red, 1.3);
      perch(p, roof, left + 0.9, 0.42);
      p.rotation.y = 0.4;
      group.add(p);
    }
  });

  mergeStatic(mergeColors(group));

  // Two parrots flying loops over the house, flapping: built after the merge so they can move.
  const top = layout.roofTop ?? climb + 1;
  const flyers = [[PARROTS.red, 1.6, 0], [PARROTS.blue, 1.35, Math.PI]].map(([colors, s, phase]) => {
    const bird = new THREE.Group(), body = new THREE.Group(), wings = [new THREE.Group(), new THREE.Group()];
    parrot(body, colors, s, wings);
    mergeColors(body);
    bird.add(body, ...wings);
    group.add(bird);
    return { bird, wings, phase, r: Math.max(2.2, half + 1.2), y: top + 0.6 + s * 0.2 };
  });
  let time = 0;
  return {
    group,
    update(dt) {
      time += dt;
      for (const f of flyers) {
        const t = time * 0.35 + f.phase;
        f.bird.position.set(Math.cos(t) * f.r, f.y + Math.sin(t * 2) * 0.3, 1.6 + Math.sin(t) * 1.2);
        f.bird.rotation.y = Math.atan2(-Math.sin(t) * f.r, Math.cos(t) * 1.2); // facing along the loop
        const flap = Math.sin(time * 14 + f.phase) * 0.7;
        f.wings[0].rotation.z = flap;
        f.wings[1].rotation.z = -flap;
      }
    },
  };
}

/** A palm tree leaning a little toward `lean` (-1 left, 1 right), with fronds and coconuts. */
function palm(group, x, z, s, lean) {
  let px = x, py = GROUND_Y;
  const n = 7, seg = 0.36 * s;
  for (let i = 0; i < n; i++) {
    const tilt = lean * 0.04 * i;
    const c = cyl(group, 0.08 * s * (1 - i * 0.05), 0.1 * s * (1 - i * 0.05), seg, 6, i % 2 ? PALM : PALM_RING, px + Math.sin(tilt) * seg / 2, py + seg / 2, z);
    c.rotation.z = -tilt;
    px += Math.sin(tilt) * seg;
    py += Math.cos(tilt) * seg;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const frond = ball(group, 0.5 * s, i % 2 ? FROND : FROND_LIGHT, px + Math.cos(a) * 0.38 * s, py - 0.12 * s, z + Math.sin(a) * 0.38 * s, 0);
    frond.scale.set(1, 0.12, 0.28);
    frond.rotation.set(0, -a, -0.45);
  }
  for (let i = 0; i < 3; i++) ball(group, 0.07 * s, '#7a5232', px + Math.cos(i * 2.1) * 0.08 * s, py - 0.1 * s, z + Math.sin(i * 2.1) * 0.08 * s + 0.05, 0);
}

/** A clump of big jungle leaves on short stems, fanning out from the ground. */
function bigLeaves(group, x, z, s) {
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + (i / 6) * 2.4, len = (0.45 + (i % 3) * 0.12) * s;
    const stem = cyl(group, 0.015 * s, 0.015 * s, len, 4, VINE, x + Math.sin(a) * len * 0.35, GROUND_Y + len * 0.4, z + 0.05);
    stem.rotation.z = -a * 0.6;
    stem.castShadow = false;
    const leaf = ball(group, 0.22 * s, i % 2 ? BIGLEAF : FROND, x + Math.sin(a) * len * 0.75, GROUND_Y + len * 0.85, z + 0.1, 0);
    leaf.scale.set(0.7, 1, 0.12);
    leaf.rotation.set(0.25, 0, -a * 0.8);
  }
}

// The Space pack's outside scene (GDD #161): "Outer Space".
const MOON = '#cfc8dc', MOON_DARK = '#b3abc4', ROCKET = '#f4f6fa', ROCKET_RED = '#e8394f', STEEL_GREY = '#9aa3b8', UFO = '#c7cedb';
const UFO_LIGHTS = ['#ff5a7a', '#ffd23f', '#5ad1ff', '#7ee07a', '#c58cff'];
const SKY_Z = -24, SPACE_STARS = 360;

function spaceStreet(layout, lighting) {
  const group = new THREE.Group();
  const front = ROOM.D / 2, half = layout.width / 2, top = layout.roofTop, g = groundSize(layout);

  ground(group, g, MOON); // moon dust (the sky hides the far part)
  box(group, g.w, 0.02, 1.8, '#e6e2ee', 0, GROUND_Y + 0.01, front + 1.05);
  box(group, g.w, 0.02, 2.55, P.road, 0, GROUND_Y - 0.005, front + 3.225);
  for (let x = -g.dash; x < g.dash; x += 1.6) box(group, 0.7, 0.01, 0.12, P.cream, x, GROUND_Y + 0.03, front + 3.2);
  for (const [x, z, r] of [[-half - 2.6, -0.8, 0.6], [half + 2.4, -1.4, 0.8], [-half - 4.5, -3, 1.0], [half + 4.8, -4, 0.7], [-1, -6, 1.3], [3, -9, 1.0]]) { // craters
    const rim = cyl(group, r, r * 1.1, 0.08, 14, MOON_DARK, x, GROUND_Y + 0.02, z);
    rim.castShadow = false;
    cyl(group, r * 0.75, r * 0.75, 0.09, 14, '#beb6cf', x, GROUND_Y + 0.03, z).castShadow = false;
  }
  for (const [x, z, s] of [[-half - 0.7, front - 0.2, 0.25], [half + 1.3, front - 0.3, 0.3], [-half - 3.2, 0.2, 0.4]]) {
    const rock = mesh(group, new THREE.DodecahedronGeometry(s, 0), STEEL_GREY, x, GROUND_Y + s * 0.5, z);
    rock.scale.y = 0.6;
  }
  lighting.addStreetLamp(group, half + 0.9, GROUND_Y, front + 0.4);

  rocket(group, -half - 1.7, -0.2);
  const tallest = layout.roofs.reduce((a, b) => (b.y > a.y ? b : a), layout.roofs[0]);
  if (tallest) satelliteDish(group, tallest.right - 0.7, tallest.y + tallest.h * 0.3, 0.1);

  // The sky: a deep purple backdrop with a soft glow at the horizon, painted stars, and big planets in front of it.
  const skyH = Math.max(30, top + 20), skyW = Math.max(220, g.w);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(skyW, skyH), new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false }));
  sky.position.set(0, GROUND_Y - 3 + skyH / 2, SKY_Z);
  group.add(sky);
  // Plain night above it, so a big pinch-out never runs off the top of the painted sky.
  const aboveH = 1.5 * Math.max(layout.width, top) + 40;
  const above = new THREE.Mesh(new THREE.PlaneGeometry(skyW, aboveH), new THREE.MeshBasicMaterial({ color: '#120e36', fog: false }));
  above.position.set(0, GROUND_Y - 3 + skyH + aboveH / 2 - 0.05, SKY_Z - 0.05); // a hair behind, so the seam never flickers
  group.add(above);
  // Planets just above the roofline (the sky is far behind, so they show over the house from the front).
  const py = Math.max(top, 4);
  planet(group, -half * 0.7 - 1.5, py + 1.6, SKY_Z + 2, 1.5, '#ff9ec4', '#ffd0e4', false);
  planet(group, half * 0.7 + 1.8, py + 2.6, SKY_Z + 2, 1.2, '#b48cff', '#ffd166', true);
  planet(group, half * 0.2, py + 4.6, SKY_Z + 2, 0.6, '#7ad8ff', '#d6f3ff', false);
  ball(group, 0.4, '#f4f0e0', -half - 2.5, py + 4.2, SKY_Z + 2, 1).castShadow = false; // a little moon

  mergeStatic(mergeColors(group));

  const stars = skyStars(group, layout);
  const ufo = flyingSaucer(group);
  const ux = layout.shopX ?? 0;
  let time = 0;
  const update = (dt) => {
    time += dt;
    stars(time);
    ufo.root.position.set(ux + Math.sin(time * 0.25) * Math.min(2.5, half), top + 1.3 + Math.sin(time * 1.3) * 0.15, 0.9);
    ufo.root.rotation.y = time * 0.8;
    ufo.blink(time);
  };
  update(0); // in place now, so a still picture (the pack card) shows the UFO over the shop
  return { group, update };
}

/** A rocket on a launch pad with a scaffold tower beside it. */
function rocket(group, x, z) {
  const y = GROUND_Y;
  cyl(group, 0.9, 1.0, 0.18, 12, STEEL_GREY, x, y + 0.09, z);
  cyl(group, 0.36, 0.42, 2.2, 14, ROCKET, x, y + 1.38, z);
  mesh(group, new THREE.ConeGeometry(0.36, 0.7, 14), ROCKET_RED, x, y + 2.83, z);
  cyl(group, 0.37, 0.37, 0.12, 14, ROCKET_RED, x, y + 2.0, z).castShadow = false; // a red band
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const fin = box(group, 0.06, 0.55, 0.38, ROCKET_RED, x + Math.cos(a) * 0.45, y + 0.5, z + Math.sin(a) * 0.45);
    fin.rotation.y = -a;
  }
  const win = cyl(group, 0.13, 0.13, 0.05, 14, '#7ad8ff', x, y + 1.7, z + 0.4);
  win.rotation.x = Math.PI / 2;
  win.castShadow = false;
  const rim = mesh(group, new THREE.TorusGeometry(0.14, 0.03, 6, 14), STEEL_GREY, x, y + 1.7, z + 0.42);
  rim.castShadow = false;
  const tx = x - 0.75; // the tower
  for (const dx of [-0.15, 0.15]) for (const dz of [-0.15, 0.15]) box(group, 0.05, 2.6, 0.05, '#e8a33a', tx + dx, y + 1.3, z + dz);
  for (let h = 0.4; h < 2.6; h += 0.45) {
    box(group, 0.34, 0.04, 0.04, '#e8a33a', tx, y + h, z + 0.15).castShadow = false;
    box(group, 0.04, 0.04, 0.34, '#e8a33a', tx + 0.15, y + h, z).castShadow = false;
  }
  box(group, 0.4, 0.05, 0.08, '#e8a33a', tx + 0.35, y + 2.2, z).castShadow = false; // the arm to the rocket
}

/** A satellite dish on a roof, tipped up toward the sky. */
function satelliteDish(group, x, y, z) {
  cyl(group, 0.04, 0.05, 0.5, 6, STEEL_GREY, x, y + 0.25, z);
  const dish = mesh(group, new THREE.SphereGeometry(0.42, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), '#eef1f6', x, y + 0.55, z);
  dish.rotation.set(-0.9, 0, 0.3);
  const tip = cyl(group, 0.012, 0.012, 0.4, 4, STEEL_GREY, x + 0.05, y + 0.72, z + 0.15);
  tip.rotation.set(-0.9, 0, 0.3);
  ball(group, 0.035, ROCKET_RED, x + 0.1, y + 0.86, z + 0.3, 0).castShadow = false;
}

/** A planet on the sky: a sphere with two soft bands, and a ring round it if `ringed`. */
function planet(group, x, y, z, r, color, band, ringed) {
  ball(group, r, color, x, y, z, 2).castShadow = false;
  for (const dy of [-0.3, 0.25]) {
    const b = cyl(group, r * Math.cos(Math.asin(dy)) * 1.005, r * Math.cos(Math.asin(dy)) * 1.005, r * 0.12, 20, band, x, y + dy * r, z);
    b.castShadow = false;
  }
  if (ringed) {
    const ring = mesh(group, new THREE.TorusGeometry(r * 1.6, r * 0.12, 4, 32), band, x, y, z);
    ring.scale.z = 0.25;
    ring.rotation.set(1.2, 0, 0.35);
    ring.castShadow = false;
  }
}

/** Twinkling stars across the sky: one Points object. */
function skyStars(group, layout) {
  const N = SPACE_STARS, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), phase = new Float32Array(N);
  const w = layout.width + 30, base = Math.max(layout.roofTop, 3);
  for (let i = 0; i < N; i++) {
    pos.set([(Math.random() - 0.5) * w, GROUND_Y + 2 + Math.random() * (base + 14), SKY_Z + 1], i * 3);
    phase[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  group.add(glowPoints(geo, 0.18, sparkleTexture()));
  const tint = [[1, 1, 1], [1, 0.95, 0.7], [0.8, 0.9, 1]];
  const update = (time) => {
    for (let i = 0; i < N; i++) {
      const k = 0.45 + 0.55 * Math.max(0, Math.sin(time * 1.5 + phase[i] * 4)), [r, g, b] = tint[i % 3];
      col[i * 3] = r * k; col[i * 3 + 1] = g * k; col[i * 3 + 2] = b * k;
    }
    geo.attributes.color.needsUpdate = true;
  };
  update(0);
  return update;
}

/** The UFO: a silver saucer with a glass dome, a little green alien inside and a ring of blinking lights. */
function flyingSaucer(group) {
  const root = new THREE.Group(), body = new THREE.Group();
  const saucer = ball(body, 0.75, UFO, 0, 0, 0, 2);
  saucer.scale.set(1, 0.28, 1);
  cyl(body, 0.5, 0.35, 0.12, 16, STEEL_GREY, 0, -0.2, 0);
  ball(body, 0.17, '#7ee07a', 0, 0.3, 0, 1); // the alien
  for (const side of [-1, 1]) {
    ball(body, 0.045, '#2a1f2a', side * 0.06, 0.33, 0.14, 0);
    cyl(body, 0.012, 0.012, 0.14, 4, '#7ee07a', side * 0.08, 0.5, 0).rotation.z = -side * 0.3;
    ball(body, 0.03, '#ffd23f', side * 0.1, 0.57, 0, 0);
  }
  mergeColors(body);
  const dome = mesh(body, new THREE.SphereGeometry(0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.45, depthWrite: false }), 0, 0.12, 0);
  dome.castShadow = false;
  const n = 10, lights = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }), n);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    lights.setMatrixAt(i, m.makeTranslation(Math.cos(a) * 0.68, -0.02, Math.sin(a) * 0.68));
    lights.setColorAt(i, color.set(UFO_LIGHTS[i % UFO_LIGHTS.length]));
  }
  body.add(lights);
  root.add(body);
  group.add(root);
  let step = -1;
  return {
    root,
    blink(time) {
      const s = Math.floor(time * 4);
      if (s === step) return;
      step = s;
      for (let i = 0; i < n; i++) lights.setColorAt(i, color.set(UFO_LIGHTS[(i + s) % UFO_LIGHTS.length]));
      lights.instanceColor.needsUpdate = true;
    },
  };
}

let skyTex = null;
/** The space sky: deep purple at the top, a soft glow near the horizon (the stars are skyStars, on top). */
function skyTexture() {
  if (skyTex) return skyTex;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = drawContext(c);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#120e36');
  grad.addColorStop(0.55, '#2a1f66');
  grad.addColorStop(0.85, '#4a3592');
  grad.addColorStop(1, '#8a6ac4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 256);
  skyTex = canvasTexture(c);
  skyTex.userData.keep = true;
  return skyTex;
}

// The Beach pack's outside scene (GDD #166): "Sunny Beach".
const BOARDWALK = '#dcc59c', BOARD_GAP = '#b8a07a', SEA = '#4fb8e8', SHALLOWS = '#8fdcf2', WET_SAND = '#e3c993';
const FOAM_LINES = 3;

function beachStreet(layout, lighting) {
  const group = new THREE.Group();
  const front = ROOM.D / 2, half = layout.width / 2, g = groundSize(layout);
  const shore = front + 2.15; // where the sand meets the sea

  ground(group, g, SAND);
  box(group, g.w, 0.02, 1.8, BOARDWALK, 0, GROUND_Y + 0.01, front + 1.05); // the boardwalk...
  for (let x = -g.dash; x < g.dash; x += 0.32) box(group, 0.03, 0.005, 1.8, BOARD_GAP, x, GROUND_Y + 0.022, front + 1.05).castShadow = false; // ...and its boards
  box(group, g.w, 0.02, 0.35, WET_SAND, 0, GROUND_Y + 0.003, shore - 0.05);
  box(group, g.w, 0.02, 0.7, SHALLOWS, 0, GROUND_Y + 0.004, shore + 0.45);
  box(group, g.w, 0.02, g.ahead, SEA, 0, GROUND_Y + 0.002, shore + 0.8 + g.ahead / 2);
  for (let i = 0; i < 40; i++) { // little wave crests dotted over the sea
    const crest = box(group, 0.5 + (i % 3) * 0.25, 0.01, 0.05, i % 2 ? '#ffffff' : '#bfeaf8', ((i * 7.3) % 30) - 15, GROUND_Y + 0.015, shore + 2.6 + ((i * 3.7) % 14));
    crest.castShadow = false;
  }
  lighting.addStreetLamp(group, half + 0.9, GROUND_Y, front + 0.4);

  palm(group, -half - 1.3, -0.4, 1.2, 1);
  palm(group, half + 2.1, -0.9, 1.35, -1);
  palm(group, -half - 4.4, -1.6, 1.0, -1);

  // Beach things on the sand either side of the house.
  const at = (fn, x, z, ...rest) => { const o = fn(group, x, z, ...rest); o.position.y = GROUND_Y; return o; };
  at(umbrella, -half - 2.7, front - 0.45, 1.1, BEACH_STRIPES[0], 0.1);
  at(deckChair, -half - 2.35, front - 0.25, 0.3, 1, BEACH_STRIPES[1]);
  at(umbrella, half + 3.3, front - 0.7, 1.1, BEACH_STRIPES[2], -0.1);
  at(deckChair, half + 3.0, front - 0.45, -0.3, 1, BEACH_STRIPES[3]);
  at(deckChair, half + 3.75, front - 0.55, -0.15, 1, BEACH_STRIPES[0]);
  for (const [x, z, a, b] of [[-half - 2.0, front - 0.35, '#3fb6e0', '#ffffff'], [half + 3.35, front - 0.15, '#ff7a9a', '#ffffff']]) { // towels
    const towel = new THREE.Group();
    for (let i = 0; i < 4; i++) box(towel, 0.14, 0.012, 0.9, i % 2 ? b : a, -0.21 + i * 0.14, GROUND_Y + 0.006, 0).castShadow = false;
    towel.position.set(x, 0, z);
    towel.rotation.y = 1.3;
    group.add(towel);
  }
  surfboard(group, half + 1.25, GROUND_Y - 0.05, -0.15, 1.3, '#3fb6e0', '#ffffff', 0.05, 0.3);
  surfboard(group, half + 1.6, GROUND_Y - 0.05, -0.3, 1.2, '#ff7a9a', '#ffd23f', 0.1, -0.2);
  surfboard(group, -half - 0.75, GROUND_Y - 0.05, -0.6, 1.25, '#ffd23f', '#ff9a3c', 0.08, 0.2);
  at(sandcastle, -half - 3.7, front - 0.35, 1.1);
  at(bucket, -half - 3.1, front - 0.15, 1);
  at(sandcastle, half + 2.3, front - 0.15, 0.9);
  beachBall(group, -half - 1.55, front - 0.05, 0.14, GROUND_Y);
  for (const [x, z] of [[-half - 1.1, front - 0.2], [half + 1.9, front - 0.05], [-half - 3.3, front + 0.0]]) starfish(group, x, GROUND_Y, z, 0.1);
  shells(group, half + 4.3, GROUND_Y, front - 0.2);
  shells(group, -half - 0.6, GROUND_Y, front - 0.1);

  // A gull on every other roof.
  layout.roofs.forEach((roof, i) => {
    if (i % 2) return;
    const bird = new THREE.Group();
    seagull(bird, 1.4);
    perch(bird, roof, (roof.left + roof.right) / 2 + 0.35, 0.05);
    bird.rotation.y = -0.4;
    group.add(bird);
  });

  mergeStatic(mergeColors(group));

  // Foam lines rolling in toward the shore and fading: three thin strips, each its own see-through material.
  const foam = Array.from({ length: FOAM_LINES }, () => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(g.w, 0.01, 0.12), new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, depthWrite: false }));
    group.add(m);
    return m;
  });
  // Two gulls gliding loops over the house, flapping now and then.
  const top = layout.roofTop ?? ROOM.H + 1;
  const flyers = [[1.6, 0], [1.3, Math.PI * 0.9]].map(([s, phase]) => {
    const bird = new THREE.Group(), body = new THREE.Group(), wings = [new THREE.Group(), new THREE.Group()];
    seagull(body, s, wings);
    mergeColors(body);
    bird.add(body, ...wings);
    group.add(bird);
    return { bird, wings, phase, r: Math.max(2.4, half + 1.4), y: top + 0.7 + s * 0.2 };
  });
  const boat = sailboat(group);
  let time = 0;
  const update = (dt) => {
    time += dt;
    boat.position.set(Math.sin(time * 0.05) * (half + 3), GROUND_Y, shore + 6);
    boat.rotation.z = Math.sin(time * 1.2) * 0.06;
    boat.rotation.y = Math.cos(time * 0.05) > 0 ? 0 : Math.PI; // facing the way it drifts
    foam.forEach((m, k) => {
      const t = (time * 0.12 + k / FOAM_LINES) % 1; // 0 far out, 1 on the shore
      m.position.set(0, GROUND_Y + 0.012, shore + 3.5 * (1 - t));
      m.scale.z = 0.6 + t * 1.4;
      m.material.opacity = Math.sin(t * Math.PI) * 0.85;
    });
    for (const f of flyers) {
      const t = time * 0.3 + f.phase;
      f.bird.position.set(Math.cos(t) * f.r, f.y + Math.sin(t * 2) * 0.25, 1.4 + Math.sin(t) * 1.3);
      f.bird.rotation.y = Math.atan2(-Math.sin(t) * f.r, Math.cos(t) * 1.3);
      const flap = Math.sin(time * 3 + f.phase) > 0.2 ? Math.sin(time * 12 + f.phase) * 0.6 : 0.15; // glide, then a few flaps
      f.wings[0].rotation.z = flap;
      f.wings[1].rotation.z = -flap;
    }
  };
  update(0); // in place now, so a still picture (the pack card) shows the gulls and the foam
  return { group, update };
}

/** A little sailboat: a white hull, a mast and a pink-and-white sail, merged into one mesh so it can bob. */
function sailboat(group) {
  const boat = new THREE.Group();
  const hull = box(boat, 1.1, 0.22, 0.4, '#ffffff', 0, 0.06, 0);
  hull.castShadow = false;
  box(boat, 1.12, 0.06, 0.42, '#3fb6e0', 0, 0.0, 0).castShadow = false; // a blue stripe at the waterline
  cyl(boat, 0.025, 0.025, 1.3, 5, '#a07448', 0.05, 0.8, 0).castShadow = false;
  const sail = mesh(boat, new THREE.ConeGeometry(0.42, 1.1, 3), '#ff9ec4', -0.2, 0.8, 0);
  sail.scale.z = 0.08;
  sail.castShadow = false;
  const jib = mesh(boat, new THREE.ConeGeometry(0.25, 0.8, 3), '#ffffff', 0.32, 0.65, 0);
  jib.scale.z = 0.08;
  jib.castShadow = false;
  mergeColors(boat);
  group.add(boat);
  return boat;
}
