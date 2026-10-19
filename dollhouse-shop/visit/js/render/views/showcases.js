// What's on show on each shelf room's showcase stand (GDD #96): the item, turning slowly on top. The
// stand itself is a fixture (render/models/furniture.js). New items pop in with a sparkle.

import * as THREE from 'three';
import { buildItem } from '../models/items.js';
import { events } from '../../core/events.js';

const ITEM_SCALE = 2.2;
const TOP = 0.88;        // the stand's top, above the room floor
const SPIN = 0.5;        // radians a second
const POP_TIME = 0.35;

export function createShowcasesView(state, roomOrigin) {
  const group = new THREE.Group();
  let shown = new Map(); // roomId -> { obj, itemId, t }

  function sync() {
    const next = new Map();
    for (const room of state.building.rooms) {
      const stand = room.fixtures.find((f) => f.kind === 'showcase');
      if (!stand || !room.showcase) continue;
      let entry = shown.get(room.id);
      if (!entry || entry.itemId !== room.showcase) {
        if (entry) group.remove(entry.obj);
        entry = { obj: buildItem(room.showcase), itemId: room.showcase, t: 0 };
        group.add(entry.obj);
      }
      const o = roomOrigin(room.id);
      entry.obj.position.set(o.x + stand.x, o.y + TOP, o.z + stand.z);
      next.set(room.id, entry);
    }
    for (const [id, e] of shown) if (!next.has(id)) group.remove(e.obj);
    shown = next;
  }

  events.on('showcaseChanged', sync);

  return {
    group,
    /** Re-place everything (after the building is rebuilt). */
    rebuild: sync,
    /** Where a room's showcase item is, for sparkles. */
    itemPosition: (roomId) => shown.get(roomId)?.obj.position.clone() ?? null,
    update(dt) {
      for (const e of shown.values()) {
        e.obj.rotation.y += SPIN * dt;
        if (e.t >= POP_TIME) continue;
        e.t = Math.min(POP_TIME, e.t + dt);
        const p = e.t / POP_TIME;
        e.obj.scale.setScalar(ITEM_SCALE * (p < 0.7 ? (p / 0.7) * 1.15 : 1.15 - ((p - 0.7) / 0.3) * 0.15));
      }
    },
  };
}
