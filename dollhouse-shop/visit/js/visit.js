// The visit page (visit.html, GDD #91): a friend's shop in 3D, from the link the Share button makes.
// The shop comes from the part of the link after the `#` (sim/share.js), is checked like any hand-made
// link would be, and is drawn with the game's own render code. Nothing is saved. The shopkeeper stands
// behind the counter and a few customers wander in, peek at the window and browse, using the game's own
// customer code in look-only mode (`state.visit`, sim/customers.js). Pinch and drag like the game; tap a
// room to zoom in; the buttons show the whole house, the Dream Dollhouse, and day or night.

import * as THREE from 'three';
import { createState } from './sim/state.js';
import { createKeeper } from './sim/keeper.js';
import { buildNav } from './sim/nav.js';
import { spawnCustomer, tickCustomers } from './sim/customers.js';
import { separate } from './sim/crowd.js';
import { sparkleFor } from './sim/collection.js';
import { decodeShop } from './sim/share.js';
import { DEFAULT_SIGN } from './sim/shopName.js';
import { startLoop } from './core/loop.js';
import { createRenderer } from './render/renderer.js';
import { createLighting } from './render/lighting.js';
import { createBuilding, ROOM } from './render/building.js';
import { createEnvironment } from './render/environment.js';
import { CameraRig } from './render/camera.js';
import { pickAt } from './render/pick.js';
import { createShelvesView } from './render/views/shelves.js';
import { createDollhouseView } from './render/views/dollhouse.js';
import { createShowcasesView } from './render/views/showcases.js';
import { createKeeperView } from './render/views/keeper.js';
import { createCustomersView } from './render/views/customers.js';
import { createQuality } from './render/quality.js';
import { attachGestures } from './input/touch.js';

const app = document.getElementById('app');
const canvas = document.getElementById('game');

addEventListener('hashchange', () => location.reload()); // another shop's link pasted in

let shop;
try {
  shop = await decodeShop(decodeURIComponent(location.hash.slice(1)));
} catch {
  document.getElementById('visit-error').hidden = false;
  window.__booted = true;
  throw new Error('not a shop link');
}

// A state-shaped shop for the render views and the look-only customers: the visited shop's rooms,
// dollhouse, shopkeeper and name, open for the day.
const state = { ...createState(0), ...shop, boxes: [], visit: true, spawnTimer: Infinity };
state.day.phase = 'open';
state.sparkle = sparkleFor(state); // window-peekers, like in the game
const roomById = (id) => state.building.rooms.find((r) => r.id === id);
const shopRoom = state.building.rooms.find((r) => r.type === 'shop');
state.keeper = createKeeper(shopRoom.id); // behind the counter
const navs = new Map(state.building.rooms.map((r) => [r.id, buildNav(r)]));

// A few visitors at a time, more in a bigger shop.
const VISITORS = Math.min(6, 2 + Math.floor(state.building.rooms.length / 4));
const VISITOR_EVERY = [2.5, 6]; // seconds between arrivals
let nextVisitor = 1;

const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const lighting = createLighting(scene);
const rig = new CameraRig();
lighting.setTwilight(0);

const building = createBuilding(state.building.rooms, lighting, null, state.shopName);
const env = createEnvironment(building.layout, lighting, state.outside); // a pack's outside scene shows to visitors too (GDD #106)
scene.add(building.group, env.group);
lighting.fitTo(building.layout);
const L = building.layout;
const { width, roofTop } = L;
rig.setLimits({ minX: -width / 2 - 1, maxX: width / 2 + 1, minY: 0.5, maxY: roofTop, fit: { cx: 0, cy: (roofTop - 0.8) / 2, w: width + 2.4, h: roofTop + 2.4 } });

const roomOrigin = (roomId) => {
  const room = roomById(roomId);
  return { x: L.roomX(room.col), y: L.roomY(room.floor), z: 0 };
};
const shelvesView = createShelvesView(state, roomOrigin, () => null);
const dollhouseView = createDollhouseView(state, roomOrigin);
const showcasesView = createShowcasesView(state, roomOrigin);
const keeperView = createKeeperView(state, roomOrigin);
const customersView = createCustomersView(state, roomOrigin);
scene.add(shelvesView.group, dollhouseView.group, showcasesView.group, keeperView.object, customersView.group);
shelvesView.rebuild();
dollhouseView.rebuild();
showcasesView.rebuild();

// The welcome card and the view buttons.
document.querySelector('.visit-name').textContent = state.shopName || DEFAULT_SIGN.join(' ');
document.title = `Visit ${state.shopName || DEFAULT_SIGN.join(' ')}`;
const head = document.getElementById('visit-head');
const bar = document.getElementById('visit-bar');
const houseButton = document.getElementById('visit-house');
const dollButton = document.getElementById('visit-doll');
const nightButton = document.getElementById('visit-night');
head.hidden = false;
bar.hidden = false;

let focusedRoomId = null;
function focusRoom(room) {
  focusedRoomId = room.id;
  head.hidden = true;
  rig.frame(L.roomX(room.col), L.roomY(room.floor) + ROOM.H / 2, ROOM.W + 0.6, ROOM.H + 0.8);
}
function focusAll(instant = false) {
  focusedRoomId = null;
  const bottom = -0.8;
  rig.frame(0, (roofTop + bottom) / 2, width + 1.6, roofTop - bottom + 0.6, instant);
}
// Close up on the Dream Dollhouse, framed like the game's decorate mode.
const display = state.building.rooms.find((r) => r.type === 'display');
const pedestal = display?.fixtures.find((f) => f.kind === 'pedestal');
function focusDollhouse() {
  focusedRoomId = display.id;
  head.hidden = true;
  const o = roomOrigin(display.id), houseH = dollhouseView.height;
  rig.frame(o.x + pedestal.x, o.y + dollhouseView.baseY + houseH / 2, 1.8, houseH + 0.5);
}
dollButton.hidden = !pedestal;
houseButton.addEventListener('click', () => focusAll());
dollButton.addEventListener('click', () => focusDollhouse());

// Day or night: the game's evening light, with the lamps on.
let night = false;
nightButton.addEventListener('click', () => {
  night = !night;
  lighting.setTwilight(night ? 1 : 0);
  nightButton.innerHTML = night ? '<span aria-hidden="true">☀️</span> Day' : '<span aria-hidden="true">🌙</span> Night';
});
focusAll(true);

attachGestures(canvas, {
  onTap(x, y) {
    const hit = pickAt(rig.camera, canvas, x, y, building.hitTargets);
    const room = hit && roomById(hit.object.userData.roomId);
    if (room && room.id !== focusedRoomId) focusRoom(room);
  },
  onDrag: (dx, dy) => rig.pan(dx, dy, canvas.clientHeight),
  onPinch: (scale) => rig.zoomBy(scale),
  onWheel: (deltaY) => rig.zoomBy(Math.exp(-deltaY * 0.0015)),
});

const quality = createQuality(renderer, () => resize());
function resize() {
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(app.clientWidth, app.clientHeight, false);
  rig.resize(app.clientWidth / app.clientHeight);
}
new ResizeObserver(resize).observe(app);
resize();
lighting.update(0, true);
window.__booted = true;

function tickVisitors(dt) {
  if (state.customers.length < VISITORS && (nextVisitor -= dt) <= 0) {
    spawnCustomer(state);
    nextVisitor = VISITOR_EVERY[0] + Math.random() * (VISITOR_EVERY[1] - VISITOR_EVERY[0]);
  }
  tickCustomers(state, navs, dt);
  separate(state, navs);
}
// Open on a busy shop: the first visitors have already walked in.
for (let t = 0; t < 200; t++) tickVisitors(0.1);

startLoop({
  tickRate: 10,
  tick(dt) {
    keeperView.beforeTick();
    customersView.beforeTick();
    tickVisitors(dt);
  },
  frame(dt, time, alpha) {
    lighting.update(dt);
    env.update(dt);
    shelvesView.update(dt);
    dollhouseView.update(dt);
    showcasesView.update(dt);
    keeperView.frame(dt, alpha);
    customersView.frame(dt, alpha);
    rig.update(dt, time);
    quality.frame(dt);
    renderer.render(scene, rig.camera);
  },
});
