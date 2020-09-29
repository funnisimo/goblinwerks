
import * as GW from './gw.js';

const Fl = GW.flag.fl;


export const ActionFlags = GW.flag.install('action', {
	A_USE			: Fl(0),
	A_EQUIP		: Fl(1),
	A_PUSH		: Fl(2),
	A_RENAME	: Fl(3),
	A_ENCHANT	: Fl(4),
	A_THROW		: Fl(5),
	A_SPECIAL	: Fl(6),

	A_PULL		: Fl(7),
	A_SLIDE		: Fl(8),

	A_NO_PICKUP		: Fl(9),
	A_NO_DESTROY	: Fl(10),

	A_GRABBABLE : 'A_PUSH, A_PULL, A_SLIDE',
});


export const KindFlags = GW.flag.install('itemKind', {
	IK_ENCHANT_SPECIALIST 	: Fl(0),
	IK_HIDE_FLAVOR_DETAILS	: Fl(1),

	IK_AUTO_TARGET					: Fl(2),

	IK_HALF_STACK_STOLEN		: Fl(3),
	IK_ENCHANT_USES_STR 		: Fl(4),

	IK_ARTICLE_THE					: Fl(5),
	IK_NO_ARTICLE						: Fl(6),
	IK_PRENAMED	  					: Fl(7),

	IK_BREAKS_ON_FALL				: Fl(8),
	IK_DESTROY_ON_USE				: Fl(9),
	IK_FLAMMABLE						: Fl(10),

  IK_ALWAYS_IDENTIFIED  	: Fl(11),
	IK_IDENTIFY_BY_KIND			: Fl(12),
	IK_CURSED								: Fl(13),

	IK_BLOCKS_MOVE					: Fl(14),
	IK_BLOCKS_VISION				: Fl(15),

	IK_PLACE_ANYWHERE				: Fl(16),
	IK_KIND_AUTO_ID       	: Fl(17),	// the item type will become known when the item is picked up.
	IK_PLAYER_AVOIDS				: Fl(18),	// explore and travel will try to avoid picking the item up

	IK_TWO_HANDED						: Fl(19),
	IK_NAME_PLURAL					: Fl(20),

	IK_STACKABLE						: Fl(21),
	IK_STACK_SMALL					: Fl(22),
	IK_STACK_LARGE					: Fl(23),
	IK_SLOW_RECHARGE				: Fl(24),

	IK_CAN_BE_SWAPPED      	: Fl(25),
	IK_CAN_BE_RUNIC					: Fl(26),
	IK_CAN_BE_DETECTED		  : Fl(27),

	IK_TREASURE							: Fl(28),
	IK_INTERRUPT_EXPLORATION_WHEN_SEEN:	Fl(29),
});
//
//
// class ItemCategory {
// 	constructor() {
// 		this.name = '';
// 		this.flags = 0;
// 	}
// }
//
// GW.types.ItemCategory = ItemCategory;
//
//
// function installItemCategory() {
//
// }
//
// GW.item.installCategory = installItemCategory;


export const AttackFlags = GW.flag.install('itemAttack', {
	IA_MELEE:		Fl(0),
	IA_THROWN:	Fl(1),
	IA_RANGED:	Fl(2),
	IA_AMMO:		Fl(3),

	IA_RANGE_5:				Fl(5),	// Could move this to range field of kind
	IA_RANGE_10:			Fl(6),
	IA_RANGE_15:			Fl(7),
	IA_CAN_LONG_SHOT:	Fl(8),

	IA_ATTACKS_SLOWLY				: Fl(10),	// mace, hammer
	IA_ATTACKS_QUICKLY    	: Fl(11),   // rapier

	IA_HITS_STAGGER					: Fl(15),		// mace, hammer
	IA_EXPLODES_ON_IMPACT		: Fl(16),

  IA_ATTACKS_EXTEND     	: Fl(20),   // whip???
	IA_ATTACKS_PENETRATE		: Fl(21),		// spear, pike	???
	IA_ATTACKS_ALL_ADJACENT : Fl(22),		// whirlwind
  IA_LUNGE_ATTACKS      	: Fl(23),   // rapier
	IA_PASS_ATTACKS       	: Fl(24),   // flail	???
  IA_SNEAK_ATTACK_BONUS 	: Fl(25),   // dagger
	IA_ATTACKS_WIDE					: Fl(26),		// axe

});


export const Flags = GW.flag.install('item', {
	ITEM_IDENTIFIED			: Fl(0),
	ITEM_EQUIPPED				: Fl(1),
	ITEM_CURSED					: Fl(2),
	ITEM_PROTECTED			: Fl(3),
	ITEM_INDESTRUCTABLE	: Fl(4),		// Cannot die - even if falls into T_LAVA_INSTA_DEATH
	ITEM_RUNIC					: Fl(5),
	ITEM_RUNIC_HINTED		: Fl(6),
	ITEM_RUNIC_IDENTIFIED		: Fl(7),
	ITEM_CAN_BE_IDENTIFIED	: Fl(8),
	ITEM_PREPLACED					: Fl(9),
	ITEM_MAGIC_DETECTED			: Fl(11),
	ITEM_MAX_CHARGES_KNOWN	: Fl(12),
	ITEM_IS_KEY							: Fl(13),


	ITEM_DESTROYED					: Fl(30),
});



class ItemKind {
  constructor(opts={}) {
		this.name = opts.name || 'item';
		this.description = opts.description || opts.desc || '';
		this.sprite = GW.make.sprite(opts.sprite);
    this.flags = KindFlags.toFlag(opts.flags);
		this.actionFlags = ActionFlags.toFlag(opts.flags);
		this.attackFlags = AttackFlags.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
  }
}

GW.types.ItemKind = ItemKind;

function installItemKind(name, opts={}) {
	const kind = new GW.types.ItemKind(opts);
	GW.itemKinds[name] = kind;
	return kind;
}

GW.item.installKind = installItemKind;


class Item {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
		this.kind = kind || null;
		this.stats = Object.assign({}, kind.stats);
	}

	async applyDamage(ctx) {
		if (this.kind.actionFlags & ActionFlags.A_NO_DESTROY) return false;
		if (this.stats.health) {
			ctx.damageDone = Math.max(this.stats.health, ctx.damage);
			this.stats.health -= ctx.damageDone;
			if (this.stats.health <= 0) {
				this.flags |= Flags.ITEM_DESTROYED;
			}
			return true;
		}
		return false;
	}

	isDestroyed() { return this.flags & Flags.ITEM_DESTROYED; }
}

GW.types.Item = Item;

function makeItem(kind) {
	if (typeof kind === 'string') {
		const name = kind;
		kind = GW.itemKinds[name];
		if (!kind) GW.utils.ERROR('Unknown Item Kind: ' + name);
	}
	return new GW.types.Item(kind);
}

GW.make.item = makeItem;
