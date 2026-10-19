// Room styles for the decoration shop (GDD #68), bought with Ribbons 🎀. Each kind is a list of
// options; `price` is in Ribbons and 0 means everyone has it from the start (the looks already in the
// game). A bought style is yours in every room, forever. Prices are first guesses, tunable here.
// Options with `pack` (and no price) come with a decoration pack instead (data/packs.js, GDD #106).
//   paper:   wallpaper colour (paper) and its pattern colour (stripe)
//   pattern: what's printed on the wallpaper, in the stripe colour
//   floor:   colour, a second colour for checkers / tiles, and the style (planks, checker, tiles, carpet)
//   rug:     shape and colours ('none' is no rug)
//   curtain: curtain colour (only rooms with a window); `leaves` adds leafy vines (the Fairy pack), `blinds` a
//            rolled bamboo blind instead of side curtains (the Jungle pack), `stars` little stars on them (the Space pack),
//            `stripes` a second colour in stripes and `shells` little shells along the hem (the Beach pack)
//   corner:  the piece standing in the room's plant spot

import { ROOM_TYPES, ROOM_STYLES } from './rooms.js';
import { STORY_ROOMS } from './story.js';

/**
 * Collection prizes (GDD #87): each theme's picture wallpaper, drawn in render/patterns.js (PRIZE_TILES),
 * once per round in that round's colours: theme -> [motif, name].
 */
const PRIZE_MOTIFS = {
  tea: ['teacups', 'Teacups'], parlor: ['frames', 'Picture frames'], fairy: ['mushrooms', 'Toadstools'],
  bedroom: ['moons', 'Moon and clouds'], dolls: ['teddies', 'Teddy faces'], houses: ['houses', 'Tiny houses'],
  sweets: ['lollipops', 'Lollipops'], pets: ['cats', 'Cat faces'],
};
const ROUND_NAMES = ['', 'Bright', 'Dazzle'];
const prizeId = (motif, round) => (round ? `${motif}${round + 1}` : motif);
function PRIZE_PATTERNS() {
  return ROUND_NAMES.flatMap((round_, round) => Object.values(PRIZE_MOTIFS).map(([motif, name]) => (
    { id: prizeId(motif, round), name: round ? `${round_} ${name.toLowerCase()}` : name, prize: motif, round }
  )));
}

export const DECOR = {
  paper: [
    { id: 'pink', name: 'Pink', paper: '#ffe1ec', stripe: '#ffd0e2', price: 0 },
    { id: 'rose', name: 'Rose', paper: '#fde7f3', stripe: '#f9d6ea', price: 0 },
    { id: 'peach', name: 'Peach', paper: '#ffe9df', stripe: '#ffdacb', price: 0 },
    { id: 'butter', name: 'Butter', paper: '#fff4dc', stripe: '#ffeabf', price: 0 },
    { id: 'leaf', name: 'Leaf', paper: '#eef8dc', stripe: '#e1f1c8', price: 0 },
    { id: 'mint', name: 'Mint', paper: '#e3f6ea', stripe: '#d3efdd', price: 0 },
    { id: 'sky', name: 'Sky', paper: '#e4f1ff', stripe: '#d2e7ff', price: 0 },
    { id: 'lilac', name: 'Lilac', paper: '#ece3ff', stripe: '#e0d4ff', price: 0 },
    { id: 'cream', name: 'Cream', paper: '#fff8ef', stripe: '#f6e6d4', price: 8 },
    { id: 'bubblegum', name: 'Bubblegum', paper: '#ffd3e6', stripe: '#ffb8d6', price: 8 },
    { id: 'coral', name: 'Coral', paper: '#ffddd6', stripe: '#ffc6bb', price: 8 },
    { id: 'aqua', name: 'Aqua', paper: '#d9f5f3', stripe: '#c2ece8', price: 8 },
    { id: 'violet', name: 'Violet', paper: '#e2d3fa', stripe: '#d2bdf4', price: 8 },
    { id: 'sage', name: 'Sage', paper: '#e4ecdb', stripe: '#d3dfc6', price: 8 },
    // Bolder ones, free for completing a color round's theme (GDD #77)
    { id: 'electric', name: 'Electric blue', paper: '#d3e2ff', stripe: '#a9c3ff', price: 40 },
    { id: 'amethyst', name: 'Amethyst', paper: '#e0cdf7', stripe: '#c3a3ee', price: 50 },
    { id: 'gold', name: 'Gold', paper: '#fff0c2', stripe: '#f2cf5c', price: 50 },
    { id: 'rosegold', name: 'Rose gold', paper: '#fbe2da', stripe: '#eab3a3', price: 50 },
    // High-contrast and super-bright ones, the priciest (GDD #165, user)
    { id: 'emerald', name: 'Emerald', paper: '#b8edc9', stripe: '#16a956', price: 60 },
    { id: 'limeneon', name: 'Lime green', paper: '#d8ff5e', stripe: '#8fd400', price: 80 },
    { id: 'magenta', name: 'Magenta', paper: '#ff8fdf', stripe: '#e80fae', price: 80 },
    { id: 'neonorange', name: 'Highlighter orange', paper: '#ffb14f', stripe: '#ff6a00', price: 80 },
  ],
  pattern: [
    { id: 'stripes', name: 'Stripes', price: 0 },
    { id: 'plain', name: 'Plain', price: 0 },
    { id: 'dots', name: 'Polka dots', price: 16 },
    { id: 'gingham', name: 'Gingham', price: 20 },
    { id: 'stars', name: 'Stars', price: 25 },
    { id: 'hearts', name: 'Hearts', price: 25 },
    { id: 'candy', name: 'Candy', price: 25 },
    { id: 'paws', name: 'Paw prints', price: 25 },
    // The Christmas pack (GDD #116): pictures in their own colours on any wallpaper colour
    { id: 'candycane', name: 'Candy canes', pack: 'christmas' },
    { id: 'snowflakes', name: 'Snowflakes', pack: 'christmas' },
    // The Fairy pack (GDD #161)
    { id: 'fairies', name: 'Fairies', pack: 'fairy' },
    { id: 'cottages', name: 'Toadstool cottages', pack: 'fairy' },
    { id: 'butterflies', name: 'Butterflies', pack: 'fairy' },
    // The Jungle pack (GDD #161)
    { id: 'jungleleaves', name: 'Jungle leaves', pack: 'jungle' },
    { id: 'animalpals', name: 'Animal pals', pack: 'jungle' },
    // The Space pack (GDD #161)
    { id: 'planets', name: 'Planets and rockets', pack: 'space' },
    { id: 'galaxy', name: 'Galaxy', pack: 'space' },
    // The Beach pack (GDD #136, #166)
    { id: 'seacreatures', name: 'Sea creatures', pack: 'beach' },
    { id: 'surfwaves', name: 'Surf and waves', pack: 'beach' },
    // Collection prizes (GDD #87): a picture per theme, in each round's colours; won, never bought.
    ...PRIZE_PATTERNS(),
    // The story's last gift (GDD #148): blue-ribbon rosettes, yours after the thank-you visit (chapter 12). Last in the row (user).
    { id: 'blueribbon', name: 'Blue Ribbon', icon: '🎀', story: 'thanks' },
  ],
  floor: [
    { id: 'honey', name: 'Honey wood', style: 'planks', color: '#e8b98a', price: 0 },
    { id: 'maple', name: 'Maple', style: 'planks', color: '#f2d3a8', price: 10 },
    { id: 'cocoa', name: 'Cocoa wood', style: 'planks', color: '#c99268', price: 12 },
    { id: 'whitewood', name: 'White wood', style: 'planks', color: '#f3ebe3', price: 12 },
    { id: 'lilaccarpet', name: 'Lilac carpet', style: 'carpet', color: '#ddd0f7', price: 20 },
    { id: 'skytiles', name: 'Sky tiles', style: 'tiles', color: '#d4eaff', color2: '#fbfdff', price: 20 },
    { id: 'pinkcheck', name: 'Pink checker', style: 'checker', color: '#ffc9dd', color2: '#fff6ee', price: 25 },
    { id: 'mintcheck', name: 'Mint checker', style: 'checker', color: '#bfeedd', color2: '#fff6ee', price: 25 },
    { id: 'tangerinecheck', name: 'Tangerine checker', style: 'checker', color: '#ffb877', color2: '#fff6ee', price: 40 },
    { id: 'rubycheck', name: 'Ruby checker', style: 'checker', color: '#e0457b', color2: '#fff6ee', price: 50 },
    { id: 'emeraldtiles', name: 'Emerald tiles', style: 'tiles', color: '#6fd6a8', color2: '#effff6', price: 50 },
    { id: 'bubblegumcheck', name: 'Bubblegum checker', style: 'checker', color: '#ff7cc0', color2: '#fff6ee', price: 40 },
    { id: 'sapphiretiles', name: 'Sapphire tiles', style: 'tiles', color: '#6f93e8', color2: '#eef4ff', price: 50 },
    { id: 'plaid', name: 'Christmas plaid', style: 'plaid', color: '#c8283a', color2: '#2f7a4a', pack: 'christmas' },
    { id: 'moss', name: 'Mossy stones', style: 'stones', color: '#8fcf7e', color2: '#e6ddd0', pack: 'fairy' },
    { id: 'bamboo', name: 'Bamboo', style: 'bamboo', color: '#e3cf8c', color2: '#b99a52', pack: 'jungle' },
    { id: 'station', name: 'Space station', style: 'metal', color: '#c9cfdc', color2: '#9aa3b8', pack: 'space' },
    { id: 'driftwood', name: 'Driftwood', style: 'driftwood', color: '#e6dccb', color2: '#b8a68c', pack: 'beach' },
  ],
  rug: [
    { id: 'lilac', name: 'Lilac', shape: 'round', color: '#c8b6ff', color2: '#ddd1ff', price: 0 },
    { id: 'none', name: 'No rug', shape: 'none', price: 0 },
    { id: 'pink', name: 'Pink', shape: 'round', color: '#ff9ec4', color2: '#ffc7dd', price: 8 },
    { id: 'mint', name: 'Mint', shape: 'round', color: '#9fe0c8', color2: '#c9f0e1', price: 8 },
    { id: 'butter', name: 'Butter', shape: 'round', color: '#ffd98a', color2: '#ffeab8', price: 8 },
    { id: 'striped', name: 'Striped', shape: 'rect', color: '#a8d8ff', color2: '#fff6ee', price: 20 },
    { id: 'heart', name: 'Heart', shape: 'heart', color: '#ff8fb8', color2: '#ffc7dd', price: 30 },
    { id: 'star', name: 'Star', shape: 'star', color: '#ffd166', color2: '#ffe9a8', price: 30 },
    { id: 'flower', name: 'Flower', shape: 'flower', color: '#c8b6ff', color2: '#ffd98a', price: 30 },
    { id: 'cherry', name: 'Cherry heart', shape: 'heart', color: '#ff2d6f', color2: '#ff9ec4', price: 40 },
    { id: 'lime', name: 'Lime flower', shape: 'flower', color: '#a6e22e', color2: '#ffe066', price: 40 },
    { id: 'galaxy', name: 'Galaxy star', shape: 'star', color: '#3a2f8f', color2: '#ffd166', price: 50 },
    { id: 'sunny', name: 'Sunny star', shape: 'star', color: '#ff9a3c', color2: '#ffe066', price: 40 },
    { id: 'fireplace', name: 'Fireplace', shape: 'hearth', color: '#c8283a', color2: '#2f7a4a', pack: 'christmas' },
    { id: 'petals', name: 'Flower petals', shape: 'petals', color: '#ffa8d2', color2: '#d9c4ff', pack: 'fairy' },
    { id: 'tiger', name: 'Tiger stripes', shape: 'tiger', color: '#ff9a3c', color2: '#3a2a2a', pack: 'jungle' },
    { id: 'ringed', name: 'Ringed planet', shape: 'planet', color: '#b48cff', color2: '#ffd166', pack: 'space' },
    { id: 'sunshine', name: 'Sunshine', shape: 'sun', color: '#ffc93c', color2: '#ff9a3c', pack: 'beach' },
  ],
  curtain: [
    { id: 'pink', name: 'Pink', color: '#ff9ec4', price: 0 },
    { id: 'peach', name: 'Peach', color: '#ffb8a0', price: 0 },
    { id: 'coral', name: 'Coral', color: '#ff8f8f', price: 0 },
    { id: 'butter', name: 'Butter', color: '#ffd98a', price: 0 },
    { id: 'mint', name: 'Mint', color: '#9fe0c8', price: 0 },
    { id: 'sky', name: 'Sky', color: '#a8d8ff', price: 0 },
    { id: 'lilac', name: 'Lilac', color: '#c8b6ff', price: 0 },
    { id: 'lace', name: 'Lace white', color: '#fffaf4', price: 8 },
    { id: 'berry', name: 'Berry', color: '#e0679a', price: 8 },
    { id: 'teal', name: 'Teal', color: '#6cc7c0', price: 8 },
    { id: 'grape', name: 'Grape', color: '#8e44ec', price: 40 },
    { id: 'tangerine', name: 'Tangerine', color: '#ff9a3c', price: 40 },
    { id: 'midnight', name: 'Midnight', color: '#2b2d6e', price: 50 },
    { id: 'velvet', name: 'Red velvet', color: '#a8142c', pack: 'christmas' },
    { id: 'vines', name: 'Leafy vines', color: '#c9ecb4', leaves: '#5fb36a', leaves2: '#8fd19e', flower: '#ff9ec4', pack: 'fairy' },
    { id: 'blinds', name: 'Bamboo blinds', color: '#e3cf8c', blinds: '#c9a95e', pack: 'jungle' },
    { id: 'starry', name: 'Starry', color: '#2b2d6e', stars: '#ffd23f', pack: 'space' },
    { id: 'shells', name: 'Shell stripes', color: '#ffffff', stripes: '#4aa8e8', shells: '#ffc2b0', pack: 'beach' },
  ],
  corner: [
    { id: 'plant', name: 'Plant', icon: '🪴', price: 0 },
    { id: 'fern', name: 'Fern', icon: '🌿', price: 16 },
    { id: 'cactus', name: 'Cactus', icon: '🌵', price: 16 },
    { id: 'flowers', name: 'Flowers', icon: '💐', price: 16 },
    { id: 'lamp', name: 'Floor lamp', icon: '💡', price: 20 },
    { id: 'books', name: 'Bookcase', icon: '📚', price: 25 },
    { id: 'balloons', name: 'Balloons', icon: '🎈', price: 25 },
    { id: 'gumball', name: 'Gumball machine', icon: '🍬', price: 30 },
    { id: 'xmastree', name: 'Christmas tree', icon: '🎄', pack: 'christmas' },
    { id: 'glowshrooms', name: 'Glowing mushrooms', icon: '🍄', pack: 'fairy' },
    { id: 'parrot', name: 'Parrot perch', icon: '🦜', pack: 'jungle' },
    { id: 'telescope', name: 'Telescope', icon: '🔭', pack: 'space' },
    { id: 'surfboard', name: 'Surfboard', icon: '🏄', pack: 'beach' },
  ],
  // A decoration room's look (GDD #108): the scene across its back (render/models/scenes.js) plus its
  // walls and floor (`decor`). Free for everyone; packs will add more (GDD #106).
  scene: [
    { id: 'garden', name: 'Garden room', icon: '🌷', price: 0, decor: { paper: 'sky', pattern: 'plain', floor: 'mintcheck' } },
    { id: 'reading', name: 'Cozy reading nook', icon: '📚', price: 0, decor: { paper: 'butter', pattern: 'stripes', floor: 'cocoa' } },
    { id: 'playroom', name: 'Playroom', icon: '🧸', price: 0, decor: { paper: 'leaf', pattern: 'dots', floor: 'skytiles' } },
    { id: 'teaparty', name: 'Tea party room', icon: '🫖', price: 0, decor: { paper: 'rose', pattern: 'gingham', floor: 'whitewood' } },
    { id: 'xmastree', name: 'Christmas Tree Room', icon: '🎄', pack: 'christmas', decor: { paper: 'mint', pattern: 'candycane', floor: 'cocoa' } },
    { id: 'fairyglen', name: 'Fairy Glen', icon: '🧚', pack: 'fairy', decor: { paper: 'leaf', pattern: 'cottages', floor: 'moss' } },
    { id: 'treehouse', name: 'Treehouse', icon: '🛖', pack: 'jungle', decor: { paper: 'mint', pattern: 'jungleleaves', floor: 'bamboo' } },
    { id: 'rocketroom', name: 'Rocket Room', icon: '🚀', pack: 'space', decor: { paper: 'sky', pattern: 'galaxy', floor: 'station' } },
    { id: 'beachhut', name: 'Beach Hut', icon: '🏖️', pack: 'beach', decor: { paper: 'aqua', pattern: 'surfwaves', floor: 'driftwood' } },
    // Story rooms' looks (GDD #147): only ever on their own story room, never picked in the decorate panel.
    ...Object.entries(STORY_ROOMS).map(([id, r]) => ({ id, name: r.name, icon: r.icon, story: id, decor: r.decor })),
  ],
};

/** The decorate panel's tabs, in order. Walls has two rows: colour (paper) and pattern. */
export const DECOR_TABS = [
  { id: 'walls', name: 'Walls', icon: '🖼️', kinds: ['paper', 'pattern'] },
  { id: 'floor', name: 'Floor', icon: '🪵', kinds: ['floor'] },
  { id: 'rug', name: 'Rug', icon: '🟣', kinds: ['rug'] },
  { id: 'curtain', name: 'Curtains', icon: '🪟', kinds: ['curtain'] },
  { id: 'corner', name: 'Corner', icon: '🪴', kinds: ['corner'] },
  { id: 'scene', name: 'Look', icon: '🌷', kinds: ['scene'] }, // decoration rooms only (GDD #108)
];

/** Every room starts with these, unless its type or wallpaper (ROOM_STYLES) says otherwise. */
const BASE = { paper: 'pink', pattern: 'stripes', floor: 'honey', rug: 'lilac', curtain: 'pink', corner: 'plant', scene: 'garden' };

/**
 * Completing a theme in the Collection gives its picture wallpaper (GDD #69, #87), only ever as a prize:
 * theme (SETS in data/items.js) -> [kind, id].
 */
export const THEME_STYLES = Object.fromEntries(Object.entries(PRIZE_MOTIFS).flatMap(([set, [motif]]) =>
  [0, 1, 2].map((round) => [round ? `${set}${round + 1}` : set, ['pattern', prizeId(motif, round)]])));

/**
 * The prizes before #87, now on sale for Ribbons again. Shops that had won them keep them (save v23
 * copies them into decor.owned).
 */
export const OLD_THEME_STYLES = {
  tea: ['pattern', 'gingham'],
  parlor: ['corner', 'books'],
  fairy: ['rug', 'flower'],
  bedroom: ['pattern', 'stars'],
  dolls: ['pattern', 'hearts'],
  houses: ['floor', 'pinkcheck'],
  // Color rounds (GDD #77)
  tea2: ['rug', 'cherry'], parlor2: ['curtain', 'grape'], fairy2: ['rug', 'lime'],
  bedroom2: ['paper', 'electric'], dolls2: ['curtain', 'tangerine'], houses2: ['floor', 'tangerinecheck'],
  tea3: ['floor', 'rubycheck'], parlor3: ['paper', 'amethyst'], fairy3: ['floor', 'emeraldtiles'],
  bedroom3: ['rug', 'galaxy'], dolls3: ['paper', 'gold'], houses3: ['curtain', 'midnight'],
  // Sweet Shop and Pet Corner (GDD #79)
  sweets: ['pattern', 'candy'], sweets2: ['floor', 'bubblegumcheck'], sweets3: ['paper', 'rosegold'],
  pets: ['pattern', 'paws'], pets2: ['rug', 'sunny'], pets3: ['floor', 'sapphiretiles'],
};

/** The full name of a style, e.g. "Gingham wallpaper". */
export function styleName(kind, id) {
  const o = decorOption(kind, id);
  return { paper: `${o.name} wallpaper`, pattern: `${o.name} wallpaper`, floor: `${o.name} floor`, rug: `${o.name} rug`, curtain: `${o.name} curtains`, corner: o.name, scene: o.name }[kind];
}

/** How Ribbons are earned (GDD #68), once decorating is open (#86). */
export const RIBBONS = {
  wish: 1,       // a sale grants a wish note
  window: 1,     // a window-peeker buys what they pointed at
  newItem: 1,    // each new Collection item (was 2 before #86)...
  theme: 3,      // ...and all four items of a theme found (was 5): both paid in full for everything found so far when decorating opens
  perHappy: 5,   // +1 at closing for every this many happy customers
};

export const decorOption = (kind, id) => DECOR[kind].find((o) => o.id === id) ?? null;

/** A room's style ids: its defaults, then what the player chose (room.decor), then a preview on top. */
export function roomDecor(room, preview = null) {
  const style = room.style != null ? ROOM_STYLES[room.style % ROOM_STYLES.length] : null;
  const ids = { ...BASE, ...ROOM_TYPES[room.type].decor, ...style, ...room.decor, ...preview };
  // A decoration room's look brings its own walls and floor (GDD #108).
  return room.type === 'scene' ? { ...ids, ...decorOption('scene', ids.scene)?.decor } : ids;
}

/** A room's look for drawing: each style id turned into its option (paper colours, floor, ...). */
export function roomLook(room, preview = null) {
  const ids = roomDecor(room, preview);
  const look = {};
  for (const kind of Object.keys(DECOR)) look[kind] = decorOption(kind, ids[kind]) ?? DECOR[kind][0];
  return look;
}
