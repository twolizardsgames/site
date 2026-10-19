// Showcases (GDD #96, #97): every shelf room has a little stand by the front. Put any Collection item on
// it (free, like the Dream Dollhouse; it stays in your Collection) and the room takes that item's theme:
// the theme's items (all four, in every color) sell for SHOWCASE.bonus more when taken from that room's
// shelves, and the item adds half its Sparkle to the shop (sim/collection.js sparkleFor). Stockers put
// matching boxes there first (sim/stocker.js shelfFor). Saved as room.showcase (an item id, or absent).

import { events } from '../core/events.js';
import { ITEMS, baseOf } from '../data/items.js';
import { SHOWCASE } from '../data/rooms.js';
import { findFixture } from './stock.js';
import { sparkleFor } from './collection.js';

/** An item's theme, whatever its color ('tea' for 'teaset3'). */
export const themeOf = (itemId) => ITEMS[baseOf(itemId)]?.set ?? null;

/** The theme a room sells for a bonus, or null. */
export const roomTheme = (room) => (room?.showcase ? themeOf(room.showcase) : null);

/** Rooms with a showcase stand (shelf rooms). */
export const showcaseRooms = (state) => state.building.rooms.filter((r) => r.fixtures.some((f) => f.kind === 'showcase'));

/** Put a Collection item on a room's showcase, or null to take it off. Returns true if it changed. */
export function setShowcase(state, roomId, itemId) {
  const room = showcaseRooms(state).find((r) => r.id === roomId);
  if (!room || (itemId !== null && !state.collection[itemId]) || (room.showcase ?? null) === itemId) return false;
  if (itemId === null) delete room.showcase;
  else room.showcase = itemId;
  state.sparkle = sparkleFor(state);
  events.emit('showcaseChanged', { roomId, itemId });
  return true;
}

/** Does an item taken from this shelf earn the showcase bonus (its room shows the same theme)? */
export function earnsBonus(state, itemId, fixtureId) {
  const theme = roomTheme(findFixture(state, fixtureId)?.room);
  return !!theme && theme === themeOf(itemId);
}

/** What an item sells for, with the showcase bonus (rounded up) or without. */
export const salePrice = (itemId, bonus) => (bonus ? Math.ceil(ITEMS[itemId].price * (1 + SHOWCASE.bonus)) : ITEMS[itemId].price);
