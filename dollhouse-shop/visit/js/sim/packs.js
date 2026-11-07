// Decoration packs (GDD §16, #106, #109): which packs the player owns (state.packs) and whose outside scene is on
// (state.outside). Buying happens in the store builds (core/store.js); this only records the result, so a pack
// given back by Restore purchases, or by the debug panel, goes through givePack too.
// A pack's pieces are owned with it: room styles (sim/decor.js ownsDecor), shopkeeper pieces (sim/rewards.js ownsLook).
// `state.allPacks` (GDD #168) owns every pack there is or ever will be, the Full shop too: set by a gift link
// (core/gift.js) or by buying the everything bundle (GDD #171).

import { events } from '../core/events.js';
import { PACKS, PACK_IDS, BUNDLE } from '../data/packs.js';

export const ownsPack = (state, id) => (state.allPacks ? !!PACKS[id] : !!state.packs?.[id]);

/** Every pack, now and in future updates, is the player's. Returns true if it's new. */
export function giveAllPacks(state) {
  if (state.allPacks) return false;
  state.allPacks = true;
  events.emit('packGot', { all: true });
  return true;
}

/** The player now owns a pack. A new outside scene goes straight on, so it shows at once. Returns true if it's new. */
export function givePack(state, id) {
  if (PACKS[id]?.bundle) return giveAllPacks(state);
  if (!PACKS[id] || ownsPack(state, id)) return false;
  state.packs = { ...state.packs, [id]: true };
  if (PACKS[id].outside) state.outside = id;
  events.emit('packGot', { id });
  return true;
}

/**
 * The everything bundle's offer on a pack card (GDD #175, #184): shown whenever the bundle isn't yours (it has every
 * future pack too, so it's worth offering even when what's left costs less). `amount(id)` is a price as a number (the
 * store's, in the player's currency). Returns { price, worth, all, saving } (`all`: nothing bought yet; `saving`: what
 * you don't have yet costs more than the bundle, bought one by one) or null (also when the bundle's price is unknown).
 */
export function bundleOffer(state, amount) {
  if (!PACKS[BUNDLE] || ownsPack(state, BUNDLE)) return null;
  const left = PACK_IDS.filter((id) => id !== BUNDLE && !ownsPack(state, id));
  const price = amount(BUNDLE);
  const worth = Math.round(left.reduce((sum, id) => sum + amount(id), 0) * 100) / 100;
  if (Number.isNaN(price)) return null;
  return { price, worth, all: left.length === PACK_IDS.length - 1, saving: worth > price }; // false when a price is unknown (NaN)
}

/** Take a pack away again (the debug panel only; a store purchase is never undone). */
export function removePack(state, id) {
  if (!ownsPack(state, id)) return false;
  if (state.allPacks) { // back to a plain list of every pack but this one
    state.allPacks = false;
    state.packs = Object.fromEntries(Object.keys(PACKS).map((p) => [p, true]));
  }
  const { [id]: _, ...rest } = state.packs;
  state.packs = rest;
  if (state.outside === id) state.outside = null;
  events.emit('packGot', { id, removed: true });
  return true;
}

/**
 * Is it time for the Welcome pack's card (GDD #135, #171)? Once ever, on a morning once decorating is open (so the
 * morning after Mrs. Maple's visit for a new shop), only where packs are sold (`shown`), never during a story visit and
 * not if the pack is already yours. The only purchase card that ever opens on its own.
 */
export const welcomeOfferDue = (state, shown) => !!shown && !!state.decorOpen && !state.welcomeOffered
  && state.day?.phase === 'morning' && (!state.visit || state.visit.step === 'leaving') && !ownsPack(state, 'welcome');

/** The Welcome pack's card has shown; it never opens on its own again. */
export function markWelcomeOffered(state) { state.welcomeOffered = true; }

/** Switch an owned pack's outside scene on (only one shows at a time), or every scene off with null. */
export function setOutside(state, id) {
  if (id !== null && (!PACKS[id]?.outside || !ownsPack(state, id))) return false;
  if (state.outside === id) return true;
  state.outside = id;
  events.emit('outsideChanged', { id });
  return true;
}
