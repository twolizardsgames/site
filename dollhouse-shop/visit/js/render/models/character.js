// Chunky bean-shaped characters: big head, rosy cheeks, simple hair styles, and an optional
// accessory. Girls' hair: bob, bun, pigtails, ponytail; boys' (GDD #43): short, spiky, curly, swoop.
// Accessories: bow, glasses, sun hat, bow tie, cap; theme rewards (GDD #70, #79): flower crown, bunny ears, crown, kitty ears;
// the Christmas pack (GDD #116): Santa hat, elf ears, reindeer antlers, and the Christmas sweater and elf outfits;
// the Fairy pack (GDD #161): fairy ears and the fairy dress (with wings); the Jungle pack: a safari hat and the explorer outfit;
// the Space pack: the astronaut suit, a bubble helmet and alien antennae. Shoppers wear little wings in the Fairy Garden.
// `root` is moved and turned; `inner` is bobbed and wobbled for walk/idle animation.

import * as THREE from 'three';
import { mesh, box, ball, cyl, mergeStatic, mergeColors } from './prims.js';
import { PALETTE as P } from '../toon.js';
import { outfitColor } from '../../data/customers.js';

const GOLD = '#ffd24d', GEM = '#ff7fb0', EAR = '#fff6ee', EAR_IN = '#ffb8d0', LEAF = '#8fd19e';
const FLOWERS = ['#ff9ec4', '#ffd98a', '#c8b6ff', '#fff6ee'];
// Theme reward accessories come in bolder colors for the color rounds (GDD #77): 'flowers2', 'crown3', ...
const TINTS = {
  flowers: { flowers: FLOWERS, leaf: LEAF },
  flowers2: { flowers: ['#ff5a5f', '#ff9f1c', '#ffd21f', '#ff3d8b'], leaf: '#5fbf6a' },
  flowers3: { flowers: ['#c2185b', '#1fa36b', '#2546b8', '#e8b923'], leaf: '#2e8b57' },
  bunny: { ear: EAR, inner: EAR_IN },
  bunny2: { ear: '#ff8fc8', inner: '#fff06a' },
  bunny3: { ear: '#2b2d6e', inner: '#e8b923' },
  crown: { gold: GOLD, gem: GEM },
  crown2: { gold: GOLD, gem: '#d0103a' },
  crown3: { gold: '#dfe6ef', gem: '#8fe3ff' },
  kitty: { ear: '#5a4a5e', inner: EAR_IN },
  kitty2: { ear: '#ff9a3c', inner: '#ffe0c2' },
  kitty3: { ear: '#c9cfd8', inner: '#2546b8' },
};
// The bubble helmet's glass (Space pack): see-through, so it stays its own mesh.
const HELMET_GLASS = new THREE.MeshLambertMaterial({ color: '#d6f2ff', transparent: true, opacity: 0.3, depthWrite: false });
const EYE = '#3a2a3a', CHEEK = '#ff9fb0', SHOE = '#5a3a55', BOW = '#ff7fb0', FRAMES = '#5a3a55', CAP = '#8fc8f0', BRIM = '#6fb0e0';

/** Grown-up size relative to the room; kids can pass a smaller scale. */
export const CHARACTER_SCALE = 1.15;

export function createCharacter({ hair = 'bob', hairColor = '#6b3e2e', skin = '#ffd9c2', outfit = '#ff9ec4', accessory = 'none', apron = false, winter = null, wings = null, scale = CHARACTER_SCALE } = {}) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);

  const style = outfit;
  outfit = outfitColor(outfit);
  mesh(inner, new THREE.CapsuleGeometry(0.2, 0.22, 3, 8), outfit, 0, 0.33, 0);
  ball(inner, 0.075, outfit, -0.22, 0.36, 0);
  ball(inner, 0.075, outfit, 0.22, 0.36, 0);
  outfitTrim(inner, style);
  ball(inner, 0.07, SHOE, -0.08, 0.04, 0.02, 0);
  ball(inner, 0.07, SHOE, 0.08, 0.04, 0.02, 0);
  if (apron) {
    box(inner, 0.3, 0.3, 0.05, P.cream, 0, 0.3, 0.18);
    box(inner, 0.12, 0.06, 0.02, P.pink, 0, 0.33, 0.21);
  }

  ball(inner, 0.25, skin, 0, 0.82, 0);
  ball(inner, 0.035, EYE, -0.085, 0.84, 0.225, 0);
  ball(inner, 0.035, EYE, 0.085, 0.84, 0.225, 0);
  ball(inner, 0.04, CHEEK, -0.15, 0.77, 0.19, 0).scale.z = 0.4;
  ball(inner, 0.04, CHEEK, 0.15, 0.77, 0.19, 0).scale.z = 0.4;

  const capLength = Math.PI * (hair === 'bob' ? 0.62 : hair === 'short' || hair === 'spiky' ? 0.42 : 0.5);
  const cap = mesh(inner, new THREE.SphereGeometry(0.27, 10, 6, 0, Math.PI * 2, 0, capLength), hairColor, 0, 0.83, -0.02);
  if (hair === 'bob') cap.rotation.x = -0.45;
  if (hair === 'bun') ball(inner, 0.12, hairColor, 0, 1.1, -0.05);
  if (hair === 'pigtails') {
    ball(inner, 0.1, hairColor, -0.27, 0.86, -0.06);
    ball(inner, 0.1, hairColor, 0.27, 0.86, -0.06);
  }
  if (hair === 'ponytail') { // tied high on one side, so it shows from the front
    ball(inner, 0.08, hairColor, 0.2, 1.0, -0.06);
    const tail = ball(inner, 0.085, hairColor, 0.3, 0.84, -0.06);
    tail.scale.set(0.9, 1.7, 0.9);
    tail.rotation.z = 0.35;
  }
  const capped = accessory === 'cap'; // hair on top stays under the cap; fringes peek out below the brim
  const fringeY = capped ? 0.93 : 1.0;
  if (hair === 'short') { // a soft fringe over the forehead
    ball(inner, 0.13, hairColor, 0.04, fringeY, 0.13).scale.set(1.5, 0.55, 0.8);
  }
  if (hair === 'spiky' && !capped) {
    for (const [x, z, tilt] of [[-0.14, 0.05, 0.5], [-0.05, 0.12, 0.2], [0.06, 0.12, -0.2], [0.15, 0.04, -0.5], [0, -0.06, 0]]) {
      const spike = mesh(inner, new THREE.ConeGeometry(0.075, 0.17, 6), hairColor, x, 1.06, z);
      spike.rotation.z = tilt;
      spike.rotation.x = z * 2;
    }
  }
  if (hair === 'curly') { // a ring of curls around the top
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      ball(inner, 0.085, hairColor, Math.sin(a) * 0.2, 1.0 + Math.cos(a * 2) * 0.02, Math.cos(a) * 0.17 - 0.02);
    }
    if (!capped) ball(inner, 0.12, hairColor, 0, 1.07, -0.02);
  }
  if (hair === 'swoop') { // a big swept fringe to one side
    const swoop = ball(inner, 0.13, hairColor, -0.07, capped ? 0.9 : 1.02, 0.12);
    swoop.scale.set(1.6, 0.7, 0.9);
    swoop.rotation.z = 0.35;
  }
  addAccessory(inner, accessory, hair, skin);
  if (winter) winterWear(inner, winter);
  if (wings) fairyWings(inner, wings, 0.9);
  mergeColors(inner); // one or two draw calls a character (big houses, docs/TECH.md §5.4)

  root.scale.setScalar(scale);
  return { root, inner };
}

/**
 * A knitted bobble hat and scarf in one colour (customers in the snow, GDD #116), merged into a single mesh with no
 * shadow, so a street full of shoppers costs one extra draw call each (big houses, docs/TECH.md §5.4).
 */
function winterWear(inner, color) {
  const g = new THREE.Group();
  mesh(g, new THREE.SphereGeometry(0.285, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), color, 0, 0.83, -0.01);
  cyl(g, 0.282, 0.282, 0.07, 12, color, 0, 0.92, -0.01); // the turned-up band
  ball(g, 0.075, color, 0, 1.14, -0.01, 1); // the bobble
  cyl(g, 0.205, 0.215, 0.08, 12, color, 0, 0.58, 0); // the scarf round the neck...
  box(g, 0.09, 0.22, 0.04, color, 0.09, 0.47, 0.2); // ...and its end hanging down the front
  mergeStatic(g);
  for (const m of g.children) {
    m.castShadow = false;
    inner.add(m);
  }
}

/**
 * Two pairs of fairy wings on the back, in a pale colour with a deeper edge spot, `k` = size (the dress's are bigger
 * than the little ones shoppers wear in the Fairy Garden, GDD #161). Thin flattened balls, no shadow.
 */
function fairyWings(inner, color, k = 1) {
  for (const side of [-1, 1]) {
    for (const [dy, len, tilt, w] of [[0.5, 0.2, 0.55, 0.11], [0.32, 0.14, -0.35, 0.08]]) {
      const wing = ball(inner, len * k, color, side * (0.13 + len * k * 0.6), dy + (len * k * 0.2), -0.2, 0);
      wing.scale.set(1, w / len, 0.12);
      wing.rotation.set(0, side * 0.35, side * tilt);
      wing.castShadow = false;
    }
  }
}

/** The extra bits on outfits that are more than a colour (OUTFIT_STYLES in data/customers.js). */
function outfitTrim(inner, style) {
  if (style === 'blueribbon') { // the story's last gift (GDD #148): a white collar and a blue-ribbon rosette on the front
    cyl(inner, 0.205, 0.215, 0.06, 12, '#ffffff', 0, 0.55, 0).castShadow = false;
    for (const dx of [-0.03, 0.03]) {
      const tail = box(inner, 0.035, 0.12, 0.015, '#2a55b8', dx, 0.34, 0.205);
      tail.rotation.z = dx * 6;
      tail.castShadow = false;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ball(inner, 0.028, i % 2 ? '#2a55b8' : '#5b8ff0', Math.cos(a) * 0.045, 0.42 + Math.sin(a) * 0.045, 0.2, 0).scale.z = 0.4;
    }
    ball(inner, 0.032, '#ffcf4a', 0, 0.42, 0.215, 0).scale.z = 0.4;
  } else if (style === 'sweater') { // a white snowy band with red and green dots, white cuffs and hem
    cyl(inner, 0.206, 0.206, 0.08, 12, '#ffffff', 0, 0.45, 0).castShadow = false;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ball(inner, 0.022, i % 2 ? '#2f8a4e' : '#d23345', Math.sin(a) * 0.205, 0.45, Math.cos(a) * 0.205, 0).castShadow = false;
    }
    cyl(inner, 0.2, 0.19, 0.05, 12, '#ffffff', 0, 0.12, 0).castShadow = false;
    ball(inner, 0.045, '#ffffff', 0, 0.3, 0.2, 0).scale.z = 0.4; // a snowflake on the front
  } else if (style === 'fairy') { // a petal skirt round the hem, a sparkle on the front, and big wings
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const petal = ball(inner, 0.07, i % 2 ? '#ff9ec4' : '#e8d8ff', Math.sin(a) * 0.2, 0.13, Math.cos(a) * 0.2, 0);
      petal.scale.set(0.7, 1.3, 0.35);
      petal.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
      petal.castShadow = false;
    }
    cyl(inner, 0.206, 0.206, 0.04, 12, '#ff9ec4', 0, 0.42, 0).castShadow = false; // a sash
    const gem = mesh(inner, new THREE.OctahedronGeometry(0.04), '#ffcf4a', 0, 0.48, 0.205);
    gem.scale.z = 0.5;
    gem.castShadow = false;
    fairyWings(inner, '#bfe6ff', 1.4);
  } else if (style === 'explorer') { // a brown belt with a buckle, two chest pockets and a red scarf knotted at the neck
    cyl(inner, 0.206, 0.206, 0.05, 12, '#7a4a2a', 0, 0.25, 0).castShadow = false;
    box(inner, 0.06, 0.05, 0.02, '#ffcf4a', 0, 0.25, 0.205).castShadow = false;
    for (const side of [-1, 1]) {
      box(inner, 0.08, 0.07, 0.02, '#c4a86e', side * 0.09, 0.4, 0.19).castShadow = false;
      box(inner, 0.085, 0.02, 0.025, '#a88a52', side * 0.09, 0.44, 0.195).castShadow = false;
    }
    cyl(inner, 0.19, 0.2, 0.05, 12, '#e8394f', 0, 0.55, 0).castShadow = false;
    const knot = mesh(inner, new THREE.ConeGeometry(0.05, 0.1, 4), '#e8394f', 0, 0.48, 0.18);
    knot.rotation.x = Math.PI;
    knot.castShadow = false;
  } else if (style === 'wetsuit') { // coral panels down the sides and arms, a zip up the front, a white wave across the chest
    for (const side of [-1, 1]) {
      const panel = box(inner, 0.05, 0.3, 0.2, '#ff7a6a', side * 0.19, 0.38, 0);
      panel.castShadow = false;
    }
    box(inner, 0.015, 0.26, 0.02, '#20384a', 0, 0.38, 0.205).castShadow = false;
    ball(inner, 0.018, '#ffd23f', 0, 0.52, 0.21, 0).castShadow = false; // the zip pull
    for (let i = 0; i < 4; i++) {
      const crest = ball(inner, 0.035, '#ffffff', -0.1 + i * 0.065, 0.44 + (i % 2) * 0.015, 0.19, 0);
      crest.scale.set(1, 0.5, 0.4);
      crest.castShadow = false;
    }
    cyl(inner, 0.19, 0.2, 0.04, 12, '#20384a', 0, 0.56, 0).castShadow = false; // the collar
  } else if (style === 'astronaut') { // a blue chest panel with buttons, a grey belt, a backpack and a star patch
    box(inner, 0.14, 0.1, 0.03, '#5b8ff0', 0, 0.42, 0.195).castShadow = false;
    for (const [dx, c] of [[-0.035, '#ff5a7a'], [0, '#ffd23f'], [0.035, '#7ee07a']]) ball(inner, 0.014, c, dx, 0.42, 0.215, 0).castShadow = false;
    cyl(inner, 0.206, 0.206, 0.05, 12, '#9aa3b8', 0, 0.24, 0).castShadow = false;
    box(inner, 0.26, 0.3, 0.12, '#c7cedb', 0, 0.38, -0.22); // the backpack
    const patch = mesh(inner, new THREE.CircleGeometry(0.035, 5), '#e8394f', -0.2, 0.38, 0.05);
    patch.rotation.y = -1.2;
    patch.castShadow = false;
  } else if (style === 'elf') { // a red belt with a gold buckle, a pointy red collar, red-and-white socks
    cyl(inner, 0.206, 0.206, 0.05, 12, '#d8283f', 0, 0.26, 0).castShadow = false;
    box(inner, 0.07, 0.06, 0.02, '#ffcf4a', 0, 0.26, 0.205).castShadow = false;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const point = mesh(inner, new THREE.ConeGeometry(0.05, 0.09, 4), '#d8283f', Math.sin(a) * 0.15, 0.53, Math.cos(a) * 0.15);
      point.rotation.set(Math.PI + Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6);
      point.castShadow = false;
    }
  }
}

function addAccessory(inner, accessory, hair, skin) {
  const tint = TINTS[accessory];
  accessory = accessory.replace(/\d$/, '');
  if (accessory === 'bow') {
    // On the side of the head, clear of a bun or ponytail.
    const x = hair === 'pigtails' ? 0.12 : 0.16, y = hair === 'pigtails' ? 1.06 : 1.02;
    ball(inner, 0.065, BOW, x - 0.06, y, 0.07).scale.set(1, 0.75, 0.6);
    ball(inner, 0.065, BOW, x + 0.06, y, 0.07).scale.set(1, 0.75, 0.6);
    ball(inner, 0.032, BOW, x, y, 0.09, 0);
  } else if (accessory === 'glasses') {
    for (const x of [-0.085, 0.085]) {
      const ring = mesh(inner, new THREE.TorusGeometry(0.055, 0.012, 6, 14), FRAMES, x, 0.84, 0.235);
      ring.castShadow = false;
    }
    box(inner, 0.06, 0.014, 0.014, FRAMES, 0, 0.85, 0.24).castShadow = false;
  } else if (accessory === 'bowtie') {
    ball(inner, 0.05, BOW, -0.05, 0.6, 0.17).scale.set(1, 0.75, 0.5);
    ball(inner, 0.05, BOW, 0.05, 0.6, 0.17).scale.set(1, 0.75, 0.5);
    ball(inner, 0.025, BOW, 0, 0.6, 0.19, 0);
  } else if (accessory === 'cap') { // a baseball cap, brim to the front
    mesh(inner, new THREE.SphereGeometry(0.275, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), CAP, 0, 0.86, -0.02);
    const brim = cyl(inner, 0.17, 0.17, 0.025, 12, BRIM, 0, 1.0, 0.2); // tipped toward the camera so it shows
    brim.scale.set(1, 1, 0.75);
    brim.rotation.x = 0.55;
    ball(inner, 0.03, P.cream, 0, 1.13, -0.02, 0);
  } else if (accessory === 'flowers') { // a ring of little flowers and leaves round the head
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.sin(a) * 0.235, z = Math.cos(a) * 0.215 - 0.02;
      if (i % 2) ball(inner, 0.03, tint.leaf, x, 1.0, z, 0).scale.set(1, 0.6, 1.4);
      else ball(inner, 0.052, tint.flowers[(i / 2) % tint.flowers.length], x, 1.0, z, 0);
    }
  } else if (accessory === 'bunny') { // tall ears on a headband
    for (const side of [-1, 1]) {
      const ear = ball(inner, 0.07, tint.ear, side * 0.11, 1.24, -0.03);
      ear.scale.set(0.6, 2.0, 0.45);
      ear.rotation.z = -side * 0.22;
      const inside = ball(inner, 0.045, tint.inner, side * 0.112, 1.23, 0.0, 0);
      inside.scale.set(0.55, 1.9, 0.3);
      inside.rotation.z = -side * 0.22;
    }
  } else if (accessory === 'kitty') { // pointy cat ears on a headband (GDD #79)
    for (const side of [-1, 1]) {
      const ear = mesh(inner, new THREE.ConeGeometry(0.12, 0.14, 4), tint.ear, side * 0.15, 1.15, 0.0);
      ear.rotation.set(0, Math.PI / 4, -side * 0.3);
      ear.scale.z = 0.45;
      const inside = mesh(inner, new THREE.ConeGeometry(0.07, 0.085, 4), tint.inner, side * 0.15, 1.14, 0.04);
      inside.rotation.set(0, Math.PI / 4, -side * 0.3);
      inside.scale.z = 0.3;
      inside.castShadow = false;
    }
  } else if (accessory === 'crown') { // a little gold crown with points and a pink gem
    const tilt = -0.15;
    cyl(inner, 0.14, 0.13, 0.08, 14, tint.gold, 0, 1.11, -0.01).rotation.x = tilt;
    for (let i = 0; i < 5; i++) {
      const a = ((i - 2) / 5) * Math.PI * 2 * 0.9;
      const point = mesh(inner, new THREE.ConeGeometry(0.035, 0.08, 5), tint.gold, Math.sin(a) * 0.13, 1.18 - Math.cos(a) * 0.01, Math.cos(a) * 0.12 - 0.02);
      point.rotation.x = tilt;
      ball(inner, 0.018, tint.gold, point.position.x, point.position.y + 0.045, point.position.z, 0);
    }
    ball(inner, tint.gem === GEM ? 0.03 : 0.04, tint.gem, 0, 1.11, 0.13, 0); // bolder crowns get a bigger gem
  } else if (accessory === 'santa') { // a floppy red hat with a white brim and a pompom
    cyl(inner, 0.27, 0.27, 0.07, 14, '#ffffff', 0, 1.02, -0.02).rotation.x = -0.12;
    // One cone, bent smoothly: straight at the brim, curving over more and more toward the tip.
    const h = 0.46, geo = new THREE.ConeGeometry(0.25, h, 14, 10);
    const pos = geo.attributes.position, bend = (t) => [0.2 * t * t, -0.12 * t * t * t]; // sideways, down
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + h / 2) / h, [dx, dy] = bend(t);
      pos.setX(i, pos.getX(i) + dx);
      pos.setY(i, pos.getY(i) + dy);
    }
    geo.computeVertexNormals();
    const by = 1.04 + h / 2;
    mesh(inner, geo, '#d8283f', 0, by, -0.03);
    const [tx, ty] = bend(1);
    ball(inner, 0.07, '#ffffff', tx, by + h / 2 + ty, -0.03, 1);
  } else if (accessory === 'elfears') { // long pointy ears out to the sides
    for (const side of [-1, 1]) {
      const ear = mesh(inner, new THREE.ConeGeometry(0.06, 0.2, 6), skin, side * 0.3, 0.88, -0.02);
      ear.rotation.z = -side * 1.15;
    }
  } else if (accessory === 'fairyears') { // small pointed ears tipped up, with a tiny pink flower on one
    for (const side of [-1, 1]) {
      const ear = mesh(inner, new THREE.ConeGeometry(0.05, 0.16, 6), skin, side * 0.26, 0.9, 0.07); // in front of pigtails and buns
      ear.rotation.set(0.2, 0, -side * 0.6);
      ear.scale.z = 0.6;
    }
    ball(inner, 0.035, '#ff9ec4', -0.235, 0.83, 0.12, 0).castShadow = false;
    ball(inner, 0.015, '#ffd98a', -0.235, 0.83, 0.15, 0).castShadow = false;
  } else if (accessory === 'safari') { // a pith helmet: a khaki dome, a wide brim and a band
    mesh(inner, new THREE.SphereGeometry(0.27, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#e3d2a0', 0, 0.96, -0.02).scale.y = 0.85;
    const brim = cyl(inner, 0.37, 0.37, 0.025, 16, '#d8c08a', 0, 0.97, -0.01);
    brim.rotation.x = -0.12;
    cyl(inner, 0.272, 0.272, 0.05, 14, '#7a5a3a', 0, 1.0, -0.02).rotation.x = -0.12;
    ball(inner, 0.035, '#e3d2a0', 0, 1.2, -0.02, 0);
  } else if (accessory === 'visor') { // a sun visor: a band round the head and a big curved brim to the front
    const band = mesh(inner, new THREE.CylinderGeometry(0.278, 0.278, 0.07, 16, 1, true), '#ff7a9a', 0, 0.97, -0.02); // open, so the hair shows on top
    band.rotation.x = -0.12;
    const brim = mesh(inner, new THREE.CylinderGeometry(0.26, 0.26, 0.02, 12, 1, false, -Math.PI * 0.4, Math.PI * 0.8), '#ffd23f', 0, 0.99, 0.18);
    brim.rotation.x = 0.15; // tipped toward the camera so it shows
    brim.castShadow = false;
    ball(inner, 0.035, '#ffffff', 0.2, 1.0, 0.17, 0).castShadow = false; // a little flower on the band
  } else if (accessory === 'helmet') { // a round glass bubble over the head on a collar ring
    cyl(inner, 0.24, 0.26, 0.07, 16, '#c7cedb', 0, 0.58, 0).castShadow = false;
    const bubble = mesh(inner, new THREE.SphereGeometry(0.36, 18, 12), HELMET_GLASS, 0, 0.84, 0.01);
    bubble.castShadow = false;
    bubble.receiveShadow = false;
  } else if (accessory === 'antennae') { // a headband with two wobbly stalks and glowing green tips
    for (const side of [-1, 1]) {
      const stalk = cyl(inner, 0.012, 0.012, 0.26, 5, '#5a4a5e', side * 0.1, 1.17, 0.0);
      stalk.rotation.z = -side * 0.35;
      ball(inner, 0.05, '#7ee07a', side * 0.15, 1.3, 0.0, 1);
    }
    cyl(inner, 0.25, 0.25, 0.03, 14, '#5a4a5e', 0, 1.02, -0.02).rotation.x = -0.25;
  } else if (accessory === 'antlers') { // brown antlers with a red nose
    for (const side of [-1, 1]) {
      const stem = cyl(inner, 0.025, 0.03, 0.26, 6, '#9a6a4a', side * 0.13, 1.16, -0.02);
      stem.rotation.z = -side * 0.35;
      for (const [dy, dx] of [[0.06, 0.07], [0.14, 0.05]]) {
        const tine = cyl(inner, 0.018, 0.022, 0.12, 5, '#9a6a4a', side * (0.15 + dx), 1.13 + dy, -0.02);
        tine.rotation.z = -side * 1.1;
      }
    }
    ball(inner, 0.045, '#e8283f', 0, 0.8, 0.245, 1).castShadow = false;
  } else if (accessory === 'hat') {
    cyl(inner, 0.33, 0.33, 0.025, 14, P.butter, 0, 1.0, -0.02).rotation.x = -0.12;
    cyl(inner, 0.17, 0.2, 0.15, 12, P.butter, 0, 1.08, -0.03).rotation.x = -0.12;
    cyl(inner, 0.205, 0.205, 0.045, 12, P.pink, 0, 1.03, -0.025).rotation.x = -0.12;
  }
}
