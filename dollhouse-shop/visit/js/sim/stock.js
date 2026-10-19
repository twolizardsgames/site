// Delivery boxes and shelf stock: boxes land at the front of the shop, the shopkeeper (or Bea the
// stocker, sim/stocker.js) picks one up, and carries it to a shelf where its items fill the free slots.
// A "carrier" is anyone with { carrying, spares }; events say `by: 'keeper'` or the stocker's id
// ('stocker' for Bea, 'stocker2' for Theo on floor 1, ...; GDD #72, #98).
// Deliveries are spread evenly over the doorstep and the Stairwell's upstairs floors (GDD #98, #133; register
// rooms until #133), where boxes sit inside the landing along the front, with a bin of their own.

import { events } from '../core/events.js';
import { FIXTURES } from '../data/fixtures.js';
import { CARRY } from '../data/upgrades.js';
import { hasUpgrade, hasHelper } from './upgrades.js';

/**
 * Where Pip leaves delivery boxes: on the doorstep (the sidewalk just in front of the shop room,
 * room-local coordinates, below floor level). They sit at the right end, away from the counter, so a
 * big delivery never hides the register (docs/ISSUES.md). Two boxes sit loose; the rest go in the
 * delivery bin beside them (GDD #74), so nothing stacks up in front of the shelves. The bin stays in
 * front of the shop, so it's in view when the camera is on the shop.
 */
export const BOX_SPOTS = [{ x: 0.66, z: 1.72 }, { x: 1.04, z: 1.72 }];
export const BIN = { x: 1.44, z: 1.72 };
export const DOORSTEP_Y = -0.4; // sidewalk height relative to the shop floor
export const BOX_SIZE = 0.36;
export const DOORWAY_Z = 1.1; // where you stand inside the shop to lean out and grab a doorstep box

export function newId(state, prefix) {
  state.nextId = (state.nextId ?? 1) + 1;
  return `${prefix}${state.nextId}`;
}

/** Upstairs, on a Stairwell landing (GDD #133): two boxes and a bin along the open front, left of the corner piece. */
export const UP_SPOTS = [{ x: -0.35, z: 0.98 }, { x: 0.03, z: 0.98 }];
export const UP_BIN = { x: 0.43, z: 0.98 };
export const UP_PICKUP_Z = 0.55; // where you stand to pick one up

/** Spots 0-1 are on the doorstep; any higher spot is in the delivery bin. */
export const inBin = (box) => box.spot >= BOX_SPOTS.length;

/** Where a box spot is (layer is always 0 now: boxes in the bin sit inside it); `upstairs` on a landing. */
export function boxSpot(i, upstairs = false) {
  const s = upstairs ? (i < UP_SPOTS.length ? UP_SPOTS[i] : UP_BIN) : i < BOX_SPOTS.length ? BOX_SPOTS[i] : BIN;
  return { x: s.x, z: s.z, layer: 0, y: upstairs ? 0 : DOORSTEP_Y, bin: i >= BOX_SPOTS.length };
}

/** Is this room an upstairs delivery spot (a Stairwell landing, GDD #133)? */
export const upstairsDrop = (state, roomId) => state.building.rooms.find((r) => r.id === roomId)?.type === 'landing';

/** Where a box is, in its room's coordinates. */
export const spotOf = (state, box) => boxSpot(box.spot, upstairsDrop(state, box.roomId));

/** Where to stand to pick a box up: { roomId, x, z }, facing the front. */
export function pickupSpot(state, box) {
  return { roomId: box.roomId, x: spotOf(state, box).x, z: upstairsDrop(state, box.roomId) ? UP_PICKUP_Z : DOORWAY_Z };
}

export function shopRoomId(state) {
  return (state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0]).id;
}

/**
 * Where Pip leaves boxes: the shop's doorstep, then each upstairs Stairwell floor that has its own stocker
 * (stocker2 for floor 1, ...), bottom up (GDD #98, #133): boxes only go where someone will carry them.
 */
export const dropRooms = (state) => [
  shopRoomId(state),
  ...state.building.rooms.filter((r) => r.type === 'landing' && hasHelper(state, `stocker${r.floor + 1}`))
    .sort((a, b) => a.floor - b.floor).map((r) => r.id),
];

/** The delivery spot with the fewest boxes waiting (the lowest floor on a tie), so deliveries spread evenly. */
export function nextDropRoom(state) {
  const count = (id) => state.boxes.filter((b) => b.roomId === id).length;
  return dropRooms(state).reduce((best, id) => (count(id) < count(best) ? id : best));
}

/**
 * When a doorstep spot frees up, the next box comes out of the bin onto it (GDD #74); boxes in the bin
 * keep their order. Also tidies old saves, whose stacked boxes go in the bin. Returns true if anything moved.
 */
export function settleBoxes(state) {
  const n = BOX_SPOTS.length;
  let moved = false;
  for (const roomId of new Set(state.boxes.map((b) => b.roomId))) {
    const here = state.boxes.filter((b) => b.roomId === roomId);
    const used = new Set(here.filter((b) => b.spot < n).map((b) => b.spot));
    const binned = here.filter((b) => b.spot >= n).sort((a, b) => a.spot - b.spot);
    for (let spot = 0; spot < n && binned.length; spot++) {
      if (used.has(spot)) continue;
      binned.shift().spot = spot;
      moved = true;
    }
    binned.forEach((b, i) => { if (b.spot !== n + i) { b.spot = n + i; moved = true; } });
  }
  return moved;
}

/** Put a box of items at a delivery spot (the shop's doorstep unless said), at the first free place. */
export function dropBox(state, itemId, qty, roomId = shopRoomId(state)) {
  const used = new Set(state.boxes.filter((b) => b.roomId === roomId).map((b) => b.spot));
  let spot = 0;
  while (used.has(spot)) spot++;
  const box = { id: newId(state, 'b'), itemId, qty, roomId, spot };
  state.boxes.push(box);
  return box;
}

export function findFixture(state, fixtureId) {
  for (const room of state.building.rooms) {
    const f = room.fixtures.find((x) => x.id === fixtureId);
    if (f) return { room, fixture: f };
  }
  return null;
}

/** How many boxes anyone can carry: one in their hands, 2 with the Stock Cart, 8 with the Big Cart (GDD #37, #101). */
export const carryLimit = (state) => (hasUpgrade(state, 'bigcart') ? CARRY.bigcart : hasUpgrade(state, 'cart') ? CARRY.cart : CARRY.hands);

/** The boxes someone holds: the one being unpacked first, then the ones on the cart. */
export const boxesHeld = (carrier) => [carrier.carrying, ...(carrier.spares ?? [])].filter(Boolean);

/** Can they take another box? */
export function canCarryMore(state, carrier = state.keeper) {
  return boxesHeld(carrier).length < carryLimit(state);
}

export function pickUpBox(state, boxId, carrier = state.keeper, by = 'keeper') {
  const k = carrier;
  const i = state.boxes.findIndex((b) => b.id === boxId);
  if (i < 0 || !canCarryMore(state, k)) return false;
  const box = state.boxes.splice(i, 1)[0];
  if (k.carrying) (k.spares ??= []).push(box);
  else k.carrying = box;
  settleBoxes(state);
  events.emit('boxesChanged');
  events.emit('boxPicked', { box, spare: k.carrying !== box, by });
  return true;
}

export function freeSlots(fixture) {
  return FIXTURES[fixture.kind].fillOrder.filter((i) => fixture.slots[i] === null);
}

/** Unpack the carried box onto a shelf. Returns how many items were placed. */
export function stockShelf(state, fixtureId, carrier = state.keeper, by = 'keeper') {
  const k = carrier;
  const found = findFixture(state, fixtureId);
  if (!k.carrying || !found?.fixture.slots) return 0;
  const { room, fixture } = found;
  const free = freeSlots(fixture);
  if (!free.length) {
    if (by === 'keeper') events.emit('shelfFull', { fixtureId });
    return 0;
  }
  let total = 0;
  while (k.carrying && free.length) {
    const b = k.carrying;
    const slots = free.splice(0, b.qty);
    for (const slot of slots) fixture.slots[slot] = b.itemId;
    b.qty -= slots.length;
    total += slots.length;
    events.emit('stocked', { roomId: room.id, fixtureId, itemId: b.itemId, slots, by });
    if (b.qty > 0) break; // the shelf is full
    // Empty: the box on the cart (if any) comes up into their hands and keeps filling the shelf.
    k.carrying = k.spares?.shift() ?? null;
    events.emit('boxEmptied', { box: b, by });
  }
  return total;
}

/**
 * How many of an item you have (GDD #71): on the shelves in every room, in boxes (on the doorstep or
 * in someone's hands), and on order. For the order book, so it's easy to stock evenly.
 */
export function stockCount(state, itemId) {
  let shelf = 0;
  for (const room of state.building.rooms) {
    for (const f of room.fixtures) if (f.slots) shelf += f.slots.filter((s) => s === itemId).length;
  }
  const boxes = [...state.boxes, ...boxesHeld(state.keeper), ...state.stockers.flatMap(boxesHeld)];
  const boxed = boxes.filter((b) => b?.itemId === itemId).reduce((n, b) => n + b.qty, 0);
  const coming = state.orders.filter((o) => o.itemId === itemId).reduce((n, o) => n + o.qty, 0);
  return { shelf, boxed, coming };
}
