// Moving rooms (GDD #157, §9.6): in the morning, hold a room and drag it somewhere else in the house.
// The Stairwell is the anchor (before it's built, the shop is) and never moves. Dropping a room pushes
// that floor's rooms one place outward, away from the anchor. A room with nothing under it drops a
// floor, which can leave the one above it with nothing under it, and so on; once nothing can drop, gaps
// close toward the anchor (upstairs rooms are walked through their neighbors' doorways, and the ground
// floor never has an empty lot). The shop and the Window Display stay on the ground floor.
//
// Everything inside a room is in the room's own coordinates (shelves, boxes, showcase, anyone standing
// there), so a move only changes rooms' col / floor. People walking between rooms are put down at the
// end of their walk first (finishWalks), since their paths are in some other room's coordinates.

import { events } from '../core/events.js';
import { stairRooms, hasStairwell } from './building.js';
import { finishWalk } from './route.js';

/** Rooms that never leave the ground floor (the sidewalk, doorstep and window-peekers belong to them). */
const GROUND_ONLY = new Set(['shop', 'display']);

/** Moving rooms is a morning job. */
export const canMoveRooms = (state) => state.day.phase === 'morning' && movableRooms(state).length > 0;

/** The column everything is pushed away from and pulled toward: the Stairwell's, else the shop's. */
export function anchorCol(state) {
  const rooms = state.building.rooms;
  const bottom = rooms.find((r) => r.type === 'stairs') ?? rooms.find((r) => r.type === 'shop') ?? rooms[0];
  return bottom.col;
}

/** Can this room be picked up? Everything but the Stairwell (and the shop until the Stairwell is built). */
export function isMovable(state, room) {
  if (room.type === 'stairs' || room.type === 'landing') return false;
  return room.type !== 'shop' || hasStairwell(state);
}

export const movableRooms = (state) => state.building.rooms.filter((r) => isMovable(state, r));

/** The highest floor a room can be dropped on: the top of the Stairwell (the ground floor before it). */
export const topFloor = (state) => Math.max(0, stairRooms(state).length - 1);

const key = (col, floor) => `${col},${floor}`;

/**
 * Let the house settle: first anything with nothing under it drops (a whole column comes down a floor),
 * and only once nothing can drop does a floor close its gaps toward the anchor; then drop again, and so
 * on until nothing moves (user, 2026-10-16: sliding a room in under others felt wrong). `cells` is a Map
 * id -> { col, floor } (changed in place). Each step brings rooms lower or closer to the anchor, so it ends.
 */
function settle(cells, anchor) {
  for (let guard = 0; guard < 10000; guard++) {
    if (dropOnce(cells) || closeGaps(cells, anchor)) continue;
    return cells;
  }
  return cells;
}

/** Gravity, bottom up: anything with an empty cell under it drops one floor. True if anything dropped. */
function dropOnce(cells) {
  const taken = new Set([...cells.values()].map((c) => key(c.col, c.floor)));
  let dropped = false;
  for (const c of [...cells.values()].sort((a, b) => a.floor - b.floor)) {
    if (c.floor === 0 || taken.has(key(c.col, c.floor - 1))) continue;
    taken.delete(key(c.col, c.floor));
    c.floor -= 1;
    taken.add(key(c.col, c.floor));
    dropped = true;
  }
  return dropped;
}

/** Every floor's rooms slide toward the anchor until they touch. True if anything slid. */
function closeGaps(cells, anchor) {
  let slid = false;
  const floors = new Map();
  for (const c of cells.values()) {
    if (!floors.has(c.floor)) floors.set(c.floor, []);
    floors.get(c.floor).push(c);
  }
  for (const row of floors.values()) {
    const left = row.filter((c) => c.col < anchor).sort((a, b) => b.col - a.col);
    const right = row.filter((c) => c.col > anchor).sort((a, b) => a.col - b.col);
    // The anchor column is filled on every floor (the Stairwell, or the shop on the only floor).
    left.forEach((c, i) => { if (c.col !== anchor - 1 - i) { c.col = anchor - 1 - i; slid = true; } });
    right.forEach((c, i) => { if (c.col !== anchor + 1 + i) { c.col = anchor + 1 + i; slid = true; } });
  }
  return slid;
}

/**
 * Where a drop on (col, floor) puts the room: the cell it was dropped on, after the room has left its
 * old place. Dropping on the anchor column goes on the side the finger is on (`side`: -1 or 1).
 */
function dropCell(state, room, col, floor, side) {
  const anchor = anchorCol(state);
  const f = GROUND_ONLY.has(room.type) ? 0 : Math.max(0, Math.min(topFloor(state), floor));
  const c = col === anchor ? anchor + (side < 0 ? -1 : 1) : col;
  return { col: c, floor: f };
}

/** The house with `roomId` lifted out: everyone else's place (id -> { col, floor }). */
export function planLift(state, roomId) {
  const cells = new Map(state.building.rooms.filter((r) => r.id !== roomId).map((r) => [r.id, { col: r.col, floor: r.floor }]));
  return settle(cells, anchorCol(state));
}

/**
 * Where every room ends up if `roomId` is dropped on (col, floor), in today's columns: a Map
 * id -> { col, floor }, or null if it can't be moved. Doesn't change anything (the drag preview).
 * `side` picks the side for a drop on the anchor column (where the finger is, -1 left or 1 right).
 */
export function planMove(state, roomId, col, floor, side = 1) {
  const room = state.building.rooms.find((r) => r.id === roomId);
  if (!room || !isMovable(state, room)) return null;
  const anchor = anchorCol(state);
  const to = dropCell(state, room, col, floor, side);
  // Put back where it came from: nothing changes (even if lifting it would have let rooms drop).
  if (to.col === room.col && to.floor === room.floor) return new Map(state.building.rooms.map((r) => [r.id, { col: r.col, floor: r.floor }]));
  const cells = planLift(state, roomId);
  // Push that floor's rooms one place outward, away from the anchor, to make space.
  const dir = to.col < anchor ? -1 : 1;
  for (const c of cells.values()) {
    if (c.floor === to.floor && (dir < 0 ? c.col <= to.col : c.col >= to.col)) c.col += dir;
  }
  cells.set(roomId, to);
  return settle(cells, anchor);
}

/** Did anything move? */
const anyChange = (state, cells) => state.building.rooms.some((r) => {
  const c = cells.get(r.id);
  return c && (c.col !== r.col || c.floor !== r.floor);
});

/** Put everyone who's walking between rooms down at the end of their walk (before rooms move). */
export function finishWalks(state) {
  const people = [
    state.keeper, ...state.stockers, state.cashier, state.greeter, state.dresser,
    ...Object.values(state.registers ?? {}).map((r) => r.cashier),
    ...(state.customers ?? []), ...(state.visit?.visitors ?? []),
  ].filter(Boolean);
  for (const a of people) if (a.roomId && a.path) finishWalk(state, a);
}

/**
 * Drop `roomId` on (col, floor) (see planMove). Returns true if the house changed. Free (GDD #157).
 * Emits 'roomsMoved' with the room, so the house is redrawn once.
 */
export function moveRoom(state, roomId, col, floor, side = 1) {
  if (!canMoveRooms(state)) return false;
  const cells = planMove(state, roomId, col, floor, side);
  if (!cells || !anyChange(state, cells)) return false;
  finishWalks(state);
  for (const r of state.building.rooms) Object.assign(r, cells.get(r.id));
  const room = state.building.rooms.find((r) => r.id === roomId);
  events.emit('roomsMoved', { room });
  return true;
}
