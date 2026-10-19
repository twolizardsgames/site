// One-time buys from the Grow sheet: upgrades and helpers. Both are kept as id -> true.

import { events } from '../core/events.js';
import { UPGRADES, HELPERS } from '../data/upgrades.js';
import { FIXTURES } from '../data/fixtures.js';
import { addCoins } from './economy.js';
import { roundOpen } from './catalog.js';
import { sparkleFor } from './collection.js';
import { rungNeedsFullShop } from './fullshop.js';

export const hasUpgrade = (state, id) => !!state.upgrades?.[id];
export const hasHelper = (state, id) => !!state.helpers?.[id];

export function buyUpgrade(state, id) {
  const u = UPGRADES[id];
  if (!u || hasUpgrade(state, id) || !canBuyUpgrade(state, id) || rungNeedsFullShop(state, u) || state.coins < u.cost) return false;
  addCoins(state, -u.cost);
  state.upgrades[id] = true;
  if (id === 'tall') fitShelves(state);
  if (id === 'bighouse') state.sparkle = sparkleFor(state); // five empty rooms: no full-house bonus until they're filled
  events.emit('upgradeBought', { id });
  return true;
}

/** Enough happy customers for this rung of the ladder (GDD #83)? */
const heartsFor = (state, thing) => (state.hearts ?? 0) >= (thing?.hearts ?? 0);

/**
 * Has what it needs first: a helper (each stocker the one before), the Window Display (Rosa), or the
 * Bright colors and the Window Display (the Bigger Dream Dollhouse).
 */
function needsMet(state, needs) {
  if (!needs) return true;
  const display = state.building.rooms.some((r) => r.type === 'display' && r.floor === 0);
  if (needs === 'display') return display;
  if (needs === 'bright') return display && roundOpen(state, 1);
  return hasHelper(state, needs);
}

/** Can this upgrade be bought now (enough Hearts, and its helper hired)? */
export const canBuyUpgrade = (state, id) => heartsFor(state, UPGRADES[id]) && needsMet(state, UPGRADES[id]?.needs);

/** Can this helper be hired now (enough Hearts, and what they need)? */
export const canHire = (state, id) => heartsFor(state, HELPERS[id]) && needsMet(state, HELPERS[id]?.needs);

/** Every helper and upgrade, in ladder order: [{ kind: 'helper' | 'upgrade', id, ...data }] (GDD #83). */
export const LADDER = [
  ...Object.entries(HELPERS).map(([id, h]) => ({ kind: 'helper', id, ...h })),
  ...Object.entries(UPGRADES).map(([id, u]) => ({ kind: 'upgrade', id, ...u })),
].sort((a, b) => a.hearts - b.hearts || a.cost - b.cost);

const owns = (state, rung) => (rung.kind === 'helper' ? hasHelper(state, rung.id) : hasUpgrade(state, rung.id));
const ready = (state, rung) => (rung.kind === 'helper' ? canHire(state, rung.id) : canBuyUpgrade(state, rung.id));

/**
 * The Grow sheet's ladder (GDD #83): what you can get now, the next one still locked (shown as a teaser,
 * with `why`: { hearts } still to make, or `needs`), and what you already have. Available ones and the next one have
 * `full: true` while they need the Full shop (GDD #150).
 */
export function ladder(state) {
  // Ones that need the Full shop still come up when they would, marked `full` (GDD #150).
  const available = LADDER.filter((r) => !owns(state, r) && ready(state, r)).map((r) => ({ ...r, full: rungNeedsFullShop(state, r) }));
  const owned = LADDER.filter((r) => owns(state, r));
  const locked = LADDER.find((r) => !owns(state, r) && !ready(state, r));
  const next = locked && {
    ...locked,
    full: rungNeedsFullShop(state, locked), // `full` in the data only says it can need it (GDD #150)
    why: heartsFor(state, locked) ? { needs: locked.needs } : { hearts: locked.hearts - (state.hearts ?? 0) },
  };
  return { available, next: next ?? null, owned };
}

export function hireHelper(state, id) {
  const h = HELPERS[id];
  if (!h || hasHelper(state, id) || !canHire(state, id) || rungNeedsFullShop(state, h) || state.coins < h.cost) return false;
  addCoins(state, -h.cost);
  state.helpers[id] = true;
  events.emit('helperHired', { id });
  return true;
}

/** With Tall Shelves (GDD #72), every shelf has its top row of slots too; call after building a room. */
export function fitShelves(state) {
  if (!hasUpgrade(state, 'tall')) return;
  for (const room of state.building.rooms) {
    for (const f of room.fixtures) {
      const n = FIXTURES[f.kind].tallSlots;
      while (f.slots && n && f.slots.length < n) f.slots.push(null);
    }
  }
}
