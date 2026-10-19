// Fixture models. Each is built at the origin, standing on y = 0, with its front facing +z.

import * as THREE from 'three';
import { box, cyl, ball, mesh, prism } from './prims.js';
import { PALETTE as P, toon, gradientMap } from '../toon.js';
import { FIXTURES } from '../../data/fixtures.js';
import { STAIRS, FLOOR_H } from '../../sim/route.js';
import { SCENES } from './scenes.js';
import { parrot, PARROTS } from './critters.js';
import { surfboard, shells } from './beach.js';

/** Heights of the shelf boards that items will sit on (used when stocking); the last is the top, for Tall Shelves. */
export const SHELF_LEVELS = [0.06, 0.58, 1.1, 1.6];

const BUILDERS = {
  shelf(g) {
    const { w, h } = FIXTURES.shelf.size;
    const hh = h - 0.05;
    box(g, 0.06, hh, 0.42, P.cream, -w / 2, hh / 2, 0);
    box(g, 0.06, hh, 0.42, P.cream, w / 2, hh / 2, 0);
    box(g, w, hh, 0.03, '#f9e6ee', 0, hh / 2, -0.2);
    for (const y of SHELF_LEVELS.slice(0, 3)) box(g, w, 0.05, 0.42, P.cream, 0, y, 0);
    box(g, w + 0.08, 0.06, 0.46, P.cream, 0, hh, 0);
    box(g, w * 0.5, 0.12, 0.02, P.pink, 0, hh - 0.1, 0.2); // little sign strip
  },

  counter(g) {
    // Kept low so the shopkeeper's head and shoulders show above it.
    const { w, d } = FIXTURES.counter.size;
    const top = 0.48;
    box(g, w, top - 0.03, d, P.wood, 0, (top - 0.03) / 2, 0);
    box(g, w - 0.12, 0.28, 0.02, '#e4b98e', 0, 0.23, d / 2 + 0.005);
    box(g, w + 0.1, 0.06, d + 0.08, P.cream, 0, top, 0);
    // register
    box(g, 0.26, 0.2, 0.25, P.pink, 0.33, top + 0.13, -0.02);
    const screen = box(g, 0.2, 0.12, 0.03, P.sky, 0.33, top + 0.27, -0.12);
    screen.rotation.x = -0.3;
    box(g, 0.18, 0.03, 0.12, P.cream, 0.33, top + 0.24, 0.08);
    // little bell
    cyl(g, 0.05, 0.07, 0.06, 8, P.butter, -0.32, top + 0.06, 0.08);
  },

  // The Dream Dollhouse itself stands on top, drawn with what's in it by render/views/dollhouse.js.
  pedestal(g) {
    cyl(g, 0.42, 0.46, 0.4, 10, P.cream, 0, 0.2, 0);
    cyl(g, 0.46, 0.46, 0.04, 10, P.pink, 0, 0.42, 0);
  },

  // A shelf room's showcase stand (GDD #96); render/views/showcases.js puts the item on top.
  showcase(g) {
    cyl(g, 0.2, 0.22, 0.06, 12, P.cream, 0, 0.03, 0);
    cyl(g, 0.11, 0.14, 0.74, 12, P.cream, 0, 0.43, 0);
    cyl(g, 0.21, 0.19, 0.08, 12, P.pink, 0, 0.84, 0);
  },

  // The room's corner piece (GDD #68): a plant unless restyled.
  plant(g, look) {
    CORNERS[look?.corner.id] ? CORNERS[look.corner.id](g) : CORNERS.plant(g);
  },

  // The Stairwell's spiral staircase (GDD #58): wedge steps once around a pole, rising a floor. Built
  // around the pole; people walk up it at STAIRS.radius (sim/route.js), starting toward +x and turning
  // the same way as Object3D.rotation.y.
  stairs(g) {
    const n = STAIRS.steps;
    cyl(g, 0.06, 0.06, FLOOR_H + 0.8, 8, P.cream, 0, (FLOOR_H + 0.8) / 2, 0);
    for (let i = 0; i < n; i++) {
      const step = new THREE.Group();
      step.rotation.y = ((i + 0.5) / n) * Math.PI * 2;
      const top = ((i + 0.5) / n) * FLOOR_H;
      box(step, 0.56, 0.07, 0.26, i % 2 ? P.wood : '#e4b98e', 0.34, top - 0.035, 0);
      cyl(step, 0.02, 0.02, 0.7, 5, P.cream, 0.6, top + 0.35, 0);
      g.add(step);
    }
  },

  // The top of the stairs upstairs: a railing around the hole, open where the stairs come up.
  stairhole(g) {
    const half = FIXTURES.stairhole.size.w / 2, h = 0.7, gap = 0.3;
    const rail = (x, z, w, d) => {
      box(g, w, 0.05, d, P.cream, x, h, z);
      box(g, 0.05, h, 0.05, P.cream, x + (w > d ? w / 2 : 0), h / 2, z + (d > w ? d / 2 : 0));
      box(g, 0.05, h, 0.05, P.cream, x - (w > d ? w / 2 : 0), h / 2, z - (d > w ? d / 2 : 0));
    };
    rail(0, half, 2 * half, 0.05);                         // along the front
    rail(half, (half + gap) / 2, 0.05, half - gap);        // the right side, front of the gap...
    rail(half, -(half + gap) / 2, 0.05, half - gap);       // ...and behind it
  },

  // A decoration room's scene (GDD #108), by the room's look.
  scene(g, look) {
    (SCENES[look?.scene?.id] ?? SCENES.garden)(g);
  },

  rug(g, look) {
    const rug = look?.rug ?? { shape: 'round', color: P.lilac, color2: '#ddd1ff' };
    RUGS[rug.shape]?.(g, rug.color, rug.color2);
  },
};

/** Build a fixture; `look` is the room's style (data/decor.js roomLook) for its rug and corner piece. */
export function buildFixture(kind, look = null) {
  const g = new THREE.Group();
  BUILDERS[kind](g, look);
  return g;
}

/** A flat rug piece: a shape extruded 0.02 up, lying on the floor. */
function flat(g, shape, color, y) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false, curveSegments: 10 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, toon(color));
  m.position.y = y;
  m.receiveShadow = true;
  g.add(m);
}

function heartShape(r) {
  const s = new THREE.Shape();
  s.moveTo(0, -r * 0.9);
  s.bezierCurveTo(-r * 1.6, r * 0.2, -r * 0.6, r * 1.3, 0, r * 0.45);
  s.bezierCurveTo(r * 0.6, r * 1.3, r * 1.6, r * 0.2, 0, -r * 0.9);
  return s;
}

function starShape(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return s;
}

/** Rug shapes (GDD #68), about 1.4 across like the walkable rug footprint. */
/** A half circle, flat side to the back (a hearth rug). */
function halfShape(r) {
  const s = new THREE.Shape();
  s.moveTo(-r, 0.3);
  s.absarc(0, 0.3, r, Math.PI, Math.PI * 2, false);
  s.closePath();
  return s;
}

const RUGS = {
  none() {},
  hearth(g, a, b) { // the Christmas pack's fireplace rug (GDD #116): red with a green border inside, a gold fringe
    flat(g, halfShape(0.82), b, 0.01);
    flat(g, halfShape(0.7), a, 0.015);
    for (let i = 0; i <= 10; i++) {
      const t = Math.PI + (i / 10) * Math.PI;
      ball(g, 0.03, '#ffcf4a', Math.cos(t) * 0.86, 0.025, -Math.sin(t) * 0.86 - 0.3, 0).castShadow = false;
    }
  },
  petals(g, a, b) { // the Fairy pack's flower-petal rug (GDD #161): two rings of pointed petals and a butter middle
    for (const [k, c, y, off] of [[1, a, 0.03, 0], [0.62, b, 0.035, Math.PI / 8]]) { // flat petals, above the floor's top (0.02)
      for (let i = 0; i < 8; i++) {
        const t = off + (i / 8) * Math.PI * 2;
        const petal = new THREE.Shape();
        petal.moveTo(0, 0);
        petal.quadraticCurveTo(0.2 * k, 0.4 * k, 0, 0.78 * k);
        petal.quadraticCurveTo(-0.2 * k, 0.4 * k, 0, 0);
        const geo = new THREE.ShapeGeometry(petal, 6);
        geo.rotateX(-Math.PI / 2);
        geo.rotateY(t);
        const m = new THREE.Mesh(geo, toon(c));
        m.position.y = y;
        m.receiveShadow = true;
        g.add(m);
      }
    }
    cyl(g, 0.16, 0.16, 0.024, 12, '#ffd98a', 0, 0.032, 0).castShadow = false;
  },
  tiger(g, a, b) { // the Jungle pack's tiger-stripe rug (GDD #161): an orange oval with dark stripes from both edges
    const base = cyl(g, 0.75, 0.75, 0.02, 18, a, 0, 0.02, 0);
    base.scale.z = 0.62;
    base.castShadow = false;
    for (let i = -3; i <= 3; i++) {
      const x = i * 0.2, edge = 0.62 * 0.75 * Math.sqrt(Math.max(0, 1 - (x / 0.75) ** 2));
      for (const side of [-1, 1]) {
        const len = edge * 0.55, stripe = box(g, 0.05, 0.022, len, b, x + side * 0.02, 0.022, side * (edge - len / 2 - 0.01));
        stripe.rotation.y = side * 0.25;
        stripe.castShadow = false;
      }
    }
  },
  planet(g, a, b) { // the Space pack's ringed-planet rug (GDD #161): a round planet with soft bands, a flat ring round it
    const ring = mesh(g, new THREE.TorusGeometry(0.72, 0.07, 3, 32), b, 0, 0.02, 0);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1, 0.55, 0.25); // squashed flat into an oval
    ring.rotation.z = 0.35;
    ring.castShadow = false;
    cyl(g, 0.48, 0.48, 0.02, 18, a, 0, 0.022, 0).castShadow = false;
    for (const [dz, w] of [[-0.18, 0.08], [0.12, 0.1]]) {
      const half = Math.sqrt(0.48 ** 2 - dz ** 2);
      box(g, half * 2 - 0.04, 0.023, w, '#d9c4ff', 0, 0.023, dz).castShadow = false; // soft bands
    }
  },
  sun(g, a, b) { // the Beach pack's sunshine rug (GDD #166): a round yellow sun with pointed orange rays and a smiley face
    const rays = new THREE.Shape();
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * Math.PI * 2, rr = i % 2 ? 0.48 : 0.72;
      i ? rays.lineTo(Math.cos(t) * rr, Math.sin(t) * rr) : rays.moveTo(Math.cos(t) * rr, Math.sin(t) * rr);
    }
    flat(g, rays, b, 0.01); // top at 0.03, clear of the floor's top (0.02)
    cyl(g, 0.5, 0.5, 0.022, 20, a, 0, 0.022, 0).castShadow = false;
    for (const side of [-1, 1]) cyl(g, 0.045, 0.045, 0.024, 8, '#5a3a55', side * 0.16, 0.024, -0.08).castShadow = false; // eyes
    const smile = mesh(g, new THREE.TorusGeometry(0.2, 0.025, 4, 14, Math.PI * 0.7), '#5a3a55', 0, 0.034, 0.0);
    smile.rotation.set(-Math.PI / 2, 0, Math.PI * 1.15); // a flat arc, curving down toward the front
    smile.castShadow = false;
    for (const side of [-1, 1]) cyl(g, 0.06, 0.06, 0.023, 8, '#ff9fb0', side * 0.27, 0.023, 0.08).castShadow = false; // cheeks
  },
  scallop(g, a, b) { // the Welcome pack's princess rug (GDD #135): a pink circle with a scalloped edge, a purple band, a pink middle
    cyl(g, 0.62, 0.62, 0.02, 20, a, 0, 0.02, 0).castShadow = false; // top at 0.03, clear of the floor's top (0.02)
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      cyl(g, 0.11, 0.11, 0.02, 10, a, Math.cos(t) * 0.62, 0.02, Math.sin(t) * 0.62).castShadow = false;
    }
    cyl(g, 0.5, 0.5, 0.022, 20, b, 0, 0.022, 0).castShadow = false;
    cyl(g, 0.34, 0.34, 0.024, 20, a, 0, 0.024, 0).castShadow = false;
    cyl(g, 0.1, 0.1, 0.026, 10, b, 0, 0.026, 0).castShadow = false;
  },
  round(g, a, b) {
    const outer = cyl(g, 0.7, 0.7, 0.02, 14, a, 0, 0.02, 0);
    const inner = cyl(g, 0.5, 0.5, 0.022, 14, b, 0, 0.022, 0);
    outer.castShadow = inner.castShadow = false;
  },
  rect(g, a, b) {
    box(g, 1.5, 0.02, 1.0, b, 0, 0.02, 0).castShadow = false;
    for (let i = 0; i < 4; i++) box(g, 0.2, 0.022, 1.0, a, -0.6 + i * 0.4, 0.021, 0).castShadow = false;
  },
  heart(g, a, b) {
    flat(g, heartShape(0.62), a, 0.01);
    flat(g, heartShape(0.42), b, 0.015);
  },
  star(g, a, b) {
    flat(g, starShape(0.78), a, 0.01);
    flat(g, starShape(0.5), b, 0.015);
  },
  flower(g, a, b) {
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2;
      cyl(g, 0.3, 0.3, 0.02, 12, a, Math.cos(t) * 0.38, 0.02, Math.sin(t) * 0.38).castShadow = false;
    }
    cyl(g, 0.32, 0.32, 0.024, 12, b, 0, 0.022, 0).castShadow = false;
  },
};

const GUMBALL_GLASS = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap, transparent: true, opacity: 0.45 });
// Glowing mushroom caps (the Fairy pack): unlit, so they shine at night like the lamps' bulbs.
const GLOW_PINK = new THREE.MeshBasicMaterial({ color: '#ffb3dc' }), GLOW_BLUE = new THREE.MeshBasicMaterial({ color: '#a8ecff' }), GLOW_LILAC = new THREE.MeshBasicMaterial({ color: '#dcc8ff' });

/** Corner pieces (GDD #68), each fitting the plant's footprint (FIXTURES.plant). */
const CORNERS = {
  plant(g) {
    cyl(g, 0.18, 0.14, 0.3, 8, P.brick, 0, 0.15, 0);
    ball(g, 0.3, P.leaf, 0, 0.5, 0, 0);
    ball(g, 0.2, P.leafLight, 0.12, 0.72, 0.05, 0);
    ball(g, 0.06, P.pink, -0.18, 0.62, 0.18, 0);
  },
  fern(g) {
    cyl(g, 0.17, 0.13, 0.28, 8, P.cream, 0, 0.14, 0);
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Group();
      leaf.rotation.y = (i / 7) * Math.PI * 2;
      const blade = box(leaf, 0.09, 0.03, 0.5, i % 2 ? P.leaf : P.leafLight, 0, 0, 0.2);
      blade.rotation.x = -0.6;
      leaf.position.y = 0.42;
      g.add(leaf);
    }
  },
  cactus(g) {
    cyl(g, 0.16, 0.13, 0.24, 8, P.peach, 0, 0.12, 0);
    cyl(g, 0.11, 0.11, 0.5, 8, '#7cc59a', 0, 0.48, 0);
    ball(g, 0.11, '#7cc59a', 0, 0.73, 0, 1);
    cyl(g, 0.06, 0.06, 0.22, 6, '#7cc59a', 0.15, 0.55, 0).rotation.z = -0.5;
    ball(g, 0.05, P.pink, 0, 0.85, 0, 0);
  },
  flowers(g) {
    cyl(g, 0.1, 0.13, 0.36, 8, P.sky, 0, 0.18, 0);
    for (const [x, z, c] of [[0, 0, P.pink], [0.1, 0.06, P.butter], [-0.1, 0.05, P.lilac], [0.04, -0.1, P.peach], [-0.05, -0.06, P.pink]]) {
      cyl(g, 0.012, 0.012, 0.3, 4, P.leaf, x * 0.6, 0.5, z * 0.6);
      ball(g, 0.075, c, x, 0.68, z, 0);
    }
  },
  lamp(g) {
    cyl(g, 0.16, 0.18, 0.04, 10, P.cream, 0, 0.02, 0);
    cyl(g, 0.02, 0.02, 1.1, 6, P.cream, 0, 0.57, 0);
    cyl(g, 0.12, 0.22, 0.26, 10, P.butter, 0, 1.2, 0);
  },
  books(g) {
    const w = 0.42, h = 0.95, d = 0.32;
    box(g, w, h, 0.03, P.wood, 0, h / 2, -d / 2 + 0.015);
    box(g, 0.03, h, d, P.wood, -w / 2, h / 2, 0);
    box(g, 0.03, h, d, P.wood, w / 2, h / 2, 0);
    for (const y of [0.02, 0.33, 0.64, h]) box(g, w, 0.03, d, P.wood, 0, y, 0);
    const colors = [P.pink, P.sky, P.butter, P.mint, P.lilac, P.peach];
    for (let shelf = 0; shelf < 3; shelf++) {
      for (let i = 0; i < 5; i++) {
        const bh = 0.2 + ((i * 7 + shelf * 3) % 4) * 0.02;
        box(g, 0.06, bh, 0.22, colors[(i + shelf * 2) % colors.length], -0.15 + i * 0.075, 0.035 + shelf * 0.31 + bh / 2, 0.02);
      }
    }
  },
  balloons(g) {
    cyl(g, 0.08, 0.1, 0.08, 8, P.ink, 0, 0.04, 0);
    for (const [x, y, z, c] of [[0, 1.2, 0, P.pink], [-0.15, 1.05, 0.05, P.sky], [0.15, 1.08, -0.04, P.butter], [0.02, 0.98, 0.14, P.lilac]]) {
      const string = cyl(g, 0.006, 0.006, y - 0.1, 3, P.cream, x / 2, (y - 0.1) / 2 + 0.06, z / 2);
      string.castShadow = false;
      ball(g, 0.14, c, x, y, z, 1).scale.y = 1.15;
    }
  },
  xmastree(g) { // the Christmas pack's little tree (GDD #116): three tiers, baubles, a star, presents
    cyl(g, 0.14, 0.12, 0.18, 8, '#d8283f', 0, 0.09, 0);
    cyl(g, 0.04, 0.04, 0.12, 6, P.trunk, 0, 0.22, 0);
    const tiers = [[0.36, 0.42, 0.45], [0.28, 0.36, 0.7], [0.18, 0.3, 0.92]];
    for (const [r, h, y] of tiers) mesh(g, new THREE.ConeGeometry(r, h, 8), '#2f8a4e', 0, y, 0);
    const baubles = ['#d8283f', '#ffcf4a', '#5ad1ff', '#ff9be0'];
    for (let i = 0; i < 9; i++) {
      const [r, , y] = tiers[i % 3], a = i * 2.4;
      ball(g, 0.035, baubles[i % 4], Math.cos(a) * r * 0.62, y - 0.08, Math.sin(a) * r * 0.62, 0).castShadow = false;
    }
    mesh(g, new THREE.OctahedronGeometry(0.07), '#ffcf4a', 0, 1.1, 0).castShadow = false;
    box(g, 0.14, 0.12, 0.14, '#c8b6ff', 0.25, 0.06, 0.2).castShadow = false;
    box(g, 0.12, 0.1, 0.12, '#ffd98a', -0.24, 0.05, 0.22).castShadow = false;
  },
  glowshrooms(g) { // the Fairy pack's glowing mushrooms (GDD #161): a mossy mound with toadstools whose caps glow
    const mound = ball(g, 0.3, '#7cc77a', 0, 0.02, 0, 0);
    mound.scale.set(1, 0.35, 0.9);
    for (const [x, z, h, r, cap] of [[0, -0.02, 0.5, 0.17, GLOW_PINK], [-0.18, 0.1, 0.3, 0.11, GLOW_BLUE], [0.17, 0.08, 0.36, 0.12, GLOW_LILAC], [0.06, 0.18, 0.18, 0.08, GLOW_BLUE]]) {
      cyl(g, r * 0.3, r * 0.4, h, 6, '#fff3e0', x, h / 2, z);
      const c = mesh(g, new THREE.SphereGeometry(r, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), cap, x, h - 0.01, z);
      c.scale.y = 0.75;
      c.castShadow = false;
    }
  },
  parrot(g) { // the Jungle pack's parrot on a perch (GDD #161): a stand with a crossbar, a food cup and a red parrot
    cyl(g, 0.16, 0.18, 0.04, 10, '#8a6a4a', 0, 0.02, 0);
    cyl(g, 0.025, 0.025, 1.0, 6, '#a9744f', 0, 0.52, 0);
    const bar = cyl(g, 0.02, 0.02, 0.5, 6, '#a9744f', 0, 1.02, 0);
    bar.rotation.z = Math.PI / 2;
    cyl(g, 0.06, 0.045, 0.06, 8, '#3d9cf0', 0.22, 1.06, 0).castShadow = false; // the food cup
    const bird = new THREE.Group();
    parrot(bird, PARROTS.red, 1.2);
    bird.position.set(-0.08, 1.03, 0);
    bird.rotation.y = 0.35;
    g.add(bird);
  },
  telescope(g) { // the Space pack's telescope (GDD #161): a brass tube tipped up on a three-legged stand
    // Corner spots sit ~0.17 from the walls, so everything stays within that of the middle.
    const UP = new THREE.Vector3(0, 1, 0), top = new THREE.Vector3(0, 0.78, 0);
    const along = (part, from, to) => { // stand a y-axis cylinder between two points
      part.position.copy(from).add(to).multiplyScalar(0.5);
      part.quaternion.setFromUnitVectors(UP, to.clone().sub(from).normalize());
      return part;
    };
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const foot = new THREE.Vector3(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15);
      along(cyl(g, 0.018, 0.018, foot.distanceTo(top), 5, '#5a4a5e'), foot, top);
    }
    ball(g, 0.05, '#5a4a5e', 0, 0.78, 0, 0);
    // Tipped up toward the front and a little sideways, so it shows from the front and never pokes into a wall.
    const dir = new THREE.Vector3(0.3, 0.87, 0.39).normalize(), pivot = new THREE.Vector3(0, 0.84, 0);
    const front = pivot.clone().addScaledVector(dir, 0.3), back = pivot.clone().addScaledVector(dir, -0.2);
    along(cyl(g, 0.06, 0.045, 0.5, 10, '#d9a441'), back, front);
    const lens = along(cyl(g, 0.065, 0.065, 0.04, 10, '#8a6a2a'), front, front.clone().addScaledVector(dir, 0.04));
    lens.castShadow = false;
    along(cyl(g, 0.025, 0.025, 0.1, 6, '#5a4a5e'), back.clone().addScaledVector(dir, -0.08), back);
  },
  surfboard(g) { // the Beach pack's surfboard (GDD #166): standing on its tail against the wall, shells at its foot
    surfboard(g, 0, 0, -0.08, 1.05, '#3fb6e0', '#ffffff', 0.12, 0.1);
    shells(g, 0, 0, 0.14);
  },
  gumball(g) {
    cyl(g, 0.14, 0.18, 0.4, 8, P.pink, 0, 0.2, 0);
    cyl(g, 0.15, 0.15, 0.05, 8, P.cream, 0, 0.42, 0);
    const glass = ball(g, 0.2, GUMBALL_GLASS, 0, 0.62, 0, 2);
    glass.castShadow = false;
    const colors = [P.pink, P.butter, P.mint, P.sky, P.lilac, P.peach];
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, r = 0.1 + (i % 3) * 0.02;
      ball(g, 0.04, colors[i % colors.length], Math.cos(a) * r * 0.9, 0.5 + (i % 4) * 0.05, Math.sin(a) * r * 0.9, 0);
    }
    box(g, 0.08, 0.06, 0.04, P.cream, 0, 0.26, 0.17);
    box(g, 0.1, 0.06, 0.06, '#e0679a', 0, 0.82, 0);
  },
};

/**
 * The Dream Dollhouse on its pedestal: an open-front house, `cols` rooms across and as many storeys,
 * 2 × 2 or, with the Bigger Dream Dollhouse (GDD #92), 3 × 3. Its furniture is whatever the player places
 * (render/views/dollhouse.js). Sizes are in the house's own units (rooms are always 0.45 across); it sits
 * `y` above the pedestal base, scaled by `scale`. `roof` is the roof's height.
 */
export const DOLLHOUSE = { cols: 2, w: 0.9, h: 0.9, d: 0.5, t: 0.04, y: 0.44, scale: 0.85, roof: 0.42 };
export const BIG_DOLLHOUSE = { ...DOLLHOUSE, cols: 3, w: 1.35, h: 1.35, scale: 0.72, roof: 0.6 };

export const dollhouseShape = (big) => (big ? BIG_DOLLHOUSE : DOLLHOUSE);

/** Floor-center of a room inside the house (house units), by [column, storey]. */
export function dollhouseCell(shape, [col, storey]) {
  const { cols, w, h, t } = shape;
  return { x: (col - (cols - 1) / 2) * (w / cols), y: storey * (h / cols) + t / 2, z: 0.02 };
}

// A different wallpaper in each room, by [column, storey]; the first four are the small house's.
const PAPERS = { '0,0': P.mint, '1,0': '#fff3c9', '0,1': P.lilac, '1,1': '#ffe1ec' };
const PAPERS3 = {
  '0,0': P.mint, '1,0': '#ffe9d6', '2,0': '#fff3c9',
  '0,1': P.lilac, '1,1': '#dff1ff', '2,1': '#ffe1ec',
  '0,2': '#fde2f3', '1,2': '#e8e0ff', '2,2': '#e4f7d9',
};

export function dreamDollhouse(shape = DOLLHOUSE) {
  const g = new THREE.Group();
  const { cols, w, h, d, t, roof } = shape;
  const cw = w / cols, ch = h / cols;
  const papers = cols === 3 ? PAPERS3 : PAPERS;
  box(g, w, h, t, '#fff0f6', 0, h / 2, -d / 2);
  for (let c = 0; c < cols; c++) {
    for (let st = 0; st < cols; st++) {
      const x = (c - (cols - 1) / 2) * cw;
      box(g, cw - t, ch - t, 0.01, papers[`${c},${st}`], x, ch / 2 + st * ch, -d / 2 + t / 2 + 0.005);
    }
  }
  for (let c = 0; c <= cols; c++) box(g, t, h, d, P.pink, -w / 2 + c * cw, h / 2, 0);
  for (let st = 0; st <= cols; st++) box(g, w + t, t, d + 0.02, P.cream, 0, st * ch, 0);
  prism(g, w + 0.18, roof, d + 0.12, P.roof).position.y = h + t / 2;
  box(g, 0.1, 0.22, 0.1, P.brick, w * 0.28, h + roof / 2 + 0.08, -0.05);
  return g;
}

/** An invisible box covering a fixture, so taps land on it reliably. */
export function fixtureHitbox(kind) {
  const { w, d, h } = FIXTURES[kind].size;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
  m.position.y = h / 2;
  return m;
}
