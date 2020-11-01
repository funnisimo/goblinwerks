// import Item, {Wearable, Drinkable} from "./item.js";
// import * as pubsub from "util/pubsub.js";
// import * as log from "ui/log.js";
// import * as rules from "rules.js";
//
// const WEAPON_PREFIXES = {
// 	"sharp": +1,
// 	"blunt": -1,
// 	"epic": 2
// };
//

const WEARABLE_SUFFIXES = {
	[GW.config.ATTACK_1]: "power",
	[GW.config.ATTACK_2]: "treachery",
	[GW.config.MAGIC_1]: "magical domination",
	[GW.config.MAGIC_2]: "magical weakness"
};


//
// export class Dagger extends Wearable {
// 	constructor() {
// 		super("weapon", {ch:"(", fg:"#ccd", name:"dagger"}, 1, WEAPON_PREFIXES);
// 	}
// }
// Dagger.danger = 1;
//
// export class Sword extends Wearable {
// 	constructor() {
// 		super("weapon", {ch:"(", fg:"#dde", name:"sword"}, 2, WEAPON_PREFIXES);
// 	}
// }
// Sword.danger = 2;
//
// export class Axe extends Wearable {
// 	constructor() {
// 		super("weapon", {ch:")", fg:"#ccd", name:"axe"}, 3, WEAPON_PREFIXES);
// 	}
// }
// Axe.danger = 3;
//
// export class Mace extends Wearable {
// 	constructor() {
// 		super("weapon", {ch:")", fg:"#bbc", name:"mace"}, 3, WEAPON_PREFIXES);
// 	}
// }
// Mace.danger = 4;
//
// export class GreatSword extends Wearable {
// 	constructor() {
// 		super("weapon", {ch:"(", fg:"#fff", name:"greatsword"}, 4, WEAPON_PREFIXES);
// 	}
// }
// GreatSword.danger = 5;
//

const ARMOR_PREFIXES = {
	"leather": 1,
	"iron": 2,
	"tempered": 3
};

class Armor extends GW.types.ItemKind {
	constructor(opts={}) {
    GW.utils.setDefaults(opts, {
      ch: ']',
      fg: '#a62',
      name: 'armor',
      slot: 'armor',
      stats: {},
    });
    GW.utils.setDefaults(opts.stats, {
      defense: 2,
      combatBonus: null,
    });
		super(opts);
  }

  make(item, opts) {
    let name = this.name;
    if (this.prefixes && GW.random.chance(50)) {
			const prefix = GW.random.key(this.prefixes);
      name = prefix + ' ' + name;
			item.stats.defense += this.prefixes[prefix];
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
      if (item.stats.combatBonus) {
        base += ` <${item.stats.defense}${COMBAT_BONUS_DISPLAY[item.stats.combatBonus]}>`;
      }
      else {
        base += ` <${item.stats.defense}>`;
      }
    }
    if (opts.color === false) {
      base = GW.text.removeColors(base);
    }
    return base;
  }
}

GW.item.addKind('ARMOR', new Armor({ prefixes: ARMOR_PREFIXES, suffixes: WEARABLE_SUFFIXES, stats: { defense: 2 } }));

// export class Helmet extends Wearable {
// 	constructor() {
// 		super("helmet", {ch:"]", fg:"#631", name:"helmet"}, 1, ARMOR_PREFIXES);
// 	}
// }
// Helmet.danger = 2;
//

GW.item.addKind('HELMET', new Armor({
  name: 'helmet', slot: 'helmet', stats: { defense: 1 }, fg: '#631',
  prefixes: ARMOR_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));

const SHIELD_PREFIXES = {
	"small": -1,
	"large": 1,
	"tower": 2
};

// export class Shield extends Wearable {
// 	constructor() {
// 		super("shield", {ch:"[", fg:"#841", name:"shield"}, 2, SHIELD_PREFIXES);
// 	}
// }
// Shield.danger = 2;
//

GW.item.addKind('SHIELD', new Armor({
  name: 'shield', slot: 'shield', stats: { defense: 2 }, fg: '#841',
  prefixes: SHIELD_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));


GW.color.addKind('health', '#e00');

GW.item.addKind('POTION_HEALTH', {
  name: 'health potion',
  ch: '!', fg: 'health',
  flags: 'IK_DESTROY_ON_USE',
  stats: { strength: 10 },
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
  stats: { strength: 10 },
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
  use(item, actor, ctx={}) {
    actor.current.gold = 1 + (actor.current.gold || 0);
    GW.message.add('You found %s.', item.getName({ article: true, color: true }));
    item.destroy();
    return true;
  }
});
