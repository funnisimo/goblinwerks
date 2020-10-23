
import { color as COLOR } from './color.js';
import { text as TEXT } from './text.js';
import * as Flags from './flags.js';
import * as GW from './gw.js';



class ItemKind {
  constructor(opts={}) {
		this.name = opts.name || 'item';
		this.flavor = opts.flavor || null;
    this.article = (opts.article === undefined) ? 'a' : opts.article;
		this.sprite = GW.make.sprite(opts.sprite);
    this.flags = Flags.ItemKind.toFlag(opts.flags);
		this.actionFlags = Flags.Action.toFlag(opts.flags);
		this.attackFlags = Flags.ItemAttack.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
		this.id = opts.id || null;
    this.slot = opts.slot || null;
    this.projectile = null;
    this.verb = opts.verb || null;

    if (opts.projectile) {
      this.projectile = GW.make.sprite(opts.projectile);
    }
    this.corpse = GW.make.tileEvent(opts.corpse);
    if (opts.consoleColor === false) {
      this.consoleColor = false;
    }
    else {
      this.consoleColor = opts.consoleColor || true;
      if (typeof this.consoleColor === 'string') {
        this.consoleColor = COLOR.from(this.consoleColor);
      }
    }
  }

  forbiddenTileFlags(item) { return Flags.Tile.T_OBSTRUCTS_ITEMS; }

  async applyDamage(item, damage, actor, ctx) {
		if (item.stats.health > 0) {
			const damageDone = Math.min(item.stats.health, damage);
			item.stats.health -= damageDone;
			if (item.stats.health <= 0) {
				item.flags |= Flags.Item.ITEM_DESTROYED;
			}
			return damageDone;
		}
		return 0;
	}

  getName(item, opts={}) {
    if (opts === true) { opts = { article: true }; }
    if (opts === false) { opts = {}; }
    if (typeof opts === 'string') { opts = { article: opts }; }

    let result = this.name;
    if (opts.color || (this.consoleColor && (opts.color !== false))) {
      let color = this.sprite.fg;
      if (this.consoleColor instanceof GW.types.Color) {
        color = this.consoleColor;
      }
      if (opts.color instanceof GW.types.Color) {
        color = opts.color;
      }
      result = TEXT.format('%R%s%R', color, this.name, null);
    }

    if (opts.article) {
      let article = (opts.article === true) ? this.article : opts.article;
      if (article == 'a' && TEXT.isVowel(TEXT.firstChar(result))) {
        article = 'an';
      }
      result = article + ' ' + result;
    }
    return result;
  }
}

GW.types.ItemKind = ItemKind;

function addItemKind(id, opts={}) {
	opts.id = id;
  let kind;
  if (opts instanceof GW.types.ItemKind) {
    kind = opts;
  }
  else {
    kind = new GW.types.ItemKind(opts);
  }
	GW.itemKinds[id] = kind;
	return kind;
}

GW.item.addKind = addItemKind;

function addItemKinds(opts={}) {
  Object.entries(opts).forEach( ([key, config]) => {
    GW.item.addKind(key, config);
  });
}

GW.item.addKinds = addItemKinds;


class Item {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
		this.kind = kind || null;
		this.stats = Object.assign({}, kind.stats);
	}

	hasKindFlag(flag) {
		return (this.kind.flags & flag) > 0;
	}

	hasActionFlag(flag) {
		return (this.kind.actionFlags & flag) > 0;
	}

	isDestroyed() { return this.flags & Flags.Item.ITEM_DESTROYED; }
  changed() { return false; } // ITEM_CHANGED

	getFlavor() { return this.kind.flavor || this.kind.getName(this, true); }
  getName(opts={}) {
    return this.kind.getName(this, opts);
  }
}

GW.types.Item = Item;

function makeItem(kind) {
	if (typeof kind === 'string') {
		const name = kind;
		kind = GW.itemKinds[name];
		if (!kind) {
      GW.utils.WARN('Unknown Item Kind: ' + name);
      return null;
    }
	}
	return new GW.types.Item(kind);
}

GW.make.item = makeItem;
