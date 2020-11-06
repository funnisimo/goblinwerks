// import Being from "./being.js";
// import * as items from "item/items.js";
// import * as ai from "ai.js";
// import * as log from "ui/log.js";
// import * as rules from "rules.js";

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

// class Autonomous extends Being {
// 	constructor(visual) {
// 		super(visual);
// 		this.ai = {
// 			hostile: ROT.RNG.getUniform() < rules.HOSTILE_CHANCE,
// 			mobile: true
// 		}
// 		this.inventory.addItem(new items.Gold());
// 	}
//
// 	act() {
// 		return ai.act(this);
// 	}
//
// 	getChat() {
// 		return null;
// 	}
// }
//
// export class Rat extends Autonomous {
// 	constructor() {
// 		super({ch:"r", fg:"#aaa", name:"rat"});
// 		this.mana = this.maxmana = 0;
// 		this.hp = this.maxhp = 1;
// 	}
// }
// Rat.danger = 1;
//

GW.actor.addKind('RAT', {
  name: 'rat',
  ch: 'r', fg: '#aaa',
  stats: { mana: 0, health: 1, danger: 1, attack: 10, defense: 10 },
  frequency: 20,
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  }
});


// export class Bat extends Autonomous {
// 	constructor() {
// 		super({ch:"b", fg:"#a83", name:"bat"});
// 		this.mana = this.maxmana = 0;
// 		this.hp = this.maxhp = 10;
// 	}
// }
// Bat.danger = 1;

GW.actor.addKind('BAT', {
  name: 'bat',
  ch: 'b', fg: '#a83',
  stats: { mana: 0, health: 10, danger: 1, attack: 10, defense: 10 },
  frequency: { '2+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  }
});

//
// export class Goblin extends Autonomous {
// 	constructor() {
// 		super({ch:"g", fg:"#33a", name:"goblin"});
// 		this.hp = this.maxhp = 10;
// 		this.mana = this.maxmana = 5;
// 	}
// }
// Goblin.danger = 2;

GW.actor.addKind('GOBLIN', {
  name: 'goblin',
  ch: 'g', fg: '#33a',
  stats: { mana: 5, health: 10, danger: 2, attack: 10, defense: 10 },
  frequency: { '2+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'clubs' }
  }
});


//
// export class Orc extends Autonomous {
// 	constructor() {
// 		super({ch:"o", fg:"#3a3", name:"orc"});
// 		this.hp = this.maxhp = 15;
// 		this.mana = this.maxmana = 10;
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Dagger()); }
// 	}
// }
// Orc.danger = 3;

GW.actor.addKind('ORC', {
  name: 'orc',
  ch: 'o', fg: '#3a3',
  stats: { mana: 10, health: 15, danger: 3, attack: 10, defense: 10 },
  frequency: { '2+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
  // treasure: [{ DAGGER: 50 }],
  make(actor, opts={}) { if (GW.random.chance(50)) { actor.pack = GW.make.item('DAGGER'); } }
});

//
// export class OrcWitch extends Autonomous {
// 	constructor() {
// 		super({ch:"O", fg:"#33a", name:"orcish witch"});
// 		this.hp = this.maxhp = 15;
// 		this.sex = 1;
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Helmet()); }
// 	}
// }
// OrcWitch.danger = 4;
//

GW.actor.addKind('ORC_WITCH', {
  name: 'orcish witch',
  ch: 'O', fg: '#33a',
  stats: { mana: 10, health: 15, danger: 4, attack: 10, defense: 10 },
  flags: 'AF_FEMALE',
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
  // treasure: [{ HELMET: 50 }],
  make(actor, opts={}) { if (GW.random.chance(50)) { actor.pack = GW.make.item('HELMET'); } }
});


// export class Skeleton extends Autonomous {
// 	constructor() {
// 		super({ch:"s", fg:"#eee", name:"skeleton"});
// 		this.hp = this.maxhp = 25;
// 		this.attack = 15;
// 		if (ROT.RNG.getUniform() > 0.5) {
// 			this.inventory.addItem(new items.Dagger());
// 		} else {
// 			this.inventory.addItem(new items.Sword());
// 		}
// 	}
// }
// Skeleton.danger = 5;

GW.actor.addKind('SKELETON', {
  name: 'skeleton',
  ch: 's', fg: '#eee',
  stats: { mana: 10, health: 25, danger: 5, attack: 15, defense: 10 },
  flags: 'AF_FEMALE',
  frequency: { '4+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
  // treasure: [{ DAGGER: 50, SWORD: 50 }],
  make(actor, opts={}) {
    const kind = GW.random.item(['DAGGER', 'SWORD']);
    actor.pack = GW.make.item(kind);
  }
});


//
// export class Ogre extends Autonomous {
// 	constructor() {
// 		super({ch:"O", fg:"#3a3", name:"ogre"});
// 		this.hp = this.maxhp = 30;
// 		this.attack = 15;
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Mace()); }
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Shield()); }
// 	}
// }
// Ogre.danger = 6;
//

GW.actor.addKind('OGRE', {
  name: 'ogre',
  ch: 'O', fg: '#3a3',
  stats: { mana: 10, health: 30, danger: 5, attack: 15, defense: 10 },
  frequency: { '4+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'pound' }
  },
  // treasure: [{ MACE: 50 }, { SHIELD: 50 }],
  make(actor, opts={}) {
    if (GW.random.chance(50)) { actor.addToPack(GW.make.item('MACE')); }
    if (GW.random.chance(50)) { actor.addToPack(GW.make.item('SHIELD')); }
  }
});

// export class Zombie extends Autonomous {
// 	constructor() {
// 		super({ch:"z", fg:"#d3d", name:"zombie"});
// 	}
// }
// Zombie.danger = 6;
//


GW.actor.addKind('ZOMBIE', {
  name: 'zombie',
  ch: 'z', fg: '#d3d',
  stats: { mana: 10, health: 10, danger: 6, attack: 10, defense: 10 },
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'claw' }
  },
});


// export class Spider extends Autonomous {
// 	constructor() {
// 		super({ch:"s", fg:"#c66", name:"spider"});
// 		this.hp = this.maxhp = 10;
// 		this.mana = this.maxmana = 0;
// 		this.attack = 15;
// 	}
// }
// Spider.danger = 3;
//

GW.actor.addKind('SPIDER', {
  name: 'spider',
  ch: 's', fg: '#c66',
  stats: { mana: 0, health: 10, danger: 3, attack: 15, defense: 10 },
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  },
});

// export class Snake extends Autonomous {
// 	constructor() {
// 		super({ch:"s", fg:"#6c6", name:"poisonous snake"});
// 		this.hp = this.maxhp = 10;
// 		this.mana = this.maxmana = 0;
// 		this.attack = 15;
// 	}
// }
// Snake.danger = 4;
//

GW.actor.addKind('SNAKE', {
  name: 'poisonous snake',
  ch: 's', fg: '#6c6',
  stats: { mana: 0, health: 10, danger: 4, attack: 15, defense: 10 },
  frequency: { '3+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'bite' }
  },
});

// export class Minotaur extends Autonomous {
// 	constructor() {
// 		super({ch:"M", fg:"#ca7", name:"minotaur warrior"});
// 		this.hp = this.maxhp = 30;
// 		this.mana = this.maxmana = 30;
// 		this.attack = 15;
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Mace()); }
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Shield()); }
// 		if (ROT.RNG.getUniform() > 0.5) { this.inventory.addItem(new items.Armor()); }
// 	}
// }
// Minotaur.danger = 8;
//

GW.actor.addKind('MINOTAUR', {
  name: 'minotaur',
  ch: 'M', fg: '#ca7',
  stats: { mana: 30, health: 30, danger: 8, attack: 15, defense: 10 },
  frequency: { '5+': 20 },
  ai: ['attackPlayer', 'moveTowardPlayer', 'moveRandomly', 'idle'],
  attacks: {
    melee: { verb: 'pound' }
  },
  // treasure: [{ MACE: 50 }, { SHIELD: 50 }, { ARMOR: 50 }],
  make(actor, opts={}) {
    if (GW.random.chance(50)) { actor.addToPack(GW.make.item('MACE')); }
    if (GW.random.chance(50)) { actor.addToPack(GW.make.item('SHIELD')); }
    if (GW.random.chance(50)) { actor.addToPack(GW.make.item('ARMOR')); }
  }
});

// export class Tree extends Autonomous {
// 	constructor() {
// 		super({ch:"T", fg:"#3c3", name:"animated tree"});
// 		this.hp = this.maxhp = 30;
// 		this.mana = this.maxmana = 30;
// 		this.defense = 15;
// 		this.ai.mobile = false;
// 	}
// }
// Tree.danger = 8;
//


GW.actor.addKind('TREE', {
  name: 'animated tree',
  ch: 'T', fg: '#3c3',
  stats: { mana: 30, health: 30, danger: 8, attack: 15, defense: 15 },
  frequency: { '5+': 20 },
  flags: 'AK_INANIMATE',
  ai: ['attackPlayer', 'idle'],
  attacks: {
    melee: { verb: 'slash' }
  },
});


// export class Hero extends Autonomous {
// 	constructor() {
// 		let race = HERO_RACES.random();
// 		let type = HERO_TYPES.random();
// 		let visual = {
// 			ch: type.charAt(0),
// 			fg: ROT.Color.toRGB([
// 				ROT.RNG.getUniformInt(100, 255),
// 				ROT.RNG.getUniformInt(100, 255),
// 				ROT.RNG.getUniformInt(100, 255)
// 			]),
// 			name: `${race} ${type}`
// 		};
// 		super(visual);
// 		this.sex = 2;
// 		this.ai.hostile = false;
// 	}
//
// 	getChat() {
// 		if (this._level.danger == rules.LAST_LEVEL) {
// 			return [
// 				"You can do whatever you want here, but beware - no kissing!",
// 				"We only have one rule here: no kissing!",
// 				"Make sure you don't wake her up!",
// 				"Sssh! She is sleeping, don't you see?",
// 				"I see, another lucky adventurer!"
// 			].random();
// 		} else {
// 			return HERO_CHATS.random();
// 		}
// 	}
// }
