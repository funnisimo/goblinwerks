
import { color as COLOR, colors as COLORS } from './color.js';
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { text as TEXT } from './text.js';
import { visibility as VISIBILITY } from './visibility.js';
import { actions as Actions } from './actions/index.js';
import { types, make, data as DATA, config as CONFIG, ui as UI, def, ai as AI } from './gw.js';

export var actor = {};
export var actorKinds = {};

actor.debug = Utils.NOOP;




class ActorKind {
  constructor(opts={}) {
		this.name = opts.name || 'item';
		this.description = opts.description || opts.desc || '';
    this.article = (opts.article === undefined) ? 'a' : opts.article;
		this.sprite = make.sprite(opts.sprite);
    this.flags = Flags.ActorKind.toFlag(opts.flags);
		this.actionFlags = Flags.Action.toFlag(opts.flags);
		// this.attackFlags = Flags.Attack.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
		this.id = opts.id || null;
    this.bump = opts.bump || ['attack'];  // attack me by default if you bump into me

    if (typeof this.bump === 'string') {
      this.bump = this.bump.split(/[,|]/).map( (t) => t.trim() );
    }
    if (!Array.isArray(this.bump)) {
      this.bump = [this.bump];
    }

    this.corpse = opts.corpse ? make.tileEvent(opts.corpse) : null;
    this.blood = opts.blood ? make.tileEvent(opts.blood) : null;

    this.speed = opts.speed || CONFIG.defaultSpeed || 120;

    if (opts.consoleColor === false) {
      this.consoleColor = false;
    }
    else {
      this.consoleColor = opts.consoleColor || true;
      if (typeof this.consoleColor === 'string') {
        this.consoleColor = COLOR.from(this.consoleColor);
      }
    }

    this.attacks = opts.attacks || null;

    this.ai = null;
    if (opts.ai) {
      if (typeof opts.ai === 'function') {
        opts.ai = [opts.ai];
      }
      else if (typeof opts.ai === 'string') {
        opts.ai = opts.ai.split(/[,|]/).map( (t) => t.trim() );
      }

      this.ai = opts.ai.map( (v) => {
        if (typeof v === 'string') return AI[v];
        if (typeof v === 'function') return { act: v };
        return v;
      });
    }
    if (opts.sidebar) {
      this.sidebar = opts.sidebar.bind(this);
    }

  }

  // other is visible to player (invisible, in darkness, etc...) -- NOT LOS/FOV check
  canVisualize(actor, other, map) {
    return true;
  }

  isOrWasVisibleToPlayer(actor, map) {
    map = map || DATA.map;
		return map.isOrWasAnyKindOfVisible(actor.x, actor.y);
	}

  alwaysVisible(actor) {
    return this.flags & (Flags.ActorKind.AF_IMMOBILE | Flags.ActorKind.AF_INANIMATE);
  }

  avoidedCellFlags(actor) {
    return Flags.Cell.HAS_MONSTER | Flags.Cell.HAS_ITEM;
  }

  avoidedTileFlags(actor) {
    return 0; // ???
  }

	forbiddenTileFlags(actor) {
		return Flags.Tile.T_PATHING_BLOCKER;
	}

  canPass(actor, other) {
    return actor.isPlayer() == other.isPlayer();
  }

  calcBashDamage(actor, item, ctx) {
    return 1;
  }

  willAttack(actor, other, ctx) {
    return (actor.isPlayer() !== other.isPlayer());
  }

  applyDamage(actor, amount, source, ctx) {
    amount = Math.min(actor.current.health, amount);
    actor.prior.health = actor.current.health;
    actor.current.health -= amount;
    actor.changed(true);
    return amount;
  }

  heal(actor, amount=0) {
    const delta = Math.min(amount, actor.max.health - actor.current.health);
    actor.current.health += delta;
    actor.changed(true);
    return delta;
  }

  kill(actor) {
    actor.current.health = 0;
    if (actor.isPlayer()) {
      DATA.gameHasEnded = true;
    }
    // const map = DATA.map;
		// map.removeActor(this);
		// in the future do something here (HP = 0?  Flag?)
	}

  getAwarenessDistance(actor, other) {
    return 20;  // ???
  }

  getName(opts={}) {
    if (opts === true) { opts = { article: true }; }
    if (opts === false) { opts = {}; }
    if (typeof opts === 'string') { opts = { article: opts }; }

    let result = this.name;
    if (opts.color || (this.consoleColor && (opts.color !== false))) {
      let color = this.sprite.fg;
      if (this.consoleColor instanceof types.Color) {
        color = this.consoleColor;
      }
      if (opts.color instanceof types.Color) {
        color = opts.color;
      }
      result = TEXT.format('%R%s%R', color, this.name, null);
    }

    if (opts.article && (this.article !== false)) {
      let article = (opts.article === true) ? this.article : opts.article;
      if (article == 'a' && TEXT.isVowel(TEXT.firstChar(result))) {
        article = 'an';
      }
      result = article + ' ' + result;
    }
    return result;
  }
}

types.ActorKind = ActorKind;

function addActorKind(id, opts={}) {
	opts.id = id;
  let kind;
  if (opts instanceof types.ActorKind) {
    kind = opts;
  }
  else {
    kind = new types.ActorKind(opts);
  }
	actorKinds[id] = kind;
	return kind;
}

actor.addKind = addActorKind;

function addActorKinds(opts={}) {
  Object.entries(opts).forEach( ([key, config]) => {
    actor.addKind(key, config);
  });
}

actor.addKinds = addActorKinds;

let ACTOR_COUNT = 0;

export class Actor {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
    this.kind = kind || {};
    this.turnTime = 0;
		this.status = {};

    this.pack = null;
    this.slots = {};

    // stats
    this.current = { health: 1 };
    this.max = { health: 1 };
    this.prior = { health: 1 };

    if (this.kind.stats) {
      Object.assign(this.current, this.kind.stats);
      Object.assign(this.max, this.kind.stats);
      Object.assign(this.prior, this.kind.stats);
    }

    if (this.kind.ai) {
      this.kind.ai.forEach( (ai) => {
        if (ai.init) {
          ai.init(this);
        }
      });
    }

    this.id = ++ACTOR_COUNT;
  }

  turnEnded() { return this.flags & Flags.Actor.AF_TURN_ENDED; }

  isPlayer() { return this === DATA.player; }
  isDead() { return this.current.health <= 0; }
  isInanimate() { return this.kind.flags & Flags.ActorKind.AK_INANIMATE; }

	endTurn(turnTime) {
    if (this.kind.endTurn) {
      turnTime = this.kind.endTurn(this, turnTime) || turnTime;
    }
    actor.endTurn(this, turnTime);
	}

  canDirectlySee(other, map) {
    map = map || DATA.map;

    //
    if (!this.kind.canVisualize(this, other, map)) {
      return false;
    }

    if (this.isPlayer() || other.isPlayer()) {
      other = (this.isPlayer()) ? other : this;
      return map.isVisible(other.x, other.y);
    }
    else {
      let dist = Utils.distanceFromTo(this, other);
      if (dist < 2) return true;  // next to each other

      const grid = GRID.alloc(map.width, map.height);
      map.calcFov(grid, this.x, this.y, dist + 1);
      const result = grid[other.x][other.y];
      GRID.free(grid);
      return result;
    }
  }

  avoidsCell(cell, x, y) {
    const avoidedCellFlags = this.kind.avoidedCellFlags(this);
    const forbiddenTileFlags = this.kind.forbiddenTileFlags(this);
    const avoidedTileFlags = this.kind.avoidedTileFlags(this);

    if (cell.flags & avoidedCellFlags) return true;
    if (cell.hasTileFlag(forbiddenTileFlags | avoidedTileFlags)) return true;
    return false;
  }

  fillCostGrid(map, grid) {
    const avoidedCellFlags = this.kind.avoidedCellFlags(this);
    const forbiddenTileFlags = this.kind.forbiddenTileFlags(this);
    const avoidedTileFlags = this.kind.avoidedTileFlags(this);

    map.fillCostGrid(grid, (cell, x, y) => {
      if (cell.hasTileFlag(forbiddenTileFlags)) return def.PDS_FORBIDDEN;
      if (cell.hasTileFlag(avoidedTileFlags)) return def.PDS_AVOIDED;
      if (cell.flags & avoidedCellFlags) return def.PDS_AVOIDED;
      return 1;
    });
  }

  hasActionFlag(flag) {
    if (this.isPlayer()) return true; // Players can do everything
    return this.kind.actionFlags & flag;
  }

  changed(v) {
    if (v) {
      this.flags |= Flags.Actor.AF_CHANGED;
    }
    else if (v !== undefined) {
      this.flags &= ~Flags.Actor.AF_CHANGED;
    }
    return (this.flags & Flags.Actor.AF_CHANGED);
  }

  statChangePercent(name) {
    const current = this.current[name] || 0;
    const prior = this.prior[name] || 0;
    const max = Math.max(this.max[name] || 0, current, prior);

    return Math.floor(100 * (current - prior)/max);
  }

  getName(opts={}) {
    if (typeof opts === 'string') { opts = { article: opts }; }
    let base = this.kind.getName(opts);
    return base;
  }

  getVerb(verb) {
    if (this.isPlayer()) return verb;
    return TEXT.toSingular(verb);
  }

  getPronoun(pn) {
    if (this.isPlayer()) {
      return TEXT.playerPronoun[pn];
    }

    return TEXT.singularPronoun[pn];
  }

  debug(...args) {
  	// if (this.flags & Flags.Actor.AF_DEBUG)
  	actor.debug(...args);
  }

  // STATS

  adjustStat(stat, delta) {
    if (this.max[stat] === undefined) {
      this.max[stat] = Math.max(0, delta);
    }
    this.current[stat] = Utils.clamp((this.current[stat] || 0) + delta, 0, this.max[stat]);
    this.changed(true);
  }

  // INVENTORY

  addToPack(item) {
    let quantityLeft = (item.quantity || 1);
    // Stacking?
    if (item.kind.flags & Flags.ItemKind.IK_STACKABLE) {
      let current = this.pack;
      while(current && quantityLeft) {
        if (current.kind === item.kind) {
          quantityLeft -= item.quantity;
          current.quantity += item.quantity;
          item.quantity = 0;
          item.destroy();
        }
        current = current.next;
      }
      if (!quantityLeft) {
        return true;
      }
    }

    // Limits to inventory length?
    // if too many items - return false

    if (Utils.addToChain(this, 'pack', item)) {
      return true;
    }
    return false;
  }

  removeFromPack(item) {
    return Utils.removeFromChain(this, 'pack', item);
  }

  eachPack(fn) {
    Utils.eachChain(this.pack, fn);
  }

  // EQUIPMENT

  equip(item) {
    const slot = item.kind.slot;
    if (!slot) return false;
    if (this.slots[slot]) return false;
    this.slots[slot] = item;
    return true;
  }

  unequip(item) {
    const slot = item.kind.slot;
    if (this.slots[slot] === item) {
      this.slots[slot] = null;
      return true;
    }
    return false;
  }

  unequipSlot(slot) {
    const item = this.slots[slot] || null;
    this.slots[slot] = null;
    return item;
  }

  eachEquip(fn) {
    Object.values(this.slots).filter( (a) => a ).forEach( (o) => fn(o) );
  }

}

types.Actor = Actor;


export function makeActor(kind) {
  if (typeof kind === 'string') {
    kind = actorKinds[kind];
  }
  else if (!(kind instanceof types.Actor)) {
    let type = 'ActorKind';
    if (kind.type) {
      type = kind.type;
    }
    kind = new types[type](kind);
  }
  return new types.Actor(kind);
}

make.actor = makeActor;

export function startActorTurn(theActor) {
  theActor.flags &= ~Flags.Actor.AF_TURN_ENDED;
  theActor.turnTime = 0;
  Object.assign(theActor.prior, theActor.current);
}

actor.startTurn = startActorTurn;

function endActorTurn(theActor, turnTime=1) {
  theActor.flags |= Flags.Actor.AF_TURN_ENDED;
  theActor.turnTime = Math.floor(theActor.kind.speed * turnTime);
  if (theActor.isPlayer()) {
    VISIBILITY.update(DATA.map, theActor.x, theActor.y);
    UI.requestUpdate(48);
  }
  else if (theActor.kind.isOrWasVisibleToPlayer(theActor, DATA.map) && theActor.turnTime) {
    UI.requestUpdate();
  }
}

actor.endTurn = endActorTurn;

// TODO - move back to game??
export async function takeTurn(theActor) {
  theActor.debug('actor turn...', DATA.time, theActor.id);
  if (theActor.isDead() || DATA.gameHasEnded) return 0;

	await actor.startTurn(theActor);
  if (theActor.kind.ai) {
    for(let i = 0; i < theActor.kind.ai.length; ++i) {
      const ai = theActor.kind.ai[i];
      const fn = ai.act || ai.fn || ai;
      const success = await fn.call(ai, theActor);
      if (success) {
        // console.log(' - ai acted', theActor.id);
        break;
      }
    }
  }
	// theActor.endTurn();
  return theActor.turnTime;	// actual or idle time
}

actor.takeTurn = takeTurn;



export async function bump(actor, target, ctx) {
  if (!target) return false;

  const kind = actor.kind;
  const actorActions = target.bump || [];
  const kindActions  = target.kind.bump || [];

  const allBump = actorActions.concat(kindActions);

  for(let i = 0; i < allBump.length; ++i) {
    let bump = allBump[i];
    let result;
    if (typeof bump === 'string') {
      bump = kind[bump] || Actions[bump] || Utils.FALSE;
    }

    if (await bump(actor, target, ctx)) {
      return true;
    }
  }

  return false;
}

actor.bump = bump;
