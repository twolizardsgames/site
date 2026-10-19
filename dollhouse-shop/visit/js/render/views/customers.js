// Draws customers from state: they walk in along the sidewalk (interpolated between sim ticks),
// step up into the shop, carry what they picked, and shrink away near the end of the road.
// While a snowy outside scene is on (GDD #116), everyone wears a knitted bobble hat and scarf; in the Fairy Garden
// (GDD #161), little fairy wings.

import * as THREE from 'three';
import { createCharacter } from '../models/character.js';
import { buildItem } from '../models/items.js';
import { disposeTree, hitBox } from '../models/prims.js';
import { groundAt } from '../../sim/route.js';
import { PACKS } from '../../data/packs.js';

/** Knitted hat and scarf colours, one per customer (from their id, so it stays the same). */
const KNITS = ['#d8283f', '#2f8a4e', '#4f7fd6', '#ffcf4a', '#ff8fc0', '#8e5ad8', '#ff9a3c', '#f4f0e8'];
const pick = (list, id) => list[[...String(id)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % list.length];
const knitFor = (id) => pick(KNITS, id);
/** Fairy wing colours, pastel so they show from the front. */
const WINGS = ['#b8e4ff', '#ffc4e4', '#d6c4ff', '#bff0d0', '#ffe9a0'];

const POP_TIME = 0.3;
const HELD_SCALE = 1.5;
const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createCustomersView(state, roomOrigin) {
  const group = new THREE.Group();
  const shown = new Map(); // customerId -> entry
  const hitTargets = [];
  const tmp = new THREE.Vector3();

  /** What the outside scene dresses shoppers in: 'snow' (hat and scarf), 'wings' or null. */
  const dress = () => { const o = PACKS[state.outside]?.outside; return o?.snow ? 'snow' : o?.wings ? 'wings' : null; };
  let wear = dress();
  const model = (c) => createCharacter({ ...c.look, winter: wear === 'snow' ? knitFor(c.id) : null, wings: wear === 'wings' ? pick(WINGS, c.id) : null });

  /** The outside scene changed: everyone already in the street changes into (or out of) its clothes. */
  function remodel(e) {
    const { root, inner } = model(e.c);
    root.position.copy(e.root.position);
    root.rotation.copy(e.root.rotation);
    root.scale.copy(e.root.scale);
    root.add(e.hit);
    group.remove(e.root);
    disposeTree(e.root);
    group.add(root);
    Object.assign(e, { root, inner, held: null, heldItem: null });
  }

  function add(c) {
    const { root, inner } = model(c);
    const hit = hitBox(0.5, 1.1, 0.5);
    hit.position.y = 0.55;
    hit.userData = { roomId: c.roomId, customerId: c.id };
    root.add(hit);
    hitTargets.push(hit);
    group.add(root);
    const entry = { c, root, inner, hit, prev: { x: c.x, z: c.z, y: c.y ?? 0 }, facing: c.facing, phase: Math.random() * 6, t: 0, gone: false, held: null, heldItem: null };
    shown.set(c.id, entry);
    return entry;
  }

  function remove(entry) {
    group.remove(entry.root);
    disposeTree(entry.root); // their own merged body; held items and the hit box are shared
    hitTargets.splice(hitTargets.indexOf(entry.hit), 1);
    shown.delete(entry.c.id);
  }

  function updateHeld(e) {
    const c = e.c;
    const want = c.basket.length && c.state !== 'paying' ? c.basket[c.basket.length - 1] : null;
    if (want === e.heldItem) return;
    if (e.held) e.inner.remove(e.held);
    e.held = null;
    if (want) {
      e.held = buildItem(want);
      e.held.scale.setScalar(HELD_SCALE / c.look.scale);
      e.held.position.set(0, 0.42, 0.26);
      e.inner.add(e.held);
    }
    e.heldItem = want;
  }

  return {
    group,
    hitTargets,

    beforeTick() {
      for (const e of shown.values()) { e.prev.x = e.c.x; e.prev.z = e.c.z; e.prev.y = e.c.y ?? 0; e.prevRoom = e.c.roomId; }
    },

    /** World position just above a customer's head (for speech bubbles). */
    headPosition(id) {
      const e = shown.get(id);
      if (!e) return null;
      e.root.updateMatrixWorld();
      return e.root.localToWorld(tmp.set(0, 1.2, 0)).clone();
    },

    frame(dt, alpha) {
      if (dress() !== wear) {
        wear = dress();
        for (const e of shown.values()) remodel(e);
      }
      const live = new Set(state.customers.map((c) => c.id));
      for (const c of state.customers) if (!shown.has(c.id)) add(c);
      for (const e of shown.values()) {
        if (!live.has(e.c.id) && !e.gone) { e.gone = true; e.t = POP_TIME; }
        if (e.gone) {
          e.t -= dt;
          if (e.t <= 0) { remove(e); continue; }
        } else {
          e.t = Math.min(POP_TIME, e.t + dt);
        }
        const c = e.c;
        if (e.prevRoom && e.prevRoom !== c.roomId) { // switched rooms (and coordinates) this tick: don't slide across
          e.prev.x = c.x; e.prev.z = c.z; e.prev.y = c.y ?? 0; e.prevRoom = c.roomId;
        }
        e.hit.userData.roomId = c.roomId;
        const o = roomOrigin(c.roomId);
        const z = lerp(e.prev.z, c.z, alpha);
        e.root.position.set(o.x + lerp(e.prev.x, c.x, alpha), o.y + groundAt(z) + lerp(e.prev.y, c.y ?? 0, alpha), o.z + z);
        e.facing += wrap(c.facing - e.facing) * Math.min(1, dt * 10);
        e.root.rotation.y = e.facing;
        const p = e.t / POP_TIME;
        e.root.scale.setScalar(c.look.scale * Math.max(0.01, p < 1 ? p * (1.1 - 0.1 * p) : 1));

        const moving = c.path.length > 0;
        e.phase += dt * (moving ? 10 : 2);
        e.inner.position.y = moving ? Math.abs(Math.sin(e.phase)) * 0.05 : 0;
        e.inner.rotation.z = moving ? Math.sin(e.phase) * 0.08 : 0;
        e.inner.scale.y = moving ? 1 : 1 + Math.sin(e.phase) * 0.02;
        updateHeld(e);
      }
    },
  };
}
