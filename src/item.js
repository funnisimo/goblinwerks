
import { color as COLOR } from './color.js';
import { text as TEXT } from './text.js';
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { actions as Actions } from './actions/index.js';
import * as GW from './gw.js';



class ItemKind {
  constructor(opts={}) {
    Object.assign(this, opts);
		this.name = opts.name || 'item';
		this.flavor = opts.flavor || null;
    this.article = (opts.article === undefined) ? 'a' : opts.article;
		this.sprite = GW.make.sprite(opts.sprite || opts);
    this.flags = Flags.ItemKind.toFlag(opts.flags);
		this.actionFlags = Flags.Action.toFlag(opts.flags);
		this.attackFlags = Flags.ItemAttack.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
		this.id = opts.id || null;
    this.slot = opts.slot || null;
    this.projectile = null;
    this.verb = opts.verb || null;

    this.bump = opts.bump || ['pickup'];  // pick me up by default if you bump into me

    if (typeof this.bump === 'string') {
      this.bump = this.bump.split(/[,|]/).map( (t) => t.trim() );
    }
    if (!Array.isArray(this.bump)) {
      this.bump = [this.bump];
    }

    if (opts.projectile) {
      this.projectile = GW.make.sprite(opts.projectile);
    }
    this.corpse = opts.corpse ? GW.make.tileEvent(opts.corpse) : null;

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

    let result = item.name || this.name;
    if (opts.color || (this.consoleColor && (opts.color !== false))) {
      let color = this.sprite.fg;
      if (this.consoleColor instanceof GW.types.Color) {
        color = this.consoleColor;
      }
      if (opts.color instanceof GW.types.Color) {
        color = opts.color;
      }
      result = TEXT.format('%R%s%R', color, result, null);
    }
    else if (opts.color === false) {
      result = TEXT.removeColors(result); // In case item has built in color
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
	constructor(kind, opts={}) {
    // Object.assign(this, opts);
		this.x = -1;
    this.y = -1;
    this.quantity = opts.quantity || 1;
    this.flags = Flags.Item.toFlag(opts.flags);
		this.kind = kind || null;
		this.stats = Object.assign({}, kind.stats);
    if (opts.stats) {
      Object.assign(this.stats, opts.stats);
    }

    if (this.kind.make) {
      this.kind.make(this, opts);
    }
	}

	hasKindFlag(flag) {
		return (this.kind.flags & flag) > 0;
	}

	hasActionFlag(flag) {
		return (this.kind.actionFlags & flag) > 0;
	}

  destroy() { this.flags |= (Flags.Item.ITEM_DESTROYED | Flags.Item.ITEM_CHANGED); }
	isDestroyed() { return this.flags & Flags.Item.ITEM_DESTROYED; }
  changed(v) {
    if (v) {
      this.flags |= Flags.Item.ITEM_CHANGED;
    }
    else if (v !== undefined) {
      this.flags &= ~(Flags.Item.ITEM_CHANGED);
    }
    return (this.flags & Flags.Item.ITEM_CHANGED);
  }

	getFlavor() { return this.kind.flavor || this.kind.getName(this, true); }
  getName(opts={}) {
    return this.kind.getName(this, opts);
  }
}

GW.types.Item = Item;

function makeItem(kind, opts) {
	if (typeof kind === 'string') {
		const name = kind;
		kind = GW.itemKinds[name];
		if (!kind) {
      Utils.WARN('Unknown Item Kind: ' + name);
      return null;
    }
	}
	const item = new GW.types.Item(kind, opts);
  return item;
}

GW.make.item = makeItem;

export async function bump(actor, item, ctx={}) {

  if (!item) return false;

  ctx.quiet = true;

  if (item.bump) {
    for(let i = 0; i < item.bump.length; ++i) {
      let fn = item.bump[i];
      let result;
      if (typeof fn === 'string') {
        fn = Actions[fn] || Utils.FALSE;
      }

      if (await fn(actor, item, ctx)) {
        ctx.quiet = false;
        return true;
      }
    }
  }

  if (item.kind && item.kind.bump) {
    for(let i = 0; i < item.kind.bump.length; ++i) {
      let fn = item.kind.bump[i];
      let result;
      if (typeof fn === 'string') {
        fn = Actions[fn] || Utils.FALSE;
      }

      if (await fn(actor, item, ctx)) {
        ctx.quiet = false;
        return true;
      }
    }
  }

  return false;
}

GW.item.bump = bump;
