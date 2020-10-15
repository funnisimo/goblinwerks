
import { color as COLOR, colors as COLORS } from './color.js';
import * as Flags from './flags.js';
import { text as TEXT } from './text.js';
import { ai as AI } from './ai.js';
import { types, make, data as DATA, config as CONFIG, ui as UI, utils as UTILS, def } from './gw.js';

export var actor = {};
export var actorKinds = {};

actor.debug = UTILS.NOOP;




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
    this.corpse = make.tileEvent(opts.corpse);

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

  isPlayer() { return this === DATA.player; }
  isDead() { return this.current.health <= 0; }
  isInanimate() { return this.kind.flags & Flags.ActorKind.AK_INANIMATE; }

	async startTurn() {
		await actor.startTurn(this);
	}

	async act() {
		await actor.act(this);
	}

	endTurn(turnTime) {
		actor.endTurn(this, turnTime);
	}

	isOrWasVisible() {
		return true;
	}

  canPass(other) {
    return false;
  }

  avoidsCell(cell, x, y) {
    const avoidedCellFlags = this.avoidedCellFlags();
    const forbiddenTileFlags = this.forbiddenTileFlags();
    const avoidedTileFlags = this.avoidedTileFlags();

    if (cell.flags & avoidedCellFlags) return true;
    if (cell.hasTileFlag(forbiddenTileFlags | avoidedTileFlags)) return true;
    return false;
  }

  avoidedCellFlags() {
    return Flags.Cell.HAS_MONSTER | Flags.Cell.HAS_ITEM;
  }

  avoidedTileFlags() {
    return 0; // ???
  }

	forbiddenTileFlags() {
		return Flags.Tile.T_PATHING_BLOCKER;
	}

  fillCostGrid(map, grid) {
    const avoidedCellFlags = this.avoidedCellFlags();
    const forbiddenTileFlags = this.forbiddenTileFlags();
    const avoidedTileFlags = this.avoidedTileFlags();
    map.fillCostGrid(grid, (cell, x, y) => {
      if (cell.hasTileFlag(forbiddenTileFlags)) return def.PDS_FORBIDDEN;
      if (cell.hasTileFlag(avoidedTileFlags)) return def.PDS_AVOIDED;
      if (cell.flags & avoidedCellFlags) return def.PDS_AVOIDED;
      return 1;
    });
  }

  hasActionFlag(flag) {
    return this.kind.actionFlags & flag;
  }

  heal(amount=0) {
    this.current.health = Math.min(this.current.health + amount, this.max.health);
    this.changed(true);
  }

  applyDamage(amount, actor, ctx) {
    amount = Math.min(this.current.health, amount);
    this.prior.health = this.current.health;
    this.current.health -= amount;
    this.changed(true);
    return amount;
  }

	kill() {
		const map = DATA.map;
    this.current.health = 0;
		map.removeActor(this);
		// in the future do something here (HP = 0?  Flag?)
	}

  alwaysVisible() {
    return this.kind.flags & (Flags.ActorKind.AF_IMMOBILE | Flags.ActorKind.AF_INANIMATE);
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

  getAwarenessDistance(other) {
    return 20;  // ???
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

  calcBashDamage(item, ctx) {
    if (this.kind.calcBashDamage) return this.kind.calcBashDamage(this, item, ctx);
    return 1;
  }

  debug(...args) {
  	// if (this.flags & Flags.Actor.AF_DEBUG)
  	actor.debug(...args);
  }

}

types.Actor = Actor;


export function makeActor(kind) {
  if (typeof kind === 'string') {
    kind = actorKinds[kind];
  }
  else if (!(kind instanceof types.ActorKind)) {
    kind = new types.ActorKind(kind);
  }
  return new types.Actor(kind);
}

make.actor = makeActor;


// TODO - move back to game??
export async function takeTurn(theActor) {
  theActor.debug('actor turn...', DATA.time, theActor.id);
  if (theActor.isDead()) return 0;

	await theActor.startTurn();
	await theActor.act();
  return theActor.turnTime;	// actual or idle time
}

actor.takeTurn = takeTurn;


function startTurn(theActor) {
  // console.log('actor start turn - ', theActor.id);
}

actor.startTurn = startTurn;


async function act(theActor) {
  if (theActor.kind.ai) {
    for(let i = 0; i < theActor.kind.ai.length; ++i) {
      const ai = theActor.kind.ai[i];
      const fn = ai.act ? ai.act : ai;
      const success = await fn.call(ai, theActor);
      if (success) {
        // console.log(' - ai acted', theActor.id);
        return true;
      }
    }
  }
	theActor.endTurn();
	return true;
}

actor.act = act;

function endTurn(theActor, turnTime=1) {
	theActor.turnTime = Math.floor(theActor.kind.speed * turnTime);
	if (theActor.isOrWasVisible() && theActor.turnTime) {
		UI.requestUpdate();
	}
  // console.log(' - end turn - ', theActor.id);
}

actor.endTurn = endTurn;
