// The Dream Dollhouse in the Window Display: a two-storey house with four rooms, one slot each, or
// with the Bigger Dream Dollhouse upgrade (GDD #92) a three-storey house with 3 × 3 rooms.
//   cell:  [column, storey] in the small house (0 = left / downstairs, 1 = right / upstairs)
//   cell3: [column, storey] in the big house (0-2); the first four rooms keep their sides, so their items stay put
//   big:   only in the big house
//   Any item can go in any room (GDD #111).

export const DOLLHOUSE_SLOTS = [
  { id: 'bedroom', name: 'Bedroom', icon: '🛏️', cell: [0, 1], cell3: [0, 1] },
  { id: 'playroom', name: 'Playroom', icon: '🧸', cell: [1, 1], cell3: [2, 1] },
  { id: 'parlor', name: 'Parlor', icon: '🛋️', cell: [0, 0], cell3: [0, 0] },
  { id: 'tearoom', name: 'Tea Room', icon: '🫖', cell: [1, 0], cell3: [2, 0] },
  // The Bigger Dream Dollhouse's new rooms (GDD #92, §18 #22): the middle column and a whole new top storey.
  { id: 'nursery', name: 'Nursery', icon: '🍼', cell3: [0, 2], big: true },
  { id: 'music', name: 'Music Room', icon: '🎵', cell3: [1, 2], big: true },
  { id: 'garden', name: 'Garden Room', icon: '🌷', cell3: [2, 2], big: true },
  { id: 'library', name: 'Library', icon: '📖', cell3: [1, 1], big: true },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', cell3: [1, 0], big: true },
];

export const SPARKLE = {
  fullHouse: 5,       // bonus when every room has something in it
  // Visitors arrive (1 + trafficMore × Sparkle / (Sparkle + trafficHalf)) times as often: more Sparkle always
  // helps, a little less each time, never past ×(1 + trafficMore) (§18 #10).
  trafficMore: 1.2,
  trafficHalf: 150,   // the Sparkle that gives half of trafficMore
  peekBase: 0.25,     // chance a visitor stops at the window first, once anything is on show...
  peekPer: 1 / 60,    // ...plus this much per Sparkle...
  peekMax: 0.7,       // ...up to this
  peekWant: 0.5,      // chance a window-peeker then wants something from the dollhouse
  // While the shopkeeper is in the Window Display showing it off (GDD #41):
  keeperPeek: 0.2,    // ...this much more chance to stop at the window (up to keeperPeekMax)
  keeperPeekMax: 0.85,
  keeperPeekWant: 0.8, // ...and this chance they want something they saw
  peekTime: [1.6, 2.4], // seconds spent looking in the window
  peekOffset: [0.7, 1.15], // how far to the side of the window's middle they stand, so the dollhouse stays in view
};

/** Shop expansions, in the order they unlock. */
export const EXPANSIONS = [
  { type: 'display', cost: 100 },
];
