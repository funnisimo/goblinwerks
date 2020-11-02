// import Item, {Wearable, Drinkable} from "./item.js";
// import * as pubsub from "util/pubsub.js";
// import * as log from "ui/log.js";
// import * as rules from "rules.js";
//

const WEARABLE_SUFFIXES = {
	[GW.config.ATTACK_1]: "power",
	[GW.config.ATTACK_2]: "treachery",
	[GW.config.MAGIC_1]: "magical domination",
	[GW.config.MAGIC_2]: "magical weakness"
};



class BeautyItem extends GW.types.ItemKind {
	constructor(opts={}) {
    GW.utils.setDefaults(opts, {
      stats: {},
    });
    GW.utils.setDefaults(opts.stats, {
      defense: 0,
      attack: 0,
      combatBonus: null,
    });
		super(opts);
  }

  make(item, opts) {
    let name = this.name;
    if (this.prefixes && GW.random.chance(50)) {
			const prefix = GW.random.key(this.prefixes);
      name = prefix + ' ' + name;
      if (this.slot === 'melee') {
        item.stats.attack += this.prefixes[prefix];
      }
      else {
        item.stats.defense += this.prefixes[prefix];
      }
    }

		if (this.suffixes && GW.random.chance(GW.config.COMBAT_MODIFIER)) {
			let combat = GW.random.key(this.suffixes);
      name = name + ' of ' + this.suffixes[combat];
			item.stats.combatBonus = combat;

      item.sprite = this.sprite.clone();
			GW.color.applyMix(item.sprite.fg, GW.config.COMBAT_COLORS[combat], 50);
    }

    if (name != this.name) {
      item.name = name;
    }
	}

  getName(item, opts={}) {
    let base = super.getName(item, opts);
    if (opts.details) {
      if (item.stats.defense) {
        if (item.stats.combatBonus) {
          base += ` <${item.stats.defense}${COMBAT_BONUS_DISPLAY[item.stats.combatBonus]}>`;
        }
        else {
          base += ` <${item.stats.defense}>`;
        }
      }
      else if (item.stats.attack) {
        if (item.stats.combatBonus) {
          base += ` [${item.stats.attack}${COMBAT_BONUS_DISPLAY[item.stats.combatBonus]}]`;
        }
        else {
          base += ` [${item.stats.attack}]`;
        }
      }
      else if (item.stats.combatBonus) {
        base += ` ${COMBAT_BONUS_DISPLAY[item.stats.combatBonus]}`;
      }
    }
    if (opts.color === false) {
      base = GW.text.removeColors(base);
    }
    return base;
  }
}


function generateAndPlaceItems(map, opts={}) {
  if (typeof opts === 'number') { opts = { count: opts }; }
  GW.utils.setDefaults(opts, {
    tries: 1,
    chance: 100,
    outOfBandChance: 0,
    matchKindFn: null,
    allowHallways: false,
    blockLoc: 'start',
    locTries: 500,
    choices: null,
    makeOpts: null,
  });

  let danger = opts.danger || map.config.danger || 1;
  while (GW.random.chance(opts.outOfBandChance)) {
    ++danger;
  }

  let count = 0;
  for(let i = 0; i < opts.tries; ++i) {
    if (GW.random.chance(opts.chance)) {
      ++count;
    }
  }
  if (!count) {
    GW.utils.WARN('Tried to place 0 items.');
    return 0;
  }

  let choices = opts.choices;
  if (!choices) {
    let matchKindFn = opts.matchKindFn || ((k) => k.stats.danger <= danger);
    choices = Object.values(GW.itemKinds).filter(matchKindFn);
  }
  if (!choices.length) {
    GW.utils.WARN('Tried to place items - 0 qualifying kinds to choose from.');
    return 0;
  }

  const blocked = GW.grid.alloc(map.width, map.height);
  if (opts.blockLoc && map.locations[opts.blockLoc]) {
    const loc = map.locations[opts.blockLoc];
    map.calcFov(blocked, loc[0], loc[1], 20);
  }

  let placed = 0;

  const makeOpts = {
    danger
  };

  if (opts.makeOpts) {
    Object.assign(makeOpts, opts.makeOpts);
  }

  const matchOpts = {
    allowHallways: opts.allowHallways,
    blockingMap: blocked,
    allowLiquid: false,
    forbidCellFlags: 0,
    forbidTileFlags: 0,
    forbidTileMechFlags: 0,
    tries: opts.locTries,
  };

  for(let i = 0; i < count; ++i) {
    const kind = GW.random.item(choices);
    matchOpts.forbidCellFlags = kind.forbiddenCellFlags();
    matchOpts.forbidTileFlags = kind.forbiddenTileFlags();
    matchOpts.forbidTileMechFlags = kind.forbiddenTileMechFlags();

    const loc = map.randomMatchingXY(matchOpts);
    if (loc && loc[0] > 0) {
      // make and place item
      const item = GW.make.item(kind, makeOpts);
      map.addItem(loc[0], loc[1], item);
      ++placed;
    }
  }

  GW.grid.free(blocked);
  return placed;
}


const WEAPON_PREFIXES = {
	"sharp": +1,
	"blunt": -1,
	"epic": 2
};



GW.item.addKind('DAGGER', new BeautyItem({
  name: 'dagger', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 1, danger: 1 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));


GW.item.addKind('SWORD', new BeautyItem({
  name: 'sword', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 2, danger: 2 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));

GW.item.addKind('AXE', new BeautyItem({
  name: 'axe', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 3, danger: 3 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));


GW.item.addKind('MACE', new BeautyItem({
  name: 'mace', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 3, danger: 4 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));

GW.item.addKind('GREATSWORD', new BeautyItem({
  name: 'greatsword', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 4, danger: 5 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));



const ARMOR_PREFIXES = {
	"leather": 1,
	"iron": 2,
	"tempered": 3
};


GW.item.addKind('ARMOR', new BeautyItem({
  name: 'armor', slot: 'armor', ch: ']', fg: '#a62',
  stats: { defense: 2, danger: 1 },
  prefixes: ARMOR_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));


GW.item.addKind('HELMET', new BeautyItem({
  name: 'helmet', slot: 'helmet', ch: '^', fg: '#631',
  stats: { defense: 1, danger: 1 },
  prefixes: ARMOR_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));

const SHIELD_PREFIXES = {
	"small": -1,
	"large": 1,
	"tower": 2
};

GW.item.addKind('SHIELD', new BeautyItem({
  name: 'shield', slot: 'shield', ch: ')', fg: '#841',
  stats: { defense: 2, danger: 1 },
  prefixes: SHIELD_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));


GW.color.addKind('health', '#e00');

GW.item.addKind('POTION_HEALTH', {
  name: 'health potion',
  ch: '!', fg: 'health',
  flags: 'IK_DESTROY_ON_USE',
  stats: { strength: 10, danger: 1 },
  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    if (actor.current.health >= actor.max.health) {
      GW.message.add('You do not need to recharge your %Rhealth%R.', 'health', null);
      return false;
    }
    else {
      if (actor.current.health + item.stats.strength < actor.max.health) {
        GW.message.add('Some of your %Rhealth%R is refilled.', 'health', null);
      }
      else {
        GW.message.add('Your %Rhealth%R is completely refilled.', 'health', null);
      }
      actor.adjustStat('health', item.stats.strength);
    }
    return true;
  }
});

GW.color.addKind('mana', '#84a');

GW.item.addKind('POTION_MANA', {
  name: 'mana potion',
  ch: '!', fg: 'mana',
  flags: 'IK_DESTROY_ON_USE',
  stats: { strength: 10, danger: 1 },
  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    if (actor.current.mana >= actor.max.mana) {
      GW.message.add('You do not need to recharge your %Rmana%R.', 'mana', null);
      return false;
    }
    else {
      if (actor.current.mana + item.stats.strength < actor.max.mana) {
        GW.message.add('Some of your %Rmana%R is refilled.', 'mana', null);
      }
      else {
        GW.message.add('Your %Rmana%R is completely refilled.', 'mana', null);
      }
      actor.adjustStat('mana', item.stats.strength);
    }
    return true;
  }
});


GW.item.addKind('LUTEFISK', {
  name: 'lutefisk',
  ch: '?', fg: '#ff0',
  flags: 'IK_DESTROY_ON_USE',
  stats: { danger: 3 },
  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    GW.message.add('You eat %s and start to feel weird.', item.getName('the'));
    actor.adjustStat('health', actor.max.health);
    actor.adjustStat('mana', -actor.max.mana);
    return true;
  }
});


GW.item.addKind('GOLD', {
  name: 'gold coin', article: 'a',
  ch: '$', fg: 'gold',
  flags: 'IK_DESTROY_ON_USE',
  stats: { danger: 1 },
  use(item, actor, ctx={}) {
    actor.current.gold = 1 + (actor.current.gold || 0);
    GW.message.add('You found %s.', item.getName({ article: true, color: true }));
    // item.destroy();
    return true;
  }
});
