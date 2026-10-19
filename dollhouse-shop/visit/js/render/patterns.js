// Wallpaper and floor textures for room styles (GDD #68), drawn on canvases and cached. Each
// texture is one repeating tile; materials are toon-shaded white so the tile's own colours show.
// Cached textures are marked userData.keep so rebuilding the building doesn't dispose them.

import * as THREE from 'three';
import { gradientMap } from './toon.js';
import { canvasTexture, drawContext } from './canvasTexture.js';

const TILE = 128; // pixels per tile
const materials = new Map();

function tileTexture(draw, repeatX, repeatY) {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  draw(drawContext(c), TILE);
  const t = canvasTexture(c); // survives the phone's graphics being reset (render/canvasTexture.js)
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.userData.keep = true;
  return t;
}

function cached(key, make) {
  if (!materials.has(key)) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap, map: make() });
    m.userData.keep = true;
    materials.set(key, m);
  }
  return materials.get(key);
}

/** A colour a little darker (for plank seams and grout). */
function shade(hex, by) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(1 - by);
  return `#${c.getHexString()}`;
}

function heart(g, x, y, r) {
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.45);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fill();
}

function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

/** A wrapped sweet: a round middle with a twist of wrapper either side. */
function candy(g, x, y, r) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(x + side * r * 0.8, y);
    g.lineTo(x + side * r * 2, y - r * 0.75);
    g.lineTo(x + side * r * 2, y + r * 0.75);
    g.closePath();
    g.fill();
  }
}

/** A paw print: a big pad and four toes. */
function paw(g, x, y, r) {
  g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.62, r * 0.5, 0, 0, Math.PI * 2); g.fill();
  for (const [dx, dy] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) {
    g.beginPath(); g.arc(x + dx * r, y + dy * r, r * 0.22, 0, Math.PI * 2); g.fill();
  }
}

// ---------------------------------------------------------------------------------------------------
// Collection prize wallpapers (GDD #87): a picture per theme, in its round's colours (PRIZE_PALETTES):
// pastels, Bright neons, Dazzle jewels with gold outlines. The background is the room's wallpaper colour.
// P = { c: [five motif colours], ink: eyes and lines, edge: outline or null }
// ---------------------------------------------------------------------------------------------------

const PRIZE_PALETTES = [
  { c: ['#ffa8c8', '#9fd0ff', '#a9e6c8', '#ffd98a', '#c8b0ff'], ink: '#7a4a6a', edge: null },
  { c: ['#ff3d8b', '#2f8cff', '#7fd321', '#ffc21f', '#ff8a2b'], ink: '#3b2a5a', edge: null },
  { c: ['#d81b60', '#2546b8', '#14a06a', '#7b3fc4', '#c2185b'], ink: '#3b1f3a', edge: '#e8b923' },
];

const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
/** Fill the current path, with a gold outline in Dazzle colours. */
function paint(g, fill, P, w = 2) {
  g.fillStyle = fill;
  g.fill();
  if (P.edge) { g.strokeStyle = P.edge; g.lineWidth = w; g.stroke(); }
}

const PRIZES = {
  teacup(g, x, y, r, P) { // a cup on a saucer with a heart on it
    g.beginPath(); g.ellipse(x, y + r * 0.6, r * 1.15, r * 0.24, 0, 0, Math.PI * 2); paint(g, P.c[1], P);
    g.strokeStyle = P.c[0]; g.lineWidth = r * 0.2;
    g.beginPath(); g.arc(x + r * 0.82, y + r * 0.05, r * 0.3, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.beginPath();
    g.moveTo(x - r * 0.85, y - r * 0.35); g.lineTo(x + r * 0.85, y - r * 0.35);
    g.quadraticCurveTo(x + r * 0.8, y + r * 0.6, x, y + r * 0.6);
    g.quadraticCurveTo(x - r * 0.8, y + r * 0.6, x - r * 0.85, y - r * 0.35);
    paint(g, P.c[0], P);
    g.fillStyle = P.c[3]; heart(g, x, y + r * 0.08, r * 0.24);
  },
  frame(g, x, y, r, P) { // a picture frame with hills and a sun
    g.beginPath(); g.rect(x - r, y - r * 0.8, r * 2, r * 1.6); paint(g, P.c[3], P);
    g.fillStyle = P.c[1]; g.fillRect(x - r * 0.72, y - r * 0.52, r * 1.44, r * 1.04);
    g.fillStyle = P.c[2]; g.beginPath(); g.ellipse(x - r * 0.2, y + r * 0.52, r * 0.7, r * 0.45, 0, Math.PI, 0); g.fill();
    g.fillStyle = P.c[0]; circle(g, x + r * 0.35, y - r * 0.2, r * 0.18);
  },
  armchair(g, x, y, r, P) {
    g.beginPath(); g.roundRect(x - r * 0.75, y - r * 0.85, r * 1.5, r * 1.1, r * 0.35); paint(g, P.c[4], P);
    g.beginPath(); g.roundRect(x - r, y - r * 0.15, r * 0.45, r * 0.9, r * 0.2); paint(g, P.c[0], P);
    g.beginPath(); g.roundRect(x + r * 0.55, y - r * 0.15, r * 0.45, r * 0.9, r * 0.2); paint(g, P.c[0], P);
    g.beginPath(); g.roundRect(x - r * 0.6, y + r * 0.1, r * 1.2, r * 0.45, r * 0.15); paint(g, P.c[0], P);
  },
  mushroom(g, x, y, r, P) { // a spotted toadstool
    g.beginPath(); g.roundRect(x - r * 0.3, y - r * 0.1, r * 0.6, r * 0.95, r * 0.2); paint(g, '#fff6e8', P);
    g.beginPath(); g.ellipse(x, y - r * 0.1, r, r * 0.75, 0, Math.PI, 0); g.closePath(); paint(g, P.c[0], P);
    g.fillStyle = '#ffffff';
    for (const [dx, dy, k] of [[-0.5, -0.35, 0.15], [0.05, -0.6, 0.13], [0.5, -0.3, 0.15]]) circle(g, x + dx * r, y + dy * r, k * r);
  },
  wing(g, x, y, r, P) { // a little fairy (wings and a sparkle)
    g.globalAlpha = 0.85;
    for (const side of [-1, 1]) {
      g.beginPath(); g.ellipse(x + side * r * 0.45, y - r * 0.25, r * 0.5, r * 0.32, side * 0.6, 0, Math.PI * 2); paint(g, P.c[1], P, 1.5);
      g.beginPath(); g.ellipse(x + side * r * 0.35, y + r * 0.3, r * 0.32, r * 0.22, -side * 0.5, 0, Math.PI * 2); paint(g, P.c[4], P, 1.5);
    }
    g.globalAlpha = 1;
    g.fillStyle = P.c[3]; star(g, x, y, r * 0.3);
  },
  moon(g, x, y, r, P) { // a sleepy crescent moon on a cloud
    g.save();
    g.beginPath(); g.arc(x, y - r * 0.2, r * 0.75, 0, Math.PI * 2); g.arc(x + r * 0.38, y - r * 0.38, r * 0.62, 0, Math.PI * 2, true);
    paint(g, P.c[3], P);
    g.restore();
    g.fillStyle = P.c[1];
    for (const [dx, k] of [[-0.55, 0.32], [0, 0.42], [0.55, 0.32]]) circle(g, x + dx * r, y + r * 0.55, k * r);
    if (P.edge) { g.strokeStyle = P.edge; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - r * 0.85, y + r * 0.85); g.lineTo(x + r * 0.85, y + r * 0.85); g.stroke(); }
  },
  teddy(g, x, y, r, P) { // a teddy face with a bow
    const fur = P.edge ? P.c[4] : '#d9a67a';
    for (const side of [-1, 1]) { g.beginPath(); g.arc(x + side * r * 0.62, y - r * 0.6, r * 0.32, 0, Math.PI * 2); paint(g, fur, P); }
    g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); paint(g, fur, P);
    g.fillStyle = '#fff1e0'; circle(g, x, y + r * 0.28, r * 0.34);
    g.fillStyle = P.ink;
    circle(g, x - r * 0.3, y - r * 0.12, r * 0.09); circle(g, x + r * 0.3, y - r * 0.12, r * 0.09); circle(g, x, y + r * 0.18, r * 0.1);
    g.fillStyle = P.c[0];
    for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x, y + r * 0.82); g.lineTo(x + side * r * 0.4, y + r * 0.62); g.lineTo(x + side * r * 0.4, y + r * 1.02); g.closePath(); g.fill(); }
    circle(g, x, y + r * 0.82, r * 0.1);
  },
  house(g, x, y, r, P, i = 0) { // a tiny house: walls, roof, door and window
    g.beginPath(); g.rect(x - r * 0.7, y - r * 0.2, r * 1.4, r); paint(g, P.c[(i + 3) % 5], P);
    g.beginPath(); g.moveTo(x - r * 0.95, y - r * 0.15); g.lineTo(x, y - r); g.lineTo(x + r * 0.95, y - r * 0.15); g.closePath(); paint(g, P.c[i % 5], P);
    g.fillStyle = P.c[(i + 1) % 5]; g.fillRect(x - r * 0.15, y + r * 0.3, r * 0.32, r * 0.5);
    g.fillStyle = '#ffffff'; g.fillRect(x + r * 0.3, y + r * 0.02, r * 0.26, r * 0.26);
  },
  lollipop(g, x, y, r, P) { // a swirly lollipop
    g.strokeStyle = P.edge ?? '#f3e6d6'; g.lineWidth = r * 0.14;
    g.beginPath(); g.moveTo(x, y + r * 0.2); g.lineTo(x, y + r * 1.1); g.stroke();
    g.beginPath(); g.arc(x, y - r * 0.2, r * 0.7, 0, Math.PI * 2); paint(g, P.c[0], P);
    g.strokeStyle = '#ffffff'; g.lineWidth = r * 0.12; g.beginPath();
    for (let t = 0; t < Math.PI * 4; t += 0.2) g.lineTo(x + Math.cos(t) * t * r * 0.05, y - r * 0.2 + Math.sin(t) * t * r * 0.05);
    g.stroke();
  },
  cat(g, x, y, r, P) { // a cat face with whiskers
    const fur = P.c[3];
    g.beginPath();
    g.moveTo(x - r * 0.78, y - r * 0.15); g.lineTo(x - r * 0.7, y - r * 0.95); g.lineTo(x - r * 0.25, y - r * 0.62);
    g.lineTo(x + r * 0.25, y - r * 0.62); g.lineTo(x + r * 0.7, y - r * 0.95); g.lineTo(x + r * 0.78, y - r * 0.15);
    g.arc(x, y, r * 0.8, -0.2, Math.PI + 0.2);
    g.closePath(); paint(g, fur, P);
    g.fillStyle = P.c[0];
    for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x + side * r * 0.62, y - r * 0.5); g.lineTo(x + side * r * 0.6, y - r * 0.8); g.lineTo(x + side * r * 0.38, y - r * 0.6); g.closePath(); g.fill(); }
    g.fillStyle = P.ink;
    for (const side of [-1, 1]) { g.beginPath(); g.ellipse(x + side * r * 0.32, y - r * 0.1, r * 0.09, r * 0.14, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = P.c[0]; g.beginPath(); g.moveTo(x - r * 0.1, y + r * 0.12); g.lineTo(x + r * 0.1, y + r * 0.12); g.lineTo(x, y + r * 0.24); g.closePath(); g.fill();
    g.strokeStyle = P.ink; g.lineWidth = 1.5;
    for (const side of [-1, 1]) for (const dy of [0.2, 0.34]) { g.beginPath(); g.moveTo(x + side * r * 0.3, y + r * dy); g.lineTo(x + side * r * 1.05, y + r * (dy * 1.6 - 0.12)); g.stroke(); }
  },
};

/** Each theme's prize: a big motif and a small one per tile (GDD #87). A = the big one's spot and size, B = the small one's. */
const A = [0.3, 0.32, 0.21], B = [0.75, 0.76, 0.14];
const at = ([x, y, r], s) => [x * s, y * s, r * s];
const PRIZE_TILES = {
  teacups: (g, s, P) => { PRIZES.teacup(g, ...at(A, s), P); g.fillStyle = P.c[4]; heart(g, ...at([B[0], B[1], 0.09], s)); },
  frames: (g, s, P) => { PRIZES.frame(g, ...at([A[0], A[1], 0.19], s), P); PRIZES.armchair(g, ...at(B, s), P); },
  mushrooms: (g, s, P) => { PRIZES.mushroom(g, ...at(A, s), P); PRIZES.wing(g, ...at(B, s), P); },
  moons: (g, s, P) => { PRIZES.moon(g, ...at(A, s), P); g.fillStyle = P.c[3]; star(g, ...at([B[0], B[1], 0.1], s)); star(g, ...at([0.56, 0.9, 0.05], s)); },
  teddies: (g, s, P) => { PRIZES.teddy(g, ...at([A[0], A[1] - 0.02, 0.19], s), P); g.fillStyle = P.c[0]; heart(g, ...at([B[0], B[1], 0.09], s)); },
  houses: (g, s, P) => { PRIZES.house(g, ...at(A, s), P, 0); PRIZES.house(g, ...at(B, s), P, 2); },
  lollipops: (g, s, P) => { PRIZES.lollipop(g, ...at([A[0], A[1] - 0.06, 0.2], s), P); g.fillStyle = P.c[1]; candy(g, ...at([B[0], B[1], 0.065], s)); },
  cats: (g, s, P) => { PRIZES.cat(g, ...at(A, s), P); g.fillStyle = P.c[0]; paw(g, ...at([B[0], B[1], 0.12], s)); },
};

const WALL_PATTERNS = {
  dots(g, s, ink) {
    g.fillStyle = ink;
    for (const [x, y] of [[0.25, 0.25], [0.75, 0.75]]) { g.beginPath(); g.arc(x * s, y * s, s * 0.16, 0, Math.PI * 2); g.fill(); }
  },
  gingham(g, s, ink) {
    g.fillStyle = ink;
    g.globalAlpha = 0.75;
    g.fillRect(0, 0, s / 2, s);
    g.fillRect(0, 0, s, s / 2);
    g.globalAlpha = 1;
    g.fillRect(0, 0, s / 2, s / 2);
  },
  stars(g, s, ink) {
    g.fillStyle = ink;
    star(g, s * 0.27, s * 0.3, s * 0.24);
    star(g, s * 0.77, s * 0.78, s * 0.2);
  },
  hearts(g, s, ink) {
    g.fillStyle = ink;
    heart(g, s * 0.27, s * 0.3, s * 0.21);
    heart(g, s * 0.77, s * 0.79, s * 0.18);
  },
  // Sweet Shop and Pet Corner rewards (GDD #79)
  candy(g, s, ink) {
    g.fillStyle = ink;
    candy(g, s * 0.27, s * 0.3, s * 0.12);
    candy(g, s * 0.75, s * 0.78, s * 0.105);
  },
  paws(g, s, ink) {
    g.fillStyle = ink;
    paw(g, s * 0.27, s * 0.3, s * 0.23);
    paw(g, s * 0.75, s * 0.78, s * 0.19);
  },
};

// Decoration pack wallpapers (GDD #116): pictures in their own colours, on any wallpaper colour.
const XRED = '#d8283f', XGREEN = '#2f8a4e';

/** A candy cane: a striped hook. */
function candyCane(g, x, y, r) {
  const path = () => { g.beginPath(); g.moveTo(x + r * 0.35, y + r); g.lineTo(x + r * 0.35, y - r * 0.35); g.arc(x, y - r * 0.35, r * 0.35, 0, Math.PI, true); };
  g.lineCap = 'round';
  g.lineWidth = r * 0.3;
  g.strokeStyle = '#ffffff'; path(); g.stroke();
  g.setLineDash([r * 0.16, r * 0.16]);
  g.strokeStyle = XRED; path(); g.stroke();
  g.setLineDash([]);
}

/** A six-armed snowflake with little branches. */
function snowflake(g, x, y, r, color) {
  g.strokeStyle = color;
  g.lineWidth = r * 0.14;
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + c * r, y + s * r); g.stroke();
    for (const t of [0.5, 0.75]) {
      for (const side of [-1, 1]) {
        const b = a + side * 0.7, px = x + c * r * t, py = y + s * r * t;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(b) * r * 0.28, py + Math.sin(b) * r * 0.28); g.stroke();
      }
    }
  }
}

const PACK_TILES = {
  candycane(g, s) {
    candyCane(g, s * 0.27, s * 0.32, s * 0.2);
    g.fillStyle = XGREEN;
    for (const [dx, dy] of [[-1, 0], [1, 0]]) { g.beginPath(); g.ellipse(s * 0.75 + dx * s * 0.07, s * 0.78 + dy, s * 0.07, s * 0.035, dx * 0.5, 0, Math.PI * 2); g.fill(); } // holly leaves
    g.fillStyle = XRED;
    for (const dx of [-0.02, 0.02]) { g.beginPath(); g.arc(s * (0.75 + dx), s * 0.75, s * 0.028, 0, Math.PI * 2); g.fill(); }
  },
  snowflakes(g, s) {
    snowflake(g, s * 0.27, s * 0.3, s * 0.17, '#7fb2e0');
    snowflake(g, s * 0.76, s * 0.78, s * 0.1, '#a9cdee');
  },
  // The Fairy pack (GDD #161)
  fairies(g, s) {
    fairy(g, s * 0.3, s * 0.34, s * 0.29, '#ff9ec4', '#bfe9ff');
    fairy(g, s * 0.76, s * 0.8, s * 0.2, '#c8a8ff', '#ffe3f2');
    g.fillStyle = '#ffcf4a';
    star(g, s * 0.78, s * 0.24, s * 0.06);
    star(g, s * 0.2, s * 0.84, s * 0.045);
  },
  cottages(g, s) {
    cottage(g, s * 0.3, s * 0.38, s * 0.28);
    g.fillStyle = '#ff9ec4'; circle(g, s * 0.74, s * 0.8, s * 0.045);
    g.fillStyle = '#ffd98a'; circle(g, s * 0.74, s * 0.8, s * 0.018);
    g.fillStyle = '#7cc77a';
    for (const dx of [-1, 1]) { g.beginPath(); g.ellipse(s * (0.74 + dx * 0.06), s * 0.87, s * 0.04, s * 0.016, dx * 0.5, 0, Math.PI * 2); g.fill(); }
  },
  butterflies(g, s) {
    butterfly(g, s * 0.3, s * 0.3, s * 0.23, '#ff9ec4', '#ffd98a');
    butterfly(g, s * 0.76, s * 0.76, s * 0.16, '#9fd0ff', '#c8a8ff');
    for (const [x, y, c] of [[0.75, 0.25, '#c8a8ff'], [0.22, 0.78, '#ffb8a0']]) {
      g.fillStyle = c;
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; circle(g, s * x + Math.cos(a) * s * 0.03, s * y + Math.sin(a) * s * 0.03, s * 0.024); }
      g.fillStyle = '#fff3b0'; circle(g, s * x, s * y, s * 0.02);
    }
  },
  // The Jungle pack (GDD #161)
  jungleleaves(g, s) {
    monstera(g, s * 0.3, s * 0.32, s * 0.27, '#3fa45a', 0.4);
    frond(g, s * 0.76, s * 0.8, s * 0.24, '#5cc074', -0.6);
    g.fillStyle = '#ff5a7a'; flower5(g, s * 0.8, s * 0.22, s * 0.06);
    g.fillStyle = '#ffd23f'; circle(g, s * 0.8, s * 0.22, s * 0.02);
  },
  animalpals(g, s) {
    monkeyFace(g, s * 0.28, s * 0.3, s * 0.2);
    tigerFace(g, s * 0.76, s * 0.78, s * 0.17);
    toucanHead(g, s * 0.78, s * 0.22, s * 0.11);
    g.fillStyle = '#5cc074';
    g.beginPath(); g.ellipse(s * 0.22, s * 0.8, s * 0.07, s * 0.03, -0.6, 0, Math.PI * 2); g.fill();
  },
  // The Space pack (GDD #161)
  planets(g, s) {
    ringedPlanet(g, s * 0.3, s * 0.3, s * 0.15, '#b48cff', '#ffd166');
    rocketShip(g, s * 0.75, s * 0.75, s * 0.2);
    g.fillStyle = '#ffd23f';
    star(g, s * 0.78, s * 0.2, s * 0.05);
    star(g, s * 0.18, s * 0.78, s * 0.04);
    g.fillStyle = '#7ad8ff'; circle(g, s * 0.5, s * 0.55, s * 0.04);
  },
  galaxy(g, s) { // its own night colours, whatever the wallpaper colour
    g.fillStyle = '#2a2266';
    g.fillRect(0, 0, s, s);
    // The glow behind the spiral wraps round the tile's edges (drawn again one tile over each way), so tiles join without seams.
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
      const glow = g.createRadialGradient(s * 0.3 + dx, s * 0.35 + dy, 0, s * 0.3 + dx, s * 0.35 + dy, s * 0.45);
      glow.addColorStop(0, 'rgba(200,140,255,0.55)');
      glow.addColorStop(1, 'rgba(200,140,255,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, s, s);
    }
    g.strokeStyle = 'rgba(255,200,240,0.6)'; g.lineWidth = s * 0.025; g.lineCap = 'round';
    for (let k = 0; k < 2; k++) { // a little spiral
      g.beginPath();
      for (let t = 0; t < 7; t += 0.2) { const a = t + k * Math.PI, r = s * 0.02 * t; g.lineTo(s * 0.3 + Math.cos(a) * r, s * 0.35 + Math.sin(a) * r * 0.6); }
      g.stroke();
    }
    g.fillStyle = '#ffe9a0';
    star(g, s * 0.76, s * 0.76, s * 0.07);
    g.fillStyle = '#ffffff';
    for (const [x, y, r] of [[0.1, 0.1, 0.012], [0.6, 0.15, 0.016], [0.88, 0.42, 0.012], [0.2, 0.7, 0.014], [0.5, 0.9, 0.012], [0.92, 0.95, 0.01], [0.45, 0.6, 0.01]]) circle(g, x * s, y * s, r * s);
  },
  // The Beach pack (GDD #136, #166)
  seacreatures(g, s) {
    crab(g, s * 0.28, s * 0.32, s * 0.19);
    fish(g, s * 0.74, s * 0.24, s * 0.14, '#ff9a3c', '#ffd23f');
    octopus(g, s * 0.74, s * 0.72, s * 0.19);
    g.fillStyle = '#ffb86b'; star(g, s * 0.24, s * 0.8, s * 0.12);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [x, y, r] of [[0.5, 0.12, 0.025], [0.55, 0.05, 0.016], [0.08, 0.55, 0.02], [0.48, 0.58, 0.018]]) circle(g, x * s, y * s, r * s);
  },
  surfwaves(g, s) {
    wave(g, 0, s * 0.92, s, s * 0.09);
    surfboard(g, s * 0.3, s * 0.4, s * 0.3, -0.5, '#ff7a9a', '#ffd23f');
    surfboard(g, s * 0.78, s * 0.62, s * 0.22, 0.4, '#3fb6e0', '#ffffff');
    gull(g, s * 0.72, s * 0.18, s * 0.1);
    gull(g, s * 0.88, s * 0.3, s * 0.07);
    g.fillStyle = '#ffd23f'; circle(g, s * 0.1, s * 0.12, s * 0.06);
  },
  // Not a pack's: the story's last gift (GDD #148), blue-ribbon rosettes and little gold stars.
  blueribbon(g, s) {
    rosette(g, s * 0.28, s * 0.3, s * 0.13);
    g.fillStyle = '#ffcf4a';
    star(g, s * 0.76, s * 0.78, s * 0.07);
  },
};

/** A little fairy: a dress, a head with hair, arms out, and two pairs of wings behind. */
function fairy(g, x, y, r, dress, wing) {
  g.fillStyle = wing;
  g.globalAlpha = 0.85;
  for (const side of [-1, 1]) {
    g.beginPath(); g.ellipse(x + side * r * 0.42, y - r * 0.05, r * 0.42, r * 0.26, side * -0.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x + side * r * 0.32, y + r * 0.32, r * 0.26, r * 0.17, side * 0.5, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  g.strokeStyle = '#ffd9c2'; g.lineWidth = r * 0.09; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - r * 0.4, y - r * 0.15); g.lineTo(x + r * 0.4, y - r * 0.15); g.stroke(); // arms
  g.fillStyle = dress;
  g.beginPath(); g.moveTo(x, y - r * 0.3); g.lineTo(x + r * 0.32, y + r * 0.55); g.lineTo(x - r * 0.32, y + r * 0.55); g.closePath(); g.fill();
  g.fillStyle = '#ffd9c2'; circle(g, x, y - r * 0.45, r * 0.2);
  g.fillStyle = '#8a5a3c';
  g.beginPath(); g.arc(x, y - r * 0.5, r * 0.21, Math.PI * 1.05, Math.PI * 1.95); g.fill();
  g.strokeStyle = '#ffcf4a'; g.lineWidth = r * 0.06; // a wand with a star
  g.beginPath(); g.moveTo(x + r * 0.4, y - r * 0.15); g.lineTo(x + r * 0.62, y - r * 0.45); g.stroke();
  g.fillStyle = '#ffcf4a'; star(g, x + r * 0.66, y - r * 0.5, r * 0.12);
}

/** A toadstool cottage: a spotted red cap for a roof, a round door and a window. */
function cottage(g, x, y, r) {
  g.fillStyle = '#fff3e0';
  g.beginPath(); g.roundRect(x - r * 0.45, y - r * 0.1, r * 0.9, r * 0.85, r * 0.15); g.fill();
  g.fillStyle = '#b0703f';
  g.beginPath(); g.roundRect(x - r * 0.15, y + r * 0.3, r * 0.3, r * 0.45, [r * 0.15, r * 0.15, 0, 0]); g.fill();
  g.fillStyle = '#9fd0ff'; circle(g, x + r * 0.27, y + r * 0.15, r * 0.1);
  g.fillStyle = '#e8394f';
  g.beginPath(); g.ellipse(x, y - r * 0.08, r * 0.85, r * 0.62, 0, Math.PI, 0); g.closePath(); g.fill();
  g.fillStyle = '#ffffff';
  for (const [dx, dy, k] of [[-0.45, -0.3, 0.12], [0.05, -0.5, 0.11], [0.45, -0.28, 0.12], [-0.12, -0.22, 0.07]]) circle(g, x + dx * r, y + dy * r, k * r);
  g.fillStyle = '#7cc77a';
  g.beginPath(); g.ellipse(x, y + r * 0.78, r * 0.7, r * 0.1, 0, 0, Math.PI * 2); g.fill();
}

/** A butterfly: four round wings with dots, and a little body. */
function butterfly(g, x, y, r, wing, dot) {
  for (const side of [-1, 1]) {
    g.fillStyle = wing;
    g.beginPath(); g.ellipse(x + side * r * 0.45, y - r * 0.25, r * 0.48, r * 0.4, side * 0.4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x + side * r * 0.35, y + r * 0.35, r * 0.32, r * 0.28, side * -0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = dot;
    circle(g, x + side * r * 0.5, y - r * 0.28, r * 0.13);
    circle(g, x + side * r * 0.36, y + r * 0.36, r * 0.09);
  }
  g.fillStyle = '#5a3a55';
  g.beginPath(); g.ellipse(x, y, r * 0.09, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#5a3a55'; g.lineWidth = r * 0.05; g.lineCap = 'round';
  for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x, y - r * 0.4); g.quadraticCurveTo(x + side * r * 0.1, y - r * 0.75, x + side * r * 0.25, y - r * 0.75); g.stroke(); }
}

/** A monstera leaf: a big heart-ish leaf with slits and a stem. */
function monstera(g, x, y, r, color, tilt) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.fillStyle = color;
  g.beginPath(); g.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ffffff'; g.globalAlpha = 0.9; g.lineWidth = r * 0.08; g.lineCap = 'round';
  for (const side of [-1, 1]) for (const k of [-0.45, 0, 0.45]) { g.beginPath(); g.moveTo(side * r * 0.45, k * r); g.lineTo(side * r * 0.9, k * r - r * 0.12); g.stroke(); }
  g.globalAlpha = 1;
  g.strokeStyle = shade(color, 0.15); g.lineWidth = r * 0.06;
  g.beginPath(); g.moveTo(0, -r * 0.9); g.lineTo(0, r * 1.25); g.stroke();
  g.restore();
}

/** A palm frond: a curved stem with leaflets along both sides. */
function frond(g, x, y, r, color, tilt) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = r * 0.07;
  g.beginPath(); g.moveTo(0, r); g.quadraticCurveTo(r * 0.2, 0, 0, -r); g.stroke();
  g.fillStyle = color;
  for (let i = 0; i < 7; i++) {
    const t = -0.85 + i * 0.28, px = r * 0.2 * (1 - t * t) * 0.9;
    for (const side of [-1, 1]) { g.beginPath(); g.ellipse(px + side * r * 0.3, t * r, r * 0.3, r * 0.07, side * 0.5, 0, Math.PI * 2); g.fill(); }
  }
  g.restore();
}

/** A five-petal flower in the current fill. */
function flower5(g, x, y, r) {
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; circle(g, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5); }
}

function monkeyFace(g, x, y, r) {
  g.fillStyle = '#8a5a3c';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.85, y - r * 0.05, r * 0.32);
  circle(g, x, y, r * 0.8);
  g.fillStyle = '#f4d3a8';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.85, y - r * 0.05, r * 0.17);
  g.beginPath(); g.ellipse(x, y + r * 0.15, r * 0.55, r * 0.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3a2a2a';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.25, y - r * 0.12, r * 0.09);
  g.strokeStyle = '#3a2a2a'; g.lineWidth = r * 0.06; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y + r * 0.2, r * 0.22, 0.3, Math.PI - 0.3); g.stroke();
}

function tigerFace(g, x, y, r) {
  g.fillStyle = '#ff9a3c';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.7, y - r * 0.7, r * 0.28);
  circle(g, x, y, r);
  g.fillStyle = '#fff3e0';
  g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.6, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3a2a2a'; g.lineWidth = r * 0.12; g.lineCap = 'round';
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(x + side * r * 0.95, y - r * 0.1); g.lineTo(x + side * r * 0.6, y - r * 0.05); g.stroke();
    g.beginPath(); g.moveTo(x + side * r * 0.9, y + r * 0.25); g.lineTo(x + side * r * 0.62, y + r * 0.2); g.stroke();
  }
  g.beginPath(); g.moveTo(x, y - r * 0.95); g.lineTo(x, y - r * 0.65); g.stroke();
  g.fillStyle = '#3a2a2a';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.35, y - r * 0.15, r * 0.11);
  g.fillStyle = '#ff7f9a';
  g.beginPath(); g.moveTo(x - r * 0.12, y + r * 0.15); g.lineTo(x + r * 0.12, y + r * 0.15); g.lineTo(x, y + r * 0.3); g.closePath(); g.fill();
}

function toucanHead(g, x, y, r) {
  g.fillStyle = '#2a2530'; circle(g, x, y, r);
  g.fillStyle = '#fff6e0'; g.beginPath(); g.ellipse(x - r * 0.1, y + r * 0.45, r * 0.6, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ff9a2b';
  g.beginPath(); g.ellipse(x + r * 1.15, y + r * 0.1, r * 0.95, r * 0.42, 0.15, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e8394f'; circle(g, x + r * 1.95, y + r * 0.25, r * 0.18);
  g.fillStyle = '#9ee6ff'; circle(g, x + r * 0.2, y - r * 0.2, r * 0.28);
  g.fillStyle = '#2a1f2a'; circle(g, x + r * 0.22, y - r * 0.2, r * 0.13);
}

/** A planet with a tilted ring. */
function ringedPlanet(g, x, y, r, color, ring) {
  g.strokeStyle = ring; g.lineWidth = r * 0.22;
  g.beginPath(); g.ellipse(x, y, r * 1.7, r * 0.45, -0.3, Math.PI, Math.PI * 2); g.stroke(); // back half of the ring
  g.fillStyle = color; circle(g, x, y, r);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.ellipse(x - r * 0.1, y - r * 0.35, r * 0.75, r * 0.14, -0.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x, y + r * 0.3, r * 0.85, r * 0.12, -0.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x, y, r * 1.7, r * 0.45, -0.3, 0, Math.PI); g.stroke(); // front half
}

/** A little rocket pointing up and to the right, with a window and a flame. */
function rocketShip(g, x, y, r) {
  g.save(); g.translate(x, y); g.rotate(0.6);
  g.fillStyle = '#ff9a3c';
  g.beginPath(); g.moveTo(-r * 0.2, r * 0.6); g.lineTo(0, r * 1.05); g.lineTo(r * 0.2, r * 0.6); g.closePath(); g.fill();
  g.fillStyle = '#e8394f';
  for (const side of [-1, 1]) { g.beginPath(); g.moveTo(side * r * 0.25, r * 0.1); g.lineTo(side * r * 0.5, r * 0.65); g.lineTo(side * r * 0.2, r * 0.55); g.closePath(); g.fill(); }
  g.fillStyle = '#f4f6fa';
  g.beginPath(); g.moveTo(0, -r * 0.9); g.quadraticCurveTo(r * 0.38, -r * 0.4, r * 0.28, r * 0.6); g.lineTo(-r * 0.28, r * 0.6); g.quadraticCurveTo(-r * 0.38, -r * 0.4, 0, -r * 0.9); g.fill();
  g.fillStyle = '#e8394f';
  g.beginPath(); g.moveTo(0, -r * 0.9); g.quadraticCurveTo(r * 0.2, -r * 0.65, r * 0.27, -r * 0.45); g.lineTo(-r * 0.27, -r * 0.45); g.quadraticCurveTo(-r * 0.2, -r * 0.65, 0, -r * 0.9); g.fill();
  g.fillStyle = '#7ad8ff'; circle(g, 0, -r * 0.1, r * 0.13);
  g.restore();
}

/** A red crab with claws up, legs out to the sides and eyes on stalks. */
function crab(g, x, y, r) {
  g.strokeStyle = '#e8394f'; g.lineWidth = r * 0.12; g.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + side * r * 0.6, y + r * 0.1 + i * r * 0.18); g.lineTo(x + side * r * 1.05, y + r * 0.3 + i * r * 0.22); g.stroke(); }
    g.beginPath(); g.moveTo(x + side * r * 0.5, y - r * 0.2); g.lineTo(x + side * r * 0.8, y - r * 0.6); g.stroke(); // the arm
    g.fillStyle = '#e8394f';
    g.beginPath(); g.arc(x + side * r * 0.85, y - r * 0.75, r * 0.26, side < 0 ? 0.3 : -2.6, side < 0 ? 3.6 : 0.6); g.fill(); // a claw, open at the top
    g.beginPath(); g.moveTo(x + side * r * 0.2, y - r * 0.4); g.lineTo(x + side * r * 0.25, y - r * 0.7); g.stroke(); // an eye stalk
    g.fillStyle = '#ffffff'; circle(g, x + side * r * 0.25, y - r * 0.75, r * 0.13);
    g.fillStyle = '#2a1f2a'; circle(g, x + side * r * 0.25, y - r * 0.73, r * 0.07);
  }
  g.fillStyle = '#ff5a5a';
  g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2a1f2a'; g.lineWidth = r * 0.07;
  g.beginPath(); g.arc(x, y - r * 0.02, r * 0.18, 0.3, Math.PI - 0.3); g.stroke(); // a smile
}

/** A round little fish swimming left, with a striped side and a big eye. */
function fish(g, x, y, r, body, stripe) {
  g.fillStyle = body;
  g.beginPath(); g.moveTo(x + r * 0.7, y); g.lineTo(x + r * 1.3, y - r * 0.55); g.lineTo(x + r * 1.3, y + r * 0.55); g.closePath(); g.fill(); // the tail
  g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = stripe;
  g.save(); g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); g.clip();
  g.fillRect(x + r * 0.05, y - r, r * 0.25, r * 2);
  g.restore();
  g.fillStyle = '#ffffff'; circle(g, x - r * 0.45, y - r * 0.15, r * 0.24);
  g.fillStyle = '#2a1f2a'; circle(g, x - r * 0.5, y - r * 0.13, r * 0.12);
}

/** A purple octopus: a round head, a smile and wavy legs. */
function octopus(g, x, y, r) {
  g.strokeStyle = '#b48cff'; g.lineWidth = r * 0.2; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const lx = x + (i - 2) * r * 0.32;
    g.beginPath(); g.moveTo(lx, y + r * 0.2);
    g.quadraticCurveTo(lx + (i % 2 ? r * 0.25 : -r * 0.25), y + r * 0.6, lx + (i - 2) * r * 0.12, y + r * 0.95);
    g.stroke();
  }
  g.fillStyle = '#b48cff';
  g.beginPath(); g.ellipse(x, y - r * 0.15, r * 0.75, r * 0.7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.28, y - r * 0.2, r * 0.17);
  g.fillStyle = '#2a1f2a';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.28, y - r * 0.17, r * 0.09);
  g.fillStyle = '#ff9fb0';
  for (const side of [-1, 1]) circle(g, x + side * r * 0.5, y + r * 0.05, r * 0.1);
  g.strokeStyle = '#2a1f2a'; g.lineWidth = r * 0.06;
  g.beginPath(); g.arc(x, y + r * 0.02, r * 0.14, 0.3, Math.PI - 0.3); g.stroke();
}

/** A row of curling waves across the tile (seamless left to right), foam on top. */
function wave(g, x0, y, w, h) {
  const n = 3, step = w / n;
  g.fillStyle = '#5cc6ee';
  g.beginPath(); g.moveTo(x0, y + h * 2);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    g.lineTo(x, y);
    g.quadraticCurveTo(x + step * 0.45, y - h * 1.3, x + step * 0.8, y - h * 0.2);
    g.quadraticCurveTo(x + step * 0.6, y + h * 0.1, x + step, y);
  }
  g.lineTo(x0 + w, y + h * 2); g.closePath(); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.3; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    g.beginPath(); g.moveTo(x + step * 0.05, y - h * 0.05); g.quadraticCurveTo(x + step * 0.45, y - h * 1.3, x + step * 0.78, y - h * 0.25); g.stroke();
  }
}

/** A surfboard, tilted by `tilt`, with a stripe down the middle. */
function surfboard(g, x, y, r, tilt, color, stripe) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.fillStyle = color;
  g.beginPath(); g.ellipse(0, 0, r * 0.28, r, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = stripe;
  g.fillRect(-r * 0.05, -r * 0.85, r * 0.1, r * 1.7);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.ellipse(-r * 0.12, -r * 0.3, r * 0.06, r * 0.4, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

/** A seagull in flight: two curved wings. */
function gull(g, x, y, r) {
  g.strokeStyle = '#5a6a7a'; g.lineWidth = r * 0.22; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - r, y); g.quadraticCurveTo(x - r * 0.5, y - r * 0.55, x, y);
  g.quadraticCurveTo(x + r * 0.5, y - r * 0.55, x + r, y);
  g.stroke();
}

/** A blue-ribbon rosette: two tails, a ring of blue petals and a gold middle. */
function rosette(g, x, y, r) {
  g.fillStyle = '#2a55b8';
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(x + side * r * 0.15, y); g.lineTo(x + side * r * 0.75, y + r * 1.7); g.lineTo(x + side * r * 0.35, y + r * 1.5);
    g.lineTo(x + side * r * 0.1, y + r * 1.75); g.closePath(); g.fill();
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.fillStyle = i % 2 ? '#2a55b8' : '#5b8ff0';
    circle(g, x + Math.cos(a) * r * 0.65, y + Math.sin(a) * r * 0.65, r * 0.38);
  }
  g.fillStyle = '#ffcf4a';
  circle(g, x, y, r * 0.5);
  g.fillStyle = '#fff3b0';
  circle(g, x, y, r * 0.28);
}

/** Draws one tile of a pattern option: a prize picture in its round's colours, a pack picture, or a one-colour print. */
function patternDrawer(pattern) {
  if (pattern.prize) return (g, s) => PRIZE_TILES[pattern.prize](g, s, PRIZE_PALETTES[pattern.round ?? 0]);
  if (PACK_TILES[pattern.id]) return (g, s) => PACK_TILES[pattern.id](g, s);
  return (g, s, ink) => WALL_PATTERNS[pattern.id](g, s, ink);
}

/** Patterned wallpaper (dots, gingham, stars, hearts, candy, paws, prize pictures) for a wall w x h; tiles are `size` across. */
export function wallMaterial(paper, pattern, w, h, size = pattern.prize || pattern.pack || pattern.story ? 0.6 : 0.42) {
  const draw = patternDrawer(pattern);
  // Motifs a touch stronger than the stripe colour so they read on a phone.
  const ink = pattern.id === 'gingham' ? paper.stripe : shade(paper.stripe, 0.06);
  return cached(`wall|${pattern.id}|${paper.id}|${w}|${h}`, () => tileTexture((g, s) => {
    g.fillStyle = paper.paper;
    g.fillRect(0, 0, s, s);
    draw(g, s, ink);
  }, w / size, h / size));
}

const FLOOR_STYLES = {
  planks(g, s, f) { // three planks per tile, seams staggered
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = shade(f.color, 0.1);
    for (let i = 0; i < 3; i++) {
      const y = (i * s) / 3;
      g.fillRect(0, y, s, 2);
      g.fillRect(((i * 0.37 + 0.2) % 1) * s, y, 2, s / 3);
    }
  },
  checker(g, s, f) {
    g.fillStyle = f.color2;
    g.fillRect(0, 0, s, s);
    g.fillStyle = f.color;
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
  },
  tiles(g, s, f) {
    g.fillStyle = f.color2;
    g.fillRect(0, 0, s, s);
    g.fillStyle = f.color;
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.fillRect(x * s / 2 + 3, y * s / 2 + 3, s / 2 - 6, s / 2 - 6);
  },
  plaid(g, s, f) { // tartan: wide bands of the second colour both ways, thin light lines through them
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = f.color2;
    g.globalAlpha = 0.7;
    g.fillRect(0, s * 0.25, s, s * 0.3);
    g.fillRect(s * 0.25, 0, s * 0.3, s);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(255, 236, 170, 0.8)';
    g.fillRect(0, s * 0.39, s, 2);
    g.fillRect(s * 0.39, 0, 2, s);
    g.fillStyle = 'rgba(40, 20, 30, 0.25)';
    g.fillRect(0, s * 0.85, s, 3);
    g.fillRect(s * 0.85, 0, 3, s);
  },
  stones(g, s, f) { // the Fairy pack's mossy stepping stones (GDD #161): rounded stones in moss, with tiny flowers
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = shade(f.color, 0.08);
    for (let i = 0; i < 30; i++) g.fillRect((i * 37) % s, (i * 53) % s, 4, 4);
    for (const [x, y, rx, ry] of [[0.28, 0.27, 0.2, 0.15], [0.75, 0.72, 0.19, 0.14], [0.78, 0.2, 0.12, 0.1], [0.22, 0.78, 0.13, 0.1]]) {
      g.fillStyle = shade(f.color2, 0.12);
      g.beginPath(); g.ellipse(x * s, y * s + 2, rx * s, ry * s, 0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = f.color2;
      g.beginPath(); g.ellipse(x * s, y * s, rx * s, ry * s, 0.3, 0, Math.PI * 2); g.fill();
    }
    for (const [x, y, c] of [[0.52, 0.45, '#ff9ec4'], [0.05, 0.5, '#ffffff'], [0.5, 0.95, '#ffd98a']]) { g.fillStyle = c; circle(g, x * s, y * s, s * 0.025); }
  },
  bamboo(g, s, f) { // the Jungle pack's bamboo (GDD #161): four canes per tile, each with nodes
    g.fillStyle = f.color2;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4; i++) {
      const x = (i * s) / 4;
      g.fillStyle = shade(f.color, i % 2 ? 0.05 : 0);
      g.fillRect(x + 2, 0, s / 4 - 4, s);
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(x + 5, 0, 3, s);
      g.fillStyle = f.color2;
      const y = ((i * 0.37 + 0.15) % 1) * s;
      g.fillRect(x + 2, y, s / 4 - 4, 3);
      g.fillRect(x + 2, (y + s / 2) % s, s / 4 - 4, 3);
    }
  },
  metal(g, s, f) { // the Space pack's space-station floor (GDD #161): four panels with seams, rivets and a hazard stripe
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = f.color2;
    g.fillRect(0, s / 2 - 2, s, 4);
    g.fillRect(s / 2 - 2, 0, 4, s);
    g.fillRect(0, 0, s, 2); g.fillRect(0, 0, 2, s);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (const [x, y] of [[0.06, 0.06], [0.44, 0.06], [0.06, 0.44], [0.44, 0.44], [0.56, 0.56], [0.94, 0.56], [0.56, 0.94], [0.94, 0.94], [0.56, 0.06], [0.94, 0.06], [0.06, 0.56], [0.06, 0.94]]) circle(g, x * s, y * s, 2.5);
    g.fillStyle = 'rgba(120,130,160,0.35)';
    for (let i = 0; i < 3; i++) g.fillRect(s * 0.62 + i * 10, s * 0.12, 4, s * 0.26);
  },
  driftwood(g, s, f) { // the Beach pack's driftwood boardwalk (GDD #166): four pale weathered boards with grain and a knot or two
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4; i++) {
      const y = (i * s) / 4;
      g.fillStyle = shade(f.color, i % 2 ? 0.04 : -0.02);
      g.fillRect(0, y + 3, s, s / 4 - 3);
      g.fillStyle = f.color2;
      g.fillRect(0, y, s, 3); // the gap between boards
      g.fillStyle = 'rgba(150,125,95,0.35)';
      for (let k = 0; k < 2; k++) g.fillRect(0, y + 9 + k * 10 + ((i * 5) % 4), s, 1.5); // grain
      g.fillStyle = 'rgba(140,110,80,0.5)';
      g.beginPath(); g.ellipse(((i * 0.41 + 0.2) % 1) * s, y + s / 8, 5, 3, 0, 0, Math.PI * 2); g.fill(); // a knot
    }
  },
  carpet(g, s, f) { // soft speckle
    g.fillStyle = f.color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = shade(f.color, 0.05);
    for (let i = 0; i < 40; i++) g.fillRect((i * 37) % s, (i * 71) % s, 3, 3);
  },
};

/** A floor's material for a floor piece w x d (tiles are about 0.8 across). */
export function floorMaterial(floor, w, d, size = 0.8) {
  return cached(`floor|${floor.id}|${w.toFixed(2)}|${d.toFixed(2)}`, () => tileTexture((g, s) => FLOOR_STYLES[floor.style](g, s, floor), w / size, d / size));
}

/** A small picture of a style for the decorate panel's buttons (a data URL), or null for emoji ones. */
export function swatchURL(kind, opt, paper) {
  const key = `${kind}|${opt.id}|${paper?.id ?? ''}`;
  if (swatches.has(key)) return swatches.get(key);
  const c = document.createElement('canvas');
  const s = (c.width = c.height = 96);
  const g = c.getContext('2d');
  if (kind === 'pattern') {
    g.fillStyle = paper.paper;
    g.fillRect(0, 0, s, s);
    const ink = shade(paper.stripe, 0.1);
    if (opt.id === 'stripes') { g.fillStyle = ink; for (let x = 8; x < s; x += 32) g.fillRect(x, 0, 12, s); }
    else if (opt.prize || PACK_TILES[opt.id]) { // one tile, big enough to see the picture
      patternDrawer(opt)(g, s);
    } else if (WALL_PATTERNS[opt.id] && opt.id !== 'gingham') { // zoomed onto the tile's big motif so you can tell what it is
      const k = { dots: 2.4, stars: 1.75, hearts: 1.9, candy: 1.75, paws: 1.85 }[opt.id] ?? 1.8;
      const [cx, cy] = opt.id === 'dots' ? [0.25, 0.25] : [0.27, 0.29];
      g.save(); g.translate(s / 2, s / 2); g.scale(k, k); g.translate(-s * cx, -s * cy);
      WALL_PATTERNS[opt.id](g, s, ink);
      g.restore();
    } else if (WALL_PATTERNS[opt.id]) { // gingham: two tiles across
      for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { g.save(); g.translate(x * s / 2, y * s / 2); WALL_PATTERNS[opt.id](g, s / 2, opt.id === 'gingham' ? shade(paper.stripe, 0.04) : ink); g.restore(); }
    }
  } else if (kind === 'floor') {
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { g.save(); g.translate(x * s / 2, y * s / 2); g.scale(0.5, 0.5); FLOOR_STYLES[opt.style](g, s, opt); g.restore(); }
  } else if (kind === 'rug') {
    g.translate(s / 2, s / 2);
    const r = s * 0.42;
    const ring = (fill, k) => { g.fillStyle = fill; g.beginPath(); g.arc(0, 0, r * k, 0, Math.PI * 2); g.fill(); };
    if (opt.shape === 'none') {
      g.strokeStyle = 'rgba(90,58,85,0.35)'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r * 0.7, 0, Math.PI * 2); g.moveTo(-r * 0.5, r * 0.5); g.lineTo(r * 0.5, -r * 0.5); g.stroke();
    } else if (opt.shape === 'round') { ring(opt.color, 1); ring(opt.color2, 0.7); }
    else if (opt.shape === 'rect') { g.fillStyle = opt.color2; g.fillRect(-r, -r * 0.66, 2 * r, 1.33 * r); g.fillStyle = opt.color; for (let i = 0; i < 4; i++) g.fillRect(-r + r * 0.12 + i * r * 0.5, -r * 0.66, r * 0.26, 1.33 * r); }
    else if (opt.shape === 'hearth') { g.fillStyle = opt.color; g.beginPath(); g.arc(0, r * 0.4, r, Math.PI, 0); g.fill(); g.fillStyle = opt.color2; g.beginPath(); g.arc(0, r * 0.4, r * 0.62, Math.PI, 0); g.fill(); }
    else if (opt.shape === 'petals') {
      for (const [k, c, n, off] of [[1, opt.color, 8, 0], [0.62, opt.color2, 8, Math.PI / 8]]) {
        g.fillStyle = c;
        for (let i = 0; i < n; i++) { g.save(); g.rotate(off + (i / n) * Math.PI * 2); g.beginPath(); g.ellipse(0, -r * 0.55 * k, r * 0.2 * k, r * 0.45 * k, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
      g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(0, 0, r * 0.2, 0, Math.PI * 2); g.fill();
    }
    else if (opt.shape === 'tiger') {
      g.fillStyle = opt.color; g.beginPath(); g.ellipse(0, 0, r, r * 0.66, 0, 0, Math.PI * 2); g.fill();
      g.save(); g.clip();
      g.fillStyle = opt.color2;
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * r * 0.3 - r * 0.06, -r); g.lineTo(i * r * 0.3 + r * 0.08, -r * 0.2); g.lineTo(i * r * 0.3 - r * 0.02, -r * 0.2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(i * r * 0.3 + r * 0.06, r); g.lineTo(i * r * 0.3 - r * 0.08, r * 0.2); g.lineTo(i * r * 0.3 + r * 0.02, r * 0.2); g.closePath(); g.fill(); }
      g.restore();
    }
    else if (opt.shape === 'planet') {
      g.strokeStyle = opt.color2; g.lineWidth = r * 0.16;
      g.beginPath(); g.ellipse(0, 0, r * 1.0, r * 0.38, -0.3, 0, Math.PI * 2); g.stroke();
      g.fillStyle = opt.color; g.beginPath(); g.arc(0, 0, r * 0.62, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(0, 0, r * 1.0, r * 0.38, -0.3, 0, Math.PI); g.stroke();
    }
    else if (opt.shape === 'sun') {
      g.fillStyle = opt.color2;
      for (let i = 0; i < 12; i++) { g.save(); g.rotate((i / 12) * Math.PI * 2); g.beginPath(); g.moveTo(-r * 0.14, -r * 0.6); g.lineTo(0, -r); g.lineTo(r * 0.14, -r * 0.6); g.closePath(); g.fill(); g.restore(); }
      g.fillStyle = opt.color; g.beginPath(); g.arc(0, 0, r * 0.66, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5a3a55';
      for (const side of [-1, 1]) { g.beginPath(); g.arc(side * r * 0.22, -r * 0.12, r * 0.07, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = '#5a3a55'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(0, r * 0.02, r * 0.28, 0.4, Math.PI - 0.4); g.stroke();
    }
    else if (opt.shape === 'heart') { g.fillStyle = opt.color; heart(g, 0, 0, r * 0.75); g.fillStyle = opt.color2; heart(g, 0, 0, r * 0.5); }
    else if (opt.shape === 'star') { g.fillStyle = opt.color; star(g, 0, 0, r * 1.05); g.fillStyle = opt.color2; star(g, 0, 0, r * 0.65); }
    else if (opt.shape === 'flower') {
      g.fillStyle = opt.color;
      for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(t) * r * 0.55, Math.sin(t) * r * 0.55, r * 0.42, 0, Math.PI * 2); g.fill(); }
      ring(opt.color2, 0.45);
    }
  } else {
    return null;
  }
  const url = c.toDataURL();
  swatches.set(key, url);
  return url;
}
const swatches = new Map();
