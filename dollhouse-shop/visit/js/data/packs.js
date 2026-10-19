// Decoration packs (GDD §16, #89, #106, #109, #116): fixed bundles of looks bought once for real money in the
// store builds. Just for looks: never items, coins, Sparkle, Hearts or customers.
// The pieces themselves live with their kind and say which pack they're in (`pack`): room styles and decoration
// room looks in DECOR (data/decor.js), shopkeeper pieces in PACK_LOOKS (data/customers.js). A pack with `outside`
// also has a whole outside scene (render/environment.js), switched on or off in the decorate panel's 🏡 Outside tab.
//   product: the store's product id (non-consumable in-app purchase)
//   price:   shown on the pack card until the store reports its own (local currency)
//   contents: the pack card's list, in order
// The Full shop (GDD #134, #148, #149) is bought the same way but isn't a decoration pack (`unlock`): it opens building
// past the first shelf room, the Bright and Dazzle colors and the later helpers and upgrades (sim/fullshop.js). It never shows in the 🎁 Packs tab.

export const PACKS = {
  welcome: { // GDD #134, #135, #171: the small first pack, offered once on a card the morning after decorating opens
    id: 'welcome',
    name: 'Welcome pack',
    icon: '👑',
    product: 'pack.welcome',
    price: '$0.99',
    look: { pattern: 'starhearts', rug: 'princess' }, // the pack card's picture wears these (main.js packPicture)
    blurb: 'A princess dress, a prince outfit, a stars-and-hearts wallpaper and a pretty round rug, to make your shop your own!',
    contents: [
      ['👑', 'A princess dress and a prince outfit for your shopkeeper'],
      ['💖', 'A stars-and-hearts wallpaper'],
      ['🟣', 'A round pink-and-purple rug'],
    ],
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas pack',
    icon: '🎄',
    product: 'pack.christmas',
    price: '$2.99',
    blurb: 'Snow, twinkly lights and a Christmas tree room for your shop!',
    outside: { name: 'Snowy Christmas', icon: '☃️', snow: true }, // snow: customers wear a hat and scarf (GDD #116)
    contents: [
      ['☃️', 'Snowy outside: lights on the house, a wreath, decorated trees, a snowman, presents and falling snow, and shoppers in hats and scarves'],
      ['🎄', 'The Christmas Tree Room, a look for decoration rooms'],
      ['🍭', 'Candy-cane and snowflake wallpapers'],
      ['🛋️', 'A plaid floor, a fireplace rug, red velvet curtains and a little Christmas tree'],
      ['🎅', 'A Christmas sweater, an elf outfit and ears, a Santa hat and reindeer antlers'],
    ],
  },
  fairy: {
    id: 'fairy',
    name: 'Fairy pack',
    icon: '🧚',
    product: 'pack.fairy',
    price: '$1.99',
    blurb: 'Toadstools, sparkle dust and fireflies, and a fairy glen to visit!',
    outside: { name: 'Fairy Garden', icon: '🍄', wings: true }, // wings: shoppers wear little fairy wings (GDD #161)
    contents: [
      ['🍄', 'Fairy Garden outside: giant toadstools, fairy doors in the trees, flowers round the shop, sparkle dust and fireflies, and shoppers with fairy wings'],
      ['🌿', 'The Fairy Glen, a look for decoration rooms'],
      ['🧚', 'Fairy, toadstool cottage and butterfly wallpapers'],
      ['🌸', 'A mossy stepping-stone floor, a flower-petal rug, leafy vine curtains and glowing mushrooms'],
      ['✨', 'A fairy dress with wings, and fairy ears'],
    ],
  },
  jungle: {
    id: 'jungle',
    name: 'Jungle pack',
    icon: '🌴',
    product: 'pack.jungle',
    price: '$1.99',
    blurb: 'Palm trees, parrots and a treehouse to climb!',
    outside: { name: 'Jungle Street', icon: '🦜' },
    contents: [
      ['🌴', 'Jungle Street outside: palm trees, big leafy plants, vines on the house, a toucan and parrots on the roof, and parrots flying about'],
      ['🛖', 'The Treehouse, a look for decoration rooms'],
      ['🐒', 'Jungle leaves and animal pals wallpapers'],
      ['🎋', 'A bamboo floor, a tiger-stripe rug, bamboo blinds and a parrot on a perch'],
      ['🧭', 'An explorer outfit and a safari hat'],
    ],
  },
  space: {
    id: 'space',
    name: 'Space pack',
    icon: '🚀',
    product: 'pack.space',
    price: '$1.99',
    blurb: 'A rocket, a UFO and planets in the sky, and a rocket room to fly!',
    outside: { name: 'Outer Space', icon: '🛸' },
    contents: [
      ['🛸', 'Outer Space outside: a starry sky with big planets, a rocket on its launch pad, a satellite dish on the roof and a UFO hovering over your shop'],
      ['🚀', 'The Rocket Room, a look for decoration rooms'],
      ['🪐', 'Planets-and-rockets and galaxy wallpapers'],
      ['🔭', 'A space-station floor, a ringed-planet rug, starry curtains and a telescope'],
      ['👩‍🚀', 'An astronaut suit, a bubble helmet and alien antennae'],
    ],
  },
  beach: {
    id: 'beach',
    name: 'Beach pack',
    icon: '🏖️',
    product: 'pack.beach',
    price: '$1.99',
    blurb: 'Sand, surf and sandcastles, and a beach hut by the waves!',
    outside: { name: 'Sunny Beach', icon: '🌊' },
    contents: [
      ['🌊', 'Sunny Beach outside: sand and waves, beach chairs and umbrellas, surfboards, sandcastles, palm trees and seagulls flying about'],
      ['🏖️', 'The Beach Hut, a look for decoration rooms'],
      ['🦀', 'Sea creatures and surf-and-waves wallpapers'],
      ['🐚', 'A driftwood floor, a sunshine rug, striped shell curtains and a surfboard'],
      ['🏄', 'A wetsuit and a sun visor'],
    ],
  },
  fullshop: {
    id: 'fullshop',
    name: 'Full shop',
    icon: '🏬',
    product: 'unlock.fullshop',
    price: '$3.99',
    unlock: true,
    blurb: 'Grow your shop as big as you like, and find every item in two more colors!',
    note: 'Buy it once and it\'s yours for good. Everything you\'ve built stays just as it is.',
    contents: [
      ['🛍️', 'More shelf rooms and decoration rooms, on any ＋ spot'],
      ['🪜', 'The Stairwell, with floor after floor upstairs'],
      ['🛎️', 'Register rooms, each with its own cashier'],
      ['🌈', 'Bright and 💎 Dazzle colors of every item: 64 more stickers, with their prizes'],
      ['🧰', 'More helpers and upgrades: Ollie, Rosa, Penny, the Big Cart, Roller Skates, Tall Shelves and the Bigger Dream Dollhouse'],
    ],
  },
  // The everything bundle (GDD #134, #161, #171): buying it sets `allPacks` (sim/packs.js), so it owns every pack and the
  // Full shop, and any pack added in a later update too. Not a decoration pack itself: it shows at the top of 🎁 Packs.
  bundle: {
    id: 'bundle',
    name: 'Everything bundle',
    icon: '🎁',
    product: 'pack.bundle',
    price: '$9.99',
    bundle: true,
    blurb: 'Every pack in the game and the Full shop, all in one!',
    note: 'Buy it once and it\'s yours for good. Packs added to the game later are yours too, at no extra cost.',
    contents: [
      ['🏬', 'The Full shop: more rooms, floors, register rooms, two more colors of every item, and every helper and upgrade'],
      ['👑', 'The Welcome pack'],
      ['🎄', 'The Christmas pack'],
      ['🏖️', 'The Beach pack'],
      ['🧚', 'The Fairy pack'],
      ['🌴', 'The Jungle pack'],
      ['🚀', 'The Space pack'],
    ],
  },
};

export const PACK_IDS = Object.keys(PACKS);
export const BUNDLE = 'bundle';
/** The decoration packs (just for looks): everything but the Full shop and the bundle. */
export const LOOK_PACK_IDS = PACK_IDS.filter((id) => !PACKS[id].unlock && !PACKS[id].bundle);
