// The Full shop (GDD #134, #135, #148, #149): a one-time purchase in the store apps. Free without it: the shop, the
// Window Display, the first shelf room, one decoration room, and the original colors (round 1 of the Collection).
// It opens more shelf and decoration rooms, the Stairwell and its floors, register rooms, the Bright and Dazzle
// colors, and the helpers and upgrades from Ollie the Greeter up (#150). Shops already past the lock keep everything they have (rooms, open pages) but need it to build more.
// The lock is only on where the Full shop is sold (the store apps, and the test build's pretend store):
// `state.fullShopLock` is live-only, set by main.js from the store (core/store.js), so the public web game, the
// tests and the balance bot have no lock.

import { ownsPack } from './packs.js';

export const FULL_SHOP = 'fullshop';

/** Does this shop have everything (bought the Full shop, or plays where it isn't sold)? */
export const hasFullShop = (state) => !state.fullShopLock || ownsPack(state, FULL_SHOP);

/**
 * Does building this kind of room need the Full shop right now? kind: 'room' (shelf), 'scene' (decoration),
 * 'stairs' (the Stairwell or another floor), 'register'. The first shelf room and the first decoration room are free.
 */
export function needsFullShop(state, kind) {
  if (hasFullShop(state)) return false;
  const built = (type) => state.building.rooms.filter((r) => r.type === type && !r.story).length; // story rooms are gifts (GDD #147)
  if (kind === 'room') return built('room') >= 1;
  if (kind === 'scene') return built('scene') >= 1;
  return kind === 'stairs' || kind === 'register';
}

/** Does a helper or upgrade on the Grow ladder (`full` in data/upgrades.js, GDD #150) need the Full shop right now? */
export const rungNeedsFullShop = (state, rung) => !!rung?.full && !hasFullShop(state);

/** Does a catalog round (0 original, 1 Bright, 2 Dazzle) need the Full shop to open? */
export const roundNeedsFullShop = (state, round) => round > 0 && !hasFullShop(state);
