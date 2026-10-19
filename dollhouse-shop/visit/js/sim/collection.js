// The Collection and the Dream Dollhouse: items unlock when first delivered (see day.js) and can be
// placed in the dollhouse's rooms for free. What's on show sets the shop's Sparkle, which brings
// more visitors and makes some of them stop at the window.

import { events } from '../core/events.js';
import { ITEMS } from '../data/items.js';
import { DOLLHOUSE_SLOTS, SPARKLE } from '../data/dollhouse.js';
import { ROOM_SIZE, ROOM_TRAFFIC, SCENE_TRAFFIC, SHOWCASE } from '../data/rooms.js';
import { collectionBonus } from './rewards.js';

export const slotById = (slotId) => DOLLHOUSE_SLOTS.find((s) => s.id === slotId);

/** Has the Bigger Dream Dollhouse (GDD #92): 3 × 3 rooms instead of 2 × 2. */
export const bigHouse = (state) => !!state.upgrades?.bighouse;

/** The dollhouse's rooms, top storey first and left to right (the order of the decorate tabs). */
export function houseSlots(state) {
  const big = bigHouse(state);
  const cell = (s) => (big ? s.cell3 : s.cell);
  return DOLLHOUSE_SLOTS.filter((s) => big || !s.big).sort((a, b) => cell(b)[1] - cell(a)[1] || cell(a)[0] - cell(b)[0]);
}

/** Any item fits any room (GDD #111); this only checks both exist. */
export function fitsSlot(slotId, itemId) {
  return Boolean(ITEMS[itemId] && slotById(slotId));
}

/** The Window Display room (where the Dream Dollhouse lives), or null before the first expansion. */
export const displayRoom = (state) => state.building.rooms.find((r) => r.type === 'display') ?? null;

/**
 * The Sparkle of what's on show: each item in the Dream Dollhouse, plus a bonus once every room has
 * something, plus half of each showcase item's (GDD #96, sim/showcase.js).
 */
export function sparkleFor(state) {
  const slots = houseSlots(state);
  const placed = slots.map((s) => state.dollhouse.slots[s.id]).filter(Boolean);
  const total = placed.reduce((sum, id) => sum + (ITEMS[id]?.sparkle ?? 0), 0);
  const shown = (state.building?.rooms ?? []).reduce((sum, r) => sum + Math.round((ITEMS[r.showcase]?.sparkle ?? 0) * SHOWCASE.sparkle), 0);
  return total + (placed.length === slots.length ? SPARKLE.fullHouse : 0) + shown;
}

/** Put a Collection item in a dollhouse room (or `null` to empty it). Returns true if it changed. */
export function placeInDollhouse(state, slotId, itemId) {
  if (!displayRoom(state) || !houseSlots(state).some((s) => s.id === slotId)) return false;
  if (itemId !== null && (!state.collection[itemId] || !fitsSlot(slotId, itemId))) return false;
  if ((state.dollhouse.slots[slotId] ?? null) === itemId) return false;
  const before = state.sparkle;
  if (itemId === null) delete state.dollhouse.slots[slotId];
  else state.dollhouse.slots[slotId] = itemId;
  state.sparkle = sparkleFor(state);
  events.emit('dollhouseChanged', { slotId, itemId, sparkle: state.sparkle, gained: state.sparkle - before });
  return true;
}

export const dollhouseItems = (state) => new Set(Object.values(state.dollhouse.slots).filter(Boolean));

/**
 * How many times as often visitors arrive: Sparkle and the Collection bonus (GDD #70), times the
 * shop's size (GDD #95), which keeps growing after Sparkle tops out.
 */
export function trafficBoost(state) {
  return (1 + sparkleBoost(state.sparkle) + collectionBonus(state)) * roomBoost(state);
}

/**
 * Visitors from the shop's size (GDD #95, #105): +15% per shelf room, so ×2.5 with ten and ×4 with twenty,
 * and +25% per decoration room (GDD #108).
 */
export const roomBoost = (state) => 1 + state.building.rooms.reduce((n, r) =>
  n + (r.type === 'room' ? ROOM_TRAFFIC : r.type === 'scene' ? SCENE_TRAFFIC : 0), 0);

/** Extra visitors from Sparkle, e.g. 0.4 for +40%: always more with more Sparkle, a little less each time. */
export function sparkleBoost(sparkle) {
  return (SPARKLE.trafficMore * sparkle) / (sparkle + SPARKLE.trafficHalf);
}

/** Chance a new visitor stops at the window first (0 with nothing on show or no window). */
export function peekChance(state) {
  if (!state.sparkle || windowX(state) === null) return 0;
  const base = Math.min(SPARKLE.peekMax, SPARKLE.peekBase + state.sparkle * SPARKLE.peekPer);
  return showingOff(state) ? Math.min(SPARKLE.keeperPeekMax, base + SPARKLE.keeperPeek) : base;
}

/** Chance a window-peeker wants something from the dollhouse. */
export const peekWantChance = (state) => (showingOff(state) ? SPARKLE.keeperPeekWant : SPARKLE.peekWant);

/** The shopkeeper or Rosa the window dresser (GDD #72) is showing off the Dream Dollhouse. */
export const showingOff = (state) => keeperShowingOff(state) || !!state.dresser;

/** The shopkeeper is in the Window Display room, showing off the Dream Dollhouse (GDD #41). */
export const keeperShowingOff = (state) => {
  const room = displayRoom(state);
  return !!room && state.keeper.roomId === room.id;
};

/**
 * Where to stand to look in the window, as x in the shop room's local coordinates (the street runs
 * along the whole building). Null if there's no ground-floor Window Display.
 */
export function windowX(state) {
  const shop = state.building.rooms.find((r) => r.type === 'shop');
  const display = state.building.rooms.find((r) => r.type === 'display' && r.floor === 0);
  if (!shop || !display) return null;
  return (display.col - shop.col) * (ROOM_SIZE.W + ROOM_SIZE.T);
}
