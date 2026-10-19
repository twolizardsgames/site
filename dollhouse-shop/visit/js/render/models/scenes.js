// Decoration room scenes (GDD #107, #108): the props across the back of a decoration room, one builder per
// look (DECOR.scene in data/decor.js). Built around the scene fixture's middle, standing on y = 0, front
// facing +z. They fill about 3.0 across and 1.16 deep (FIXTURES.scene); the room's back wall is at z = -0.68.
// Customers stand in front (z about +0.9) to admire them.

import * as THREE from 'three';
import { box, cyl, ball, mesh } from './prims.js';
import { PALETTE as P, gradientMap } from '../toon.js';
import { parrot, toucan, PARROTS } from './critters.js';
import { deckChair, umbrella, sandcastle, bucket, surfboard, beachBall, starfish, shells, SAND, BEACH_STRIPES } from './beach.js';

const WALL = -0.66; // just in front of the room's back wall
const SOIL = '#a07258', WATER = '#bfe6ff', WHITE = '#ffffff', RED = '#f07a8a';

const cone = (g, r, h, segs, mat, x, y, z) => mesh(g, new THREE.ConeGeometry(r, h, segs), mat, x, y, z);

/** A little round-topped bush with flowers dotted on it. */
function bush(g, x, z, r, flowers, y = 0) {
  ball(g, r, P.leaf, x, y + r * 0.8, z, 0);
  ball(g, r * 0.7, P.leafLight, x + r * 0.35, y + r * 1.25, z + 0.05, 0);
  flowers.forEach((c, i) => {
    const a = i * 2.1;
    ball(g, 0.055, c, x + Math.cos(a) * r * 0.8, y + r * (0.9 + (i % 2) * 0.4), z + Math.abs(Math.sin(a)) * r * 0.7, 0);
  });
}

/** A string of bunting flags along the back wall, from x0 to x1, sagging in the middle. */
function bunting(g, x0, x1, y, colors) {
  const n = Math.round((x1 - x0) / 0.2);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, sag = Math.sin(t * Math.PI) * 0.18;
    const flag = cone(g, 0.08, 0.16, 3, colors[i % colors.length], x, y - sag - 0.08, WALL + 0.04);
    flag.rotation.x = Math.PI; // point down
    flag.castShadow = false;
  }
  const cord = box(g, x1 - x0, 0.01, 0.01, P.cream, (x0 + x1) / 2, y - 0.09, WALL + 0.02);
  cord.castShadow = false;
}

/** A window on the back wall (frame, glass, a sill). */
function wallWindow(g, x, y, w, h, frame = P.cream) {
  box(g, w + 0.1, h + 0.1, 0.04, frame, x, y, WALL);
  box(g, w, h, 0.045, WATER, x, y, WALL + 0.005).castShadow = false;
  box(g, 0.035, h, 0.06, frame, x, y, WALL + 0.01);
  box(g, w, 0.035, 0.06, frame, x, y, WALL + 0.01);
  box(g, w + 0.2, 0.05, 0.14, frame, x, y - h / 2 - 0.05, WALL + 0.06);
}

/** An armchair facing the front, turned by `rot`. */
function armchair(g, x, z, rot, color) {
  const a = new THREE.Group();
  box(a, 0.56, 0.22, 0.5, color, 0, 0.2, 0);
  box(a, 0.56, 0.5, 0.12, color, 0, 0.5, -0.2);
  box(a, 0.1, 0.36, 0.5, color, -0.28, 0.32, 0);
  box(a, 0.1, 0.36, 0.5, color, 0.28, 0.32, 0);
  box(a, 0.42, 0.06, 0.38, P.cream, 0, 0.34, 0.04); // cushion
  for (const [lx, lz] of [[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]]) box(a, 0.05, 0.1, 0.05, P.wood, lx, 0.05, lz);
  a.position.set(x, 0, z);
  a.rotation.y = rot;
  g.add(a);
}

/** A sleeping cat curled up, at (x, y, z). */
function cat(g, x, y, z, color = '#f2b880') {
  ball(g, 0.12, color, x, y + 0.08, z, 1).scale.set(1.3, 0.7, 1);
  ball(g, 0.075, color, x + 0.12, y + 0.1, z + 0.04, 1);
  cone(g, 0.025, 0.05, 4, color, x + 0.1, y + 0.18, z + 0.03);
  cone(g, 0.025, 0.05, 4, color, x + 0.15, y + 0.18, z + 0.05);
  const tail = cyl(g, 0.025, 0.025, 0.22, 5, color, x - 0.08, y + 0.04, z + 0.1);
  tail.rotation.z = Math.PI / 2;
  tail.rotation.y = 0.5;
}

/** A row of books on a board, in many colors. */
function books(g, x, y, z, w, d = 0.22) {
  const colors = [P.pink, P.sky, P.butter, P.mint, P.lilac, P.peach, RED];
  for (let i = 0, bx = x - w / 2 + 0.04; bx < x + w / 2 - 0.04; i++) {
    const bw = 0.05 + (i % 3) * 0.01, bh = 0.17 + ((i * 5) % 4) * 0.025;
    box(g, bw, bh, d, colors[i % colors.length], bx + bw / 2, y + bh / 2, z);
    bx += bw + 0.006;
  }
}

/** A cupcake (or little cake) on top of something at height y. */
function cupcake(g, x, y, z, icing) {
  cyl(g, 0.035, 0.028, 0.04, 8, P.peach, x, y + 0.02, z);
  ball(g, 0.04, icing, x, y + 0.055, z, 0).scale.y = 0.8;
  ball(g, 0.012, RED, x, y + 0.09, z, 0);
}

/** A monstera leaf: a broad heart-tipped leaf with slits from the edge and a few holes. Base at (0, 0), tip at (0, len). */
function leafShape(len) {
  const w = len * 0.46;
  const half = (t) => w * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.75);
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  const side = (dir) => {
    const ts = dir > 0 ? [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.9, 1] : [0.9, 0.8, 0.68, 0.56, 0.44, 0.32, 0.2, 0.08];
    const slits = new Set([0.32, 0.56, 0.8]);
    for (const t of ts) {
      if (t === 1) { s.lineTo(0, len); continue; }
      const x = dir * half(t);
      if (slits.has(t)) { // a cut in from the edge, toward the middle vein
        if (dir > 0) { s.lineTo(x, t * len); s.lineTo(x * 0.35, (t + 0.04) * len); s.lineTo(dir * half(t + 0.07), (t + 0.07) * len); }
        else { s.lineTo(dir * half(t + 0.07), (t + 0.07) * len); s.lineTo(x * 0.35, (t + 0.04) * len); s.lineTo(x, t * len); }
      } else s.lineTo(x, t * len);
    }
  };
  side(1);
  side(-1);
  s.lineTo(0, 0);
  for (const [hx, hy] of [[0.18, 0.22], [-0.2, 0.42], [0.2, 0.66], [-0.16, 0.2]]) {
    const hole = new THREE.Path();
    hole.absellipse(hx * len, hy * len, len * 0.04, len * 0.025, 0, Math.PI * 2, false, 0.4);
    s.holes.push(hole);
  }
  return s;
}

const LEAF_GREEN = '#4caf6a', DARK_LEAF = '#2f8a50';
const leafMats = new Map();
const leafMat = (color) => {
  if (!leafMats.has(color)) leafMats.set(color, new THREE.MeshToonMaterial({ color, gradientMap, side: THREE.DoubleSide }));
  return leafMats.get(color);
};
const UP = new THREE.Vector3(0, 1, 0), FRONT = new THREE.Vector3(0, 0, 1);

/** A thin stem from a to b. */
function stem(g, a, b, r) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = cyl(g, r * 0.7, r, d.length(), 5, '#5fa86f', (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  m.castShadow = false;
}

/** How far a scene's leaves may reach sideways from the room's middle (the room is 3.4 across). */
const SIDE_LIMIT = 1.6;

/**
 * Which way a monstera leaf points for stem angle `a`: it runs outward and a little down from the stem's end,
 * its face turned up and to the front; `lift` stands it more upright. Also how far it reaches sideways: maxX (furthest from the middle, either way).
 */
function leafPose(x, a, reach, k, len, lift = 0) {
  const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a) * 0.8).normalize();
  const dir = out.clone().add(new THREE.Vector3(0, 0.45 - 0.6 * k + lift, 0)).normalize();
  const want = UP.clone().multiplyScalar(0.45).add(FRONT).normalize(); // face the viewer, a little upward
  const normal = want.sub(dir.clone().multiplyScalar(want.dot(dir))).normalize();
  const side = new THREE.Vector3().crossVectors(dir, normal);
  const halfW = len * 0.46;
  const tx = x + Math.cos(a) * reach;
  const far = tx + dir.x * len, spread = Math.abs(side.x) * halfW;
  const maxX = Math.max(Math.abs(tx), Math.abs(far) + spread);
  return { dir, normal, side, maxX };
}

/**
 * A potted monstera, `size` about its height, at (x, z) on a surface at height y0: a pot, then leaves on
 * long stems fanning up and out, turned toward the front so the slits and holes show. `seed` varies it.
 */
function monstera(g, x, z, size, potColor, seed, y0 = 0) {
  const ph = 0.3 * size, pr = 0.2 * size;
  cyl(g, pr, pr * 0.78, ph, 10, potColor, x, y0 + ph / 2, z);
  cyl(g, pr * 1.06, pr * 1.06, 0.04 * size, 10, potColor, x, y0 + ph, z);
  // The soil's top sits clearly above the rim's top: level with it (size 0.75) or just under it, the two flickered (user).
  cyl(g, pr * 0.92, pr * 0.92, 0.01, 10, SOIL, x, y0 + ph + 0.02 * size + 0.008, z).castShadow = false;
  const base = new THREE.Vector3(x, y0 + ph, z);
  const n = size < 0.5 ? 4 : 8;
  for (let i = 0; i < n; i++) {
    const k = ((i * 37 + seed * 11) % 10) / 10; // 0..1, a little different for each leaf
    const reach = (0.12 + 0.16 * k) * size, rise = (0.22 + 0.42 * ((i + 1) / n)) * size, len = (0.44 + 0.14 * k) * size;
    let a = i * 2.39996 + seed * 1.3; // golden angle: leaves spread all round
    // Keep every leaf inside the side walls (user: one poked through into the next room): it stands more upright,
    // like a plant grown against a wall, or failing that grows the other way. (The back wall hides any leaf behind it.)
    let pose = leafPose(x, a, reach, k, len);
    for (const lift of [0.8, 1.8]) if (pose.maxX > SIDE_LIMIT) pose = leafPose(x, a, reach, k, len, lift);
    if (pose.maxX > SIDE_LIMIT) pose = leafPose(x, (a = Math.PI - a), reach, k, len);
    const tip = new THREE.Vector3(x + Math.cos(a) * reach, y0 + ph + rise, z + Math.sin(a) * reach * 0.8 + 0.04 * size);
    stem(g, base, tip, 0.014 * size + 0.005);
    const { dir, normal, side } = pose;
    const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape(len), 6), leafMat(i % 2 ? LEAF_GREEN : DARK_LEAF));
    leaf.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, dir, normal));
    leaf.position.copy(tip);
    leaf.castShadow = true;
    g.add(leaf);
  }
}

const XRED = '#d8283f', XGREEN = '#2f8a4e', XGOLD = '#ffcf4a', TREE_DARK = '#25734a';

/**
 * The Christmas Tree Room's tree (GDD #116): tiers of green, a gold star, baubles and lights. Every bauble and bulb is
 * one InstancedMesh (big houses, docs/TECH.md §5.4).
 */
function christmasTree(g, x, z) {
  cyl(g, 0.07, 0.09, 0.3, 6, P.trunk, x, 0.15, z);
  const tiers = [[0.72, 0.8, 0.62], [0.58, 0.7, 1.05], [0.44, 0.6, 1.45], [0.28, 0.5, 1.82]];
  tiers.forEach(([r, h, y], i) => mesh(g, new THREE.ConeGeometry(r, h, 9), i % 2 ? TREE_DARK : XGREEN, x, y, z));
  const star = mesh(g, new THREE.OctahedronGeometry(0.12), XGOLD, x, 2.14, z);
  star.scale.set(1, 1.2, 0.5);
  star.castShadow = false;
  const spots = [];
  tiers.forEach(([r, h, y], t) => {
    const n = 9 - t * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 1.5 - Math.PI * 0.25 + t * 0.4; // round the front and sides
      spots.push([x + Math.cos(a) * r * 0.78, y - h * 0.32, z + Math.sin(a) * r * 0.78]);
    }
  });
  const baubles = ['#d8283f', XGOLD, '#5ad1ff', '#ff9be0', '#ffffff'];
  const dots = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), spots.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  spots.forEach((p, i) => { dots.setMatrixAt(i, m.makeTranslation(...p)); dots.setColorAt(i, c.set(baubles[i % baubles.length])); });
  g.add(dots);
}

/** A fireplace against the back wall: brick surround, a mantel with stockings, a glowing fire. */
function fireplace(g, x, stockings = [XRED, XGREEN, XRED]) {
  const z = WALL + 0.12;
  box(g, 0.9, 0.95, 0.24, P.brick, x, 0.475, z);
  box(g, 0.5, 0.48, 0.05, '#4a2f3a', x, 0.27, z + 0.1).castShadow = false; // the opening
  box(g, 1.04, 0.07, 0.32, P.wood, x, 0.98, z + 0.03); // mantel
  const glow = new THREE.MeshBasicMaterial({ color: '#ffb347' });
  mesh(g, new THREE.ConeGeometry(0.1, 0.24, 6), glow, x - 0.07, 0.17, z + 0.1).castShadow = false;
  mesh(g, new THREE.ConeGeometry(0.08, 0.2, 6), new THREE.MeshBasicMaterial({ color: '#ff6b3d' }), x + 0.08, 0.15, z + 0.1).castShadow = false;
  box(g, 0.34, 0.05, 0.08, P.trunk, x, 0.06, z + 0.12).castShadow = false; // logs
  [-0.32, 0, 0.32].map((dx, i) => [dx, stockings[i]]).forEach(([dx, col]) => { // stockings with white tops
    box(g, 0.12, 0.2, 0.05, col, x + dx, 0.82, z + 0.2).castShadow = false;
    box(g, 0.17, 0.07, 0.05, col, x + dx + 0.03, 0.71, z + 0.2).castShadow = false;
    box(g, 0.14, 0.05, 0.06, '#ffffff', x + dx, 0.93, z + 0.2).castShadow = false;
  });
  for (const dx of [-0.4, 0.4]) cyl(g, 0.035, 0.035, 0.14, 8, '#ffffff', x + dx, 1.08, z + 0.03); // candles on the mantel
}

/** A wooden rocking chair, turned by `rot`. */
function rockingChair(g, x, z, rot) {
  const c = new THREE.Group();
  box(c, 0.44, 0.04, 0.4, P.wood, 0, 0.36, 0);
  box(c, 0.44, 0.55, 0.04, P.wood, 0, 0.66, -0.19);
  for (const lx of [-0.2, 0.2]) {
    box(c, 0.04, 0.34, 0.04, P.wood, lx, 0.19, -0.15);
    box(c, 0.04, 0.34, 0.04, P.wood, lx, 0.19, 0.15);
    const rocker = mesh(c, new THREE.TorusGeometry(0.6, 0.02, 4, 12, 0.7), P.wood, lx, 0.62, 0);
    rocker.rotation.set(0, Math.PI / 2, Math.PI * 1.5 - 0.35);
  }
  box(c, 0.38, 0.06, 0.34, XRED, 0, 0.4, 0.01); // cushion
  box(c, 0.4, 0.3, 0.05, '#f3e3c8', 0.02, 0.56, -0.12).rotation.z = 0.15; // a blanket over the back
  c.position.set(x, 0, z);
  c.rotation.y = rot;
  g.add(c);
}

/** A toy train going round and round the tree on a ring of track. */
function toyTrain(g, x, z, r) {
  const track = mesh(g, new THREE.TorusGeometry(r, 0.02, 4, 32), '#8a6a5a', x, 0.02, z);
  track.rotation.x = Math.PI / 2;
  track.castShadow = false;
  const ring = new THREE.Group();
  ring.position.set(x, 0, z);
  ring.userData.live = true; // goes round, so mergeColors leaves it be
  g.add(ring);
  const cars = [[XRED, true], [XGREEN], [P.sky], [XGOLD]];
  let first = null;
  cars.forEach(([col, engine], i) => {
    const car = new THREE.Group();
    const a = -i * 0.32;
    car.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    car.rotation.y = -a;
    const body = box(car, 0.08, 0.08, 0.15, col, 0, 0.07, 0);
    if (engine) { cyl(car, 0.025, 0.03, 0.07, 6, P.ink, 0, 0.14, 0.04); box(car, 0.08, 0.06, 0.06, P.ink, 0, 0.13, -0.05); }
    first ??= body;
    ring.add(car);
  });
  first.onBeforeRender = () => { ring.rotation.y = -performance.now() / 5000; }; // round it goes (no per-frame update hook needed)
}

// ---------------------------------------------------------------------------------------------------
// Story rooms (GDD #147, data/story.js STORY_ROOMS): one of each, gifts from the story.
// ---------------------------------------------------------------------------------------------------
const GOLD = '#ffcf4a', DARK_WOOD = '#7a4a34', BLUE = '#3d6fd8', STEEL = '#b9c3cf';

/** A framed picture on the back wall. */
function picture(g, x, y, w, h, inside, frame = GOLD, z = WALL) {
  box(g, w + 0.06, h + 0.06, 0.03, frame, x, y, z).castShadow = false;
  box(g, w, h, 0.035, inside, x, y, z + 0.004).castShadow = false;
}

/** A music note on the wall: a round head and a stem. */
function note(g, x, y, color) {
  ball(g, 0.045, color, x, y, WALL + 0.02, 0).scale.set(1.2, 0.9, 0.4);
  box(g, 0.015, 0.16, 0.015, color, x + 0.045, y + 0.08, WALL + 0.02).castShadow = false;
  box(g, 0.06, 0.02, 0.015, color, x + 0.07, y + 0.15, WALL + 0.02).rotation.z = -0.5;
}

/** A blue-ribbon rosette facing the front: petals round a gold middle, two tails hanging down. `r` is its size. */
function rosette(g, x, y, z, r) {
  for (const dx of [-0.35, 0.35]) {
    const tail = box(g, r * 0.5, r * 1.4, 0.02, BLUE, x + dx * r, y - r * 1.05, z - 0.01);
    tail.rotation.z = dx * 0.5;
    tail.castShadow = false;
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ball(g, r * 0.32, i % 2 ? BLUE : '#5b8ff0', x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, z, 0).scale.z = 0.25;
  }
  cyl(g, r * 0.48, r * 0.48, 0.03, 14, GOLD, x, y, z + 0.02).rotation.x = Math.PI / 2;
  cyl(g, r * 0.3, r * 0.3, 0.035, 12, '#ffe58a', x, y, z + 0.03).rotation.x = Math.PI / 2;
}

/** A gold trophy cup standing at (x, y, z), `h` tall. */
function trophy(g, x, y, z, h, metal = GOLD) {
  box(g, h * 0.42, h * 0.12, h * 0.42, DARK_WOOD, x, y + h * 0.06, z);
  cyl(g, h * 0.05, h * 0.12, h * 0.3, 8, metal, x, y + h * 0.27, z);
  cyl(g, h * 0.3, h * 0.12, h * 0.42, 12, metal, x, y + h * 0.63, z);
  for (const side of [-1, 1]) {
    const handle = mesh(g, new THREE.TorusGeometry(h * 0.12, h * 0.025, 4, 10, Math.PI), metal, x + side * h * 0.3, y + h * 0.66, z);
    handle.rotation.z = side * -Math.PI / 2;
  }
}

/** A plate of cookies (little round biscuits with chocolate dots) at (x, y, z). */
function cookies(g, x, y, z, n = 5) {
  cyl(g, 0.15, 0.15, 0.015, 12, WHITE, x, y + 0.008, z);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = i === 0 ? 0 : 0.08;
    const cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
    cyl(g, 0.045, 0.045, 0.018, 8, '#d9a066', cx, y + 0.025 + (i === 0 ? 0.015 : 0), cz);
    ball(g, 0.009, '#6b3e2e', cx + 0.015, y + 0.04 + (i === 0 ? 0.015 : 0), cz, 0);
  }
}

/** A dollhouse: walls, a pointed roof, a door and windows. `open`: no roof yet and no front (still being built). */
function dollhouse(g, x, y, z, s, colors, open = false) {
  const [wall, roof] = colors;
  if (open) {
    box(g, s, 0.03, s * 0.7, P.wood, x, y + 0.015, z); // the floor
    box(g, s, s * 0.8, 0.03, wall, x, y + s * 0.4, z - s * 0.35);
    box(g, 0.03, s * 0.8, s * 0.7, wall, x - s / 2, y + s * 0.4, z);
    box(g, s, 0.03, s * 0.7, P.wood, x, y + s * 0.42, z); // the upstairs floor
    return;
  }
  box(g, s, s * 0.8, s * 0.7, wall, x, y + s * 0.4, z);
  const r = cone(g, s * 0.62, s * 0.5, 4, roof, x, y + s * 1.05, z);
  r.rotation.y = Math.PI / 4;
  r.scale.z = 0.8;
  box(g, s * 0.18, s * 0.32, 0.02, DARK_WOOD, x, y + s * 0.16, z + s * 0.35).castShadow = false;
  for (const dx of [-0.3, 0.3]) box(g, s * 0.16, s * 0.16, 0.02, WATER, x + dx * s, y + s * 0.55, z + s * 0.35).castShadow = false;
}

// The Fairy Glen (GDD #161).
const STUMP = '#9a6a4a', MOSS = '#7cc77a', DOOR_WOOD = '#6e4430', STALK = '#fff3e0', CAP_RED = '#e8394f', POND = '#9fd8f0';
const BLOOM = ['#ff9ec4', '#ffd98a', '#c8b6ff', '#ffffff'];
// Unlit, so they shine at night: glowing mushroom caps, the stump's window and the fireflies.
const GLOW_PINK = new THREE.MeshBasicMaterial({ color: '#ffb3dc' }), GLOW_BLUE = new THREE.MeshBasicMaterial({ color: '#a8ecff' });
const GLOW_LILAC = new THREE.MeshBasicMaterial({ color: '#dcc8ff' }), GLOW_WINDOW = new THREE.MeshBasicMaterial({ color: '#fff0a8' });
const FIREFLY = new THREE.MeshBasicMaterial({ color: '#e8ff8a' });

/** A spotted toadstool `h` tall standing at y; `seat` gives it a flat top to sit on. */
function toadstoolProp(g, x, y, z, h, seat = false) {
  cyl(g, h * 0.22, h * 0.3, h * 0.8, 6, STALK, x, y + h * 0.4, z);
  if (seat) cyl(g, h * 0.62, h * 0.55, h * 0.25, 10, CAP_RED, x, y + h * 0.9, z);
  else mesh(g, new THREE.SphereGeometry(h * 0.55, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), CAP_RED, x, y + h * 0.75, z).scale.y = 0.8;
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + 0.3;
    ball(g, h * 0.08, WHITE, x + Math.cos(a) * h * 0.4, y + h * (seat ? 1.03 : 1.0), z + Math.sin(a) * h * 0.4, 0).scale.y = 0.4;
  }
}

// The Treehouse (GDD #161).
const BARK = '#8a5a3c', JUNGLE = '#2f9a55', JUNGLE_LIGHT = '#5cc074', VINE_GREEN = '#3f8f4a', PLANK = '#c9965e', PLANK_DARK = '#9a6a40', ROPE = '#d8c08a';

// The Rocket Room (GDD #161). Screens, buttons and stars are unlit, so they glow.
const SPACE_WHITE = '#eef1f6', SPACE_STEEL = '#9aa3b8', NIGHT = '#1c1546';
const SPACE_SCREEN = new THREE.MeshBasicMaterial({ color: '#7ff0e0' }), SPACE_GLOW_WHITE = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const SPACE_RED = new THREE.MeshBasicMaterial({ color: '#ff5a7a' }), SPACE_YELLOW = new THREE.MeshBasicMaterial({ color: '#ffd23f' }), SPACE_GREEN = new THREE.MeshBasicMaterial({ color: '#7ee07a' });

/**
 * A tiny fairy, `h` tall, standing (or sitting, or hovering) at y: a petal dress, a head with hair, two pairs of wings
 * behind, turned by `rot`. With `wand`, she holds up a wand with a glowing star.
 */
function tinyFairy(g, x, y, z, h, dress, wing, hair, rot = 0, wand = false) {
  const f = new THREE.Group();
  const d = cone(f, h * 0.24, h * 0.5, 8, dress, 0, h * 0.25, 0);
  d.castShadow = false;
  ball(f, h * 0.17, '#ffd9c2', 0, h * 0.63, 0, 0); // the head
  const cap = mesh(f, new THREE.SphereGeometry(h * 0.18, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, h * 0.65, -h * 0.02);
  cap.rotation.x = -0.35;
  ball(f, h * 0.08, hair, 0, h * 0.8, -h * 0.06, 0); // a bun
  for (const side of [-1, 1]) {
    ball(f, h * 0.025, '#3a2a3a', side * h * 0.06, h * 0.64, h * 0.16, 0);
    for (const [dy, len, tilt] of [[0.48, 0.22, 0.6], [0.32, 0.15, -0.4]]) {
      const w = ball(f, h * len, wing, side * h * (0.1 + len * 0.6), h * dy, -h * 0.1, 0);
      w.scale.set(1, 0.55, 0.12);
      w.rotation.set(0, side * 0.3, side * tilt);
    }
    const arm = cyl(f, h * 0.025, h * 0.025, h * 0.2, 4, '#ffd9c2', side * h * 0.13, h * 0.42, h * 0.02);
    arm.rotation.z = side * (wand && side > 0 ? -2.4 : 0.5);
  }
  if (wand) {
    cyl(f, h * 0.012, h * 0.012, h * 0.28, 4, GOLD, h * 0.24, h * 0.62, h * 0.02).rotation.z = -0.4;
    const star = mesh(f, new THREE.OctahedronGeometry(h * 0.06), GLOW_WINDOW, h * 0.3, h * 0.77, h * 0.02);
    star.castShadow = false;
  }
  for (const o of f.children) o.castShadow = false;
  f.position.set(x, y, z);
  f.rotation.y = rot;
  g.add(f);
}

export const SCENES = {
  // The Christmas pack's look (GDD #116): a tall tree with a star and lights, presents, a fireplace with stockings, a
  // rocking chair and a toy train round the tree; the room's walls and floor come from DECOR.scene.
  xmastree(g) {
    const tx = -0.45, tz = -0.12;
    christmasTree(g, tx, tz);
    toyTrain(g, tx, tz, 0.86);
    [[-0.1, 0.25, 0.26, XRED, XGOLD], [-0.82, 0.18, 0.22, P.sky, '#ffffff'], [-0.5, 0.42, 0.18, XGOLD, XRED], [-0.95, -0.25, 0.2, XGREEN, XRED]]
      .forEach(([px, pz, w, col, ribbon]) => {
        box(g, w, w * 0.8, w, col, px, w * 0.4, pz);
        box(g, w + 0.01, w * 0.8 + 0.01, 0.04, ribbon, px, w * 0.4, pz).castShadow = false;
        ball(g, 0.035, ribbon, px, w * 0.8 + 0.02, pz, 0).castShadow = false;
      });
    fireplace(g, 0.95);
    rockingChair(g, 1.42, 0.35, -0.9);
    bunting(g, -1.4, 1.4, 2.25, [XRED, XGREEN, XGOLD, '#ffffff']);
  },


  // The Fairy pack's look (GDD #161): a hollow tree stump with a round door, a toadstool table with toadstool stools and
  // acorn cups, a lily pond, glowing mushrooms, a garland of flowers and fireflies; walls and floor from DECOR.scene.
  fairyglen(g) {
    // The tree stump house, back left.
    const sx = -0.95, sz = -0.25;
    cyl(g, 0.46, 0.55, 1.35, 10, STUMP, sx, 0.675, sz);
    cyl(g, 0.47, 0.47, 0.06, 10, MOSS, sx, 1.36, sz); // moss on top
    for (const [dx, dz] of [[-0.2, -0.1], [0.15, 0.05], [0.0, 0.2]]) toadstoolProp(g, sx + dx, 1.38, sz + dz, 0.16);
    for (let i = 0; i < 5; i++) { // roots
      const a = Math.PI * (0.15 + i * 0.18), root = cyl(g, 0.05, 0.09, 0.4, 5, STUMP, sx + Math.cos(a) * 0.5, 0.06, sz + Math.sin(a) * 0.5);
      root.rotation.set(Math.PI / 2 - 0.25, 0, -a + Math.PI / 2);
    }
    const front = sz + 0.53;
    box(g, 0.34, 0.42, 0.04, DOOR_WOOD, sx, 0.21, front).castShadow = false;
    const arch = cyl(g, 0.17, 0.17, 0.04, 12, DOOR_WOOD, sx, 0.42, front);
    arch.rotation.x = Math.PI / 2;
    arch.castShadow = false;
    ball(g, 0.025, GOLD, sx + 0.1, 0.25, front + 0.03, 0).castShadow = false;
    const win = cyl(g, 0.09, 0.09, 0.04, 10, GLOW_WINDOW, sx + 0.08, 0.9, front - 0.04);
    win.rotation.x = Math.PI / 2;
    win.rotation.z = 0.1;
    // The toadstool table with acorn cups, and three toadstool stools.
    const tx = 0.35, tz = 0.05;
    cyl(g, 0.1, 0.14, 0.5, 8, STALK, tx, 0.25, tz);
    cyl(g, 0.4, 0.38, 0.08, 14, CAP_RED, tx, 0.52, tz);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(g, 0.04, WHITE, tx + Math.cos(a) * 0.36, 0.53, tz + Math.sin(a) * 0.36, 0).scale.y = 0.4; }
    for (const [dx, dz] of [[-0.15, 0.05], [0.12, -0.1], [0.1, 0.16]]) {
      cyl(g, 0.045, 0.035, 0.06, 8, '#c49a6c', tx + dx, 0.59, tz + dz);
      ball(g, 0.05, '#8a5a3c', tx + dx, 0.62, tz + dz, 0).scale.y = 0.45;
    }
    for (const [dx, dz] of [[-0.6, 0.15], [0.6, 0.1], [0.05, 0.6]]) toadstoolProp(g, tx + dx, 0, tz + dz, 0.32, true);
    // A little lily pond, front left.
    const pond = cyl(g, 0.34, 0.34, 0.02, 16, POND, -0.35, 0.012, 0.42);
    pond.scale.z = 0.6;
    pond.castShadow = false;
    for (const [dx, dz, c] of [[-0.08, -0.02, '#ff9ec4'], [0.12, 0.05, null]]) {
      cyl(g, 0.08, 0.08, 0.01, 8, MOSS, -0.35 + dx, 0.025, 0.42 + dz).castShadow = false;
      if (c) ball(g, 0.035, c, -0.35 + dx, 0.045, 0.42 + dz, 0).castShadow = false;
    }
    // Glowing mushrooms, back right.
    for (const [x, z, h, r, cap] of [[1.2, -0.35, 0.55, 0.16, GLOW_PINK], [1.0, -0.2, 0.32, 0.11, GLOW_BLUE], [1.38, -0.12, 0.38, 0.12, GLOW_LILAC], [1.12, 0.0, 0.2, 0.08, GLOW_BLUE]]) {
      cyl(g, r * 0.3, r * 0.4, h, 6, STALK, x, h / 2, z);
      const c = mesh(g, new THREE.SphereGeometry(r, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), cap, x, h - 0.01, z);
      c.scale.y = 0.75;
      c.castShadow = false;
    }
    // A garland of flowers along the back wall, and fireflies resting in the air.
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = -1.4 + 2.8 * t, y = 2.2 - Math.sin(t * Math.PI) * 0.22;
      ball(g, i % 2 ? 0.045 : 0.06, i % 2 ? MOSS : BLOOM[(i / 2) % BLOOM.length], x, y, WALL + 0.05, 0).castShadow = false;
    }
    // The fairies who live here: one on a toadstool stool, one hovering over the pond with her wand, one at the stump's door.
    tinyFairy(g, tx - 0.6, 0.33, tz + 0.15, 0.4, '#ff9ec4', '#bfe6ff', '#8a5a3c', 0.5);
    tinyFairy(g, -0.3, 0.75, 0.45, 0.42, '#c8a8ff', '#ffe3f2', '#ffd27a', -0.2, true);
    tinyFairy(g, sx + 0.3, 0, front + 0.12, 0.36, '#9fe0c8', '#fff3b0', '#5a3a2a', 0.3);
    for (const [x, y, z] of [[-0.3, 1.5, -0.3], [0.2, 1.2, -0.45], [0.75, 1.65, -0.2], [-0.55, 1.0, 0.1], [1.0, 1.1, -0.45]]) {
      ball(g, 0.03, FIREFLY, x, y, z, 0).castShadow = false;
    }
  },

  // The Jungle pack's look (GDD #161): a big tree trunk up to the ceiling with leaves along the top, a lookout platform
  // with a railing and a telescope, a rope ladder down, a rope bridge to a little platform on a post, hanging vines, a
  // toucan and a parrot, and an explorer's crate; walls and floor from DECOR.scene.
  treehouse(g) {
    const tx = -0.85, tz = -0.25, py = 1.2; // the trunk, and the lookout's height
    cyl(g, 0.3, 0.4, 2.75, 9, BARK, tx, 1.375, tz);
    for (const [a, y] of [[0.6, 0.6], [2.4, 1.6], [4.0, 2.1]]) { // branch stubs
      const b = cyl(g, 0.06, 0.09, 0.4, 6, BARK, tx + Math.cos(a) * 0.4, y, tz + Math.sin(a) * 0.25);
      b.rotation.z = Math.cos(a) > 0 ? -1.0 : 1.0;
    }
    for (let i = 0; i < 11; i++) { // leaves along the ceiling
      const leaf = ball(g, 0.32 - (i % 3) * 0.05, i % 2 ? JUNGLE : JUNGLE_LIGHT, -1.45 + i * 0.29, 2.55 - (i % 2) * 0.08, WALL + 0.25 + (i % 3) * 0.12, 0);
      leaf.scale.y = 0.5;
      leaf.castShadow = false;
    }
    // The lookout: planks, posts, a rail and a telescope on a tripod.
    box(g, 1.0, 0.07, 0.75, PLANK, tx + 0.3, py, tz + 0.15);
    for (const [dx, dz] of [[-0.18, -0.2], [0.78, -0.2], [-0.18, 0.5], [0.78, 0.5]]) box(g, 0.05, 0.36, 0.05, PLANK_DARK, tx + dx, py + 0.18, tz + dz);
    box(g, 1.0, 0.04, 0.04, PLANK_DARK, tx + 0.3, py + 0.36, tz + 0.5);
    box(g, 0.04, 0.04, 0.72, PLANK_DARK, tx + 0.78, py + 0.36, tz + 0.15);
    box(g, 0.05, py, 0.05, PLANK_DARK, tx + 0.78, py / 2, tz + 0.5); // a post under the front corner
    for (const side of [-1, 0, 1]) {
      const leg = cyl(g, 0.012, 0.012, 0.42, 4, P.ink, tx + 0.2 + side * 0.08, py + 0.24, tz + 0.15 + (side ? 0 : 0.08));
      leg.rotation.set(side ? 0 : 0.25, 0, side * -0.25);
    }
    const scope = cyl(g, 0.04, 0.055, 0.42, 8, GOLD, tx + 0.2, py + 0.52, tz + 0.18);
    scope.rotation.set(0.3, 0, -1.1);
    // A rope ladder down the front of the lookout.
    const lx = tx + 0.55, lz = tz + 0.55;
    for (const side of [-1, 1]) cyl(g, 0.01, 0.01, py, 4, ROPE, lx + side * 0.12, py / 2, lz).castShadow = false;
    for (let y = 0.15; y < py; y += 0.2) box(g, 0.26, 0.03, 0.04, PLANK, lx, y, lz).castShadow = false;
    // A rope bridge to a little platform on a post, back right.
    const bx0 = tx + 0.8, bx1 = 0.85, bz = tz + 0.05;
    box(g, 0.55, 0.06, 0.55, PLANK, bx1 + 0.25, py, bz);
    box(g, 0.08, py, 0.08, PLANK_DARK, bx1 + 0.25, py / 2, bz);
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = bx0 + (bx1 - bx0) * t, sag = Math.sin(t * Math.PI) * 0.16;
      box(g, 0.1, 0.03, 0.34, PLANK, x, py - sag, bz).castShadow = false;
      for (const side of [-1, 1]) box(g, 0.012, 0.25, 0.012, ROPE, x, py - sag + 0.13, bz + side * 0.17).castShadow = false;
    }
    for (const side of [-1, 1]) for (let i = 0; i < n; i++) { // the hand ropes
      const t = (i + 0.5) / n, x = bx0 + (bx1 - bx0) * t, sag = Math.sin(t * Math.PI) * 0.1;
      box(g, (bx1 - bx0) / n + 0.01, 0.015, 0.015, ROPE, x, py + 0.26 - sag, bz + side * 0.17).castShadow = false;
    }
    const tc = new THREE.Group();
    toucan(tc, 1.1);
    tc.position.set(bx1 + 0.3, py + 0.03, bz);
    tc.rotation.y = -0.4;
    g.add(tc);
    const pr = new THREE.Group();
    parrot(pr, PARROTS.blue, 1.0);
    pr.position.set(tx + 0.1, py + 0.38, tz + 0.5);
    pr.rotation.y = 0.5;
    g.add(pr);
    // Hanging vines with leaves, and an explorer's crate with a lantern.
    for (const [x, len] of [[0.1, 0.9], [0.45, 0.6], [1.35, 1.1], [-1.35, 0.8]]) {
      cyl(g, 0.012, 0.012, len, 4, VINE_GREEN, x, 2.7 - len / 2, WALL + 0.35).castShadow = false;
      for (let y = 2.6; y > 2.7 - len; y -= 0.14) {
        const l = ball(g, 0.05, JUNGLE_LIGHT, x + ((y * 10) % 2 > 1 ? 0.04 : -0.04), y, WALL + 0.36, 0);
        l.scale.set(1, 0.55, 0.4);
        l.castShadow = false;
      }
    }
    box(g, 0.5, 0.32, 0.36, PLANK, 1.15, 0.16, 0.25);
    box(g, 0.52, 0.04, 0.38, PLANK_DARK, 1.15, 0.33, 0.25).castShadow = false;
    for (const dx of [-0.18, 0.18]) box(g, 0.04, 0.33, 0.37, PLANK_DARK, 1.15 + dx, 0.16, 0.25).castShadow = false;
    cyl(g, 0.06, 0.06, 0.12, 8, P.ink, 1.05, 0.41, 0.2);
    ball(g, 0.05, GLOW_WINDOW, 1.05, 0.42, 0.2, 0).castShadow = false;
  },

  // The Space pack's look (GDD #161): a round porthole full of stars, a control panel with glowing screens and buttons
  // and a swivel chair, an astronaut suit on a stand, a planet mobile and a model rocket; walls and floor from DECOR.scene.
  rocketroom(g) {
    // The porthole on the back wall.
    const ox = -0.45, oy = 1.5;
    const frame = mesh(g, new THREE.TorusGeometry(0.46, 0.07, 8, 24), SPACE_STEEL, ox, oy, WALL + 0.04);
    frame.castShadow = false;
    const glass = cyl(g, 0.44, 0.44, 0.02, 24, NIGHT, ox, oy, WALL + 0.02);
    glass.rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4, r = 0.1 + ((i * 7) % 5) * 0.06;
      ball(g, i % 3 ? 0.012 : 0.02, SPACE_GLOW_WHITE, ox + Math.cos(a) * r, oy + Math.sin(a) * r, WALL + 0.04, 0).castShadow = false;
    }
    ball(g, 0.1, '#ff9ec4', ox + 0.18, oy - 0.15, WALL + 0.06, 1).castShadow = false; // a planet going by
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ball(g, 0.025, SPACE_STEEL, ox + Math.cos(a) * 0.46, oy + Math.sin(a) * 0.46, WALL + 0.11, 0).castShadow = false; }
    // The control panel, a sloped desk with screens and buttons, and a swivel chair.
    const cx = 0.75, cz = WALL + 0.3;
    box(g, 1.1, 0.7, 0.45, SPACE_WHITE, cx, 0.35, cz);
    const top = box(g, 1.1, 0.06, 0.5, SPACE_STEEL, cx, 0.74, cz + 0.02);
    top.rotation.x = 0.35;
    for (const [dx, w] of [[-0.3, 0.32], [0.18, 0.4]]) {
      const screen = box(g, w, 0.32, 0.04, SPACE_SCREEN, cx + dx, 1.1, WALL + 0.12);
      screen.castShadow = false;
      box(g, w + 0.06, 0.38, 0.03, SPACE_STEEL, cx + dx, 1.1, WALL + 0.09).castShadow = false;
    }
    [SPACE_RED, SPACE_YELLOW, SPACE_GREEN, SPACE_RED, SPACE_GREEN, SPACE_YELLOW, SPACE_GREEN, SPACE_RED].forEach((mat, i) => {
      const b = cyl(g, 0.03, 0.03, 0.03, 8, mat, cx - 0.4 + (i % 4) * 0.12 + (i > 3 ? 0.45 : 0), 0.79 - (i % 2) * 0.03, cz + 0.05 + (i % 2) * 0.08);
      b.rotation.x = 0.35;
      b.castShadow = false;
    });
    const stick = cyl(g, 0.015, 0.015, 0.14, 5, P.ink, cx + 0.3, 0.83, cz + 0.12); // a joystick
    stick.rotation.x = 0.35;
    ball(g, 0.035, SPACE_RED, cx + 0.3, 0.9, cz + 0.15, 0);
    cyl(g, 0.04, 0.04, 0.38, 6, SPACE_STEEL, cx, 0.19, cz + 0.6);
    cyl(g, 0.22, 0.22, 0.08, 12, '#5b8ff0', cx, 0.42, cz + 0.6);
    box(g, 0.4, 0.42, 0.08, '#5b8ff0', cx, 0.66, cz + 0.78);
    // The astronaut suit on a stand.
    const ax = -1.25, az = -0.25;
    cyl(g, 0.2, 0.22, 0.05, 12, SPACE_STEEL, ax, 0.025, az);
    cyl(g, 0.025, 0.025, 0.5, 5, SPACE_STEEL, ax, 0.28, az);
    mesh(g, new THREE.CapsuleGeometry(0.22, 0.4, 3, 10), SPACE_WHITE, ax, 0.82, az);
    for (const side of [-1, 1]) {
      const arm = cyl(g, 0.075, 0.07, 0.42, 8, SPACE_WHITE, ax + side * 0.28, 0.8, az);
      arm.rotation.z = side * 0.25;
      ball(g, 0.08, SPACE_STEEL, ax + side * 0.33, 0.58, az, 0); // gloves
    }
    box(g, 0.34, 0.42, 0.16, SPACE_STEEL, ax, 0.88, az - 0.22); // the backpack
    box(g, 0.16, 0.12, 0.03, '#5b8ff0', ax, 0.9, az + 0.22).castShadow = false; // the chest panel
    for (const [dx, mat] of [[-0.04, SPACE_RED], [0.04, SPACE_GREEN]]) ball(g, 0.018, mat, ax + dx, 0.9, az + 0.24, 0).castShadow = false;
    ball(g, 0.24, SPACE_WHITE, ax, 1.32, az, 1);
    const visor = ball(g, 0.18, '#e8b93a', ax, 1.32, az + 0.1, 1);
    visor.scale.set(1, 0.75, 0.6);
    visor.castShadow = false;
    // The planet mobile hanging from the ceiling.
    const mx = 0.1, my = 2.6, mz = -0.1;
    cyl(g, 0.01, 0.01, 0.25, 4, P.ink, mx, my + 0.13, mz).castShadow = false;
    const bar = cyl(g, 0.012, 0.012, 1.1, 4, P.ink, mx, my, mz);
    bar.rotation.z = Math.PI / 2;
    bar.castShadow = false;
    for (const [dx, drop, r, color, ringed] of [[-0.5, 0.45, 0.12, '#ff9ec4', false], [-0.05, 0.7, 0.16, '#b48cff', true], [0.45, 0.35, 0.1, '#7ad8ff', false], [0.25, 0.9, 0.07, SPACE_YELLOW, false]]) {
      cyl(g, 0.005, 0.005, drop, 3, P.ink, mx + dx, my - drop / 2, mz).castShadow = false;
      ball(g, r, color, mx + dx, my - drop - r, mz, 1).castShadow = false;
      if (ringed) {
        const ring = mesh(g, new THREE.TorusGeometry(r * 1.6, r * 0.12, 4, 20), '#ffd166', mx + dx, my - drop - r, mz);
        ring.rotation.set(1.3, 0, 0.3);
        ring.castShadow = false;
      }
    }
    // A model rocket on the floor.
    const rx = -0.3, rz = 0.25;
    cyl(g, 0.1, 0.12, 0.5, 10, SPACE_WHITE, rx, 0.35, rz);
    mesh(g, new THREE.ConeGeometry(0.1, 0.22, 10), '#e8394f', rx, 0.71, rz);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      box(g, 0.02, 0.2, 0.12, '#e8394f', rx + Math.cos(a) * 0.13, 0.15, rz + Math.sin(a) * 0.13).rotation.y = -a;
    }
    const pw = cyl(g, 0.04, 0.04, 0.02, 10, '#7ad8ff', rx, 0.45, rz + 0.1);
    pw.rotation.x = Math.PI / 2;
    pw.castShadow = false;
  },

  // The Beach pack's look (GDD #166): a straw fringe along the top of the wall, a window onto the waves, a life ring and
  // a surfboard on the wall, a sandy patch with a sandcastle, a bucket and spade, a striped deck chair under a beach
  // umbrella, a beach ball, a starfish and shells; walls and floor from DECOR.scene.
  beachhut(g) {
    // The straw fringe: a beam and a row of straw tufts hanging down.
    box(g, 3.0, 0.08, 0.1, '#b48a52', 0, 2.62, WALL + 0.06).castShadow = false;
    for (let x = -1.45, i = 0; x <= 1.45; x += 0.11, i++) {
      const tuft = cone(g, 0.075, 0.26 + (i % 3) * 0.05, 4, i % 2 ? '#e2c27a' : '#d1ad5e', x, 2.46 - (i % 3) * 0.025, WALL + 0.1);
      tuft.rotation.x = Math.PI;
      tuft.castShadow = false;
    }
    // A window onto the sea: sky, a sun, the blue sea with a white wave.
    const wx = 0.05, wy = 1.5, ww = 0.95, wh = 0.62;
    wallWindow(g, wx, wy, ww, wh, '#f4f0e8');
    box(g, ww, wh * 0.4, 0.01, '#3fa8e0', wx, wy - wh * 0.3, WALL + 0.032).castShadow = false;
    box(g, ww, 0.03, 0.012, WHITE, wx, wy - wh * 0.1, WALL + 0.034).castShadow = false;
    const sun = cyl(g, 0.09, 0.09, 0.01, 12, '#ffd23f', wx + 0.28, wy + 0.17, WALL + 0.034);
    sun.rotation.x = Math.PI / 2;
    sun.castShadow = false;
    // A life ring on the wall, red with four white bands.
    const lx = -0.85, ly = 1.6;
    mesh(g, new THREE.TorusGeometry(0.16, 0.05, 8, 16), '#e8394f', lx, ly, WALL + 0.07).castShadow = false;
    for (let i = 0; i < 4; i++) {
      const band = mesh(g, new THREE.TorusGeometry(0.16, 0.053, 8, 3, 0.4), WHITE, lx, ly, WALL + 0.07);
      band.rotation.z = (i / 4) * Math.PI * 2 + 0.6;
      band.castShadow = false;
    }
    // A surfboard leaning on the wall, back left.
    surfboard(g, -1.3, 0, WALL + 0.12, 1.4, '#ff7a9a', '#ffd23f', 0.08, 0.15);
    // A sandy patch with a sandcastle, a bucket and spade, a starfish and shells.
    const sand = cyl(g, 0.62, 0.66, 0.03, 18, SAND, -0.45, 0.015, 0.08);
    sand.scale.z = 0.62;
    sand.castShadow = false;
    sandcastle(g, -0.55, 0.02, 0.85);
    bucket(g, -0.05, 0.2, 0.9);
    starfish(g, -0.85, 0.03, 0.25, 0.09);
    shells(g, -0.4, 0.03, 0.33);
    // A striped deck chair under a beach umbrella, right, and a beach ball.
    deckChair(g, 0.85, -0.02, -0.25, 1, BEACH_STRIPES[1]);
    umbrella(g, 1.3, -0.35, 0.85, BEACH_STRIPES[0], -0.15);
    beachBall(g, 0.3, 0.38, 0.12);
  },

  // The Piano Room (GDD #147, chapter 4): June's old upright piano with its bench, music on the stand, an armchair to
  // listen from, a lamp, and music notes dancing along the wall.
  piano(g) {
    const px = -0.45, pz = WALL + 0.25;
    box(g, 1.2, 1.05, 0.42, DARK_WOOD, px, 0.6, pz); // the body
    box(g, 1.24, 0.05, 0.46, '#5e3828', px, 1.15, pz); // its top
    box(g, 1.14, 0.08, 0.3, DARK_WOOD, px, 0.66, pz + 0.3); // the keyboard shelf
    box(g, 1.06, 0.03, 0.18, WHITE, px, 0.715, pz + 0.33).castShadow = false; // white keys
    for (let i = 0; i < 14; i++) if (i % 7 !== 2 && i % 7 !== 6) box(g, 0.035, 0.03, 0.1, P.ink, px - 0.49 + i * 0.075, 0.74, pz + 0.3).castShadow = false;
    for (const dx of [-0.5, 0.5]) box(g, 0.08, 0.6, 0.12, DARK_WOOD, px + dx, 0.3, pz + 0.28); // legs
    box(g, 0.42, 0.28, 0.02, '#fffaf0', px, 0.95, pz + 0.22).rotation.x = -0.25; // sheet music
    for (let i = 0; i < 4; i++) box(g, 0.32, 0.008, 0.005, P.ink, px, 0.88 + i * 0.05, pz + 0.235 - i * 0.012).rotation.x = -0.25;
    box(g, 0.2, 0.04, 0.03, GOLD, px, 0.42, pz + 0.215).castShadow = false; // a little brass plate: "June"
    cyl(g, 0.07, 0.05, 0.16, 8, P.sky, px + 0.4, 1.26, pz); // a vase of flowers on top
    bush(g, px + 0.4, pz, 0.1, [P.pink, P.butter, WHITE], 1.3);
    box(g, 0.18, 0.22, 0.03, GOLD, px - 0.35, 1.29, pz - 0.05).rotation.x = -0.15; // a photo: little June at the piano
    box(g, 0.14, 0.17, 0.035, P.peach, px - 0.35, 1.29, pz - 0.045).rotation.x = -0.15;
    // The bench, with a cushion.
    box(g, 0.7, 0.06, 0.3, DARK_WOOD, px, 0.42, 0.18);
    box(g, 0.64, 0.05, 0.26, P.lilac, px, 0.47, 0.18);
    for (const [lx, lz] of [[-0.3, 0.07], [0.3, 0.07], [-0.3, 0.29], [0.3, 0.29]]) box(g, 0.05, 0.4, 0.05, DARK_WOOD, px + lx, 0.2, lz);
    cyl(g, 0.55, 0.55, 0.015, 18, P.pink, px, 0.01, 0.12).castShadow = false; // a round rug
    // An armchair to listen from, a floor lamp and a music stand.
    armchair(g, 0.95, 0.05, -0.55, P.peach);
    cyl(g, 0.12, 0.14, 0.03, 10, P.ink, 1.38, 0.015, -0.4);
    cyl(g, 0.02, 0.02, 1.35, 6, P.ink, 1.38, 0.69, -0.4);
    cyl(g, 0.1, 0.18, 0.2, 10, P.butter, 1.38, 1.42, -0.4);
    cyl(g, 0.015, 0.015, 0.9, 5, P.ink, 0.45, 0.45, -0.3);
    box(g, 0.34, 0.24, 0.02, P.ink, 0.45, 0.95, -0.28).rotation.x = -0.3;
    box(g, 0.28, 0.2, 0.01, '#fffaf0', 0.45, 0.96, -0.265).rotation.x = -0.3;
    // Music notes dancing along the wall, and two pictures.
    [[-1.2, 1.8, P.pink], [-0.9, 1.95, P.lilac], [-0.15, 1.85, P.sky], [0.2, 2.0, P.pink], [0.55, 1.9, P.lilac]].forEach(([x, y, c]) => note(g, x, y, c));
    picture(g, 1.0, 1.75, 0.5, 0.38, P.sky);
    picture(g, -1.25, 1.25, 0.26, 0.32, P.mint);
  },

  // The Fireplace Room (chapter 6): the shop's old fireplace opened up again, stockings and all, with two armchairs,
  // a basket of logs, cocoa on a little table and a cat asleep on the rug.
  fireplace(g) {
    fireplace(g, 0, [P.sky, P.butter, P.pink]);
    box(g, 1.3, 0.8, 0.12, P.brick, 0, 1.4, WALL + 0.06); // the chimney breast above the mantel
    const front = WALL + 0.13; // a picture of the shop long ago, on the chimney breast
    picture(g, 0, 1.45, 0.56, 0.42, P.sky, GOLD, front);
    box(g, 0.3, 0.16, 0.02, P.facade, 0, 1.36, front + 0.03).castShadow = false;
    cone(g, 0.22, 0.12, 4, P.roof, 0, 1.5, front + 0.03).rotation.y = Math.PI / 4;
    const cl = cyl(g, 0.08, 0.08, 0.05, 12, WHITE, 0.32, 1.1, WALL + 0.16); // a clock on the mantel
    cl.rotation.x = Math.PI / 2;
    cyl(g, 0.1, 0.1, 0.015, 16, '#ff9ec4', 0, 0.014, 0.28).scale.set(8, 1, 4); // a big oval rug
    cat(g, 0.15, 0.02, 0.3, '#9a8a96');
    armchair(g, -0.95, 0.05, 0.55, P.mint);
    armchair(g, 0.95, 0.05, -0.55, P.lilac);
    // A basket of logs and a little table with cocoa and a book.
    cyl(g, 0.17, 0.14, 0.2, 10, '#c49a6c', -0.68, 0.1, -0.35);
    for (const [dx, dz] of [[-0.05, 0], [0.06, 0.03], [0, -0.05]]) cyl(g, 0.035, 0.035, 0.3, 6, P.trunk, -0.68 + dx, 0.24, -0.35 + dz).rotation.z = Math.PI / 2;
    cyl(g, 0.16, 0.16, 0.03, 10, P.wood, 1.35, 0.48, -0.25);
    cyl(g, 0.03, 0.03, 0.47, 6, P.wood, 1.35, 0.24, -0.25);
    cyl(g, 0.04, 0.035, 0.08, 8, RED, 1.32, 0.535, -0.22);
    ball(g, 0.03, WHITE, 1.32, 0.58, -0.22, 0).scale.y = 0.5; // whipped cream
    box(g, 0.14, 0.04, 0.1, P.sky, 1.4, 0.515, -0.3);
    bunting(g, -1.4, 1.4, 2.4, [P.butter, P.peach, P.mint]);
  },

  // The Kitchen (chapter 8): an oven, counters with a mixing bowl and the cookie jar, shelves of jars, and a table
  // with cinnamon cookies and milk, so the shop smells of cookies again.
  kitchen(g) {
    const cz = WALL + 0.24;
    box(g, 2.0, 0.78, 0.46, WHITE, -0.4, 0.39, cz); // the counters
    box(g, 2.06, 0.05, 0.5, P.butter, -0.4, 0.8, cz);
    for (const x of [-1.15, -0.65, 0.35]) { // cupboard doors with knobs
      box(g, 0.44, 0.6, 0.02, '#fffaf0', x, 0.4, cz + 0.235).castShadow = false;
      ball(g, 0.02, P.pink, x + 0.15, 0.55, cz + 0.25, 0);
    }
    // The oven in the middle, with a warm glow in its window.
    box(g, 0.5, 0.6, 0.02, '#e8e2ea', -0.15, 0.4, cz + 0.235).castShadow = false;
    box(g, 0.36, 0.22, 0.02, new THREE.MeshBasicMaterial({ color: '#ffb86b' }), -0.15, 0.4, cz + 0.245).castShadow = false;
    box(g, 0.3, 0.025, 0.03, STEEL, -0.15, 0.62, cz + 0.255).castShadow = false;
    for (const dx of [-0.12, 0.12]) cyl(g, 0.07, 0.07, 0.015, 10, P.ink, -0.15 + dx, 0.83, cz);
    // On the counter: a mixing bowl with a spoon, the cookie jar, a rolling pin and a tray of cookies cooling.
    cyl(g, 0.15, 0.09, 0.12, 12, P.mint, -1.05, 0.88, cz);
    cyl(g, 0.012, 0.012, 0.26, 4, P.wood, -1.0, 0.98, cz).rotation.z = -0.4;
    cyl(g, 0.1, 0.1, 0.2, 10, '#e9f3ff', 0.5, 0.92, cz - 0.05);
    ball(g, 0.06, P.pink, 0.5, 1.04, cz - 0.05, 0).scale.y = 0.5; // its lid
    cyl(g, 0.035, 0.035, 0.4, 8, P.wood, -0.6, 0.85, cz + 0.1).rotation.z = Math.PI / 2;
    box(g, 0.4, 0.02, 0.28, STEEL, 0.15, 0.835, cz);
    for (let i = 0; i < 6; i++) cyl(g, 0.045, 0.045, 0.015, 8, '#d9a066', 0.02 + (i % 3) * 0.13, 0.85, cz - 0.07 + Math.floor(i / 3) * 0.14);
    // Shelves of jars above, and a window.
    for (const y of [1.35, 1.75]) {
      box(g, 0.9, 0.04, 0.2, P.wood, -0.95, y, WALL + 0.1);
      [P.pink, P.butter, P.mint, P.sky, P.peach].forEach((c, i) => {
        cyl(g, 0.055, 0.055, 0.14, 8, '#eef6ff', -1.3 + i * 0.18, y + 0.09, WALL + 0.1);
        cyl(g, 0.058, 0.058, 0.03, 8, c, -1.3 + i * 0.18, y + 0.175, WALL + 0.1);
      });
    }
    wallWindow(g, 0.45, 1.55, 0.7, 0.55);
    // A little table with cookies and milk, and two chairs.
    const tx = 1.05, tz = 0.15;
    cyl(g, 0.3, 0.3, 0.03, 14, P.peach, tx, 0.5, tz);
    cyl(g, 0.04, 0.07, 0.5, 8, P.wood, tx, 0.25, tz);
    cookies(g, tx - 0.06, 0.515, tz + 0.02);
    cyl(g, 0.035, 0.03, 0.12, 8, WHITE, tx + 0.16, 0.575, tz - 0.08);
    for (const side of [-1, 1]) {
      const c = new THREE.Group();
      box(c, 0.26, 0.04, 0.26, P.butter, 0, 0.3, 0);
      box(c, 0.26, 0.32, 0.04, P.butter, 0, 0.48, -0.12);
      for (const [lx, lz] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) box(c, 0.03, 0.3, 0.03, P.butter, lx, 0.15, lz);
      c.position.set(tx + side * 0.4, 0, tz);
      c.rotation.y = side * -Math.PI / 2;
      g.add(c);
    }
  },

  // The Dollmaker's Workshop (chapter 10): Lily's grandpa's workbench with a dollhouse half built on it, tools on a
  // pegboard, planks against the wall, paint pots, and a finished dollhouse on a shelf.
  workshop(g) {
    const bx = -0.35, bz = WALL + 0.3;
    box(g, 1.5, 0.08, 0.55, P.wood, bx, 0.78, bz); // the bench top
    for (const [lx, lz] of [[-0.68, -0.22], [0.68, -0.22], [-0.68, 0.22], [0.68, 0.22]]) box(g, 0.08, 0.74, 0.08, DARK_WOOD, bx + lx, 0.37, bz + lz);
    box(g, 1.4, 0.04, 0.48, DARK_WOOD, bx, 0.2, bz); // the low shelf
    box(g, 0.14, 0.1, 0.12, STEEL, bx + 0.65, 0.87, bz + 0.2); // a vise
    dollhouse(g, bx - 0.15, 0.82, bz, 0.5, [P.pink, P.lilac], true);
    for (let i = 0; i < 3; i++) box(g, 0.3, 0.025, 0.06, '#e8c89a', bx + 0.35, 0.835 + i * 0.026, bz + 0.05).rotation.y = i * 0.2; // little boards
    cyl(g, 0.05, 0.05, 0.1, 8, P.sky, bx + 0.45, 0.87, bz - 0.15); // a jar of brushes
    for (const dx of [-0.02, 0.02]) cyl(g, 0.006, 0.006, 0.18, 4, P.wood, bx + 0.45 + dx, 0.98, bz - 0.15).rotation.z = dx * 6;
    for (const [dx, c] of [[-0.45, P.pink], [-0.25, P.mint]]) cyl(g, 0.08, 0.08, 0.12, 10, c, bx + dx, 0.28, bz); // paint pots under the bench
    // The pegboard with tools.
    box(g, 1.3, 0.7, 0.02, '#e8c89a', bx, 1.45, WALL + 0.01).castShadow = false;
    box(g, 0.05, 0.3, 0.03, P.wood, bx - 0.45, 1.45, WALL + 0.04); // a hammer...
    box(g, 0.16, 0.06, 0.04, STEEL, bx - 0.45, 1.6, WALL + 0.04);
    box(g, 0.28, 0.14, 0.01, STEEL, bx - 0.1, 1.5, WALL + 0.04); // ...a saw...
    box(g, 0.1, 0.06, 0.03, RED, bx + 0.07, 1.5, WALL + 0.04);
    box(g, 0.025, 0.2, 0.025, STEEL, bx + 0.25, 1.42, WALL + 0.04); // ...screwdrivers...
    box(g, 0.04, 0.1, 0.04, P.butter, bx + 0.25, 1.57, WALL + 0.04);
    box(g, 0.025, 0.2, 0.025, STEEL, bx + 0.35, 1.42, WALL + 0.04);
    box(g, 0.04, 0.1, 0.04, P.sky, bx + 0.35, 1.57, WALL + 0.04);
    const tape = cyl(g, 0.06, 0.06, 0.04, 10, P.butter, bx + 0.52, 1.5, WALL + 0.04); // ...and a tape measure
    tape.rotation.x = Math.PI / 2;
    // Planks leaning on the wall, a stool, and a finished dollhouse on a shelf.
    for (let i = 0; i < 3; i++) {
      const plank = box(g, 0.12, 1.3, 0.03, ['#e8c89a', '#d7a877', '#c9955f'][i], 1.15 + i * 0.13, 0.62, WALL + 0.12);
      plank.rotation.z = -0.12;
    }
    cyl(g, 0.15, 0.15, 0.04, 10, P.wood, 0.55, 0.52, 0.15);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, leg = cyl(g, 0.02, 0.02, 0.52, 5, DARK_WOOD, 0.55 + Math.cos(a) * 0.1, 0.25, 0.15 + Math.sin(a) * 0.1);
      leg.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15);
    }
    box(g, 0.7, 0.04, 0.24, P.wood, 0.95, 1.6, WALL + 0.12);
    dollhouse(g, 0.95, 1.62, WALL + 0.12, 0.42, [P.mint, P.pink]);
    for (let i = 0; i < 6; i++) box(g, 0.05, 0.005, 0.02, '#f0d8b0', bx - 0.5 + i * 0.13, 0.005, 0.1 + (i % 3) * 0.08).rotation.y = i; // wood shavings
  },

  // The Blue Ribbon Room (chapter 11): the county fair's trophy on a pedestal behind velvet ropes, the giant blue ribbon
  // on the wall, framed certificates, a cabinet of smaller prizes, and blue bunting.
  ribbon(g) {
    box(g, 0.5, 0.75, 0.5, WHITE, 0, 0.375, -0.2); // the pedestal
    box(g, 0.58, 0.06, 0.58, P.sky, 0, 0.78, -0.2);
    trophy(g, 0, 0.81, -0.2, 0.62);
    rosette(g, 0, 1.78, WALL + 0.03, 0.3);
    // Velvet ropes on gold posts round the front.
    for (const x of [-0.6, 0.6]) {
      cyl(g, 0.1, 0.12, 0.04, 10, GOLD, x, 0.02, 0.35);
      cyl(g, 0.025, 0.025, 0.7, 6, GOLD, x, 0.37, 0.35);
      ball(g, 0.045, GOLD, x, 0.74, 0.35, 0);
    }
    const rope = mesh(g, new THREE.TorusGeometry(0.6, 0.025, 5, 16, Math.PI), RED, 0, 0.68, 0.35);
    rope.rotation.z = Math.PI;
    rope.scale.y = 0.35;
    box(g, 0.7, 0.012, 1.0, RED, 0, 0.006, 0.15).castShadow = false; // a red carpet up to it
    // Certificates on the left, a glass cabinet of smaller prizes on the right.
    picture(g, -1.0, 1.6, 0.38, 0.28, '#fffaf0');
    picture(g, -1.0, 1.15, 0.38, 0.28, '#fffaf0');
    for (const y of [1.6, 1.15]) {
      box(g, 0.22, 0.02, 0.01, P.ink, -1.0, y + 0.05, WALL + 0.03).castShadow = false;
      rosette(g, -0.88, y - 0.06, WALL + 0.04, 0.05);
    }
    const cx = 1.0, cz = WALL + 0.2; // an open cabinet: back, sides, top and shelves
    box(g, 0.75, 1.5, 0.03, DARK_WOOD, cx, 0.75, WALL + 0.03);
    for (const dx of [-0.36, 0.36]) box(g, 0.04, 1.5, 0.34, DARK_WOOD, cx + dx, 0.75, cz);
    box(g, 0.8, 0.05, 0.38, DARK_WOOD, cx, 1.52, cz);
    for (const y of [0.04, 0.4, 0.85, 1.25]) box(g, 0.7, 0.03, 0.32, y < 0.1 ? DARK_WOOD : P.wood, cx, y, cz);
    trophy(g, cx - 0.15, 0.415, cz, 0.3, STEEL);
    trophy(g, cx + 0.15, 0.865, cz, 0.28, GOLD);
    rosette(g, cx - 0.15, 1.05, cz + 0.05, 0.08);
    rosette(g, cx + 0.15, 1.45, cz + 0.05, 0.07);
    bunting(g, -1.4, 1.4, 2.55, [BLUE, WHITE, GOLD]);
    // Potted plants either side.
    for (const x of [-0.55, 0.55]) {
      cyl(g, 0.12, 0.1, 0.22, 8, WHITE, x, 0.11, -0.45);
      bush(g, x, -0.45, 0.16, [], 0.18);
    }
  },

  // Big leafy monsteras in pots (user, 2026-10-11), a plant stand with little pots, and hanging plants.
  garden(g) {
    monstera(g, -1.02, -0.22, 1.45, P.pink, 1);
    monstera(g, 1.05, -0.25, 1.2, P.cream, 2);
    monstera(g, 0.5, 0.22, 0.75, P.butter, 3);
    // A two-tier wooden plant stand at the back with little potted plants.
    const sx = -0.15, sz = -0.42;
    for (const [y, w] of [[0.32, 0.8], [0.66, 0.56]]) box(g, w, 0.04, 0.26, P.wood, sx, y, sz);
    for (const lx of [-0.38, 0.38]) box(g, 0.04, 0.34, 0.04, P.wood, sx + lx, 0.17, sz);
    for (const lx of [-0.26, 0.26]) box(g, 0.04, 0.34, 0.04, P.wood, sx + lx, 0.49, sz);
    monstera(g, sx - 0.24, sz, 0.38, P.sky, 4, 0.34);
    monstera(g, sx + 0.22, sz, 0.34, P.peach, 5, 0.34);
    monstera(g, sx, sz, 0.42, P.lilac, 6, 0.68);
    // Hanging plants with trailing vines.
    for (const [hx, hz, seed] of [[-0.55, -0.38, 7], [0.55, -0.45, 8]]) {
      const top = 2.75, y = 1.95;
      for (const dx of [-0.08, 0.08]) {
        const cord = cyl(g, 0.006, 0.006, top - y, 3, P.cream, hx + dx / 2, (top + y) / 2, hz);
        cord.rotation.z = dx;
        cord.castShadow = false;
      }
      cyl(g, 0.13, 0.09, 0.14, 10, P.cream, hx, y - 0.05, hz);
      for (let i = 0; i < 9; i++) {
        const a = i * 2.39 + seed, r = 0.1, len = 0.15 + ((i * 7 + seed) % 4) * 0.08;
        for (let k = 0; k < 4; k++) {
          ball(g, 0.045 - k * 0.004, k % 2 ? DARK_LEAF : LEAF_GREEN, hx + Math.cos(a) * (r + k * 0.015), y + 0.02 - len * (k / 3), hz + Math.sin(a) * (r + k * 0.015), 0);
        }
      }
    }
    // A watering can.
    cyl(g, 0.08, 0.09, 0.14, 10, P.mint, -0.45, 0.07, 0.3);
    const spout = cyl(g, 0.012, 0.02, 0.18, 6, P.mint, -0.33, 0.13, 0.3);
    spout.rotation.z = -1.0;
    const handle = mesh(g, new THREE.TorusGeometry(0.05, 0.012, 4, 10, Math.PI), P.mint, -0.47, 0.15, 0.3);
    handle.rotation.y = Math.PI / 2;
  },

  // Bookcases, armchairs, a window seat and a sleeping cat.
  reading(g) {
    // Two tall bookcases on the left.
    for (const x of [-1.2, -0.68]) {
      const w = 0.5, h = 1.6, d = 0.3, z = WALL + 0.18;
      box(g, w, h, 0.03, P.wood, x, h / 2, z - d / 2);
      box(g, 0.03, h, d, P.wood, x - w / 2, h / 2, z);
      box(g, 0.03, h, d, P.wood, x + w / 2, h / 2, z);
      for (let i = 0; i < 5; i++) box(g, w, 0.03, d, P.wood, x, 0.02 + i * 0.39, z);
      for (let i = 0; i < 4; i++) books(g, x, 0.035 + i * 0.39, z + 0.02, w);
    }
    // The window seat on the right: a window, a cushioned bench and pillows.
    wallWindow(g, 0.95, 1.2, 0.8, 0.6);
    box(g, 0.95, 0.38, 0.42, P.cream, 0.95, 0.19, -0.42);
    box(g, 0.9, 0.08, 0.38, P.sky, 0.95, 0.42, -0.42);
    ball(g, 0.12, P.pink, 0.6, 0.52, -0.5, 1).scale.set(1, 1, 0.5);
    ball(g, 0.12, P.butter, 1.3, 0.52, -0.5, 1).scale.set(1, 1, 0.5);
    cat(g, 0.95, 0.46, -0.4);
    // An armchair and a side table with a lamp and a cup of tea.
    armchair(g, -0.1, -0.15, 0.3, P.lilac);
    cyl(g, 0.16, 0.16, 0.03, 10, P.wood, 0.42, 0.5, 0.0);
    cyl(g, 0.03, 0.03, 0.5, 6, P.wood, 0.42, 0.25, 0.0);
    cyl(g, 0.04, 0.03, 0.06, 8, WHITE, 0.46, 0.54, 0.05);
    cyl(g, 0.02, 0.02, 0.35, 6, P.cream, 0.36, 0.69, -0.04);
    cyl(g, 0.07, 0.12, 0.13, 10, P.butter, 0.36, 0.88, -0.04);
    // A round rug and a stack of books on the floor.
    cyl(g, 0.5, 0.5, 0.015, 16, P.peach, -0.15, 0.01, 0.25).castShadow = false;
    for (let i = 0; i < 3; i++) box(g, 0.22 - i * 0.02, 0.05, 0.16, [RED, P.sky, P.mint][i], -0.75, 0.025 + i * 0.05, 0.3).rotation.y = i * 0.3;
  },

  // A rocking horse, building blocks, a play tent and a ball.
  playroom(g) {
    // The play tent at the back left: a pyramid with a flag.
    const tent = cone(g, 0.62, 1.1, 4, P.butter, -0.95, 0.55, -0.2);
    tent.rotation.y = Math.PI / 4;
    box(g, 0.32, 0.5, 0.02, P.pink, -0.95, 0.25, 0.24).castShadow = false; // the door flap
    cyl(g, 0.012, 0.012, 0.3, 4, P.wood, -0.95, 1.2, -0.2);
    const flag = cone(g, 0.06, 0.14, 3, RED, -0.89, 1.3, -0.2);
    flag.rotation.z = -Math.PI / 2;
    // A toy chest and bunting along the wall.
    box(g, 0.6, 0.34, 0.34, P.sky, 0.95, 0.17, -0.4);
    box(g, 0.64, 0.06, 0.38, P.lilac, 0.95, 0.37, -0.4);
    ball(g, 0.1, P.peach, 0.82, 0.48, -0.42, 1); // a teddy on top
    ball(g, 0.07, P.peach, 0.82, 0.63, -0.42, 1);
    bunting(g, -1.4, 1.4, 1.75, [P.pink, P.butter, P.mint, P.sky, P.lilac]);
    // The rocking horse in the middle.
    const horse = new THREE.Group();
    const rocker = mesh(horse, new THREE.TorusGeometry(0.5, 0.025, 4, 16, Math.PI * 0.55), P.wood, 0, 0.5, 0);
    rocker.rotation.z = Math.PI + Math.PI * 0.225;
    const rocker2 = rocker.clone();
    rocker.position.z = -0.12;
    rocker2.position.z = 0.12;
    horse.add(rocker2);
    box(horse, 0.5, 0.2, 0.2, WHITE, 0, 0.38, 0);
    for (const [lx, lz] of [[-0.18, -0.08], [0.18, -0.08], [-0.18, 0.08], [0.18, 0.08]]) box(horse, 0.05, 0.3, 0.05, WHITE, lx, 0.18, lz);
    const neck = box(horse, 0.14, 0.3, 0.14, WHITE, 0.24, 0.55, 0);
    neck.rotation.z = -0.4;
    box(horse, 0.24, 0.12, 0.13, WHITE, 0.36, 0.68, 0);
    box(horse, 0.05, 0.32, 0.16, P.pink, 0.2, 0.62, 0).rotation.z = -0.4; // mane
    box(horse, 0.2, 0.04, 0.22, RED, -0.02, 0.5, 0); // saddle
    cyl(horse, 0.02, 0.05, 0.2, 5, P.pink, -0.28, 0.42, 0).rotation.z = 1.0; // tail
    horse.position.set(0.05, 0, -0.1);
    horse.rotation.y = 0.35;
    g.add(horse);
    // Building blocks, stacked and scattered.
    const blocks = [[0.62, 0, 0.25, RED], [0.76, 0, 0.27, P.sky], [0.69, 1, 0.26, P.butter], [0.69, 2, 0.26, P.mint], [0.98, 0, 0.35, P.lilac], [0.45, 0, 0.42, P.pink]];
    blocks.forEach(([x, level, z, c], i) => box(g, 0.13, 0.13, 0.13, c, x, 0.065 + level * 0.13, z).rotation.y = i * 0.4);
    // A beach ball.
    ball(g, 0.15, P.butter, -0.35, 0.15, 0.35, 1);
    ball(g, 0.152, RED, -0.35, 0.15, 0.35, 1).scale.set(0.35, 1, 1);
  },

  // A table set for tea, cakes on a stand, bunting.
  teaparty(g) {
    bunting(g, -1.4, 1.4, 1.85, [P.pink, WHITE, P.mint, P.butter]);
    wallWindow(g, 0, 1.25, 0.7, 0.55);
    // A sideboard on the left with a cake.
    box(g, 0.7, 0.6, 0.34, P.cream, -1.05, 0.3, -0.42);
    box(g, 0.74, 0.04, 0.38, P.pink, -1.05, 0.62, -0.42);
    cyl(g, 0.16, 0.16, 0.02, 12, WHITE, -1.05, 0.65, -0.42);
    cyl(g, 0.13, 0.13, 0.14, 12, P.pink, -1.05, 0.73, -0.42);
    cyl(g, 0.135, 0.135, 0.03, 12, WHITE, -1.05, 0.81, -0.42);
    ball(g, 0.03, RED, -1.05, 0.85, -0.42, 0);
    // The round table with a cloth.
    const tx = 0.1, tz = -0.05, top = 0.5;
    cyl(g, 0.05, 0.08, top, 8, P.wood, tx, top / 2, tz);
    cyl(g, 0.46, 0.46, 0.03, 16, WHITE, tx, top, tz);
    cyl(g, 0.48, 0.5, 0.14, 16, P.pink, tx, top - 0.07, tz).castShadow = false;
    // Teapot, cups and a cake stand.
    ball(g, 0.1, P.sky, tx - 0.15, top + 0.1, tz - 0.1, 1).scale.y = 0.85;
    ball(g, 0.03, P.sky, tx - 0.15, top + 0.2, tz - 0.1, 0);
    const spout = cyl(g, 0.012, 0.025, 0.12, 6, P.sky, tx - 0.03, top + 0.12, tz - 0.1);
    spout.rotation.z = -0.9;
    for (const [cx, cz] of [[0.18, 0.18], [-0.2, 0.2], [0.3, -0.12]]) {
      cyl(g, 0.06, 0.06, 0.01, 10, WHITE, tx + cx, top + 0.02, tz + cz);
      cyl(g, 0.035, 0.025, 0.05, 8, WHITE, tx + cx, top + 0.05, tz + cz);
    }
    const sx = tx + 0.12, sz = tz - 0.14;
    cyl(g, 0.01, 0.01, 0.34, 5, P.butter, sx, top + 0.18, sz);
    [[0.14, 0.04], [0.1, 0.17], [0.07, 0.3]].forEach(([r, y], i) => {
      cyl(g, r, r, 0.012, 12, WHITE, sx, top + y, sz);
      const n = 3 - i;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + i;
        cupcake(g, sx + Math.cos(a) * r * 0.6, top + y, sz + Math.sin(a) * r * 0.6, [P.pink, P.mint, P.lilac][(k + i) % 3]);
      }
    });
    // Little chairs, with a teddy and a doll at the party.
    const chair = (x, z, rot, guest) => {
      const c = new THREE.Group();
      box(c, 0.3, 0.04, 0.3, WHITE, 0, 0.3, 0);
      box(c, 0.3, 0.36, 0.04, WHITE, 0, 0.5, -0.14);
      for (const [lx, lz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) box(c, 0.03, 0.3, 0.03, WHITE, lx, 0.15, lz);
      box(c, 0.26, 0.03, 0.26, P.pink, 0, 0.33, 0);
      if (guest) guest(c);
      c.position.set(x, 0, z);
      c.rotation.y = rot;
      g.add(c);
    };
    chair(tx - 0.62, tz, Math.PI / 2, (c) => { ball(c, 0.11, P.peach, 0, 0.44, 0, 1); ball(c, 0.08, P.peach, 0, 0.62, 0.02, 1); ball(c, 0.03, P.peach, -0.06, 0.69, 0, 0); ball(c, 0.03, P.peach, 0.06, 0.69, 0, 0); });
    chair(tx + 0.62, tz, -Math.PI / 2, (c) => { box(c, 0.14, 0.18, 0.1, P.lilac, 0, 0.44, 0); ball(c, 0.07, '#ffd9c2', 0, 0.6, 0, 1); ball(c, 0.075, P.butter, 0, 0.63, -0.02, 1); });
    chair(tx, tz - 0.55, 0);
    // A potted rose bush on the right.
    cyl(g, 0.15, 0.12, 0.26, 8, P.cream, 1.2, 0.13, -0.35);
    bush(g, 1.2, -0.35, 0.2, [RED, P.pink, RED, P.pink], 0.2);
  },
};
