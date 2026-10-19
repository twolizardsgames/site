// Decoration packs (GDD §16, #106, #109): which packs the player owns (state.packs) and whose outside scene is on
// (state.outside). Buying happens in the store builds (core/store.js); this only records the result, so a pack
// given back by Restore purchases, or by the debug panel, goes through givePack too.
// A pack's pieces are owned with it: room styles (sim/decor.js ownsDecor), shopkeeper pieces (sim/rewards.js ownsLook).
// `state.allPacks` (GDD #168) owns every pack there is or ever will be, the Full shop too: set by a gift link
// (core/gift.js), and later perhaps by the everything bundle.

import { events } from '../core/events.js';
import { PACKS } from '../data/packs.js';

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
  if (!PACKS[id] || ownsPack(state, id)) return false;
  state.packs = { ...state.packs, [id]: true };
  if (PACKS[id].outside) state.outside = id;
  events.emit('packGot', { id });
  return true;
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

/** Switch an owned pack's outside scene on (only one shows at a time), or every scene off with null. */
export function setOutside(state, id) {
  if (id !== null && (!PACKS[id]?.outside || !ownsPack(state, id))) return false;
  if (state.outside === id) return true;
  state.outside = id;
  events.emit('outsideChanged', { id });
  return true;
}
