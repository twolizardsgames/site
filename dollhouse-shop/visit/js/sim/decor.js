// The decoration shop (GDD #68): Ribbons 🎀 are earned by caring for customers and collecting, and
// spent on room styles. A bought style is owned in every room for good (state.decor.owned); what each
// room wears is room.decor (kind -> option id), missing kinds showing the room's defaults.
// Decorating opens on day 5 with Mrs. Maple's story visit (GDD #151, sim/story.js; it was the first shelf room, #86):
// until then there are no Ribbons at all, and when it opens the Collection's one-time Ribbons (every item and theme found so far) are paid in one go.
// A theme's reward style (#69) is only ever a reward: it can't be bought with Ribbons (#86).

import { events } from '../core/events.js';
import { DECOR, RIBBONS, THEME_STYLES, decorOption } from '../data/decor.js';
import { ITEMS, SETS, baseOf } from '../data/items.js';
import { ROOM_TYPES } from '../data/rooms.js';
import { ownsPack } from './packs.js';
import { roundOpen } from './catalog.js';
import { PACKS, LOOK_PACK_IDS } from '../data/packs.js';

export function addRibbons(state, amount, why, detail = {}) {
  if (amount <= 0 || !state.decorOpen) return; // no Ribbons before decorating opens (GDD #86)
  state.ribbons += amount;
  state.day.stats.ribbons = (state.day.stats.ribbons ?? 0) + amount;
  events.emit('ribbons', { amount, why, total: state.ribbons, ...detail });
}

/** The one-time Ribbons a Collection has earned: every item found and every theme complete. */
export function ribbonsForCollection(collection) {
  const found = Object.keys(ITEMS).filter((id) => collection[id]);
  const themes = Object.keys(SETS).filter((set) => themeComplete(collection, set));
  return found.length * RIBBONS.newItem + themes.length * RIBBONS.theme;
}

export const themeComplete = (collection, set) => Object.keys(ITEMS).filter((id) => ITEMS[id].set === set).every((id) => collection[id]);

/**
 * A sale rang up: each item someone wished for uses up its wish note (+1 each), and a window-peeker
 * buying what they pointed at earns one more.
 */
export function ribbonsForSale(state, customer, itemIds) {
  for (const itemId of itemIds) {
    const i = state.wishes.findIndex((w) => baseOf(w.itemId) === baseOf(itemId)); // any color grants it (GDD #78)
    if (i < 0) continue;
    state.wishes.splice(i, 1);
    events.emit('wishGranted', { itemId, customerId: customer?.id });
    addRibbons(state, RIBBONS.wish, 'wish');
  }
  if (customer?.windowWant && itemIds.some((id) => baseOf(id) === baseOf(customer.windowWant))) addRibbons(state, RIBBONS.window, 'window');
}

/**
 * New Collection items (+1 each) and any themes they complete (+3 each). A complete theme is announced
 * (`themeDone`) even before decorating opens; its room style waits for you either way.
 */
export function ribbonsForFinds(state, discovered) {
  if (!discovered.length) return;
  addRibbons(state, discovered.length * RIBBONS.newItem, 'find');
  const sets = new Set(discovered.map((id) => ITEMS[id].set));
  for (const set of sets) {
    if (!themeComplete(state.collection, set)) continue;
    const [kind, id] = THEME_STYLES[set];
    const bought = !!state.decor.owned[`${kind}:${id}`];
    const ribbons = state.decorOpen ? RIBBONS.theme : 0;
    addRibbons(state, ribbons, 'theme', { set });
    events.emit('themeDone', { set, ribbons, style: bought || !state.decorOpen ? null : { kind, id } });
  }
}

/**
 * Open decorating (GDD #86, #151), at the end of the story's chapter 2 (sim/story.js): Ribbons start, beginning with every
 * one-time Ribbon the Collection has earned so far. Returns true if it just opened.
 */
export function openDecor(state) {
  if (state.decorOpen) return false;
  state.decorOpen = true;
  const ribbons = ribbonsForCollection(state.collection);
  addRibbons(state, ribbons, 'open');
  events.emit('decorOpened', { ribbons });
  return true;
}

/** The end-of-day gift: one Ribbon for every few happy customers. */
export function ribbonsForDay(state) {
  addRibbons(state, Math.floor(state.day.stats.served / RIBBONS.perHappy), 'day');
}

/** The theme whose completion gives this style (GDD #69), or null. */
export function rewardTheme(kind, id) {
  return Object.keys(THEME_STYLES).find((set) => THEME_STYLES[set][0] === kind && THEME_STYLES[set][1] === id) ?? null;
}

/** Free, bought, a complete theme's reward (worked out from the Collection), or in a pack you own (GDD #106). */
export function ownsDecor(state, kind, id) {
  const o = decorOption(kind, id);
  if (!o) return false;
  if (o.pack) return ownsPack(state, o.pack);
  if (o.story) return kind !== 'scene' && !!state.story?.seen.includes(o.story); // story gifts (GDD #148); story rooms' looks are never picked
  if (o.price === 0 || state.decor.owned[`${kind}:${id}`]) return true;
  const set = rewardTheme(kind, id);
  return !!set && themeComplete(state.collection, set);
}

/** Buy a style with Ribbons. Theme reward styles (GDD #86) and pack pieces (#106) can't be. Returns true if it's now yours. */
export function buyDecor(state, kind, id) {
  const o = decorOption(kind, id);
  if (!o || o.pack || o.story || rewardTheme(kind, id) || ownsDecor(state, kind, id) || state.ribbons < o.price) return false;
  state.ribbons -= o.price;
  state.decor.owned[`${kind}:${id}`] = true;
  if (state.decor.seen) state.decor.seen[`${kind}:${id}`] = 2; // bought on purpose: not "new"
  events.emit('decorBought', { kind, id });
  return true;
}

/** Which kinds a room can wear: curtains need a window, the corner piece needs a plant spot. */
export function canStyle(room, kind) {
  if (!(kind in DECOR) || room.story) return false; // a story room's look is part of the story (GDD #147)
  if (room.type === 'scene' || kind === 'scene') return room.type === 'scene' && kind === 'scene'; // a decoration room's look is the whole room (GDD #108)
  if (kind === 'curtain') return !!ROOM_TYPES[room.type].window;
  if (kind === 'corner') return room.fixtures.some((f) => f.kind === 'plant');
  if (kind === 'rug') return room.fixtures.some((f) => f.kind === 'rug');
  return true;
}

/** Put an owned style on a room. */
export function styleRoom(state, roomId, kind, id) {
  const room = state.building.rooms.find((r) => r.id === roomId);
  if (!room || !ownsDecor(state, kind, id)) return false;
  room.decor = { ...room.decor, [kind]: id };
  events.emit('decorChanged', { roomId, kind, id });
  return true;
}

// ---------------------------------------------------------------------------------------------------
// What's new in Decorate (GDD #122): looks that opened up since the player last opened the panel get a dot on the
// 🎨 Decorate button and a "new" tag in the panel. A look's status: 0 hidden, 1 shown (still to get), 2 yours.
// state.decor.seen keeps the status each look had when last seen ('kind:id' -> 1 | 2; 'outside:<pack>' for a pack's
// outside scene); a look is new when it's higher now: a prize wallpaper that appeared when its colour round opened,
// a Collection prize won, a pack's pieces. Buying one with Ribbons isn't news (buyDecor marks it seen).
// `packsShown`: whether this build shows packs at all (core/store.js).
// ---------------------------------------------------------------------------------------------------

/** Shown in the decorate panel: prizes once their colour round opens, pack pieces where packs show; anything once yours. */
export function decorShown(state, kind, o, packsShown) {
  if (o.story) return ownsDecor(state, kind, o.id); // story gifts appear once given
  return (o.pack ? packsShown : !o.prize || roundOpen(state, o.round)) || ownsDecor(state, kind, o.id);
}

function decorStatuses(state, packsShown) {
  const out = {};
  for (const kind of Object.keys(DECOR)) {
    for (const o of DECOR[kind]) {
      const owned = ownsDecor(state, kind, o.id);
      out[`${kind}:${o.id}`] = owned ? 2 : decorShown(state, kind, o, packsShown) ? 1 : 0;
    }
  }
  for (const id of LOOK_PACK_IDS) {
    if (PACKS[id].outside) out[`outside:${id}`] = ownsPack(state, id) ? 2 : packsShown ? 1 : 0;
  }
  return out;
}

/** The looks that are new since the panel was last opened ('kind:id' keys). None before decorating opens. */
export function newDecor(state, packsShown) {
  if (!state.decorOpen) return [];
  const seen = state.decor.seen;
  if (!seen) return [];
  return Object.entries(decorStatuses(state, packsShown)).filter(([key, st]) => st > (seen[key] ?? 0)).map(([key]) => key);
}

/** Everything as it is now counts as seen (opening the panel; or the first time, so old shops start with no dots). */
export function markDecorSeen(state, packsShown) {
  const seen = state.decor.seen ?? {};
  for (const [key, st] of Object.entries(decorStatuses(state, packsShown))) if (st) seen[key] = Math.max(seen[key] ?? 0, st);
  state.decor.seen = seen;
}
