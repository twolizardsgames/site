// Building grid actions. Rooms sit on a (col, floor) grid that grows sideways and upward.

import { events } from '../core/events.js';
import { ROOM_TYPES, ROOM_SIZE, ROOM_STYLES, ROOM_COST, ROOM_GROWTH, SCENE_COST, SCENE_GROWTH, STAIR_COSTS, STAIR_GROWTH, REGISTER_COST, REGISTER_GROWTH, niceCost } from '../data/rooms.js';
import { FIXTURES } from '../data/fixtures.js';
import { EXPANSIONS } from '../data/dollhouse.js';
import { REGISTER_CASHIERS } from '../data/upgrades.js';
import { addCoins } from './economy.js';
import { newId, dropBox, boxesHeld, shopRoomId } from './stock.js';
import { finishWalks } from './move.js';
import { fitShelves } from './upgrades.js';
import { needsFullShop } from './fullshop.js';

export const hasRoom = (state, col, floor) =>
  state.building.rooms.some((r) => r.col === col && r.floor === floor);

/** The starting furniture for a room type, with ids unique to the room. */
export function defaultFixtures(type, roomId) {
  return ROOM_TYPES[type].fixtures.map((f, i) => withSlots({ id: `${roomId}-f${i}`, ...f }));
}

/** Give a fixture empty item slots if its kind has any (shelves). */
export function withSlots(f) {
  const n = FIXTURES[f.kind].slots;
  return n && !f.slots ? { ...f, slots: Array(n).fill(null) } : f;
}

export function makeRoom(id, type, col, floor) {
  return { id, type, col, floor, fixtures: defaultFixtures(type, id) };
}

/** A shelf room (GDD §18 #8), in the next wallpaper along (ROOM_STYLES). */
function makeShelfRoom(state, col, floor) {
  const n = state.building.rooms.filter((r) => r.type === 'room').length;
  return { ...makeRoom(newId(state, 'r'), 'room', col, floor), style: n % ROOM_STYLES.length };
}

/** Add a room at (col, floor). A decoration room takes its `look`; a story room (GDD #147) also its story id. */
export function addRoom(state, type, col, floor, look = null, story = null) {
  if (hasRoom(state, col, floor)) return null;
  if (floor > 0 && !hasRoom(state, col, floor - 1)) return null; // nothing floats
  const room = type === 'room' ? makeShelfRoom(state, col, floor) : makeRoom(newId(state, 'r'), type, col, floor);
  if (type === 'scene') room.decor = { scene: look ?? ROOM_TYPES.scene.decor.scene }; // its look (GDD #108)
  if (story) room.story = story;
  state.building.rooms.push(room);
  fitShelves(state);
  events.emit('buildingChanged', { room });
  return room;
}

/** The next expansion the shop can buy ({ type, cost }), or null when there are none left. */
export function nextExpansion(state) {
  return EXPANSIONS.find((e) => !state.building.rooms.some((r) => r.type === e.type)) ?? null;
}

/** Buy the next expansion: a new ground-floor room on the right end of the shop. */
export function buildExpansion(state) {
  const next = nextExpansion(state);
  if (!next || state.coins < next.cost) return null;
  const col = Math.max(...state.building.rooms.filter((r) => r.floor === 0).map((r) => r.col)) + 1;
  addCoins(state, -next.cost);
  const room = addRoom(state, next.type, col, 0);
  events.emit('expanded', { room });
  return room;
}

// ---------------------------------------------------------------------------
// Shelf rooms, the Stairwell and more floors (GDD #58, #64, §18 #8): Grow -> Build a room -> tap a +
// spot. Rooms cost more the further they are from the middle; each staircase up costs more.
// ---------------------------------------------------------------------------

/** Rooms with shelves, where customers shop (the shop, shelf rooms, the Stairwell). */
export const sellingRooms = (state) => state.building.rooms.filter((r) => r.fixtures.some((f) => f.slots));
export const isShelfRoom = (room) => room.type === 'room';
/** Decoration rooms (GDD #107, #108): no shelves, just a scene. Story rooms (GDD #147) are decoration rooms too. */
export const isSceneRoom = (room) => room.type === 'scene';
/** Decoration rooms the player built (not the story's gifts, which don't raise the price or use up the free one). */
export const isBoughtScene = (room) => room.type === 'scene' && !room.story;
const shopOf = (state) => state.building.rooms.find((r) => r.type === 'shop') ?? state.building.rooms[0];

/** Shelf rooms open up once the Window Display is built (it stays the first milestone). */
export const canBuildRooms = (state) => state.building.rooms.some((r) => r.type === 'display');

export const hasStairwell = (state) => state.building.rooms.some((r) => r.type === 'stairs');
/** The Stairwell opens up once a shelf room is built; there's only one. */
export const canBuildStairwell = (state) => !hasStairwell(state) && state.building.rooms.some(isShelfRoom);

/** The Stairwell's room on each floor, bottom up (empty before it's built). */
export function stairRooms(state) {
  const bottom = state.building.rooms.find((r) => r.type === 'stairs');
  const out = [];
  for (let r = bottom; r; r = state.building.rooms.find((x) => x.col === bottom.col && x.floor === out.length)) out.push(r);
  return out;
}

/**
 * What the next shelf room costs: the same at every ＋ spot (GDD #129, so rooms can be moved later),
 * ROOM_COST times ROOM_GROWTH for each shelf room already built (GDD #80). col / floor are kept for callers.
 */
export function roomCost(state, col, floor = 0) {
  return niceCost(ROOM_COST * ROOM_GROWTH ** state.building.rooms.filter(isShelfRoom).length);
}

/**
 * Where a new room can go: either end of the ground floor, and on any floor the Stairwell reaches,
 * on top of a room (never floating) next to the Stairwell or another room on that floor.
 */
export function roomSpots(state) {
  const rooms = state.building.rooms;
  const cols = rooms.filter((r) => r.floor === 0).map((r) => r.col);
  const spots = [{ col: Math.min(...cols) - 1, floor: 0 }, { col: Math.max(...cols) + 1, floor: 0 }];
  for (const r of rooms) {
    const f = r.floor + 1;
    if (!hasStairwell(state) || hasRoom(state, r.col, f)) continue;
    if (hasRoom(state, r.col - 1, f) || hasRoom(state, r.col + 1, f)) spots.push({ col: r.col, floor: f });
  }
  return spots;
}

/** Decoration rooms open with the first shelf room (GDD #108), the same time as decorating. */
export const canBuildScenes = (state) => state.building.rooms.some(isShelfRoom);

/** What the next decoration room costs, wherever it goes: its own price track (GDD #108). */
export const sceneCost = (state) => niceCost(SCENE_COST * SCENE_GROWTH ** state.building.rooms.filter(isBoughtScene).length);

/** Build a decoration room with a look (DECOR.scene) at a + spot. Returns the room, or null. */
export function buildScene(state, col, floor, look = 'garden') {
  if (!canBuildScenes(state) || needsFullShop(state, 'scene')) return null;
  if (!roomSpots(state).some((p) => p.col === col && p.floor === floor)) return null;
  const cost = sceneCost(state);
  if (state.coins < cost) return null;
  const room = addRoom(state, 'scene', col, floor, look);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}

/** Build a shelf room at a + spot. Returns the room, or null if it can't be built. */
export function buildRoom(state, col, floor) {
  if (!canBuildRooms(state) || needsFullShop(state, 'room')) return null;
  if (!roomSpots(state).some((p) => p.col === col && p.floor === floor)) return null;
  const cost = roomCost(state, col, floor);
  if (state.coins < cost) return null;
  const room = addRoom(state, 'room', col, floor);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}

/**
 * Make room for a new column at `col`: every room from there on moves one place to the right, and
 * anyone walking between rooms keeps going to the same place (their paths are in some room's
 * coordinates, so points past the gap shift along with the rooms). Ground floor only (there's
 * nothing upstairs before the Stairwell).
 */
function insertColumn(state, col) {
  const S = ROOM_SIZE.W + ROOM_SIZE.T;
  const oldCol = new Map(state.building.rooms.map((r) => [r.id, r.col]));
  for (const r of state.building.rooms) if (r.col >= col) r.col += 1;
  const gap = (col - 0.5) * S; // the wall the new column opens up, in building x
  const move = (p, frame) => {
    const w = p.x + oldCol.get(frame) * S;
    if (w > gap) p.x += S;
    p.x -= (state.building.rooms.find((r) => r.id === frame).col - oldCol.get(frame)) * S;
  };
  const people = [state.keeper, ...state.stockers, state.cashier, ...Object.values(state.registers ?? {}).map((r) => r.cashier), ...(state.customers ?? [])].filter(Boolean);
  for (const a of people) {
    if (!oldCol.has(a.roomId)) continue;
    if (a.arriveRoom || a.legs?.length) { // walking in another room's coordinates
      move(a, a.roomId);
      for (const p of a.path) move(p, a.roomId);
      for (const l of a.legs ?? []) for (const p of l.path) move(p, l.frame);
      if (a.arriveRoom) {
        const arrive = state.building.rooms.find((r) => r.id === a.arriveRoom.roomId);
        const frame = state.building.rooms.find((r) => r.id === a.roomId);
        a.arriveRoom.offset = (arrive.col - frame.col) * S;
      }
    }
  }
}

/** Both halves of the Stairwell, right next to the shop (no cost; buildStairwell charges for it). */
export function addStairwell(state) {
  const col = shopOf(state).col + 1;
  insertColumn(state, col);
  const bottom = makeRoom(newId(state, 'r'), 'stairs', col, 0);
  const top = makeRoom(newId(state, 'r'), 'landing', col, 1);
  state.building.rooms.push(bottom, top);
  fitShelves(state);
  events.emit('buildingChanged', { room: bottom });
  return bottom;
}

/** What the next staircase costs: the Stairwell itself first, then each new floor up. */
export function stairCost(state) {
  const i = Math.max(0, stairRooms(state).length - 1);
  return i < STAIR_COSTS.length ? STAIR_COSTS[i] : niceCost(STAIR_COSTS.at(-1) * STAIR_GROWTH ** (i - STAIR_COSTS.length + 1));
}

/**
 * Build the Stairwell (GDD #58, #64): always right of the shop. The Window Display and any rooms on
 * that side move over one place. Returns its ground room, or null.
 */
export function buildStairwell(state) {
  if (!canBuildStairwell(state) || needsFullShop(state, 'stairs')) return null;
  const cost = stairCost(state);
  if (state.coins < cost) return null;
  const room = addStairwell(state);
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}

/** Another floor (GDD §18 #8): the stairs go on up from the top landing to a new one. No cost here. */
export function addFloor(state) {
  const top = stairRooms(state).at(-1);
  if (!top || top.floor === 0) return null;
  top.fixtures.push({ id: `${top.id}-f${top.fixtures.length}`, kind: 'stairs', x: -1.1, z: -0.7 });
  const room = makeRoom(newId(state, 'r'), 'landing', top.col, top.floor + 1);
  state.building.rooms.push(room);
  fitShelves(state);
  events.emit('buildingChanged', { room });
  return room;
}

/** Buy the next floor up. Returns the new landing, or null. */
export function buildFloor(state) {
  if (!hasStairwell(state) || needsFullShop(state, 'stairs')) return null;
  const cost = stairCost(state);
  if (state.coins < cost) return null;
  const room = addFloor(state);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}

/**
 * Taking down the top floor (GDD #160): free, in the morning, when that floor has nothing on it but the
 * Stairwell's landing, and only floors added with Another floor (the Stairwell keeps its first two).
 * No coins back; building it again costs the same as before. Its shelf's items and any boxes left there go
 * back to the doorstep as boxes; the floor's stocker goes home (still hired, back when the floor is rebuilt).
 */
export function canRemoveTopFloor(state) {
  const stairs = stairRooms(state);
  if (stairs.length < 3) return false;
  const top = stairs.at(-1);
  return !state.building.rooms.some((r) => r.floor === top.floor && r !== top);
}

/** Take the top floor down (see canRemoveTopFloor). Returns the floor number taken down, or null. */
export function removeTopFloor(state) {
  if (state.day.phase !== 'morning' || !canRemoveTopFloor(state)) return null;
  const stairs = stairRooms(state), top = stairs.at(-1), below = stairs.at(-2);
  finishWalks(state); // nobody's halfway up the stairs to it
  const doorstep = shopRoomId(state);
  // The shelf's items, one box per item, and the boxes waiting there go to the doorstep.
  const stock = {};
  for (const f of top.fixtures) for (const id of f.slots ?? []) if (id) stock[id] = (stock[id] ?? 0) + 1;
  const waiting = state.boxes.filter((b) => b.roomId === top.id);
  for (const b of waiting) state.boxes.splice(state.boxes.indexOf(b), 1);
  for (const b of waiting) dropBox(state, b.itemId, b.qty, doorstep);
  for (const [itemId, qty] of Object.entries(stock)) dropBox(state, itemId, qty, doorstep);
  // The floor's stocker goes home with whatever they're holding left on the doorstep. Still hired: state.helpers
  // says 'away' (truthy) until the floor is built again (sim/stocker.js).
  const who = `stocker${top.floor + 1}`;
  if (state.helpers?.[who]) state.helpers[who] = 'away';
  for (const b of state.stockers.filter((x) => x.who === who)) for (const box of boxesHeld(b)) dropBox(state, box.itemId, box.qty, doorstep);
  state.stockers = state.stockers.filter((x) => x.who !== who);
  // Anyone else up there steps down a floor; the stockers and the shopkeeper think again.
  for (const a of [state.keeper, ...state.stockers, ...(state.customers ?? [])]) {
    if (a.roomId !== top.id) continue;
    Object.assign(a, { roomId: below.id, y: 0, path: [{ x: a.x, z: a.z }], legs: [], arriveRoom: null });
  }
  for (const b of state.stockers) Object.assign(b, { job: null, timer: 0, trip: [] });
  const k = state.keeper;
  if (k.task?.boxId && !state.boxes.some((b) => b.id === k.task.boxId)) k.task = null;
  if (k.fixtureId && top.fixtures.some((f) => f.id === k.fixtureId)) { k.fixtureId = null; k.task = null; }
  // The stairs below stop at the new top landing.
  const flight = below.fixtures.findLastIndex((f) => f.kind === 'stairs');
  if (flight >= 0) below.fixtures.splice(flight, 1);
  state.building.rooms = state.building.rooms.filter((r) => r !== top);
  events.emit('boxesChanged');
  events.emit('buildingChanged', { room: below });
  events.emit('floorRemoved', { floor: top.floor });
  return top.floor;
}

// ---------------------------------------------------------------------------
// Register rooms (GDD #73, #133): a copy of the shop with its own cashier, on any + spot (like decoration
// rooms), from the Stairwell on. Their own price track: each one dearer than the last.
// ---------------------------------------------------------------------------

export const registerRoomsBuilt = (state) => state.building.rooms.filter((r) => r.type === 'register');

/** Register rooms open with the Stairwell. */
export const canBuildRegisters = (state) => hasStairwell(state);

export const registerCost = (state) => niceCost(REGISTER_COST * REGISTER_GROWTH ** registerRoomsBuilt(state).length);

/** A register room's cashier (REGISTER_CASHIERS), by the order the rooms were built: Kai, Nell, ... */
export function registerCashierOf(state, roomId) {
  const i = registerRoomsBuilt(state).findIndex((r) => r.id === roomId);
  return REGISTER_CASHIERS[Math.max(0, i) % REGISTER_CASHIERS.length];
}

/** Build a register room at a + spot (GDD #133). Returns the room, or null. */
export function buildRegister(state, col, floor) {
  if (!canBuildRegisters(state) || needsFullShop(state, 'register')) return null;
  if (!roomSpots(state).some((p) => p.col === col && p.floor === floor)) return null;
  const cost = registerCost(state);
  if (state.coins < cost) return null;
  const room = addRoom(state, 'register', col, floor);
  if (!room) return null;
  addCoins(state, -cost);
  events.emit('expanded', { room });
  return room;
}
