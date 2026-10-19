// Things to buy in the Grow sheet besides rooms: one-time upgrades and helpers (GDD #36, #37).
// They come as a ladder (GDD #83): each appears once you've made `hearts` customers happy (state.hearts,
// all time) and costs about 1.4-1.5× the one before, so they arrive a couple of days apart.
// `full`: needs the Full shop where it's sold (GDD #150: everything from Ollie the Greeter up; sim/fullshop.js).

export const UPGRADES = {
  cart: { name: 'Stock Cart', icon: '🛒', cost: 60, hearts: 0, desc: 'Carry two boxes at once, so restocking takes half the walking.' },
  lunch: { name: 'Lunchtime Delivery', icon: '🥪', cost: 360, hearts: 40, desc: 'Pip comes at midday too. Order before lunch and it arrives halfway through the day.' },
  scanner: { name: 'Speedy Scanner', icon: '⚡', cost: 720, hearts: 85, desc: 'Each tap at the register scans two items, and cashiers scan faster too.' },
  tall: { name: 'Tall Shelves', icon: '📚', cost: 2250, hearts: 225, full: true, desc: 'Every shelf gets a row on top: room for 12 things instead of 9, so you restock less often.' },
  // GDD #92: once Bright opens, as a boost when customer numbers level off.
  bighouse: { name: 'Bigger Dream Dollhouse', icon: '🏡', cost: 4000, hearts: 350, full: true, needs: 'bright', desc: 'Your Dream Dollhouse grows to three storeys with nine rooms, so more of your Collection is on show and more people stop at the window. Everything in it stays where it is.' },
  // GDD #101: around when hand stocking stops; the shopkeeper and every stocker carry up to 8 boxes.
  bigcart: { name: 'Big Cart', icon: '🧺', cost: 1300, hearts: 140, full: true, desc: 'A great big cart for you and your stockers: carry up to 8 boxes at once, so filling the shelves takes far fewer trips.' },
  skates: { name: 'Roller Skates', icon: '🛼', cost: 1700, hearts: 160, full: true, desc: 'Roller skates for everyone: your shopkeeper and your stockers zip around the shop much faster.' },
};

export const SCANNER = { perTap: 2, helperSpeed: 0.6 }; // Speedy Scanner: items per tap; cashiers' scan time × this

/** Boxes anyone can carry at once: one in their hands, plus the Stock Cart, plus the Big Cart (GDD #101). */
export const CARRY = { hands: 1, cart: 2, bigcart: 8, shown: 4 }; // `shown`: most boxes drawn in their hands

/**
 * Offline earnings (GDD #128): once Mia is hired, time away earns a share of the best day's coins, front-loaded:
 * `startRate` of it an hour at first, slowing evenly to `endRate` an hour at `capHours` (about 65% in 4 hours).
 * Less than `minMinutes` away earns nothing.
 */
export const OFFLINE = { startRate: 0.2, endRate: 0.125, capHours: 4, minMinutes: 10 };

export const SKATES_SPEED = 1.4; // walking speed multiplier with Roller Skates, for the shopkeeper and every stocker (GDD #76, #85)

/** Upgrades taken out (GDD #85) and the coins given back to shops that had bought them (save v21). */
export const REFUNDS = { shoes: { name: 'Comfy Shoes', coins: 80 }, giftwrap: { name: 'Gift Wrap', coins: 150 } };
/** Big Boxes (GDD #96, test build only) became the Big Cart (#101): owners get it and the difference back (save v27). */
export const BIG_BOXES_REFUND = { name: 'Big Boxes', coins: 8000 - 1300 };

export const HELPERS = {
  cashier: {
    name: 'Mia', job: 'Cashier', icon: '🛎️', cost: 160, hearts: 15,
    desc: 'Mia rings customers up for you, nice and steady. Step behind the counter any time to do it yourself (and get the tips).',
    look: { hair: 'pigtails', hairColor: '#2e2430', skin: '#b97a56', outfit: '#c8b6ff', accessory: 'bow' },
    scanTime: 0.9,  // seconds per item she scans
    ringTime: 0.8,  // seconds to ring up once everything is scanned
  },
  stocker: {
    name: 'Bea', job: 'Stocker', icon: '📦', cost: 520, hearts: 60,
    desc: 'Bea carries boxes from the doorstep and fills the shelves, wished-for items first. Grab a box yourself any time.',
    look: { hair: 'ponytail', hairColor: '#e0a84a', skin: '#f1c7a5', outfit: '#ffb38a', accessory: 'glasses' },
    speed: 1.2,      // walking speed (the shopkeeper's is 1.7)
    pause: 0.45,     // seconds she takes to pick up a box or start unpacking
  },
  // GDD #96-#99: keeps the shelves full, each morning, in each catalog page's color.
  orderer: {
    name: 'Penny', job: 'Stock Manager', icon: '📋', cost: 6000, hearts: 500, full: true,
    desc: 'Penny orders for you when the shop closes: enough to fill every shelf, a little of everything, in the colors you pick on each catalog page. Switch her off in the order book to save up.',
    look: { hair: 'ponytail', hairColor: '#b07ad8', skin: '#f1c7a5', outfit: '#ffd98a', accessory: 'glasses' },
  },
  // GDD #72: they stand at the bonus spots, so your shopkeeper doesn't have to.
  greeter: {
    name: 'Ollie', job: 'Greeter', icon: '👋', cost: 1000, hearts: 120, full: true,
    desc: 'Ollie waits by the door and says hello to everyone who comes in. Greeted customers often pick up a second thing.',
    look: { hair: 'curly', hairColor: '#8a5a3c', skin: '#e0a37c', outfit: '#9fe0c8', accessory: 'cap' },
  },
  dresser: {
    name: 'Rosa', job: 'Window Dresser', icon: '🪟', cost: 3000, hearts: 300, full: true, needs: 'display',
    desc: 'Rosa shows off your Dream Dollhouse in the Window Display, so more people stop to look and want what they see.',
    look: { hair: 'bob', hairColor: '#2e2430', skin: '#ffd9c2', outfit: '#f7a8d8', accessory: 'hat' },
  },
};

/**
 * A stocker for each floor with a register room (GDD #98): Theo for floor 1, Juno for floor 2, and so on
 * (the list repeats). They work like Bea. Ids are 'stocker2' for floor 1, 'stocker3' for floor 2, ...
 * (Theo and Juno kept the ids they had on the ladder, GDD #72).
 */
export const FLOOR_STOCKERS = [
  { name: 'Theo', look: { hair: 'swoop', hairColor: '#6b3e2e', skin: '#8d5a3c', outfit: '#a8d8ff', accessory: 'bowtie' } },
  { name: 'Juno', look: { hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#b8e6a0', accessory: 'bow' } },
  { name: 'Pia', look: { hair: 'pigtails', hairColor: '#f2c46b', skin: '#e0a37c', outfit: '#ffb8d9', accessory: 'none' } },
  { name: 'Milo', look: { hair: 'spiky', hairColor: '#2e2430', skin: '#f1c7a5', outfit: '#ffd98a', accessory: 'cap' } },
  { name: 'Wren', look: { hair: 'bob', hairColor: '#8a5a3c', skin: '#b97a56', outfit: '#9fe0c8', accessory: 'glasses' } },
  { name: 'Ezra', look: { hair: 'curly', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#c8b6ff', accessory: 'bowtie' } },
];
export const FLOOR_STOCKER_COST = 1000; // floor 1; ×FLOOR_STOCKER_GROWTH each floor up
export const FLOOR_STOCKER_GROWTH = 2;

/** The cashiers who come with register rooms (GDD #73), in the order they are built; the list repeats if you build more. */
export const REGISTER_CASHIERS = [
  { name: 'Kai', look: { hair: 'short', hairColor: '#2e2430', skin: '#e0a37c', outfit: '#a8d8ff', accessory: 'bowtie' } },
  { name: 'Nell', look: { hair: 'ponytail', hairColor: '#f2c46b', skin: '#ffd9c2', outfit: '#ffb8a0', accessory: 'none' } },
  { name: 'Remy', look: { hair: 'curly', hairColor: '#6b3e2e', skin: '#8d5a3c', outfit: '#b8e6a0', accessory: 'glasses' } },
  { name: 'Ivy', look: { hair: 'bun', hairColor: '#b07ad8', skin: '#f5c4a0', outfit: '#c8b6ff', accessory: 'bow' } },
];
