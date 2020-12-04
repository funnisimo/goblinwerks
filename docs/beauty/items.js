
const WEARABLE_SUFFIXES = {
  "power": 1,
  "treachery": 2,
  "magical domination": 3,
  "magical weakness": 4,
};

GW.config.POTION_HP = 10;
GW.config.POTION_MANA = 10;
GW.config.ITEM_BONUS_BASE = 25;
GW.config.ITEM_BONUS_PER_DANGER = 5;


class BeautyItem extends GW.types.ItemKind {
	constructor(opts={}) {
    GW.utils.kindDefaults(opts, {
      'stats.defense': 0,
      'stats.attack': 0,
      'stats.combatBonus': 0,
    });
		super(opts);
  }

  make(item, opts={}) {
    if (typeof opts === 'number') { opts = { danger: opts }; }

    let name = this.name;
    const danger = opts.danger || 1;
    if (this.prefixes && GW.random.chance(GW.config.ITEM_BONUS_BASE + danger * GW.config.ITEM_BONUS_PER_DANGER)) {
			const prefix = GW.random.key(this.prefixes);
      name = prefix + ' ' + name;
      if (this.slot === 'melee') {
        item.stats.attack += this.prefixes[prefix];
      }
      else {
        item.stats.defense += this.prefixes[prefix];
      }
    }

		if (this.suffixes && GW.random.chance(GW.config.ITEM_BONUS_BASE + danger * GW.config.ITEM_BONUS_PER_DANGER)) {
			let combat = GW.random.key(this.suffixes);
      name = name + ' of ' + combat;
			item.stats.combatBonus = this.suffixes[combat];

      item.sprite = this.sprite.clone();
			item.sprite.fg.mix(GW.config.COMBAT_COLORS[item.stats.combatBonus], 50);
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



const WEAPON_PREFIXES = {
	"sharp": +1,
	"blunt": -1,
	"epic": 2
};



GW.item.addKind('DAGGER', new BeautyItem({
  name: 'dagger', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 1 }, frequency: 50,
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));


GW.item.addKind('SWORD', new BeautyItem({
  name: 'sword', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 2 }, frequency: { '2+': 40 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));

GW.item.addKind('AXE', new BeautyItem({
  name: 'axe', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 3 }, frequency: { '3+': 30 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));


GW.item.addKind('MACE', new BeautyItem({
  name: 'mace', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 3 }, frequency: { '4+': 20 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));

GW.item.addKind('GREATSWORD', new BeautyItem({
  name: 'greatsword', slot: 'melee', ch: '|', fg: '#ccd',
  stats: { attack: 4 }, frequency: { '5+': 10 },
  prefixes: WEAPON_PREFIXES, suffixes: WEARABLE_SUFFIXES,
}));



const ARMOR_PREFIXES = {
	"leather": 1,
	"iron": 2,
	"tempered": 3
};


GW.item.addKind('ARMOR', new BeautyItem({
  name: 'armor', slot: 'armor', ch: ']', fg: '#a62',
  stats: { defense: 2 }, frequency: 100,
  prefixes: ARMOR_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));


GW.item.addKind('HELMET', new BeautyItem({
  name: 'helmet', slot: 'helmet', ch: '^', fg: '#631',
  stats: { defense: 1 }, frequency: 50,
  prefixes: ARMOR_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));

const SHIELD_PREFIXES = {
	"small": -1,
	"large": 1,
	"tower": 2
};

GW.item.addKind('SHIELD', new BeautyItem({
  name: 'shield', slot: 'shield', ch: ')', fg: '#841',
  stats: { defense: 2 }, frequency: 50,
  prefixes: SHIELD_PREFIXES, suffixes: WEARABLE_SUFFIXES
}));


GW.color.addKind('health', '#e00');

GW.message.addKind('HEAL_NO_NEED', '§you§ §are§ at full #health#health##.');
GW.message.addKind('HEAL_PARTIAL', 'Some of §your§ #health#health## is refilled.');
GW.message.addKind('HEAL_FULL',    '§your§ #health#health## is completely refilled.');

GW.item.addKind('POTION_HEALTH', {
  name: 'health potion',
  ch: '!', fg: 'health',
  flags: 'IK_DESTROY_ON_USE',
  stats: { strength: 10 }, frequency: 100,
  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    if (actor.current.health >= actor.max.health) {
      GW.message.add('HEAL_NO_NEED', { actor, item });
      return false;
    }
    else {
      if (actor.current.health + item.stats.strength < actor.max.health) {
        GW.message.add('HEAL_PARTIAL', { actor, item });
      }
      else {
        GW.message.add('HEAL_FULL', { actor });
      }
      actor.adjustStat('health', item.stats.strength);
    }
    return true;
  }
});

GW.color.addKind('mana', '#84a');

GW.message.addKind('MANA_NO_NEED', '§you§ §do§ not need to recharge §your§ #mana#mana##.');
GW.message.addKind('MANA_PARTIAL', 'Some of §your§ #mana#mana## is refilled.');
GW.message.addKind('MANA_FULL',    '§your§ #mana#mana## is completely refilled.');

GW.item.addKind('POTION_MANA', {
  name: 'mana potion',
  ch: '!', fg: 'mana',
  flags: 'IK_DESTROY_ON_USE',
  stats: { strength: 10 }, frequency: 100,
  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    if (actor.current.mana >= actor.max.mana) {
      GW.message.add('MANA_NO_NEED', { actor, item });
      return false;
    }
    else {
      if (actor.current.mana + item.stats.strength < actor.max.mana) {
        GW.message.add('MANA_PARTIAL', { actor, item });
      }
      else {
        GW.message.add('MANA_FULL', { actor, item });
      }
      actor.adjustStat('mana', item.stats.strength);
    }
    return true;
  }
});

GW.message.addKind('LUTEFISK', '§you§ §eat§ §the item§ and §start actor§ to feel weird.');

GW.item.addKind('LUTEFISK', {
  name: 'lutefisk',
  ch: '?', fg: '#ff0',
  flags: 'IK_DESTROY_ON_USE',
  frequency: 25,
  use(item, actor, ctx={}) {
    if (!actor.isPlayer()) return false;
    GW.message.add('MSG_LUTEFISK', { actor, item });
    actor.adjustStat('health', actor.max.health);
    actor.adjustStat('mana', -actor.max.mana);
    return true;
  }
});

GW.message.addKind('GOLD_PICKUP', '§you§ §find§ §a item§.');

GW.item.addKind('GOLD', {
  name: 'gold coin', article: 'a',
  ch: '$', fg: 'gold',
  flags: 'IK_DESTROY_ON_USE',
  frequency: 100,
  use(item, actor, ctx={}) {
    actor.current.gold = 1 + (actor.current.gold || 0);
    GW.message.add('GOLD_PICKUP', { actor, item });
    // item.destroy();
    return true;
  }
});
