
const HERO_RACES = ["dwarven", "halfling", "orcish", "human", "elvish", "noble"];
const HERO_TYPES = ["knight", "adventurer", "hero", "explorer"];
const HERO_CHATS = [
	"Hi there, fellow adventurer!",
	"I wonder how many tower floors are there...",
	"Some monsters in this tower give a pretty hard fight!",
	"Look out for potions, they might save your butt.",
	"So, you are also looking for that sleeping princess?",
	"A sharp sword is better than a blunt one.",
	"I used to be an adventurer like you. But then I got hurt on a thorn..."
];

const HERO_LAST_CHATS = [
	"You can do whatever you want here, but beware - no kissing!",
	"We only have one rule here: no kissing!",
	"Make sure you don't wake her up!",
	"Sssh! She is sleeping, don't you see?",
	"I see, another lucky adventurer!"
];


class Monster extends GW.types.ActorKind {
  constructor(opts) {
    super(opts);
    this.treasure = opts.treasure || null;
    if (this.treasure && !Array.isArray(this.treasure)) {
      this.treasure = [this.treasure];
    }
  }

  make(actor, opts) {
    super.make(actor, opts);
    if (this.treasure) {
      this.treasure.forEach( (info) => {
        let kind = info;
        if (Array.isArray(kind)) {
          kind = GW.random.item(kind);
        }
        else if (typeof kind !== 'string') {
          kind = GW.random.weighted(kind);
        }
        if (kind != 'NONE') {
          actor.addToPack(GW.make.item(kind));
        }
      });
    }
  }

  talk(talker, listener, ctx) {
    GW.message.add('TALK_NOTHING', { talker, listener });
    return true;
  }

};

GW.message.addKind('TALK_NOTHING', '$the.talker$ $say$ nothing.');


GW.actor.addKind('RAT', new Monster({
  name: 'rat',
  ch: 'r', fg: '#aaa',
  stats: { mana: 0, health: 1, danger: 1, attack: 10, defense: 10 },
  frequency: 20,
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  }
}));


GW.actor.addKind('BAT', new Monster({
  name: 'bat',
  ch: 'b', fg: '#a83',
  stats: { mana: 0, health: 10, danger: 1, attack: 10, defense: 10 },
  frequency: { '2+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  }
}));

GW.actor.addKind('GOBLIN', new Monster({
  name: 'goblin',
  ch: 'g', fg: '#33a',
  stats: { mana: 5, health: 10, danger: 2, attack: 10, defense: 10 },
  frequency: { '2+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'clubs' }
  }
}));

GW.actor.addKind('ORC', new Monster({
  name: 'orc',
  ch: 'o', fg: '#3a3',
  stats: { mana: 10, health: 15, danger: 3, attack: 10, defense: 10 },
  frequency: { '2+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
  treasure: [{ DAGGER: 50 }],
}));

GW.actor.addKind('ORC_WITCH', new Monster({
  name: 'orcish witch',
  ch: 'O', fg: '#33a',
  stats: { mana: 10, health: 15, danger: 4, attack: 10, defense: 10 },
  flags: 'AF_FEMALE',
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
  treasure: [{ HELMET: 50 }],
}));


GW.actor.addKind('SKELETON', new Monster({
  name: 'skeleton',
  ch: 's', fg: '#eee',
  stats: { mana: 10, health: 25, danger: 5, attack: 15, defense: 10 },
  flags: 'AF_FEMALE',
  frequency: { '4+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
  treasure: [{ DAGGER: 50, SWORD: 50 }],
}));


GW.actor.addKind('OGRE', new Monster({
  name: 'ogre',
  ch: 'O', fg: '#3a3',
  stats: { mana: 10, health: 30, danger: 5, attack: 15, defense: 10 },
  frequency: { '4+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'pound' }
  },
  treasure: [{ MACE: 50 }, { SHIELD: 50 }],
}));

GW.actor.addKind('ZOMBIE', new Monster({
  name: 'zombie',
  ch: 'z', fg: '#d3d',
  stats: { mana: 10, health: 10, danger: 6, attack: 10, defense: 10 },
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'claw' }
  },
}));

GW.actor.addKind('SPIDER', new Monster({
  name: 'spider',
  ch: 's', fg: '#c66',
  stats: { mana: 0, health: 10, danger: 3, attack: 15, defense: 10 },
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  },
}));

GW.actor.addKind('SNAKE', new Monster({
  name: 'poisonous snake',
  ch: 's', fg: '#6c6',
  stats: { mana: 0, health: 10, danger: 4, attack: 15, defense: 10 },
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  },
}));

GW.actor.addKind('MINOTAUR', new Monster({
  name: 'minotaur',
  ch: 'M', fg: '#ca7',
  stats: { mana: 30, health: 30, danger: 8, attack: 15, defense: 10 },
  frequency: { '5+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'pound' }
  },
  treasure: [{ MACE: 50 }, { SHIELD: 50 }, { ARMOR: 50 }],
}));

GW.actor.addKind('TREE', new Monster({
  name: 'animated tree',
  ch: 'T', fg: '#3c3',
  stats: { mana: 30, health: 30, danger: 8, attack: 15, defense: 15 },
  frequency: { '5+': 20 },
  flags: 'AK_INANIMATE',
  ai: ['attackPlayer', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
}));

class Hero extends Monster {
  constructor(opts) {
    GW.utils.kindDefaults(opts, {
      bump: ['talk'],
      ai: ['moveRandomly', 'idle'],
      'attacks.melee.verb': 'slash',
    });
    super(opts);
  }

  make(actor, opts) {
		let race = GW.random.item(HERO_RACES);
		let type = GW.random.item(HERO_TYPES);
    actor.name = `${race} ${type}`;
    actor.sprite = GW.make.sprite(type.charAt(0), [GW.random.number(50) + 50, GW.random.number(50) + 50, GW.random.number(50) + 50]);
    super.make(actor, opts);
  }

  talk(talker, listener, ctx) {
    let chats = HERO_CHATS;
    if (GW.data.map.config.danger === GW.config.LAST_LEVEL) {
      chats = HERO_LAST_CHATS;
    }
    const text = GW.random.item(chats);
    GW.message.add('TALK_TEXT', { talker, text, listener });
    return true;
  }
}

GW.message.addKind('TALK_TEXT', '$talker$ $say$, "$text$"');


GW.actor.addKind('HERO', new Hero({
  name: 'hero',
  ch: 'H', fg: '#3c3',
  stats: { mana: 10, health: 10, danger: 1, attack: 15, defense: 15 },
  frequency: { '2+': 10 },
  flags: 'AF_MALE',
}));
