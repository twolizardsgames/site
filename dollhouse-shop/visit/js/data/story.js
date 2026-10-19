// The story: bringing the old shop back to life (GDD §8.2, #147, #148, #151). Twelve visits, each at Open shop
// before the day starts: a friend walks over to the shopkeeper and says a few short lines (only the friend
// speaks), then the day starts. Each opens at a Hearts count (the fair at a Sparkle count, decorating on day 5),
// at most one a day, in order (sim/story.js). Rewards are story rooms (STORY_ROOMS), decorating, and the
// blue-ribbon looks at the end.

import { KID_SCALE } from './customers.js';

/** The friends who visit, drawn with the customers' character model (render/models/character.js). */
export const CAST = {
  maple: { name: 'Mrs. Maple', look: { hair: 'bun', hairColor: '#dcd6e0', skin: '#f5c4a0', outfit: '#b98ac9', accessory: 'glasses' } },
  june: { name: 'Grandma June', look: { hair: 'bob', hairColor: '#f1ede6', skin: '#e0a37c', outfit: '#8fc8e8', accessory: 'hat' } },
  lily: { name: 'Lily', look: { hair: 'pigtails', hairColor: '#7a4a2e', skin: '#ffd9c2', outfit: '#ffd166', accessory: 'bow', scale: KID_SCALE } },
  pip: { name: 'Pip', look: { hair: 'short', hairColor: '#f7f1ea', skin: '#f7f1ea', outfit: '#7fb0e8', accessory: 'bunny', scale: KID_SCALE } },
};

/**
 * Story rooms (GDD #147): like decoration rooms (any ＋ spot, +25% visitors, admired) but one of a kind, free, and
 * their look can't be changed. Each is a decoration room wearing a story look (DECOR.scene options with `story`,
 * data/decor.js; drawn by SCENES in render/models/scenes.js), with `room.story` set to its id.
 */
export const STORY_ROOMS = {
  piano: { name: 'Piano Room', icon: '🎹', decor: { paper: 'lilac', pattern: 'stripes', floor: 'cocoa' } },
  fireplace: { name: 'Fireplace Room', icon: '🔥', decor: { paper: 'peach', pattern: 'plain', floor: 'honey' } },
  kitchen: { name: 'Kitchen', icon: '🍪', decor: { paper: 'butter', pattern: 'gingham', floor: 'whitewood' } },
  workshop: { name: "Dollmaker's Workshop", icon: '🔨', decor: { paper: 'mint', pattern: 'plain', floor: 'honey' } },
  ribbon: { name: 'Blue Ribbon Room', icon: '🏆', decor: { paper: 'sky', pattern: 'blueribbon', floor: 'whitewood' } },
};

/** The fair's Sparkle target (chapter 11). */
export const FAIR_SPARKLE = 1000;

/**
 * The chapters, in order. `when`: { day } (on or after that day), { hearts } (Hearts so far) or { sparkle } (the
 * Sparkle count). `full`: needs the Full shop (GDD #148: only the Piano Room's chapters are free). `who`: the
 * visitors, the first one leading; each line names its speaker. `reward`: { room } (a story room to place),
 * { decor: true } (decorating opens, GDD #151), { looks: true } (the blue-ribbon outfit and wallpaper). `in`: a story
 * room the scene plays in, if it's built (the shopkeeper hops there first and back after, GDD #154). `early`: a chapter
 * that, once seen, lets this one come out of turn, ahead of chapters still waiting (the fair's result right after
 * Maple's "get your Sparkle to 1,000", without waiting for the workbench, GDD #159).
 */
export const CHAPTERS = [
  {
    id: 'key', title: 'The key', when: { day: 1 }, who: ['maple'],
    lines: [
      ['maple', "Hello, dear! I'm Mrs. Maple. I ran this little shop for forty years."],
      ['maple', 'It was full of happy faces once. Children pressed their noses to the window!'],
      ['maple', 'Then I got old, and the doors stayed shut for a long, long time.'],
      ['maple', "Here's the old brass key. It's yours now."],
      ['maple', 'Make it the best dollhouse shop around. I just know you can!'],
    ],
  },
  {
    id: 'decor', title: 'Flowery walls', when: { day: 5 }, who: ['maple'], reward: { decor: true },
    lines: [
      ['maple', 'Just popping in to see how you\'re settling in. Customers already!'],
      ['maple', 'You know, this was the prettiest shop on the whole street.'],
      ['maple', 'Flowery walls, cozy rugs, curtains in every window...'],
      ['maple', "Here's a little ribbon to get you started. Collect more and make it pretty again! 🎀"],
    ],
  },
  {
    id: 'piano1', title: "June's piano", when: { hearts: 50 }, who: ['june'],
    lines: [
      ['june', "Oh my, the old shop is open again! I came here every week when I was little."],
      ['june', 'My family had a piano back then. I played it every single evening.'],
      ['june', 'One winter we had to sell it. I cried and cried.'],
      ['june', 'I still wonder where it went. Silly, isn\'t it?'],
    ],
  },
  {
    id: 'piano2', title: 'Found it!', when: { hearts: 150 }, who: ['pip'], reward: { room: 'piano' },
    lines: [
      ['pip', "Special delivery! Well... a really, REALLY big one."],
      ['pip', 'I spotted an old piano at the thrift store, and guess what?'],
      ['pip', '"June" is carved inside the lid! It has to be hers!'],
      ['pip', "I brought it over. It needs a room of its own. Where shall we put it? 🎹"],
    ],
  },
  {
    id: 'fire1', title: 'The old fireplace', when: { hearts: 350 }, who: ['maple'], full: true,
    lines: [
      ['maple', 'Look how busy it is! I could hardly get through the door.'],
      ['maple', 'Did you know there used to be a fireplace here?'],
      ['maple', 'On snowy days the children warmed their hands by it and sipped cocoa.'],
      ['maple', 'Someone boarded it up long ago. What a shame.'],
    ],
  },
  {
    id: 'fire2', title: 'Warm again', when: { hearts: 600 }, who: ['maple'], full: true, reward: { room: 'fireplace' },
    lines: [
      ['maple', 'I have a surprise for you, dear!'],
      ['maple', 'My nephew opened up the old fireplace. Stockings, armchair and all.'],
      ['maple', 'It belongs in a room of its own, where everyone can see it.'],
      ['maple', 'Now the shop can be warm and cozy again. 🔥'],
    ],
  },
  {
    id: 'cookies1', title: 'A recipe card', when: { hearts: 900 }, who: ['lily'], full: true,
    lines: [
      ['lily', 'Hi! I come here all the time. I\'m saving up for my very first dollhouse!'],
      ['lily', 'Look what I found tucked in a tiny dollhouse drawer...'],
      ['lily', 'An old recipe card! "Maple\'s Cinnamon Cookies".'],
      ['lily', 'Grandma June says the whole shop used to smell of them. Mmm!'],
    ],
  },
  {
    id: 'cookies2', title: 'Cinnamon cookies', when: { hearts: 1300 }, who: ['june', 'lily'], full: true, reward: { room: 'kitchen' },
    lines: [
      ['lily', 'Surprise! We baked them together!'],
      ['june', "They taste just like I remember. Try one, they're still warm."],
      ['lily', 'And we set up a kitchen for the shop!'],
      ['june', 'So it can smell of cinnamon cookies again, every day. 🍪'],
    ],
  },
  {
    id: 'fair1', title: 'The county fair', when: { hearts: 1800 }, who: ['maple'], full: true,
    lines: [
      ['maple', 'Big news, dear! The county fair is coming.'],
      ['maple', 'They give a prize for the Best Dollhouse Shop.'],
      ['maple', 'This shop won it once, a long time ago. Oh, I was so proud!'],
      ['maple', 'Get your Sparkle ✨ up to 1,000 and I think you could win it again!'],
    ],
  },
  {
    id: 'workshop', title: "Grandpa's workbench", when: { hearts: 2500 }, who: ['lily'], full: true, reward: { room: 'workshop' },
    lines: [
      ['lily', 'I did it! My dollhouse is finished! Look, it has a little balcony!'],
      ['lily', 'Grandma says my grandpa built dollhouses right here, in the back room.'],
      ['lily', 'His workbench and tools are still there, under a dusty old sheet.'],
      ['lily', 'He would have wanted you to have them. Make something wonderful! 🔨'],
    ],
  },
  {
    id: 'fair2', title: 'The blue ribbon', when: { sparkle: FAIR_SPARKLE }, early: 'fair1', who: ['maple'], full: true, reward: { room: 'ribbon' },
    lines: [
      ['maple', "I just came from the fair, and you'll never guess..."],
      ['maple', 'You WON! Best Dollhouse Shop in the whole county!'],
      ['maple', 'Here\'s the blue ribbon, and a great big trophy.'],
      ['maple', 'They deserve a room of their own. I\'m so proud of you! 🏆'],
    ],
  },
  {
    id: 'thanks', title: 'Thank you', when: { after: 'fair2' }, who: ['maple', 'june', 'lily', 'pip'], full: true, reward: { looks: true }, in: 'ribbon',
    lines: [
      ['maple', "We all came to say thank you, dear."],
      ['june', 'My piano sings again.'],
      ['lily', 'And it smells of cookies!'],
      ['pip', 'And I get to deliver here every day!'],
      ['maple', 'You brought the old shop back to life. Here, something blue to wear, and a wallpaper to match. 🎀'],
    ],
  },
];

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id) ?? null;

/** The chapter that gives a story room. */
export const roomChapter = (roomId) => CHAPTERS.find((c) => c.reward?.room === roomId) ?? null;
