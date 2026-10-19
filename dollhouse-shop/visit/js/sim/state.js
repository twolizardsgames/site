// The whole game state: one plain, JSON-serializable object.
// Bump STATE_VERSION and add a migration in core/save.js whenever its shape changes.

import { makeRoom } from './building.js';
import { createKeeper } from './keeper.js';
import { dropBox } from './stock.js';
import { emptyStats } from './day.js';

export const STATE_VERSION = 39;

/** The Settings menu's choices (GDD #94): sound effects and music, each on/off with a volume (0-1), vibration, and the
 * store apps' "earnings are ready" notification (GDD #128). */
// graphics: the Settings slider's notch, GRAPHICS in render/lighting.js (0 faster ... 2 prettiest, GDD #145).
export const DEFAULT_SETTINGS = { sfx: true, sfxVolume: 1, music: true, musicVolume: 0.6, vibration: true, notify: true, graphics: 2 };

/** Live-only fields: never saved, reset on every load (customers just walk in again). */
export const TRANSIENT = ['customers', 'queue', 'coming', 'checkout', 'spawnTimer', 'cashier', 'greeter', 'dresser', 'registers', 'refunds', 'fullShopLock', 'visit'];

export function resetTransient(state) {
  state.customers = [];
  state.queue = [];
  state.coming = []; // on their way to the shop's line: they hold a place but join the back when they arrive (GDD #140)
  state.checkout = null;
  state.spawnTimer = 2; // first visitor shortly after opening
  state.cashier = null; // Mia's spot behind the counter (sim/helpers.js), once she's hired
  state.registers = {}; // register rooms' lines, checkouts and cashiers (sim/checkout.js registerOf, GDD #73)
  state.greeter = null; // Ollie at the door and Rosa in the Window Display (sim/helpers.js, GDD #72)
  state.dresser = null;
  state.visit = null; // a story visit in progress (sim/story.js, GDD #147)
  return state;
}

/** Every new shop starts with a first delivery waiting to be unpacked. */
export const STARTER_BOXES = [{ itemId: 'teaset', qty: 3 }, { itemId: 'chair', qty: 3 }];

export function giveStarterBoxes(state) {
  for (const b of STARTER_BOXES) {
    dropBox(state, b.itemId, b.qty);
    state.collection[b.itemId] = true;
  }
}

export function createState(now = Date.now()) {
  const state = {
    version: STATE_VERSION,
    nextId: 1,
    day: { number: 1, phase: 'morning', time: 0, stats: emptyStats() },
    coins: 50,
    hearts: 0,
    sparkle: 0,
    ribbons: 0, // Ribbons 🎀 for room styles (GDD #68), from when decorating opens
    decorOpen: false, // decorating and Ribbons open on day 5, with the story's chapter 2 (sim/story.js, GDD #151)
    story: { seen: [], day: 0 }, // story chapters heard (or skipped), and the day of the last visit (sim/story.js, GDD #147)
    building: {
      rooms: [makeRoom('r1', 'shop', 0, 0)],
    },
    keeper: createKeeper('r1'),
    orders: [],
    boxes: [],
    collection: {},
    pagesOpen: 1, // catalog steps opened so far; they stay open (sim/catalog.js, GDD #79)
    pageColors: [0, 0, 0, 0],
    ordererOn: true, // Penny the Orderer's switch in the order book (sim/orderer.js, GDD #97); she orders only once hired // the color (round) each catalog page orders (sim/catalog.js pageColor, GDD #99)
    dollhouse: { slots: {} }, // slotId -> itemId (data/dollhouse.js); on show once the Window Display is built
    wishes: [],
    decor: { owned: {}, seen: null }, // room styles bought with Ribbons ('kind:id' -> true; sim/decor.js); each room wears room.decor; seen: what the Decorate panel last showed (newDecor, GDD #122), null until first counted
    packs: {},     // decoration packs owned (pack id -> true; sim/packs.js, data/packs.js, GDD #106)
    allPacks: false, // every pack, now and future ones, and the Full shop (a gift link or the everything bundle, GDD #168, #171)
    welcomeOffered: false, // the Welcome pack's card has shown its one time (sim/packs.js welcomeOfferDue, GDD #171)
    outside: null, // the pack whose outside scene is on (🏡 Outside tab, GDD #109), or null
    // The shopkeeper's look, girl or boy (the creator, ui/creator.js); `created` is false until the player has seen the creator.
    shopkeeper: { body: 'girl', hair: 'bun', hairColor: '#c2563a', skin: '#ffd9c2', outfit: '#9fe0c8', accessory: 'none', created: false },
    shopName: '', // typed by the player (sim/shopName.js, GDD #91); '' shows the game's own sign
    themeGifts: [], // themes whose coin gift was given, in order (sim/rewards.js, GDD #70)
    upgrades: {}, // id -> true (data/upgrades.js)
    helpers: {},  // id -> true
    stockers: [], // Bea, Theo and Juno, once hired (sim/stocker.js, GDD #72); saved, so boxes in their hands are never lost
    settings: { ...DEFAULT_SETTINGS }, // the Settings menu (ui/settings.js, audio/audio.js)
    best: { coins: 0 },          // best day so far (sim/day.js recordBest)
    tutorial: 'box',             // the first-day guide's step (sim/tutorial.js); 'done' once finished
    helpSeen: null,              // Help book pages shown so far (sim/help.js, GDD #124); null until first counted (no dot then)
    awaySince: null,             // when the game went to the background (sim/offline.js, GDD #128); null while playing
    awayPaidTo: 0,               // the latest moment offline earnings have paid for, so time never pays twice
    lineHint: false,             // the one-time "build a register room" toast after someone gives up on a long line (GDD #133)
    lastSeen: now,
  };
  giveStarterBoxes(state);
  return resetTransient(state);
}
