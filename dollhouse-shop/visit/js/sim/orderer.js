// The Orderer (GDD #96-#99): Penny, once hired, keeps the shelves full. When the shop closes (before
// the summary, so stock comes before anything else you buy), she orders enough to fill the free shelf
// space, counting what's already in boxes or on the way, shared out evenly over every item on the open
// catalog pages, each in its page's color (sim/catalog.js pageColor). A box at a time, always the item
// the shop has fewest of; she may spend every coin. Pip brings it the next morning. A switch in the
// order book turns her off (state.ordererOn), e.g. to save up for a room.

import { ITEMS, boxCost, colorsOf } from '../data/items.js';
import { hasHelper } from './upgrades.js';
import { sellingRooms } from './building.js';
import { boxesHeld, freeSlots, stockCount } from './stock.js';
import { canOrder, pageItem } from './catalog.js';
import { placeOrder } from './orders.js';

/** Is Penny hired and switched on? */
export const ordererOn = (state) => hasHelper(state, 'orderer') && state.ordererOn !== false;

/** Switch Penny on or off (the order book's switch). */
export function setOrderer(state, on) {
  state.ordererOn = !!on;
}

/** Shelf space nothing is coming for yet: free slots, less what's in boxes and on order. */
export function shelfGap(state) {
  const free = sellingRooms(state).flatMap((r) => r.fixtures).filter((f) => f.slots).reduce((n, f) => n + freeSlots(f).length, 0);
  const boxed = [...state.boxes, ...boxesHeld(state.keeper), ...state.stockers.flatMap(boxesHeld)].reduce((n, b) => n + b.qty, 0);
  const coming = state.orders.reduce((n, o) => n + o.qty, 0);
  return free - boxed - coming;
}

/** What Penny keeps in stock: every item on an open page, in its page's color. */
export const ordererItems = (state) =>
  Object.keys(ITEMS).filter((id) => !ITEMS[id].round).map((base) => pageItem(state, base)).filter((id) => canOrder(state, id));

/** How many of an item the shop has, in any color: on the shelves, in boxes and on the way. */
function have(state, base) {
  return colorsOf(base).reduce((n, id) => { const c = stockCount(state, id); return n + c.shelf + c.boxed + c.coming; }, 0);
}

/**
 * Penny's order at closing. Returns { boxes, coins }: what she ordered and spent ({ boxes: 0 } when
 * she's off or there's nothing to fill).
 */
export function runOrderer(state) {
  const result = { boxes: 0, coins: 0 };
  if (!ordererOn(state)) return result;
  let gap = shelfGap(state);
  const counts = new Map(ordererItems(state).map((id) => [id, have(state, ITEMS[id].base)]));
  while (gap > 0 && counts.size) {
    const id = [...counts].sort((a, b) => a[1] - b[1])[0][0]; // the one the shop has fewest of
    if (state.coins < boxCost(id) || !placeOrder(state, id, { by: 'orderer' })) { counts.delete(id); continue; }
    result.boxes++;
    result.coins += boxCost(id);
    gap -= ITEMS[id].perBox;
    counts.set(id, counts.get(id) + ITEMS[id].perBox);
  }
  return result;
}
