
import * as Color from './color.js';
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { random } from './random.js';
import * as Grid from './grid.js';
import * as Frequency from './frequency.js';
import * as Text from './text.js';
import * as Path from './path.js';
import * as Visibility from './visibility.js';
import { actions as Actions } from './actions/index.js';
import { types, make, data as DATA, config as CONFIG, ui as UI, def, ai as AI, colors as COLORS } from './gw.js';

export var actor = {};
export var actorKinds = {};

actor.debug = Utils.NOOP;




class ActorKind {
  constructor(opts={}) {
		this.name = opts.name || 'item';
		this.description = opts.description || opts.desc || '';
    this.article = (opts.article === undefined) ? 'a' : opts.article;
		this.sprite = make.sprite(opts.sprite || opts);
    this.flags = Flags.ActorKind.toFlag(opts.flags);
		this.actionFlags = Flags.Action.toFlag(opts.flags);
		// this.attackFlags = Flags.Attack.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
    this.regen = Object.assign({}, opts.regen || {});
		this.id = opts.id || null;
    this.bump = opts.bump || ['attack'];  // attack me by default if you bump into me
    this.frequency = make.frequency(opts.frequency || this.stats.frequency);

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
        this.consoleColor = Color.from(this.consoleColor);
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
    if (opts.calcEquipmentBonuses) {
      this.calcEquipmentBonuses = opts.calcEquipmentBonuses.bind(this);
    }

  }

  make(actor, opts) {}

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

  forbiddenCellFlags(actor) {
		return Flags.Cell.HAS_ACTOR;
	}

	forbiddenTileFlags(actor) {
		return Flags.Tile.T_PATHING_BLOCKER;
	}

  forbiddenTileMechFlags(actor) {
    return 0;
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

  getName(actor, opts={}) {
    if (opts === true) { opts = { article: true }; }
    if (opts === false) { opts = {}; }
    if (typeof opts === 'string') { opts = { article: opts }; }

    let result = actor.name || this.name;
    if (!opts.formal && actor.isPlayer()) {
      result = 'you';
    }
    if (opts.color || (this.consoleColor && (opts.color !== false))) {
      let color = this.sprite.fg;
      if (this.consoleColor instanceof types.Color) {
        color = this.consoleColor;
      }
      if (opts.color instanceof types.Color) {
        color = opts.color;
      }
      else if (typeof opts.color === 'string') {
        color = Color.from(opts.color);
      }
      if (color) {
        result = Text.apply('#color#$result$##', { color, result });
      }
    }

    if (opts.article && (this.article !== false)) {
      if (opts.formal || !actor.isPlayer()) {
        let article = (opts.article === true) ? this.article : opts.article;
        if (article == 'a' && Text.isVowel(Text.firstChar(result))) {
          article = 'an';
        }
        result = article + ' ' + result;
      }
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
	constructor(kind, opts={}) {
		this.x = -1;
    this.y = -1;
    this.flags = Flags.Actor.toFlag(opts.flags);
    this.kind = kind || {};
    this.turnTime = 0;
		this.status = {};
    this.name = opts.name || null;

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
    if (opts.stats) {
      Object.assign(this.current, opts.stats);
    }

    this.regen = { health: 0 };
    if (this.kind.regen) {
      Object.assign(this.regen, this.kind.regen);
    }
    if (opts.regen) {
      Object.assign(this.regen, opts.regen);
    }

    if (this.kind.ai) {
      this.kind.ai.forEach( (ai) => {
        const fn = ai.act || ai.fn || ai;
        if (typeof fn !== 'function') {
          Utils.ERROR('Invalid AI - must be function, or object with function for act or fn member.');
        }
        if (ai.init) {
          ai.init(this);
        }
      });
    }

    this.id = ++ACTOR_COUNT;

    if (opts.female) {
      this.flags &= ~Flags.Actor.AF_MALE;
      this.flags |= Flags.Actor.AF_FEMALE;
    }
    else if (opts.male) {
      this.flags &= ~Flags.Actor.AF_FEMALE;
      this.flags |= Flags.Actor.AF_MALE;
    }
    else if (this.hasAllFlags(Flags.Actor.AF_MALE | Flags.Actor.AF_FEMALE)) {
      const remove = random.chance(50) ? Flags.Actor.AF_MALE : Flags.Actor.AF_FEMALE;
      this.flags &= ~remove;
    }

    this.kind.make(this, opts);
    if (this.kind.calcEquipmentBonuses) {
      this.kind.calcEquipmentBonuses(this);
    }
  }

  turnEnded() { return this.flags & Flags.Actor.AF_TURN_ENDED; }

  isPlayer() { return this === DATA.player; }
  isDead() { return (this.current.health <= 0) || (this.flags & Flags.Actor.AF_DYING); }
  isInanimate() { return this.kind.flags & Flags.ActorKind.AK_INANIMATE; }
  isInvulnerable() { return this.kind.flags & Flags.ActorKind.AK_INVULNERABLE; }

  isFemale() { return this.flags & Flags.Actor.AF_FEMALE; }
  isMale() { return this.flags & Flags.Actor.AF_MALE; }

  hasAllFlags(flags) {
    return (this.flags & flags) === flags;
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

  async bumpBy(actor, ctx) {

    if (this.kind.bump && typeof this.kind.bump === 'function') {
      return this.kind.bump(actor, this, ctx);
    }

    const kind = this.kind;
    const actorActions = this.bump || [];
    const kindActions  = this.kind.bump || [];

    const allBump = actorActions.concat(kindActions);

    for(let i = 0; i < allBump.length; ++i) {
      let bumpFn = allBump[i];
      let result;
      if (typeof bumpFn === 'string') {
        bumpFn = Actions[bumpFn] || kind[bumpFn] || Utils.FALSE;
      }

      if (await bumpFn(actor, this, ctx) !== false) {
        return true;
      }
    }

    return false;
  }

	endTurn(turnTime) {
    if (this.kind.endTurn) {
      turnTime = this.kind.endTurn(this, turnTime) || turnTime;
    }
    actor.endTurn(this, turnTime);
	}

  kill() {
    this.flags |= Flags.Actor.AF_DYING;
    this.changed(true);
    if (this.mapToMe) {
      Grid.free(this.mapToMe);
      this.mapToMe = null;
    }
    if (this.travelGrid) {
      Grid.free(this.travelGrid);
      this.travelGrid = null;
    }
  }

  // MOVEMENT/VISION

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

      const grid = Grid.alloc(map.width, map.height);
      map.calcFov(grid, this.x, this.y, dist + 1);
      const result = grid[other.x][other.y];
      Grid.free(grid);
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
      if (this.isPlayer() && !cell.isRevealed()) return def.PDS_OBSTRUCTION;
      if (cell.hasTileFlag(forbiddenTileFlags)) return def.PDS_FORBIDDEN;
      if (cell.hasTileFlag(avoidedTileFlags)) return def.PDS_AVOIDED;
      if (cell.flags & avoidedCellFlags) return def.PDS_AVOIDED;
      return 1;
    });
  }

  updateMapToMe() {
    const map = DATA.map;
    let mapToMe = this.mapToMe;
    if (!mapToMe) {
      mapToMe = this.mapToMe = Grid.alloc(map.width, map.height);
      mapToMe.x = mapToMe.y = -1;
    }
    if (mapToMe.x != this.x || mapToMe.y != this.y) {
      const costGrid = Grid.alloc(map.width, map.height);
      this.fillCostGrid(map, costGrid);
      Path.calculateDistances(mapToMe, this.x, this.y, costGrid, true);
      Grid.free(costGrid);
    }
    return mapToMe;
  }


  // combat helpers
  calcDamageTo(defender, attackInfo, ctx) {
    let damage = attackInfo.damage;
    if (typeof damage === 'function') {
      damage = damage(this, defender, attackInfo, ctx) || 1;
    }
    return damage;
  }

  // Descriptions

  getName(opts={}) {
    if (typeof opts === 'string') { opts = { article: opts }; }
    let base = this.kind.getName(this, opts);
    return base;
  }

  getVerb(verb) {
    if (this.isPlayer()) return verb;
    return Text.toSingularVerb(verb);
  }

  getPronoun(pn) {
    if (this.isPlayer()) {
      return Text.playerPronoun[pn];
    }

    return Text.singularPronoun[pn];
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

  statChangePercent(name) {
    const current = this.current[name] || 0;
    const prior = this.prior[name] || 0;
    const max = Math.max(this.max[name] || 0, current, prior);

    return Math.floor(100 * (current - prior)/max);
  }

  initStat(stat, value) {
    this.max[stat] = this.current[stat] = this.prior[stat] = value;
  }

  // INVENTORY

  addToPack(item) {
    let quantityLeft = (item.quantity || 1);
    // Stacking?
    if (item.isStackable()) {
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

  itemWillFitInPack(item, quantity) {
    if (!this.pack) return true;
    const maxSize = GW.config.PACK_MAX_ITEMS || 26;

    const count = Utils.chainLength(this.pack);
    if (count < maxSize) return true;

    if (!item.isStackable()) return false;
    let willStack = false;
    Utils.eachChain(this.pack, (packItem) => {
      if (item.willStackInto(packItem, quantity)) {
        willStack = true;
      }
    });

    return willStack;
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


export function makeActor(kind, opts) {
  if (typeof kind === 'string') {
    kind = actorKinds[kind];
  }
  else if (!(kind instanceof types.ActorKind)) {
    let type = 'ActorKind';
    if (kind.type) {
      type = kind.type;
    }
    kind = new types[type](kind, opts);
  }
  return new types.Actor(kind, opts);
}

make.actor = makeActor;

export function startActorTurn(theActor) {
  theActor.flags &= ~Flags.Actor.AF_TURN_ENDED;
  theActor.turnTime = 0;
  Object.assign(theActor.prior, theActor.current);
}

actor.startTurn = startActorTurn;

function endActorTurn(theActor, turnTime=1) {
  if (theActor.turnEnded()) return;

  theActor.flags |= Flags.Actor.AF_TURN_ENDED;
  theActor.turnTime = Math.floor(theActor.kind.speed * turnTime);

  if (!theActor.isDead()) {
    for(let stat in theActor.regen) {
      const turns = theActor.regen[stat];
      if (turns > 0) {
        const amt = 1/turns;
        theActor.adjustStat(stat, amt);
      }
    }
  }

  if (theActor.isPlayer()) {
    Visibility.update(DATA.map, theActor.x, theActor.y);
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





function chooseKinds(opts={}) {
  opts.danger = opts.danger || 1;
  if (opts.kinds) {
    return opts.kinds.map( (a) => {
      if (typeof a === 'string') return GW.actorKinds[a];
      return a;
    });
  }

  let count = opts.count || 0;
  if (opts.tries && opts.chance) {
    for(let i = 0; i < opts.tries; ++i) {
      if (random.chance(opts.chance)) {
        ++count;
      }
    }
  }
  else if (opts.chance < 100) {
    while(random.chance(opts.chance)) {
      ++count;
    }
  }
  if (!count) {
    Utils.WARN('Tried to place 0 actors.');
    return [];
  }

  let choices = opts.choices;
  // TODO - allow ['THING'] and { THING: 20 }
  if (!choices) {
    let matchKindFn = opts.matchKindFn || Utils.TRUE;
    choices = Object.values(GW.actorKinds).filter(matchKindFn);
  }

  let frequencies;
  if (Array.isArray(choices)) {
    choices = choices.map( (v) => {
      if (typeof v === 'string') return actorKinds[v];
      return v;
    });
    frequencies = choices.map( (k) => Frequency.forDanger(k.frequency, opts.danger) );
  }
  else {
    // { THING: 20, OTHER: 10 }
    choices = Object.keys(choices).map( (v) => actorKinds[v] );
    frequencies = Object.values(choices);
  }

  if (!choices.length) {
    Utils.WARN('Tried to place actors - 0 qualifying kinds to choose from.');
    return [];
  }

  const kinds = [];
  for(let i = 0; i < count; ++i) {
    const index = random.lottery(frequencies);
    kinds.push(choices[index]);
  }

  return kinds;
}


export function generateAndPlace(map, opts={}) {
  if (typeof opts === 'number') { opts = { tries: opts }; }
  if (Array.isArray(opts)) { opts = { kinds: opts }; }
  Utils.setDefaults(opts, {
    tries: 0,
    count: 0,
    chance: 100,
    outOfBandChance: 0,
    matchKindFn: null,
    allowHallways: false,
    avoid: 'start',
    locTries: 500,
    choices: null,
    kinds: null,
    makeOpts: null,
  });

  let danger = opts.danger || map.config.danger || 1;
  while (random.chance(opts.outOfBandChance)) {
    ++danger;
  }
  opts.danger = danger;

  const kinds = chooseKinds(opts);

  const blocked = Grid.alloc(map.width, map.height);
  // TODO - allow [x,y] in addition to 'name'
  if (opts.avoid && map.locations[opts.avoid]) {
    const loc = map.locations[opts.avoid];
    map.calcFov(blocked, loc[0], loc[1], 20);
  }

  let placed = 0;

  const makeOpts = Object.assign({ danger }, opts.makeOpts || {});

  const matchOpts = {
    allowHallways: opts.allowHallways,
    blockingMap: blocked,
    allowLiquid: false,
    forbidCellFlags: 0,
    forbidTileFlags: 0,
    forbidTileMechFlags: 0,
    tries: opts.locTries,
  };

  for(let i = 0; i < kinds.length; ++i) {
    const kind = kinds[i];
    const actor = make.actor(kind, makeOpts);

    matchOpts.forbidCellFlags = kind.forbiddenCellFlags(actor);
    matchOpts.forbidTileFlags = kind.forbiddenTileFlags(actor);
    matchOpts.forbidTileMechFlags = kind.forbiddenTileMechFlags(actor);

    const loc = map.randomMatchingXY(matchOpts);
    if (loc && loc[0] > 0) {
      map.addActor(loc[0], loc[1], actor);
      ++placed;
    }
  }

  Grid.free(blocked);
  return placed;
}

actor.generateAndPlace = generateAndPlace;
