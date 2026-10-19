// The Dream Dollhouse on the Window Display's pedestal and what's placed in it: 2 × 2 rooms, or 3 × 3
// with the Bigger Dream Dollhouse (GDD #92). In decorate mode each room is tappable and the chosen one
// glows. New items pop in.

import * as THREE from 'three';
import { buildItem } from '../models/items.js';
import { dollhouseShape, dollhouseCell, dreamDollhouse } from '../models/furniture.js';
import { bigHouse, houseSlots } from '../../sim/collection.js';
import { events } from '../../core/events.js';

const ITEM_SCALE = 1.5; // in house units, where a room is ~0.41 across
const POP_TIME = 0.35;

export function createDollhouseView(state, roomOrigin) {
  const group = new THREE.Group();
  const hitTargets = [];
  let houses = []; // [{ root, items: Map(slotId -> { obj, itemId }) }]
  let selected = null;
  const pops = [];

  const highlightMat = new THREE.MeshBasicMaterial({ color: '#ff9ec4', transparent: true, opacity: 0, depthWrite: false });
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  let shape = dollhouseShape(false), slots = [], cellGeo = null;

  const cellOf = (slot) => (shape.cols === 3 ? slot.cell3 : slot.cell);
  function cellCenter(slot) {
    const c = dollhouseCell(shape, cellOf(slot));
    return new THREE.Vector3(c.x, c.y + (shape.h / shape.cols - shape.t) / 2, 0);
  }

  function rebuild() {
    for (const h of houses) group.remove(h.root);
    houses = [];
    hitTargets.length = 0;
    pops.length = 0;
    shape = dollhouseShape(bigHouse(state));
    slots = houseSlots(state);
    cellGeo?.dispose();
    cellGeo = new THREE.BoxGeometry(shape.w / shape.cols - shape.t, shape.h / shape.cols - shape.t, shape.d);
    for (const room of state.building.rooms) {
      if (room.type !== 'display') continue;
      const pedestal = room.fixtures.find((f) => f.kind === 'pedestal');
      if (!pedestal) continue;
      const o = roomOrigin(room.id);
      const root = new THREE.Group();
      root.position.set(o.x + pedestal.x, o.y + shape.y, o.z + pedestal.z);
      root.scale.setScalar(shape.scale);
      root.add(dreamDollhouse(shape));
      const house = { root, items: new Map(), highlights: new Map() };
      for (const slot of slots) {
        const hit = new THREE.Mesh(cellGeo, hitMat);
        hit.position.copy(cellCenter(slot));
        hit.userData = { roomId: room.id, dollSlot: slot.id };
        root.add(hit);
        hitTargets.push(hit);
        const glow = new THREE.Mesh(cellGeo, highlightMat);
        glow.position.copy(hit.position);
        glow.scale.set(0.98, 0.98, 0.9);
        glow.visible = false;
        glow.renderOrder = 2;
        root.add(glow);
        house.highlights.set(slot.id, glow);
      }
      group.add(root);
      houses.push(house);
    }
    sync(false);
    setSelected(selected);
  }

  /** Match each house's items to state.dollhouse.slots. */
  function sync(animate = true) {
    for (const house of houses) {
      for (const slot of slots) {
        const want = state.dollhouse.slots[slot.id] ?? null;
        const have = house.items.get(slot.id);
        if ((have?.itemId ?? null) === want) continue;
        if (have) house.root.remove(have.obj);
        house.items.delete(slot.id);
        if (!want) continue;
        const obj = buildItem(want);
        const [col] = cellOf(slot), c = dollhouseCell(shape, cellOf(slot));
        obj.position.set(c.x, c.y, c.z);
        obj.rotation.y = col === 0 ? 0.35 : col === shape.cols - 1 ? -0.35 : 0; // turned a little toward the middle
        obj.scale.setScalar(ITEM_SCALE);
        house.root.add(obj);
        house.items.set(slot.id, { obj, itemId: want });
        if (animate) pops.push({ obj, t: 0 });
      }
    }
  }

  function setSelected(slotId) {
    selected = slotId;
    for (const house of houses) for (const [id, glow] of house.highlights) glow.visible = id === slotId;
  }

  events.on('dollhouseChanged', () => sync(true));
  events.on('upgradeBought', ({ id }) => { if (id === 'bighouse') rebuild(); });

  let time = 0;
  return {
    group,
    /** Height of the house from its base to the roof's tip, and where the base sits above the pedestal's foot. */
    get height() { return (shape.h + shape.roof) * shape.scale; },
    get baseY() { return shape.y; },
    hitTargets,
    rebuild,
    /** Glow one room (decorate mode), or none. */
    setSelected,
    /** World position of a room in the first Dream Dollhouse (for pop-ups), or of the house's top. */
    worldPosition(slotId = null) {
      const house = houses[0];
      if (!house) return null;
      house.root.updateMatrixWorld();
      const slot = slots.find((s) => s.id === slotId);
      const local = slot ? cellCenter(slot) : new THREE.Vector3(0, shape.h + 0.3, 0);
      return house.root.localToWorld(local);
    },
    update(dt) {
      time += dt;
      highlightMat.opacity = 0.18 + 0.12 * Math.sin(time * 5);
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t = Math.min(POP_TIME, p.t + dt);
        const k = p.t / POP_TIME;
        const s = k < 0.7 ? (k / 0.7) * 1.2 : 1.2 - ((k - 0.7) / 0.3) * 0.2; // overshoot, settle
        p.obj.scale.setScalar(ITEM_SCALE * Math.max(0.01, s));
        if (k === 1) pops.splice(i, 1);
      }
    },
  };
}
