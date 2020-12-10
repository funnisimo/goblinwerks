'use strict';

var def = {};
var types = {};

var colors = {};
var sprites = {};

var make = {};
var install = {};

var ui = {};
var message = {};
var viewport = {};
var flavor = {};
var sidebar = {};

var commands$1 = {};
var ai = {};

var itemKinds = {};
var item$1 = {};

var flag = {};
var flags = {};

var tiles = {};
var tileEvents$1 = {};

var messages = {};

var config = {
  fx: {},
};
var data = {};
var maps = {};
var lights = {};

// DIRS are organized clockwise
// - first 4 are arrow directions
//   >> rotate 90 degrees clockwise ==>> newIndex = (oldIndex + 1) % 4
//   >> opposite direction ==>> oppIndex = (index + 2) % 4
// - last 4 are diagonals
//   >> rotate 90 degrees clockwise ==>> newIndex = 4 + (oldIndex + 1) % 4;
//   >> opposite diagonal ==>> newIndex = 4 + (index + 2) % 4;
def.dirs      = [[0,1], [1,0], [0,-1], [-1,0], [1, 1], [ 1,-1], [-1,-1], [-1,1]];

// CLOCK DIRS are organized clockwise, starting at UP
// >> opposite = (index + 4) % 8
// >> 90 degrees rotate right = (index + 2) % 8
// >> 90 degrees rotate left = (8 + index - 2) % 8
def.clockDirs = [[0,1], [1,1], [1, 0], [1,-1], [0,-1], [-1,-1], [-1, 0], [-1,1]];

def.NO_DIRECTION = -1;
def.UP = 0;
def.RIGHT = 1;
def.DOWN = 2;
def.LEFT = 3;
def.RIGHT_UP = 4;
def.RIGHT_DOWN = 5;
def.LEFT_DOWN = 6;
def.LEFT_UP = 7;

def.layer = {
  GROUND: 0,
  LIQUID: 1,
  SURFACE: 2,
  GAS: 3,
  ITEM: 4,
  ACTOR: 5,
  PLAYER: 6,
  FX: 7,
  UI: 8,
};

Object.assign(def, def.layer);

class Bounds {
  constructor(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = w || 0;
    this.height = h || 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  containsXY(x, y) {
    return this.width > 0
      && this.x <= x
      && this.y <= y
      && this.x + this.width > x
      && this.y + this.height > y;
  }

  get right() { return this.x + this.width - 1; }
  get bottom() { return this.y + this.height -1; }

  centerX() { return Math.round(this.width / 2) + this.x; }
  centerY() { return Math.round(this.height / 2) + this.y; }

  toInnerX(x) { return x - this.x + this.offsetX; }
  toInnerY(y) { return y - this.y + this.offsetY; }

  toOuterX(x) {
    let offset = 0;
    if (x < 0) { offset = this.width - 1; }
    return x + this.x + offset - this.offsetX;
  }
  toOuterY(y) {
    let offset = 0;
    if (y < 0) { offset = this.height - 1; }
    return y + this.y + offset - this.offsetY;
  }
}

types.Bounds = Bounds;

function make$1(x, y, w, h) {
  return new types.Bounds(x, y, w, h);
}

make.bounds = make$1;

/**
 * GW.utils
 * @module utils
 */


var makeDebug = (typeof debug !== 'undefined') ? debug : (() => (() => {}));

function NOOP()  {}
function TRUE()  { return true; }
function FALSE() { return false; }
function ONE() { return 1; }
function ZERO() { return 0; }
function IDENTITY(x) { return x; }

/**
 * clamps a value between min and max (inclusive)
 * @param v {Number} the value to clamp
 * @param min {Number} the minimum value
 * @param max {Number} the maximum value
 * @returns {Number} the clamped value
 */
function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function x(src) {
  return src.x || src[0] || 0;
}

function y(src) {
  return src.y || src[1] || 0;
}

function copyXY(dest, src) {
  dest.x = x(src);
  dest.y = y(src);
}

function addXY(dest, src) {
  dest.x += x(src);
  dest.y += y(src);
}

function equalsXY(dest, src) {
  return (dest.x == x(src))
  && (dest.y == y(src));
}

function lerpXY(a, b, pct) {
	if (pct > 1) { pct = pct / 100; }
  pct = clamp(pct, 0, 1);
  const dx = x(b) - x(a);
  const dy = y(b) - y(a);
  const x2 = x(a) + Math.floor(dx * pct);
  const y2 = y(a) + Math.floor(dy * pct);
  return [x2, y2];
}


function distanceBetween(x1, y1, x2, y2) {
  const x = Math.abs(x1 - x2);
  const y = Math.abs(y1 - y2);
  const min = Math.min(x, y);
  return x + y - (0.6 * min);
}

function distanceFromTo(a, b) {
  return distanceBetween(x(a), y(a), x(b), y(b));
}

function calcRadius(x, y) {
  return distanceBetween(0,0, x, y);
}

function dirBetween(x, y, toX, toY) {
	let diffX = toX - x;
	let diffY = toY - y;
	if (diffX && diffY) {
		const absX = Math.abs(diffX);
		const absY = Math.abs(diffY);
		if (absX >= 2 * absY) { diffY = 0; }
		else if (absY >= 2 * absX) { diffX = 0; }
	}
	return [Math.sign(diffX), Math.sign(diffY)];
}

function dirFromTo(a, b) {
  return dirBetween(x(a), y(a), x(b), y(b));
}

function dirIndex(dir) {
  const x = dir.x || dir[0] || 0;
  const y = dir.y || dir[1] || 0;
  return def.dirs.findIndex( (a) => a[0] == x && a[1] == y );
}

function isOppositeDir(a, b) {
  if (a[0] + b[0] != 0) return false;
  if (a[1] + b[1] != 0) return false;
  return true;
}

function isSameDir(a, b) {
  return a[0] == b[0] && a[1] == b[1];
}

function dirSpread(dir) {
  const result = [dir];
  if (dir[0] == 0) {
    result.push( [ 1, dir[1]] );
    result.push( [-1, dir[1]] );
  }
  else if (dir[1] == 0) {
    result.push( [dir[0], 1] );
    result.push( [dir[0],-1] );
  }
  else {
    result.push( [dir[0], 0] );
    result.push( [0, dir[1]] );
  }
  return result;
}

function stepFromTo(a, b, fn) {
  const diff = [x(b) - x(a), y(b) - y(a)];
  const steps = Math.abs(diff[0]) + Math.abs(diff[1]);
  const c = [0, 0];
  const last = [99999, 99999];

  for(let step = 0; step <= steps; ++step) {
    c[0] = a[0] + Math.floor(diff[0] * step / steps);
    c[1] = a[1] + Math.floor(diff[1] * step / steps);
    if (c[0] != last[0] || c[1] != last[1]) {
      fn(c[0], c[1]);
    }
    last[0] = c[0];
    last[1] = c[1];
  }
}


// Draws the smooth gradient that appears on a button when you hover over or depress it.
// Returns the percentage by which the current tile should be averaged toward a hilite color.
function smoothHiliteGradient(currentXValue, maxXValue) {
    return Math.floor(100 * Math.sin(Math.PI * currentXValue / (maxXValue)));
}




function extend(obj, name, fn) {
  const base = obj[name] || NOOP;
  const newFn = fn.bind(obj, base.bind(obj));
  newFn.fn = fn;
  newFn.base = base;
  obj[name] = newFn;
}

// export function rebase(obj, name, newBase) {
//   const fns = [];
//   let fn = obj[name];

//   while(fn && fn.fn) {
//     fns.push(fn.fn);
//     fn = fn.base;
//   }

//   obj[name] = newBase;

//   while(fns.length) {
//     fn = fns.pop();
//     extend(obj, name, fn);
//   }
// }

function cloneObject(obj) {
  const other = Object.create(obj.__proto__);
  assignObject(other, obj);
  return other;
}

function assignField(dest, src, key) {
  const current = dest[key];
  const updated = src[key];
  if (current && current.copy && updated) {
    current.copy(updated);
  }
  else if (current && current.clear && !updated) {
    current.clear();
  }
  else if (current && current.nullify && !updated) {
    current.nullify();
  }
  else if (updated && updated.clone) {
    dest[key] = updated.clone();	// just use same object (shallow copy)
  }
  else if (updated && Array.isArray(updated)) {
    dest[key] = updated.slice();
  }
  else if (current && Array.isArray(current)) {
    current.length = 0;
  }
  else {
    dest[key] = updated;
  }
}

function copyObject(dest, src) {
  Object.keys(dest).forEach( (key) => {
    assignField(dest, src, key);
  });
}

function assignObject(dest, src) {
  Object.keys(src).forEach( (key) => {
    assignField(dest, src, key);
  });
}

function assignOmitting(omit, dest, src) {
  if (typeof omit === 'string') {
    omit = omit.split(/[,|]/g).map( (t) => t.trim() );
  }
  Object.keys(src).forEach( (key) => {
    if (omit.includes(key)) return;
    assignField(dest, src, key);
  });
}

function setDefault(obj, field, val) {
  if (obj[field] === undefined) {
    obj[field] = val;
  }
}

function setDefaults(obj, def, custom=null) {
  let dest;
  Object.keys(def).forEach( (key) => {
    const origKey = key;
    let defValue = def[key];
    dest = obj;

    // allow for => 'stats.health': 100
    const parts = key.split('.');
    while (parts.length > 1) {
      key = parts.shift();
      if (dest[key] === undefined) {
        dest = dest[key] = {};
      }
      else if (typeof dest[key] !== 'object') {
        ERROR('Trying to set default member on non-object config item: ' + origKey);
      }
      else {
        dest = dest[key];
      }
    }

    key = parts.shift();
    let current = dest[key];

    // console.log('def - ', key, current, defValue, obj, dest);

    if (custom && custom(dest, key, current, defValue)) ;
    else if (current === undefined) {
      if (defValue === null) {
        dest[key] = null;
      }
      else if (Array.isArray(defValue)) {
        dest[key] = defValue.slice();
      }
      else if (typeof defValue === 'object') {
        dest[key] = defValue; // Object.assign({}, defValue); -- this breaks assigning a Color object as a default...
      }
      else {
        dest[key] = defValue;
      }
    }
  });
}

function kindDefaults(obj, def) {

  function custom(dest, key, current, defValue) {
    if (key.search(/[fF]lags$/) < 0) return false;

    if (!current) {
      current = [];
    }
    else if (typeof current == 'string') {
      current = current.split(/[,|]/).map( (t) => t.trim() );
    }
    else if (!Array.isArray(current)) {
      current = [current];
    }

    if (typeof defValue === 'string') {
      defValue = defValue.split(/[,|]/).map( (t) => t.trim() );
    }
    else if (!Array.isArray(defValue)) {
      defValue = [defValue];
    }

    // console.log('flags', key, defValue, current);

    dest[key] = defValue.concat(current);
    return true;
  }

  return setDefaults(obj, def, custom);
}

function pick(obj, ...fields) {
  const data = {};
  fields.forEach( (f) => {
    const v = obj[f];
    if (v !== undefined) {
      data[f] = v;
    }
  });
  return data;
}

function clearObject(obj) {
  Object.keys(obj).forEach( (key) => obj[key] = undefined );
}

function ERROR(message) {
  throw new Error(message);
}

function WARN(...args) {
  console.warn(...args);
}

function getOpt(obj, member, _default) {
  const v = obj[member];
  if (v === undefined) return _default;
  return v;
}

function firstOpt(field, ...args) {
  for(let arg of args) {
    if (typeof arg !== 'object' || Array.isArray(arg)) {
      return arg;
    }
    if (arg[field] !== undefined) {
      return arg[field];
    }
  }
  return undefined;
}

function arraysIntersect(a, b) {
  return a.some( (av) => b.includes(av) );
}

function sum(arr) {
  return arr.reduce( (a, b) => a + b );
}

// CHAIN

function chainLength(item) {
  let count = 0;
  while(item) {
    count += 1;
    item = item.next;
  }
  return count;
}

function chainIncludes(chain, entry) {
  while (chain && chain !== entry) {
    chain = chain.next;
  }
  return (chain === entry);
}

function eachChain(item, fn) {
  let index = 0;
  while(item) {
    const next = item.next;
    fn(item, index++);
    item = next;
  }
  return index; // really count
}

function addToChain(obj, name, entry) {
  entry.next = obj[name] || null;
  obj[name] = entry;
  return true;
}

function removeFromChain(obj, name, entry) {
  const root = obj[name];
  if (root === entry) {
    obj[name] = entry.next || null;
    entry.next = null;
    return true;
  }
  else if (!root) {
    return false;
  }
  else {
    let prev = root;
    let current = prev.next;
    while(current && current !== entry) {
      prev = current;
      current = prev.next;
    }
    if (current === entry) {
      prev.next = current.next || null;
      entry.next = null;
      return true;
    }
  }
  return false;
}

var utils$1 = {
  __proto__: null,
  makeDebug: makeDebug,
  NOOP: NOOP,
  TRUE: TRUE,
  FALSE: FALSE,
  ONE: ONE,
  ZERO: ZERO,
  IDENTITY: IDENTITY,
  clamp: clamp,
  x: x,
  y: y,
  copyXY: copyXY,
  addXY: addXY,
  equalsXY: equalsXY,
  lerpXY: lerpXY,
  distanceBetween: distanceBetween,
  distanceFromTo: distanceFromTo,
  calcRadius: calcRadius,
  dirBetween: dirBetween,
  dirFromTo: dirFromTo,
  dirIndex: dirIndex,
  isOppositeDir: isOppositeDir,
  isSameDir: isSameDir,
  dirSpread: dirSpread,
  stepFromTo: stepFromTo,
  smoothHiliteGradient: smoothHiliteGradient,
  extend: extend,
  cloneObject: cloneObject,
  copyObject: copyObject,
  assignObject: assignObject,
  assignOmitting: assignOmitting,
  setDefault: setDefault,
  setDefaults: setDefaults,
  kindDefaults: kindDefaults,
  pick: pick,
  clearObject: clearObject,
  ERROR: ERROR,
  WARN: WARN,
  getOpt: getOpt,
  firstOpt: firstOpt,
  arraysIntersect: arraysIntersect,
  sum: sum,
  chainLength: chainLength,
  chainIncludes: chainIncludes,
  eachChain: eachChain,
  addToChain: addToChain,
  removeFromChain: removeFromChain
};

var EVENTS = {};

/**
 * Data for an event listener.
 */
class Listener {
  /**
   * Creates a Listener.
   * @param {Function} fn The listener function.
   * @param {Object} [context=null] The context to invoke the listener with.
   * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
   */
  constructor(fn, context, once) {
    this.fn = fn;
    this.context = context || null;
    this.once = once || false;
    this.next = null;
  }

  /**
   * Compares this Listener to the parameters.
   * @param {Function} fn - The function
   * @param {Object} [context] - The context Object.
   * @param {Boolean} [once] - Whether or not it is a one time handler.
   * @returns Whether or not this Listener matches the parameters.
   */
  matches(fn, context, once) {
    return ((this.fn === fn) &&
        ((once === undefined) || (once == this.once)) &&
        (!context || this.context === context));
  }
}


/**
 * Add a listener for a given event.
 *
 * @param {String} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {Listener}
 */
function addListener(event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  const listener = new Listener(fn, context || null, once);
  addToChain(EVENTS, event, listener);
  return listener;
}

/**
 * Add a listener for a given event.
 *
 * @param {String} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {Listener}
 */
 function on(event, fn, context, once) {
  return addListener(event, fn, context, once);
}

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
function once(event, fn, context) {
  return addListener(event, fn, context, true);
}
/**
 * Remove the listeners of a given event.
 *
 * @param {String} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
function removeListener(event, fn, context, once) {
  if (!EVENTS[event]) return;
  if (!fn) {
    clearEvent(event);
    return;
  }

  eachChain(EVENTS[event], (l) => {
    if (l.matches(fn, context, once)) {
      removeFromChain(EVENTS, event, l);
    }
  });
}
/**
 * Remove the listeners of a given event.
 *
 * @param {String} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
 function off(event, fn, context, once) {
  removeListener(event, fn, context, once);
}

/**
 * Clear event by name.
 *
 * @param {String} evt The Event name.
 */
function clearEvent(event) {
  EVENTS[event] = null;
}


/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
function removeAllListeners(event) {
  if (event) {
    if (EVENTS[event]) clearEvent(event);
  } else {
    EVENTS = {};
  }
}

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String} event The event name.
 * @param {...*} args The additional arguments to the event handlers.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
async function emit(...args) {
  const event = args[0];
  if (!EVENTS[event]) return false;  // no events to send
  let listener = EVENTS[event];

  while(listener) {
    let next = listener.next;
    if (listener.once) removeFromChain(EVENTS, event, listener);
    await listener.fn.apply(listener.context, args);
    listener = next;
  }
  return true;
}

///////////////////////////////////
// FLAG

function Fl(N) { return (1 << N); }

flag.fl = Fl;

function flagToText(flagObj, value) {
  const inverse = Object.entries(flagObj).reduce( (out, [key, value]) => {
    out[value] = key;
    return out;
  }, {});

  const out = [];
  for(let index = 0; index < 32; ++index) {
    const fl = (1 << index);
    if (value & fl) {
      out.push(inverse[fl]);
    }
  }
  return out.join(' | ');
}

function toFlag(obj, ...args) {
  let result = 0;
  for(let index = 0; index < args.length; ++index) {
    let value = args[index];
    if (value === undefined) continue;
    if (typeof value == 'number') {
      result |= value;
      continue;	// next
    }
    else if (typeof value === 'string') {
      value = value.split(/[,|]/).map( (t) => t.trim() ).map( (u) => {
        const n = Number.parseInt(u);
        if (n >= 0) return n;
        return u;
      });
    }

    if (Array.isArray(value)) {
      value.forEach( (v) => {
        if (typeof v == 'string') {
          v = v.trim();
          if (v.startsWith('!')) {
            const f = obj[v.substring(1)];
            result &= ~f;
          }
          else {
            const f = obj[v];
            if (f) { result |= f; }
          }
        }
        else if (v === 0) { // to allow clearing flags when extending objects
          result = 0;
        }
        else {
          result |= v;
        }
      });
    }
  }
  return result;
}


class Flag {
  constructor() {
  }
  toString(v) {
    return flagToText(this, v);
  }
  toFlag(...args) {
    return toFlag(this, ...args);
  }
  install(obj) {
    Object.getOwnPropertyNames(this).forEach( (name) => {
      obj[name] = this[name];
    });
  }
}

types.Flag = Flag;

function makeFlag(values) {
  const flag = new Flag();
  Object.entries(values).forEach( ([key, value]) => {
    if (typeof value === 'string') {
      value = value.split(/[,|]/).map( (t) => t.trim() );
    }
    if (Array.isArray(value)) {
      value = value.reduce( (out, name) => {
        return out | flag[name];
      }, 0);
    }
    flag[key] = def[key] = value;
  });
  return flag;
}

make.flag = makeFlag;

function installFlag(flagName, values) {
  const flag = make.flag(values);
  flags[flagName] = flag;
  return flag;
}

flag.install = installFlag;

///////////////////////////////////////////////////////
// ACTION

const Action = installFlag('action', {
	A_USE			: Fl(0),
	A_EQUIP		: Fl(1),
	A_PUSH		: Fl(2),
	A_RENAME	: Fl(3),
	A_ENCHANT	: Fl(4),
	A_THROW		: Fl(5),
	A_SPECIAL	: Fl(6),

	A_PULL		: Fl(7),
	A_SLIDE		: Fl(8),

	A_PICKUP		: Fl(9),
	A_BASH	    : Fl(10),

  A_OPEN        : Fl(11),
  A_CLOSE       : Fl(12),

  A_TALK        : Fl(13),

	A_GRABBABLE : 'A_PULL, A_SLIDE',
  A_WIELD     : 'A_EQUIP',
  A_NO_PICKUP : 'A_PICKUP',   // All items have pickup by default, using the A_PICKUP means 'NO PICKUP' for items, so we have this alias to help
});


///////////////////////////////////////////////////////
// ACTOR - BEHAVIORS


const Behavior = installFlag('behavior', {
  BB_MOVES_RANDOM_12: Fl(0),
  BB_MOVES_RANDOM_25: Fl(1),
  BB_MOVES_RANDOM_50: Fl(2),
  BB_FLEES_NEAR_DEATH: Fl(3),  // monster flees when under 25% health and re-engages when over 75%
  BB_NEVER_SLEEPS: Fl(4), // monster is always awake (for ai)
  BB_MAINTAINS_DISTANCE: Fl(5), // monster tries to keep a distance of 3 tiles between it and player
  BB_USES_STAIRS: Fl(6),
  BB_GETS_TURN_ON_ACTIVATION: Fl(7), // monster never gets a turn, except when its machine is activated
  BB_ALWAYS_USE_ABILITY: Fl(8),   // monster will never fail to use special ability if eligible (no random factor)
  BB_DF_ON_DEATH: Fl(9),	       // monster spawns its DF when it dies
  BB_AVOID_CORRIDORS: Fl(10),   // monster will avoid corridors when hunting
  BB_OPEN_DOORS: Fl(11),
  BB_PASS_WALLS: Fl(12),
  BB_PICKUP_ITEMS: Fl(13),
  BB_INANIMATE: Fl(14),
  BB_IMMOBILE: Fl(15),        // monster won't move or perform melee attacks (can do magic attacks)
  BB_ALWAYS_HUNTING: Fl(16),  // monster is never asleep or in wandering mode
  BB_DOES_NOT_TRACK_LEADER: Fl(17), // monster will not follow its leader around
  BB_PASS_MONSTERS: Fl(18),
  BB_AVOID_COMBAT: Fl(19),
  BB_PERM_FLEEING: Fl(20),  // TODO - REMOVE?
  BB_TARGETS_GROUND: Fl(21),
  BB_TARGETS_AIR: Fl(22),
  BB_TARGETS_BUILDINGS: Fl(23),
  BB_CANNOT_ATTACK: Fl(24),
});


///////////////////////////////////////////////////////
// ACTOR

const Actor = installFlag('actor', {
  AF_CHANGED      : Fl(0),
  AF_DYING        : Fl(1),
  AF_TURN_ENDED   : Fl(2),

  AF_MALE         : Fl(3),
  AF_FEMALE       : Fl(4),
  AF_YOU          : Fl(5),  // Use 'you' as the actor name in messages

  AF_DEBUG        : Fl(30),
});

///////////////////////////////////////////////////////
// ACTOR KIND

const ActorKind = installFlag('actorKind', {
  AK_IMMOBILE     : Fl(0),
  AK_INANIMATE    : Fl(1),
});

///////////////////////////////////////////////////////
// TILE

const Tile = installFlag('tile', {
  T_OBSTRUCTS_PASSABILITY	: Fl(0),		// cannot be walked through
  T_OBSTRUCTS_VISION			: Fl(1),		// blocks line of sight
  T_OBSTRUCTS_ITEMS				: Fl(2),		// items can't be on this tile
  T_OBSTRUCTS_SURFACE		  : Fl(3),		// grass, blood, etc. cannot exist on this tile
  T_OBSTRUCTS_GAS					: Fl(4),		// blocks the permeation of gas
  T_OBSTRUCTS_LIQUID      : Fl(5),
  T_OBSTRUCTS_TILE_EFFECTS  : Fl(6),
  T_OBSTRUCTS_DIAGONAL_MOVEMENT : Fl(7),    // can't step diagonally around this tile

  T_BRIDGE                : Fl(10),   // Acts as a bridge over the folowing types:
  T_AUTO_DESCENT					: Fl(11),		// automatically drops creatures down a depth level and does some damage (2d6)
  T_LAVA			            : Fl(12),		// kills any non-levitating non-fire-immune creature instantly
  T_DEEP_WATER					  : Fl(13),		// steals items 50% of the time and moves them around randomly

  T_SPONTANEOUSLY_IGNITES	: Fl(14),		// monsters avoid unless chasing player or immune to fire
  T_IS_FLAMMABLE					: Fl(15),		// terrain can catch fire
  T_IS_FIRE								: Fl(16),		// terrain is a type of fire; ignites neighboring flammable cells
  T_ENTANGLES							: Fl(17),		// entangles players and monsters like a spiderweb

  T_CAUSES_POISON					: Fl(18),		// any non-levitating creature gets 10 poison
  T_CAUSES_DAMAGE					: Fl(19),		// anything on the tile takes max(1-2, 10%) damage per turn
  T_CAUSES_NAUSEA					: Fl(20),		// any creature on the tile becomes nauseous
  T_CAUSES_PARALYSIS			: Fl(21),		// anything caught on this tile is paralyzed
  T_CAUSES_CONFUSION			: Fl(22),		// causes creatures on this tile to become confused
  T_CAUSES_HEALING   	    : Fl(23),   // heals 20% max HP per turn for any player or non-inanimate monsters
  T_IS_TRAP								: Fl(24),		// spews gas of type specified in fireType when stepped on
  T_CAUSES_EXPLOSIVE_DAMAGE		: Fl(25),		// is an explosion; deals higher of 15-20 or 50% damage instantly, but not again for five turns
  T_SACRED                : Fl(26),   // monsters that aren't allies of the player will avoid stepping here

  T_UP_STAIRS							: Fl(27),
  T_DOWN_STAIRS						: Fl(28),
  T_PORTAL                : Fl(29),
  T_IS_DOOR								: Fl(30),

  T_HAS_STAIRS						: ['T_UP_STAIRS', 'T_DOWN_STAIRS', 'T_PORTAL'],
  T_OBSTRUCTS_SCENT				: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES', 'T_HAS_STAIRS'],
  T_PATHING_BLOCKER				: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_IS_FIRE', 'T_SPONTANEOUSLY_IGNITES', 'T_ENTANGLES'],
  T_DIVIDES_LEVEL       	: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER'],
  T_LAKE_PATHING_BLOCKER	: ['T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
  T_WAYPOINT_BLOCKER			: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
  T_MOVES_ITEMS						: ['T_DEEP_WATER', 'T_LAVA'],
  T_CAN_BE_BRIDGED				: ['T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER'],
  T_OBSTRUCTS_EVERYTHING	: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_OBSTRUCTS_ITEMS', 'T_OBSTRUCTS_GAS', 'T_OBSTRUCTS_SURFACE',   'T_OBSTRUCTS_LIQUID', 'T_OBSTRUCTS_DIAGONAL_MOVEMENT'],
  T_HARMFUL_TERRAIN				: ['T_CAUSES_POISON', 'T_IS_FIRE', 'T_CAUSES_DAMAGE', 'T_CAUSES_PARALYSIS', 'T_CAUSES_CONFUSION', 'T_CAUSES_EXPLOSIVE_DAMAGE'],
  T_RESPIRATION_IMMUNITIES  : ['T_CAUSES_DAMAGE', 'T_CAUSES_CONFUSION', 'T_CAUSES_PARALYSIS', 'T_CAUSES_NAUSEA'],
  T_IS_LIQUID               : ['T_LAVA', 'T_AUTO_DESCENT', 'T_DEEP_WATER'],
  T_STAIR_BLOCKERS          : 'T_OBSTRUCTS_ITEMS, T_OBSTRUCTS_SURFACE, T_OBSTRUCTS_GAS, T_OBSTRUCTS_LIQUID, T_OBSTRUCTS_TILE_EFFECTS',
});


///////////////////////////////////////////////////////
// TILE MECH


const TileMech = installFlag('tileMech', {
  TM_IS_SECRET							: Fl(0),		// successful search or being stepped on while visible transforms it into discoverType
  TM_PROMOTES_WITH_KEY			: Fl(1),		// promotes if the key is present on the tile (in your pack, carried by monster, or lying on the ground)
  TM_PROMOTES_WITHOUT_KEY		: Fl(2),		// promotes if the key is NOT present on the tile (in your pack, carried by monster, or lying on the ground)
  TM_PROMOTES_ON_STEP				: Fl(3),		// promotes when a creature, player or item is on the tile (whether or not levitating)
  TM_PROMOTES_ON_ITEM_REMOVE		: Fl(4),		// promotes when an item is lifted from the tile (primarily for altars)
  TM_PROMOTES_ON_PLAYER_ENTRY		: Fl(5),		// promotes when the player enters the tile (whether or not levitating)
  TM_PROMOTES_ON_SACRIFICE_ENTRY: Fl(6),		// promotes when the sacrifice target enters the tile (whether or not levitating)
  TM_PROMOTES_ON_ELECTRICITY    : Fl(7),    // promotes when hit by a lightning bolt

  TM_ALLOWS_SUBMERGING					: Fl(8),		// allows submersible monsters to submerge in this terrain
  TM_IS_WIRED										: Fl(9),		// if wired, promotes when powered, and sends power when promoting
  TM_IS_CIRCUIT_BREAKER 				: Fl(10),   // prevents power from circulating in its machine

  TM_EXTINGUISHES_FIRE					: Fl(14),		// extinguishes burning terrain or creatures
  TM_VANISHES_UPON_PROMOTION		: Fl(15),		// vanishes when creating promotion dungeon feature, even if the replacement terrain priority doesn't require it
  TM_REFLECTS_BOLTS           	: Fl(16),       // magic bolts reflect off of its surface randomly (similar to ACTIVE_CELLS flag IMPREGNABLE)
  TM_STAND_IN_TILE            	: Fl(17),		// earthbound creatures will be said to stand "in" the tile, not on it
  TM_LIST_IN_SIDEBAR          	: Fl(18),       // terrain will be listed in the sidebar with a description of the terrain type
  TM_VISUALLY_DISTINCT        	: Fl(19),       // terrain will be color-adjusted if necessary so the character stands out from the background
  TM_BRIGHT_MEMORY            	: Fl(20),       // no blue fade when this tile is out of sight
  TM_EXPLOSIVE_PROMOTE        	: Fl(21),       // when burned, will promote to promoteType instead of burningType if surrounded by tiles with T_IS_FIRE or TM_EXPLOSIVE_PROMOTE
  TM_CONNECTS_LEVEL           	: Fl(22),       // will be treated as passable for purposes of calculating level connectedness, irrespective of other aspects of this terrain layer
  TM_INTERRUPT_EXPLORATION_WHEN_SEEN : Fl(23),    // will generate a message when discovered during exploration to interrupt exploration
  TM_INVERT_WHEN_HIGHLIGHTED  	: Fl(24),       // will flip fore and back colors when highlighted with pathing
  TM_SWAP_ENCHANTS_ACTIVATION 	: Fl(25),       // in machine, swap item enchantments when two suitable items are on this terrain, and activate the machine when that happens

  TM_PROMOTES										: 'TM_PROMOTES_WITH_KEY | TM_PROMOTES_WITHOUT_KEY | TM_PROMOTES_ON_STEP | TM_PROMOTES_ON_ITEM_REMOVE | TM_PROMOTES_ON_SACRIFICE_ENTRY | TM_PROMOTES_ON_ELECTRICITY | TM_PROMOTES_ON_PLAYER_ENTRY',
});


///////////////////////////////////////////////////////
// TILE EVENT

const TileEvent = installFlag('tileEvent', {
	DFF_SUBSEQ_ALWAYS							: Fl(0),	// Always fire the subsequent event, even if no tiles changed.
	DFF_SUBSEQ_EVERYWHERE			    : Fl(1),	// Subsequent DF spawns in every cell that this DF spawns in, instead of only the origin
	DFF_TREAT_AS_BLOCKING			    : Fl(2),	// If filling the footprint of this DF with walls would disrupt level connectivity, then abort.
	DFF_PERMIT_BLOCKING				    : Fl(3),	// Generate this DF without regard to level connectivity.
	DFF_ACTIVATE_DORMANT_MONSTER	: Fl(4),	// Dormant monsters on this tile will appear -- e.g. when a statue bursts to reveal a monster.
	DFF_BLOCKED_BY_OTHER_LAYERS		: Fl(6),	// Will not propagate into a cell if any layer in that cell has a superior priority.
	DFF_SUPERPRIORITY				      : Fl(7),	// Will overwrite terrain of a superior priority.
  DFF_AGGRAVATES_MONSTERS       : Fl(8),  // Will act as though an aggravate monster scroll of effectRadius radius had been read at that point.
  DFF_RESURRECT_ALLY            : Fl(9),  // Will bring back to life your most recently deceased ally.
	DFF_EMIT_EVENT								: Fl(10), // Will emit the event when activated
	DFF_NO_REDRAW_CELL						: Fl(11),
	DFF_ABORT_IF_BLOCKS_MAP				: Fl(12),
  DFF_BLOCKED_BY_ITEMS          : Fl(13), // Do not fire this event in a cell that has an item.
  DFF_BLOCKED_BY_ACTORS         : Fl(13), // Do not fire this event in a cell that has an item.

	DFF_ALWAYS_FIRE								: Fl(15),	// Fire even if the cell is marked as having fired this turn
	DFF_NO_MARK_FIRED							: Fl(16),	// Do not mark this cell as having fired an event
	// MUST_REPLACE_LAYER
	// NEEDS_EMPTY_LAYER
	DFF_PROTECTED									: Fl(19),

	DFF_SPREAD_CIRCLE							: Fl(20),	// Spread in a circle around the spot (using FOV), radius calculated using spread+decrement
	DFF_SPREAD_LINE								: Fl(21),	// Spread in a line in one random direction

	DFF_NULL_SURFACE			  : Fl(22),	// Clear the surface layer
  DFF_NULL_LIQUID         : Fl(23), // Clear liquid layer
  DFF_NULL_GAS            : Fl(24), // Clear gas layer

  DFF_EVACUATE_CREATURES	: Fl(25),	// Creatures in the DF area get moved outside of it
	DFF_EVACUATE_ITEMS			: Fl(26),	// Creatures in the DF area get moved outside of it

	DFF_BUILD_IN_WALLS			: Fl(27),
	DFF_MUST_TOUCH_WALLS		: Fl(28),
	DFF_NO_TOUCH_WALLS			: Fl(29),

  DFF_ONLY_IF_EMPTY       : 'DFF_BLOCKED_BY_ITEMS, DFF_BLOCKED_BY_ACTORS',
  DFF_NULLIFY_CELL        : 'DFF_NULL_SURFACE, DFF_NULL_LIQUID, DFF_NULL_GAS',

});


///////////////////////////////////////////////////////
// CELL

const Cell = installFlag('cell', {
  REVEALED					: Fl(0),
  VISIBLE							: Fl(1),	// cell has sufficient light and is in field of view, ready to draw.
  WAS_VISIBLE					: Fl(2),
  IN_FOV		          : Fl(3),	// player has unobstructed line of sight whether or not there is enough light

  HAS_PLAYER					: Fl(4),
  HAS_MONSTER					: Fl(5),
  HAS_DORMANT_MONSTER	: Fl(6),	// hidden monster on the square
  HAS_ITEM						: Fl(7),
  HAS_STAIRS					: Fl(8),

  NEEDS_REDRAW        : Fl(9),	// needs to be redrawn (maybe in path, etc...)
  CELL_CHANGED				: Fl(10),	// one of the tiles or sprites (item, actor, fx) changed

  IS_IN_PATH					: Fl(12),	// the yellow trail leading to the cursor
  IS_CURSOR						: Fl(13),	// the current cursor

  MAGIC_MAPPED				: Fl(14),
  ITEM_DETECTED				: Fl(15),

  STABLE_MEMORY						: Fl(16),	// redraws will simply be pulled from the memory array, not recalculated

  CLAIRVOYANT_VISIBLE			: Fl(17),
  WAS_CLAIRVOYANT_VISIBLE	: Fl(18),
  CLAIRVOYANT_DARKENED		: Fl(19),	// magical blindness from a cursed ring of clairvoyance

  IMPREGNABLE							: Fl(20),	// no tunneling allowed!

  TELEPATHIC_VISIBLE			: Fl(22),	// potions of telepathy let you see through other creatures' eyes
  WAS_TELEPATHIC_VISIBLE	: Fl(23),	// potions of telepathy let you see through other creatures' eyes

  MONSTER_DETECTED				: Fl(24),
  WAS_MONSTER_DETECTED		: Fl(25),

  LIGHT_CHANGED           : Fl(27), // Light level changed this turn
  CELL_LIT                : Fl(28),
  IS_IN_SHADOW				    : Fl(29),	// so that a player gains an automatic stealth bonus
  CELL_DARK               : Fl(30),

  PERMANENT_CELL_FLAGS : ['REVEALED', 'MAGIC_MAPPED', 'ITEM_DETECTED', 'HAS_ITEM', 'HAS_DORMANT_MONSTER',
              'HAS_STAIRS', 'STABLE_MEMORY', 'IMPREGNABLE'],

  ANY_KIND_OF_VISIBLE			: ['VISIBLE', 'CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE'],
  HAS_ACTOR               : ['HAS_PLAYER', 'HAS_MONSTER'],
  IS_WAS_ANY_KIND_OF_VISIBLE : ['VISIBLE', 'WAS_VISIBLE', 'CLAIRVOYANT_VISIBLE', 'WAS_CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE', 'WAS_TELEPATHIC_VISIBLE'],

  CELL_DEFAULT            : 'VISIBLE | IN_FOV | NEEDS_REDRAW | CELL_CHANGED | IS_IN_SHADOW',  // !CELL_LIT until lights remove the shadow
});


///////////////////////////////////////////////////////
// CELL MECH

const CellMech = installFlag('cellMech', {
  SEARCHED_FROM_HERE				: Fl(0),	// Player already auto-searched from here; can't auto search here again
  PRESSURE_PLATE_DEPRESSED	: Fl(1),	// so that traps do not trigger repeatedly while you stand on them
  KNOWN_TO_BE_TRAP_FREE			: Fl(2),	// keep track of where the player has stepped as he knows no traps are there

  CAUGHT_FIRE_THIS_TURN			: Fl(4),	// so that fire does not spread asymmetrically
  EVENT_FIRED_THIS_TURN     : Fl(5),  // so we don't update cells that have already changed this turn
  EVENT_PROTECTED           : Fl(6),

  IS_IN_LOOP					: Fl(10),	// this cell is part of a terrain loop
  IS_CHOKEPOINT				: Fl(11),	// if this cell is blocked, part of the map will be rendered inaccessible
  IS_GATE_SITE				: Fl(12),	// consider placing a locked door here
  IS_IN_ROOM_MACHINE	: Fl(13),
  IS_IN_AREA_MACHINE	: Fl(14),
  IS_POWERED					: Fl(15),	// has been activated by machine power this turn (can probably be eliminate if needed)

  IS_IN_MACHINE				: ['IS_IN_ROOM_MACHINE', 'IS_IN_AREA_MACHINE'], 	// sacred ground; don't generate items here, or teleport randomly to it

  PERMANENT_MECH_FLAGS : ['SEARCHED_FROM_HERE', 'PRESSURE_PLATE_DEPRESSED', 'KNOWN_TO_BE_TRAP_FREE', 'IS_IN_LOOP',
                          'IS_CHOKEPOINT', 'IS_GATE_SITE', 'IS_IN_MACHINE', ],
});

///////////////////////////////////////////////////////
// ITEM KIND

const ItemKind = installFlag('itemKind', {
	IK_ENCHANT_SPECIALIST 	: Fl(0),  // TODO - DELETE (replace with tag?)
	IK_HIDE_FLAVOR_DETAILS	: Fl(1),

	IK_AUTO_TARGET					: Fl(2),  // TODO - DELETE

	IK_HALF_STACK_STOLEN		: Fl(3), // TODO - DELETE
	IK_ENCHANT_USES_STR 		: Fl(4),

  IK_NO_SIDEBAR           : Fl(5),  // Do not show this item in the sidebar
  IK_USE_ON_PICKUP        : Fl(6),  // Use item instead of picking up
  IK_EQUIP_ON_PICKUP		  : Fl(7),

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

	IK_NAME_PLURAL					: Fl(20), // TODO - Replace with name conventions?  'gold coin~'

	IK_STACKABLE						: Fl(21),
  IK_STACK_AS_ONE         : Fl(22),

	// IK_SLOW_RECHARGE				: Fl(24),
	IK_CAN_BE_SWAPPED      	: Fl(25),
	// IK_CAN_BE_RUNIC					: Fl(26),
	IK_CAN_BE_DETECTED		  : Fl(27),

	IK_TREASURE							: Fl(28),  // DELETE - tag
	IK_INTERRUPT_EXPLORATION_WHEN_SEEN:	Fl(29),

  IK_AUTO_CONSUME         : 'IK_USE_ON_PICKUP, IK_DESTROY_ON_USE',

  IK_DEFAULT              : 0,
});

///////////////////////////////////////////////////////
// ITEM ATTACK

const ItemAttack = installFlag('itemAttack', {
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


///////////////////////////////////////////////////////
// ITEM

const Item = installFlag('item', {
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

  ITEM_CHANGED            : Fl(29),
	ITEM_DESTROYED					: Fl(30),
});

///////////////////////////////////////////////////////
// MAP

const Map = installFlag('map', {
	MAP_CHANGED: Fl(0),

	MAP_STABLE_GLOW_LIGHTS:  Fl(1),
	MAP_STABLE_LIGHTS: Fl(2),

	MAP_ALWAYS_LIT:	Fl(3),
  MAP_SAW_WELCOME: Fl(4),

  MAP_NO_LIQUID: Fl(5),
  MAP_NO_GAS: Fl(6),

  MAP_FOV_CHANGED: Fl(7),

  MAP_DEFAULT: 'MAP_STABLE_LIGHTS, MAP_STABLE_GLOW_LIGHTS, MAP_FOV_CHANGED',
});

// Based on random numbers in umoria
const RNG_M = 2**31 - 1;
const RNG_A = 16807;
const RNG_Q = Math.floor(RNG_M / RNG_A); // m div a 127773L
const RNG_R = RNG_M % RNG_A;   // m mod a 2836L



function lotteryDrawArray(rand, frequencies) {
    let i, maxFreq, randIndex;
    maxFreq = 0;
    for (i = 0; i < frequencies.length; i++) {
        maxFreq += frequencies[i];
    }
		if (maxFreq <= 0) {
			WARN('Lottery Draw - no frequencies', frequencies, frequencies.length);
			return 0;
		}

    randIndex = rand.range(0, maxFreq - 1);
    for (i = 0; i < frequencies.length; i++) {
      if (frequencies[i] > randIndex) {
          return i;
      } else {
          randIndex -= frequencies[i];
      }
    }
    WARN('Lottery Draw failed.', frequencies, frequencies.length);
    return 0;
}

function lotteryDrawObject(rand, weights) {
  const entries = Object.entries(weights);

  const frequencies = entries.map( ([key, weight]) => weight );
  const index = lotteryDrawArray(rand, frequencies);
  return entries[index][0];
}



class Random {
  constructor(seed) {
    this.debug = NOOP;
    this.seed(seed);
  }

  // seeds with the time if called with a parameter of 0; returns the seed regardless.
  // All RNGs are seeded simultaneously and identically.
  seed(seed) {
    if (!seed) {
      return this._seed;
    }
    this._seed = (seed || Date.now()) % RNG_M;
    this._v = ((this._seed % (RNG_M - 1)) + 1);
		this.count = 0;

    this.debug('seed', this._seed);
  	return this._seed;
  }

  // returns a pseudo-random number from set 0, 1, 2, ..., RNG_M - 2
  number(max) {
    if (max==1) return 0;

		++this.count;
    const high = Math.floor(this._v / RNG_Q);
    const low = Math.floor(this._v % RNG_Q);
    const test = Math.floor(RNG_A * low - RNG_R * high);

    if (test > 0) {
        this._v = test;
    } else {
        this._v = (test + RNG_M);
    }
    const v = this._v - 1;
    const result = max ? (v % max) : v;
    this.debug(result);
    return result;
  }

  int(n) {
    return this.number(n);
  }

  float() {
    return this.value();
  }

  value() {
    return (this.number() / (RNG_M - 1));
  }

  range(lo, hi) {
    if (hi <= lo) return hi;
  	const diff = (hi - lo) + 1;
  	return lo + (this.number(diff));
  }

  dice(count, sides, addend) {
  	let total = 0;
  	let mult = 1;
  	if (count < 0) {
  		count = -count;
  		mult = -1;
  	}
    addend = addend || 0;
  	for(let i = 0; i < count; ++i) {
  		total += this.range(1, sides);
  	}
  	total *= mult;
  	return total + addend;
  }


  lottery(weights) {
    return this.weighted(weights);
  }

  weighted(weights) {
    if (Array.isArray(weights)) {
      return lotteryDrawArray(this, weights);
    }
    return lotteryDrawObject(this, weights);
  }

  index(weights) {
    return lotteryDrawArray(this, weights);
  }


  // Get a random int between lo and hi, inclusive, with probability distribution
  // affected by clumps.
  clumped(lo, hi, clumps) {
  	if (hi <= lo) {
  		return lo;
  	}
  	if (clumps <= 1) {
  		return this.range(lo, hi);
  	}

  	let i, total = 0, numSides = Math.floor((hi - lo) / clumps);

  	for(i=0; i < (hi - lo) % clumps; i++) {
  		total += this.range(0, numSides + 1);
  	}

  	for(; i< clumps; i++) {
  		total += this.range(0, numSides);
  	}

  	return (total + lo);
  }

  chance(percent, outOf=100) {
    if (percent <= 0) return false;
    if (percent >= outOf) return true;
  	return (this.range(0, outOf-1) < percent);
  }

  item(list) {
    if (!Array.isArray(list)) {
      list = Object.values(list);
    }
    return list[this.range(0, list.length - 1)];
  }

  key(obj) {
    return this.item(Object.keys(obj));
  }

  shuffle(list, fromIndex, toIndex) {
  	if (arguments.length == 2) {
  		toIndex = fromIndex;
  		fromIndex = 0;
  	}

  	let i, r, buf;
  	toIndex = toIndex || list.length;
  	fromIndex = fromIndex || 0;

  	for (i = fromIndex; i < toIndex; i++) {
  		r = this.range(fromIndex, toIndex-1);
  		if (i != r) {
  			buf = list[r];
  			list[r] = list[i];
  			list[i] = buf;
  		}
  	}
    return list;
  }

  sequence(n) {
    const list = [];
    for (let i=0; i<n; i++) {
      list[i] = i;
    }
    return this.shuffle(list);
  }
}

Random.MAX = RNG_M;

types.Random = Random;


var RANDOM_SEED = Date.now();

function makeRng(seed) {
  return new types.Random(seed);
}

make.rng = makeRng;

var random = new Random(RANDOM_SEED);
var cosmetic = new Random(RANDOM_SEED);




class Range {
	constructor(lower, upper, clump, rng) {
    this.rng = rng || random;
		if (arguments.length == 1) {
			if (Array.isArray(lower)) {
				clump = lower[2];
				upper = lower[1];
				lower = lower[0];
			}
			else if (typeof lower !== 'number') {
				clump = lower.clumps;
				upper = lower.hi;
				lower = lower.lo || lower;
			}
		}

		this.lo = lower || 0;
		this.hi = upper || this.lo;
		this.clumps = clump || 1;
	}

  value() {
    return this.rng.clumped(this.lo, this.hi, this.clumps);
  }

  toString() {
    if (this.lo >= this.hi) {
      return '' + this.lo;
    }
    return `${this.lo}-${this.hi}`;
  }
}

types.Range = Range;


function makeRange(config, rng) {

  if (!config) return new Range(0, 0, 0, rng);
  if (config instanceof Range) return config; // you can supply a custom range object
  if (config.value) return config;  // calc or damage

  if (typeof config == 'function') ERROR('Custom range functions not supported - extend Range');

  if (config === undefined || config === null) return new Range(0, 0, 0, rng);
  if (typeof config == 'number') return new Range(config, config, 1, rng);

  if (config === true || config === false) ERROR('Invalid random config: ' + config);

  if (Array.isArray(config)) {
		return new Range(config[0], config[1], config[2], rng);
	}
  if (config.lo !== undefined) {
    return new Range(config.lo, config.hi, config.clumps, rng);
  }
  if (typeof config !== 'string') {
    ERROR('Calculations must be strings.  Received: ' + JSON.stringify(config));
  }
  if (config.length == 0) return new Range(0);

	const RE = /^(?:([+-]?\d*)[Dd](\d+)([+-]?\d*)|([+-]?\d+)-(\d+):?(\d+)?|([+-]?\d+)~(\d+)|([+-]?\d+\.?\d*))/g;
  let results;
  while ((results = RE.exec(config)) !== null) {
    if (results[2]) {
      let count = Number.parseInt(results[1]) || 1;
      const sides = Number.parseInt(results[2]);
      const addend = Number.parseInt(results[3]) || 0;

      const lower = addend + count;
      const upper = addend + (count * sides);

      return new Range(lower, upper, count, rng);
    }
    else if (results[4] && results[5]) {
      const min = Number.parseInt(results[4]);
      const max = Number.parseInt(results[5]);
      const clumps = Number.parseInt(results[6]);
      return new Range(min, max, clumps, rng);
    }
    else if (results[7] && results[8]) {
      const base = Number.parseInt(results[7]);
      const std = Number.parseInt(results[8]);
      return new Range(base - 2*std, base + 2*std, 3, rng);
    }
		else if (results[9]) {
      const v = Number.parseFloat(results[9]);
      return new Range(v, v, 1, rng);
    }
  }

  return null;  // This is not a valid range
}

make.range = makeRange;

// Copy of: https://github.com/ondras/fastiles/blob/master/ts/utils.ts (v2.1.0)
const QUAD = [
    0, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 1
];
function createProgram(gl, ...sources) {
    const p = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, index) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, sources[index]);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        gl.attachShader(p, shader);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p));
    }
    return p;
}
function createTexture(gl) {
    let t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return t;
}
function createGeometry(gl, attribs, width, height) {
    let tileCount = width * height;
    let positionData = new Uint16Array(tileCount * QUAD.length);
    let uvData = new Uint8Array(tileCount * QUAD.length);
    let i = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            QUAD.forEach(value => {
                positionData[i] = (i % 2 ? y : x) + value;
                uvData[i] = value;
                i++;
            });
        }
    }
    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.vertexAttribIPointer(attribs["position"], 2, gl.UNSIGNED_SHORT, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    const uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.vertexAttribIPointer(attribs["uv"], 2, gl.UNSIGNED_BYTE, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);
    return { position, uv };
}

// Based on: https://github.com/ondras/fastiles/blob/master/ts/shaders.ts (v2.1.0)
const VS = `
#version 300 es
in uvec2 position;
in uvec2 uv;
in uint style;
out vec2 fsUv;
flat out uint fsStyle;
uniform highp uvec2 tileSize;
uniform uvec2 viewportSize;
void main() {
	ivec2 positionPx = ivec2(position * tileSize);
	vec2 positionNdc = (vec2(positionPx * 2) / vec2(viewportSize))-1.0;
	positionNdc.y *= -1.0;
	gl_Position = vec4(positionNdc, 0.0, 1.0);
	fsUv = vec2(uv);
	fsStyle = style;
}`.trim();
const FS = `
#version 300 es
precision highp float;
in vec2 fsUv;
flat in uint fsStyle;
out vec4 fragColor;
uniform sampler2D font;
uniform highp uvec2 tileSize;
void main() {
	uvec2 fontTiles = uvec2(textureSize(font, 0)) / tileSize;

	uint glyph = (fsStyle & uint(0xFF000000)) >> 24;
	uint glyphX = (glyph & uint(0xF));
	uint glyphY = (glyph >> 4);
	uvec2 fontPosition = uvec2(glyphX, glyphY);

	uvec2 fontPx = (tileSize * fontPosition) + uvec2(vec2(tileSize) * fsUv);
	vec3 texel = texelFetch(font, ivec2(fontPx), 0).rgb;

	float s = 15.0;
	uint fr = (fsStyle & uint(0xF00)) >> 8;
	uint fg = (fsStyle & uint(0x0F0)) >> 4;
	uint fb = (fsStyle & uint(0x00F)) >> 0;
	vec3 fgRgb = vec3(fr, fg, fb) / s;
  
	uint br = (fsStyle & uint(0xF00000)) >> 20;
	uint bg = (fsStyle & uint(0x0F0000)) >> 16;
	uint bb = (fsStyle & uint(0x00F000)) >> 12;
	vec3 bgRgb = vec3(br, bg, bb) / s;
  
	fragColor = vec4(mix(bgRgb, fgRgb, texel), 1.0);
}`.trim();

// Based on: https://github.com/ondras/fastiles/blob/master/ts/scene.ts (v2.1.0)
const VERTICES_PER_TILE = 6;
class NotSupportedError extends Error {
    constructor(...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        // @ts-ignore
        if (Error.captureStackTrace) {
            // @ts-ignore
            Error.captureStackTrace(this, NotSupportedError);
        }
        this.name = 'NotSupportedError';
    }
}
class BaseCanvas {
    constructor(options) {
        this._renderRequested = false;
        this._autoRender = true;
        this._width = 50;
        this._height = 25;
        if (!options.glyphs)
            throw new Error('You must supply glyphs for the canvas.');
        this._node = this._createNode();
        this._createContext();
        this._configure(options);
    }
    get node() { return this._node; }
    get width() { return this._width; }
    get height() { return this._height; }
    get tileWidth() { return this._glyphs.tileWidth; }
    get tileHeight() { return this._glyphs.tileHeight; }
    get pxWidth() { return this.node.clientWidth; }
    get pxHeight() { return this.node.clientHeight; }
    get glyphs() { return this._glyphs; }
    set glyphs(glyphs) {
        this._setGlyphs(glyphs);
    }
    _createNode() {
        return document.createElement("canvas");
    }
    _configure(options) {
        this._width = options.width || this._width;
        this._height = options.height || this._height;
        this._autoRender = (options.render !== false);
        this._setGlyphs(options.glyphs);
        if (options.div) {
            let el;
            if (typeof options.div === 'string') {
                el = document.getElementById(options.div);
                if (!el) {
                    console.warn('Failed to find parent element by ID: ' + options.div);
                }
            }
            else {
                el = options.div;
            }
            if (el && el.appendChild) {
                el.appendChild(this.node);
            }
        }
    }
    _setGlyphs(glyphs) {
        if (glyphs === this._glyphs)
            return false;
        this._glyphs = glyphs;
        this.resize(this._width, this._height);
        return true;
    }
    resize(width, height) {
        this._width = width;
        this._height = height;
        const node = this.node;
        node.width = this._width * this.tileWidth;
        node.height = this._height * this.tileHeight;
    }
    draw(x, y, glyph, fg, bg) {
        glyph = glyph & 0xFF;
        bg = bg & 0xFFF;
        fg = fg & 0xFFF;
        const style = (glyph * (1 << 24)) + (bg * (1 << 12)) + fg;
        this._set(x, y, style);
    }
    _requestRender() {
        if (this._renderRequested)
            return;
        this._renderRequested = true;
        if (!this._autoRender)
            return;
        requestAnimationFrame(() => this.render());
    }
    _set(x, y, style) {
        let index = y * this.width + x;
        const current = this._data[index];
        if (current !== style) {
            this._data[index] = style;
            this._requestRender();
            return true;
        }
        return false;
    }
    copy(buffer) {
        this._data.set(buffer.data);
        this._requestRender();
    }
    copyTo(buffer) {
        buffer.data.set(this._data);
    }
    hasXY(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }
    toX(x) {
        return Math.floor(this.width * x / this.node.clientWidth);
    }
    toY(y) {
        return Math.floor(this.height * y / this.node.clientHeight);
    }
}
class Canvas extends BaseCanvas {
    constructor(options) {
        super(options);
    }
    _createContext() {
        let gl = this.node.getContext("webgl2");
        if (!gl) {
            throw new NotSupportedError("WebGL 2 not supported");
        }
        this._gl = gl;
        this._buffers = {};
        this._attribs = {};
        this._uniforms = {};
        const p = createProgram(gl, VS, FS);
        gl.useProgram(p);
        const attributeCount = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attributeCount; i++) {
            gl.enableVertexAttribArray(i);
            let info = gl.getActiveAttrib(p, i);
            this._attribs[info.name] = i;
        }
        const uniformCount = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let info = gl.getActiveUniform(p, i);
            this._uniforms[info.name] = gl.getUniformLocation(p, info.name);
        }
        gl.uniform1i(this._uniforms["font"], 0);
        this._texture = createTexture(gl);
    }
    _createGeometry() {
        const gl = this._gl;
        this._buffers.position && gl.deleteBuffer(this._buffers.position);
        this._buffers.uv && gl.deleteBuffer(this._buffers.uv);
        let buffers = createGeometry(gl, this._attribs, this.width, this.height);
        Object.assign(this._buffers, buffers);
    }
    _createData() {
        const gl = this._gl;
        const attribs = this._attribs;
        const tileCount = this.width * this.height;
        this._buffers.style && gl.deleteBuffer(this._buffers.style);
        this._data = new Uint32Array(tileCount * VERTICES_PER_TILE);
        const style = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, style);
        gl.vertexAttribIPointer(attribs["style"], 1, gl.UNSIGNED_INT, 0, 0);
        Object.assign(this._buffers, { style });
    }
    _setGlyphs(glyphs) {
        if (!super._setGlyphs(glyphs))
            return false;
        const gl = this._gl;
        const uniforms = this._uniforms;
        gl.uniform2uiv(uniforms["tileSize"], [this.tileWidth, this.tileHeight]);
        this._uploadGlyphs();
        return true;
    }
    _uploadGlyphs() {
        if (!this._glyphs.needsUpdate)
            return;
        const gl = this._gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._glyphs.node);
        this._requestRender();
        this._glyphs.needsUpdate = false;
    }
    resize(width, height) {
        super.resize(width, height);
        const gl = this._gl;
        const uniforms = this._uniforms;
        gl.viewport(0, 0, this.node.width, this.node.height);
        gl.uniform2ui(uniforms["viewportSize"], this.node.width, this.node.height);
        this._createGeometry();
        this._createData();
    }
    _set(x, y, style) {
        let index = y * this.width + x;
        index *= VERTICES_PER_TILE;
        const current = this._data[index + 2];
        if (current !== style) {
            this._data[index + 2] = style;
            this._data[index + 5] = style;
            this._requestRender();
            return true;
        }
        return false;
    }
    copy(buffer) {
        buffer.data.forEach((style, i) => {
            const index = i * VERTICES_PER_TILE;
            this._data[index + 2] = style;
            this._data[index + 5] = style;
        });
        this._requestRender();
    }
    copyTo(buffer) {
        const n = this.width * this.height;
        const dest = buffer.data;
        for (let i = 0; i < n; ++i) {
            const index = i * VERTICES_PER_TILE;
            dest[i] = this._data[index + 2];
        }
    }
    render() {
        const gl = this._gl;
        if (this._glyphs.needsUpdate) { // auto keep glyphs up to date
            this._uploadGlyphs();
        }
        else if (!this._renderRequested) {
            return;
        }
        this._renderRequested = false;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.style);
        gl.bufferData(gl.ARRAY_BUFFER, this._data, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, this._width * this._height * VERTICES_PER_TILE);
    }
}
class Canvas2D extends BaseCanvas {
    constructor(options) {
        super(options);
    }
    _createContext() {
        const ctx = this.node.getContext('2d');
        if (!ctx) {
            throw new NotSupportedError('2d context not supported!');
        }
        this._ctx = ctx;
    }
    _set(x, y, style) {
        const result = super._set(x, y, style);
        if (result) {
            this._changed[y * this.width + x] = 1;
        }
        return result;
    }
    resize(width, height) {
        super.resize(width, height);
        this._data = new Uint32Array(width * height);
        this._changed = new Int8Array(width * height);
    }
    copy(buffer) {
        for (let i = 0; i < this._data.length; ++i) {
            if (this._data[i] !== buffer.data[i]) {
                this._data[i] = buffer.data[i];
                this._changed[i] = 1;
            }
        }
        this._requestRender();
    }
    render() {
        this._renderRequested = false;
        for (let i = 0; i < this._changed.length; ++i) {
            if (this._changed[i])
                this._renderCell(i);
            this._changed[i] = 0;
        }
    }
    _renderCell(index) {
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        const style = this._data[index];
        const glyph = (style / (1 << 24)) >> 0;
        const bg = (style >> 12) & 0xFFF;
        const fg = (style & 0xFFF);
        const px = x * this.tileWidth;
        const py = y * this.tileHeight;
        const gx = (glyph % 16) * this.tileWidth;
        const gy = Math.floor(glyph / 16) * this.tileHeight;
        // this._ctx.fillStyle = '#' + bg.toString(16).padStart(3, '0');
        // this._ctx.fillRect(px, py, this.tileWidth, this.tileHeight);
        // 
        // this._ctx.fillStyle = '#' + fg.toString(16).padStart(3, '0');
        // this._ctx.drawImage(this.glyphs.node, gx, gy, this.tileWidth, this.tileHeight, px, py, this.tileWidth, this.tileHeight);
        const d = this.glyphs.ctx.getImageData(gx, gy, this.tileWidth, this.tileHeight);
        for (let di = 0; di < d.width * d.height; ++di) {
            const src = (d.data[di * 4] > 127) ? fg : bg;
            d.data[di * 4 + 0] = ((src & 0xF00) >> 8) * 17;
            d.data[di * 4 + 1] = ((src & 0xF0) >> 4) * 17;
            d.data[di * 4 + 2] = (src & 0xF) * 17;
            d.data[di * 4 + 3] = 255; // not transparent anymore
        }
        this._ctx.putImageData(d, px, py);
    }
}

class Glyphs {
    constructor(opts = {}) {
        this._tileWidth = 12;
        this._tileHeight = 16;
        this.needsUpdate = true;
        this._map = {};
        opts.font = opts.font || 'monospace';
        this._node = document.createElement('canvas');
        this._ctx = this.node.getContext('2d');
        this._configure(opts);
    }
    static fromImage(src) {
        if (typeof src === 'string') {
            if (src.startsWith('data:'))
                throw new Error('Glyph: You must load a data string into an image element and use that.');
            const el = document.getElementById(src);
            if (!el)
                throw new Error('Glyph: Failed to find image element with id:' + src);
            src = el;
        }
        const glyph = new this({ tileWidth: src.width / 16, tileHeight: src.height / 16 });
        glyph._ctx.drawImage(src, 0, 0);
        return glyph;
    }
    static fromFont(src) {
        if (typeof src === 'string') {
            src = { font: src };
        }
        const glyphs = new this(src);
        const basicOnly = src.basicOnly || src.basic || false;
        glyphs._initGlyphs(basicOnly);
        return glyphs;
    }
    get node() { return this._node; }
    get ctx() { return this._ctx; }
    get tileWidth() { return this._tileWidth; }
    get tileHeight() { return this._tileHeight; }
    get pxWidth() { return this._node.width; }
    get pxHeight() { return this._node.height; }
    forChar(ch) {
        if (ch === null || ch === undefined)
            return -1;
        return this._map[ch] || -1;
    }
    _configure(opts) {
        this._tileWidth = opts.tileWidth || this.tileWidth;
        this._tileHeight = opts.tileHeight || this.tileHeight;
        this.node.width = 16 * this.tileWidth;
        this.node.height = 16 * this.tileHeight;
        this._ctx.fillStyle = 'black';
        this._ctx.fillRect(0, 0, this.pxWidth, this.pxHeight);
        const size = opts.fontSize || opts.size || Math.max(this.tileWidth, this.tileHeight);
        this._ctx.font = '' + size + 'px ' + opts.font;
        this._ctx.textAlign = 'center';
        this._ctx.textBaseline = 'middle';
        this._ctx.fillStyle = 'white';
    }
    draw(n, ch) {
        if (n > 256)
            throw new Error('Cannot draw more than 256 glyphs.');
        const x = (n % 16) * this.tileWidth;
        const y = Math.floor(n / 16) * this.tileHeight;
        const cx = x + Math.floor(this.tileWidth / 2);
        const cy = y + Math.floor(this.tileHeight / 2);
        this._ctx.save();
        this._ctx.beginPath();
        this._ctx.rect(x, y, this.tileWidth, this.tileHeight);
        this._ctx.clip();
        if (typeof ch === 'function') {
            ch(this._ctx, x, y, this.tileWidth, this.tileHeight);
        }
        else {
            if (this._map[ch] === undefined)
                this._map[ch] = n;
            this._ctx.fillText(ch, cx, cy);
        }
        this._ctx.restore();
        this.needsUpdate = true;
    }
    _initGlyphs(basicOnly = false) {
        for (let i = 32; i < 127; ++i) {
            this.draw(i, String.fromCharCode(i));
        }
        if (!basicOnly) {
            [' ', '\u263a', '\u263b', '\u2665', '\u2666', '\u2663', '\u2660', '\u263c',
                '\u2600', '\u2605', '\u2606', '\u2642', '\u2640', '\u266a', '\u266b', '\u2638',
                '\u25b6', '\u25c0', '\u2195', '\u203c', '\u204b', '\u262f', '\u2318', '\u2616',
                '\u2191', '\u2193', '\u2192', '\u2190', '\u2126', '\u2194', '\u25b2', '\u25bc',
            ].forEach((ch, i) => {
                this.draw(i, ch);
            });
            // [
            // '\u2302',
            // '\u2b09', '\u272a', '\u2718', '\u2610', '\u2611', '\u25ef', '\u25ce', '\u2690',
            // '\u2691', '\u2598', '\u2596', '\u259d', '\u2597', '\u2744', '\u272d', '\u2727',
            // '\u25e3', '\u25e4', '\u25e2', '\u25e5', '\u25a8', '\u25a7', '\u259a', '\u265f',
            // '\u265c', '\u265e', '\u265d', '\u265b', '\u265a', '\u301c', '\u2694', '\u2692',
            // '\u25b6', '\u25bc', '\u25c0', '\u25b2', '\u25a4', '\u25a5', '\u25a6', '\u257a',
            // '\u257b', '\u2578', '\u2579', '\u2581', '\u2594', '\u258f', '\u2595', '\u272d',
            // '\u2591', '\u2592', '\u2593', '\u2503', '\u252b', '\u2561', '\u2562', '\u2556',
            // '\u2555', '\u2563', '\u2551', '\u2557', '\u255d', '\u255c', '\u255b', '\u2513',
            // '\u2517', '\u253b', '\u2533', '\u2523', '\u2501', '\u254b', '\u255e', '\u255f',
            // '\u255a', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256c', '\u2567',
            // '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256b',
            // '\u256a', '\u251b', '\u250f', '\u2588', '\u2585', '\u258c', '\u2590', '\u2580',
            // '\u03b1', '\u03b2', '\u0393', '\u03c0', '\u03a3', '\u03c3', '\u03bc', '\u03c4',
            // '\u03a6', '\u03b8', '\u03a9', '\u03b4', '\u221e', '\u03b8', '\u03b5', '\u03b7',
            // '\u039e', '\u00b1', '\u2265', '\u2264', '\u2234', '\u2237', '\u00f7', '\u2248',
            // '\u22c4', '\u22c5', '\u2217', '\u27b5', '\u2620', '\u2625', '\u25fc', '\u25fb'
            // ].forEach( (ch, i) => {
            //   this.draw(i + 127, ch); 
            // });
            ['\u2302',
                '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7',
                '\u00EA', '\u00EB', '\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5',
                '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9',
                '\u00FF', '\u00D6', '\u00DC', '\u00A2', '\u00A3', '\u00A5', '\u20A7', '\u0192',
                '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1', '\u00AA', '\u00BA',
                '\u00BF', '\u2310', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB',
                '\u2591', '\u2592', '\u2593', '\u2502', '\u2524', '\u2561', '\u2562', '\u2556',
                '\u2555', '\u2563', '\u2551', '\u2557', '\u255D', '\u255C', '\u255B', '\u2510',
                '\u2514', '\u2534', '\u252C', '\u251C', '\u2500', '\u253C', '\u255E', '\u255F',
                '\u255A', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256C', '\u2567',
                '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256B',
                '\u256A', '\u2518', '\u250C', '\u2588', '\u2584', '\u258C', '\u2590', '\u2580',
                '\u03B1', '\u00DF', '\u0393', '\u03C0', '\u03A3', '\u03C3', '\u00B5', '\u03C4',
                '\u03A6', '\u0398', '\u03A9', '\u03B4', '\u221E', '\u03C6', '\u03B5', '\u2229',
                '\u2261', '\u00B1', '\u2265', '\u2264', '\u2320', '\u2321', '\u00F7', '\u2248',
                '\u00B0', '\u2219', '\u00B7', '\u221A', '\u207F', '\u00B2', '\u25A0', '\u00A0'
            ].forEach((ch, i) => {
                this.draw(i + 127, ch);
            });
        }
    }
}

var options = {
    random: Math.random.bind(Math),
    colorLookup: ((_) => null),
};
function configure(opts = {}) {
    Object.assign(options, opts);
}

function toColorInt(r = 0, g = 0, b = 0, base256 = false) {
    if (base256) {
        r = Math.max(0, Math.min(255, Math.round(r * 2.550001)));
        g = Math.max(0, Math.min(255, Math.round(g * 2.550001)));
        b = Math.max(0, Math.min(255, Math.round(b * 2.550001)));
        return (r << 16) + (g << 8) + b;
    }
    r = Math.max(0, Math.min(15, Math.round(r / 100 * 15)));
    g = Math.max(0, Math.min(15, Math.round(g / 100 * 15)));
    b = Math.max(0, Math.min(15, Math.round(b / 100 * 15)));
    return (r << 8) + (g << 4) + b;
}
class Color extends Int16Array {
    static fromArray(vals, base256 = false) {
        while (vals.length < 3)
            vals.push(0);
        if (base256) {
            for (let i = 0; i < 7; ++i) {
                vals[i] = Math.round((vals[i] || 0) * 100 / 255);
            }
        }
        return new this(...vals);
    }
    static fromCss(css) {
        if (!css.startsWith('#')) {
            throw new Error('Color CSS strings must be of form "#abc" or "#abcdef" - received: [' + css + ']');
        }
        const c = Number.parseInt(css.substring(1), 16);
        let r, g, b;
        if (css.length == 4) {
            r = Math.round((c >> 8) / 15 * 100);
            g = Math.round(((c & 0xF0) >> 4) / 15 * 100);
            b = Math.round((c & 0xF) / 15 * 100);
        }
        else {
            r = Math.round((c >> 16) / 255 * 100);
            g = Math.round(((c & 0xFF00) >> 8) / 255 * 100);
            b = Math.round((c & 0xFF) / 255 * 100);
        }
        return new this(r, g, b);
    }
    static fromNumber(val, base256 = false) {
        const c = new this();
        for (let i = 0; i < c.length; ++i) {
            c[i] = 0;
        }
        if (val < 0) {
            c._r = -1;
        }
        else if (base256 || (val > 0xFFF)) {
            c._r = Math.round(((val & 0xFF0000) >> 16) * 100 / 255);
            c._g = Math.round(((val & 0xFF00) >> 8) * 100 / 255);
            c._b = Math.round((val & 0xFF) * 100 / 255);
        }
        else {
            c._r = Math.round(((val & 0xF00) >> 8) * 100 / 15);
            c._g = Math.round(((val & 0xF0) >> 4) * 100 / 15);
            c._b = Math.round((val & 0xF) * 100 / 15);
        }
        return c;
    }
    static make(arg, base256 = false) {
        if ((arg === undefined) || (arg === null))
            return new this(-1);
        if (arg instanceof Color) {
            return arg.clone();
        }
        if (typeof arg === 'string') {
            const l = options.colorLookup(arg);
            if (l)
                return l.clone();
            return this.fromCss(arg);
        }
        else if (Array.isArray(arg)) {
            return this.fromArray(arg, base256);
        }
        else if (typeof arg === 'number') {
            if (arg < 0)
                return new this(-1);
            return this.fromNumber(arg, base256);
        }
        throw new Error('Failed to make color - unknown argument: ' + JSON.stringify(arg));
    }
    static from(...args) {
        const arg = args[0];
        if (arg instanceof Color)
            return arg;
        if (arg < 0)
            return new this(-1);
        if (typeof arg === 'string') {
            const l = options.colorLookup(arg);
            if (l)
                return l;
        }
        return this.make(arg, args[1]);
    }
    constructor(r = -1, g = 0, b = 0, rand = 0, redRand = 0, greenRand = 0, blueRand = 0) {
        super(7);
        this.set([r, g, b, rand, redRand, greenRand, blueRand]);
    }
    get r() { return Math.round(this[0] * 2.550001); }
    get _r() { return this[0]; }
    set _r(v) { this[0] = v; }
    get g() { return Math.round(this[1] * 2.550001); }
    get _g() { return this[1]; }
    set _g(v) { this[1] = v; }
    get b() { return Math.round(this[2] * 2.550001); }
    get _b() { return this[2]; }
    set _b(v) { this[2] = v; }
    get _rand() { return this[3]; }
    get _redRand() { return this[4]; }
    get _greenRand() { return this[5]; }
    get _blueRand() { return this[6]; }
    // luminosity (0-100)
    get l() {
        return Math.round(0.5 * (Math.min(this._r, this._g, this._b) + Math.max(this._r, this._g, this._b)));
    }
    // saturation (0-100)
    get s() {
        if (this.l >= 100)
            return 0;
        return Math.round((Math.max(this._r, this._g, this._b) - Math.min(this._r, this._g, this._b)) * (100 - Math.abs(this.l * 2 - 100)) / 100);
    }
    // hue (0-360)
    get h() {
        let H = 0;
        let R = this.r;
        let G = this.g;
        let B = this.b;
        if (R >= G && G >= B) {
            H = 60 * ((G - B) / (R - B));
        }
        else if (G > R && R >= B) {
            H = 60 * (2 - (R - B) / (G - B));
        }
        else if (G >= B && B > R) {
            H = 60 * (2 + (B - R) / (G - R));
        }
        else if (B > G && G > R) {
            H = 60 * (4 - (G - R) / (B - R));
        }
        else if (B > R && R >= G) {
            H = 60 * (4 + (R - G) / (B - G));
        }
        else {
            H = 60 * (6 - (B - G) / (R - G));
        }
        return Math.round(H);
    }
    isNull() { return this._r < 0; }
    equals(other) {
        if (typeof other === 'string') {
            return (other.length > 4) ? (this.toString(true) == other) : (this.toString() == other);
        }
        else if (typeof other === 'number') {
            return (this.toInt() == other) || (this.toInt(true) == other);
        }
        const O = Color.from(other);
        if (this.isNull())
            return O.isNull();
        return this.every((v, i) => {
            return v == (O[i] || 0);
        });
    }
    copy(other) {
        if (Array.isArray(other)) {
            this.set(other);
        }
        else {
            const O = Color.from(other);
            this.set(O);
        }
        return this;
    }
    _changed() {
        return this;
    }
    clone() {
        // @ts-ignore
        const other = new this.constructor();
        other.copy(this);
        return other;
    }
    assign(_r = -1, _g = 0, _b = 0, _rand = 0, _redRand = 0, _greenRand = 0, _blueRand = 0) {
        for (let i = 0; i < this.length; ++i) {
            this[i] = (arguments[i] || 0);
        }
        return this;
    }
    assignRGB(_r = -1, _g = 0, _b = 0, _rand = 0, _redRand = 0, _greenRand = 0, _blueRand = 0) {
        for (let i = 0; i < this.length; ++i) {
            this[i] = Math.round((arguments[i] || 0) / 2.55);
        }
        return this;
    }
    nullify() {
        this[0] = -1;
        return this;
    }
    blackOut() {
        for (let i = 0; i < this.length; ++i) {
            this[i] = 0;
        }
        return this;
    }
    toInt(base256 = false) {
        if (this.isNull())
            return -1;
        return toColorInt(this._r, this._g, this._b, base256);
    }
    clamp() {
        if (this.isNull())
            return this;
        this._r = Math.min(100, Math.max(0, this._r));
        this._g = Math.min(100, Math.max(0, this._g));
        this._b = Math.min(100, Math.max(0, this._b));
        return this._changed();
    }
    mix(other, percent) {
        const O = Color.from(other);
        if (O.isNull())
            return this;
        if (this.isNull()) {
            this.blackOut();
        }
        percent = Math.min(100, Math.max(0, percent));
        const keepPct = 100 - percent;
        for (let i = 0; i < this.length; ++i) {
            this[i] = Math.round(((this[i] * keepPct) + (O[i] * percent)) / 100);
        }
        return this._changed();
    }
    // Only adjusts r,g,b
    lighten(percent) {
        if (this.isNull())
            return this;
        percent = Math.min(100, Math.max(0, percent));
        if (percent <= 0)
            return;
        const keepPct = 100 - percent;
        for (let i = 0; i < 3; ++i) {
            this[i] = Math.round(((this[i] * keepPct) + (100 * percent)) / 100);
        }
        return this._changed();
    }
    // Only adjusts r,g,b
    darken(percent) {
        if (this.isNull())
            return this;
        percent = Math.min(100, Math.max(0, percent));
        if (percent <= 0)
            return;
        const keepPct = 100 - percent;
        for (let i = 0; i < 3; ++i) {
            this[i] = Math.round(((this[i] * keepPct) + (0 * percent)) / 100);
        }
        return this._changed();
    }
    bake() {
        if (this.isNull())
            return this;
        const d = this;
        if (d[3] + d[4] + d[5] + d[6]) {
            const rand = this._rand ? Math.floor(options.random() * this._rand) : 0;
            const redRand = this._redRand ? Math.floor(options.random() * this._redRand) : 0;
            const greenRand = this._greenRand ? Math.floor(options.random() * this._greenRand) : 0;
            const blueRand = this._blueRand ? Math.floor(options.random() * this._blueRand) : 0;
            this._r += (rand + redRand);
            this._g += (rand + greenRand);
            this._b += (rand + blueRand);
            for (let i = 3; i < this.length; ++i) {
                this[i] = 0;
            }
            return this._changed();
        }
        return this;
    }
    // Adds a color to this one
    add(other, percent = 100) {
        const O = Color.from(other);
        if (O.isNull())
            return this;
        if (this.isNull()) {
            this.blackOut();
        }
        for (let i = 0; i < this.length; ++i) {
            this[i] += Math.round(O[i] * percent / 100);
        }
        return this._changed();
    }
    scale(percent) {
        if (this.isNull() || percent == 100)
            return this;
        percent = Math.max(0, percent);
        for (let i = 0; i < this.length; ++i) {
            this[i] = Math.round(this[i] * percent / 100);
        }
        return this._changed();
    }
    multiply(other) {
        if (this.isNull())
            return this;
        let data = other;
        if (!Array.isArray(other)) {
            if (other.isNull())
                return this;
            data = other;
        }
        const len = Math.max(3, Math.min(this.length, data.length));
        for (let i = 0; i < len; ++i) {
            this[i] = Math.round(this[i] * (data[i] || 0) / 100);
        }
        return this._changed();
    }
    // scales rgb down to a max of 100
    normalize() {
        if (this.isNull())
            return this;
        const max = Math.max(this._r, this._g, this._b);
        if (max <= 100)
            return this;
        this._r = Math.round(100 * this._r / max);
        this._g = Math.round(100 * this._g / max);
        this._b = Math.round(100 * this._b / max);
        return this._changed();
    }
    css(base256 = false) {
        const d = this;
        let v = 0;
        if (d[3] + d[4] + d[5] + d[6]) {
            const rand = this._rand ? Math.floor(options.random() * this._rand) : 0;
            const redRand = this._redRand ? Math.floor(options.random() * this._redRand) : 0;
            const greenRand = this._greenRand ? Math.floor(options.random() * this._greenRand) : 0;
            const blueRand = this._blueRand ? Math.floor(options.random() * this._blueRand) : 0;
            const red = (this._r + rand + redRand);
            const green = (this._g + rand + greenRand);
            const blue = (this._b + rand + blueRand);
            v = toColorInt(red, green, blue, base256);
        }
        else {
            v = this.toInt(base256);
        }
        return '#' + v.toString(16).padStart(base256 ? 6 : 3, '0');
    }
    toString(base256 = false) {
        if (this.isNull())
            return 'null color';
        return '#' + this.toInt(base256).toString(16).padStart(base256 ? 6 : 3, '0');
    }
    // adjusts the luminosity of 2 colors to ensure there is enough separation between them
    static separate(a, b) {
        if (a.isNull() || b.isNull())
            return;
        const A = a.clone().clamp();
        const B = b.clone().clamp();
        // console.log('separate');
        // console.log('- a=%s, h=%d, s=%d, l=%d', A.toString(), A.h, A.s, A.l);
        // console.log('- b=%s, h=%d, s=%d, l=%d', B.toString(), B.h, B.s, B.l);
        let hDiff = Math.abs(A.h - B.h);
        if (hDiff > 180) {
            hDiff = 360 - hDiff;
        }
        if (hDiff > 45)
            return; // colors are far enough apart in hue to be distinct
        const dist = 40;
        if (Math.abs(A.l - B.l) >= dist)
            return;
        // Get them sorted by saturation ( we will darken the more saturated color and lighten the other)
        const [lo, hi] = [A, B].sort((a, b) => a.s - b.s);
        // console.log('- lo=%s, hi=%s', lo.toString(), hi.toString());
        while ((hi.l - lo.l) < dist) {
            hi.mix(WHITE, 5);
            lo.mix(BLACK, 5);
        }
        a.copy(A);
        b.copy(B);
        // console.log('=>', a.toString(), b.toString());
    }
}
const BLACK = new Color(0, 0, 0);
const WHITE = new Color(100, 100, 100);

class DataBuffer {
    constructor(width, height) {
        this._width = width;
        this._height = height;
        this._data = new Uint32Array(width * height);
    }
    get data() { return this._data; }
    get width() { return this._width; }
    get height() { return this._height; }
    get(x, y) {
        let index = y * this.width + x;
        const style = this._data[index] || 0;
        const glyph = (style >> 24);
        const bg = (style >> 12) & 0xFFF;
        const fg = (style & 0xFFF);
        return { glyph, fg, bg };
    }
    _toGlyph(ch) {
        if (ch === null || ch === undefined)
            return -1;
        return ch.charCodeAt(0);
    }
    draw(x, y, glyph = -1, fg = -1, bg = -1) {
        let index = y * this.width + x;
        const current = this._data[index] || 0;
        if (typeof glyph !== 'number') {
            glyph = this._toGlyph(glyph);
        }
        if (typeof fg !== 'number') {
            fg = Color.from(fg).toInt();
        }
        if (typeof bg !== 'number') {
            bg = Color.from(bg).toInt();
        }
        glyph = (glyph >= 0) ? (glyph & 0xFF) : (current >> 24);
        bg = (bg >= 0) ? (bg & 0xFFF) : ((current >> 12) & 0xFFF);
        fg = (fg >= 0) ? (fg & 0xFFF) : (current & 0xFFF);
        const style = (glyph << 24) + (bg << 12) + fg;
        this._data[index] = style;
        return this;
    }
    // This is without opacity - opacity must be done in Mixer
    drawSprite(x, y, sprite) {
        const glyph = sprite.ch ? sprite.ch : sprite.glyph;
        // const fg = sprite.fg ? sprite.fg.toInt() : -1;
        // const bg = sprite.bg ? sprite.bg.toInt() : -1;
        return this.draw(x, y, glyph, sprite.fg, sprite.bg);
    }
    blackOut(x, y) {
        if (arguments.length == 0) {
            return this.fill(0, 0, 0);
        }
        return this.draw(x, y, 0, 0, 0);
    }
    fill(glyph = 0, fg = 0xFFF, bg = 0) {
        if (typeof glyph == 'string') {
            glyph = this._toGlyph(glyph);
        }
        glyph = glyph & 0xFF;
        fg = fg & 0xFFF;
        bg = bg & 0xFFF;
        const style = (glyph << 24) + (bg << 12) + fg;
        this._data.fill(style);
        return this;
    }
    copy(other) {
        this._data.set(other._data);
        return this;
    }
}
class Buffer extends DataBuffer {
    constructor(canvas) {
        super(canvas.width, canvas.height);
        this._canvas = canvas;
        canvas.copyTo(this);
    }
    // get canvas() { return this._canvas; }
    _toGlyph(ch) {
        return this._canvas.glyphs.forChar(ch);
    }
    render() {
        this._canvas.copy(this);
        return this;
    }
    copyFromCanvas() {
        this._canvas.copyTo(this);
        return this;
    }
}

class Mixer {
    constructor() {
        this.ch = -1;
        this.fg = new Color();
        this.bg = new Color();
    }
    _changed() {
        return this;
    }
    copy(other) {
        this.ch = other.ch;
        this.fg.copy(other.fg);
        this.bg.copy(other.bg);
        return this._changed();
    }
    clone() {
        const other = new Mixer();
        other.copy(this);
        return other;
    }
    nullify() {
        this.ch = -1;
        this.fg.nullify();
        this.bg.nullify();
        return this._changed();
    }
    blackOut() {
        this.ch = 0;
        this.fg.blackOut();
        this.bg.blackOut();
        return this._changed();
    }
    draw(ch = -1, fg = -1, bg = -1) {
        if (ch && (ch !== -1)) {
            this.ch = ch;
        }
        if ((fg !== -1) && (fg !== null)) {
            fg = Color.from(fg);
            this.fg.copy(fg);
        }
        if ((bg !== -1) && (bg !== null)) {
            bg = Color.from(bg);
            this.bg.copy(bg);
        }
        return this._changed();
    }
    drawSprite(info, opacity) {
        if (opacity === undefined)
            opacity = info.opacity;
        if (opacity === undefined)
            opacity = 100;
        if (opacity <= 0)
            return;
        if (info.ch)
            this.ch = info.ch;
        else if (info.glyph !== undefined)
            this.ch = info.glyph;
        if (info.fg)
            this.fg.mix(info.fg, opacity);
        if (info.bg)
            this.bg.mix(info.bg, opacity);
        return this._changed();
    }
    invert() {
        [this.bg, this.fg] = [this.fg, this.bg];
        return this._changed();
    }
    multiply(color, fg = true, bg = true) {
        color = Color.from(color);
        if (fg) {
            this.fg.multiply(color);
        }
        if (bg) {
            this.bg.multiply(color);
        }
        return this._changed();
    }
    mix(color, fg = 50, bg = fg) {
        color = Color.from(color);
        if (fg > 0) {
            this.fg.mix(color, fg);
        }
        if (bg > 0) {
            this.bg.mix(color, bg);
        }
        return this._changed();
    }
    add(color, fg = 100, bg = fg) {
        color = Color.from(color);
        if (fg > 0) {
            this.fg.add(color, fg);
        }
        if (bg > 0) {
            this.bg.add(color, bg);
        }
        return this._changed();
    }
    separate() {
        Color.separate(this.fg, this.bg);
        return this._changed();
    }
    bake() {
        this.fg.bake();
        this.bg.bake();
        this._changed();
        return {
            ch: this.ch,
            fg: this.fg.toInt(),
            bg: this.bg.toInt(),
        };
    }
}

configure({
  colorLookup(name) {
    return colors[name] || null
  },
});


class Color$1 extends Color {
  constructor(...args) {
    super(...args);
    this.id = null;
    this.dances = !!args[7];
  }

  copy(other) {
    this.dances = other.dances;
    this.id = other.id;
    return super.copy(other);
  }

  _changed() {
    this.id = null;
    return this;
  }

  // fromInt(val, base256) {
  //   this.dances = false;
  //   return super.fromInt(val, base256);
  // }

  mix(other, pct) {
    this.dances = this.dances || other.dances;
    return super.mix(other, pct);
  }

  add(other, pct) {
    this.dances = this.dances || other.dances;
    return super.add(other, pct);
  }

  toString(...args) {
    if (this.id) return this.id;
    return super.toString(...args);
  }
}


const separate = Color$1.separate.bind(Color$1);

types.Color = Color$1;


function make$2(...args) {
  if (args.length == 0) return new Color$1(0,0,0);
  if (args.length == 1 && typeof args[0] === 'string') {
    const color = colors[args[0]];
    if (color) return color.clone();
  }
  if (args.length >= 3) {
    return Color$1.make(args);
  }
  return Color$1.make(...args);
}

make.color = make$2;




function from(arg, base256) {
  if (typeof arg === 'string') {
    const color = colors[arg];
    if (color) return color;
  }
  if (arg instanceof Color$1) {
    return arg;
  }
  return Color$1.from(arg, base256);
}

function addKind(name, ...args) {
  let color;
  if (args.length == 1 && args[0] instanceof Color$1) {
    color = args[0];
  }
  else {
    color = make$2(...args);
  }
	colors[name] = color;
  color.id = name;
	return color;
}


function swap(color1, color2) {
    const tempColor = color1.clone();
    color1.copy(color2);
    color2.copy(tempColor);
}

// weighted sum of the squares of the component differences. Weights are according to color perception.
function diff(f, b)		 {
  return ((f._r - b._r) * (f._r - b._r) * 0.2126
    + (f._g - b._g) * (f._g - b._g) * 0.7152
    + (f._b - b._b) * (f._b - b._b) * 0.0722);
}



function addSpread(name, r, g, b) {
	let baseColor;
	baseColor = addKind(name, r, g, b);
	addKind('light_' + name, baseColor.clone().lighten(25));
	addKind('lighter_' + name, baseColor.clone().lighten(50));
	addKind('lightest_' + name, baseColor.clone().lighten(75));
	addKind('dark_' + name, baseColor.clone().darken(25));
	addKind('darker_' + name, baseColor.clone().darken(50));
	addKind('darkest_' + name, baseColor.clone().darken(75));
	return baseColor;
}


addKind('white', 				100,	100,	100);
addKind('black', 				0,		0,		0);

addSpread('teal', 				30,		100,	100);
addSpread('brown', 			60,		40,		0);
addSpread('tan', 		    80,		70,   55); // 80, 67,		15);
addSpread('pink', 				100,	60,		66);
addSpread('gray', 				50,		50,		50);
addSpread('yellow', 			100,	100,	0);
addSpread('purple', 			100,	0,		100);
addSpread('green', 			0,		100,	0);
addSpread('orange', 			100,	50,		0);
addSpread('blue', 				0,		0,		100);
addSpread('red', 				100,	0,		0);

addSpread('amber', 			100,  75,   0);
addSpread('flame', 			100,  25,   0);
addSpread('fuchsia', 		100,  0,    100);
addSpread('magenta', 		100,  0,    75);
addSpread('crimson', 		100,  0,    25);
addSpread('lime', 			  75,   100,  0);
addSpread('chartreuse',  50,   100,  0);
addSpread('sepia', 			50,   40,   25);
addSpread('violet', 		  50,   0,    100);
addSpread('han', 				25,   0,    100);
addSpread('cyan', 			  0,    100,  100);
addSpread('turquoise', 	0,    100,  75);
addSpread('sea', 				0,    100,  50);
addSpread('sky', 				0,    75,   100);
addSpread('azure', 			0,    50,   100);
addSpread('silver',      75,   75,   75);
addSpread('gold',        100,  85,   0);

var color = {
  __proto__: null,
  Color: Color$1,
  separate: separate,
  make: make$2,
  from: from,
  addKind: addKind,
  swap: swap,
  diff: diff,
  addSpread: addSpread
};

var options$1 = {
    colorStart: 'Ω',
    colorEnd: '∆',
    field: '§',
    defaultFg: null,
    defaultBg: null,
};
// const RE_RGB = /^[a-fA-F0-9]*$/;
// 
// export function parseColor(color:string) {
//   if (color.startsWith('#')) {
//     color = color.substring(1);
//   }
//   else if (color.startsWith('0x')) {
//     color = color.substring(2);
//   }
//   if (color.length == 3) {
//     if (RE_RGB.test(color)) {
//       return Number.parseInt(color, 16);
//     }
//   }
//   if (color.length == 6) {
//     if (RE_RGB.test(color)) {
//       const v = Number.parseInt(color, 16);
//       const r = Math.round( ((v & 0xFF0000) >> 16) / 17);
//       const g = Math.round( ((v & 0xFF00) >> 8) / 17);
//       const b = Math.round((v & 0xFF) / 17);
//       return (r << 8) + (g << 4) + b;
//     }
//   }
//   return 0xFFF;
// }
var helpers = {
    eachColor: (() => { }),
    default: ((name, _, value) => {
        if (value !== undefined)
            return `${value}.!!${name}!!`;
        return `!!${name}!!`;
    }),
};
function addHelper(name, fn) {
    helpers[name] = fn;
}

function compile(template) {
    const F = options$1.field;
    const parts = template.split(F);
    const sections = parts.map((part, i) => {
        if (i % 2 == 0)
            return textSegment(part);
        if (part.length == 0)
            return textSegment(F);
        return makeVariable(part);
    });
    return function (args = {}) {
        return sections.map((f) => f(args)).join('');
    };
}
function textSegment(value) {
    return (() => value);
}
function baseValue(name) {
    return function (args) {
        const h = helpers[name];
        if (h)
            return h(name, args);
        const v = args[name];
        if (v !== undefined)
            return v;
        return helpers.default(name, args);
    };
}
function fieldValue(name, source) {
    return function (args) {
        const obj = source(args);
        if (!obj)
            return helpers.default(name, args, obj);
        const value = obj[name];
        if (value === undefined)
            return helpers.default(name, args, obj);
        return value;
    };
}
function helperValue(name, source) {
    const helper = helpers[name] || helpers.default;
    if (!source) {
        return function (args) {
            return helper(name, args, undefined);
        };
    }
    return function (args) {
        const base = source(args);
        return helper(name, args, base);
    };
}
function stringFormat(format, source) {
    const data = /%(-?\d*)s/.exec(format) || [];
    const length = Number.parseInt(data[1] || '0');
    return function (args) {
        let text = '' + source(args);
        if (length < 0) {
            text = text.padEnd(-length);
        }
        else if (length) {
            text = text.padStart(length);
        }
        return text;
    };
}
function intFormat(format, source) {
    const data = /%([\+-]*)(\d*)d/.exec(format) || [];
    let length = Number.parseInt(data[2] || '0');
    const wantSign = data[1].includes('+');
    const left = data[1].includes('-');
    return function (args) {
        const value = Number.parseInt(source(args) || 0);
        let text = '' + value;
        if (value > 0 && wantSign) {
            text = '+' + text;
        }
        if (length && left) {
            return text.padEnd(length);
        }
        else if (length) {
            return text.padStart(length);
        }
        return text;
    };
}
function floatFormat(format, source) {
    const data = /%([\+-]*)(\d*)(\.(\d+))?f/.exec(format) || [];
    let length = Number.parseInt(data[2] || '0');
    const wantSign = data[1].includes('+');
    const left = data[1].includes('-');
    const fixed = Number.parseInt(data[4]) || 0;
    return function (args) {
        const value = Number.parseFloat(source(args) || 0);
        let text;
        if (fixed) {
            text = value.toFixed(fixed);
        }
        else {
            text = '' + value;
        }
        if (value > 0 && wantSign) {
            text = '+' + text;
        }
        if (length && left) {
            return text.padEnd(length);
        }
        else if (length) {
            return text.padStart(length);
        }
        return text;
    };
}
function makeVariable(pattern) {
    const data = /((\w+) )?(\w+)(\.(\w+))?(%[\+\.\-\d]*[dsf])?/.exec(pattern) || [];
    const helper = data[2];
    const base = data[3];
    const field = data[5];
    const format = data[6];
    let result = baseValue(base);
    if (field && field.length) {
        result = fieldValue(field, result);
    }
    if (helper && helper.length) {
        result = helperValue(helper, result);
    }
    if (format && format.length) {
        if (format.endsWith('s')) {
            result = stringFormat(format, result);
        }
        else if (format.endsWith('d')) {
            result = intFormat(format, result);
        }
        else if (format.endsWith('f')) {
            result = floatFormat(format, result);
        }
    }
    return result;
}

function eachChar(text, fn, fg, bg) {
    text = '' + text; // force string
    if (!text || text.length == 0)
        return;
    const colors = [];
    const colorFn = helpers.eachColor;
    const ctx = {
        fg: (fg === undefined) ? options$1.defaultFg : fg,
        bg: (bg === undefined) ? options$1.defaultBg : bg,
    };
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    colorFn(ctx);
    let n = 0;
    for (let i = 0; i < text.length; ++i) {
        const ch = text[i];
        if (ch == CS) {
            let j = i + 1;
            while (j < text.length && text[j] != CS) {
                ++j;
            }
            if (j == text.length) {
                console.warn('Reached end of string while seeking end of color start section.');
                console.warn('- text:', text);
                console.warn('- start @:', i);
                return; // reached end - done (error though)
            }
            if (j == i + 1) { // next char
                ++i; // fall through
            }
            else {
                colors.push([ctx.fg, ctx.bg]);
                const color = text.substring(i + 1, j);
                const newColors = color.split('|');
                ctx.fg = newColors[0] || ctx.fg;
                ctx.bg = newColors[1] || ctx.bg;
                colorFn(ctx);
                i = j;
                continue;
            }
        }
        else if (ch == CE) {
            if (text[i + 1] == CE) {
                ++i;
            }
            else {
                const c = colors.pop(); // if you pop too many times colors go away
                [ctx.fg, ctx.bg] = c || [null, null];
                // colorFn(ctx);
                continue;
            }
        }
        fn(ch, ctx.fg, ctx.bg, n, i);
        ++n;
    }
}

function length(text) {
    if (!text || text.length == 0)
        return 0;
    let len = 0;
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    for (let i = 0; i < text.length; ++i) {
        const ch = text[i];
        if (ch == CS) {
            const end = text.indexOf(CS, i + 1);
            i = end;
        }
        else if (ch == CE) ;
        else {
            ++len;
        }
    }
    return len;
}
function advanceChars(text, start, count) {
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    let i = start;
    while (count > 0) {
        const ch = text[i];
        if (ch === CS) {
            ++i;
            while (text[i] !== CS)
                ++i;
            ++i;
        }
        else if (ch === CE) {
            if (text[i + 1] === CE) {
                --count;
                ++i;
            }
            ++i;
        }
        else {
            --count;
            ++i;
        }
    }
    return i;
}
function firstChar(text) {
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        if (ch === CS) {
            if (text[i + 1] === CS)
                return CS;
            ++i;
            while (text[i] !== CS)
                ++i;
            ++i;
        }
        else if (ch === CE) {
            if (text[i + 1] === CE)
                return CE;
            ++i;
        }
        else {
            return ch;
        }
    }
    return null;
}
function center(text, width, pad = ' ') {
    const rawLen = text.length;
    const len = length(text);
    const padLen = width - len;
    if (padLen <= 0)
        return text;
    const left = Math.floor(padLen / 2);
    return text.padStart(rawLen + left, pad).padEnd(rawLen + padLen, pad);
}
function capitalize(text) {
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        if (ch == CS) {
            ++i;
            while (text[i] != CS && i < text.length) {
                ++i;
            }
            ++i;
        }
        else if (ch == CE) {
            ++i;
            while (text[i] == CS && i < text.length) {
                ++i;
            }
        }
        else {
            return text.substring(0, i) + ch.toUpperCase() + text.substring(i + 1);
        }
    }
    return text;
}
function removeColors(text) {
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    let out = '';
    let start = 0;
    for (let i = 0; i < text.length; ++i) {
        const k = text[i];
        if (k === CS) {
            if (text[i + 1] == CS) {
                ++i;
                continue;
            }
            out += text.substring(start, i);
            ++i;
            while (text[i] != CS && i < text.length) {
                ++i;
            }
            start = i + 1;
        }
        else if (k === CE) {
            if (text[i + 1] == CE) {
                ++i;
                continue;
            }
            out += text.substring(start, i);
            start = i + 1;
        }
    }
    if (start == 0)
        return text;
    out += text.substring(start);
    return out;
}

function nextBreak(text, start) {
    const CS = options$1.colorStart;
    const CE = options$1.colorEnd;
    let i = start;
    let l = 0;
    let count = true;
    while (i < text.length) {
        const ch = text[i];
        if (ch == ' ') {
            while (text[i + 1] == ' ') {
                ++i;
                ++l; // need to count the extra spaces as part of the word
            }
            return [i, l];
        }
        if (ch == '-') {
            return [i, l];
        }
        if (ch == '\n') {
            return [i, l];
        }
        if (ch == CS) {
            if (text[i + 1] == CS && count) {
                l += 1;
                i += 2;
                continue;
            }
            count = !count;
            ++i;
            continue;
        }
        else if (ch == CE) {
            if (text[i + 1] == CE) {
                l += 1;
                ++i;
            }
            i++;
            continue;
        }
        l += (count ? 1 : 0);
        ++i;
    }
    return [i, l];
}
function splice(text, start, len, add = '') {
    return text.substring(0, start) + add + text.substring(start + len);
}
function hyphenate(text, width, start, end, wordWidth, spaceLeftOnLine) {
    if (wordWidth + 1 > (width * 2)) {
        throw new Error('Cannot hyphenate - word length > 2 * width');
    }
    if ((spaceLeftOnLine < 4) || (spaceLeftOnLine + width < wordWidth)) {
        text = splice(text, start - 1, 1, '\n');
        spaceLeftOnLine = width;
    }
    if (spaceLeftOnLine + width > wordWidth) {
        // one hyphen...
        const hyphenAt = Math.min(Math.floor(wordWidth / 2), spaceLeftOnLine - 1);
        const w = advanceChars(text, start, hyphenAt);
        text = splice(text, w, 0, '-\n');
        return [text, end + 2];
    }
    if (width >= wordWidth) {
        return [text, end];
    }
    const hyphenAt = Math.min(wordWidth, width - 1);
    const w = advanceChars(text, start, hyphenAt);
    text = splice(text, w, 0, '-\n');
    return [text, end + 2];
}
function wordWrap(text, width, indent = 0) {
    if (!width)
        throw new Error('Need string and width');
    if (text.length < width)
        return text;
    if (length(text) < width)
        return text;
    if (text.indexOf('\n') == -1) {
        return wrapLine(text, width, indent);
    }
    const lines = text.split('\n');
    const split = lines.map((line, i) => wrapLine(line, width, (i ? indent : 0)));
    return split.join('\n');
}
// Returns the number of lines, including the newlines already in the text.
// Puts the output in "to" only if we receive a "to" -- can make it null and just get a line count.
function wrapLine(text, width, indent = 0) {
    if (text.length < width)
        return text;
    if (length(text) < width)
        return text;
    let spaceLeftOnLine = width;
    width = width - indent;
    let printString = text;
    // Now go through and replace spaces with newlines as needed.
    // console.log('wordWrap - ', text, width, indent);
    let removeSpace = true;
    let i = -1;
    while (i < printString.length) {
        // wordWidth counts the word width of the next word without color escapes.
        // w indicates the position of the space or newline or null terminator that terminates the word.
        let [w, wordWidth] = nextBreak(printString, i + (removeSpace ? 1 : 0));
        let hyphen = false;
        if (printString[w] == '-') {
            w++;
            wordWidth++;
            hyphen = true;
        }
        // console.log('- w=%d, width=%d, space=%d, word=%s', w, wordWidth, spaceLeftOnLine, printString.substring(i, w));
        if (wordWidth > width) {
            ([printString, w] = hyphenate(printString, width, i + 1, w, wordWidth, spaceLeftOnLine));
        }
        else if (wordWidth == spaceLeftOnLine) {
            const nl = (w < printString.length) ? '\n' : '';
            const remove = hyphen ? 0 : 1;
            printString = splice(printString, w, remove, nl); // [i] = '\n';
            w += (1 - remove); // if we change the length we need to advance our pointer
            spaceLeftOnLine = width;
        }
        else if (wordWidth > spaceLeftOnLine) {
            const remove = removeSpace ? 1 : 0;
            printString = splice(printString, i, remove, '\n'); // [i] = '\n';
            w += (1 - remove); // if we change the length we need to advance our pointer
            const extra = hyphen ? 0 : 1;
            spaceLeftOnLine = width - wordWidth - extra; // line width minus the width of the word we just wrapped and the space
            //printf("\n\n%s", printString);
        }
        else {
            const extra = hyphen ? 0 : 1;
            spaceLeftOnLine -= (wordWidth + extra);
        }
        removeSpace = !hyphen;
        i = w; // Advance to the terminator that follows the word.
    }
    return printString;
}

const playerPronoun = {
  it: 'you',
  its: 'your',
  you: 'you',
  your: 'your',
  he: 'you',
  she: 'you',
  his: 'your',
  hers: 'your',
};

const singularPronoun = {
  it: 'it',
  its: 'its',
  he: 'he',
  she: 'she',
  his: 'his',
  hers: 'hers',
};

const pluralPronoun = {
  it: 'them',
  its: 'their',
  he: 'them',
  she: 'them',
  his: 'their',
  hers: 'their',
};



function isVowel(ch) {
  return 'aeiouAEIOU'.includes(ch);
}


function toSingularVerb(verb) {
  if (verb === 'pickup') return 'picks up';
  if (verb === 'have') return 'has';
  if (verb.endsWith('y')) {
    if (!verb.endsWith('ay')) {
      return verb.substring(0, verb.length - 1) + 'ies';
    }
  }
  if (verb.endsWith('sh') || verb.endsWith('ch') || verb.endsWith('o') || verb.endsWith('s')) {
    return verb + 'es';
  }
  return verb + 's';
}


function toPluralVerb(verb) {
  if (verb === 'is') return 'are';
  if (verb === 'has') return 'have';
  if (verb.endsWith('ies')) {
    return verb.substring(0, verb.length - 3) + 'y';
  }
  if (verb.endsWith('es')) {
    return verb.substring(0, verb.length - 2);
  }
  return verb;
}


function toPluralNoun(noun, isPlural=true) {
  if (!isPlural) return noun.replace('~','');
  const place = noun.indexOf('~');
  if (place < 0) return toSingularVerb(noun);

  let wordStart = noun.lastIndexOf(' ', place);
  if (wordStart < 0) wordStart = 0;
  const word = noun.substring(wordStart, place);
  const newWord = toSingularVerb(word);

  return spliceRaw(noun, wordStart, place - wordStart + 1, newWord);
}


function spliceRaw(msg, begin, length, add='') {
  const preText = msg.substring(0, begin);
  const postText = msg.substring(begin + length);
  return preText + add + postText;
}


// Returns the number of lines, including the newlines already in the text.
// Puts the output in "to" only if we receive a "to" -- can make it null and just get a line count.
function splitIntoLines(sourceText, width, indent=0) {

  const CS = options$1.colorStart;
  const output = [];
  let text = wordWrap(sourceText, width, indent);

  let start = 0;
  let fg0 = null;
  let bg0 = null;
  eachChar(text, (ch, fg, bg, i, n) => {
    if (ch == '\n') {
      let color = (fg0 || bg0) ? `${CS}${fg0 ? fg0 : ''}${bg0 ? '|' + bg0 : ''}${CS}` : '';
      output.push(color + text.substring(start, n));
      start = n + 1;
      fg0 = fg;
      bg0 = bg;
    }
  });

  let color = (fg0 || bg0) ? `${CS}${fg0 ? fg0 : ''}${bg0 ? '|' + bg0 : ''}${CS}` : '';
  output.push(color + text.substring(start));

  return output;
}

addHelper('you', (name, args, value) => {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getName) return name;
  return actor.getName('the');
});

function nameHelper(name, args, value) {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getName) return name;
  return actor.getName(name);
}

addHelper('the', nameHelper);
addHelper('a', nameHelper);

function pronounHelper(name, args, value) {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getPronoun) return name;
  return actor.getPronoun(name);
}

addHelper('it', pronounHelper);
addHelper('your', pronounHelper);

// lookup verb
addHelper('verb', (name, args, value) => {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!args.verb) return '!!args.verb!!';
  if (!actor || !actor.getVerb) return args.verb;
  return actor.getVerb(args.verb);
});

// default - verbs
addHelper('default', (name, args, value) => {
  const actor = value || args._last || args.actor;
  args._last = actor;
  if (!actor || !actor.getVerb) return name;
  return actor.getVerb(name);
});

function apply(template, args={}) {
  const fn = compile(template);
  const result = fn(args);
  return result;
}

addHelper('eachColor', (ctx) => {
  if (ctx.fg) { ctx.fg = from(ctx.fg); }
  if (ctx.bg) { ctx.bg = from(ctx.bg); }
});

var text = {
  __proto__: null,
  playerPronoun: playerPronoun,
  singularPronoun: singularPronoun,
  pluralPronoun: pluralPronoun,
  isVowel: isVowel,
  toSingularVerb: toSingularVerb,
  toPluralVerb: toPluralVerb,
  toPluralNoun: toPluralNoun,
  spliceRaw: spliceRaw,
  splitIntoLines: splitIntoLines,
  apply: apply,
  firstChar: firstChar,
  eachChar: eachChar,
  length: length,
  center: center,
  capitalize: capitalize,
  removeColors: removeColors,
  wordWrap: wordWrap,
  compile: compile
};

const TEMP_BG = new types.Color();

class Sprite extends Mixer {
	constructor(ch=' ', fg=null, bg=null, opacity) {
    super();
    this.draw(ch, fg, bg);
    this.needsUpdate = true;
    this.opacity = opacity || 100;
	}

  _changed() {
    this.needsUpdate = true;
    this.opacity = (this.fg.isNull() && this.bg.isNull()) ? 0 : 100;
    return this;
  }

  copy(other) {
    other.ch = other.ch || ' ';
    super.copy(other);
    this.opacity = other.opacity || 100;
    return this;
  }

  equals(other) {
    if (this.ch != other.ch) return false;
    if (this.fg) {
      if (!this.fg.equals(other.fg)) return false;
    }
    else if (other.fg) {
      return false;
    }
    if (this.bg) {
      if (!this.bg.equals(other.bg)) return false;
    }
    else if (other.bg) {
      return false;
    }

    return true;
  }

  mix(color, pct) {
    if (this.bg) this.bg.mix(color, pct);
    if (this.fg) this.fg.mix(color, pct);
    this.needsUpdate = true;
    this.opacity = this.opacity || 100;
    return this;
  }

}

types.Sprite = Sprite;

function makeSprite(ch, fg, bg, opacity) {
  if (ch && ch instanceof Color$1) {
    bg = ch;
    ch = undefined;
  }
  else if (ch && Array.isArray(ch)) {
    [ch, fg, bg, opacity] = ch;
  }
  else if (ch && typeof ch === 'object') {
    if (ch.fg) { ch.fg = from(ch.fg); }
    if (ch.bg) { ch.bg = from(ch.bg); }
    return ch;
  }

  if ((bg === undefined) && ch && ch.length > 1) {
    bg = ch;
    ch = undefined;
  }

  if (typeof fg === 'number') {
    opacity = fg;
    fg = undefined;
  }
  if (typeof bg === 'number') {
    opacity = bg;
    bg = undefined;
  }

  if (fg) fg = from(fg);
  if (bg) bg = from(bg);

  return { ch, fg, bg, opacity };
}

make.sprite = makeSprite;

function install$1(name, ch, fg, bg, opacity) {
	const sprite = make.sprite(ch, fg, bg, opacity);
	sprites[name] = sprite;
	return sprite;
}

var sprite = {
  __proto__: null,
  Sprite: Sprite,
  makeSprite: makeSprite,
  install: install$1
};

const GRID_CACHE = [];

const DIRS = def.dirs;
const CDIRS = def.clockDirs;

// var GRID = {};
// export { GRID as grid };


function makeArray(l, fn) {
	fn = fn || (() => 0);
	const arr = new Array(l);
	for( let i = 0; i < l; ++i) {
		arr[i] = fn(i);
	}
	return arr;
}

make.array = makeArray;


class Grid extends Array {
	constructor(w, h, v) {
		v = v || 0;
		const fn = (typeof v === 'function') ? v : (() => v);
		super(w);
		for( let i = 0; i < w; ++i ) {
			this[i] = makeArray(h, (j) => fn(i, j));		}
		this.width = w;
		this.height = h;
	}

	forEach(fn) {
		let i, j;
		for(i = 0; i < this.width; i++) {
			for(j = 0; j < this.height; j++) {
				fn(this[i][j], i, j, this);
			}
		}
	}

	eachNeighbor(x, y, fn, only4dirs) {
		const maxIndex = only4dirs ? 4 : 8;
		for(let d = 0; d < maxIndex; ++d) {
			const dir = DIRS[d];
			const i = x + dir[0];
			const j = y + dir[1];
			if (this.hasXY(i, j)) {
				fn(this[i][j], i, j, this);
			}
		}
	}

	forRect(x, y, w, h, fn) {
		w = Math.min(this.width - x, w);
		h = Math.min(this.height - y, h);

		for(let i = x; i < x + w; ++i) {
			for(let j = y; j < y + h; ++j) {
				fn(this[i][j], i, j, this);
			}
		}
	}

	map(fn) {
		return super.map( (col, x) => {
			return col.map( (v, y) => fn(v, x, y, this) );
		});
	}

	forCircle(x, y, radius, fn) {
		let i, j;

		for (i=Math.max(0, x - radius - 1); i < Math.min(this.width, x + radius + 1); i++) {
				for (j=Math.max(0, y - radius - 1); j < Math.min(this.height, y + radius + 1); j++) {
						if (this.hasXY(i, j) && (((i-x)*(i-x) + (j-y)*(j-y)) < radius * radius + radius)) {	// + radius softens the circle
								fn(this[i][j], i, j, this);
						}
				}
		}
	}

	hasXY(x, y) {
		return x >= 0 && y >= 0 && x < this.width && y < this.height;
	}

	isBoundaryXY(x, y) {
		return this.hasXY(x, y) && ((x == 0) || (x == this.width - 1) || (y == 0) || (y == this.height - 1));
	}

	calcBounds() {
		const bounds = { left: this.width, top: this.height, right: 0, bottom: 0 };
		this.forEach( (v, i, j) => {
			if (!v) return;
			if (bounds.left > i) bounds.left = i;
			if (bounds.right < i) bounds.right = i;
			if (bounds.top > j) bounds.top = j;
			if (bounds.bottom < j ) bounds.bottom = j;
		});
		return bounds;
	}

	update(fn) {
		let i, j;
		for(i = 0; i < this.width; i++) {
			for(j = 0; j < this.height; j++) {
				this[i][j] = fn(this[i][j], i, j, this);
			}
		}
	}

	updateRect(x, y, width, height, fn) {
	    let i, j;
	    for (i=x; i < x+width; i++) {
	        for (j=y; j<y+height; j++) {
						if (this.hasXY(i, j)) {
							this[i][j] = fn(this[i][j], i, j, this);
						}
	        }
	    }
	}

	updateCircle(x, y, radius, fn) {
	    let i, j;

	    for (i=Math.max(0, x - radius - 1); i < Math.min(this.width, x + radius + 1); i++) {
	        for (j=Math.max(0, y - radius - 1); j < Math.min(this.height, y + radius + 1); j++) {
	            if (this.hasXY(i, j) && (((i-x)*(i-x) + (j-y)*(j-y)) < radius * radius + radius)) {	// + radius softens the circle
	                this[i][j] = fn(this[i][j], i, j, this);
	            }
	        }
	    }
	}

	fill(v=1) {
		const fn = (typeof v === 'function') ? v : (() => v);
		this.update(fn);
	}

	fillRect(x, y, w, h, v=1) {
		const fn = (typeof v === 'function') ? v : (() => v);
		this.updateRect(x, y, w, h, fn);
	}

	fillCircle(x, y, radius, v=1) {
		const fn = (typeof v === 'function') ? v : (() => v);
		this.updateCircle(x, y, radius, fn);
	}


	replace(findValue, replaceValue)
	{
		this.update( (v, x, y) => (v == findValue) ? replaceValue : v );
	}

	copy(from) {
		// TODO - check width, height?
		this.update( (v, i, j) => from[i][j] );
	}

	count(match) {
		const fn = (typeof match === 'function') ? match : ((v) => v == match);
	  let count = 0;
		this.forEach((v, i, j) => { if (fn(v,i,j, this)) ++count; });
	  return count;
	}

	dump(fmtFn) {
		dumpRect(this, 0, 0, this.width, this.height, fmtFn);
	}

	closestMatchingXY(x, y, fn) {
		let bestLoc = [-1, -1];
	  let bestDistance = this.width + this.height;

		this.forEach( (v, i, j) => {
			if (fn(v, i, j, this)) {
				const dist = distanceBetween(x, y, i, j);
				if (dist < bestDistance) {
					bestLoc[0] = i;
					bestLoc[1] = j;
					bestDistance = dist;
				}
				else if (dist == bestDistance && random.chance(50)) {
					bestLoc[0] = i;
					bestLoc[1] = j;
				}
			}
		});

	  return bestLoc;
	}

	firstMatchingXY(v) {

		const fn = (typeof v === 'function') ? v : ((c) => v == c);
		for(let i = 0; i < this.width; ++i) {
			for(let j = 0; j < this.height; ++j) {
				if (fn(this[i][j], i, j, this)) {
					return [i, j];
				}
			}
		}

		return [-1,-1];
	}

	randomMatchingXY(v, deterministic) {
		let locationCount;
	  let i, j, index;

		const fn = (typeof v === 'function') ? v : ((c) => v == c);

	  locationCount = 0;
		this.forEach( (v, i, j) => {
			if (fn(v, i, j, this)) {
				locationCount++;
			}
		});

		if (locationCount == 0) {
			return [-1,-1];
	  }
    else if (deterministic) {
      index = Math.floor(locationCount / 2);
    } else {
      index = random.range(0, locationCount - 1);
    }

		for(i = 0; i < this.width && index >= 0; i++) {
			for(j = 0; j < this.height && index >= 0; j++) {
        if (fn(this[i][j], i, j, this)) {
          if (index == 0) {
						return [i,j];
          }
          index--;
        }
      }
    }
		return [-1,-1];
	}

	matchingXYNear(x, y, v, deterministic)
	{
	  let loc = [];
		let i, j, k, candidateLocs, randIndex;

		const fn = (typeof v === 'function') ? v : ((n) => n == v);
		candidateLocs = 0;

		// count up the number of candidate locations
		for (k=0; k < Math.max(this.width, this.height) && !candidateLocs; k++) {
			for (i = x-k; i <= x+k; i++) {
				for (j = y-k; j <= y+k; j++) {
					if (this.hasXY(i, j)
						&& (i == x-k || i == x+k || j == y-k || j == y+k)
						&& fn(this[i][j], i, j, this))
	        {
						candidateLocs++;
					}
				}
			}
		}

		if (candidateLocs == 0) {
			return null;
		}

		// and pick one
		if (deterministic) {
			randIndex = 1 + Math.floor(candidateLocs / 2);
		} else {
			randIndex = 1 + random.number(candidateLocs);
		}

		for (k=0; k < Math.max(this.width, this.height); k++) {
			for (i = x-k; i <= x+k; i++) {
				for (j = y-k; j <= y+k; j++) {
					if (this.hasXY(i, j)
						&& (i == x-k || i == x+k || j == y-k || j == y+k)
						&& fn(this[i][j], i, j, this))
	        {
						if (--randIndex == 0) {
							loc[0] = i;
							loc[1] = j;
							return loc;
						}
					}
				}
			}
		}

	  // brogueAssert(false);
		return null; // should never reach this point
	}


	// Rotates around the cell, counting up the number of distinct strings of neighbors with the same test result in a single revolution.
	//		Zero means there are no impassable tiles adjacent.
	//		One means it is adjacent to a wall.
	//		Two means it is in a hallway or something similar.
	//		Three means it is the center of a T-intersection or something similar.
	//		Four means it is in the intersection of two hallways.
	//		Five or more means there is a bug.
	arcCount(x, y, testFn) {
		let arcCount, dir, oldX, oldY, newX, newY;

	  // brogueAssert(grid.hasXY(x, y));

		testFn = testFn || IDENTITY;

		arcCount = 0;
		for (dir = 0; dir < CDIRS.length; dir++) {
			oldX = x + CDIRS[(dir + 7) % 8][0];
			oldY = y + CDIRS[(dir + 7) % 8][1];
			newX = x + CDIRS[dir][0];
			newY = y + CDIRS[dir][1];
			// Counts every transition from passable to impassable or vice-versa on the way around the cell:
			if ((this.hasXY(newX, newY) && testFn(this[newX][newY], newX, newY, this))
				!= (this.hasXY(oldX, oldY) && testFn(this[oldX][oldY], oldX, oldY, this)))
			{
				arcCount++;
			}
		}
		return Math.floor(arcCount / 2); // Since we added one when we entered a wall and another when we left.
	}

}

types.Grid = Grid;


function make$3(w, h, v) {
	return new types.Grid(w, h, v);
}

make.grid = make$3;


// mallocing two-dimensional arrays! dun dun DUN!
function alloc(w, h, v) {

	w = w || (data.map ? data.map.width : 100);
	h = h || (data.map ? data.map.height : 34);
	v = v || 0;

	let grid = GRID_CACHE.pop();
  if (!grid) {
    return make$3(w, h, v);
  }
  return resizeAndClearGrid(grid, w, h, v);
}

// Grid.alloc = alloc;


function free(grid) {
	if (grid) {
		GRID_CACHE.push(grid);
	}
}

// Grid.free = free;


function resizeAndClearGrid(grid, width, height, value=0) {
	if (!grid) return alloc(width, height, () => value());

	const fn = (typeof value === 'function') ? value : (() => value);

  while( grid.length < width ) grid.push([]);
  let x = 0;
  let y = 0;
  for( x = 0; x < width; ++x) {
    const col = grid[x];
    for( y = 0; y < Math.min(height, col.length); ++y) {
      col[y] = fn(col[y]);
    }
		while( col.length < height ) col.push(fn());
  }
  grid.width = width;
  grid.height = height;
	if (grid.x !== undefined) {
		grid.x = undefined;
		grid.y = undefined;
	}
  return grid;
}





// function gridMapCellsInCircle(grid, x, y, radius, fn) {
//     let i, j;
//
// 		// let maxRadius = Math.ceil(radius);
// 		const results = [];
//
// 		// const maxW = Math.max(x, grid.width - x - 1);
// 		// const maxH = Math.max(y, grid.height - y - 1);
// 		// maxRadius = Math.min(maxRadius, maxW + maxH);
//
//     // for (i = Math.max(0, x - maxRadius - 1); i < Math.min(grid.width, x + maxRadius + 1); i++) {
//     //     for (j = Math.max(0, y - maxRadius - 1); j < Math.min(grid.height, y + maxRadius + 1); j++) {
// 		for (i = Math.max(0, x - radius - 1); i < Math.min(grid.width, x + radius + 1); i++) {
//         for (j = Math.max(0, y - radius - 1); j < Math.min(grid.height, y + radius + 1); j++) {
//             if ((i-x)*(i-x) + (j-y)*(j-y) < radius * radius + radius) {	// + radius softens the circle
//                 results.push(fn(grid[i][j], i, j));
//             }
//         }
//     }
// 		return results;
// }
//
// Grid.mapCellsInCircle = gridMapCellsInCircle;


function dump(grid, fmtFn) {
	dumpRect(grid, 0, 0, grid.width, grid.height, fmtFn);
}

// Grid.dump = dump;


function _formatGridValue(v) {
	if (v === false) {
		return ' ';
	}
	else if (v === true) {
		return 'T';
	}
	else if (v < 10) {
		return '' + v;
	}
	else if (v < 36) {
		return String.fromCharCode( 'a'.charCodeAt(0) + v - 10);
	}
	else if (v < 62) {
		return String.fromCharCode( 'A'.charCodeAt(0) + v - 10 - 26);
	}
	else if (typeof v === 'string') {
		return v[0];
	}
	else {
		return '#';
	}
}

function dumpRect(grid, left, top, width, height, fmtFn) {
	let i, j;

	fmtFn = fmtFn || _formatGridValue;

	left = clamp(left, 0, grid.width - 2);
	top = clamp(top, 0, grid.height - 2);
	const right = clamp(left + width, 1, grid.width - 1);
	const bottom = clamp(top + height, 1, grid.height - 1);

	let output = [];

	for(j = top; j <= bottom; j++) {
		let line = ('' + j + ']').padStart(3, ' ');
		for(i = left; i <= right; i++) {
			if (i % 10 == 0) {
				line += ' ';
			}

			const v = grid[i][j];
			line += fmtFn(v, i, j)[0];
		}
		output.push(line);
	}
	console.log(output.join('\n'));
}

// Grid.dumpRect = dumpRect;


function dumpAround(grid, x, y, radius) {
	dumpRect(grid, x - radius, y - radius, 2 * radius, 2 * radius);
}

// Grid.dumpAround = dumpAround;





function findAndReplace(grid, findValueMin, findValueMax, fillValue)
{
	grid.update( (v, x, y) => {
		if (v >= findValidMin && v <= findValueMax) {
			return fillValue;
		}
		return v;
	});
}

// Grid.findAndReplace = findAndReplace;


// Flood-fills the grid from (x, y) along cells that are within the eligible range.
// Returns the total count of filled cells.
function floodFillRange(grid, x, y, eligibleValueMin, eligibleValueMax, fillValue) {
  let dir;
	let newX, newY, fillCount = 1;

  if (fillValue >= eligibleValueMin && fillValue <= eligibleValueMax) {
		ERROR('Invalid grid flood fill');
	}

  grid[x][y] = fillValue;
  for (dir = 0; dir < 4; dir++) {
      newX = x + DIRS[dir][0];
      newY = y + DIRS[dir][1];
      if (grid.hasXY(newX, newY)
          && grid[newX][newY] >= eligibleValueMin
          && grid[newX][newY] <= eligibleValueMax)
			{
          fillCount += floodFillRange(grid, newX, newY, eligibleValueMin, eligibleValueMax, fillValue);
      }
  }
  return fillCount;
}

// Grid.floodFillRange = floodFillRange;


function invert(grid) {
	grid.update((v, i, j) => !v );
}

// Grid.invert = invert;


function intersection(onto, a, b) {
	b = b || onto;
	onto.update((v, i, j) => a[i][j] && b[i][j] );
}

// Grid.intersection = intersection;


function unite(onto, a, b) {
	b = b || onto;
	onto.update((v, i, j) => b[i][j] || a[i][j] );
}

// Grid.unite = unite;




function closestLocationWithValue(grid, x, y, value)
{
	return grid.closestMatchingXY(x, y, (v) => v == value);
}

// Grid.closestLocationWithValue = closestLocationWithValue;


// Takes a grid as a mask of valid locations, chooses one randomly and returns it as (x, y).
// If there are no valid locations, returns (-1, -1).
function randomLocationWithValue(grid, validValue) {
	return grid.randomMatchingXY( (v, i, j) => v == validValue );
}

// Grid.randomLocationWithValue = randomLocationWithValue;


function getQualifyingLocNear(grid, x, y, deterministic)
{
	return grid.matchingXYNear(x, y, (v, i, j) => !!v);
}

// Grid.getQualifyingLocNear = getQualifyingLocNear;

function leastPositiveValue(grid) {
	let least = Number.MAX_SAFE_INTEGER;
	grid.forEach((v) => {
		if (v > 0 && (v < least)) {
				least = v;
		}
	});
	return least;
}

// Grid.leastPositiveValue = leastPositiveValue;

// Finds the lowest positive number in a grid, chooses one location with that number randomly and returns it as (x, y).
// If there are no valid locations, returns (-1, -1).
function randomLeastPositiveLocation(grid, deterministic) {
  const targetValue = leastPositiveValue(grid);
	return grid.randomMatchingXY( (v) => v == targetValue );
}

// Grid.randomLeastPositiveLocation = randomLeastPositiveLocation;

// Marks a cell as being a member of blobNumber, then recursively iterates through the rest of the blob
function floodFill(grid, x, y, matchValue, fillValue) {
  let dir;
	let newX, newY, numberOfCells = 1;

	const matchFn = (typeof matchValue == 'function') ? matchValue : ((v) => v == matchValue);
	const fillFn  = (typeof fillValue  == 'function') ? fillValue  : (() => fillValue);

	grid[x][y] = fillFn(grid[x][y], x, y, grid);

	// Iterate through the four cardinal neighbors.
	for (dir=0; dir<4; dir++) {
		newX = x + DIRS[dir][0];
		newY = y + DIRS[dir][1];
		if (!grid.hasXY(newX, newY)) {
			continue;
		}
		if (matchFn(grid[newX][newY], newX, newY, grid)) { // If the neighbor is an unmarked region cell,
			numberOfCells += floodFill(grid, newX, newY, matchFn, fillFn); // then recurse.
		}
	}
	return numberOfCells;
}

// Grid.floodFill = floodFill;



function offsetZip(destGrid, srcGrid, srcToDestX, srcToDestY, value) {
	const fn = (typeof value === 'function') ? value : ((d, s, dx, dy, sx, sy) => destGrid[dx][dy] = value || s);
	srcGrid.forEach( (c, i, j) => {
		const destX = i + srcToDestX;
		const destY = j + srcToDestY;
		if (!destGrid.hasXY(destX, destY)) return;
		if (!c) return;
		fn(destGrid[destX][destY], c, destX, destY, i, j, destGrid, srcGrid);
	});
}

// Grid.offsetZip = offsetZip;



// If the indicated tile is a wall on the room stored in grid, and it could be the site of
// a door out of that room, then return the outbound direction that the door faces.
// Otherwise, return def.NO_DIRECTION.
function directionOfDoorSite(grid, x, y, isOpen=1) {
    let dir, solutionDir;
    let newX, newY, oppX, oppY;

		const fnOpen = (typeof isOpen === 'function') ? isOpen : ((v) => v == isOpen);

    solutionDir = def.NO_DIRECTION;
    for (dir=0; dir<4; dir++) {
        newX = x + DIRS[dir][0];
        newY = y + DIRS[dir][1];
        oppX = x - DIRS[dir][0];
        oppY = y - DIRS[dir][1];
        if (grid.hasXY(oppX, oppY)
            && grid.hasXY(newX, newY)
            && fnOpen(grid[oppX][oppY],oppX, oppY, grid))
        {
            // This grid cell would be a valid tile on which to place a door that, facing outward, points dir.
            if (solutionDir != def.NO_DIRECTION) {
                // Already claimed by another direction; no doors here!
                return def.NO_DIRECTION;
            }
            solutionDir = dir;
        }
    }
    return solutionDir;
}

// Grid.directionOfDoorSite = directionOfDoorSite;


function cellularAutomataRound(grid, birthParameters /* char[9] */, survivalParameters /* char[9] */) {
    let i, j, nbCount, newX, newY;
    let dir;
    let buffer2;

    buffer2 = alloc(grid.width, grid.height, 0);
    buffer2.copy(grid); // Make a backup of grid in buffer2, so that each generation is isolated.

		let didSomething = false;
    for(i=0; i<grid.width; i++) {
        for(j=0; j<grid.height; j++) {
            nbCount = 0;
            for (dir=0; dir< DIRS.length; dir++) {
                newX = i + DIRS[dir][0];
                newY = j + DIRS[dir][1];
                if (grid.hasXY(newX, newY)
                    && buffer2[newX][newY])
								{
                    nbCount++;
                }
            }
            if (!buffer2[i][j] && birthParameters[nbCount] == 't') {
                grid[i][j] = 1;	// birth
								didSomething = true;
            } else if (buffer2[i][j] && survivalParameters[nbCount] == 't') ; else {
                grid[i][j] = 0;	// death
								didSomething = true;
            }
        }
    }

    free(buffer2);
		return didSomething;
}



// Loads up **grid with the results of a cellular automata simulation.
function fillBlob(grid,
                      roundCount,
                      minBlobWidth, minBlobHeight,
					  maxBlobWidth, maxBlobHeight, percentSeeded,
					  birthParameters, survivalParameters)
{
	let i, j, k;
	let blobNumber, blobSize, topBlobNumber, topBlobSize;

  let topBlobMinX, topBlobMinY, topBlobMaxX, topBlobMaxY, blobWidth, blobHeight;
	let foundACellThisLine;

	if (minBlobWidth >= maxBlobWidth) {
		minBlobWidth = Math.round(0.75 * maxBlobWidth);
		maxBlobWidth = Math.round(1.25 * maxBlobWidth);
	}
	if (minBlobHeight >= maxBlobHeight) {
		minBlobHeight = Math.round(0.75 * maxBlobHeight);
		maxBlobHeight = Math.round(1.25 * maxBlobHeight);
	}

	const left = Math.floor((grid.width - maxBlobWidth) / 2);
	const top  = Math.floor((grid.height - maxBlobHeight) / 2);

	// Generate blobs until they satisfy the minBlobWidth and minBlobHeight restraints
	do {
		// Clear buffer.
    grid.fill(0);

		// Fill relevant portion with noise based on the percentSeeded argument.
		for(i=0; i<maxBlobWidth; i++) {
			for(j=0; j<maxBlobHeight; j++) {
				grid[i + left][j + top] = (random.chance(percentSeeded) ? 1 : 0);
			}
		}

		// Some iterations of cellular automata
		for (k=0; k<roundCount; k++) {
			if (!cellularAutomataRound(grid, birthParameters, survivalParameters)) {
				k = roundCount;	// cellularAutomataRound did not make any changes
			}
		}

		// Now to measure the result. These are best-of variables; start them out at worst-case values.
		topBlobSize =   0;
		topBlobNumber = 0;
		topBlobMinX =   grid.width;
		topBlobMaxX =   0;
		topBlobMinY =   grid.height;
		topBlobMaxY =   0;

		// Fill each blob with its own number, starting with 2 (since 1 means floor), and keeping track of the biggest:
		blobNumber = 2;

		for(i=0; i<grid.width; i++) {
			for(j=0; j<grid.height; j++) {
				if (grid[i][j] == 1) { // an unmarked blob
					// Mark all the cells and returns the total size:
					blobSize = floodFill(grid, i, j, 1, blobNumber);
					if (blobSize > topBlobSize) { // if this blob is a new record
						topBlobSize = blobSize;
						topBlobNumber = blobNumber;
					}
					blobNumber++;
				}
			}
		}

		// Figure out the top blob's height and width:
		// First find the max & min x:
		for(i=0; i<grid.width; i++) {
			foundACellThisLine = false;
			for(j=0; j<grid.height; j++) {
				if (grid[i][j] == topBlobNumber) {
					foundACellThisLine = true;
					break;
				}
			}
			if (foundACellThisLine) {
				if (i < topBlobMinX) {
					topBlobMinX = i;
				}
				if (i > topBlobMaxX) {
					topBlobMaxX = i;
				}
			}
		}

		// Then the max & min y:
		for(j=0; j<grid.height; j++) {
			foundACellThisLine = false;
			for(i=0; i<grid.width; i++) {
				if (grid[i][j] == topBlobNumber) {
					foundACellThisLine = true;
					break;
				}
			}
			if (foundACellThisLine) {
				if (j < topBlobMinY) {
					topBlobMinY = j;
				}
				if (j > topBlobMaxY) {
					topBlobMaxY = j;
				}
			}
		}

		blobWidth =		(topBlobMaxX - topBlobMinX) + 1;
		blobHeight =	(topBlobMaxY - topBlobMinY) + 1;

	} while (blobWidth < minBlobWidth
             || blobHeight < minBlobHeight
             || topBlobNumber == 0);

	// Replace the winning blob with 1's, and everything else with 0's:
    for(i=0; i<grid.width; i++) {
        for(j=0; j<grid.height; j++) {
			if (grid[i][j] == topBlobNumber) {
				grid[i][j] = 1;
			} else {
				grid[i][j] = 0;
			}
		}
	}

    // Populate the returned variables.
	return { x: topBlobMinX, y: topBlobMinY, width: blobWidth, height: blobHeight };
}

// Grid.fillBlob = fillBlob;

var grid = {
  __proto__: null,
  makeArray: makeArray,
  Grid: Grid,
  make: make$3,
  alloc: alloc,
  free: free,
  dump: dump,
  dumpRect: dumpRect,
  dumpAround: dumpAround,
  findAndReplace: findAndReplace,
  floodFillRange: floodFillRange,
  invert: invert,
  intersection: intersection,
  unite: unite,
  closestLocationWithValue: closestLocationWithValue,
  randomLocationWithValue: randomLocationWithValue,
  getQualifyingLocNear: getQualifyingLocNear,
  leastPositiveValue: leastPositiveValue,
  randomLeastPositiveLocation: randomLeastPositiveLocation,
  floodFill: floodFill,
  offsetZip: offsetZip,
  directionOfDoorSite: directionOfDoorSite,
  fillBlob: fillBlob
};

DataBuffer.prototype.drawText = function(x, y, text$1, fg, bg) {
  eachChar(text$1, (ch, color, bg, i) => {
    this.draw(i + x, y, ch, color || colors.white, bg);
  }, fg, bg);
  return ++y;
};

DataBuffer.prototype.wrapText = function(x0, y0, width, text$1, fg, bg, opts={}) {
  if (typeof opts === 'number') { opts = { indent: opts }; }
  fg = fg || 'white';
  // if (typeof fg === 'string') { fg = GW.colors[fg]; }
  // if (typeof bg === 'string') { bg = GW.colors[bg]; }
  width = Math.min(width, this.width - x0);
  const indent = opts.indent || 0;

  text$1 = wordWrap(text$1, width, indent);

  let x = x0;
  let y = y0;
  eachChar(text$1, (ch, fg0, bg0) => {
    if (ch == '\n') {
      while(x < x0 + width) {
        this.draw(x++, y, ' ', colors.black, bg0);
      }
      ++y;
      x = x0 + indent;
      return;
    }
    this.draw(x++, y, ch, fg0, bg0);
  }, fg, bg);

  while(x < x0 + width) {
    this.draw(x++, y, ' ', colors.black, bg);
  }

  return ++y;
};

DataBuffer.prototype.fillRect = function(x, y, w, h, ch, fg, bg) {
  // if (typeof fg === 'string') { fg = GW.colors[fg]; }
  // if (typeof bg === 'string') { bg = GW.colors[bg]; }
  for(let i = x; i < x + w; ++i) {
    for(let j = y; j < y + h; ++j) {
      this.draw(i, j, ch, fg, bg);
    }
  }
  return this;
};

DataBuffer.prototype.blackOutRect = function(x, y, w, h, bg) {
  bg = bg || 'black';
  return this.fillRect(x, y, w, h, 0, 0, bg);
};

DataBuffer.prototype.highlight = function(x, y, highlightColor, strength)
{
  const mixer = new Sprite();
	const data = this.get(x, y);
  mixer.drawSprite(data);
	mixer.fg.add(highlightColor, strength);
	mixer.bg.add(highlightColor, strength);
  this.drawSprite(x, y, mixer);
  return this;
};

DataBuffer.prototype.mix = function(color, percent) {

  const mixer = new Sprite();
  for(let x = 0; x < this.width; ++x) {
    for(let y = 0; y < this.height; ++y) {
      const data = this.get(x, y);
      mixer.drawSprite(data);
    	mixer.fg.mix(color, percent);
    	mixer.bg.mix(color, percent);
      this.drawSprite(x, y, mixer);
    }
  }
  return this;
};


DataBuffer.prototype.dump = function() {
  const data = [];
  let header = '    ';
  for(let x = 0; x < this.width; ++x) {
    if ((x%10) == 0) header += ' ';
    header += (x%10);
  }
  data.push(header);
  data.push('');

  for(let y = 0; y < this.height; ++y) {
    let line = `${(''+y).padStart(2)}] `;
    for(let x = 0; x < this.width; ++x) {
      if ((x % 10) == 0) line += ' ';
      const data = this.get(x, y);
      line += String.fromCharCode(data.glyph || 32);
    }
    data.push(line);
  }
  console.log(data.join('\n'));
};

let NEXT_GLYPH = 128;

Buffer.prototype._toGlyph = function(ch) {
  if (ch === null || ch === undefined) return -1;
  if (ch === ' ') return 0;

  let glyph = this._canvas.glyphs.forChar(ch);
  if (glyph < 0) {
    console.log('Register new Glyph', ch, ch.charCodeAt(0), NEXT_GLYPH);
    glyph = NEXT_GLYPH;
    this._canvas.glyphs.draw(NEXT_GLYPH++, ch);
  }
  return glyph;
};

types.DataBuffer = DataBuffer;
types.Buffer = Buffer;

const DEFAULT_FONT = 'monospace';

types.Canvas = Canvas;

configure({
  random: cosmetic.value.bind(cosmetic),
});


function makeGlyphs(opts={}) {
  if (typeof opts === 'string') {
    opts = { font: opts };
  }
  else if (typeof opts === 'number') {
    opts = { size: opts };
  }
  opts.font = opts.font || DEFAULT_FONT;
  opts.basic = true;

  const glyphs = Glyphs.fromFont(opts);

  [
    // arrows (4)
    '\u2190', '\u2191', '\u2192', '\u2193',

    // border drawing (11)
    '\u2550','\u2551','\u2554','\u2557','\u255A','\u255D','\u2560','\u2563','\u2566','\u2569','\u256C',

    // Floor,  dagger   omega    target 1, target 2, open flag, flag      3 dots    4 dots
    '\u2219', '\u2020', '\u03A9', '\u25ef', '\u25ce', '\u2690', '\u2691', '\u2234', '\u2237',

  ].forEach( (ch, i) => {
    glyphs.draw(i + 1, ch);
  });

  return glyphs;
}

make.glyphs = makeGlyphs;


function makeCanvas(opts={}) {
  const glyphs = makeGlyphs(opts);
  opts.glyphs = glyphs;
  try {
    return new Canvas(opts);
  }
  catch(e) {
    if (!(e instanceof NotSupportedError)) throw e;
  }

  return new Canvas2D(opts);
}

make.canvas = makeCanvas;

var canvas = {
  __proto__: null,
  Canvas: Canvas,
  makeGlyphs: makeGlyphs
};

function frequency(v) {
  if (!v) return 100;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parts = v.split(',');
    v = {};
    parts.forEach( (p) => v[p] = 100 );
  }
  if (typeof v === 'object') {
    const parts = Object.entries(v);

    const funcs = parts.map( ([levels,frequency]) => {
      frequency = Number.parseInt(frequency);

      if (levels.includes('-')) {
        let [start, end] = levels.split('-');
        start = Number.parseInt(start);
        end = Number.parseInt(end);
        return ((level) => (level >= start && level <= end) ? frequency : 0);
      }
      else if (levels.endsWith('+')) {
        const found = Number.parseInt(levels);
        return ((level) => (level >= found) ? frequency : 0);
      }
      else {
        const found = Number.parseInt(levels);
        return ((level) => (level === found) ? frequency : 0);
      }
    });

    if (funcs.length == 1) return funcs[0];

    return ((level) => funcs.reduce( (out, fn) => out || fn(level), 0) );
  }
  return 0;
}

make.frequency = frequency;

function forDanger(frequency, danger) {
  if (typeof frequency === 'number') {
    return frequency;
  }
  if (typeof frequency === 'function') {
    if (danger === undefined || danger < 0) {
      if (data.map && data.map.config.danger) {
        danger = data.map.config.danger;
      }
      else if (data.danger) {
        danger = data.danger;
      }
      danger = 0;
    }
    return frequency(danger);
  }
  return 0;
}

var frequency$1 = {
  __proto__: null,
  frequency: frequency,
  forDanger: forDanger
};

var io = {};

io.debug = NOOP;

let KEYMAP = {};
// const KEYMAPS = [];
const EVENTS$1 = [];
const DEAD_EVENTS = [];
const LAST_CLICK = { x: -1, y: -1 };

const KEYPRESS  = def.KEYPRESS  = 'keypress';
const MOUSEMOVE = def.MOUSEMOVE = 'mousemove';
const CLICK 		 = def.CLICK 		 = 'click';
const TICK 		 = def.TICK 		 = 'tick';
const MOUSEUP   = def.MOUSEUP   = 'mouseup';

const CONTROL_CODES = [
	'ShiftLeft', 		'ShiftRight',
	'ControlLeft',  'ControlRight',
	'AltLeft',   		'AltRight',
	'MetaLeft',  		'MetaRight',
];

var CURRENT_HANDLER = null;


function setKeymap(keymap) {
	KEYMAP = keymap;
	// KEYMAPS.push(keymap);
}

io.setKeymap = setKeymap;

function busy() {
	return KEYMAP.busy;
	// return KEYMAPS.length && KEYMAPS[KEYMAPS.length - 1].busy;
}

io.busy = busy;

function hasEvents() {
	return EVENTS$1.length;
}

io.hasEvents = hasEvents;


function clearEvents() {
	while (EVENTS$1.length) {
		const ev = EVENTS$1.shift();
		DEAD_EVENTS.push(ev);
	}
}

io.clearEvents = clearEvents;


function pushEvent(ev) {

  if (PAUSED) {
    console.log('PAUSED EVENT', ev.type);
  }

  if (EVENTS$1.length) {
		const last = EVENTS$1[EVENTS$1.length - 1];
		if (last.type === ev.type) {
	    if (last.type === MOUSEMOVE) {
				last.x = ev.x;
			  last.y = ev.y;
				io.recycleEvent(ev);
	      return;
	    }
		}
  }

  // Keep clicks down to one per cell if holding down mouse button
  if (ev.type === CLICK) {
    if (LAST_CLICK.x == ev.x && LAST_CLICK.y == ev.y) {
      io.recycleEvent(ev);
      return;
    }
    LAST_CLICK.x = ev.x;
    LAST_CLICK.y = ev.y;
  }
  else if (ev.type == MOUSEUP) {
    LAST_CLICK.x = -1;
    LAST_CLICK.y = -1;
    io.recycleEvent(ev);
    return;
  }

	if (CURRENT_HANDLER) {
  	CURRENT_HANDLER(ev);
  }
  else if (ev.type === TICK) {
    const first = EVENTS$1[0];
    if (first && first.type === TICK) {
      first.dt += ev.dt;
      io.recycleEvent(ev);
      return;
    }
    EVENTS$1.unshift(ev);	// ticks go first
  }
  else {
    EVENTS$1.push(ev);
  }
}

io.pushEvent = pushEvent;


async function dispatchEvent(ev, km) {
	let result;
	let command;

	km = km || KEYMAP;

	if (ev.dir) {
		command = km.dir;
	}
	else if (ev.type === KEYPRESS) {
		command = km[ev.key] || km[ev.code] || km.keypress;
	}
	else if (km[ev.type]) {
		command = km[ev.type];
	}

	if (command) {
		if (typeof command === 'function') {
			result = await command.call(km, ev);
		}
		else if (commands$1[command]) {
			result = await commands$1[command](ev);
		}
		else {
			WARN('No command found: ' + command);
		}
	}

	if (km.next === false) {
		result = false;
	}

	io.recycleEvent(ev);
	return result;
}

io.dispatchEvent = dispatchEvent;


function recycleEvent(ev) {
	DEAD_EVENTS.push(ev);
}

io.recycleEvent = recycleEvent;

// TICK

function makeTickEvent(dt) {

	const ev = DEAD_EVENTS.pop() || {};

	ev.shiftKey = false;
	ev.ctrlKey = false;
	ev.altKey = false;
	ev.metaKey = false;

  ev.type = TICK;
  ev.key = null;
  ev.code = null;
  ev.x = -1;
  ev.y = -1;
	ev.dir = null;
	ev.dt = dt;

  return ev;
}

io.makeTickEvent = makeTickEvent;

// KEYBOARD

function makeKeyEvent(e) {
  let key = e.key;
	let code = e.code.toLowerCase();

  if (e.shiftKey) {
    key = key.toUpperCase();
		code = code.toUpperCase();
  }
  if (e.ctrlKey) 	{
    key = '^' + key;
		code = '^' + code;
  }
  if (e.metaKey) 	{
    key = '#' + key;
		code = '#' + code;
  }
	if (e.altKey) {
		code = '/' + code;
	}

	const ev = DEAD_EVENTS.pop() || {};

	ev.shiftKey = e.shiftKey;
	ev.ctrlKey = e.ctrlKey;
	ev.altKey = e.altKey;
	ev.metaKey = e.metaKey;

  ev.type = KEYPRESS;
  ev.key = key;
  ev.code = code;
  ev.x = -1;
  ev.y = -1;
  ev.clientX = -1;
  ev.clientY = -1;
	ev.dir = io.keyCodeDirection(e.code);
	ev.dt = 0;

  return ev;
}

io.makeKeyEvent = makeKeyEvent;



function keyCodeDirection(key) {
	const lowerKey = key.toLowerCase();

	if (lowerKey === 'arrowup') {
		return [0,-1];
	}
	else if (lowerKey === 'arrowdown') {
		return [0,1];
	}
	else if (lowerKey === 'arrowleft') {
		return [-1, 0];
	}
	else if (lowerKey === 'arrowright') {
		return [1,0];
	}
	return null;
}

io.keyCodeDirection = keyCodeDirection;

function ignoreKeyEvent(e) {
	return CONTROL_CODES.includes(e.code);
}

io.ignoreKeyEvent = ignoreKeyEvent;


// MOUSE

var mouse = {x: -1, y: -1};
io.mouse = mouse;

function makeMouseEvent(e, x, y) {

	const ev = DEAD_EVENTS.pop() || {};

	ev.shiftKey = e.shiftKey;
	ev.ctrlKey = e.ctrlKey;
	ev.altKey = e.altKey;
	ev.metaKey = e.metaKey;

  ev.type = e.type;
  if (e.buttons && e.type !== 'mouseup') {
    ev.type = CLICK;
  }
  ev.key = null;
  ev.code = null;
  ev.x = x;
  ev.y = y;
  ev.clientX = e.clientX;
  ev.clientY = e.clientY;
	ev.dir = null;
	ev.dt = 0;

  return ev;
}

io.makeMouseEvent = makeMouseEvent;


// IO

let PAUSED = null;

function pauseEvents() {
	if (PAUSED) return;
	PAUSED = CURRENT_HANDLER;
  CURRENT_HANDLER = null;
	// io.debug('events paused');
}

io.pauseEvents = pauseEvents;

function resumeEvents() {
  if (!PAUSED) return;

  if (CURRENT_HANDLER) {
    console.warn('overwrite CURRENT HANDLER!');
  }

	CURRENT_HANDLER = PAUSED;
	PAUSED = null;
	// io.debug('resuming events');

  if (EVENTS$1.length && CURRENT_HANDLER) {
		const e = EVENTS$1.shift();
		// io.debug('- processing paused event', e.type);
		CURRENT_HANDLER(e);
		// io.recycleEvent(e);	// DO NOT DO THIS B/C THE HANDLER MAY PUT IT BACK ON THE QUEUE (see tickMs)
	}
	// io.debug('events resumed');
}

io.resumeEvents = resumeEvents;


function nextEvent(ms, match) {
	match = match || TRUE;
	let elapsed = 0;

	while (EVENTS$1.length) {
  	const e = EVENTS$1.shift();
		if (e.type === MOUSEMOVE) {
			io.mouse.x = e.x;
			io.mouse.y = e.y;
		}

		if (match(e)) {
			return e;
		}
		io.recycleEvent(e);
  }

  let done;

	if (ms == 0) return null;

  if (CURRENT_HANDLER) {
    console.warn('OVERWRITE HANDLER - nextEvent');
  }
  else if (EVENTS$1.length) {
    console.warn('SET HANDLER WITH QUEUED EVENTS - nextEvent');
  }

  CURRENT_HANDLER = ((e) => {
		if (e.type === MOUSEMOVE) {
			io.mouse.x = e.x;
			io.mouse.y = e.y;
		}

  	if (e.type === TICK && ms > 0) {
    	elapsed += e.dt;
    	if (elapsed < ms) {
        return;
      }
    }
    else if (!match(e)) return;

    CURRENT_HANDLER = null;
    e.dt = elapsed;
  	done(e);
  });

  return new Promise( (resolve) => done = resolve );
}

io.nextEvent = nextEvent;

async function tickMs(ms=1) {
	let done;

	setTimeout(() => done(), ms);

  return new Promise( (resolve) => done = resolve );
}

io.tickMs = tickMs;



async function nextKeyPress(ms, match) {
  if (ms === undefined) ms = -1;
	match = match || TRUE;
	function matchingKey(e) {
  	if (e.type !== KEYPRESS) return false;
    return match(e);
  }
  return io.nextEvent(ms, matchingKey);
}

io.nextKeyPress = nextKeyPress;

async function nextKeyOrClick(ms, matchFn) {
	if (ms === undefined) ms = -1;
	matchFn = matchFn || TRUE;
	function match(e) {
  	if (e.type !== KEYPRESS && e.type !== CLICK) return false;
    return matchFn(e);
  }
  return io.nextEvent(ms, match);
}

io.nextKeyOrClick = nextKeyOrClick;

async function pause(ms) {
	const e = await io.nextKeyOrClick(ms);
  return (e.type !== TICK);
}

io.pause = pause;

function waitForAck() {
	return io.pause(5 * 60 * 1000);	// 5 min
}

io.waitForAck = waitForAck;


async function loop(handler) {
  let running = true;
  while(running) {
    const ev = await io.nextEvent();
    if (await io.dispatchEvent(ev, handler)) {
      running = false;
    }
  }
}

io.loop = loop;

// var PATH = {};
// export { PATH as path };


const PDS_FORBIDDEN   = def.PDS_FORBIDDEN   = -1;
const PDS_OBSTRUCTION = def.PDS_OBSTRUCTION = -2;
const PDS_AVOIDED     = def.PDS_AVOIDED     = 10;
const PDS_NO_PATH     = def.PDS_NO_PATH     = 30000;

// GW.actor.avoidsCell = GW.actor.avoidsCell || Utils.FALSE;
// GW.actor.canPass = GW.actor.canPass || ((a, b) => a === b);

function makeCostLink(i) {
	return {
		distance: 0,
		cost: 0,
		index: i,
		left: null, right: null
	};
}

function makeDijkstraMap(w, h) {
	return {
		eightWays: false,
		front: makeCostLink(-1),
		links: make.array(w * h, (i) => makeCostLink(i) ),
		width: w,
		height: h,
	};
}

function getLink(map, x, y) {
	return (map.links[x + map.width * y]);
}


const DIRS$1 = def.dirs;

function update(map) {
	let dir, dirs;
	let linkIndex;
	let left = null, right = null, link = null;

	dirs = map.eightWays ? 8 : 4;

	let head = map.front.right;
	map.front.right = null;

	while (head != null) {
		for (dir = 0; dir < dirs; dir++) {
			linkIndex = head.index + (DIRS$1[dir][0] + map.width * DIRS$1[dir][1]);
			if (linkIndex < 0 || linkIndex >= map.width * map.height) continue;
			link = map.links[linkIndex];

			// verify passability
			if (link.cost < 0) continue;
			let diagCost = 0;
			if (dir >= 4) {
				diagCost = 0.4142;
				let way1, way1index, way2, way2index;
				way1index = head.index + DIRS$1[dir][0];
				if (way1index < 0 || way1index >= map.width * map.height) continue;

				way2index = head.index + map.width * DIRS$1[dir][1];
				if (way2index < 0 || way2index >= map.width * map.height) continue;

				way1 = map.links[way1index];
				way2 = map.links[way2index];

				if (way1.cost == PDS_OBSTRUCTION || way2.cost == PDS_OBSTRUCTION) continue;
			}

			if (head.distance + link.cost + diagCost < link.distance) {
				link.distance = head.distance + link.cost + diagCost;

				// reinsert the touched cell; it'll be close to the beginning of the list now, so
				// this will be very fast.  start by removing it.

				if (link.right != null) link.right.left = link.left;
				if (link.left != null) link.left.right = link.right;

				left = head;
				right = head.right;
				while (right != null && right.distance < link.distance) {
					left = right;
					right = right.right;
				}
				if (left != null) left.right = link;
				link.right = right;
				link.left = left;
				if (right != null) right.left = link;
			}
		}

		right = head.right;

		head.left = null;
		head.right = null;

		head = right;
	}
}

function clear(map, maxDistance, eightWays) {
	let i;

	map.eightWays = eightWays;

	map.front.right = null;

	for (i=0; i < map.width*map.height; i++) {
		map.links[i].distance = maxDistance;
		map.links[i].left = map.links[i].right = null;
	}
}

// function pdsGetDistance(map, x, y) {
// 	update(map);
// 	return getLink(map, x, y).distance;
// }

function setDistance(map, x, y, distance) {
	let left, right, link;

	if (x > 0 && y > 0 && x < map.width - 1 && y < map.height - 1) {
		link = getLink(map, x, y);
		if (link.distance > distance) {
			link.distance = distance;

			if (link.right != null) link.right.left = link.left;
			if (link.left != null) link.left.right = link.right;

			left = map.front;
			right = map.front.right;

			while (right != null && right.distance < link.distance) {
				left = right;
				right = right.right;
			}

			link.right = right;
			link.left = left;
			left.right = link;
			if (right != null) right.left = link;
		}
	}
}

function pdsBatchInput(map, distanceMap, costMap, maxDistance, eightWays) {
	let i, j;
	let left, right;

	map.eightWays = eightWays;

	left = null;
	right = null;

	map.front.right = null;
	for (i=0; i<map.width; i++) {
		for (j=0; j<map.height; j++) {
			let link = getLink(map, i, j);

			if (distanceMap != null) {
				link.distance = distanceMap[i][j];
			} else {
				if (costMap != null) {
					// totally hackish; refactor
					link.distance = maxDistance;
				}
			}

			let cost;

			if (costMap.isBoundaryXY(i, j)) {
				cost = PDS_OBSTRUCTION;
			} else {
				cost = costMap[i][j];
			}

			link.cost = cost;

			if (cost > 0) {
				if (link.distance < maxDistance) {
					if (right == null || right.distance > link.distance) {
						// left and right are used to traverse the list; if many cells have similar values,
						// some time can be saved by not clearing them with each insertion.  this time,
						// sadly, we have to start from the front.

						left = map.front;
						right = map.front.right;
					}

					while (right != null && right.distance < link.distance) {
						left = right;
						right = right.right;
					}

					link.right = right;
					link.left = left;
					left.right = link;
					if (right != null) right.left = link;

					left = link;
				} else {
					link.right = null;
					link.left = null;
				}
			} else {
				link.right = null;
				link.left = null;
			}
		}
	}
}

function batchOutput(map, distanceMap) {
	let i, j;

	update(map);
	// transfer results to the distanceMap
	for (i=0; i<map.width; i++) {
		for (j=0; j<map.height; j++) {
			distanceMap[i][j] = getLink(map, i, j).distance;
		}
	}
}


var DIJKSTRA_MAP = null;

function dijkstraScan(distanceMap, costMap, useDiagonals) {
	// static makeDijkstraMap map;

	if (!DIJKSTRA_MAP || DIJKSTRA_MAP.width < distanceMap.width || DIJKSTRA_MAP.height < distanceMap.height) {
		DIJKSTRA_MAP = makeDijkstraMap(distanceMap.width, distanceMap.height);
	}

	DIJKSTRA_MAP.width  = distanceMap.width;
	DIJKSTRA_MAP.height = distanceMap.height;

	pdsBatchInput(DIJKSTRA_MAP, distanceMap, costMap, PDS_NO_PATH, useDiagonals);
	batchOutput(DIJKSTRA_MAP, distanceMap);
}


//
// function populateGenericCostMap(costMap, map) {
//   let i, j;
//
// 	for (i=0; i<map.width; i++) {
// 		for (j=0; j<map.height; j++) {
//       if (map.hasTileFlag(i, j, def.T_OBSTRUCTS_PASSABILITY)
//           && (!map.hasTileMechFlag(i, j, def.TM_IS_SECRET) || (map.discoveredTileFlags(i, j) & def.T_OBSTRUCTS_PASSABILITY)))
// 			{
// 				costMap[i][j] = map.hasTileFlag(i, j, def.T_OBSTRUCTS_DIAGONAL_MOVEMENT) ? PDS_OBSTRUCTION : PDS_FORBIDDEN;
//       } else if (map.hasTileFlag(i, j, def.T_PATHING_BLOCKER & ~def.T_OBSTRUCTS_PASSABILITY)) {
// 				costMap[i][j] = PDS_FORBIDDEN;
//       } else {
//         costMap[i][j] = 1;
//       }
//     }
//   }
// }
//
// GW.path.populateGenericCostMap = populateGenericCostMap;
//
//
// function baseCostFunction(blockingTerrainFlags, traveler, canUseSecretDoors, i, j) {
// 	let cost = 1;
// 	monst = GW.MAP.actorAt(i, j);
// 	const monstFlags = (monst ? (monst.info ? monst.info.flags : monst.flags) : 0) || 0;
// 	if ((monstFlags & (def.MONST_IMMUNE_TO_WEAPONS | def.MONST_INVULNERABLE))
// 			&& (monstFlags & (def.MONST_IMMOBILE | def.MONST_GETS_TURN_ON_ACTIVATION)))
// 	{
// 			// Always avoid damage-immune stationary monsters.
// 		cost = PDS_FORBIDDEN;
// 	} else if (canUseSecretDoors
// 			&& GW.MAP.hasTileMechFlag(i, j, TM_IS_SECRET)
// 			&& GW.MAP.hasTileFlag(i, j, T_OBSTRUCTS_PASSABILITY)
// 			&& !(GW.MAP.hasDiscoveredFlag(i, j) & T_OBSTRUCTS_PASSABILITY))
// 	{
// 		cost = 1;
// 	} else if (GW.MAP.hasTileFlag(i, j, T_OBSTRUCTS_PASSABILITY)
// 				 || (traveler && traveler === GW.PLAYER && !(GW.MAP.hasCellFlag(i, j, (REVEALED | MAGIC_MAPPED)))))
// 	{
// 		cost = GW.MAP.hasTileFlag(i, j, T_OBSTRUCTS_DIAGONAL_MOVEMENT) ? PDS_OBSTRUCTION : PDS_FORBIDDEN;
// 	} else if ((traveler && GW.actor.avoidsCell(traveler, i, j)) || GW.MAP.hasTileFlag(i, j, blockingTerrainFlags)) {
// 		cost = PDS_FORBIDDEN;
// 	}
//
// 	return cost;
// }
//
// GW.path.costFn = baseCostFunction;
// GW.path.simpleCost = baseCostFunction.bind(undefined, 0, null, false);
// GW.path.costForActor = ((actor) => baseCostFunction.bind(undefined, GW.actor.forbiddenFlags(actor), actor, actor !== GW.PLAYER));

function calculateDistances(distanceMap,
						destinationX, destinationY,
						costMap,
						eightWays)
{
	if (!DIJKSTRA_MAP || DIJKSTRA_MAP.width < distanceMap.width || DIJKSTRA_MAP.height < distanceMap.height) {
		DIJKSTRA_MAP = makeDijkstraMap(distanceMap.width, distanceMap.height);
	}

	DIJKSTRA_MAP.width  = distanceMap.width;
	DIJKSTRA_MAP.height = distanceMap.height;

	let i, j;

	for (i=0; i<distanceMap.width; i++) {
		for (j=0; j<distanceMap.height; j++) {
			getLink(DIJKSTRA_MAP, i, j).cost = costMap.isBoundaryXY(i, j) ? PDS_OBSTRUCTION : costMap[i][j];
		}
	}

	clear(DIJKSTRA_MAP, PDS_NO_PATH, eightWays);
	setDistance(DIJKSTRA_MAP, destinationX, destinationY, 0);
	batchOutput(DIJKSTRA_MAP, distanceMap);
	distanceMap.x = destinationX;
	distanceMap.y = destinationY;
}


// function pathingDistance(x1, y1, x2, y2, blockingTerrainFlags, actor) {
// 	let retval;
// 	const distanceMap = GW.grid.alloc(DUNGEON.width, DUNGEON.height, 0);
// 	const costFn = baseCostFunction.bind(undefined, blockingTerrainFlags, actor, true);
// 	calculateDistances(distanceMap, x2, y2, costFn, true);
// 	retval = distanceMap[x1][y1];
// 	GW.grid.free(distanceMap);
// 	return retval;
// }
//
// GW.path.distanceFromTo = pathingDistance;



// function monstTravelDistance(monst, x2, y2, blockingTerrainFlags) {
// 	let retval;
// 	const distanceMap = GW.grid.alloc(DUNGEON.width, DUNGEON.height, 0);
// 	calculateDistances(distanceMap, x2, y2, blockingTerrainFlags, monst, true, true);
// 	retval = distanceMap[monst.x][monst.y];
// 	GW.grid.free(distanceMap);
// 	return retval;
// }
//
// GW.actor.travelDistance = monstTravelDistance;




// Returns null if there are no beneficial moves.
// If preferDiagonals is true, we will prefer diagonal moves.
// Always rolls downhill on the distance map.
// If monst is provided, do not return a direction pointing to
// a cell that the monster avoids.
function nextStep( map, distanceMap, x, y, traveler, useDiagonals) {
	let newX, newY, bestScore;
  let dir, bestDir;
  let blocker;	// creature *
  let blocked;

  // brogueAssert(coordinatesAreInMap(x, y));

	bestScore = 0;
	bestDir = def.NO_DIRECTION;

	for (dir = 0; dir < (useDiagonals ? 8 : 4); ++dir)
  {
		newX = x + def.dirs[dir][0];
		newY = y + def.dirs[dir][1];

    if (map.hasXY(newX, newY)) {
        blocked = false;
        const cell = map.cell(newX, newY);
        blocker = cell.actor;
        if (traveler
            && traveler.avoidsCell(cell, newX, newY))
				{
            blocked = true;
        } else if (traveler && blocker
                   && !traveler.kind.canPass(traveler, blocker))
				{
            blocked = true;
        }
        if (!blocked
						&& (distanceMap[x][y] - distanceMap[newX][newY]) > bestScore
            && !map.diagonalBlocked(x, y, newX, newY, traveler.isPlayer())
            && map.isPassableNow(newX, newY, traveler.isPlayer()))
				{
            bestDir = dir;
            bestScore = distanceMap[x][y] - distanceMap[newX][newY];
        }
    }
	}
	return def.dirs[bestDir] || null;
}



function getClosestValidLocationOnMap(distanceMap, x, y) {
	let i, j, dist, closestDistance, lowestMapScore;
	let locX = -1;
	let locY = -1;

	closestDistance = 10000;
	lowestMapScore = 10000;
	for (i=1; i<distanceMap.width-1; i++) {
		for (j=1; j<distanceMap.height-1; j++) {
			if (distanceMap[i][j] >= 0 && distanceMap[i][j] < PDS_NO_PATH) {
				dist = (i - x)*(i - x) + (j - y)*(j - y);
				if (dist < closestDistance
					|| dist == closestDistance && distanceMap[i][j] < lowestMapScore)
				{
					locX = i;
					locY = j;
					closestDistance = dist;
					lowestMapScore = distanceMap[i][j];
				}
			}
		}
	}
	if (locX >= 0) return [locX, locY];
	return null;
}


// Populates path[][] with a list of coordinates starting at origin and traversing down the map. Returns the number of steps in the path.
function getPath(map, distanceMap, originX, originY, actor) {
	let x, y, steps;

	// actor = actor || GW.PLAYER;
	x = originX;
	y = originY;
	steps = 0;

	if (distanceMap[x][y] < 0 || distanceMap[x][y] >= PDS_NO_PATH) {
		const loc = getClosestValidLocationOnMap(distanceMap, x, y);
		if (loc) {
			x = loc[0];
			y = loc[1];
		}
	}

	const path = [[x, y]];
  let dir;
  do {
		dir = nextStep(map, distanceMap, x, y, actor, true);
		if (dir) {
			x += dir[0];
			y += dir[1];
			// path[steps][0] = x;
			// path[steps][1] = y;
			path.push([x,y]);
			steps++;
      // brogueAssert(coordinatesAreInMap(x, y));
		}
	}
  while (dir);

	return steps ? path : null;
}
//
// GW.path.from = getMonsterPathOnMap;

var path = {
  __proto__: null,
  dijkstraScan: dijkstraScan,
  calculateDistances: calculateDistances,
  nextStep: nextStep,
  getPath: getPath
};

var digger = {};
var diggers = {};

digger.debug = NOOP;

const DIRS$2 = def.dirs;


const TILE = 1;


function installDigger(id, fn, config) {
  config = fn(config || {});	// call to have function setup the config
  config.fn = fn;
  config.id = id;
  diggers[id] = config;
  return config;
}

digger.install = installDigger;


function checkDiggerConfig(config, opts) {
  config = config || {};
  opts = opts || {};

  if (!config.width || !config.height) ERROR('All diggers require config to include width and height.');

  Object.entries(opts).forEach( ([key,expect]) => {
    const have = config[key];

    if (expect === true) {	// needs to be a number > 0
      if (typeof have !== 'number') {
        ERROR('Invalid configuration for digger: ' + key + ' expected number received ' + typeof have);
      }
    }
    else if (typeof expect === 'number') {	// needs to be a number, this is the default
      const have = config[key];
      if (typeof have !== 'number') {
        config[key] = expect;	// provide default
      }
    }
    else if (Array.isArray(expect)) {	// needs to be an array with this size, these are the defaults
      if (typeof have === 'number') {
        config[key] = new Array(expect.length).fill(have);
      }
      else if (!Array.isArray(have)) {
        WARN('Received unexpected config for digger : ' + key + ' expected array, received ' + typeof have + ', using defaults.');
        config[key] = expect.slice();
      }
      else if (expect.length > have.length) {
        for(let i = have.length; i < expect.length; ++i) {
          have[i] = expect[i];
        }
      }
    }
    else {
      WARN('Unexpected digger configuration parameter: ', key, expect);
    }
  });

  return config;
}

digger.checkConfig = checkDiggerConfig;


function digCavern(config, grid$1) {
  config = digger.checkConfig(config, { width: 12, height: 8 });
  if (!grid$1) return config;

  let destX, destY;
  let blobGrid;

  blobGrid = alloc(grid$1.width, grid$1.height, 0);

  const minWidth  = Math.floor(0.5 * config.width); // 6
  const maxWidth  = config.width;
  const minHeight = Math.floor(0.5 * config.height);  // 4
  const maxHeight = config.height;

  grid$1.fill(0);
  const bounds = fillBlob(blobGrid, 5, minWidth, minHeight, maxWidth, maxHeight, 55, "ffffffttt", "ffffttttt");

  // Position the new cave in the middle of the grid...
  destX = Math.floor((grid$1.width - bounds.width) / 2);
  destY = Math.floor((grid$1.height - bounds.height) / 2);

  // ...and copy it to the master grid.
  offsetZip(grid$1, blobGrid, destX - bounds.x, destY - bounds.y, TILE);
  free(blobGrid);
  return config.id;
}

digger.cavern = digCavern;


function digChoiceRoom(config, grid) {
  config = config || {};
  let choices;
  if (Array.isArray(config.choices)) {
    choices = config.choices;
  }
  else if (typeof config.choices == 'object') {
    choices = Object.keys(config.choices);
  }
  else {
    ERROR('Expected choices to be either array of choices or map { digger: weight }');
  }
  for(let choice of choices) {
    if (!diggers[choice]) {
      ERROR('Missing digger choice: ' + choice);
    }
  }

  if (!grid) return config;

  let id;
  if (Array.isArray(config.choices)) {
    id = random.item(config.choices);
  }
  else {
    id = random.lottery(config.choices);
  }
  const digger = diggers[id];
  let digConfig = digger;
  if (config.opts) {
    digConfig = Object.assign({}, digger, config.opts);
  }
  // digger.debug('Chose room: ', id);
  digger.fn(digConfig, grid);
  return digger.id;
}

digger.choiceRoom = digChoiceRoom;


// From BROGUE => This is a special room that appears at the entrance to the dungeon on depth 1.
function digEntranceRoom(config, grid) {
  config = digger.checkConfig(config, { width: 20, height: 10 });
  if (!grid) return config;

  const roomWidth = Math.floor(0.4 * config.width); // 8
  const roomHeight = config.height;
  const roomWidth2 = config.width;
  const roomHeight2 = Math.floor(0.5 * config.height);  // 5

  // ALWAYS start at bottom+center of map
  const roomX = Math.floor(grid.width/2 - roomWidth/2 - 1);
  const roomY = grid.height - roomHeight - 2;
  const roomX2 = Math.floor(grid.width/2 - roomWidth2/2 - 1);
  const roomY2 = grid.height - roomHeight2 - 2;

  grid.fill(0);
  grid.fillRect(roomX, roomY, roomWidth, roomHeight, TILE);
  grid.fillRect(roomX2, roomY2, roomWidth2, roomHeight2, TILE);
  return config.id;
}


digger.entranceRoom = digEntranceRoom;


function digCrossRoom(config, grid) {
  config = digger.checkConfig(config, { width: 12, height: 20 });
  if (!grid) return config;

  const roomWidth = Math.max(2, Math.floor( config.width * random.range(15, 60) / 100)); // [3,12]
  const roomWidth2 = Math.max(2, Math.floor( config.width * random.range(20, 100) / 100)); // [4,20]
  const roomHeight = Math.max(2, Math.floor( config.height * random.range(50, 100) / 100));  // [3,7]
  const roomHeight2 = Math.max(2, Math.floor( config.height * random.range(25, 75) / 100));  // [2,5]

  const roomX = random.range(Math.max(0, Math.floor(grid.width/2) - (roomWidth - 1)), Math.min(grid.width, Math.floor(grid.width/2)));
  const roomX2 = (roomX + Math.floor(roomWidth / 2) + random.range(0, 2) + random.range(0, 2) - 3) - Math.floor(roomWidth2 / 2);
  const roomY = Math.floor(grid.height/2 - roomHeight);
  const roomY2 = Math.floor(grid.height/2 - roomHeight2 - (random.range(0, 2) + random.range(0, 1)));

  grid.fill(0);

  grid.fillRect(roomX - 5, roomY + 5, roomWidth, roomHeight, TILE);
  grid.fillRect(roomX2 - 5, roomY2 + 5, roomWidth2, roomHeight2, TILE);
  return config.id;
}

digger.crossRoom = digCrossRoom;


function digSymmetricalCrossRoom(config, grid) {
  config = digger.checkConfig(config, { width: 8, height: 5 });
  if (!grid) return config;

  let majorWidth = Math.floor( config.width * random.range(50, 100) / 100); // [4,8]
  let majorHeight = Math.floor( config.height * random.range(75, 100) / 100); // [4,5]

  let minorWidth = Math.max(2, Math.floor( config.width * random.range(25, 50) / 100));  // [2,4]
  if (majorHeight % 2 == 0 && minorWidth > 2) {
      minorWidth -= 1;
  }
  let minorHeight = Math.max(2, Math.floor( config.height * random.range(25, 50) / 100));	// [2,3]?
  if (majorWidth % 2 == 0 && minorHeight > 2) {
      minorHeight -= 1;
  }

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - majorWidth)/2), Math.floor((grid.height - minorHeight)/2), majorWidth, minorHeight, TILE);
  grid.fillRect(Math.floor((grid.width - minorWidth)/2), Math.floor((grid.height - majorHeight)/2), minorWidth, majorHeight, TILE);
  return config.id;
}

digger.symmetricalCrossRoom = digSymmetricalCrossRoom;


function digRectangularRoom(config, grid) {
  config = digger.checkConfig(config, { width: 6, height: 4, minPct: 50 });
  if (!grid) return config;

  const width = Math.floor( config.width * random.range(config.minPct, 100) / 100);  // [3,6]
  const height = Math.floor( config.height * random.range(config.minPct, 100) / 100);  // [2,4]

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - width) / 2), Math.floor((grid.height - height) / 2), width, height, TILE);
  return config.id;
}

digger.rectangularRoom = digRectangularRoom;


function digCircularRoom(config, grid) {
  config = digger.checkConfig(config, { width: 6, height: 6 });
  if (!grid) return config;

  const radius = Math.floor( (Math.min(config.width, config.height)-1) * random.range(75, 100) / 200);  // [3,4]

  grid.fill(0);
  if (radius > 1) {
    grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, TILE);
  }

  return config.id;
}

digger.circularRoom = digCircularRoom;


function digBrogueDonut(config, grid) {
  config = digger.checkConfig(config, { width: 10, height: 10, altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
  if (!grid) return config;

  const radius = Math.floor( Math.min(config.width, config.height) * random.range(75, 100) / 100);  // [5,10]

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, TILE);

  if (radius > config.ringMinWidth + config.holeMinSize
      && random.chance(config.holeChance))
  {
      grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), random.range(config.holeMinSize, radius - config.holeMinSize), 0);
  }
  return config.id;
}

digger.brogueDonut = digBrogueDonut;


function digChunkyRoom(config, grid) {
  config = digger.checkConfig(config, { count: 8 });
  if (!grid) return config;

  let i, x, y;
  let minX, maxX, minY, maxY;
  let chunkCount = Math.floor( config.count * random.range(25, 100) / 100); // [2,8]

  minX = Math.floor(grid.width/2) - Math.floor(config.width/2);
  maxX = Math.floor(grid.width/2) + Math.floor(config.width/2);
  minY = Math.floor(grid.height/2) - Math.floor(config.height/2);
  maxY = Math.floor(grid.height/2) + Math.floor(config.height/2);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), 2, 1);

  for (i=0; i<chunkCount;) {
      x = random.range(minX, maxX);
      y = random.range(minY, maxY);
      if (grid[x][y]) {
//            colorOverDungeon(/* Color. */darkGray);
//            hiliteGrid(grid, /* Color. */white, 100);

          if (x - 2 < minX) continue;
          if (x + 2 > maxX) continue;
          if (y - 2 < minY) continue;
          if (y + 2 > maxY) continue;

          grid.fillCircle(x, y, 2, TILE);
          i++;

//            hiliteGrid(grid, /* Color. */green, 50);
//            temporaryMessage("Added a chunk:", true);
      }
  }
  return config.id;
}

digger.chunkyRoom = digChunkyRoom;



function chooseRandomDoorSites(sourceGrid) {
  let i, j, k, newX, newY;
  let dir;
  let doorSiteFailed;

  const grid$1 = alloc(sourceGrid.width, sourceGrid.height);
  grid$1.copy(sourceGrid);

  for (i=0; i<grid$1.width; i++) {
      for (j=0; j<grid$1.height; j++) {
          if (!grid$1[i][j]) {
              dir = directionOfDoorSite(grid$1, i, j);
              if (dir != def.NO_DIRECTION) {
                  // Trace a ray 10 spaces outward from the door site to make sure it doesn't intersect the room.
                  // If it does, it's not a valid door site.
                  newX = i + DIRS$2[dir][0];
                  newY = j + DIRS$2[dir][1];
                  doorSiteFailed = false;
                  for (k=0; k<10 && grid$1.hasXY(newX, newY) && !doorSiteFailed; k++) {
                      if (grid$1[newX][newY]) {
                          doorSiteFailed = true;
                      }
                      newX += DIRS$2[dir][0];
                      newY += DIRS$2[dir][1];
                  }
                  if (!doorSiteFailed) {
                      grid$1[i][j] = dir + 10000; // So as not to conflict with other tiles.
                  }
              }
          }
      }
  }

  let doorSites = [];
  // Pick four doors, one in each direction, and store them in doorSites[dir].
  for (dir=0; dir<4; dir++) {
      const loc = grid$1.randomMatchingXY(dir + 10000) || [-1, -1];
      doorSites[dir] = loc.slice();
  }

  free(grid$1);
  return doorSites;
}

digger.chooseRandomDoorSites = chooseRandomDoorSites;



function attachHallway(grid, doorSitesArray, opts) {
    let i, x, y, newX, newY;
    let length;
    let dir, dir2;
    let allowObliqueHallwayExit;

    opts = opts || {};
    const tile = opts.tile || 1;

    const horizontalLength = firstOpt('horizontalHallLength', opts, [9,15]);
    const verticalLength = firstOpt('verticalHallLength', opts, [2,9]);

    // Pick a direction.
    dir = opts.dir;
    if (dir === undefined) {
      const dirs = random.sequence(4);
      for (i=0; i<4; i++) {
          dir = dirs[i];
          if (doorSitesArray[dir][0] != -1
              && doorSitesArray[dir][1] != -1
              && grid.hasXY(doorSitesArray[dir][0] + Math.floor(DIRS$2[dir][0] * horizontalLength[1]),
                                     doorSitesArray[dir][1] + Math.floor(DIRS$2[dir][1] * verticalLength[1])) ) {
                  break; // That's our direction!
          }
      }
      if (i==4) {
          return; // No valid direction for hallways.
      }
    }

    if (dir == def.UP || dir == def.DOWN) {
        length = random.range(...verticalLength);
    } else {
        length = random.range(...horizontalLength);
    }

    x = doorSitesArray[dir][0];
    y = doorSitesArray[dir][1];

    const attachLoc = [x - DIRS$2[dir][0], y - DIRS$2[dir][1]];
    for (i = 0; i < length; i++) {
        if (grid.hasXY(x, y)) {
            grid[x][y] = tile;
        }
        x += DIRS$2[dir][0];
        y += DIRS$2[dir][1];
    }
    x = clamp(x - DIRS$2[dir][0], 0, grid.width - 1);
    y = clamp(y - DIRS$2[dir][1], 0, grid.height - 1); // Now (x, y) points at the last interior cell of the hallway.
    allowObliqueHallwayExit = random.chance(15);
    for (dir2 = 0; dir2 < 4; dir2++) {
        newX = x + DIRS$2[dir2][0];
        newY = y + DIRS$2[dir2][1];

        if ((dir2 != dir && !allowObliqueHallwayExit)
            || !grid.hasXY(newX, newY)
            || grid[newX][newY])
        {
            doorSitesArray[dir2][0] = -1;
            doorSitesArray[dir2][1] = -1;
        } else {
            doorSitesArray[dir2][0] = newX;
            doorSitesArray[dir2][1] = newY;
        }
    }

    return attachLoc;
}

digger.attachHallway = attachHallway;

def.INTENSITY_DARK = 20; // less than 20% for highest color in rgb

const LIGHT_COMPONENTS = make$2();

class Light {
	constructor(color$1, range, fadeTo, pass) {
		this.color = from(color$1) || null;	/* color */
		this.radius = make.range(range || 1);
		this.fadeTo = Number.parseInt(fadeTo) || 0;
		this.passThroughActors = (pass && (pass !== 'false')) ? true : false; // generally no, but miner light does
	}

	copy(other) {
		this.color = other.color;
		this.radius.copy(other.radius);
		this.fadeTo = other.fadeTo;
		this.passThroughActors = other.passThroughActors;
	}

  // Returns true if any part of the light hit cells that are in the player's field of view.
  paint( map, x, y, maintainShadows=false, isMinersLight=false) {

  	if (!map) return;

  	let k;
  	// let colorComponents = [0,0,0];
    let lightMultiplier;

  	let radius = this.radius.value();
  	let outerRadius = Math.ceil(radius);

  	// calcLightComponents(colorComponents, this);
    LIGHT_COMPONENTS.copy(this.color).bake();

    // console.log('paint', LIGHT_COMPONENTS.toString(true), x, y, outerRadius);

  	// the miner's light does not dispel IS_IN_SHADOW,
  	// so the player can be in shadow despite casting his own light.
  	const dispelShadows = !maintainShadows && (intensity(LIGHT_COMPONENTS) > def.INTENSITY_DARK);
  	const fadeToPercent = this.fadeTo;

    const grid$1 = alloc(map.width, map.height, 0);
  	map.calcFov(grid$1, x, y, outerRadius, (this.passThroughActors ? 0 : Cell.HAS_ACTOR), Tile.T_OBSTRUCTS_VISION, !isMinersLight);

    let overlappedFieldOfView = false;

    grid$1.forCircle(x, y, outerRadius, (v, i, j) => {
      if (!v) return;
      const cell = map.cell(i, j);

      lightMultiplier = Math.floor(100 - (100 - fadeToPercent) * (distanceBetween(x, y, i, j) / radius));
      for (k=0; k<3; k++) {
        cell.light[k] += Math.floor(LIGHT_COMPONENTS[k] * lightMultiplier / 100);
      }
      if (dispelShadows) {
        cell.flags &= ~Cell.IS_IN_SHADOW;
      }
      if (cell.flags & (Cell.IN_FOV | Cell.ANY_KIND_OF_VISIBLE)) {
          overlappedFieldOfView = true;
      }

      // console.log(i, j, lightMultiplier, cell.light);
    });

  	if (dispelShadows) {
      const cell = map.cell(x, y);
  		cell.flags &= ~Cell.IS_IN_SHADOW;
  	}

  	free(grid$1);
    return overlappedFieldOfView;
  }

}

types.Light = Light;


function intensity(color) {
  const data = color.color || color;
  return Math.max(data[0], data[1], data[2]);
}


function make$4(color, radius, fadeTo, pass) {

	if (arguments.length == 1) {
		if (color && color.color) {
			pass = color.passThroughActors;
			fadeTo = color.fadeTo;
			radius = color.radius;
			color = color.color;
		}
		else if (typeof color === 'string') {
			([color, radius, fadeTo, pass] = color.split(/[,|]/).map( (t) => t.trim() ));
		}
		else if (Array.isArray(color)) {
			([color, radius, fadeTo, pass] = color);
		}
	}
	else {
		([color, radius, fadeTo, pass] = arguments);
	}

	radius = radius || 0;
	return new types.Light(color, radius, fadeTo, pass);
}

make.light = make$4;

const LIGHT_SOURCES = lights;


// TODO - USE STRINGS FOR LIGHT SOURCE IDS???
//      - addLightKind(id, source) { LIIGHT_SOURCES[id] = source; }
//      - LIGHT_SOURCES = {};
function addKind$1(id, ...args) {
	let source = args[0];
	if (source && !(source instanceof types.Light)) {
		source = make.light(...args);
	}
	LIGHT_SOURCES[id] = source;
	if (source) source.id = id;
	return source;
}



function addKinds(config) {
	const entries = Object.entries(config);
	entries.forEach( ([name,info]) => {
		addKind$1(name, info);
	});
}




function from$1(...args) {
	if (args.length == 1 && typeof args[0] === 'string' ) {
		const cached = LIGHT_SOURCES[args[0]];
		if (cached) return cached;
	}
	return make$4(...args);
}



// export function calcLightComponents(colorComponents, theLight) {
// 	const randComponent = cosmetic.range(0, theLight.color.rand);
// 	colorComponents[0] = randComponent + theLight.color.red + cosmetic.range(0, theLight.color.redRand);
// 	colorComponents[1] = randComponent + theLight.color.green + cosmetic.range(0, theLight.color.greenRand);
// 	colorComponents[2] = randComponent + theLight.color.blue + cosmetic.range(0, theLight.color.blueRand);
// }




function updateDisplayDetail(map) {

  map.eachCell( (cell, i, j) => {
    // clear light flags
    cell.flags &= ~(Cell.CELL_LIT | Cell.CELL_DARK);

    if (cell.light.some( (v, i) => v !== cell.oldLight[i])) {
      cell.flags |= Cell.LIGHT_CHANGED;
    }

    if (cell.isDark())
    {
      cell.flags |= Cell.CELL_DARK;
    } else if (!(cell.flags & Cell.IS_IN_SHADOW)) {
      cell.flags |= Cell.CELL_LIT;
    }
  });
}

function backUpLighting(map, lights) {
	let k;
  map.eachCell( (cell, i, j) => {
    for (k=0; k<3; k++) {
      lights[i][j][k] = cell.light[k];
    }
  });
}

function restoreLighting(map, lights) {
	let k;
  map.eachCell( (cell, i, j) => {
    for (k=0; k<3; k++) {
      cell.light[k] = lights[i][j][k];
    }
  });
}

function recordOldLights(map) {
  let k;
  map.eachCell( (cell) => {
    for (k=0; k<3; k++) {
			cell.oldLight[k] = cell.light[k];
			cell.flags &= ~(Cell.LIGHT_CHANGED);
		}
  });
}

function zeroOutLights(map) {
	let k;
  const light = map.ambientLight ? map.ambientLight : [0,0,0];
  map.eachCell( (cell, i, j) => {
    for (k=0; k<3; k++) {
      cell.light[k] = light[k];
    }
    cell.flags |= Cell.IS_IN_SHADOW;
  });
}

function recordGlowLights(map) {
  let k;
  map.eachCell( (cell) => {
    for (k=0; k<3; k++) {
			cell.glowLight[k] = cell.light[k];
		}
  });
}

function restoreGlowLights(map) {
	let k;
  map.eachCell( (cell) => {
    for (k=0; k<3; k++) {
      cell.light[k] = cell.glowLight[k];
    }
  });
}


function updateLighting(map) {

	// Copy Light over oldLight
  recordOldLights(map);

  if (map.flags & Map.MAP_STABLE_LIGHTS) return false;

  // and then zero out Light.
	zeroOutLights(map);

	if (map.flags & Map.MAP_STABLE_GLOW_LIGHTS) {
		restoreGlowLights(map);
	}
	else {
		// GW.debug.log('painting glow lights.');
		// Paint all glowing tiles.
    map.eachLight( (id, x, y) => {
      const light = LIGHT_SOURCES[id];
      if (light) {
        light.paint(map, x, y);
      }
    });

		recordGlowLights(map);
		map.flags |= Map.MAP_STABLE_GLOW_LIGHTS;
	}

	// Cycle through monsters and paint their lights:
  eachChain(map.actors, (actor) => {
    if (actor.kind.light) {
			actor.kind.light.paint(map, actor.x, actor.y);
		}
    // if (monst.mutationIndex >= 0 && mutationCatalog[monst.mutationIndex].light != LIGHT_SOURCES['NO_LIGHT']) {
    //     paint(map, mutationCatalog[monst.mutationIndex].light, actor.x, actor.y, false, false);
    // }
		// if (actor.isBurning()) { // monst.status.burning && !(actor.kind.flags & Flags.Actor.AF_FIERY)) {
		// 	paint(map, LIGHT_SOURCES.BURNING_CREATURE, actor.x, actor.y, false, false);
		// }
		// if (actor.isTelepathicallyRevealed()) {
		// 	paint(map, LIGHT_SOURCES['TELEPATHY_LIGHT'], actor.x, actor.y, false, true);
		// }
  });

	// Also paint telepathy lights for dormant monsters.
  // for (monst of map.dormantMonsters) {
  //     if (monsterTelepathicallyRevealed(monst)) {
  //         paint(map, LIGHT_SOURCES['TELEPATHY_LIGHT'], monst.xLoc, monst.yLoc, false, true);
  //     }
  // }

	updateDisplayDetail(map);

	// Miner's light:
  const PLAYER = data.player;
  if (PLAYER) {
    const MINERS_LIGHT = LIGHT_SOURCES.MINERS_LIGHT;
    if (MINERS_LIGHT && MINERS_LIGHT.radius) {
      MINERS_LIGHT.paint(map, PLAYER.x, PLAYER.y, true, true);
    }
  }

  map.flags |= Map.MAP_STABLE_LIGHTS;

  // if (PLAYER.status.invisible) {
  //     PLAYER.info.foreColor = playerInvisibleColor;
	// } else if (playerInDarkness()) {
	// 	PLAYER.info.foreColor = playerInDarknessColor;
	// } else if (pmap[PLAYER.xLoc][PLAYER.yLoc].flags & IS_IN_SHADOW) {
	// 	PLAYER.info.foreColor = playerInShadowColor;
	// } else {
	// 	PLAYER.info.foreColor = playerInLightColor;
	// }

  return true;
}


// TODO - Move and make more generic
function playerInDarkness(map, PLAYER, darkColor) {
  const cell = map.cell(PLAYER.x, PLAYER.y);
	return (cell.light[0] + 10 < darkColor.red
			&& cell.light[1] + 10 < darkColor.green
			&& cell.light[2] + 10 < darkColor.blue);
}

var light = {
  __proto__: null,
  intensity: intensity,
  make: make$4,
  addKind: addKind$1,
  addKinds: addKinds,
  from: from$1,
  backUpLighting: backUpLighting,
  restoreLighting: restoreLighting,
  recordOldLights: recordOldLights,
  zeroOutLights: zeroOutLights,
  recordGlowLights: recordGlowLights,
  restoreGlowLights: restoreGlowLights,
  updateLighting: updateLighting,
  playerInDarkness: playerInDarkness
};

const TileLayer = def.layer;


class TileEvent$1 {
	constructor(opts={})
	{
		if (typeof opts === 'function') {
			opts = {
				fn: opts,
			};
		}

		this.tile = opts.tile || 0;
		this.fn = opts.fn || null;
		this.item = opts.item || null;
		this.chance = opts.chance || 0;
		this.volume = opts.volume || 0;

		// spawning pattern:
		this.spread = opts.spread || 0;
		this.radius = opts.radius || 0;
		this.decrement = opts.decrement || 0;
		this.flags = TileEvent.toFlag(opts.flags);
		this.matchTile = opts.matchTile || opts.needs || 0;	/* ENUM tileType */
		this.next = opts.next || null;	/* ENUM makeEventTypes */

		this.message = opts.message || null;
	  this.lightFlare = opts.flare || 0;
		this.flashColor = opts.flash ? from(opts.flash) : null;
		// this.effectRadius = radius || 0;
		this.messageDisplayed = false;
		this.eventName = opts.event || opts.emit || null;	// name of the event to emit when activated
		this.id = opts.id || null;
	}

}

types.TileEvent = TileEvent$1;


// Dungeon features, spawned from Architect.c:
function make$5(opts) {
  if (!opts) return null;
  if (typeof opts === 'string') {
    opts = { tile: opts };
  }
	const te = new types.TileEvent(opts);
	return te;
}

make.tileEvent = make$5;


function addKind$2(id, event) {
	if (arguments.length > 2 || !(event instanceof types.TileEvent)) {
		event = make.tileEvent(...[].slice.call(arguments, 1));
	}
  tileEvents$1[id] = event;
	if (event) tileEvent.id = id;
	return event;
}


addKind$2('DF_NONE');



function resetAllMessages() {
	Object.values(tileEvents).forEach( (f) => {
		if (f instanceof types.TileEvent) {
			f.messageDisplayed = false;
		}
	});
}




// returns whether the feature was successfully generated (false if we aborted because of blocking)
async function spawn(feat, ctx) {
	let i, j;
	let tile, itemKind;

	if (!feat) return false;
	if (!ctx) return false;

	if (typeof feat === 'string') {
		const name = feat;
		feat = tileEvents$1[feat];
		if (!feat) ERROR('Unknown tile Event: ' + name);
	}

	if (typeof feat === 'function') {
		return feat(ctx);
	}

	const map = ctx.map;
	const x = ctx.x;
	const y = ctx.y;

	if (!map || x === undefined || y === undefined) {
		ERROR('MAP, x, y are required in context.');
	}

	if (ctx.safe && map.hasCellMechFlag(x, y, CellMech.EVENT_FIRED_THIS_TURN)) {
		if (!(feat.flags & TileEvent.DFF_ALWAYS_FIRE)) {
      // tileEvent.debug('spawn - already fired.');
			return false;
		}
	}

	// tileEvent.debug('spawn', x, y, 'id=', feat.id, 'tile=', feat.tile, 'item=', feat.item);

	const refreshCell = ctx.refreshCell = ctx.refreshCell || !(feat.flags & TileEvent.DFF_NO_REDRAW_CELL);
	const abortIfBlocking = ctx.abortIfBlocking = ctx.abortIfBlocking || (feat.flags & TileEvent.DFF_ABORT_IF_BLOCKS_MAP);

  // if ((feat.flags & DFF_RESURRECT_ALLY) && !resurrectAlly(x, y))
	// {
  //     return false;
  // }

  if (feat.message && feat.message.length && !feat.messageDisplayed && map.isVisible(x, y)) {
		feat.messageDisplayed = true;
		MSG.add(feat.message);
	}

  if (feat.tile) {
		tile = tiles[feat.tile];
		if (!tile) {
			ERROR('Unknown tile: ' + feat.tile);
		}
	}

	if (feat.item) {
		itemKind = itemKinds[feat.item];
		if (!itemKind) {
			ERROR('Unknown item: ' + feat.item);
		}
	}

	// Blocking keeps track of whether to abort if it turns out that the DF would obstruct the level.
	const blocking = ctx.blocking = ((abortIfBlocking
							 && !(feat.flags & TileEvent.DFF_PERMIT_BLOCKING)
							 && ((tile && (tile.flags & (Tile.T_PATHING_BLOCKER)))
										|| (itemKind && (itemKind.flags & ItemKind.IK_BLOCKS_MOVE))
										|| (feat.flags & TileEvent.DFF_TREAT_AS_BLOCKING))) ? true : false);

	// tileEvent.debug('- blocking', blocking);

	const spawnMap = alloc(map.width, map.height);

	let didSomething = false;
	computeSpawnMap(feat, spawnMap, ctx);
  if (!blocking || !map.gridDisruptsPassability(spawnMap, { bounds: ctx.bounds })) {
		if (feat.flags & TileEvent.DFF_EVACUATE_CREATURES) { // first, evacuate creatures, so that they do not re-trigger the tile.
				if (evacuateCreatures(map, spawnMap)) {
          didSomething = true;
        }
		}

		if (feat.flags & TileEvent.DFF_EVACUATE_ITEMS) { // first, evacuate items, so that they do not re-trigger the tile.
				if (evacuateItems(map, spawnMap)) {
          didSomething = true;
        }
		}

		if (feat.flags & TileEvent.DFF_NULLIFY_CELL) { // first, clear other tiles (not base/ground)
				if (nullifyCells(map, spawnMap, feat.flags)) {
          didSomething = true;
        }
		}

		if (tile || itemKind || feat.fn) {
			if (await spawnTiles(feat, spawnMap, ctx, tile, itemKind)) {
        didSomething = true;
      }
		}
	}

	if (didSomething && (feat.flags & TileEvent.DFF_PROTECTED)) {
		spawnMap.forEach( (v, i, j) => {
			if (!v) return;
			const cell = map.cell(i, j);
			cell.mechFlags |= CellMech.EVENT_PROTECTED;
		});
	}

	// if (refreshCell && feat.tile
	// 	&& (tile.flags & (Flags.Tile.T_IS_FIRE | Flags.Tile.T_AUTO_DESCENT))
	// 	&& map.hasTileFlag(PLAYER.xLoc, PLAYER.yLoc, (Flags.Tile.T_IS_FIRE | Flags.Tile.T_AUTO_DESCENT)))
	// {
	// 	await applyInstantTileEffectsToCreature(PLAYER);
	// }

	// apply tile effects
	if (didSomething) {
		for(let i = 0; i < spawnMap.width; ++i) {
			for(let j = 0; j < spawnMap.height; ++j) {
				const v = spawnMap[i][j];
				if (!v || data.gameHasEnded) continue;
				const cell = map.cell(i, j);
				if (cell.actor || cell.item) {
					for(let t of cell.tiles()) {
						await t.applyInstantEffects(map, i, j, cell);
						if (data.gameHasEnded) {
							return true;
						}
					}
				}
			}
		}
	}

  if (feat.eventName) {
		await emit(feat.eventName, ctx);
    didSomething = true;
	}

	if (data.gameHasEnded) {
		free(spawnMap);
		return didSomething;
	}

  //	if (succeeded && feat.message[0] && !feat.messageDisplayed && isVisible(x, y)) {
  //		feat.messageDisplayed = true;
  //		message(feat.message, false);
  //	}
  if (feat.next && (didSomething || feat.flags & TileEvent.DFF_SUBSEQ_ALWAYS)) {
    // tileEvent.debug('- subsequent: %s, everywhere=%s', feat.next, feat.flags & Flags.TileEvent.DFF_SUBSEQ_EVERYWHERE);
    if (feat.flags & TileEvent.DFF_SUBSEQ_EVERYWHERE) {
        for (i=0; i<map.width; i++) {
            for (j=0; j<map.height; j++) {
                if (spawnMap[i][j]) {
										ctx.x = i;
										ctx.y = j;
                    await spawn(feat.next, ctx);
                }
            }
        }
				ctx.x = x;
				ctx.y = y;
    }
		else {
        await spawn(feat.next, ctx);
    }
	}
	if (didSomething) {
    if (feat.tile
        && (tile.flags & (Tile.T_IS_DEEP_WATER | Tile.T_LAVA | Tile.T_AUTO_DESCENT)))
		{
        data.updateMapToShoreThisTurn = false;
    }

    // awaken dormant creatures?
    // if (feat.flags & Flags.TileEvent.DFF_ACTIVATE_DORMANT_MONSTER) {
    //     for (monst of map.dormant) {
    //         if (monst.x == x && monst.y == y || spawnMap[monst.x][monst.y]) {
    //             // found it!
    //             toggleMonsterDormancy(monst);
    //         }
    //     }
    // }
  }

	if (didSomething) {
    spawnMap.forEach( (v, i, j) => {
      if (v) map.redrawXY(i, j);
    });

		ui.requestUpdate();

		if (!(feat.flags & TileEvent.DFF_NO_MARK_FIRED)) {
			spawnMap.forEach( (v, i, j) => {
				if (v) {
					map.setCellFlags(i, j, 0, CellMech.EVENT_FIRED_THIS_TURN);
				}
			});
		}
	}

  // tileEvent.debug('- spawn complete : @%d,%d, ok=%s, feat=%s', ctx.x, ctx.y, didSomething, feat.id);

	free(spawnMap);
	return didSomething;
}



function cellIsOk(feat, x, y, ctx) {
	const map = ctx.map;
	if (!map.hasXY(x, y)) return false;
	const cell = map.cell(x, y);

	if (feat.flags & TileEvent.DFF_BUILD_IN_WALLS) {
		if (!cell.isWall()) return false;
	}
	else if (feat.flags & TileEvent.DFF_MUST_TOUCH_WALLS) {
		let ok = false;
		map.eachNeighbor(x, y, (c) => {
			if (c.isWall()) {
				ok = true;
			}
		});
		if (!ok) return false;
	}
	else if (feat.flags & TileEvent.DFF_NO_TOUCH_WALLS) {
		let ok = true;
		map.eachNeighbor(x, y, (c) => {
			if (c.isWall()) {
				ok = false;
			}
		});
		if (!ok) return false;
	}

	if (ctx.bounds && !ctx.bounds.containsXY(x, y)) return false;
	if (feat.matchTile && !cell.hasTile(feat.matchTile)) return false;
	if (cell.hasTileFlag(Tile.T_OBSTRUCTS_TILE_EFFECTS) && !feat.matchTile && (ctx.x != x || ctx.y != y)) return false;

	return true;
}


function computeSpawnMap(feat, spawnMap, ctx)
{
	let i, j, dir, t, x2, y2;
	let madeChange;

	const map = ctx.map;
	const x = ctx.x;
	const y = ctx.y;
	const bounds = ctx.bounds || null;

	let startProb = feat.spread || 0;
	let probDec = feat.decrement || 0;

	if (feat.matchTile && typeof feat.matchTile === 'string') {
		const name = feat.matchTile;
		const tile = tiles[name];
		if (!tile) {
			ERROR('Failed to find match tile with name:' + name);
		}
		feat.matchTile = tile.id;
	}

	spawnMap[x][y] = t = 1; // incremented before anything else happens

	let radius = feat.radius || 0;
	if (feat.flags & TileEvent.DFF_SPREAD_CIRCLE) {
		radius = 0;
		startProb = startProb || 100;
		if (startProb >= 100) {
			probDec = probDec || 100;
		}
		while ( random.chance(startProb) ) {
			startProb -= probDec;
			++radius;
		}
		startProb = 100;
		probDec = 0;
	}

	if (radius) {
		startProb = startProb || 100;
		spawnMap.updateCircle(x, y, radius, (v, i, j) => {
			if (!cellIsOk(feat, i, j, ctx)) return 0;

			const dist = Math.floor(distanceBetween(x, y, i, j));
			const prob = startProb - (dist * probDec);
			if (!random.chance(prob)) return 0;
			return 1;
		});
		spawnMap[x][y] = 1;
	}
	else if (startProb) {
		madeChange = true;
		if (startProb >= 100) {
			probDec = probDec || 100;
		}

		if (feat.flags & TileEvent.DFF_SPREAD_LINE) {
			x2 = x;
			y2 = y;
			const dir = def.dirs[random.number(4)];
			while(madeChange) {
				madeChange = false;
				x2 = x2 + dir[0];
				y2 = y2 + dir[1];
				if (spawnMap.hasXY(x2, y2) && !spawnMap[x2][y2] && cellIsOk(feat, x2, y2, ctx) && random.chance(startProb)) {
					spawnMap[x2][y2] = 1;
					madeChange = true;
					startProb -= probDec;
				}
			}
		}
		else {
			while (madeChange && startProb > 0) {
				madeChange = false;
				t++;
				for (i = 0; i < map.width; i++) {
					for (j=0; j < map.height; j++) {
						if (spawnMap[i][j] == t - 1) {
							for (dir = 0; dir < 4; dir++) {
								x2 = i + def.dirs[dir][0];
								y2 = j + def.dirs[dir][1];
								if (spawnMap.hasXY(x2, y2) && !spawnMap[x2][y2] && cellIsOk(feat, x2, y2, ctx) && random.chance(startProb)) {
									spawnMap[x2][y2] = t;
									madeChange = true;
								}
							}
						}
					}
				}
				startProb -= probDec;
			}

		}

	}

	if (!cellIsOk(feat, x, y, ctx)) {
			spawnMap[x][y] = 0;
	}

}



async function spawnTiles(feat, spawnMap, ctx, tile, itemKind)
{
	let i, j;
	let accomplishedSomething;

	accomplishedSomething = false;

	const blockedByOtherLayers = (feat.flags & TileEvent.DFF_BLOCKED_BY_OTHER_LAYERS);
	const superpriority = (feat.flags & TileEvent.DFF_SUPERPRIORITY);
	const applyEffects = ctx.refreshCell;
	const map = ctx.map;
  const volume = ctx.volume || feat.volume || (tile ? tile.volume : 0);

	for (i=0; i<spawnMap.width; i++) {
		for (j=0; j<spawnMap.height; j++) {

			if (!spawnMap[i][j]) continue;	// If it's not flagged for building in the spawn map,
			spawnMap[i][j] = 0; // so that the spawnmap reflects what actually got built

			const cell = map.cell(i, j);
			if (cell.mechFlags & CellMech.EVENT_PROTECTED) continue;

			if (tile) {
				if (cell.layers[tile.layer] === tile.id) { 														// If the new cell does not already contains the fill terrain,
          if (tile.layer == TileLayer.GAS) {
            spawnMap[i][j] = 1;
            cell.gasVolume += volume;
          }
          else if (tile.layer == TileLayer.LIQUID) {
            spawnMap[i][j] = 1;
            cell.liquidVolume += volume;
          }
        }
        else if ((superpriority || cell.tile(tile.layer).priority < tile.priority)  // If the terrain in the layer to be overwritten has a higher priority number (unless superpriority),
					&& (!cell.obstructsLayer(tile.layer))															    // If we will be painting into the surface layer when that cell forbids it,
          && ((!cell.item) || !(feat.flags & TileEvent.DFF_BLOCKED_BY_ITEMS))
          && ((!cell.actor) || !(feat.flags & TileEvent.DFF_BLOCKED_BY_ACTORS))
					&& (!blockedByOtherLayers || cell.highestPriorityTile().priority < tile.priority))  // if the fill won't violate the priority of the most important terrain in this cell:
				{
					spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built

					map.setTile(i, j, tile, volume);
          // map.redrawCell(cell);
					// if (volume && cell.gas) {
					//     cell.volume += (feat.volume || 0);
					// }

					// debug('- tile', i, j, 'tile=', tile.id);

					// cell.mechFlags |= Flags.CellMech.EVENT_FIRED_THIS_TURN;
					accomplishedSomething = true;
				}
			}

			if (itemKind) {
				if (superpriority || !cell.item) {
					if (!cell.hasTileFlag(Tile.T_OBSTRUCTS_ITEMS)) {
						spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built
						if (cell.item) {
							map.removeItem(cell.item);
						}
						const item = make.item(itemKind);
						map.addItem(i, j, item);
            // map.redrawCell(cell);
						// cell.mechFlags |= Flags.CellMech.EVENT_FIRED_THIS_TURN;
						accomplishedSomething = true;
						// tileEvent.debug('- item', i, j, 'item=', itemKind.id);
					}
				}
			}

			if (feat.fn) {
				if (await feat.fn(i, j, ctx)) {
					spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built
          // map.redrawCell(cell);
					// cell.mechFlags |= Flags.CellMech.EVENT_FIRED_THIS_TURN;
					accomplishedSomething = true;
				}
			}
		}
	}
	if (accomplishedSomething) {
		map.changed(true);
	}
	return accomplishedSomething;
}




function nullifyCells(map, spawnMap, flags) {
  let didSomething = false;
  const nullSurface = flags & TileEvent.DFF_NULL_SURFACE;
  const nullLiquid = flags & TileEvent.DFF_NULL_LIQUID;
  const nullGas = flags & TileEvent.DFF_NULL_GAS;
	spawnMap.forEach( (v, i, j) => {
		if (!v) return;
		map.nullifyCellLayers(i, j, nullLiquid, nullSurface, nullGas);
    didSomething = true;
	});
  return didSomething;
}



function evacuateCreatures(map, blockingMap) {
	let i, j;
	let monst;

  let didSomething = false;
	for (i=0; i<map.width; i++) {
		for (j=0; j<map.height; j++) {
			if (blockingMap[i][j]
				&& (map.hasCellFlag(i, j, Cell.HAS_ACTOR)))
			{
				monst = map.actorAt(i, j);
				const forbidFlags = monst.forbiddenTileFlags();
				const loc = map.matchingXYNear(
									 i, j, (cell) => {
										 if (cell.hasFlags(Cell.HAS_ACTOR)) return false;
										 if (cell.hasTileFlags(forbidFlags)) return false;
										 return true;
									 },
									 { hallwaysAllowed: true, blockingMap });
				map.moveActor(loc[0], loc[1], monst);
        map.redrawXY(loc[0], loc[1]);
        didSomething = true;
			}
		}
	}
  return didSomething;
}




function evacuateItems(map, blockingMap) {

  let didSomething = false;
	blockingMap.forEach( (v, i, j) => {
		if (!v) return;
		const cell = map.cell(i, j);
		if (!cell.item) return;

		const forbidFlags = cell.item.kind.forbiddenTileFlags();
		const loc = map.matchingXYNear(
							 i, j, (cell) => {
								 if (cell.hasFlags(Cell.HAS_ITEM)) return false;
								 if (cell.hasTileFlags(forbidFlags)) return false;
								 return true;
							 },
							 { hallwaysAllowed: true, blockingMap });
		if (loc) {
			map.removeItem(cell.item);
			map.addItem(loc[0], loc[1], cell.item);
      map.redrawXY(loc[0], loc[1]);
      didSomething = true;
		}
	});
  return didSomething;
}

var tileEvent$1 = {
  __proto__: null,
  TileEvent: TileEvent$1,
  make: make$5,
  addKind: addKind$2,
  resetAllMessages: resetAllMessages,
  spawn: spawn,
  computeSpawnMap: computeSpawnMap,
  spawnTiles: spawnTiles,
  nullifyCells: nullifyCells,
  evacuateCreatures: evacuateCreatures,
  evacuateItems: evacuateItems
};

var cell = {};

const TileLayer$1 = def.layer;

cell.debug = NOOP;

addKind('cursorColor', 25, 100, 150);
config.cursorPathIntensity = 50;



class CellMemory {
  constructor() {
    this.sprite = new types.Sprite();
    this.nullify();
  }

  nullify() {
    this.sprite.nullify();
    this.itemKind = null;
    this.itemQuantity = 0;
    this.actorKind = null;
    this.tile = null;
    this.cellFlags = 0;
    this.cellMechFlags = 0;
    this.tileFlags = 0;
    this.tileMechFlags = 0;
  }

  copy(other) {
    copyObject(this, other);
  }
}

types.CellMemory = CellMemory;



class Cell$1 {
  constructor() {
    this.layers = [0,0,0,0];
    this.memory = new types.CellMemory();
    this.nullify();
  }

  copy(other) {
    copyObject(this, other);
  }

  nullify() {
    for(let i = 0; i < this.layers.length; ++i) {
      this.layers[i] = 0;
    }

    this.sprites = null;
    this.actor = null;
    this.item = null;
    this.data = {};

    this.flags = Cell.CELL_DEFAULT;	// non-terrain cell flags
    this.mechFlags = 0;
    this.gasVolume = 0;						// quantity of gas in cell
    this.liquidVolume = 0;
    this.machineNumber = 0;
    this.memory.nullify();

    this.light = [100,100,100];
    this.oldLight = [100,100,100];
    this.glowLight = [100,100,100];
  }

  nullifyLayers(nullLiquid, nullSurface, nullGas) {
    if (nullLiquid) {
      this.layers[1] = 0;
      this.liquidVolume = 0;
    }
    if (nullSurface) {
      this.layers[2] = 0;
    }
    if (nullGas) {
      this.layers[3] = 0;
      this.gasVolume = 0;
    }
    this.flags |= Cell.CELL_CHANGED;
  }

  get ground() { return this.layers[0]; }
  get liquid() { return this.layers[1]; }
  get surface() { return this.layers[2]; }
  get gas() { return this.layers[3]; }

  get groundTile() { return tiles[this.layers[0]]; }
  get liquidTile() { return tiles[this.layers[1]]; }
  get surfaceTile() { return tiles[this.layers[2]]; }
  get gasTile() { return tiles[this.layers[3]]; }

  dump() {
    for(let i = this.layers.length - 1; i >= 0; --i) {
      if (!this.layers[i]) continue;
      const tile = tiles[this.layers[i]];
      if (tile.sprite.ch) return tile.sprite.ch;
    }
    return tiles[0].sprite.ch;
  }
  changed() { return this.flags & Cell.CELL_CHANGED; }
  isVisible() { return this.flags & Cell.VISIBLE; }
  isAnyKindOfVisible() { return (this.flags & Cell.ANY_KIND_OF_VISIBLE) || config.playbackOmniscience; }
  isOrWasAnyKindOfVisible() { return (this.flags & Cell.IS_WAS_ANY_KIND_OF_VISIBLE) || config.playbackOmniscience; }
  isRevealed(orMapped) {
    const flag = Cell.REVEALED | (orMapped ? Cell.MAGIC_MAPPED : 0);
    return this.flags & flag;
  }
  listInSidebar() {
    return this.hasTileMechFlag(TileMech.TM_LIST_IN_SIDEBAR);
  }

  // TODO - Use functions in LIGHT to check these on cell.light directly???
  hasVisibleLight() { return intensity(this.light) > def.INTENSITY_DARK; }  // TODO
  isDark() { return intensity(this.light) <= def.INTENSITY_DARK; }  // TODO
  lightChanged() { return this.flags & Cell.LIGHT_CHANGED; }  // TODO

  tile(layer=0) {
    const id = this.layers[layer] || 0;
    return tiles[id];
  }

  *tiles() {
    for(let id of this.layers) {
      if (id) {
        yield tiles[id];
      }
    }
  }

  tileFlags(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge && !this.isVisible()) {
      return this.memory.tileFlags;
    }
    let flags = 0;
    for( let tile of this.tiles()) {
      flags |= tile.flags;
    }
    return flags;
  }

  tileMechFlags(limitToPlayerKnowledge)	{
    if (limitToPlayerKnowledge && !this.isVisible()) {
      return this.memory.tileMechFlags;
    }
    let flags = 0;
    for( let tile of this.tiles()) {
      flags |= tile.mechFlags;
    }
    return flags;
  }

  hasTileFlag(flagMask)	{
    return !!(flagMask & this.tileFlags());
  }

  hasAllTileFlags(flags) {
    return (flags & this.tileFlags()) === flags;
  }

  hasTileMechFlag(flagMask) {
    return !!(flagMask & this.tileMechFlags());
  }

  hasAllTileMechFlags(flags) {
    return (flags & this.tileMechFlags()) === flags;
  }

  setFlags(cellFlag=0, cellMechFlag=0) {
    this.flags |= cellFlag;
    this.mechFlags |= cellMechFlag;
    // this.flags |= Flags.Cell.NEEDS_REDRAW;
  }

  clearFlags(cellFlag=0, cellMechFlag=0) {
    this.flags &= ~cellFlag;
    this.mechFlags &= ~cellMechFlag;
    // if ((~cellFlag) & Flags.Cell.NEEDS_REDRAW) {
    //   this.flags |= Flags.Cell.NEEDS_REDRAW;
    // }
  }

  hasTile(id) {
    return this.layers.includes(id);
  }

  // hasTileInGroup(...groups) {
  //   if (groups.length == 1 && Array.isArray(groups[0])) {
  //     groups = groups[0];
  //   }
  //   return this.layers.some( (tileId) => {
  //     const tile = TILES[tileId] || TILES.NOTHING;
  //     return Utils.intersect(groups, tile.groups);
  //   });
  // }

  successorTileFlags(event) {
    let flags = 0;
    for( let tile of this.tiles()) {
      flags |= tile.successorFlags(event);
    }
    return flags;
  }

  promotedTileFlags() {
    return this.successorTileFlags('promote');
  }

  discoveredTileFlags() {
    return this.successorTileFlags('discover');
  }

  hasDiscoveredTileFlag(flag) {
    // if (!this.hasTileMechFlag(TM_IS_SECRET)) return false;
    return this.discoveredTileFlags() & flag;
  }

  highestPriorityTile() {
    let best = tiles[0];
    let bestPriority = -10000;
    for(let tile of this.tiles()) {
      if (tile.priority > bestPriority) {
        best = tile;
        bestPriority = tile.priority;
      }
    }
    return best;
  }

  tileWithFlag(tileFlag) {
    for(let tile of this.tiles()) {
      if (tile.flags & tileFlags) return tile;
    }
    return null;
  }

  tileWithMechFlag(mechFlag) {
    for(let tile of this.tiles()) {
      if (tile.mechFlags & mechFlags) return tile;
    }
    return null;
  }

  tileDesc() {
    return this.highestPriorityTile().desc;
  }

  tileFlavor() {
    return this.highestPriorityTile().getFlavor();
  }

  getName(opts={}) {
    return this.highestPriorityTile().getName(opts);
  }

  isNull() {
    return this.ground == 0;
  }

  isEmpty() {
    return !(this.actor || this.item);
  }

  isPassableNow(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    const tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    if (!(tileFlags & Tile.T_PATHING_BLOCKER)) return true;
    if( tileFlags & Tile.T_BRIDGE) return true;

    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    return limitToPlayerKnowledge ? false : this.isSecretDoor();
  }

  canBePassed(limitToPlayerKnowledge) {
    if (this.isPassableNow(limitToPlayerKnowledge)) return true;
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    if (tileMechFlags & TileMech.TM_CONNECTS_LEVEL) return true;
    return ((tileMechFlags & TileMech.TM_PROMOTES) && !(this.promotedTileFlags() & Tile.T_PATHING_BLOCKER));
  }

  isWall(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Tile.T_OBSTRUCTS_EVERYTHING;
  }

  isObstruction(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Tile.T_OBSTRUCTS_DIAGONAL_MOVEMENT;
  }

  isDoor(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Tile.T_IS_DOOR;
  }

  isSecretDoor(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge) return false;
    const tileMechFlags = this.tileMechFlags();
    return (tileMechFlags & TileMech.TM_IS_SECRET) && !(this.discoveredTileFlags() & Tile.T_PATHING_BLOCKER)
  }

  blocksPathing(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Tile.T_PATHING_BLOCKER;
  }

  isLiquid(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Tile.T_IS_LIQUID;
  }

  markRevealed() {
    this.flags &= ~Cell.STABLE_MEMORY;
    if ((this.flags & Cell.REVEALED)) return false;

    this.flags |= Cell.REVEALED;
    if (!this.hasTileFlag(Tile.T_PATHING_BLOCKER)) {
      data.xpxpThisTurn++;
    }
    return true;
  }

  obstructsLayer(layer) {
    return layer == TileLayer$1.SURFACE && this.hasTileFlag(Tile.T_OBSTRUCTS_SURFACE_EFFECTS);
  }

  _setTile(tileId=0, volume=0, map) {
    map = map || data.map;
    let tile;
    if (tileId === 0) {
      tile = tiles['0'];
    }
    else if (typeof tileId === 'string') {
      tile = tiles[tileId];
    }
    else if (tileId instanceof types.Tile) {
      tile = tileId;
      tileId = tile.id;
    }
    else if (tileId !== 0){
      ERROR('Unknown tile: ' + tileId);
    }

    if (!tile) {
      WARN('Unknown tile - ' + tileId);
      tile = tiles['0'];
      tileId = 0;
    }

    const oldTileId = this.layers[tile.layer] || 0;
    const oldTile = tiles[oldTileId] || tiles[0];

    if ((oldTile.flags & Tile.T_PATHING_BLOCKER)
      != (tile.flags & Tile.T_PATHING_BLOCKER))
    {
      data.staleLoopMap = true;
    }

    if ((tile.flags & Tile.T_IS_FIRE)
      && !(oldTile.flags & Tile.T_IS_FIRE))
    {
      this.setFlags(0, CellMech.CAUGHT_FIRE_THIS_TURN);
    }

    const blocksVision = (tile.flags & Tile.T_OBSTRUCTS_VISION);
    const oldBlocksVision = (oldTile.flags & Tile.T_OBSTRUCTS_VISION);
    if (map && this.isAnyKindOfVisible() && (blocksVision != oldBlocksVision)) {
      map.flags |= Map.MAP_FOV_CHANGED;
    }

    this.layers[tile.layer] = tile.id;
    if (tile.layer == TileLayer$1.LIQUID) {
      this.liquidVolume = volume + (tileId == oldTileId ? this.liquidVolume : 0);
      if (map) map.flags &= ~Map.MAP_NO_LIQUID;
    }
    else if (tile.layer == TileLayer$1.GAS) {
      this.gasVolume = volume + (tileId == oldTileId ? this.vasVolume : 0);
      if (map) map.flags &= ~Map.MAP_NO_GAS;
    }

    if (tile.layer > 0 && this.layers[0] == 0) {
      this.layers[0] = 'FLOOR'; // TODO - Not good
    }

    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Cell.CELL_CHANGED);
    if (map && (oldTile.light !== tile.light)) {
      map.flags &= ~(Map.MAP_STABLE_GLOW_LIGHTS | Map.MAP_STABLE_LIGHTS);
    }
    return true;
  }

  clearLayer(layer) {
    if (typeof layer === 'string') layer = TileLayer$1[layer];
    if (this.layers[layer]) {
      // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
      this.flags |= (Cell.CELL_CHANGED);
    }
    this.layers[layer] = 0;
    if (layer == TileLayer$1.LIQUID) {
      this.liquidVolume = 0;
    }
    else if (layer == TileLayer$1.GAS) {
      this.gasVolume = 0;
    }
  }

  clearLayers(except, floorTile) {
    floorTile = floorTile === undefined ? this.layers[0] : floorTile;
    for (let layer = 0; layer < this.layers.length; layer++) {
      if (layer != except && layer != TileLayer$1.GAS) {
          this.layers[layer] = (layer ? 0 : floorTile);
      }
    }
    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Cell.CELL_CHANGED);
  }

  nullifyTileWithFlags(tileFlags, tileMechFlags=0) {
    for( let i = 0; i < this.layers.length; ++i ) {
      const id = this.layers[i];
      if (!id) continue;
      const tile = tiles[id];
      if (tileFlags && tileMechFlags) {
        if ((tile.flags & tileFlags) && (tile.mechFlags & tileMechFlags)) {
          this.layers[i] = 0;
        }
      }
      else if (tileFlags) {
        if (tile.flags & tileFlags) {
          this.layers[i] = 0;
        }
      }
      else if (tileMechFlags) {
        if (tile.flags & tileMechFlags) {
          this.layers[i] = 0;
        }
      }
    }
    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Cell.CELL_CHANGED);
  }

  // EVENTS

  async fireEvent(name, ctx) {
    ctx.cell = this;
    let fired = false;
    cell.debug('fire event - %s', name);
    for (let tile of this.tiles()) {
      if (!tile.events) continue;
      const ev = tile.events[name];
      if (ev) {
        cell.debug(' - has event');
        if (ev.chance && !random.chance(ev.chance, 10000)) {
          continue;
        }

        ctx.tile = tile;
        cell.debug(' - spawn event @%d,%d - %s', ctx.x, ctx.y, name);
        fired = await spawn(ev, ctx) || fired;
        cell.debug(' - spawned');
        if (fired) {
          break;
        }
      }
    }
    return fired;
  }

  hasTileWithEvent(name) {
    for (let tile of this.tiles()) {
      if (tile.hasEvent(name)) return true;
    }
    return false;
  }

  // SPRITES

  addSprite(layer, sprite, priority=50) {
    if (!sprite) return;

    // this.flags |= Flags.NEEDS_REDRAW;
    this.flags |= Cell.CELL_CHANGED;

    if (!this.sprites || ((this.sprites.layer > layer) || ((this.sprites.layer == layer) && (this.sprites.priority > priority)))) {
      this.sprites = { layer, priority, sprite, next: this.sprites };
      return;
    }

    let current = this.sprites;
    while (current.next && ((current.layer < layer) || ((current.layer == layer) && (current.priority <= priority)))) {
      current = current.next;
    }

    const item = { layer, priority, sprite, next: current.next };
    current.next = item;
  }

  removeSprite(sprite) {
    if (!sprite) return false;
    if (!this.sprites) return false;

    // this.flags |= Flags.NEEDS_REDRAW;
    this.flags |= Cell.CELL_CHANGED;

    if (this.sprites && this.sprites.sprite === sprite) {
      this.sprites = this.sprites.next;
      return true;
    }

    let prev = this.sprites;
    let current = this.sprites.next;
    while (current) {
      if (current.sprite === sprite) {
        prev.next = current.next;
        return true;
      }
      current = current.next;
    }
    return false;
  }


  // MEMORY

  storeMemory() {
    const memory = this.memory;
    memory.tileFlags = this.tileFlags();
    memory.tileMechFlags = this.tileMechFlags();
    memory.cellFlags = this.flags;
		memory.cellMechFlags = this.mechFlags;
    memory.tile = this.highestPriorityTile().id;
		if (this.item) {
			memory.itemKind = this.item.kind;
			memory.itemQuantity = this.item.quantity || 1;
		}
		else {
			memory.itemKind = null;
			memory.itemQuantity = 0;
		}
    memory.actorKind = (this.actor ? this.actor.kind : null);
    cell.getAppearance(this, memory.sprite);
  }

}

types.Cell = Cell$1;


function makeCell(...args) {
  const cell = new types.Cell(...args);
  return cell;
}


make.cell = makeCell;


function getAppearance(cell, dest) {
  const memory = cell.memory.sprite;
  memory.blackOut();

  let needDistinctness = false;
  for( let tile of cell.tiles() ) {
    let alpha = 100;
    if (tile.layer == TileLayer$1.LIQUID) {
      alpha = clamp(cell.liquidVolume || 0, 20, 100);
    }
    else if (tile.layer == TileLayer$1.GAS) {
      alpha = clamp(cell.gasVolume || 0, 20, 100);
    }
    memory.drawSprite(tile.sprite, alpha);
    if (tile.mechFlags & TileMech.TM_VISUALLY_DISTINCT) {
      needDistinctness = true;
    }
  }

  let current = cell.sprites;
  while(current) {
    memory.drawSprite(current.sprite);
    current = current.next;
  }

  memory.fg.multiply(cell.light);
  memory.bg.multiply(cell.light);
  memory.bake(!cell.isAnyKindOfVisible());  // turns off dancing if not visible
  if (needDistinctness) {
    separate(memory.fg, memory.bg);
  }
  dest.drawSprite(memory);
  return true;
}

cell.getAppearance = getAppearance;

var map$1 = {};
map$1.debug = NOOP;

const TileLayer$2 = def.layer;


class Map$1 {
	constructor(w, h, opts={}) {
		this.width = w;
		this.height = h;
		this.cells = make.grid(w, h, () => new types.Cell() );
		this.locations = opts.locations || {};
		this.config = Object.assign({}, opts);
		this.config.tick = this.config.tick || 100;
		this.actors = null;
		this.items = null;
    this.flags = Map.toFlag(Map.MAP_DEFAULT, opts.flags);
		this.ambientLight = null;
		const ambient = (opts.ambient || opts.ambientLight || opts.light);
		if (ambient) {
			this.ambientLight = make.color(ambient);
		}
    this.lights = null;
    this.id = opts.id;
    this.events = opts.events || {};
	}

  async start() {}

	nullify() { this.cells.forEach( (c) => c.nullify() ); }
	dump(fmt) { this.cells.dump(fmt || ((c) => c.dump()) ); }
	cell(x, y)   { return this.cells[x][y]; }

  eachCell(fn) { this.cells.forEach( (c, i, j) => fn(c, i, j, this) ); }
	forEach(fn)  { this.cells.forEach( (c, i, j) => fn(c, i, j, this) ); }
	forRect(x, y, w, h, fn) { this.cells.forRect(x, y, w, h, (c, i, j) => fn(c, i, j, this) ); }
	eachNeighbor(x, y, fn, only4dirs) { this.cells.eachNeighbor(x, y, (c, i, j) => fn(c, i, j, this), only4dirs); }

	hasXY(x, y)    		 { return this.cells.hasXY(x, y); }
	isBoundaryXY(x, y) { return this.cells.isBoundaryXY(x, y); }

	changed(v) {
		if (v === true) {
			this.flags |= Map.MAP_CHANGED;
		}
		else if (v === false) {
			this.flags &= ~Map.MAP_CHANGED;
		}
		return (this.flags & Map.MAP_CHANGED);
	}

	hasCellFlag(x, y, flag) 		{ return this.cell(x, y).flags & flag; }
	hasCellMechFlag(x, y, flag) { return this.cell(x, y).mechFlags & flag; }
	hasTileFlag(x, y, flag) 		{ return this.cell(x, y).hasTileFlag(flag); }
	hasTileMechFlag(x, y, flag) { return this.cell(x, y).hasTileMechFlag(flag); }

  setCellFlag(x, y, flag) {
    this.cell(x, y).flags |= flag;
  }

	redrawCell(cell) {
    // if (cell.isAnyKindOfVisible()) {
      cell.flags |= Cell.NEEDS_REDRAW;
  		this.flags |= Map.MAP_CHANGED;
    // }
	}

	redrawXY(x, y) {
    const cell = this.cell(x, y);
    this.redrawCell(cell);
	}

  redrawAll() {
    this.forEach( (c) => {
      // if (c.isAnyKindOfVisible()) {
        c.flags |= Cell.NEEDS_REDRAW;
      // }
    });
		this.flags |= Map.MAP_CHANGED;
  }

  revealAll() {
    this.forEach( (c) => {
      c.markRevealed();
      c.storeMemory();
    });
  }
	markRevealed(x, y) {
		if (!this.cell(x, y).markRevealed()) return;
    if (data.player) {
      data.player.invalidateCostMap();
    }
	}
	isVisible(x, y)    { return this.cell(x, y).isVisible(); }
	isAnyKindOfVisible(x, y) { return this.cell(x, y).isAnyKindOfVisible(); }
  isOrWasAnyKindOfVisible(x, y) { return this.cell(x, y).isOrWasAnyKindOfVisible(); }
	hasVisibleLight(x, y) { return this.cell(x, y).hasVisibleLight(); }

	setFlags(mapFlag, cellFlag, cellMechFlag) {
		if (mapFlag) {
			this.flags |= mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.forEach( (c) => c.setFlags(cellFlag, cellMechFlag) );
		}
		this.changed(true);
	}

	clearFlags(mapFlag=0, cellFlag=0, cellMechFlag=0) {
		if (mapFlag) {
			this.flags &= ~mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.forEach( (cell) => cell.clearFlags(cellFlag, cellMechFlag) );
		}
		this.changed(true);
	}

	setCellFlags(x, y, cellFlag, cellMechFlag) {
		this.cell(x, y).setFlags(cellFlag, cellMechFlag);
		this.flags |= Map.MAP_CHANGED;
	}

	clearCellFlags(x, y, cellFlags, cellMechFlags) {
		this.cell(x, y).clearFlags(cellFlags, cellMechFlags);
		this.changed(true);
	}

	hasTile(x, y, tile)	{ return this.cells[x][y].hasTile(tile); }

	tileFlags(x, y, limitToPlayerKnowledge)			{ return this.cells[x][y].tileFlags(limitToPlayerKnowledge); }
	tileMechFlags(x, y, limitToPlayerKnowledge)	{ return this.cells[x][y].tileMechFlags(limitToPlayerKnowledge); }

	tileWithFlag(x, y, flag) { return this.cells[x][y].tileWithFlag(flag); }
	tileWithMechFlag(x, y, mechFlag) { return this.cells[x][y].tileWithMechFlag(mechFlag); }

	hasKnownTileFlag(x, y, flagMask) { return this.cells[x][y].memory.tileFlags & flagMask; }

	// hasTileInGroup(x, y, ...groups) { return this.cells[x][y].hasTileInGroup(...groups); }

	discoveredTileFlags(x, y) { return this.cells[x][y].discoveredTileFlags(); }
	hasDiscoveredTileFlag(x, y, flag) { return this.cells[x][y].hasDiscoveredTileFlag(flag); }

	canBePassed(x, y, limitToPlayerKnowledge) { return this.cells[x][y].canBePassed(limitToPlayerKnowledge); }
	isPassableNow(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isPassableNow(limitToPlayerKnowledge); }

	isNull(x, y) { return this.cells[x][y].isNull(); }
  isEmpty(x, y) { return this.cells[x][y].isEmpty(); }
	isObstruction(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isObstruction(limitToPlayerKnowledge); }
  isDoor(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isDoor(limitToPlayerKnowledge); }
  blocksPathing(x, y, limitToPlayerKnowledge) { return this.cells[x][y].blocksPathing(limitToPlayerKnowledge); }
  isLiquid(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isLiquid(limitToPlayerKnowledge); }
  hasGas(x, y, limitToPlayerKnowledge) { return this.cells[x][y].hasGas(limitToPlayerKnowledge); }

	highestPriorityLayer(x, y, skipGas) { return this.cells[x][y].highestPriorityLayer(x, y); }
	highestPriorityTile(x, y, skipGas) { return this.cells[x][y].highestPriorityTile(x, y); }

	tileFlavor(x, y) { return this.cells[x][y].tileFlavor(); }
	tileFlavor(x, y)   { return this.cells[x][y].tileFlavor(); }

	setTile(x, y, tileId, volume=0) {
		return this.cell(x, y)._setTile(tileId, volume, this);
	}

	nullifyTileWithFlags(x, y, tileFlags, tileMechFlags=0) {
		const cell = this.cell(x, y);
		cell.nullifyTileWithFlags(tileFlags, tileMechFlags);
	}

	nullifyCellLayers(x, y, nullLiquid, nullSurface, nullGas) {
		this.changed(true);
		return this.cell(x, y).nullifyLayers(nullLiquid, nullSurface, nullGas);
	}

	fill(tileId, boundaryTile) {
		let i, j;
		if (boundaryTile === undefined) {
			boundaryTile = tileId;
		}
		for(i=0; i < this.width; ++i) {
			for(j = 0; j < this.height; ++j) {
				if (this.isBoundaryXY(i, j)) {
					this.setTile(i, j, boundaryTile);
				}
				else {
					this.setTile(i, j, tileId);
				}
			}
		}
	}

	neighborCount(x, y, matchFn, only4dirs) {
		let count = 0;
		this.eachNeighbor(x, y, (...args) => {
			if (matchFn(...args)) ++count;
		}, only4dirs);
		return count;
	}

	passableArcCount(x, y) {
		if (!this.hasXY(x, y)) return -1;
		return this.cells.arcCount(x, y, (c) => c.isPassableNow() );
	}

	diagonalBlocked(x1, y1, x2, y2, limitToPlayerKnowledge) {
	    if (x1 == x2 || y1 == y2) {
	      return false; // If it's not a diagonal, it's not diagonally blocked.
	    }
	    const locFlags1 = this.tileFlags(x1, y2, limitToPlayerKnowledge);
	    if (locFlags1 & Tile.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    const locFlags2 = this.tileFlags(x2, y1, limitToPlayerKnowledge);
	    if (locFlags2 & Tile.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    return false;
	}

	fillCostGrid(costGrid, costFn) {
		costFn = costFn || ONE;
		this.cells.forEach( (cell, i, j) => {
      if (cell.isNull()) {
        costGrid[i][j] = def.PDS_OBSTRUCTION;
      }
      else {
        costGrid[i][j] = cell.canBePassed() ? costFn(cell, i, j) : def.PDS_OBSTRUCTION;
      }
    });
	}

	matchingNeighbor(x, y, matcher, only4dirs) {
		const maxIndex = only4dirs ? 4 : 8;
		for(let d = 0; d < maxIndex; ++d) {
			const dir = def.dirs[d];
			const i = x + dir[0];
			const j = y + dir[1];
			if (this.hasXY(i, j)) {
				if (matcher(this.cells[i][j], i, j, this)) return [i, j];
			}
		}
		return null;
	}

	// blockingMap is optional
	matchingXYNear(x, y, matcher, opts={})
	{
		let i, j, k;

		const hallwaysAllowed = opts.hallwaysAllowed || opts.hallways || false;
		const blockingMap = opts.blockingMap || null;
		const forbidLiquid = opts.forbidLiquid || opts.forbidLiquids || false;
		const deterministic = opts.deterministic || false;

		const candidateLocs = [];

		// count up the number of candidate locations
		for (k=0; k<Math.max(this.width, this.height) && !candidateLocs.length; k++) {
			for (i = x-k; i <= x+k; i++) {
				for (j = y-k; j <= y+k; j++) {
					if (!this.hasXY(i, j)) continue;
					const cell = this.cell(i, j);
					// if ((i == x-k || i == x+k || j == y-k || j == y+k)
					if ((Math.ceil(distanceBetween(x, y, i, j)) == k)
							&& (!blockingMap || !blockingMap[i][j])
							&& matcher(cell, i, j, this)
							&& (!forbidLiquid || !cell.liquid)
							&& (hallwaysAllowed || this.passableArcCount(i, j) < 2))
	        {
						candidateLocs.push([i, j]);
					}
				}
			}
		}

		if (candidateLocs.length == 0) {
			return null;
		}

		// and pick one
		let randIndex = 0;
		if (deterministic) {
	    randIndex = Math.floor(candidateLocs.length / 2);
		} else {
			randIndex = random.number(candidateLocs.length);
		}
		return candidateLocs[randIndex];
	}



	// fills (*x, *y) with the coordinates of a random cell with
	// no creatures, items or stairs and with either a matching liquid and dungeon type
	// or at least one layer of type terrainType.
	// A dungeon, liquid type of -1 will match anything.
	randomMatchingXY(opts={}) {
		let x;
		let y;
		let cell;

    if (typeof opts === 'function') {
      opts = { match: opts };
    }

    const hallwaysAllowed = opts.hallwaysAllowed || opts.hallways || false;
		const blockingMap = opts.blockingMap || null;
		const forbidLiquid = opts.forbidLiquid || opts.forbidLiquids || false;
    const matcher = opts.match || TRUE;
    const forbidCellFlags = opts.forbidCellFlags || 0;
    const forbidTileFlags = opts.forbidTileFlags || 0;
    const forbidTileMechFlags = opts.forbidTileMechFlags || 0;
    let tries = opts.tries || 500;

		let retry = true;
		while(retry) {
			tries--;
			if (!tries) break;

			x = random.range(0, this.width - 1);
			y = random.range(0, this.height - 1);
			cell = this.cell(x, y);

			if ((!blockingMap || !blockingMap[x][y])
      		&& (!forbidLiquid || !cell.liquid)
          && (!forbidCellFlags || !(cell.flags & forbidCellFlags))
          && (!forbidTileFlags || !(cell.hasTileFlag(forbidTileFlags)))
          && (!forbidTileMechFlags || !(cell.hasTileMechFlag(forbidTileMechFlags)))
      		&& (hallwaysAllowed || this.passableArcCount(x, y) < 2)
          && matcher(cell, x, y, this))
      {
				retry = false;
			}
		}
		if (!tries) {
			// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => FAIL');
			return false;
		}

		// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => ', x, y);
		return [ x, y ];
	}

  // LIGHT

  addLight(x, y, light) {
    const info = { x, y, light, next: this.lights };
    this.lights = info;
    this.flags &= ~(Map.MAP_STABLE_LIGHTS | Map.MAP_STABLE_GLOW_LIGHTS);
    return info;
  }

  removeLight(info) {
    removeFromChain(this, 'lights', info);
    this.flags &= ~(Map.MAP_STABLE_LIGHTS | Map.MAP_STABLE_GLOW_LIGHTS);
  }

  eachLight( fn ) {
    eachChain(this.lights, (info) => fn(info.light, info.x, info.y));
    this.eachCell( (cell, x, y) => {
      for(let tile of cell.tiles() ) {
        if (tile.light) {
          fn(tile.light, x, y);
        }
      }
    });
  }


	// FX

	addFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		cell.addSprite(TileLayer$2.FX, anim.sprite);
		anim.x = x;
		anim.y = y;
		this.redrawCell(cell);
		return true;
	}

	moveFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.removeSprite(anim.sprite);
    this.redrawCell(oldCell);
		cell.addSprite(TileLayer$2.FX, anim.sprite);
    this.redrawCell(cell);
		anim.x = x;
		anim.y = y;
		return true;
	}

	removeFx(anim) {
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.removeSprite(anim.sprite);
    this.redrawCell(oldCell);
		this.flags |= Map.MAP_CHANGED;
		return true;
	}

	// ACTORS

	// will return the PLAYER if the PLAYER is at (x, y).
	actorAt(x, y) { // creature *
		if (!this.hasXY(x, y)) return null;
		const cell = this.cell(x, y);
		return cell.actor;
	}

	addActor(x, y, theActor) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.actor) {
			return false;
		}

		cell.actor = theActor;
    theActor.next = this.actors;
		this.actors = theActor;

		const layer = (theActor === data.player) ? TileLayer$2.PLAYER : TileLayer$2.ACTOR;
		cell.addSprite(layer, theActor.sprite || theActor.kind.sprite);

		const flag = (theActor === data.player) ? Cell.HAS_PLAYER : Cell.HAS_MONSTER;
		cell.flags |= flag;
		// if (theActor.flags & Flags.Actor.MK_DETECTED)
		// {
		// 	cell.flags |= Flags.Cell.MONSTER_DETECTED;
		// }

    if (theActor.light || theActor.kind.light) {
      this.flags &= ~(Map.MAP_STABLE_LIGHTS);
    }

    // If the player moves or an actor that blocks vision and the cell is visible...
    // -- we need to update the FOV
    if (theActor.isPlayer() || (cell.isAnyKindOfVisible() && (theActor.kind.flags & ActorKind.AK_BLOCKS_VISION))) {
      this.flags |= Map.MAP_FOV_CHANGED;
    }

		theActor.x = x;
		theActor.y = y;
    this.redrawCell(cell);

		return true;
	}

	addActorNear(x, y, theActor) {
		const forbidTileFlags = GW.actor.avoidedFlags(theActor);
		const loc = this.matchingXYNear(x, y, (cell, i, j) => {
			if (cell.flags & (Cell.HAS_ACTOR)) return false;
			return !cell.hasTileFlag(forbidTileFlags);
		});
		if (!loc || loc[0] < 0) {
			// GW.ui.message(colors.badMessageColor, 'There is no place to put the actor.');
			return false;
		}

		return this.addActor(loc[0], loc[1], theActor);
	}

	moveActor(x, y, actor) {
		if (!this.hasXY(x, y)) return false;
		this.removeActor(actor);

		if (!this.addActor(x, y, actor)) {
			this.addActor(actor.x, actor.y, actor);
			return false;
		}
    if (actor.light || actor.kind.light) {
      this.flags &= ~(Map.MAP_STABLE_LIGHTS);
    }

		return true;
	}

	removeActor(actor) {
    if (!this.hasXY(actor.x, actor.y)) return false;
		const cell = this.cell(actor.x, actor.y);
		if (cell.actor === actor) {
			cell.actor = null;
      removeFromChain(this, 'actors', actor);
			cell.flags &= ~Cell.HAS_ACTOR;
      cell.removeSprite(actor.sprite);
			cell.removeSprite(actor.kind.sprite);

      if (actor.light || actor.kind.light) {
        this.flags &= ~(Map.MAP_STABLE_LIGHTS);
      }
      // If the player moves or an actor that blocks vision and the cell is visible...
      // -- we need to update the FOV
      if (actor.isPlayer() || (cell.isAnyKindOfVisible() && (actor.kind.flags & ActorKind.AK_BLOCKS_VISION))) {
        this.flags |= Map.MAP_FOV_CHANGED;
      }

      this.redrawCell(cell);
      return true;
		}
    return false;
	}

	// dormantAt(x, y) {  // creature *
	// 	if (!(this.cell(x, y).flags & Flags.Cell.HAS_DORMANT_MONSTER)) {
	// 		return null;
	// 	}
	// 	return this.dormantActors.find( (m) => m.x == x && m.y == y );
	// }
	//
	// addDormant(x, y, actor) {
	// 	theActor.x = x;
	// 	theActor.y = y;
	// 	this.dormant.add(theActor);
	// 	cell.flags |= (Flags.Cell.HAS_DORMANT_MONSTER);
	// 	this.flags |= Flags.Map.MAP_CHANGED;
	// 	return true;
	// }
	//
	// removeDormant(actor) {
	// 	const cell = this.cell(actor.x, actor.y);
	// 	cell.flags &= ~(Flags.Cell.HAS_DORMANT_MONSTER);
	// 	cell.flags |= Flags.Cell.NEEDS_REDRAW;
	// 	this.flags |= Flags.Map.MAP_CHANGED;
	// 	this.dormant.remove(actor);
	// }

	// ITEMS

	itemAt(x, y) {
		const cell = this.cell(x, y);
		return cell.item;
	}

	addItem(x, y, theItem) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.flags & Cell.HAS_ITEM) {
			// GW.ui.message(colors.badMessageColor, 'There is already an item there.');
			return false;
		}
		theItem.x = x;
		theItem.y = y;

		cell.item = theItem;
		theItem.next = this.items;
		this.items = theItem;

		cell.addSprite(TileLayer$2.ITEM, theItem.sprite || theItem.kind.sprite);
		cell.flags |= (Cell.HAS_ITEM);

    if (theItem.light || theItem.kind.light) {
      this.flags &= ~(Map.MAP_STABLE_LIGHTS);
    }

    this.redrawCell(cell);

		if ( ((theItem.flags & Item.ITEM_MAGIC_DETECTED) && GW.item.magicChar(theItem)) ||
					config.D_ITEM_OMNISCIENCE)
		{
			cell.flags |= Cell.ITEM_DETECTED;
		}

		return true;
	}

	addItemNear(x, y, theItem) {
		const loc = this.matchingXYNear(x, y, (cell, i, j) => {
			if (cell.flags & Cell.HAS_ITEM) return false;
			return !cell.hasTileFlag(theItem.kind.forbiddenTileFlags());
		});
		if (!loc || loc[0] < 0) {
			// GW.ui.message(colors.badMessageColor, 'There is no place to put the item.');
			return false;
		}

		return this.addItem(loc[0], loc[1], theItem);
	}


	removeItem(theItem, skipRefresh) {
		const x = theItem.x;
		const y = theItem.y;
    if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.item !== theItem) return false;

    cell.removeSprite(theItem.sprite);
		cell.removeSprite(theItem.kind.sprite);

		cell.item = null;
    removeFromChain(this, 'items', theItem);

    if (theItem.light || theItem.kind.light) {
      this.flags &= ~(Map.MAP_STABLE_LIGHTS);
    }

		cell.flags &= ~(Cell.HAS_ITEM | Cell.ITEM_DETECTED);
    this.redrawCell(cell);
		return true;
	}

	// // PROMOTE
	//
	// async promote(x, y, mechFlag) {
	// 	if (this.hasTileMechFlag(x, y, mechFlag)) {
	// 		const cell = this.cell(x, y);
	// 		for (let tile of cell.tiles()) {
	// 			if (tile.mechFlags & mechFlag) {
	// 				await tile.promote(this, x, y, false);
	// 			}
	// 		}
	// 	}
	// }



  gridDisruptsPassability(blockingGrid, opts={})
  {

  	const walkableGrid = alloc(this.width, this.height);
  	let disrupts = false;

  	const gridOffsetX = opts.gridOffsetX || 0;
  	const gridOffsetY = opts.gridOffsetY || 0;
  	const bounds = opts.bounds || null;
  	// Get all walkable locations after lake added
  	this.cells.forEach( (cell, i, j) => {
  		if (bounds && !bounds.containsXY(i, j)) return;	// outside bounds
  		const blockingX = i + gridOffsetX;
  		const blockingY = j + gridOffsetY;
  		if (cell.isNull()) {
  			return; // do nothing
  		}
  		else if (cell.canBePassed()) {
  			if (blockingGrid.hasXY(blockingX, blockingY) && blockingGrid[blockingX][blockingY]) return;
  			walkableGrid[i][j] = 1;
  		}
  		else if (cell.hasTileFlag(Tile.T_HAS_STAIRS)) {
  			if (blockingGrid.hasXY(blockingX, blockingY) && blockingGrid[blockingX][blockingY]) {
  				disrupts = true;
  			}
  			else {
  				walkableGrid[i][j] = 1;
  			}
  		}
  	});

  	let first = true;
  	for(let i = 0; i < walkableGrid.width && !disrupts; ++i) {
  		for(let j = 0; j < walkableGrid.height && !disrupts; ++j) {
  			if (walkableGrid[i][j] == 1) {
  				if (first) {
  					floodFill(walkableGrid, i, j, 1, 2);
  					first = false;
  				}
  				else {
  					disrupts = true;
  				}
  			}
  		}
  	}

  	free(walkableGrid);
  	return disrupts;
  }

	// FOV

	// Returns a boolean grid indicating whether each square is in the field of view of (xLoc, yLoc).
	// forbiddenTerrain is the set of terrain flags that will block vision (but the blocking cell itself is
	// illuminated); forbiddenFlags is the set of map flags that will block vision.
	// If cautiousOnWalls is set, we will not illuminate blocking tiles unless the tile one space closer to the origin
	// is visible to the player; this is to prevent lights from illuminating a wall when the player is on the other
	// side of the wall.
	calcFov(grid, x, y, maxRadius, forbiddenFlags=0, forbiddenTerrain=Tile.T_OBSTRUCTS_VISION, cautiousOnWalls=false) {
    maxRadius = maxRadius || (this.width + this.height);
    grid.fill(0);
    const map = this;
	  const FOV = new types.FOV({
      isBlocked(i, j) {
	       return (!grid.hasXY(i, j)) || map.hasCellFlag(i, j, forbiddenFlags) || map.hasTileFlag(i, j, forbiddenTerrain) ;
	    },
      calcRadius(x, y) {
        return Math.sqrt(x**2 + y ** 2);
      },
      setVisible(x, y, v) {
        grid[x][y] = 1;
      },
      hasXY(x, y) { return grid.hasXY(x, y); }
    });
	  return FOV.calculate(x, y, maxRadius, cautiousOnWalls);
	}

	// MEMORIES

	storeMemory(x, y) {
		const cell = this.cell(x, y);
		cell.storeMemory();
	}

	storeMemories() {
		let x, y;
		for(x = 0; x < this.width; ++x) {
			for(y = 0; y < this.height; ++y) {
				const cell = this.cell(x, y);
				if (cell.flags & Cell.ANY_KIND_OF_VISIBLE) {
					this.storeMemory(x, y);
				}
				cell.flags &= Cell.PERMANENT_CELL_FLAGS | config.PERMANENT_CELL_FLAGS;
				cell.mechFlags &= Cell.PERMANENT_MECH_FLAGS | config.PERMANENT_MECH_FLAGS;
			}
		}
	}

	// TICK

	async tick() {
    map$1.debug('tick');
		this.forEach( (c) => c.mechFlags &= ~(CellMech.EVENT_FIRED_THIS_TURN | CellMech.EVENT_PROTECTED));
		for(let x = 0; x < this.width; ++x) {
			for(let y = 0; y < this.height; ++y) {
				const cell = this.cells[x][y];
				await cell.fireEvent('tick', { map: this, x, y, cell, safe: true });
			}
		}
    map$1.updateLiquid(this);
	}

  resetEvents() {
    this.forEach( (c) => c.mechFlags &= ~(CellMech.EVENT_FIRED_THIS_TURN | CellMech.EVENT_PROTECTED));
  }

}

types.Map = Map$1;


function makeMap(w, h, opts={}) {
  if (typeof opts === 'string') {
    opts = { tile: opts };
  }
	const map = new types.Map(w, h, opts);
	const floor = opts.tile || opts.floor || opts.floorTile;
	const boundary = opts.boundary || opts.wall || opts.wallTile;
	if (floor) {
		map.fill(floor, boundary);
	}
  if (!data.map) {
    data.map = map;
  }
	return map;
}

make.map = makeMap;


function getCellAppearance(map, x, y, dest) {
	dest.blackOut();
	if (!map.hasXY(x, y)) return;
	const cell$1 = map.cell(x, y);

  if (cell$1.isAnyKindOfVisible() && (cell$1.flags & (Cell.CELL_CHANGED | Cell.NEEDS_REDRAW))) {
    cell.getAppearance(cell$1, dest);
  }
  else if (cell$1.isRevealed()) {
    dest.drawSprite(cell$1.memory.sprite);
  }

  if (cell$1.isVisible()) ;
  else if ( !cell$1.isRevealed()) {
    dest.blackOut();
  }
  else if (!cell$1.isAnyKindOfVisible()) {
    dest.bg.mix(colors.black, 30);
    dest.fg.mix(colors.black, 30);
  }

  let needDistinctness = false;
  if (cell$1.flags & (Cell.IS_CURSOR | Cell.IS_IN_PATH)) {
    const highlight = (cell$1.flags & Cell.IS_CURSOR) ? colors.cursorColor : colors.yellow;
    if (cell$1.hasTileMechFlag(TileMech.TM_INVERT_WHEN_HIGHLIGHTED)) {
      swap(dest.fg, dest.bg);
    } else {
      // if (!GAME.trueColorMode || !dest.needDistinctness) {
          // dest.fg.mix(highlight, CONFIG.cursorPathIntensity || 20);
      // }
      dest.bg.mix(highlight, config.cursorPathIntensity || 20);
    }
    needDistinctness = true;
  }

  if (needDistinctness) {
    separate(dest.fg, dest.bg);
  }

	// dest.bake();
}

map$1.getCellAppearance = getCellAppearance;



function addText(map, x, y, text, fg, bg, layer) {
	for(let ch of text) {
		const sprite = make.sprite(ch, fg, bg);
    const cell = map.cell(x++, y);
    cell.addSprite(layer || TileLayer$2.GROUND, sprite);
	}
}

map$1.addText = addText;


function updateGas(map) {

  if (map.flags & Map.MAP_NO_GAS) return;

  const newVolume = alloc(map.width, map.height);

	map.forEach( (c, x, y) => {
		if (c.hasTileFlag(Tile.T_OBSTRUCTS_GAS)) return;

    let liquid = c.gas;
    let highest = c.gasVolume;
  	let sum = c.gasVolume;
    let count = 1;
    map.eachNeighbor(x, y, (n) => {
			if (n.hasTileFlag(Tile.T_OBSTRUCTS_GAS)) return;
    	++count;
      sum += n.gasVolume;
      if (n.gasVolume > highest) {
        gas = n.gas;
        highest = n.gasVolume;
      }
    });

    if (!sum) return;

    const newVol = Math.floor(sum / count);
    if (c.gas != gas) {
      c._setTile(gas, newVol, this); // volume = 1 to start, will change later
    }
    newVolume[x][y] += newVol;

    const rem = sum - (count * Math.floor(sum/count));
    if (rem && (random.number(count) < rem)) {
    	newVolume[x][y] += 1;
    }
    // disperses
    // if (newVolume[x][y] && random.chance(20)) {
    // 	newVolume[x][y] -= 1;
    // }
	});

  let hasGas = false;
  newVolume.forEach( (v, i, j) => {
    const cell =  map.cell(i, j);
    if (v) {
      hasGas = true;
      if (cell.gas && cell.gasVolume !== v) {
        cell.gasVolume = v;
        map.redrawCell(cell);
      }
    }
    else if (cell.gas) {
      cell.clearLayer('GAS');
      map.redrawCell(cell);
    }
  });

  if (hasGas) {
    map.flags &= ~Map.MAP_NO_GAS;
  }
  else {
    map.flags |= Map.MAP_NO_GAS;
  }
  map.changed(true);

  free(newVolume);
}

map$1.updateGas = updateGas;



function updateLiquid(map) {

  if (map.flags & Map.MAP_NO_LIQUID) return;

  const newVolume = alloc(map.width, map.height);

	map.forEach( (c, x, y) => {
		if (c.hasTileFlag(Tile.T_OBSTRUCTS_LIQUID)) return;

    let liquid = c.liquid;
    let highest = c.liquidVolume;
    let count = 1;

    map.eachNeighbor(x, y, (n) => {
			if (n.hasTileFlag(Tile.T_OBSTRUCTS_LIQUID)) return;
    	++count;
      if (n.liquidVolume > highest) {
        liquid = n.liquid;
        highest = n.liquidVolume;
      }
    });

    let newVol = c.liquidVolume;
    if ((newVol > 10) && (count > 1)) {
      let spread = Math.round(0.2 * c.liquidVolume);
      if (spread > 5) {
        newVol -= spread;
        if (c.liquid != liquid) {
          c._setTile(liquid, newVol, this); // volume = 1 to start, will change later
        }

        // spread = Math.floor(spread / count);
        if (spread) {
          newVolume.eachNeighbor(x, y, (v, i, j) => {
            newVolume[i][j] = v + spread;
          });
        }
      }
    }

    newVolume[x][y] += newVol;

    // disperses
    const tile = c.liquidTile;
    if (newVolume[x][y] && random.chance(tile.dissipate, 10000)) {
    	newVolume[x][y] -= 1;
    }
	});

  let hasLiquid = false;
  newVolume.forEach( (v, i, j) => {
    const cell =  map.cell(i, j);
    if (v) {
      hasLiquid = true;
      if (cell.liquid && cell.liquidVolume !== v) {
        cell.liquidVolume = v;
        map.redrawCell(cell);
      }
    }
    else if (cell.liquid) {
      cell.clearLayer('LIQUID');
      map.redrawCell(cell);
    }
  });

  if (hasLiquid) {
    map.flags &= ~Map.MAP_NO_LIQUID;
  }
  else {
    map.flags |= Map.MAP_NO_LIQUID;
  }

  map.changed(true);

  free(newVolume);
}

map$1.updateLiquid = updateLiquid;


const FP_BASE = 16;
const FP_FACTOR = (1<<16);

// ADAPTED FROM BROGUE 1.7.5
// Simple line algorithm (maybe this is Bresenham?) that returns a list of coordinates
// that extends all the way to the edge of the map based on an originLoc (which is not included
// in the list of coordinates) and a targetLoc.
// Returns the number of entries in the list, and includes (-1, -1) as an additional
// terminus indicator after the end of the list.
function getLine(map, fromX, fromY, toX, toY) {
	let targetVector = [], error = [], currentVector = [], previousVector = [], quadrantTransform = [];
	let largerTargetComponent, i;
	let currentLoc = [], previousLoc = [];

	const line = [];

	if (fromX == toX && fromY == toY) {
		return line;
	}

	const originLoc = [fromX, fromY];
	const targetLoc = [toX, toY];

	// Neither vector is negative. We keep track of negatives with quadrantTransform.
	for (i=0; i<= 1; i++) {
		targetVector[i] = (targetLoc[i] - originLoc[i]) << FP_BASE;	// FIXME: should use parens?
		if (targetVector[i] < 0) {
			targetVector[i] *= -1;
			quadrantTransform[i] = -1;
		} else {
			quadrantTransform[i] = 1;
		}
		currentVector[i] = previousVector[i] = error[i] = 0;
		currentLoc[i] = originLoc[i];
	}

	// normalize target vector such that one dimension equals 1 and the other is in [0, 1].
	largerTargetComponent = Math.max(targetVector[0], targetVector[1]);
	// targetVector[0] = Math.floor( (targetVector[0] << FP_BASE) / largerTargetComponent);
	// targetVector[1] = Math.floor( (targetVector[1] << FP_BASE) / largerTargetComponent);
	targetVector[0] = Math.floor(targetVector[0] * FP_FACTOR / largerTargetComponent);
	targetVector[1] = Math.floor(targetVector[1] * FP_FACTOR / largerTargetComponent);

	do {
		for (i=0; i<= 1; i++) {

			previousLoc[i] = currentLoc[i];

			currentVector[i] += targetVector[i] >> FP_BASE;
			error[i] += (targetVector[i] == FP_FACTOR ? 0 : targetVector[i]);

			if (error[i] >= Math.floor(FP_FACTOR / 2) ) {
				currentVector[i]++;
				error[i] -= FP_FACTOR;
			}

			currentLoc[i] = Math.floor(quadrantTransform[i]*currentVector[i] + originLoc[i]);

		}

		if (map.hasXY(currentLoc[0], currentLoc[1])) {
			line.push(currentLoc.slice());
		}
		else {
			break;
		}

	} while (true);

	return line;
}

map$1.getLine = getLine;

function demoteCellVisibility(cell, i, j, map) {
  cell.flags &= ~Cell.WAS_VISIBLE;
  if (cell.flags & Cell.VISIBLE) {
    cell.flags &= ~Cell.VISIBLE;
    cell.flags |= Cell.WAS_VISIBLE;
  }
}

function _updateCellVisibility(cell, i, j, map) {

  const isVisible = (cell.flags & Cell.VISIBLE);
  const wasVisible = (cell.flags & Cell.WAS_VISIBLE);

  if (isVisible && wasVisible) {
    if (cell.lightChanged()) {
      map.redrawCell(cell);
    }
    return true;
  }
	else if (isVisible && !wasVisible) { // if the cell became visible this move
		if (!(cell.flags & Cell.REVEALED) && data.automationActive) {
        if (cell.item) {
            const theItem = cell.item;
            if (theItem.hasKindFlag(ItemKind.IK_INTERRUPT_EXPLORATION_WHEN_SEEN)) {
                MSG.add('§you§ §see§ ΩitemMessageColorΩ§item§∆.', { item, actor: GW.data.player });
            }
        }
        if (!(cell.flags & Cell.MAGIC_MAPPED)
            && cell.hasTileMechFlag(TileMech.TM_INTERRUPT_EXPLORATION_WHEN_SEEN))
				{
            const tile = cell.tileWithMechFlag(TileMech.TM_INTERRUPT_EXPLORATION_WHEN_SEEN);
            MSG.add('§you§ §see§ ΩbackgroundMessageColorΩ§item§∆.', { actor: GW.data.player, item: tile.name });
        }
    }
    map.markRevealed(i, j);
		map.redrawCell(cell);
    return true;
	} else if ((!isVisible) && wasVisible) { // if the cell ceased being visible this move
    cell.storeMemory();
		map.redrawCell(cell);
    return true;
	}
  return false;
}

function _updateCellClairyvoyance(cell, i, j, map) {
  const isClairy = (cell.flags & Cell.CLAIRVOYANT_VISIBLE);
  const wasClairy = (cell.flags & Cell.WAS_CLAIRVOYANT_VISIBLE);

  if (isClairy && wasClairy) {
    if (cell.lightChanged()) {
      map.redrawCell(cell);
    }
    return true;
  }
  else if ((!isClairy) && wasClairy) { // ceased being clairvoyantly visible
		cell.storeMemory();
		map.redrawCell(cell);
    return true;
	} else if ((!wasClairy) && (isClairy)) { // became clairvoyantly visible
		cell.flags &= ~STABLE_MEMORY;
		map.redrawCell(cell);
    return true;
	}

  return false;
}


function _updateCellTelepathy(cell, i, j, map) {
  const isTele = (cell.flags & Cell.TELEPATHIC_VISIBLE);
  const wasTele = (cell.flags & Cell.WAS_TELEPATHIC_VISIBLE);

  if (isTele && wasTele) {
    if (cell.lightChanged()) {
      map.redrawCell(cell);
    }
    return true;
  }
  else if ((!isTele) && wasTele) { // ceased being telepathically visible
    cell.storeMemory();
		map.redrawCell(cell);
    return true;
	} else if ((wasTele) && (isTele)) { // became telepathically visible
    if (!(cell.flags & Cell.REVEALED)
			&& !cell.hasTileFlag(Tile.T_PATHING_BLOCKER))
		{
			data.xpxpThisTurn++;
    }
		cell.flags &= ~Cell.STABLE_MEMORY;
		map.redrawCell(cell);
    return true;
	}
  return false;
}


function _updateCellDetect(cell, i, j, map) {
  const isMonst = (cell.flags & Cell.MONSTER_DETECTED);
  const wasMonst = (cell.flags & Cell.WAS_MONSTER_DETECTED);

  if (isMonst && wasMonst) {
    if (cell.lightChanged()) {
      map.redrawCell(cell);
    }
    return true;
  }
  else if ((!isMonst) && (wasMonst)) { // ceased being detected visible
		cell.flags &= ~Cell.STABLE_MEMORY;
		map.redrawCell(cell);
    cell.storeMemory();
    return true;
	} else if ((!wasMonst) && (isMonst)) { // became detected visible
		cell.flags &= ~Cell.STABLE_MEMORY;
		map.redrawCell(cell);
    cell.storeMemory();
    return true;
	}
  return false;
}


function promoteCellVisibility(cell, i, j, map) {

	if (cell.flags & Cell.IN_FOV
		&& (map.hasVisibleLight(i, j))
		&& !(cell.flags & Cell.CLAIRVOYANT_DARKENED))
	{
		cell.flags |= Cell.VISIBLE;
	}

  if (_updateCellVisibility(cell, i, j, map)) return;
  if (_updateCellClairyvoyance(cell, i, j, map)) return;
  if (_updateCellTelepathy(cell, i, j, map)) return;
  if (_updateCellDetect(cell, i, j, map)) return;

}


function initMap(map) {
  if (!config.fov) {
    map.forEach( (cell) => cell.flags |= Cell.REVEALED );
    return;
  }

  map.clearFlags(0, Cell.IS_WAS_ANY_KIND_OF_VISIBLE);
}


function update$1(map, x, y, maxRadius) {
  if (!config.fov) return;

  if (!(map.flags & Map.MAP_FOV_CHANGED)) return;
  map.flags &= ~Map.MAP_FOV_CHANGED;

  map.forEach( demoteCellVisibility );
  map.clearFlags(0, Cell.IN_FOV);

  // Calculate player's field of view (distinct from what is visible, as lighting hasn't been done yet).
  const grid$1 = alloc(map.width, map.height, 0);
  map.calcFov(grid$1, x, y, maxRadius);
  grid$1.forEach( (v, i, j) => {
    if (v) {
      map.setCellFlags(i, j, Cell.IN_FOV);
    }
  });
  free(grid$1);

	map.setCellFlags(x, y, Cell.IN_FOV | Cell.VISIBLE);

	// if (PLAYER.bonus.clairvoyance < 0) {
  //   discoverCell(PLAYER.xLoc, PLAYER.yLoc);
	// }
  //
	// if (PLAYER.bonus.clairvoyance != 0) {
	// 	updateClairvoyance();
	// }
  //
  // updateTelepathy();
	// updateMonsterDetection();

	// updateLighting();
	map.forEach( promoteCellVisibility );

	// if (PLAYER.status.hallucinating > 0) {
	// 	for (theItem of DUNGEON.items) {
	// 		if ((pmap[theItem.xLoc][theItem.yLoc].flags & DISCOVERED) && refreshDisplay) {
	// 			refreshDungeonCell(theItem.xLoc, theItem.yLoc);
	// 		}
	// 	}
	// 	for (monst of DUNGEON.monsters) {
	// 		if ((pmap[monst.xLoc][monst.yLoc].flags & DISCOVERED) && refreshDisplay) {
	// 			refreshDungeonCell(monst.xLoc, monst.yLoc);
	// 		}
	// 	}
	// }

}

var visibility = {
  __proto__: null,
  initMap: initMap,
  update: update$1
};

var actions = {};

actions.debug = NOOP;

var actor = {};
var actorKinds = {};

actor.debug = NOOP;




class ActorKind$1 {
  constructor(opts={}) {
		this.name = opts.name || 'item';
		this.description = opts.description || opts.desc || '';
    this.article = (opts.article === undefined) ? 'a' : opts.article;
		this.sprite = make.sprite(opts.sprite || opts);
    this.flags = ActorKind.toFlag(opts.flags);
		this.actionFlags = Action.toFlag(opts.flags);
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

    this.speed = opts.speed || config.defaultSpeed || 120;

    if (opts.consoleColor === false) {
      this.consoleColor = false;
    }
    else {
      this.consoleColor = opts.consoleColor || true;
      if (typeof this.consoleColor === 'string') {
        this.consoleColor = from(this.consoleColor);
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
        if (typeof v === 'string') return ai[v];
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
    map = map || data.map;
		return map.isOrWasAnyKindOfVisible(actor.x, actor.y);
	}

  alwaysVisible(actor) {
    return this.flags & (ActorKind.AF_IMMOBILE | ActorKind.AF_INANIMATE);
  }

  avoidedCellFlags(actor) {
    return Cell.HAS_MONSTER | Cell.HAS_ITEM;
  }

  avoidedTileFlags(actor) {
    return 0; // ???
  }

  forbiddenCellFlags(actor) {
		return Cell.HAS_ACTOR;
	}

	forbiddenTileFlags(actor) {
		return Tile.T_PATHING_BLOCKER;
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
      data.gameHasEnded = true;
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
      let color$1 = opts.color;
      if (typeof color$1 === 'boolean') {
        color$1 = this.consoleColor;
        if (typeof color$1 === 'boolean') {
          color$1 = this.sprite.fg;
        }
      }
      if (color$1 && typeof opts.color !== 'string') {
        color$1 = from(color$1);
        color$1 = color$1.isNull() ? null : color$1.toString();
      }
      if (color$1) {
        result = apply('Ω§color§Ω§result§∆', { color: color$1, result });
      }
    }

    if (opts.article && (this.article !== false)) {
      if (opts.formal || !actor.isPlayer()) {
        let article = (opts.article === true) ? this.article : opts.article;
        if (article == 'a' && isVowel(firstChar(result))) {
          article = 'an';
        }
        result = article + ' ' + result;
      }
    }
    return result;
  }
}

types.ActorKind = ActorKind$1;

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

class Actor$1 {
	constructor(kind, opts={}) {
		this.x = -1;
    this.y = -1;
    this.flags = Actor.toFlag(opts.flags);
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
          ERROR('Invalid AI - must be function, or object with function for act or fn member.');
        }
        if (ai.init) {
          ai.init(this);
        }
      });
    }

    this.id = ++ACTOR_COUNT;

    if (opts.female) {
      this.flags &= ~Actor.AF_MALE;
      this.flags |= Actor.AF_FEMALE;
    }
    else if (opts.male) {
      this.flags &= ~Actor.AF_FEMALE;
      this.flags |= Actor.AF_MALE;
    }
    else if (this.hasAllFlags(Actor.AF_MALE | Actor.AF_FEMALE)) {
      const remove = random.chance(50) ? Actor.AF_MALE : Actor.AF_FEMALE;
      this.flags &= ~remove;
    }

    this.kind.make(this, opts);
    if (this.kind.calcEquipmentBonuses) {
      this.kind.calcEquipmentBonuses(this);
    }
  }

  turnEnded() { return this.flags & Actor.AF_TURN_ENDED; }

  isPlayer() { return this === data.player; }
  isDead() { return (this.current.health <= 0) || (this.flags & Actor.AF_DYING); }
  isInanimate() { return this.kind.flags & ActorKind.AK_INANIMATE; }
  isInvulnerable() { return this.kind.flags & ActorKind.AK_INVULNERABLE; }

  isFemale() { return this.flags & Actor.AF_FEMALE; }
  isMale() { return this.flags & Actor.AF_MALE; }

  hasAllFlags(flags) {
    return (this.flags & flags) === flags;
  }

  hasActionFlag(flag) {
    if (this.isPlayer()) return true; // Players can do everything
    return this.kind.actionFlags & flag;
  }

  changed(v) {
    if (v) {
      this.flags |= Actor.AF_CHANGED;
    }
    else if (v !== undefined) {
      this.flags &= ~Actor.AF_CHANGED;
    }
    return (this.flags & Actor.AF_CHANGED);
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
      if (typeof bumpFn === 'string') {
        bumpFn = actions[bumpFn] || kind[bumpFn] || FALSE;
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
    this.flags |= Actor.AF_DYING;
    this.changed(true);
    this.kind.kill(this);
    if (this.mapToMe) {
      free(this.mapToMe);
      this.mapToMe = null;
    }
    if (this.travelGrid) {
      free(this.travelGrid);
      this.travelGrid = null;
    }
  }

  // MOVEMENT/VISION

  canDirectlySee(other, map) {
    map = map || data.map;

    //
    if (!this.kind.canVisualize(this, other, map)) {
      return false;
    }

    if (this.isPlayer() || other.isPlayer()) {
      other = (this.isPlayer()) ? other : this;
      return map.isVisible(other.x, other.y);
    }
    else {
      let dist = distanceFromTo(this, other);
      if (dist < 2) return true;  // next to each other

      // TODO - Make a raycast that can tell if there is clear vision from here to there
      const grid$1 = alloc(map.width, map.height);
      map.calcFov(grid$1, this.x, this.y, dist + 1);
      const result = grid$1[other.x][other.y];
      free(grid$1);
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
    const map = data.map;
    let mapToMe = this.mapToMe;
    if (!mapToMe) {
      mapToMe = this.mapToMe = alloc(map.width, map.height);
      mapToMe.x = mapToMe.y = -1;
    }
    if (mapToMe.x != this.x || mapToMe.y != this.y) {
      let costGrid = this.costGrid;
      if (!costGrid) {
        costGrid = this.costGrid = alloc(map.width, map.height);
        this.fillCostGrid(map, costGrid);
      }
      calculateDistances(mapToMe, this.x, this.y, costGrid, true);
      // Grid.free(costGrid);
    }
    return mapToMe;
  }

  invalidateCostMap() {
    if (this.costGrid) {
      free(this.costGrid);
      this.costGrid = null;
    }
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
    return toSingularVerb(verb);
  }

  getPronoun(pn) {
    if (this.isPlayer()) {
      return playerPronoun[pn];
    }

    return singularPronoun[pn];
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
    this.current[stat] = clamp((this.current[stat] || 0) + delta, 0, this.max[stat]);
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

    if (addToChain(this, 'pack', item)) {
      return true;
    }
  }

  removeFromPack(item) {
    return removeFromChain(this, 'pack', item);
  }

  eachPack(fn) {
    eachChain(this.pack, fn);
  }

  itemWillFitInPack(item, quantity) {
    if (!this.pack) return true;
    const maxSize = GW.config.PACK_MAX_ITEMS || 26;

    const count = chainLength(this.pack);
    if (count < maxSize) return true;

    if (!item.isStackable()) return false;
    let willStack = false;
    eachChain(this.pack, (packItem) => {
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

  toString() {
    return this.getName(false);
  }

}

types.Actor = Actor$1;


function makeActor(kind, opts) {
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

function startActorTurn(theActor) {
  theActor.flags &= ~Actor.AF_TURN_ENDED;
  theActor.turnTime = 0;
  Object.assign(theActor.prior, theActor.current);
}

actor.startTurn = startActorTurn;

function endActorTurn(theActor, turnTime=1) {
  if (theActor.turnEnded()) return;

  theActor.flags |= Actor.AF_TURN_ENDED;
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
    update$1(data.map, theActor.x, theActor.y, theActor.current.fov);
    // UI.requestUpdate(1);  // 48
  }
  else if (theActor.kind.isOrWasVisibleToPlayer(theActor, data.map) && theActor.turnTime) {
    ui.requestUpdate(10);
  }
}

actor.endTurn = endActorTurn;

// TODO - move back to game??
async function takeTurn(theActor) {
  theActor.debug('actor turn...', data.time, theActor.id);
  if (theActor.isDead() || data.gameHasEnded) return 0;

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
    WARN('Tried to place 0 actors.');
    return [];
  }

  let choices = opts.choices;
  // TODO - allow ['THING'] and { THING: 20 }
  if (!choices) {
    let matchKindFn = opts.matchKindFn || TRUE;
    choices = Object.values(GW.actorKinds).filter(matchKindFn);
  }

  let frequencies;
  if (Array.isArray(choices)) {
    choices = choices.map( (v) => {
      if (typeof v === 'string') return actorKinds[v];
      return v;
    });
    frequencies = choices.map( (k) => forDanger(k.frequency, opts.danger) );
  }
  else {
    // { THING: 20, OTHER: 10 }
    choices = Object.keys(choices).map( (v) => actorKinds[v] );
    frequencies = Object.values(choices);
  }

  if (!choices.length) {
    WARN('Tried to place actors - 0 qualifying kinds to choose from.');
    return [];
  }

  const kinds = [];
  for(let i = 0; i < count; ++i) {
    const index = random.lottery(frequencies);
    kinds.push(choices[index]);
  }

  return kinds;
}


function generateAndPlace(map, opts={}) {
  if (typeof opts === 'number') { opts = { tries: opts }; }
  if (Array.isArray(opts)) { opts = { kinds: opts }; }
  setDefaults(opts, {
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

  const blocked = alloc(map.width, map.height);
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

  free(blocked);
  return placed;
}

actor.generateAndPlace = generateAndPlace;

var player = {};

player.debug = NOOP;



function makePlayer(kind) {
  if (!(kind instanceof types.ActorKind)) {
    kindDefaults(kind, {
      ch:'@', fg: 'white',
      name: 'you', article: false,
      'attacks.melee': { verb: 'punch', damage: 1 },
      bump: ['talk', 'attack'],
    });
    kind = new types.ActorKind(kind);
  }
  return new types.Actor(kind);
}

make.player = makePlayer;



async function takeTurn$1() {
  const PLAYER = data.player;
  player.debug('player turn...', data.time);
  if (PLAYER.isDead() || data.gameHasEnded) {
    return 0;
  }
  updateLighting(data.map);
  await ui.updateIfRequested();
  await startActorTurn(PLAYER);

  while(!PLAYER.turnTime) {
    const ev = await io.nextEvent(PLAYER.travelDest ? 0 : 1000);
    if (PLAYER.travelDest && ((!ev) || (ev.type === GW.def.TICK))) {
      await GW.actions.travel(PLAYER);
    }
    else {
      if (!await ui.dispatchEvent(ev)) {
        await io.dispatchEvent(ev);
      }
      await ui.updateIfRequested();
    }
    if (data.gameHasEnded) {
      return 0;
    }
  }

  player.debug('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn$1;



function isValidStartLoc(cell, x, y) {
  if (cell.hasTileFlag(Tile.T_PATHING_BLOCKER | Tile.T_HAS_STAIRS)) {
    return false;
  }
  return true;
}

player.isValidStartLoc = isValidStartLoc;

class Scheduler {
	constructor() {
  	this.next = null;
    this.time = 0;
    this.cache = null;
  }

	clear() {
		while(this.next) {
			const current = this.next;
			this.next = current.next;
			current.next = this.cache;
			this.cache = current;
		}
	}

  push(fn, delay=1) {
    let item;
    if (this.cache) {
    	item = this.cache;
      this.cache = item.next;
			item.next = null;
    }
    else {
    	item = { fn: null, time: 0, next: null };
    }
		item.fn = fn;
    item.time = this.time + delay;
    if (!this.next) {
	    this.next = item;
    }
    else {
    	let current = this;
      let next = current.next;
    	while(next && next.time <= item.time) {
      	current = next;
        next = current.next;
      }
      item.next = current.next;
      current.next = item;
    }
		return item;
  }

  pop() {
  	const n = this.next;
		if (!n) return null;

    this.next = n.next;
    n.next = this.cache;
    this.cache = n;

		this.time = Math.max(n.time, this.time);	// so you can schedule -1 as a time uint
    return n.fn;
  }

	remove(item) {
    if ((!item) || (!this.next)) return;
		if (this.next === item) {
			this.next = item.next;
			return;
		}
		let prev = this.next;
		let current = prev.next;
		while( current && current !== item ) {
			prev = current;
			current = current.next;
		}

		if (current === item) {
			prev.next = current.next;
		}
	}
}

const scheduler = new Scheduler();

let ANIMATIONS = [];

function busy$1() {
  return ANIMATIONS.some( (a) => a );
}


async function playAll() {
  while(busy$1()) {
    const dt = await io.nextTick();
    ANIMATIONS.forEach( (a) => a && a.tick(dt) );
    ANIMATIONS = ANIMATIONS.filter( (a) => a && !a.done );
  }
}


function tick(dt) {
  if (!ANIMATIONS.length) return false;

  ANIMATIONS.forEach( (a) => a && a.tick(dt) );
  ANIMATIONS = ANIMATIONS.filter( (a) => a && !a.done );
  // if (ANIMATIONS.length == 0) {
  //   IO.resumeEvents();
  // }
  return true;
}

async function playRealTime(animation) {
  animation.playFx = playRealTime;

  // IO.pauseEvents();
  animation.start();
  ANIMATIONS.push(animation);
  return new Promise( (resolve) => animation.callback = resolve );
}


async function playGameTime(anim) {
  anim.playFx = playGameTime;

  anim.start();
  scheduler.push(() => {
    anim.step();
    ui.requestUpdate(1);
    return anim.done ? 0 : anim.speed;
  },  anim.speed);

  return new Promise( (resolve) => anim.callback = resolve );
}


class FX {
  constructor(opts={}) {
    this.tilNextTurn = opts.speed || opts.duration || 1000;
    this.speed = opts.speed || opts.duration || 1000;
    this.callback = NOOP;
    this.done = false;
  }

  tick(dt) {
    if (this.done) return;
    this.tilNextTurn -= dt;
    while (this.tilNextTurn < 0 && !this.done) {
      this.step();
      this.tilNextTurn += this.speed;
    }
  }

  step() {
    this.stop();
  }

  start() {}

  stop(result) {
    if (this.done) return;
    this.done = true;
    this.callback(result);
  }

}

types.FX = FX;


class SpriteFX extends FX {
  constructor(map, sprite, x, y, opts={}) {
    const count = opts.blink || 1;
    const duration = opts.duration || 1000;
    opts.speed = opts.speed || (duration / (2*count-1));
    super(opts);
    if (typeof sprite === 'string') {
      sprite = sprites[sprite];
    }
    this.map = map;
    this.sprite = sprite;
    this.x = x || 0;
    this.y = y || 0;
    this.stepCount = 2*count - 1;
  }

  start() {
    this.map.addFx(this.x, this.y, this);
    return super.start();
  }

  step() {
    --this.stepCount;
    if (this.stepCount <= 0) return this.stop();
    if (this.stepCount % 2 == 0) {
      this.map.removeFx(this);
    }
    else {
      this.map.addFx(this.x, this.y, this);
    }
  }

  stop(result) {
    this.map.removeFx(this);
    return super.stop(result);
  }

  moveDir(dx, dy) {
    return this.moveTo(this.x + dx, this.y + dy);
  }

  moveTo(x, y) {
    this.map.moveFx(x, y, this);
    return true;
  }

}



async function flashSprite(map, x, y, sprite, duration=100, count=1) {
  const anim = new SpriteFX(map, sprite, x, y, { duration, blink: count });
  return playRealTime(anim);
}


install$1('bump', 'white', 50);


async function hit(map, target, sprite, duration) {
  sprite = sprite || config.fx.hitSprite || 'hit';
  duration = duration || config.fx.hitFlashTime || 200;
  await flashSprite(map, target.x, target.y, sprite, duration, 1);
}

install$1('hit', 'red', 50);

async function miss(map, target, sprite, duration) {
  sprite = sprite || config.fx.missSprite || 'miss';
  duration = duration || config.fx.missFlashTime || 200;
  await flashSprite(map, target.x, target.y, sprite, duration, 1);
}

install$1('miss', 'green', 50);


class MovingSpriteFX extends SpriteFX {
  constructor(map, source, target, sprite, speed, stepFn) {
    super(map, sprite, source.x, source.y, { speed });
    this.target = target;
    this.path = map$1.getLine(this.map, source.x, source.y, this.target.x, this.target.y);
    this.stepFn = stepFn || TRUE;
  }

  step() {
    if (this.x == this.target.x && this.y == this.target.y) return this.stop(this);
    if (!this.path.find( (loc) => loc[0] == this.target.x && loc[1] == this.target.y)) {
      this.path = map$1.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    }
    const next = this.path.shift();
    const r = this.stepFn(next[0], next[1]);
    if (r < 0) {
      return this.stop(this);
    }
    else if (r) {
      return this.moveTo(next[0], next[1]);
    }
    else {
      this.moveTo(next[0], next[1]);
      this.target.x = this.x;
      this.target.y = this.y;
    }
  }
}

types.MovingSpriteFX = MovingSpriteFX;


async function bolt(map, source, target, sprite, opts={}) {
  if (typeof sprite === 'string') {
    sprite = SPRITES[sprite];
  }
  opts.speed = opts.speed || 3;
  opts.stepFn = opts.stepFn || ((x, y) => map.isObstruction(x, y) ? -1 : 1);
  opts.playFn = playGameTime;
  if (opts.realTime || (!opts.gameTime)) {
    opts.speed *= 16;
    opts.playFn = playRealTime;
  }

  const anim = new MovingSpriteFX(map, source, target, sprite, opts.speed, opts.stepFn);
  return opts.playFn(anim);
}


async function projectile(map, source, target, sprite, opts) {
  if (sprite.ch.length == 4) {
    const dir = dirFromTo(source, target);
    let index = 0;
    if (dir[0] && dir[1]) {
      index = 2;
      if (dir[0] != dir[1]) { // remember up is -y
        index = 3;
      }
    }
    else if (dir[0]) {
      index = 1;
    }
    const ch = sprite.ch[index];
    sprite = make.sprite(ch, sprite.fg, sprite.bg);
  }
  else if (sprite.ch.length !== 1) {
    ERROR('projectile requires 4 chars - vert,horiz,diag-left,diag-right (e.g: "|-\\/")');
  }

  return bolt(map, source, target, sprite, opts);
}



//
// RUT.Animations.projectileToTarget = function projectileTo(map, from, target, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   if (opts === false) return;
//   opts = opts || {};
//   if (typeof opts === 'string') opts = { sprite: opts };
//
//   Object.defaults(opts, RUT.Config.Animations.projectile);
//   // if (!RUT.FOV.isVisible(shooter) && !RUT.FOV.isVisible(to)) { return Promise.resolve(); }
//   const sprite = opts.sprite;
//   let anim = new RUT.Animations.XYAnimation(map, sprite, from, () => target.xy, callback, opts.speed);
//   anim.start(); // .then( () => target.xy );
//   return anim;
// }
//

// export class DirAnimation extends FX {
//   constructor(sprite, from, dir, callback, opts={}) {
//     const speed = opts.speed || 10;
//     super(callback, { sprite, speed });
//     this.from = from;
//     this.dir = dir;
//     this.stopCell = opts.stopCell;
//     this.stopTile = opts.stopTile;
//     this.stepFn = opts.stepFn || TRUE;
//     this.range = opts.range || 99;
//   }
//
//   start() {
//     return super.start(this.from.x, this.from.y);
//   }
//
//   step() {
//     let dist = distanceFromTo(this.from, this.xy);
//     if (dist >= this.range) {
//       return this.stop(this.xy);
//     }
//
//     const newXy = this.xy.plus(this.dir);
//
//     const cell = DATA.map.cell(newXy.x, newXy.y);
//     if (!cell) {
//       return this.stop(this.xy);
//     }
//     else if (this.stopCell && RUT.Cell.hasAllFlags(cell, this.stopCell)) {
//       return this.stop(this.xy);
//     }
//     else if (this.stopTile && RUT.Cell.hasTileFlag(cell, this.stopTile)) {
//       return this.stop(this.xy);
//     }
//
//     DATA.map.moveAnimation(this.map, newXy.x, newXy.y, this);
//     if (this.stepFn(this.map, this.xy.x, this.xy.y)) {
//       return this.stop(this.xy);
//     }
//   }
// }

//
// RUT.Animations.projectileDir = function projectileTo(map, xy, dir, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   if (opts === false) return;
//   opts = opts || {};
//   if (typeof opts === 'string') opts = { sprite: opts };
//   if (opts.sprite === true) opts.sprite = RUT.Config.Animations.projectile.sprite;
//
//   Object.defaults(opts, RUT.Config.Animations.projectile);
//   let anim = new RUT.Animations.DirAnimation(map, opts.sprite, xy, dir, callback, opts);
//   anim.start(); // .then( () => anim.xy );
//   return anim;
// }
//

class BeamFX extends FX {
  constructor(map, from, target, sprite, speed, fade, stepFn) {
    speed = speed || 20;
    super({ speed });
    this.map = map;
    this.x = from.x;
    this.y = from.y;
    this.target = target;
    this.sprite = sprite;
    this.fade = fade || speed;
    this.path = map$1.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    this.stepFn = stepFn || TRUE;
  }

  step() {
    // if (this.x == this.target.x && this.y == this.target.y) return this.stop(this);
    // if (!this.path.find( (loc) => loc[0] == this.target.x && loc[1] == this.target.y)) {
    //   this.path = MAP.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    // }
    if (this.path.length == 0) { return this.stop(this); }
    const next = this.path.shift();
    const r = this.stepFn(next[0], next[1]);
    if (r < 0) {
      return this.stop(this);
    }
    else if (r) {
      return this.moveTo(next[0], next[1]);
    }
    else {
      this.moveTo(next[0], next[1]);
      this.target.x = this.x;
      this.target.y = this.y;
    }
  }

  moveTo(x, y) {
    if (!this.map.hasXY(x, y)) {
      // fx.debug('BEAM - invalid x,y', x, y);
      return;
    }
    this.x = x;
    this.y = y;
    // fx.flashSprite(this.map, x, y, this.sprite, this.fade);

    const anim = new SpriteFX(this.map, this.sprite, x, y, { duration: this.fade });
    this.playFx(anim);
  }

}


function beam(map, from, to, sprite, opts={}) {
  opts.fade = opts.fade || 5;
  opts.speed = opts.speed || 1;
  opts.stepFn = opts.stepFn || ((x, y) => map.isObstruction(x, y) ? -1 : 1);
  opts.playFn = playGameTime;
  if (opts.realTime || (!opts.gameTime)) {
    opts.speed *= 8;
    opts.fade *= 8;
    opts.playFn = playRealTime;
  }

  const animation = new BeamFX(map, from, to, sprite, opts.speed, opts.fade, opts.stepFn);
  return opts.playFn(animation);
}




class ExplosionFX extends FX {
  // TODO - take opts instead of individual params (do opts setup here)
  constructor(map, fovGrid, x, y, radius, sprite, speed, fade, shape, center, stepFn) {
    speed = speed || 20;
    super({ speed });
    this.map = map;
    this.grid = alloc(map.width, map.height);
    if (fovGrid) {
      this.grid.copy(fovGrid);
    }
    else {
      this.grid.fill(1);
    }
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = radius;
    this.sprite = sprite;
    this.fade = fade || 100;
    this.shape = shape || 'o';
    this.center = (center === undefined) ? true : center;
    this.stepFn = stepFn || TRUE;
    this.count = 0;
  }

  start() {
    if (this.center) {
      this.visit(this.x, this.y);
    }
    else {
      this.step();
    }
  }

  step() {
    if (this.radius >= this.maxRadius) return false;

    this.radius = Math.min(this.radius + 1, this.maxRadius);

    let done = true;
    let x = Math.max(0, Math.floor(this.x - this.maxRadius));
    const maxX = Math.min(this.grid.width - 1, Math.ceil(this.x + this.maxRadius));
    let minY = Math.max(0, Math.floor(this.y - this.maxRadius));
    const maxY = Math.min(this.grid.height - 1, Math.ceil(this.y + this.maxRadius));
    let col;
    let dist;

    for(; x <= maxX; ++x) {
      col = this.grid[x];
      for(let y = minY; y <= maxY; ++y) {
        if (col[y] != 1) continue;  // not in FOV
        dist = distanceBetween(this.x, this.y, x, y);
        if (dist <= this.radius) {
          this.visit(x, y);
        }
        else if (dist <= this.maxRadius) {
          done = false;
        }
      }
    }
    ui.requestUpdate(48);

    // fx.debug('returning...', done);
    if (done && (this.count == 0)) {
      return this.stop(this); // xy of explosion is callback value
    }
    return false;
  }

  visit(x, y) {
    if (this.isInShape(x, y) && this.stepFn(x, y)) {
      this.count += 1;
      const anim = new SpriteFX(this.map, this.sprite, x, y, { duration: this.fade });
      this.playFx(anim).then( () => {
        --this.count;
        if (this.count == 0) {
          this.stop(this);
        }
      });
      // flashSprite(this.map, x, y, this.sprite, this.fade);
    }
    this.grid[x][y] = 2;
  }

  isInShape(x, y) {
    const sx = Math.abs(x - this.x);
    const sy = Math.abs(y - this.y);
    if (sx == 0 && sy == 0 && !this.center) return false;
    switch(this.shape) {
      case '+': return sx == 0 || sy == 0;
      case 'x': return sx == sy;
      case '*': return (sx == 0 || sy == 0 || sx == sy);
      default: return true;
    }
  }

  stop(result) {
    this.grid = free(this.grid);
    return super.stop(result);
  }
}

function checkExplosionOpts(opts) {
  opts.speed = opts.speed || 5;
  opts.fade = opts.fade || 10;
  opts.playFn = playGameTime;
  opts.shape = opts.shape || 'o';
  if (opts.center === undefined) { opts.center = true; }

  if (opts.realTime || (!opts.gameTime)) {
    opts.speed = opts.speed * 8;
    opts.fade = opts.fade * 8;
    opts.playFn = playRealTime;
  }
}

function explosion(map, x, y, radius, sprite, opts={}) {
  checkExplosionOpts(opts);
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  const animation = new ExplosionFX(map, null, x, y, radius, sprite, opts.speed, opts.fade, opts.shape, opts.center, opts.stepFn);
  map.calcFov(animation.grid, x, y, radius);
  return opts.playFn(animation);
}


function explosionFor(map, grid, x, y, radius, sprite, opts={}) {
  checkExplosionOpts(opts);
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  const animation = new ExplosionFX(map, grid, x, y, radius, sprite, opts.speed, opts.fade, opts.shape, opts.center, opts.stepFn);
  return opts.playFn(animation);
}

var fx = {
  __proto__: null,
  busy: busy$1,
  playAll: playAll,
  tick: tick,
  playRealTime: playRealTime,
  playGameTime: playGameTime,
  FX: FX,
  SpriteFX: SpriteFX,
  flashSprite: flashSprite,
  hit: hit,
  miss: miss,
  MovingSpriteFX: MovingSpriteFX,
  bolt: bolt,
  projectile: projectile,
  BeamFX: BeamFX,
  beam: beam,
  explosion: explosion,
  explosionFor: explosionFor
};

const GAME_DEBUG = NOOP;

data.time = 0;
data.running = false;
data.turnTime = 10;



async function start(opts={}) {

  data.time = 0;
  data.running = true;
  data.player = opts.player || null;
  data.gameHasEnded = false;

  GW.utils.clearObject(maps);

  await emit('GAME_START', opts);

  if (opts.width) {
    config.width = opts.width;
    config.height = opts.height;
  }

  if (opts.buildMap) {
    buildMap = opts.buildMap;
  }

  let map = opts.map;
  if (typeof map === 'number' || !map) {
    map = await getMap(map);
  }

  if (!map) ERROR('No map!');

  if (opts.fov) {
    config.fov = true;
  }

  config.inventory = true;
  if (opts.inventory === false || opts.pack === false) {
    config.inventory = false;
  }

  if (opts.combat) {
    config.combat = combat;
  }

  await startMap(map, opts.start);
  queuePlayer();


  return loop$1();
}



function buildMap(id=0) {
  let width = 80;
  let height = 30;
  if (config.width) {
    width = config.width;
    height = config.height;
  }
  else if (viewport.bounds) {
    width = viewport.bounds.width;
    height = viewport.bounds.height;
  }
  const map = make.map(width, height, { tile: 'FLOOR', boundary: 'WALL' });
  map.id = id;
  return map;
}


async function getMap(id=0) {
  let map = maps[id];
  if (!map) {
    map = await buildMap(id);
    map.id = id;
    maps[id] = map;
  }
  return map;
}


async function startMap(map, loc='start') {

  // scheduler.clear();

  if (data.map && data.player) {
    await emit('STOP_MAP', data.map);

    if (data.map._tick) scheduler.remove(data.map._tick);
    data.map._tick = null;

    eachChain(data.map.actors, (actor) => {
      if (actor._tick) {
        scheduler.remove(actor._tick);
        actor._tick = null;
      }
    });

    data.map.removeActor(data.player);
  }

  initMap(map);
  data.map = map;

  if (data.player) {
    let startLoc;
    if (!loc) {
      if (data.player.x >= 0 && data.player.y >= 0) {
        loc = [data.player.x, data.player.y];
      }
      else {
        loc = 'start';
      }
    }

    if (Array.isArray(loc)) {
      startLoc = loc;
    }
    else if (typeof loc === 'string') {
      if (loc === 'player') {
        startLoc = [data.player.x, data.player.y];
      }
      else {
        startLoc = map.locations[loc];
      }
      if (!startLoc) {
        startLoc = [Math.floor(map.width / 2), Math.floor(map.height / 2)];
      }
    }

    startLoc = map.matchingXYNear(startLoc[0], startLoc[1], player.isValidStartLoc, { hallways: true });

    data.map.addActor(startLoc[0], startLoc[1], data.player);

    update$1(map, data.player.x, data.player.y, data.player.current.fov);
  }

  updateLighting(map);

  eachChain(map.actors, (actor) => {
    queueActor(actor);
  });

  ui.blackOutDisplay();
  map.redrawAll();
  ui.draw();

  if (map.events.welcome && !(map.flags & Map.MAP_SAW_WELCOME)) {
    map.flags |= Map.MAP_SAW_WELCOME;
    await map.events.welcome(map);
  }
  else if (map.events.start) {
    await map.events.start(map);
  }

  if (map.config.tick) {
    map._tick = scheduler.push( updateEnvironment, map.config.tick );
  }

  await emit('MAP_START', map);

}



async function loop$1() {

  ui.draw();

  while (data.running) {

    if (data.gameHasEnded) {
      const ev = await io.nextEvent(1000);
      if (ev) {
        if (!await ui.dispatchEvent(ev)) {
          await io.dispatchEvent(ev, {
            Enter() {
              data.running = false;
            }
          });
        }
        await ui.updateIfRequested();
      }
    }
    else {
      const fn = scheduler.pop();
      if (!fn) {
        utils.WARN('NO ACTORS! STOPPING GAME!');
        data.running = false;
      }
      else {
        if (scheduler.time > data.time) {
          data.time = scheduler.time;
          await ui.updateIfRequested();
        }
        const turnTime = await fn();
        if (turnTime) {
          scheduler.push(fn, turnTime);
        }
        data.map.resetEvents();
      }
    }

  }

  return data.isWin;
}


function queuePlayer() {
  data.player._tick = scheduler.push(player.takeTurn, data.player.kind.speed);
}


function queueActor(actor$1) {
  actor$1._tick = scheduler.push(actor.takeTurn.bind(null, actor$1), actor$1.kind.speed);
}

function delay(delay, fn) {
  return scheduler.push(fn, delay);
}


async function cancelDelay(timer) {
  return scheduler.remove(timer);
}

async function updateEnvironment() {

  const map = data.map;
  if (!map) return 0;

  await map.tick();
  update$1(map, data.player.x, data.player.y, data.player.current.fov);

  // UI.requestUpdate();

  return map.config.tick;
}



install$1('hilite', colors.white);

async function gameOver(isWin, msg, args) {
  if (args) {
    msg = apply(msg, args);
  }

  flavor.clear();
  message.add(msg);
  if (isWin) {
    data.isWin = true;
    message.add('ΩyellowΩWINNER!');
  }
  else {
    data.isWin = false;
    message.add('ΩredΩGAME OVER');
  }
  message.add('Press <Enter> to continue.');
  ui.updateNow();
  await flashSprite(data.map, data.player.x, data.player.y, 'hilite', 500, 3);
  data.gameHasEnded = true;
}


async function useStairs(x, y) {
  const player = data.player;
  const map = data.map;
  const cell = map.cell(x, y);
  let start = [player.x, player.y];
  let mapId = -1;
  if (cell.hasTileFlag(Tile.T_UP_STAIRS)) {
    start = 'down';
    mapId = map.id + 1;
    message.add('§you§ §ascend§.', { actor: player });
  }
  else if (cell.hasTileFlag(Tile.T_DOWN_STAIRS)) {
    start = 'up';
    mapId = map.id - 1;
    message.add('§you§ §descend§.', { actor: player });
  }
  else if (cell.hasTileFlag(Tile.T_PORTAL)) {
    start = cell.data.portalLocation;
    mapId = cell.data.portalMap;
  }
  else {  // FALL
    mapId = map.id - 1;
  }

  GAME_DEBUG('use stairs : was on: %d [%d,%d], going to: %d %s', map.id);

  const newMap = await getMap(mapId);

  await startMap(newMap, start);

  return true;
}

var game = {
  __proto__: null,
  start: start,
  get buildMap () { return buildMap; },
  getMap: getMap,
  startMap: startMap,
  queuePlayer: queuePlayer,
  queueActor: queueActor,
  delay: delay,
  cancelDelay: cancelDelay,
  updateEnvironment: updateEnvironment,
  gameOver: gameOver,
  useStairs: useStairs
};

var tile = {};

const TileLayer$3 = def.layer;

/** Tile Class */
class Tile$1 {
  /**
    * Creates a new Tile object.
    * @param {Object} [config={}] - The configuration of the Tile
    * @param {String|Number|String[]} [config.flags=0] - Flags and MechFlags for the tile
    * @param {String} [config.layer=GROUND] - Name of the layer for this tile
    * @param {String} [config.ch] - The sprite character
    * @param {String} [config.fg] - The sprite foreground color
    * @param {String} [config.bg] - The sprite background color
    */
  constructor(config={}, base={}) {
    Object.assign(this, {
      flags: 0,
      mechFlags: 0,
      layer: 0,
      priority: -1,
      sprite: {},
      events: {},
      light: null,  // id of light for this tile
      flavor: null,
      name: '',
      article: 'a',
      id: null,
      dissipate: 2000, // 20% of 10000
    });
    assignOmitting(['events'], this, base);
    assignOmitting(['Extends', 'extends', 'flags', 'mechFlags', 'sprite', 'events', 'ch', 'fg', 'bg'], this, config);
    if (this.priority < 0) {
      this.priority = 50;
    }
    this.layer = TileLayer$3[this.layer] || this.layer;
    this.flags = Tile.toFlag(this.flags, config.flags);
    this.mechFlags = TileMech.toFlag(this.mechFlags, config.mechFlags || config.flags);

    if (config.sprite || (config.ch || config.fg || config.bg)) {
      this.sprite = make.sprite(config.sprite || config);
    }
    if (base.events) {
      Object.assign(this.events, base.events);
    }
    if (config.events) {
      Object.entries(config.events).forEach( ([key,info]) => {
        if (info) {
          this.events[key] = make.tileEvent(info);
        }
        else {
          delete this.events[key];
        }
      });
    }
  }

  /**
   * Returns the flags for the tile after the given event is fired.
   * @param {String} event - Name of the event to fire.
   * @returns {Number} The flags from the Tile after the event.
   */
  successorFlags(event) {
    const e = this.events[event];
    if (!e) return 0;
    const feature = e.feature;
    if (!feature) return 0;
    // const tile = FEATURES[feature].tile;
    // if (!tile) return 0;
    // return tiles[tile].flags;
  }

  /**
   * Returns whether or not this tile as the given flag.
   * Will return true if any bit in the flag is true, so testing with
   * multiple flags will return true if any of them is set.
   * @param {Number} flag - The flag to check
   * @returns {Boolean} Whether or not the flag is set
   */
  hasFlag(flag) {
    return (this.flags & flag) > 0;
  }

  hasFlags(flags, mechFlags) {
    return (!flags || (this.flags & flags)) && (!mechFlags || (this.mechFlags & mechFlags));
  }

  hasMechFlag(flag) {
    return (this.mechFlags & flag) > 0;
  }

  hasEvent(name) {
    return !!this.events[name];
  }

  getName(opts={}) {
    if (opts === true) { opts = { article: true }; }
    if (opts === false) { opts = {}; }
    if (typeof opts === 'string') { opts = { article: opts }; }

    if (!opts.article && !opts.color) return this.name;

    let result = this.name;
    if (opts.color) {
      let color = this.sprite.fg;
      if (opts.color instanceof types.Color) {
        color = opts.color;
      }
      result = `Ω${color}Ω${this.name}∆`;
    }

    if (opts.article && this.article) {
      let article = (opts.article === true) ? this.article : opts.article;
      result = article + ' ' + result;
    }
    return result;
  }
  getDescription(opts={}) { return this.getName(opts); }

  getFlavor() { return this.flavor || this.getName(true); }


  async applyInstantEffects(map, x, y, cell) {

    const actor = cell.actor;
    const isPlayer = actor ? actor.isPlayer() : false;

    if (this.flags & Tile.T_LAVA && actor) {
      if (!cell.hasTileFlag(Tile.T_BRIDGE) && !actor.status.levitating) {
        actor.kill();
        await gameOver(false, 'ΩredΩyou fall into lava and perish.');
        return true;
      }
    }

    return false;
  }

}

types.Tile = Tile$1;

/**
 * GW.tile
 * @module tile
 */


/**
 * Adds a new Tile into the GW.tiles collection.
 * @param {String} id - The identifier for this Tile
 * @param {Object} [base] - The base tile from which to extend
 * @param {Object} config - The tile parameters
 * @returns {Tile} The newly created tile
 */
function addTileKind(id, base, config) {
  if (arguments.length == 1) {
    config = args[0];
    base = config.Extends || config.extends || {};
    id = config.id || config.name;
  }
  else if (arguments.length == 2) {
    config = base;
    base = config.Extends || config.extends || {};
  }

  if (typeof base === 'string') {
    base = tiles[base] || ERROR('Unknown base tile: ' + base);
  }

  config.name = config.name || id.toLowerCase();
  config.id = id;
  const tile = new types.Tile(config, base);
  tiles[id] = tile;
  return tile;
}

tile.addKind = addTileKind;

/**
 * Adds multiple tiles to the GW.tiles collection.
 * It extracts all the id:opts pairs from the config object and uses
 * them to call addTileKind.
 * @param {Object} config - The tiles to add in [id, opts] pairs
 * @returns {void} Nothing
 * @see addTileKind
 */
function addTileKinds(config={}) {
  Object.entries(config).forEach( ([name, opts]) => {
    tile.addKind(name, opts);
  });
}

tile.addKinds = addTileKinds;

const DIRS$3 = def.dirs;

var dungeon = {};

dungeon.debug = NOOP;

const NOTHING = 0;
let FLOOR = 'FLOOR';
let DOOR = 'DOOR';
let BRIDGE = 'BRIDGE';
let UP_STAIRS = 'UP_STAIRS';
let DOWN_STAIRS = 'DOWN_STAIRS';
let WALL = 'WALL';
let LAKE = 'LAKE';


let SITE = null;
let LOCS;


function start$1(map, opts={}) {

  LOCS = random.sequence(map.width * map.height);

  const startX = opts.x || -1;
  const startY = opts.y || -1;
  if (startX > 0) {
    map.locations.start = [startX, startY];
  }

  SITE = map;
}

dungeon.start = start$1;


function finish() {
  removeDiagonalOpenings();
  finishWalls();
  finishDoors();
}

dungeon.finish = finish;


// Returns an array of door sites if successful
function digRoom(opts={}) {
  const hallChance = firstOpt('hallChance', opts, SITE.config, 0);
  const diggerId = opts.digger || opts.id || 'SMALL'; // TODO - get random id

  const digger$1 = diggers[diggerId];
  if (!digger$1) {
    throw new Error('Failed to find digger: ' + diggerId);
  }

  const config = Object.assign({}, digger$1, opts);
  let locs = opts.locs || opts.loc || null;
  if (!Array.isArray(locs)) {
    locs = null;
  }
  else if (locs && locs.length && locs.length == 2 && typeof locs[0] == 'number') {
    locs = [locs];
  }
  else if (locs.length == 0) {
    locs = null;
  }

  const grid$1 = alloc(SITE.width, SITE.height);

  let result = false;
  let tries = opts.tries || 10;
  while(--tries >= 0 && !result) {
    grid$1.fill(NOTHING);

    const id = digger$1.fn(config, grid$1);
    dungeon.debug('Dig room:', id);
    const doors = digger.chooseRandomDoorSites(grid$1);
    if (random.chance(hallChance)) {
      digger.attachHallway(grid$1, doors, SITE.config);
    }

    if (locs) {
      // try the doors first
      result = attachRoomAtDoors(grid$1, doors, locs, opts);
      if (!result) {
        // otherwise try everywhere
        for(let i = 0; i < locs.length && !result; ++i) {
          if (locs[i][0] > 0) {
            result = attachRoomAtXY(grid$1, locs[i], doors, opts);
          }
        }
      }
    }
    else {
      result = attachRoomToDungeon(grid$1, doors, opts);
    }

  }

  free(grid$1);
  return result;
}

dungeon.digRoom = digRoom;



function roomAttachesAt(roomGrid, roomToSiteX, roomToSiteY) {
    let xRoom, yRoom, xSite, ySite, i, j;

    for (xRoom = 0; xRoom < roomGrid.width; xRoom++) {
        for (yRoom = 0; yRoom < roomGrid.height; yRoom++) {
            if (roomGrid[xRoom][yRoom]) {
                xSite = xRoom + roomToSiteX;
                ySite = yRoom + roomToSiteY;

                for (i = xSite - 1; i <= xSite + 1; i++) {
                    for (j = ySite - 1; j <= ySite + 1; j++) {
                        if (!SITE.hasXY(i, j)
                            || SITE.isBoundaryXY(i, j)
                            || !SITE.cell(i, j).isNull())
                        {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}




function attachRoomToDungeon(roomGrid, doorSites, opts={}) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (!SITE.cell(x, y).isNull()) continue;
      const dir = directionOfDoorSite(SITE.cells, x, y, (c) => (c.hasTile(FLOOR) && !c.isLiquid()) );
      if (dir != def.NO_DIRECTION) {
        const oppDir = (dir + 2) % 4;

        const offsetX = x - doorSites[oppDir][0];
        const offsetY = y - doorSites[oppDir][1];

        if (doorSites[oppDir][0] != -1
            && roomAttachesAt(roomGrid, offsetX, offsetY))
        {
          dungeon.debug("- attachRoom: ", x, y, oppDir);

          // Room fits here.
          offsetZip(SITE.cells, roomGrid, offsetX, offsetY, (d, s, i, j) => SITE.setTile(i, j, opts.tile || FLOOR) );
          if (opts.door || (opts.placeDoor !== false)) {
            SITE.setTile(x, y, opts.door || DOOR); // Door site.
          }
          doorSites[oppDir][0] = -1;
          doorSites[oppDir][1] = -1;
          for(let i = 0; i < doorSites.length; ++i) {
            if (doorSites[i][0] > 0) {
              doorSites[i][0] += offsetX;
              doorSites[i][1] += offsetY;
            }
          }
          return doorSites;
        }
      }
  }

  return false;
}


function attachRoomAtXY(roomGrid, xy, doors, opts={}) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (roomGrid[x][y]) continue;

      const dir = directionOfDoorSite(roomGrid, x, y);
      if (dir != def.NO_DIRECTION) {
        const d = DIRS$3[dir];
        if (roomAttachesAt(roomGrid, xy[0] - x, xy[1] - y)) {
          offsetZip(SITE.cells, roomGrid, xy[0] - x, xy[1] - y, (d, s, i, j) => SITE.setTile(i, j, opts.tile || FLOOR) );
          if (opts.door || (opts.placeDoor !== false)) {
            SITE.setTile(xy[0], xy[1], opts.door || DOOR); // Door site.
          }
          doors[dir][0] = -1;
          doors[dir][1] = -1;
          for(let i = 0; i < doors.length; ++i) {
            if (doors[i][0] > 0) {
              doors[i][0] += xy[0] - x;
              doors[i][1] += xy[1] - y;
            }
          }
          return doors;
        }
      }
  }

  return false;
}



function insertRoomAtXY(x, y, roomGrid, doorSites, opts={}) {

  const dirs = random.sequence(4);

  for(let dir of dirs) {
    const oppDir = (dir + 2) % 4;

    if (doorSites[oppDir][0] != -1
        && roomAttachesAt(roomGrid, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
    {
      // dungeon.debug("attachRoom: ", x, y, oppDir);

      // Room fits here.
      const offX = x - doorSites[oppDir][0];
      const offY = y - doorSites[oppDir][1];
      offsetZip(SITE.cells, roomGrid, offX, offY, (d, s, i, j) => SITE.setTile(i, j, opts.tile || FLOOR) );
      if (opts.door || (opts.placeDoor !== false)) {
        SITE.setTile(x, y, opts.door || DOOR); // Door site.
      }
      const newDoors = doorSites.map( (site) => {
        const x0 = site[0] + offX;
        const y0 = site[1] + offY;
        if (x0 == x && y0 == y) return [-1,-1];
        return [x0,y0];
      });
      return newDoors;
    }
  }
  return false;
}


function attachRoomAtDoors(roomGrid, roomDoors, siteDoors, opts={}) {

  const doorIndexes = random.sequence(siteDoors.length);

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < doorIndexes.length; i++) {
    const index = doorIndexes[i];
    const x = siteDoors[index][0];
    const y = siteDoors[index][1];

    const doors = insertRoomAtXY(x, y, roomGrid, roomDoors, opts);
    if (doors) return doors;
  }

  return false;
}


function digLake(opts={}) {
  let i, j, k;
  let x, y;
  let lakeMaxHeight, lakeMaxWidth, lakeMinSize, tries, maxCount, canDisrupt;
  let count = 0;

  lakeMaxHeight = opts.height || 15;
  lakeMaxWidth = opts.width || 30;
  lakeMinSize = opts.minSize || 5;
  tries = opts.tries || 20;
  maxCount = 1; // opts.count || tries;
  canDisrupt = opts.canDisrupt || false;

  const lakeGrid = alloc(SITE.width, SITE.height, 0);

  for (; lakeMaxHeight >= lakeMinSize && lakeMaxWidth >= lakeMinSize && count < maxCount; lakeMaxHeight--, lakeMaxWidth -= 2) { // lake generations

    lakeGrid.fill(NOTHING);
    const bounds = fillBlob(lakeGrid, 5, 4, 4, lakeMaxWidth, lakeMaxHeight, 55, "ffffftttt", "ffffttttt");

    for (k=0; k < tries && count < maxCount; k++) { // placement attempts
        // propose a position for the top-left of the lakeGrid in the dungeon
        x = random.range(1 - bounds.x, lakeGrid.width - bounds.width - bounds.x - 2);
        y = random.range(1 - bounds.y, lakeGrid.height - bounds.height - bounds.y - 2);

      if (canDisrupt || !lakeDisruptsPassability(lakeGrid, -x, -y)) { // level with lake is completely connected
        dungeon.debug("Placed a lake!", x, y);

        ++count;
        // copy in lake
        for (i = 0; i < bounds.width; i++) {  // skip boundary
          for (j = 0; j < bounds.height; j++) { // skip boundary
            if (lakeGrid[i + bounds.x][j + bounds.y]) {
              const sx = i + bounds.x + x;
              const sy = j + bounds.y + y;
              SITE.setTile(sx, sy, opts.tile || LAKE);
            }
          }
        }
        break;
      }
    }
  }
  free(lakeGrid);
  return count;

}

dungeon.digLake = digLake;


function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {
  return SITE.gridDisruptsPassability(lakeGrid, { gridOffsetX: dungeonToGridX, gridOffsetY: dungeonToGridY });
}



// Add some loops to the otherwise simply connected network of rooms.
function addLoops(minimumPathingDistance, maxConnectionLength) {
    let startX, startY, endX, endY;
    let i, j, d, x, y;

    minimumPathingDistance = minimumPathingDistance || Math.floor(Math.min(SITE.width,SITE.height)/2);
    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.cells;
    const pathGrid = alloc(SITE.width, SITE.height);
    const costGrid = alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillCostGrid(costGrid);

    function isValidTunnelStart(x, y, dir) {
      if (!SITE.hasXY(x, y)) return false;
      if (!SITE.hasXY(x + dir[1], y + dir[0])) return false;
      if (!SITE.hasXY(x - dir[1], y - dir[0])) return false;
      if (!SITE.cell(x, y).isNull()) return false;
      if (!SITE.cell(x + dir[1], y + dir[0]).isNull()) return false;
      if (!SITE.cell(x - dir[1], y - dir[0]).isNull()) return false;
      return true;
    }

    function isValidTunnelEnd(x, y, dir) {
      if (!SITE.hasXY(x, y)) return false;
      if (!SITE.hasXY(x + dir[1], y + dir[0])) return false;
      if (!SITE.hasXY(x - dir[1], y - dir[0])) return false;
      if (!SITE.cell(x, y).isNull()) return true;
      if (!SITE.cell(x + dir[1], y + dir[0]).isNull()) return true;
      if (!SITE.cell(x - dir[1], y - dir[0]).isNull()) return true;
      return false;
    }

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        const cell = siteGrid[x][y];
        if (cell.isNull()) {
            for (d=0; d <= 1; d++) { // Try a horizontal door, and then a vertical door.
                let dir = dirCoords[d];
                if (!isValidTunnelStart(x, y, dir)) continue;
                j = maxConnectionLength;

                // check up/left
                if (SITE.hasXY(x + dir[0], y + dir[1]) && SITE.cell(x + dir[0], y + dir[1]).hasTile(FLOOR)) {
                  // just can't build directly into a door
                  if (!SITE.hasXY(x - dir[0], y - dir[1]) || SITE.cell(x - dir[0], y - dir[1]).hasTile(DOOR)) {
                    continue;
                  }
                }
                else if (SITE.hasXY(x - dir[0], y - dir[1]) && SITE.cell(x - dir[0], y - dir[1]).hasTile(FLOOR)) {
                  if (!SITE.hasXY(x + dir[0], y + dir[1]) || SITE.cell(x + dir[0], y + dir[1]).hasTile(DOOR)) {
                    continue;
                  }
                  dir = dir.map( (v) => -1*v );
                }
                else {
                  continue; // not valid start for tunnel
                }

                startX = x + dir[0];
                startY = y + dir[1];
                endX = x;
                endY = y;

                for(j = 0; j < maxConnectionLength; ++j) {
                  endX -= dir[0];
                  endY -= dir[1];

                  // if (SITE.hasXY(endX, endY) && !SITE.cell(endX, endY).isNull()) {
                  if (isValidTunnelEnd(endX, endY, dir)) {
                    break;
                  }
                }

                if (j < maxConnectionLength) {
                  calculateDistances(pathGrid, startX, startY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[startX][startY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[endX][endY] > minimumPathingDistance && pathGrid[endX][endY] < 30000) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      dungeon.debug('Adding Loop', startX, startY, ' => ', endX, endY, ' : ', pathGrid[endX][endY]);

                      while(endX !== startX || endY !== startY) {
                        if (SITE.cell(endX, endY).isNull()) {
                          SITE.setTile(endX, endY, FLOOR);
                          costGrid[endX][endY] = 1;          // (Cost map also needs updating.)
                        }
                        endX += dir[0];
                        endY += dir[1];
                      }
                      SITE.setTile(x, y, DOOR);             // then turn the tile into a doorway.
                      break;
                  }
                }
            }
        }
    }
    free(pathGrid);
    free(costGrid);
}

dungeon.addLoops = addLoops;


function isBridgeCandidate(x, y, bridgeDir) {
  if (SITE.hasTile(x, y, BRIDGE)) return true;
  if (!SITE.isLiquid(x, y)) return false;
  if (!SITE.isLiquid(x + bridgeDir[1], y + bridgeDir[0])) return false;
  if (!SITE.isLiquid(x - bridgeDir[1], y - bridgeDir[0])) return false;
  return true;
}

// Add some loops to the otherwise simply connected network of rooms.
function addBridges(minimumPathingDistance, maxConnectionLength) {
    let newX, newY;
    let i, j, d, x, y;

    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.cells;
    const pathGrid = alloc(SITE.width, SITE.height);
    const costGrid = alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillCostGrid(costGrid);

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        if (SITE.hasXY(x, y) && (!SITE.isNull(x, y)) && SITE.canBePassed(x, y)) {
            for (d=0; d <= 1; d++) { // Try right, then down
                const bridgeDir = dirCoords[d];
                newX = x + bridgeDir[0];
                newY = y + bridgeDir[1];
                j = maxConnectionLength;

                if (!SITE.hasXY(newX, newY)) continue;

                // check for line of lake tiles
                // if (isBridgeCandidate(newX, newY, bridgeDir)) {
                if (SITE.isLiquid(newX, newY)) {
                  for(j = 0; j < maxConnectionLength; ++j) {
                    newX += bridgeDir[0];
                    newY += bridgeDir[1];

                    // if (!isBridgeCandidate(newX, newY, bridgeDir)) {
                    if (!SITE.isLiquid(newX, newY)) {
                      break;
                    }
                  }
                }

                if ((!SITE.isNull(newX, newY)) && SITE.canBePassed(newX, newY) && (j < maxConnectionLength)) {
                  calculateDistances(pathGrid, newX, newY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[newX][newY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[x][y] > minimumPathingDistance && pathGrid[x][y] < def.PDS_NO_PATH) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      dungeon.debug('Adding Bridge', x, y, ' => ', newX, newY);

                      while(x !== newX || y !== newY) {
                        if (isBridgeCandidate(x, y, bridgeDir)) {
                          SITE.setTile(x, y, BRIDGE);
                          costGrid[x][y] = 1;          // (Cost map also needs updating.)
                        }
                        else {
                          SITE.setTile(x, y, FLOOR);
                          costGrid[x][y] = 1;
                        }
                        x += bridgeDir[0];
                        y += bridgeDir[1];
                      }
                      break;
                  }
                }
            }
        }
    }
    free(pathGrid);
    free(costGrid);
}

dungeon.addBridges = addBridges;



function removeDiagonalOpenings() {
  let i, j, k, x1, y1;
  let diagonalCornerRemoved;

	do {
		diagonalCornerRemoved = false;
		for (i=0; i<SITE.width-1; i++) {
			for (j=0; j<SITE.height-1; j++) {
				for (k=0; k<=1; k++) {
					if ((SITE.canBePassed(i + k, j))
						&& (!SITE.canBePassed(i + (1-k), j))
						&& (SITE.isObstruction(i + (1-k), j))
						&& (!SITE.canBePassed(i + k, j+1))
						&& (SITE.isObstruction(i + k, j+1))
						&& (SITE.canBePassed(i + (1-k), j+1)))
          {
						if (random.chance(50)) {
							x1 = i + (1-k);
							y1 = j;
						} else {
							x1 = i + k;
							y1 = j + 1;
						}
            diagonalCornerRemoved = true;
            SITE.setTile(x1, y1, FLOOR);
            dungeon.debug('Removed diagonal opening', x1, y1);
					}
				}
			}
		}
	} while (diagonalCornerRemoved == true);
}

dungeon.removeDiagonalOpenings = removeDiagonalOpenings;


function finishDoors(map) {
  map = map || SITE;
  let i, j;

	for (i=1; i<map.width-1; i++) {
		for (j=1; j<map.height-1; j++) {
			if (map.isDoor(i, j))
			{
				if ((map.canBePassed(i+1, j) || map.canBePassed(i-1, j))
					&& (map.canBePassed(i, j+1) || map.canBePassed(i, j-1)))
        {
					// If there's passable terrain to the left or right, and there's passable terrain
					// above or below, then the door is orphaned and must be removed.
					map.setTile(i, j, FLOOR);
          dungeon.debug('Removed orphan door', i, j);
				} else if ((map.blocksPathing(i+1, j) ? 1 : 0)
						   + (map.blocksPathing(i-1, j) ? 1 : 0)
						   + (map.blocksPathing(i, j+1) ? 1 : 0)
						   + (map.blocksPathing(i, j-1) ? 1 : 0) >= 3)
        {
					// If the door has three or more pathing blocker neighbors in the four cardinal directions,
					// then the door is orphaned and must be removed.
          map.setTile(i, j, FLOOR);
          dungeon.debug('Removed blocked door', i, j);
				}
			}
		}
	}
}

dungeon.finishDoors = finishDoors;

function finishWalls(map) {
  map = map || SITE;
  map.forEach( (cell, i, j) => {
    if (cell.isNull()) {
      map.setTile(i, j, WALL);
    }
  });
}

dungeon.finishWalls = finishWalls;



function isValidStairLoc(c, x, y, map) {
  map = map || SITE;
  let count = 0;
  if (!(c.isNull() || c.isWall())) return false;

  for(let i = 0; i < 4; ++i) {
    const dir = def.dirs[i];
    if (!map.hasXY(x + dir[0], y + dir[1])) return false;
    if (!map.hasXY(x - dir[0], y - dir[1])) return false;
    const cell = map.cell(x + dir[0], y + dir[1]);
    if (cell.hasTile(FLOOR)) {
      count += 1;
      const va = map.cell(x - dir[0] + dir[1], y - dir[1] + dir[0]);
      if (!(va.isNull() || va.isWall())) return false;
      const vb = map.cell(x - dir[0] - dir[1], y - dir[1] - dir[0]);
      if (!(vb.isNull() || vb.isWall())) return false;
    }
    else if (!(cell.isNull() || cell.isWall())) {
      return false;
    }
  }
  return count == 1;
}

dungeon.isValidStairLoc = isValidStairLoc;


function setupStairs(map, x, y, tile) {

	const indexes = random.sequence(4);

	let dir;
	for(let i = 0; i < indexes.length; ++i) {
		dir = def.dirs[i];
		const x0 = x + dir[0];
		const y0 = y + dir[1];
		const cell = map.cell(x0, y0);
		if (cell.hasTile(FLOOR) && cell.isEmpty()) {
			const oppCell = map.cell(x - dir[0], y - dir[1]);
			if (oppCell.isNull() || oppCell.isWall()) break;
		}

		dir = null;
	}

	if (!dir) ERROR('No stair direction found!');

	map.setTile(x, y, tile);

	const dirIndex = def.clockDirs.findIndex( (d) => d[0] == dir[0] && d[1] == dir[1] );

	for(let i = 0; i < def.clockDirs.length; ++i) {
		const l = i ? i - 1 : 7;
		const r = (i + 1) % 8;
		if (i == dirIndex || l == dirIndex || r == dirIndex ) continue;
		const d = def.clockDirs[i];
		map.setTile(x + d[0], y + d[1], WALL);
    map.setCellFlags(x + d[0], y + d[1], Cell.IMPREGNABLE);
	}

	dungeon.debug('setup stairs', x, y, tile);
	return true;
}

dungeon.setupStairs = setupStairs;


function addStairs(opts = {}) {

  const map = opts.map || SITE;
  let needUp = (opts.up !== false);
  let needDown = (opts.down !== false);
  const minDistance = opts.minDistance || Math.floor(Math.max(map.width,map.height)/2);
  const isValidStairLoc = opts.isValid || dungeon.isValidStairLoc;
  const setupFn = opts.setup || dungeon.setupStairs;

  let upLoc = Array.isArray(opts.up) ? opts.up : null;
  let downLoc = Array.isArray(opts.down) ? opts.down : null;

  if (opts.start && typeof opts.start !== 'string') {
    let start = opts.start;
    if (start === true) {
      start = map.randomMatchingXY( isValidStairLoc );
    }
    else {
      start = map.matchingXYNear(x(start), y(start), isValidStairLoc);
    }
    map.locations.start = start;
  }

  if (upLoc && downLoc) {
    upLoc = map.matchingXYNear(x(upLoc), y(upLoc), isValidStairLoc);
    downLoc = map.matchingXYNear(x(downLoc), y(downLoc), isValidStairLoc);
  }
  else if (upLoc && !downLoc) {
    upLoc = map.matchingXYNear(x(upLoc), y(upLoc), isValidStairLoc);
    if (needDown) {
      downLoc = map.randomMatchingXY( (v, x, y) => {
    		if (distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
    		return isValidStairLoc(v, x, y, map);
    	});
    }
  }
  else if (downLoc && !upLoc) {
    downLoc = map.matchingXYNear(x(downLoc), y(downLoc), isValidStairLoc);
    if (needUp) {
      upLoc = map.randomMatchingXY( (v, x, y) => {
    		if (distanceBetween(x, y, downLoc[0], downLoc[1]) < minDistance) return false;
    		return isValidStairLoc(v, x, y, map);
    	});
    }
  }
  else if (needUp) {
    upLoc = map.randomMatchingXY( isValidStairLoc );
    if (needDown) {
      downLoc = map.randomMatchingXY( (v, x, y) => {
    		if (distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
    		return isValidStairLoc(v, x, y, map);
    	});
    }
  }
  else if (needDown) {
    downLoc = map.randomMatchingXY( isValidStairLoc );
  }

  if (upLoc) {
    map.locations.up = upLoc.slice();
    setupFn(map, upLoc[0], upLoc[1], opts.upTile || UP_STAIRS);
    if (opts.start === 'up') map.locations.start = map.locations.up;
  }
  if (downLoc) {
    map.locations.down = downLoc.slice();
    setupFn(map, downLoc[0], downLoc[1], opts.downTile || DOWN_STAIRS);
    if (opts.start === 'down') map.locations.start = map.locations.down;
  }

  return !!(upLoc || downLoc);
}

dungeon.addStairs = addStairs;

var fov = {};

fov.debug = NOOP;

// strategy =
// {
//    isBlocked(x, y)
//    calcRadius(x, y)
//    setVisible(x, y, v)
//    hasXY(x, y)
// }
class FOV {
  constructor(strategy) {
    this.isBlocked = strategy.isBlocked;
    this.calcRadius = strategy.calcRadius || calcRadius;
    this.setVisible = strategy.setVisible;
    this.hasXY = strategy.hasXY || TRUE;
  }

  calculate(x, y, maxRadius) {
    this.setVisible(x, y, 1);
    this.startX = x;
    this.startY = y;
    this.maxRadius = maxRadius + 1;

    // uses the diagonals
    for (let i = 4; i < 8; ++i) {
      const d = def.dirs[i];
      this.castLight(1, 1.0, 0.0, 0, d[0], d[1], 0);
      this.castLight(1, 1.0, 0.0, d[0], 0, 0, d[1]);
    }

  }

  // NOTE: slope starts a 1 and ends at 0.
  castLight(row, startSlope, endSlope, xx, xy, yx, yy) {
      if (row >= this.maxRadius) {
        // fov.debug('CAST: row=%d, start=%d, end=%d, row >= maxRadius => cancel', row, startSlope.toFixed(2), endSlope.toFixed(2));
        return;
      }
      if (startSlope < endSlope) {
        // fov.debug('CAST: row=%d, start=%d, end=%d, start < end => cancel', row, startSlope.toFixed(2), endSlope.toFixed(2));
        return;
      }
      // fov.debug('CAST: row=%d, start=%d, end=%d, x=%d,%d, y=%d,%d', row, startSlope.toFixed(2), endSlope.toFixed(2), xx, xy, yx, yy);

      let nextStart = startSlope;

      let blocked = false;
      let deltaY = -row;
      let currentX, currentY, outerSlope, innerSlope, maxSlope, minSlope = 0;

      for (let deltaX = -row; deltaX <= 0; deltaX++) {
          currentX = Math.floor(this.startX + deltaX * xx + deltaY * xy);
          currentY = Math.floor(this.startY + deltaX * yx + deltaY * yy);
          outerSlope = (deltaX - 0.5) / (deltaY + 0.5);
          innerSlope = (deltaX + 0.5) / (deltaY - 0.5);
          maxSlope = ((deltaX) / (deltaY + 0.5));
          minSlope = ((deltaX + 0.5) / (deltaY));

          if (!this.hasXY(currentX, currentY)) {
            blocked = true;
            // nextStart = innerSlope;
            continue;
          }

          // fov.debug('- test %d,%d ... start=%d, min=%d, max=%d, end=%d, dx=%d, dy=%d', currentX, currentY, startSlope.toFixed(2), maxSlope.toFixed(2), minSlope.toFixed(2), endSlope.toFixed(2), deltaX, deltaY);

          if (startSlope < minSlope) {
              blocked = this.isBlocked(currentX, currentY);
              continue;
          } else if (endSlope > maxSlope) {
              break;
          }

          //check if it's within the lightable area and light if needed
          const radius = this.calcRadius(deltaX, deltaY);
          if (radius < this.maxRadius) {
              const bright = (1 - (radius / this.maxRadius));
              this.setVisible(currentX, currentY, bright);
              // fov.debug('       - visible');
          }

          if (blocked) { //previous cell was a blocking one
              if (this.isBlocked(currentX,currentY)) {//hit a wall
                  // fov.debug('       - blocked ... nextStart: %d', innerSlope.toFixed(2));
                  nextStart = innerSlope;
                  continue;
              } else {
                  blocked = false;
              }
          } else {
              if (this.isBlocked(currentX, currentY) && row < this.maxRadius) {//hit a wall within sight line
                  // fov.debug('       - blocked ... start:%d, end:%d, nextStart: %d', nextStart.toFixed(2), outerSlope.toFixed(2), innerSlope.toFixed(2));
                  blocked = true;
                  this.castLight(row + 1, nextStart, outerSlope, xx, xy, yx, yy);
                  nextStart = innerSlope;
              }
          }
      }

      if (!blocked) {
        this.castLight(row + 1, nextStart, endSlope, xx, xy, yx, yy);
      }
  }
}

types.FOV = FOV;

async function applyDamage(attacker, defender, attackInfo, ctx) {
  ctx.damage = attackInfo.damage || ctx.damage || attacker.calcDamageTo(defender, attackInfo, ctx);
  const map = ctx.map || data.map;

  ctx.damage = defender.kind.applyDamage(defender, ctx.damage, attacker, ctx);

  let msg = firstOpt('msg', attackInfo, ctx, true);
  if (msg) {
    if (typeof msg !== 'string') {
      let verb = attackInfo.verb || 'hit';
      message.addCombat('§attacker§ §verb attacker§ §the defender§ for ΩredΩ§damage§∆ damage', { attacker, verb, defender, damage: Math.round(ctx.damage) });
    }
    else {
      message.addCombat(msg);
    }
  }

  const ctx2 = { map, x: defender.x, y: defender.y, volume: ctx.damage };

  if (map) {
    let hit$1 = firstOpt('fx', attackInfo, ctx, false);
    if (hit$1) {
      await hit(map, defender);
    }
    if (defender.kind.blood) {
      await spawn(defender.kind.blood, ctx2);
    }
  }
  if (defender.isDead()) {
    defender.kill();
    if (map) {
      map.removeActor(defender);
      if (defender.kind.corpse) {
        await spawn(defender.kind.corpse, ctx2);
      }
      if (defender.pack && !defender.isPlayer()) {
        eachChain(defender.pack, (item) => {
          map.addItemNear(defender.x, defender.y, item);
        });
      }
    }

    if (defender.isDead() && (msg !== false)) {
      message.addCombat('ΩredΩ§action§∆ §it defender§', { action: defender.isInanimate() ? 'destroying' : 'killing', defender });
    }
  }
  return ctx.damage;
}

var combat$1 = {
  __proto__: null,
  applyDamage: applyDamage
};

async function grab(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  if (actor.grabbed) {
    message.add('§you§ §let§ go of §a item§.', { actor, item: actor.grabbed });
    await flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
    actor.grabbed = null;
    actor.endTurn();
    return true;
  }

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(Action.A_GRABBABLE)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    message.add('Nothing to grab.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Grab what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await actions.grab(actor, choice, { map, x: choice.x, y: choice.y })) {
    return false;
  }
  return true;
}

commands$1.grab = grab;

config.autoPickup = true;


async function movePlayer(e) {
  const actor = e.actor || data.player;
  const dir = e.dir;
  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = data.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };
  const isPlayer = actor.isPlayer();

  commands$1.debug('movePlayer');

  const r = await actions.moveDir(actor, dir, ctx);
  return r;
}

commands$1.movePlayer = movePlayer;

async function bash(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(Action.A_BASH)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    message.add('Nothing to bash.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Bash what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await actions.bashItem(actor, choice, { map, actor, x: choice.x, y: choice.y, item: choice })) {
    return false;
  }
  if (!actor.turnEnded()) {
    actor.endTurn();
  }
  return true;
}

commands$1.bash = bash;

async function open(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  console.log('open');

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    if (c.item && c.item.hasActionFlag(Action.A_OPEN)) {
      candidates.push({ item: c.item, cell: c, x: i, y: j, map, actor });
    }
    else if (c.hasTileWithEvent('open')) {
      candidates.push({ cell: c, x: i, y: j, map, actor });
    }
  }, true);
  console.log('- candidates:', candidates.length);
  if (!candidates.length) {
    message.add('Nothing to open.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Open what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (choice.item) {
    if (!await actions.openItem(actor, choice, choice)) {
      return false;
    }
  }
  else {
    console.log('fire event');
    await choice.cell.fireEvent('open', choice);
    actor.endTurn();
  }
  return true;
}

commands$1.open = open;

async function close(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  console.log('close');

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    if (c.item && c.item.hasActionFlag(Action.A_CLOSE)) {
      candidates.push({ item: c.item, cell: c, x: i, y: j, map, actor });
    }
    else {
      if (c.hasTileWithEvent('close')) {
        candidates.push({ cell: c, x: i, y: j, map, actor });
      }
    }
  }, true);
  if (!candidates.length) {
    message.add('Nothing to close.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Close what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (choice.item) {
    if (!await actions.closeItem(actor, choice, choice)) {
      return false;
    }
  }
  else {
    await choice.cell.fireEvent('close', choice);
    actor.endTurn();
  }
  return true;
}

commands$1.close = close;

async function fire(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  const item = actor.slots.ranged;

  if (!item) {
    message.add('§you§ §have§ nothing to ΩorangeΩfire∆.', { actor });
    return false;
  }

  const range = item.stats.range || 0;

  const candidates = [];
  let choice;
  eachChain(map.actors, (target) => {
    if (actor === target) return;
    if (distanceFromTo(actor, target) <= range) {
      if (!actor.kind.willAttack(actor, target)) return;
      if (!actor.canDirectlySee(target, map)) return;
      candidates.push(target);
    }
  });
  if (!candidates.length) {
    message.add('No targets.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    candidates.sort( (a, b) => {
      return distanceFromTo(actor, a) - distanceFromTo(actor, b);
    });
    choice = await ui.chooseTarget(candidates, 'Fire at which target?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await actions.itemAttack(actor, choice, { map, actor, x: choice.x, y: choice.y, item, type: 'ranged' })) {
    return false;
  }
  return true;
}

commands$1.fire = fire;

async function attack(e) {
  const actor = e.actor || data.player;
  const map = data.map;
  const ctx = { map, actor, x: -1, y: -1 };

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    ctx.x = i;
    ctx.y = j;
    if (c.actor && actor.kind.willAttack(actor, c.actor, ctx)) {
      candidates.push(c.actor);
    }
  }, true);

  if (!candidates.length) {
    message.add('Nothing to attack.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Attack where?');
  }
  if (!choice) {
    return false; // cancelled
  }

  ctx.x = choice.x;
  ctx.y = choice.y;
  if (!await actions.attack(actor, choice, ctx)) {
    return false;
  }
  return true;
}

commands$1.attack = attack;

async function push(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(Action.A_PUSH)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    message.add('Nothing to push.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Push what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await actions.push(actor, choice, { map, x: choice.x, y: choice.y })) {
    return false;
  }
  if (!actor.turnEnded()) {
    actor.endTurn();
  }
  return true;
}

commands$1.push = push;

async function talk(e) {
  const actor = e.actor || data.player;
  const map = data.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.actor && c.actor.kind.talk) {
      candidates.push(c.actor);
    }
  }, true);
  if (!candidates.length) {
    message.add('Nobody is listening.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await ui.chooseTarget(candidates, 'Talk to whom?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await actions.talk(actor, choice, { map, actor, x: choice.x, y: choice.y })) {
    return false;
  }
  if (!actor.turnEnded()) {
    actor.endTurn();
  }
  return true;
}

commands$1.talk = talk;

async function travel(e) {
  const actor = e.actor || data.player;
  const newX = e.mapX;
  const newY = e.mapY;
  const map = data.map;

  const ctx = { actor, map, x: newX, y: newY };
  const isPlayer = actor.isPlayer();

  if (!map.hasXY(newX, newY)) return false;

  actor.updateMapToMe();
  actor.travelDest = [newX,newY];

  let r = await actions.travel(actor, ctx);
  return r;
}

commands$1.travel = travel;

commands$1.debug = NOOP;

async function rest(e) {
	data.player.endTurn();
	return true;
}

commands$1.rest = rest;

class ItemKind$1 {
  constructor(opts={}) {
    Object.assign(this, opts);
		this.name = opts.name || 'item';
		this.flavor = opts.flavor || null;
    this.article = (opts.article === undefined) ? 'a' : opts.article;
		this.sprite = make.sprite(opts.sprite || opts);
    this.flags = ItemKind.toFlag(opts.flags);
		this.actionFlags = Action.toFlag(opts.flags);
		this.attackFlags = ItemAttack.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
		this.id = opts.id || null;
    this.slot = opts.slot || null;
    this.projectile = null;
    this.verb = opts.verb || null;
    this.frequency = make.frequency(opts.frequency || this.stats.frequency);

    this.bump = opts.bump || ['pickup'];  // pick me up by default if you bump into me

    if (typeof this.bump === 'string') {
      this.bump = this.bump.split(/[,|]/).map( (t) => t.trim() );
    }
    if (!Array.isArray(this.bump)) {
      this.bump = [this.bump];
    }

    if (opts.projectile) {
      this.projectile = make.sprite(opts.projectile);
    }
    this.corpse = opts.corpse ? make.tileEvent(opts.corpse) : null;

    if (opts.consoleColor === false) {
      this.consoleColor = false;
    }
    else {
      this.consoleColor = opts.consoleColor || true;
      if (typeof this.consoleColor === 'string') {
        this.consoleColor = from(this.consoleColor);
      }
    }

    this.maxStack = opts.maxStack || ((this.flags & ItemKind.IK_STACKABLE) ? 99 : 1);
  }

  forbiddenCellFlags(item) { return Cell.HAS_ITEM; }
  forbiddenTileFlags(item) { return Tile.T_OBSTRUCTS_ITEMS; }
  forbiddenTileMechFlags(item) { return 0; }

  isStackable() { return this.flags & ItemKind.IK_STACKABLE; }
  willStackInto(item, other, quantity) {
    quantity = quantity || item.quantity;
    if (other.kind !== item.kind) return false;
    if (!this.isStackable()) return false;
    // Compare enchants, etc...
    return (other.quantity + quantity <= this.maxStack);
  }

  async applyDamage(item, damage, actor, ctx) {
		if (item.stats.health > 0) {
			const damageDone = Math.min(item.stats.health, damage);
			item.stats.health -= damageDone;
			if (item.stats.health <= 0) {
				item.flags |= Item.ITEM_DESTROYED;
			}
			return damageDone;
		}
		return 0;
	}

  getVerb(verb) {
    if (this.quantity > 1) return toPluralVerb(verb);
    return toSingularVerb(verb);
  }

  getName(item, opts={}) {
    if (opts === true) { opts = { article: true }; }
    if (opts === false) { opts = {}; }
    if (typeof opts === 'string') { opts = { article: opts }; }

    let result = toPluralNoun(item.name || this.name, item.quantity > 1);
    if (opts.color || (this.consoleColor && (opts.color !== false))) {
      let color$1 = this.sprite.fg;
      if (this.consoleColor instanceof types.Color) {
        color$1 = this.consoleColor;
      }
      if (opts.color instanceof types.Color) {
        color$1 = opts.color;
      }
      else if (typeof color$1 === 'string') {
        color$1 = from(color$1);
      }
      if (color$1) {
        result = apply('Ω§color§Ω§result§∆', { color: color$1, result });
      }
    }
    else if (opts.color === false) {
      result = removeColors(result); // In case item has built in color
    }

    if (opts.article) {
      let article = (opts.article === true) ? this.article : opts.article;
      if (article == 'a' && isVowel(firstChar(result))) {
        article = 'an';
      }
      result = article + ' ' + result;
    }
    return result;
  }
}

types.ItemKind = ItemKind$1;

function addItemKind(id, opts={}) {
	opts.id = id;
  let kind;
  if (opts instanceof types.ItemKind) {
    kind = opts;
  }
  else {
    kind = new types.ItemKind(opts);
  }
	itemKinds[id] = kind;
	return kind;
}

item$1.addKind = addItemKind;

function addItemKinds(opts={}) {
  Object.entries(opts).forEach( ([key, config]) => {
    item$1.addKind(key, config);
  });
}

item$1.addKinds = addItemKinds;


class Item$1 {
	constructor(kind, opts={}) {
    // Object.assign(this, opts);
		this.x = -1;
    this.y = -1;
    this.quantity = opts.quantity || 1;
    this.flags = Item.toFlag(opts.flags);
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

  isStackable() {
    return this.kind.flags & ItemKind.IK_STACKABLE;
  }
  willStackInto(other, quantity) {
    return this.kind.willStackInto(this, other, quantity);
  }
  inventoryCount() {
    return (this.kind.flags & ItemKind.IK_STACK_AS_ONE) ? 1 : this.quantity;
  }

  split(quantity=1) {
    if (quantity >= this.quantity) return null;
    const newItem = make.item(this.kind, { quantity, flags: this.flags, stats: this.stats });
    this.quantity -= quantity;
    return newItem;
  }

  async bumpBy(actor, ctx={}) {
    ctx.quiet = true;

    if (this.kind.bump) {
      if (typeof this.kind.bump === 'function') {
        return this.kind.bump(actor, this, ctx);
      }
    }

    const itemActions = this.bump || [];
    const kindActions  = this.kind.bump || [];
    const actions$1 = itemActions.concat(kindActions);

    if (actions$1 && actions$1.length) {
      for(let i = 0; i < actions$1.length; ++i) {
        let fn = actions$1[i];
        if (typeof fn === 'string') {
          fn = actions[fn] || this.kind[fn] || FALSE;
        }

        if (await fn(actor, this, ctx)) {
          ctx.quiet = false;
          return true;
        }
      }
    }

    return false;
  }

  destroy() { this.flags |= (Item.ITEM_DESTROYED | Item.ITEM_CHANGED); }
	isDestroyed() { return this.flags & Item.ITEM_DESTROYED; }
  changed(v) {
    if (v) {
      this.flags |= Item.ITEM_CHANGED;
    }
    else if (v !== undefined) {
      this.flags &= ~(Item.ITEM_CHANGED);
    }
    return (this.flags & Item.ITEM_CHANGED);
  }

	getFlavor() { return this.kind.flavor || this.kind.getName(this, true); }
  getName(opts={}) {
    return this.kind.getName(this, opts);
  }

  toString() {
    return this.getName(false);
  }
}

types.Item = Item$1;

function makeItem(kind, opts) {
	if (typeof kind === 'string') {
		const name = kind;
		kind = itemKinds[name];
		if (!kind) {
      WARN('Unknown Item Kind: ' + name);
      return null;
    }
	}
	const item = new types.Item(kind, opts);
  return item;
}

make.item = makeItem;




function chooseKinds$1(opts={}) {
  opts.danger = opts.danger || 1;
  if (opts.kinds) {
    return opts.kinds.map( (a) => {
      if (typeof a === 'string') return itemKinds[a];
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
    WARN('Tried to place 0 actors.');
    return [];
  }

  let choices = opts.choices;
  // TODO - allow ['THING'] and { THING: 20 }
  if (!choices) {
    let matchKindFn = opts.matchKindFn || TRUE;
    choices = Object.values(itemKinds).filter(matchKindFn);
  }

  let frequencies;
  if (Array.isArray(choices)) {
    choices = choices.map( (v) => {
      if (typeof v === 'string') return itemKinds[v];
      return v;
    });
    frequencies = choices.map( (k) => forDanger(k.frequency, opts.danger) );
  }
  else {
    // { THING: 20, OTHER: 10 }
    choices = Object.keys(choices).map( (v) => itemKinds[v] );
    frequencies = Object.values(choices);
  }

  if (!choices.length) {
    WARN('Tried to place actors - 0 qualifying kinds to choose from.');
    return [];
  }

  const kinds = [];
  for(let i = 0; i < count; ++i) {
    const index = random.lottery(frequencies);
    kinds.push(choices[index]);
  }

  return kinds;
}


function generateAndPlace$1(map, opts={}) {
  if (typeof opts === 'number') { opts = { tries: opts }; }
  if (Array.isArray(opts)) { opts = { kinds: opts }; }
  setDefaults(opts, {
    count: 0,
    tries: 0,
    chance: 100,
    outOfBandChance: 0,
    matchKindFn: null,
    allowHallways: false,
    block: 'start',
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

  const kinds = chooseKinds$1(opts);

  const blocked = alloc(map.width, map.height);
  // TODO - allow [x,y] in addition to 'name'
  if (opts.block && map.locations[opts.block]) {
    const loc = map.locations[opts.block];
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
    const item = make.item(kind, makeOpts);

    matchOpts.forbidCellFlags = kind.forbiddenCellFlags(item);
    matchOpts.forbidTileFlags = kind.forbiddenTileFlags(item);
    matchOpts.forbidTileMechFlags = kind.forbiddenTileMechFlags(item);

    const loc = map.randomMatchingXY(matchOpts);
    if (loc && loc[0] > 0) {
      map.addItem(loc[0], loc[1], item);
      ++placed;
    }
  }

  free(blocked);
  return placed;
}

item$1.generateAndPlace = generateAndPlace$1;

var MSG_BOUNDS = null;



function addKind$3(id, msg) {
  messages[id] = msg;
}

message.addKind = addKind$3;

function addKinds$1(config) {
  Object.entries(config).forEach( ([id, msg]) => message.addKind(id, msg) );
}

message.addKinds = addKinds$1;


// messages
const ARCHIVE = [];
const DISPLAYED = [];
const CONFIRMED = [];
var ARCHIVE_LINES = 30;
var CURRENT_ARCHIVE_POS = 0;
var NEEDS_UPDATE = false;
var INTERFACE_OPACITY = 90;
let COMBAT_MESSAGE = null;

function needsRedraw() {
  NEEDS_UPDATE = true;
}

message.needsRedraw = needsRedraw;


function setup(opts) {
  opts.height = opts.height || 1;
  for(let i = 0; i < opts.height; ++i) {
    CONFIRMED[i] = null;
    DISPLAYED[i] = null;
  }

  MSG_BOUNDS = message.bounds = new types.Bounds(opts.x, opts.y, opts.w || opts.width, opts.h || opts.height);
  ARCHIVE_LINES = opts.archive || 0;
  if (!ARCHIVE_LINES) {
    if (ui.canvas) {
      ARCHIVE_LINES = ui.canvas.height;
    }
    else {
      ARCHIVE_LINES = 30;
    }
  }
  for(let i = 0; i < ARCHIVE_LINES; ++i) {
    ARCHIVE[i] = null;
  }

  INTERFACE_OPACITY = opts.opacity || INTERFACE_OPACITY;
}

message.setup = setup;


////////////////////////////////////
// Messages

function add(msg, args) {
  msg = messages[msg] || msg;
  msg = apply(msg, args);
  commitCombatMessage();
  addMessage(msg);
}

message.add = add;


function forPlayer(actor, ...args) {
  if (!actor.isPlayer()) return;
  add(...args);
}

message.forPlayer = forPlayer;

function addCombat(msg, args) {
  msg = messages[msg] || msg;
  msg = apply(msg, args);
  addCombatMessage(msg);
}

message.addCombat = addCombat;

function forceRedraw() {
  NEEDS_UPDATE = true;
}

message.forceRedraw = forceRedraw;


function drawMessages(buffer) {
	let i;
	const tempColor = make.color();
	let messageColor;

  if (!NEEDS_UPDATE || !MSG_BOUNDS) return false;

  commitCombatMessage();

  const isOnTop = (MSG_BOUNDS.y < 10);

	for (i=0; i < MSG_BOUNDS.height; i++) {
		messageColor = tempColor;
		messageColor.copy(colors.white);

		if (CONFIRMED[i]) {
			messageColor.mix(colors.black, 50);
			messageColor.mix(colors.black, 75 * i / (2*MSG_BOUNDS.height));
		}

    const localY = isOnTop ? (MSG_BOUNDS.height - i - 1) : i;
    const y = MSG_BOUNDS.toOuterY(localY);

		eachChar( DISPLAYED[i], (c, color, bg, j) => {
			const x = MSG_BOUNDS.toOuterX(j);

			if (color && (messageColor !== color) && CONFIRMED[i]) {
				color.mix(colors.black, 50);
				color.mix(colors.black, 75 * i / (2*MSG_BOUNDS.height));
			}
			messageColor = color || tempColor;
			buffer.draw(x, y, c, messageColor, colors.black);
		});

		for (let j = length(DISPLAYED[i]); j < MSG_BOUNDS.width; j++) {
			const x = MSG_BOUNDS.toOuterX(j);
			buffer.draw(x, y, ' ', colors.black, colors.black);
		}
	}

  NEEDS_UPDATE = false;
  return true;
}

message.draw = drawMessages;


// function messageWithoutCaps(msg, requireAcknowledgment) {
function addMessageLine(msg) {
	let i;

	if (!length(msg)) {
      return;
  }

	for (i = CONFIRMED.length - 1; i >= 1; i--) {
		CONFIRMED[i] = CONFIRMED[i-1];
		DISPLAYED[i] = DISPLAYED[i-1];
	}
	CONFIRMED[0] = false;
	DISPLAYED[0] = msg;

	// Add the message to the archive.
	ARCHIVE[CURRENT_ARCHIVE_POS] = DISPLAYED[0];
	CURRENT_ARCHIVE_POS = (CURRENT_ARCHIVE_POS + 1) % ARCHIVE_LINES;
}


function addMessage(msg) {

	data.disturbed = true;

	msg = capitalize(msg);

  if (!MSG_BOUNDS) {
    console.log(msg);
    return;
  }

  // // Implement the American quotation mark/period/comma ordering rule.
  // for (i=0; text.text[i] && text.text[i+1]; i++) {
  //     if (text.charCodeAt(i) === COLOR_ESCAPE) {
  //         i += 4;
  //     } else if (text.text[i] === '"'
  //                && (text.text[i+1] === '.' || text.text[i+1] === ','))
	// 		{
	// 			const replace = text.text[i+1] + '"';
	// 			text.spliceRaw(i, 2, replace);
  //     }
  // }

	const lines = splitIntoLines(msg, MSG_BOUNDS.width);

  if (MSG_BOUNDS.y < 10) {  // On top of UI
    lines.forEach( (l) => addMessageLine(l) );
  }
  else {  // On bottom of UI (add in reverse)
    for(let i = lines.length - 1; i >= 0; --i) {
      addMessageLine( lines[i] );
    }
  }

  // display the message:
  NEEDS_UPDATE = true;
  ui.requestUpdate();

  // if (GAME.playbackMode) {
	// 	GAME.playbackDelayThisTurn += GAME.playbackDelayPerTurn * 5;
	// }
}

function addCombatMessage(msg) {
	if (!COMBAT_MESSAGE) {
		COMBAT_MESSAGE = msg;
	}
	else {
		COMBAT_MESSAGE += ', ' + capitalize(msg);	}
  NEEDS_UPDATE = true;
  ui.requestUpdate();
}



function commitCombatMessage() {
	if (!COMBAT_MESSAGE) return false;
	addMessage(COMBAT_MESSAGE + '.');
	COMBAT_MESSAGE = null;
	return true;
}


function confirmAll() {
	for (let i=0; i<CONFIRMED.length; i++) {
		CONFIRMED[i] = true;
	}
  NEEDS_UPDATE = true;
  ui.requestUpdate();
}

message.confirmAll = confirmAll;


async function showArchive() {
	let j, reverse, fadePercent, totalMessageCount, currentMessageCount;
	let fastForward;

  if (!MSG_BOUNDS) return;

	// Count the number of lines in the archive.
	for (totalMessageCount=0;
		 totalMessageCount < ARCHIVE_LINES && ARCHIVE[totalMessageCount];
		 totalMessageCount++);

	if (totalMessageCount <= MSG_BOUNDS.height) return;

  const isOnTop = (MSG_BOUNDS.y < 10);
	const dbuf = ui.startDialog();

	// Pull-down/pull-up animation:
	for (reverse = 0; reverse <= 1; reverse++) {
		fastForward = false;
		for (currentMessageCount = (reverse ? totalMessageCount : MSG_BOUNDS.height);
			 (reverse ? currentMessageCount >= MSG_BOUNDS.height : currentMessageCount <= totalMessageCount);
			 currentMessageCount += (reverse ? -1 : 1))
	  {
			ui.resetDialog();

      // // Set the dbuf opacity, and do a fade from bottom to top to make it clear that the bottom messages are the most recent.
      // const mixer = new Sprite();
			// for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
			// 	fadePercent = 40 * (j + totalMessageCount - currentMessageCount) / totalMessageCount + 60;
			// 	for (i=0; i<MSG_BOUNDS.width; i++) {
			// 		const x = MSG_BOUNDS.toOuterX(i);
      //     const y = isOnTop ? j : dbuf.height - j - 1;
      //     mixer.blackOut();
      //     mixer.drawSprite(dbuf.get(x, y));
      //     mixer.mix(GW.colors.black, fadePercent);
      //     dbuf.drawSprite(x, y, mixer);
			// 		// dbuf._data[x][y].opacity = INTERFACE_OPACITY;
			// 		// if (dbuf._data[x][y].char != ' ') {
			// 		// 	for (k=0; k<3; k++) {
			// 		// 		dbuf._data[x][y].fg[k] = dbuf._data[x][y].fg[k] * fadePercent / 100;
			// 		// 	}
			// 		// }
			// 	}
			// }
      //

			// Print the message archive text to the dbuf.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				const pos = (CURRENT_ARCHIVE_POS - currentMessageCount + ARCHIVE_LINES + j) % ARCHIVE_LINES;
        const y = isOnTop ? j : dbuf.height - j - 1;

        fadePercent = Math.floor(50 * (currentMessageCount - j) / currentMessageCount);
        const fg = colors.white.clone().mix(colors.black, fadePercent);

				dbuf.wrapText(MSG_BOUNDS.toOuterX(0), y, MSG_BOUNDS.width, ARCHIVE[pos], fg, colors.black);
			}

			ui.draw();

			if (!fastForward && await io.pause(reverse ? 15 : 45)) {
				fastForward = true;
				// dequeueEvent();
				currentMessageCount = (reverse ? MSG_BOUNDS.height + 1 : totalMessageCount - 1); // skip to the end
			}
		}

		if (!reverse) {
    	if (!data.autoPlayingLevel) {
        const y = isOnTop ? 0 : dbuf.height - 1;
        dbuf.wrapText(MSG_BOUNDS.toOuterX(-8), y, 8, "--DONE--", colors.black, colors.white);
      	ui.draw();
      	await io.waitForAck();
    	}

		}
	}
	ui.finishDialog();

	message.confirmAll();
  NEEDS_UPDATE = true;
  ui.requestUpdate();
}

message.showArchive = showArchive;

let VIEWPORT = null;

function setup$1(opts={}) {
  VIEWPORT = viewport.bounds = new types.Bounds(opts.x, opts.y, opts.w, opts.h);
  config.followPlayer = opts.followPlayer || false;
  config.autoCenter = opts.autoCenter || false;
}

viewport.setup = setup$1;

let VIEW_FILTER = null;

function setFilter(fn) {
  VIEW_FILTER = fn || null;
}

viewport.setFilter = setFilter;

// DRAW

function drawViewport(buffer, map) {
  map = map || data.map;
  if (!map) return;
  if (!map.flags & Map.MAP_CHANGED) return;
  if (config.followPlayer && data.player && data.player.x >= 0) {
    VIEWPORT.offsetX = data.player.x - VIEWPORT.centerX();
    VIEWPORT.offsetY = data.player.y - VIEWPORT.centerY();
  }
  else if (config.autoCenter && data.player && data.player.x >= 0) {
    const left = VIEWPORT.offsetX;
    const right = VIEWPORT.offsetX + VIEWPORT.width;
    const top = VIEWPORT.offsetY;
    const bottom = VIEWPORT.offsetY + VIEWPORT.height;

    const edgeX = Math.floor(VIEWPORT.width/5);
    const edgeY = Math.floor(VIEWPORT.height/5);

    const thirdW = Math.floor(VIEWPORT.width / 3);
    if (left + edgeX >= data.player.x) {
      VIEWPORT.offsetX = Math.max(0, data.player.x + thirdW - VIEWPORT.width);
    }
    else if (right - edgeX <= data.player.x) {
      VIEWPORT.offsetX = Math.min(data.player.x - thirdW, map.width - VIEWPORT.width);
    }

    const thirdH = Math.floor(VIEWPORT.height/3);
    if (top + edgeY >= data.player.y) {
      VIEWPORT.offsetY = Math.max(0, data.player.y + thirdH - VIEWPORT.height);
    }
    else if (bottom - edgeY <= data.player.y) {
      VIEWPORT.offsetY = Math.min(data.player.y - thirdH, map.height - VIEWPORT.height);
    }
  }

  const buf = new Sprite();
  for(let x = 0; x < VIEWPORT.width; ++x) {
    for(let y = 0; y < VIEWPORT.height; ++y) {

      buf.blackOut();
      const mapX = x + VIEWPORT.offsetX;
      const mapY = y + VIEWPORT.offsetY;
      if (map.hasXY(mapX, mapY)) {
        map$1.getCellAppearance(map, mapX, mapY, buf);
        map.clearCellFlags(mapX, mapY, Cell.NEEDS_REDRAW | Cell.CELL_CHANGED);
      }

      buffer.drawSprite(x + VIEWPORT.x, y + VIEWPORT.y, buf);

      if (VIEW_FILTER) {
        VIEW_FILTER(buf, mapX, mapY, map);
      }
    }
  }
  buffer.needsUpdate = true;
  map.flags &= ~Map.MAP_CHANGED;
}

viewport.draw = drawViewport;

function hasXY(x, y) {
  return VIEWPORT.containsXY(x - VIEWPORT.offsetX + VIEWPORT.x, y - VIEWPORT.offsetY + VIEWPORT.y);
}

viewport.hasXY = hasXY;

// Sidebar

let SIDE_BOUNDS = null;
let SIDEBAR_CHANGED = true;
let SIDEBAR_ENTRIES = [];
const SIDEBAR_FOCUS = [-1,-1];

const sidebar$1 = sidebar;
const DATA = data;

sidebar$1.debug = NOOP;

const blueBar = addKind('blueBar', 	15,		10,		50);
const redBar = 	addKind('redBar', 	45,		10,		15);
const purpleBar = addKind('purpleBar', 	50,		0,		50);
const greenBar = addKind('greenBar', 	10,		50,		10);


function setup$2(opts={}) {
  SIDE_BOUNDS = sidebar$1.bounds = new types.Bounds(opts.x, opts.y, opts.width, opts.height);
}

sidebar$1.setup = setup$2;

function needsRedraw$1() {
  SIDEBAR_CHANGED = true;
}

sidebar$1.needsRedraw = needsRedraw$1;


function sortSidebarItems(items) {
	let distFn;
	if (DATA.player && DATA.player.distanceMap) {
		distFn = ((item) => DATA.player.distanceMap[item.x][item.y]);
	}
	else {
		const x = DATA.player ? DATA.player.x : 0;
		const y = DATA.player ? DATA.player.y : 0;
		distFn = ((item) => distanceBetween(item.x, item.y, x, y));
	}
	items.forEach( (item) => {
		item.dist = distFn(item);
	});
	items.sort( (a, b) => {
		if (a.priority != b.priority) {
			return a.priority - b.priority;
		}
		return a.dist - b.dist;
	});
}


function refreshSidebar(map) {

	// Gather sidebar entries
	const entries = [];
	const doneCells = alloc();
  let same = true;

	if (DATA.player) {
		doneCells[DATA.player.x][DATA.player.y] = 1;
    if (DATA.player.changed()) {
      same = false;
    }
	}

	// Get actors
  let actor = map.actors;
	while (actor) {
		const x = actor.x;
		const y = actor.y;
		if (doneCells[x][y]) {
      actor = actor.next;
      continue;
    }
		doneCells[x][y] = 1;

		const cell = map.cell(x, y);
		const changed = actor.changed();

		if (cell.isVisible()) {
			entries.push({ map, x, y, dist: 0, priority: 1, draw: sidebar$1.addActor, entity: actor, changed });
		}
		else if (cell.isAnyKindOfVisible()) {
			entries.push({ map, x, y, dist: 0, priority: 2, draw: sidebar$1.addActor, entity: actor, changed });
		}
		else if (cell.isRevealed(true) && actor.kind.alwaysVisible(actor) && viewport.hasXY(x, y))
		{
			entries.push({ map, x, y, dist: 0, priority: 3, draw: sidebar$1.addActor, entity: actor, changed, dim: true });
		}
    actor = actor.next;
	}

	// Get entries
  let item = map.items;
	while (item) {
		const x = item.x;
		const y = item.y;
		if (doneCells[x][y]) {
      item = item.next;
      continue;
    }

    if (item.hasKindFlag(ItemKind.IK_NO_SIDEBAR)) {
      item = item.next;
      continue;
    }

		doneCells[x][y] = 1;

		const cell = map.cell(x, y);
		const changed = item.changed();

		if (cell.isVisible()) {
			entries.push({ map, x: x, y: y, dist: 0, priority: 1, draw: sidebar$1.addItem, entity: item, changed });
		}
		else if (cell.isAnyKindOfVisible()) {
			entries.push({ map, x: x, y: y, dist: 0, priority: 2, draw: sidebar$1.addItem, entity: item, changed });
		}
		else if (cell.isRevealed() && viewport.hasXY(x, y))
		{
			entries.push({ map, x: x, y: y, dist: 0, priority: 3, draw: sidebar$1.addItem, entity: item, changed, dim: true });
		}
    item = item.next;
	}

	// Get tiles
	map.forEach( (cell, i, j) => {
		if (!(cell.isRevealed(true) || cell.isAnyKindOfVisible())) return;
		// if (cell.flags & (Flags.Cell.HAS_PLAYER | Flags.Cell.HAS_MONSTER | Flags.Cell.HAS_ITEM)) return;
		if (doneCells[i][j]) return;
		doneCells[i][j] = 1;

		if (cell.listInSidebar()) {
      const changed = cell.changed();
			let priority = 4;
      if (cell.isVisible()) {
        priority = 1;
      }
      else if (cell.isAnyKindOfVisible()) {
        priority = 2;
      }
      else if (viewport.hasXY(i, j)) {
        priority = 3;
      }
      const dim = !cell.isAnyKindOfVisible();
			entries.push({ map, x: i, y: j, dist: 0, priority, draw: sidebar$1.addMapCell, entity: cell, changed, dim });
		}
	});

	free(doneCells);

	// sort entries
	sortSidebarItems(entries);

	// compare to current list
	const max = Math.floor(SIDE_BOUNDS.height / 2);
	same = same && entries.every( (a, i) => {
		if (i > max) return true;
		const b = SIDEBAR_ENTRIES[i];
		if (!b) return false;
		if (a.x !== b.x || a.y !== b.y || a.priority !== b.priority) return false;
		if (a.entity !== b.entity || a.changed) return false;
		return true;
	});
	if (same && entries.length && (SIDEBAR_ENTRIES.length >= entries.length)) return;

	SIDEBAR_CHANGED = true;
	SIDEBAR_ENTRIES = entries;
}

sidebar$1.refresh = refreshSidebar;


// returns whether or not the cursor changed to a new entity (incl. none)
function focusSidebar(x, y) {
	if (!DATA.player || DATA.player.x !== x || DATA.player.y !== y) {
		if (! SIDEBAR_ENTRIES.find( (entry) => (entry.x == x && entry.y == y) ) ) {
			x = -1;
			y = -1;
		}
	}
	if (x !== SIDEBAR_FOCUS[0] || y !== SIDEBAR_FOCUS[1]) {
		SIDEBAR_FOCUS[0] = x;
		SIDEBAR_FOCUS[1] = y;
		SIDEBAR_CHANGED = true;
		// GW.ui.showLocDetails(x, y);
    return true;
	}
  return false;
}

sidebar$1.focus = focusSidebar;


function highlightSidebarRow(sy) {

  let x = -1;
  let y = -1;

	if (!SIDEBAR_ENTRIES || SIDEBAR_ENTRIES.length == 0) {
    x = DATA.player.x;
    y = DATA.player.y;
	}
	else {
		let best = { row: -1 };
		SIDEBAR_ENTRIES.forEach( (item, i) => {
			if (item.row > best.row && item.row <= sy) {
				best = item;
			}
		});
		if (best.row > 0) {
			x = best.x;
      y = best.y;
		}
		else if (best.row < 0) {
      x = DATA.player.x;
      y = DATA.player.y;
		}
	}

  if (x !== SIDEBAR_FOCUS[0] || y !== SIDEBAR_FOCUS[1]) {
		SIDEBAR_FOCUS[0] = x;
		SIDEBAR_FOCUS[1] = y;
		SIDEBAR_CHANGED = true;
    ui.setCursor(x, y);
		// GW.ui.showLocDetails(x, y);
    return true;
	}

}

sidebar$1.highlightRow = highlightSidebarRow;


function sidebarNextTarget() {
	let index = 0;
	if (SIDEBAR_ENTRIES.length == 0) {
		sidebar$1.focus(DATA.player.x, DATA.player.y);
		return SIDEBAR_FOCUS;
	}
	if (SIDEBAR_FOCUS[0] < 0) {
		sidebar$1.focus(SIDEBAR_ENTRIES[0].x, SIDEBAR_ENTRIES[0].y);
    return SIDEBAR_FOCUS;
	}

	index = SIDEBAR_ENTRIES.findIndex( (i) => i.x == SIDEBAR_FOCUS[0] && i.y == SIDEBAR_FOCUS[1] ) + 1;
	if (index >= SIDEBAR_ENTRIES.length) {
		sidebar$1.focus(DATA.player.x, DATA.player.y);
	}
	else {
		sidebar$1.focus(SIDEBAR_ENTRIES[index].x, SIDEBAR_ENTRIES[index].y);
	}
  return SIDEBAR_FOCUS;
}

sidebar$1.nextTarget = sidebarNextTarget;


function sidebarPrevTarget() {
	let index = 0;
	if (SIDEBAR_ENTRIES.length == 0) {
		sidebar$1.focus(DATA.player.x, DATA.player.y);
    return SIDEBAR_FOCUS;
	}
	if (SIDEBAR_FOCUS[0] < 0 || equalsXY(DATA.player, SIDEBAR_FOCUS)) {
		sidebar$1.focus(SIDEBAR_ENTRIES[SIDEBAR_ENTRIES.length - 1].x, SIDEBAR_ENTRIES[SIDEBAR_ENTRIES.length - 1].y);
    return SIDEBAR_FOCUS;
	}

	index = SIDEBAR_ENTRIES.findIndex( (i) => i.x == SIDEBAR_FOCUS[0] && i.y == SIDEBAR_FOCUS[1] ) - 1;
	if (index < 0) {
		sidebar$1.focus(DATA.player.x, DATA.player.y);
	}
	else {
		sidebar$1.focus(SIDEBAR_ENTRIES[index].x, SIDEBAR_ENTRIES[index].y);
	}
  return SIDEBAR_FOCUS;
}

sidebar$1.prevTarget = sidebarPrevTarget;


function drawSidebar(buf, forceFocused) {
	if (!SIDEBAR_CHANGED) return false;

	const dim = (SIDEBAR_FOCUS[0] >= 0);

	let y = 0;
	let focusShown = !dim;
	let highlight = false;

  buf.fillRect(SIDE_BOUNDS.x, SIDE_BOUNDS.y, SIDE_BOUNDS.width, SIDE_BOUNDS.height, ' ', colors.black, colors.black);

	if (DATA.player) {
		highlight = (SIDEBAR_FOCUS[0] === DATA.player.x && SIDEBAR_FOCUS[1] === DATA.player.y );
		y = sidebar$1.addActor({ entity: DATA.player, map: DATA.map, x: DATA.player.x, y: DATA.player.y }, y, dim && !highlight, highlight, buf);
		focusShown = focusShown || highlight;
	}

	if (forceFocused) {
		const info = SIDEBAR_ENTRIES.find( (i) => (i.x == SIDEBAR_FOCUS[0] && i.y == SIDEBAR_FOCUS[1]));
		if (info) {
			info.row = y;
			y = info.draw(info, y, false, true, buf);
			focusShown = true;
		}
	}

	let i = 0;
	while( y < SIDE_BOUNDS.height && i < SIDEBAR_ENTRIES.length ) {
		const entry = SIDEBAR_ENTRIES[i];
		highlight = false;
    let dimEntry = entry.dim || dim;
		if ((SIDEBAR_FOCUS[0] === entry.x && SIDEBAR_FOCUS[1] === entry.y))
		{
			if (focusShown) {
				++i;
				continue;
			}
			highlight = true;
      dimEntry = false;
		}
		entry.row = y;
		y = entry.draw(entry, y, dimEntry, highlight, buf);
		if (highlight && y <= SIDE_BOUNDS.height) {
			focusShown = true;
		}
		++i;
	}

	if (!focusShown && !forceFocused) {
		sidebar$1.debug('Sidebar focus NOT shown: ', SIDEBAR_FOCUS);
		drawSidebar(buf, true);
	}

	// buf.blackOutRect(SIDE_BOUNDS.x, SIDE_BOUNDS.toOuterY(y), SIDE_BOUNDS.width, SIDE_BOUNDS.height - y);

	SIDEBAR_CHANGED = false;
	return true;
}


function UiDrawSidebar(buf) {

	sidebar$1.refresh(DATA.map);
	// if (GW.ui.display.hasCanvasLoc(GW.io.mouse.x, GW.io.mouse.y)) {
	// 	const x = GW.ui.display.toLocalX(GW.io.mouse.x);
	// 	const y = GW.ui.display.toLocalY(GW.io.mouse.y);
	// 	GW.ui.focusSidebar(x, y);
	// }
	// else if (SIDE_BOUNDS.hasCanvasLoc(GW.io.mouse.x, GW.io.mouse.y)) {
	// 	GW.ui.highlightSidebarRow(GW.io.mouse.y);
	// }
	return drawSidebar(buf);
}

sidebar$1.draw = UiDrawSidebar;


function sidebarAddText(buf, y, text, fg, bg, opts={}) {

  if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  fg = fg ? from(fg) : colors.white;
  bg = bg ? from(bg) : colors.black;

  if (opts.dim) {
    fg = fg.clone();
    bg = bg.clone();
    fg.mix(colors.black, 50);
    bg.mix(colors.black, 50);
  }
  else if (opts.highlight) ;

  y = buf.wrapText(SIDE_BOUNDS.x, y, SIDE_BOUNDS.width, text, fg, bg, opts);

  return y;
}

sidebar$1.addText = sidebarAddText;

// Sidebar Actor

// Draws the smooth gradient that appears on a button when you hover over or depress it.
// Returns the percentage by which the current tile should be averaged toward a hilite color.
function smoothHiliteGradient$1(currentXValue, maxXValue) {
    return Math.floor(100 * Math.sin(Math.PI * currentXValue / (maxXValue)));
}


// returns the y-coordinate after the last line printed
function sidebarAddActor(entry, y, dim, highlight, buf)
{
	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

	const initialY = y;
  const actor = entry.entity;

  if (actor.kind.sidebar) {
    y = actor.kind.sidebar(entry, y, dim, highlight, buf);
  }
  else {
    // name and mutation, if any
  	y = sidebar$1.addName(entry, y, dim, highlight, buf);
  	y = sidebar$1.addMutationInfo(entry, y, dim, highlight, buf);

  	// Progress Bars
  	y = sidebar$1.addHealthBar(entry, y, dim, highlight, buf);
  	y = sidebar$1.addManaBar(entry, y, dim, highlight, buf);
  	y = sidebar$1.addFoodBar(entry, y, dim, highlight, buf);
  	y = sidebar$1.addStatuses(entry, y, dim, highlight, buf);
  	y = sidebar$1.addStateInfo(entry, y, dim, highlight, buf);
  	y = sidebar$1.addPlayerInfo(entry, y, dim, highlight, buf);
  }

  const x = SIDE_BOUNDS.x;
	if (y < SIDE_BOUNDS.height - 1) {
		buf.drawText(x, y++, "                    ");
	}

	if (highlight) {
		for (let i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient$1(i, SIDE_BOUNDS.width-1) / 10;
			for (let j=initialY; j < (y == SIDE_BOUNDS.height - 1 ? y : Math.min(y - 1, SIDE_BOUNDS.height - 1)); j++) {
				buf.highlight(x + i, j, colors.white, highlightStrength);
			}
		}
	}

	return y;
}

sidebar$1.addActor = sidebarAddActor;



function sidebarAddName(entry, y, dim, highlight, buf) {
  const monst = entry.entity;
  const map = entry.map;
  const fg = (dim ? colors.gray : colors.white);
  const bg = colors.black;

	if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const x = SIDE_BOUNDS.x;
  const monstForeColor = dim ? fg : monst.kind.sprite.fg;

	// buf.drawText(0, y, "                    ", fg, bg); // Start with a blank line

	// Unhighlight if it's highlighted as part of the path.
	const cell$1 = map.cell(monst.x, monst.y);
  const monstApp = new Sprite();
	cell.getAppearance(cell$1, monstApp);

	if (dim) {
		monstApp.fg.mix(bg, 50);
		monstApp.bg.mix(bg, 50);
	} else if (highlight) {
		// Does this do anything?
		monstApp.fg.add(bg, 100);
		monstApp.bg.add(bg, 100);
	}

	//patch to indicate monster is carrying item
	// if(monst.carriedItem) {
	// 	plotCharWithColor(monst.carriedItem.displayChar, 1, y, itemColor, black);
	// }
	//end patch

	const name = monst.getName({ color: monstForeColor, formal: true });
	let monstName = capitalize(name);

  if (monst.isPlayer()) {
      if (monst.status.invisible) {
				monstName += ' (invisible)';
      } else if (cell$1.isDark()) {
				monstName += ' (dark)';
      } else if (!cell$1.flags & Cell.IS_IN_SHADOW) {
				monstName += ' (lit)';
      }
  }

  buf.drawSprite(x, y, monstApp);
  buf.drawText(x + 1, y, ': ', fg);
	y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, monstName, fg, bg);

	return y;
}

sidebar$1.addName = sidebarAddName;


function addMutationInfo(entry, y, dim, highlight, buf) {
	return y;
}

sidebar$1.addMutationInfo = addMutationInfo;



// Progress Bars

function addProgressBar(y, buf, barText, current, max, color$1, dim) {
	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

	if (current > max) {
		current = max;
	}

	if (max <= 0) {
		max = 1;
	}

	color$1 = make$2(color$1);
	if (!(y % 2)) {
		color$1.mix(colors.black, 25);
	}

  let textColor = colors.white;
  if (dim) {
		color$1.mix(colors.black, 50);
    textColor = colors.gray;
	}

  ui.plotProgressBar(buf, SIDE_BOUNDS.x, y, SIDE_BOUNDS.width, barText, textColor, current/max, color$1);
  return y + 1;
}

sidebar$1.addProgressBar = addProgressBar;


function addHealthBar(entry, y, dim, highlight, buf) {

  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.health > 0 && (actor.isPlayer() || (actor.current.health != actor.max.health)) && !actor.isInvulnerable())
  {
    let healthBarColor = colors.blueBar;
		if (actor.isPlayer()) {
			healthBarColor = colors.redBar.clone();
			healthBarColor.mix(colors.blueBar, Math.min(100, 100 * actor.current.health / actor.max.health));
		}

    let text = 'Health';
		// const percent = actor.statChangePercent('health');
		if (actor.current.health <= 0) {
				text = "Dead";
		// } else if (percent != 0) {
		// 		text = Text.apply("Health (§percent%+d§)", { percent });
		}
		y = sidebar$1.addProgressBar(y, buf, text, actor.current.health, actor.max.health, healthBarColor, dim);
	}
	return y;
}

sidebar$1.addHealthBar = addHealthBar;


function addManaBar(entry, y, dim, highlight, buf) {
  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.mana > 0 && (actor.isPlayer() || (actor.current.mana != actor.max.mana)))
  {
    let barColor = colors.purpleBar;
		if (actor.isPlayer()) {
			barColor = colors.redBar.clone();
			barColor.mix(colors.purpleBar, Math.min(100, 100 * actor.current.mana / actor.max.mana));
		}

    let text = 'Mana';
		// const percent = actor.statChangePercent('health');
		if (actor.current.mana <= 0) {
				text = "None";
		// } else if (percent != 0) {
    // 		text = Text.apply("Mana (§percent%+d§)", { percent });
		}
		y = sidebar$1.addProgressBar(y, buf, text, actor.current.mana, actor.max.mana, barColor, dim);
	}
	return y;
}

sidebar$1.addManaBar = addManaBar;


function addFoodBar(entry, y, dim, highlight, buf) {
  if (y >= SIDE_BOUNDS.height - 1) {
    return SIDE_BOUNDS.height - 1;
  }

  const map = entry.map;
  const actor = entry.entity;

  if (actor.max.food > 0 && (actor.isPlayer() || (actor.current.food != actor.max.food)))
  {
    let barColor = colors.greenBar;
		if (actor.isPlayer()) {
			barColor = colors.purpleBar.clone();
			barColor.mix(colors.greenBar, Math.min(100, 100 * actor.current.food / actor.max.food));
		}

    let text = 'Food';
		// const percent = actor.statChangePercent('health');
		if (actor.current.food <= 0) {
				text = "None";
		// } else if (percent != 0) {
    // 		text = Text.apply("Nutrition (§percent%+d§)", { percent });
		}
		y = sidebar$1.addProgressBar(y, buf, text, actor.current.food, actor.max.food, barColor, dim);
	}
	return y;
}

sidebar$1.addFoodBar = addFoodBar;


function addStatuses(entry, y, dim, highlight, buf) {
	return y;
}

sidebar$1.addStatuses = addStatuses;


function addStateInfo(entry, y, dim, highlight, buf) {
	return y;
}

sidebar$1.addStateInfo = addStateInfo;


function addPlayerInfo(entry, y, dim, highlight, buf) {
	return y;
}

sidebar$1.addPlayerInfo = addPlayerInfo;



// Returns the y-coordinate after the last line printed.
function sidebarAddMapCell(entry, y, dim, highlight, buf) {
	let i, j;
  const fg = (dim ? colors.gray : colors.white);
  const bg = colors.black;

  const cell$1 = entry.entity;
  const textColor = colors.flavorText.clone();
  if (dim) {
      textColor.scale(50);
  }

	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  const x = SIDE_BOUNDS.x;
	const initialY = y;

  const app = new Sprite();
	cell.getAppearance(cell$1, app);
	if (dim) {
		app.fg.mix(bg, 50);
		app.bg.mix(bg, 50);
	}

  buf.drawSprite(x, y, app);
	buf.draw(x + 1, y, ":", fg, bg);
	let name = cell$1.getName();
	name = capitalize(name);
  y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, name, textColor, bg);

	if (highlight) {
		for (i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient$1(i, SIDE_BOUNDS.width-1) / 10;
			for (j=initialY; j < y && j < SIDE_BOUNDS.height - 1; j++) {
				buf.highlight(x + i, j, colors.white, highlightStrength);
			}
		}
	}
	y += 1;

	return y;
}

sidebar$1.addMapCell = sidebarAddMapCell;



// Returns the y-coordinate after the last line printed.
function sidebarAddItemInfo(entry, y, dim, highlight, buf) {
	let name;
	let i, j;
  const fg = (dim ? colors.gray : colors.white);

	if (y >= SIDE_BOUNDS.height - 1) {
		return SIDE_BOUNDS.height - 1;
	}

  const theItem = entry.entity;
  const map = entry.map;
  const cell$1 = map.cell(entry.x, entry.y);
	const initialY = y;
  const x = SIDE_BOUNDS.x;

  const app = new Sprite();
	cell.getAppearance(cell$1, app);
	if (dim) {
		app.fg.mix(colors.black, 50);
		app.bg.mix(colors.black, 50);
	}

  buf.drawSprite(x, y, app);
	buf.draw(x + 1, y, ":", fg, colors.black);
	if (config.playbackOmniscience || !DATA.player.status.hallucinating) {
		name = theItem.getName({ color: !dim, details: true });
	} else {
    name = item$1.describeHallucinatedItem();
	}
	name = capitalize(name);

  y = buf.wrapText(x + 3, y, SIDE_BOUNDS.width - 3, name, fg, colors.black);

	if (highlight) {
		for (i=0; i<SIDE_BOUNDS.width; i++) {
			const highlightStrength = smoothHiliteGradient$1(i, SIDE_BOUNDS.width-1) / 10;
			for (j=initialY; j < y && j < SIDE_BOUNDS.height - 1; j++) {
				buf.highlight(x + i, j, colors.white, highlightStrength);
			}
		}
	}
	y += 1;

	return y;
}

sidebar$1.addItem = sidebarAddItemInfo;

const flavorTextColor = addKind('flavorText', 50, 40, 90);
const flavorPromptColor = addKind('flavorPrompt', 100, 90, 20);

let FLAVOR_TEXT = '';
let NEED_FLAVOR_UPDATE = false;
let FLAVOR_BOUNDS = null;
let IS_PROMPT = false;

function setupFlavor(opts={}) {
  FLAVOR_BOUNDS = flavor.bounds = new types.Bounds(opts.x, opts.y, opts.w, 1);
}

flavor.setup = setupFlavor;

function setFlavorText(text$1) {
  FLAVOR_TEXT = capitalize(text$1);
  NEED_FLAVOR_UPDATE = true;
  IS_PROMPT = false;
  ui.requestUpdate();
}

flavor.setText = setFlavorText;


function showPrompt(text$1) {
  FLAVOR_TEXT = capitalize(text$1);
  NEED_FLAVOR_UPDATE = true;
  IS_PROMPT = true;
  ui.requestUpdate();
}

flavor.showPrompt = showPrompt;


function drawFlavor(buffer) {
  if (!NEED_FLAVOR_UPDATE || !FLAVOR_BOUNDS) return;
  const color = IS_PROMPT ? flavorPromptColor : flavorTextColor;
  if (length(FLAVOR_TEXT) > FLAVOR_BOUNDS.width) {
    buffer.wrapText(FLAVOR_BOUNDS.x, FLAVOR_BOUNDS.y, FLAVOR_BOUNDS.width, FLAVOR_TEXT, color, colors.black);
    message.needsRedraw();
  }
  else {
    buffer.wrapText(FLAVOR_BOUNDS.x, FLAVOR_BOUNDS.y, FLAVOR_BOUNDS.width, FLAVOR_TEXT, color, colors.black);
  }
}

flavor.draw = drawFlavor;

function clearFlavor() {
  flavor.setText('');
}

flavor.clear = clearFlavor;


function showFlavorFor(x, y) {
  if (!data.map) return;
  const buf = flavor.getFlavorText(data.map, x, y);
  flavor.setText(buf);
	return true;
}

flavor.showFor = showFlavorFor;

function getFlavorText(map, x, y) {

	const cell = map.cell(x, y);
	let buf;

	let monst;
	let theItem;
	let standsInTerrain;
	let object = '';

  const player = data.player || null;
  const actor = player;

	monst = null;
	standsInTerrain = ((cell.highestPriorityTile().mechFlags & TileMech.TM_STAND_IN_TILE) ? true : false);
	theItem = map.itemAt(x, y);
	if (cell.flags & Cell.HAS_MONSTER) {
		monst = map.actorAt(x, y);
	} else if (cell.flags & Cell.HAS_DORMANT_MONSTER) {
		monst = map.dormantAt(x, y);
	}

	if (player && x == player.x && y == player.y) {
		if (player.status.levitating) {
			buf = apply("you are hovering above §flavor§.", { actor: player, flavor: cell.tileFlavor() });
		}
    else {
			// if (theItem) {
			// 	buf = ITEM.getFlavor(theItem);
			// }
      // else {
        buf = apply('you see yourself.', {actor});
      // }
		}
    return buf;
	}
  //
	// // detecting magical items
	// magicItem = null;
	// if (theItem && !playerCanSeeOrSense(x, y)
	// 	&& GW.item.isDetected(theItem))
	// {
	// 	magicItem = theItem;
	// } else if (monst && !playerCanSeeOrSense(x, y)
	// 		   && monst.carriedItem
	// 		   && GW.item.isDetected(monst.carriedItem))
  // {
	// 	magicItem = monst.carriedItem;
	// }
	// if (magicItem) {
	// 	return GW.item.detectedText(magicItem);
	// }
  //
	// // telepathy
	// if (monst
  //       && !(cell.flags & VISIBLE) 					 // && !GW.player.canSeeMonster(monst)
	// 			&& (cell.flags & TELEPATHIC_VISIBLE)) // GW.actor.telepathicallyRevealed(monst))
	// {
	// 	return GW.actor.telepathyText(monst);
	// }
  //
	// if (monst && !playerCanSeeOrSense(x, y)) {
  //       // Monster is not visible.
	// 	monst = null;
	// }

	if (!map.isAnyKindOfVisible(x, y)) {
    buf = '';
		if (cell.flags & Cell.REVEALED) { // memory
			if (cell.memory.itemKind) {
        // if (player.status.hallucinating && !GW.GAME.playbackOmniscience) {
        //     object = GW.item.describeHallucinatedItem();
        // } else {
            const kind = cell.memory.itemKind;
            object = kind.getName({ quantity: cell.memory.itemQuantity }, { color: false, article: true });
            // object = GW.item.describeItemBasedOnParameters(cell.rememberedItemCategory, cell.rememberedItemKind, cell.rememberedItemQuantity);
        // }
      } else if (cell.memory.actorKind) {
        const kind = cell.memory.actorKind;
        object = kind.getName({}, { color: false, article: true });
			} else {
				object = tiles[cell.memory.tile].getFlavor();
			}
			buf = apply("you remember seeing §object§ here.", { actor, object });
		} else if (cell.flags & Cell.MAGIC_MAPPED) { // magic mapped
			buf = apply("you expect §text§ to be here.", { actor, text: tiles[cell.memory.tile].getFlavor() });
		}
		return buf;
	}

  let needObjectArticle = false;
	if (monst) {
		object = monst.getName({ color: false, article: true }) + ' standing';
    needObjectArticle = true;
	} else if (theItem) {
    object = theItem.getName({ color: false, article: true });
    needObjectArticle = true;
	}

  let article = cell.liquid ? ' in ' : ' on ';

  let surface = '';
  if (cell.surface) {
    const tile = cell.surfaceTile;
    if (needObjectArticle) {
      needObjectArticle = false;
      object += ' on ';
    }
    if (tile.flags & Tile.T_BRIDGE) {
      article = ' over ';
    }
    surface = cell.surfaceTile.getFlavor() + article;
  }

  let liquid = '';
  if (cell.liquid) {
    liquid = cell.liquidTile.getFlavor() + ' covering ';
    if (needObjectArticle) {
      needObjectArticle = false;
      object += ' in ';
    }
  }

  if (needObjectArticle) {
    needObjectArticle = false;
    object += ' on ';
  }
  let ground = cell.groundTile.getFlavor();

  buf = apply("you §action§ §text§.", { actor, action: (map.isVisible(x, y) ? "see" : "sense"), text: object + surface + liquid + ground });

  return buf;
}

flavor.getFlavorText = getFlavorText;

class Column {
  constructor(name, field, empty) {
    this.name = name || null;
    this.template = null;
    this.custom = null;
    if (typeof field === 'function') {
      this.custom = field;
    }
    else if (field) {
      this.template = compile(field);
    }
    this.empty = empty || '-';
  }

  draw(buffer, x, y, data, index, color) {
    if (!data) {
      buffer.drawText(x, y, this.empty, color);
      return length(this.empty);
    }

    let text$1;
    if (this.custom) {
      text$1 = this.custom(data, index, color, this);
    }
    else {
      text$1 = this.template(data);
    }
    buffer.drawText(x, y, text$1, color);
    return length(text$1);
  }

  drawHeader(buffer, x, y) {
    if (!this.name) return 0;

    buffer.drawText(x, y, this.name);
    return length(this.name);
  }
}

types.Column = Column;


class Table {
  constructor(opts={}) {
    if (Array.isArray(opts)) {
      opts = { columns: opts };
    }

    this.columns = opts.columns || [];
    this.letters = opts.letters || false;
    this.headers = opts.headers || false;
    if (opts.letters) {
      this.columns.unshift(new Column(null, (data, index) => {
        const letter = String.fromCharCode(97 + index);
        return letter + ')';
      }));
    }
    this.color = from(opts.color || colors.white);
    this.activeColor = from(opts.selectedColor || colors.teal);
    this.disabledColor = from(opts.disabledColor || colors.black);
    this.active = opts.active || -1;
    this.bounds = make.bounds();
    this.selected = -1;
    this.cancelled = false;
    this.count = 0;
    this.bg = opts.bg;
  }

  get width() { return this.bounds.width; }
  get height() { return this.bounds.height; }

  column(...args) {
    const col = new types.Column(...args);
    this.columns.push(col);
    return this;
  }

  draw(buffer, x0, y0, data) {
    if (Array.isArray(data)) {
      return this._drawArray(buffer, x0, y0, data);
    }
    return this._drawChain(buffer, x0, y0, data);
  }

  _drawChain(buffer, x0, y0, data) {
    return this._draw(buffer, x0, y0, (current) => {
      return current ? current.next : data;
    });
  }

  _drawArray(buffer, x0, y0, data) {
    let index = -1;
    return this._draw(buffer, x0, y0, () => {
      ++index;
      if (index < data.length) {
        return data[index];
      }
      index = -1;
      return null;
    });
  }

  _draw(buffer, x0, y0, nextFn) {
    if (this.bounds.width) {
      buffer.blackOutRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, this.bg);
    }
    this.bounds.x = x0;
    this.bounds.y = y0;
    const hasHeaders = this.columns.some( (c) => c.name );

    let x = x0;
    let y = y0;
    for(let column of this.columns) {
      let maxWidth = 0;
      y = y0;
      if (this.headers && hasHeaders) {
        maxWidth = Math.max(maxWidth, column.drawHeader(buffer, x, y++));
      }

      this.count = 0;
      let current = nextFn();
      do {
        if (this.active == -1 && !current.disabled) {
          this.active = this.count;
        }

        let color = (this.count == this.active) ? this.activeColor : this.color;
        if (current.disabled) {
          color = color.clone().mix(this.disabledColor, 50);
        }
        maxWidth = Math.max(maxWidth, column.draw(buffer, x, y, current, this.count, color));
        ++y;
        current = nextFn(current);
        ++this.count;
      }
      while(current);

      x += (maxWidth + 1);
    }

    this.bounds.width = x - x0;
    this.bounds.height = y - y0;
    return y;
  }

  async loop(handler) {
    while(true) {
      const ev = await nextEvent();
      if (await this.dispatchEvent(ev, handler)) {
        return true;
      }
    }
  }

  async dispatchEvent(ev, handler={}) {
    this.cancelled = false;
    this.selected = -1;

    if (await dispatchEvent(ev, handler)) return true;

    return await dispatchEvent(ev, {
      Escape: () => {
        this.cancelled = true;
        return true;
      },
      Enter: () => {
        this.selected = this.active;
        return true;
      },
      mousemove: (ev) => {
        if (this.bounds.containsXY(ev.x, ev.y)) {
          const index = ev.y - this.bounds.y - (this.headers ? 1 : 0);
          if (index >= 0) {
            this.active = index;
            return true;
          }
        }
      },
      click: (ev) => {
        if (this.bounds.containsXY(ev.x, ev.y)) {
          const index = ev.y - this.bounds.y - (this.headers ? 1 : 0);
          if (index >= 0) {
            this.selected = index;
            return true;
          }
        }
      },
      dir: (ev) => {
        if(ev.dir[1] < 0) {
          this.active = (this.count + this.active - 1) % this.count;
        }
        else if (ev.dir[1] > 0) {
          this.active = (this.active + 1) % this.count;
        }
        return true;
      },
      keypress: (ev) => {
        if (!this.letters) return false;
        const index = ev.key.charCodeAt(0) - 97;
        if (index >= 0 && index < this.count) {
          this.active = index;
          return true;
        }
        return false;
      }
    });
  }

}

types.Table = Table;


function make$6(...args) {
  return new types.Table(...args);
}

make.table = make$6;

class List extends types.Table {
  constructor(opts={}) {
    super(opts);
    this.column(opts.header, '§text§');
  }
}

types.List = List;

function make$7(...args) {
  return new types.List(...args);
}

make.list = make$7;

ui.debug = NOOP;

let SHOW_FLAVOR = false;
let SHOW_CURSOR = false;
let SHOW_PATH = false;
let PATH_ACTIVE = false;
let CLICK_MOVE = false;


let UI_BUFFER = null;
let UI_BASE = null;
let UI_OVERLAY = null;
let IN_DIALOG = false;

let time = 0;

let LOOP;

function uiLoop(t) {
	t = t || performance.now();

  // if (RUNNING) {
  //   requestAnimationFrame(uiLoop);
  // }

	const dt = Math.floor(t - time);
	time = t;

	if ((!IN_DIALOG) && tick(dt)) {
		ui.draw();
	}
	else {
		const ev = io.makeTickEvent(dt);
		io.pushEvent(ev);
	}
  //
	// ui.canvas.render();
}


function start$2(opts={}) {

  setDefaults(opts, {
    width: 100,
    height: 34,
    bg: 'black',
    sidebar: false,
    messages: false,
    wideMessages: false,
		cursor: false,
		flavor: false,
    menu: false,
    div: 'canvas',
    io: true,
    followPlayer: false,
    loop: true,
    autoCenter: false,
    showPath: false,
    clickToMove: false,
  });

  if (!ui.canvas && (opts.canvas !== false)) {
    ui.canvas = make.canvas({ width: opts.width, height: opts.height, div: opts.div, font: opts.font, tileWidth: 14, tileHeight: 16 });
    ui.buffer = new Buffer(ui.canvas);

    if (opts.io && typeof document !== 'undefined') {
      ui.canvas.node.onmousedown = ui.onmousedown;
      ui.canvas.node.onmousemove = ui.onmousemove;
      ui.canvas.node.onmouseup = ui.onmouseup;
    	document.onkeydown = ui.onkeydown;
    }

    // TODO - init sidebar, messages, flavor, menu
    UI_BUFFER = UI_BUFFER || new Buffer(ui.canvas);
    UI_BASE = UI_BASE || new Buffer(ui.canvas);
    // UI_OVERLAY = UI_OVERLAY || new Buffer(ui.canvas);
    // UI_BASE.nullify();
    // UI_OVERLAY.nullify();

    ui.blackOutDisplay();
  }

  IN_DIALOG = false;

  if (opts.sidebar === true) {
    opts.sidebar = 20;
  }

	let viewX = 0;
	let viewY = 0;
	let viewW = opts.width;
	let viewH = opts.height;

	let flavorLine = -1;

  if (opts.messages) {
    viewH -= Math.abs(opts.messages);
  }
  if (opts.flavor) {
    viewH -= 1;
  }

  if (opts.sidebar) {
    const sideH = (opts.wideMessages ? viewH : opts.height);
    let sideY = (opts.wideMessages && opts.messages > 0) ? opts.height - viewH : 0;

    if (opts.sidebar < 0) { // right side
      viewW += opts.sidebar;  // subtract
      sidebar.setup({ x: viewW, y: sideY, width: -opts.sidebar, height: sideH });
    }
    else {  // left side
      viewW -= opts.sidebar;
      viewX = opts.sidebar;
      sidebar.setup({ x: 0, y: sideY, width: opts.sidebar, height: sideH });
    }
  }

  const msgW = (opts.wideMessages ? opts.width : viewW);
  const msgX = (opts.wideMessages ? 0 : viewX);

	if (opts.messages) {
		if (opts.messages < 0) {	// on bottom of screen
			message.setup({x: msgX, y: opts.height + opts.messages, width: msgW, height: -opts.messages, archive: opts.height });
			if (opts.flavor) {
				flavorLine = opts.height + opts.messages - 1;
			}
		}
		else {	// on top of screen
			message.setup({x: msgX, y: 0, width: msgW, height: opts.messages, archive: opts.height });
			viewY = opts.messages;
			if (opts.flavor) {
				viewY += 1;
				flavorLine = opts.messages;
			}
		}
	}

	if (opts.flavor) {
		flavor.setup({ x: msgX, y: flavorLine, w: msgW, h: 1 });
    SHOW_FLAVOR = true;
	}

	viewport.setup({ x: viewX, y: viewY, w: viewW, h: viewH, followPlayer: opts.followPlayer, autoCenter: opts.autoCenter });
	SHOW_CURSOR = opts.cursor;
  SHOW_PATH = opts.showPath;
  CLICK_MOVE = opts.clickToMove;

  if (opts.loop) {
    LOOP = setInterval(uiLoop, 16);
  	// uiLoop();
  }

  return ui.canvas;
}

ui.start = start$2;


function stop() {
  if (!LOOP) return;
  clearInterval(LOOP);
	LOOP = null;
}

ui.stop = stop;



async function dispatchEvent$1(ev) {

	if (ev.type === def.CLICK) {
		if (message.bounds && message.bounds.containsXY(ev.x, ev.y)) {
			await message.showArchive();
			return true;
		}
		else if (flavor.bounds && flavor.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
    else if (viewport.bounds && viewport.bounds.containsXY(ev.x, ev.y)) {
      ev.mapX = viewport.bounds.toInnerX(ev.x);
      ev.mapY = viewport.bounds.toInnerY(ev.y);
      // if (CONFIG.followPlayer && DATA.player && (DATA.player.x >= 0)) {
      //   const offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
      //   const offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
      //   x0 += offsetX;
      //   y0 += offsetY;
      // }
      // ev.mapX = x0;
      // ev.mapY = y0;
      if (CLICK_MOVE) {
        return await commands$1.travel(ev);
      }
    }
    else if (sidebar.bounds && sidebar.bounds.containsXY(ev.x, ev.y)) {
      if (CLICK_MOVE) {
        ev.mapX = CURSOR.x;
        ev.mapY = CURSOR.y;
        return await commands$1.travel(ev);
      }
    }
	}
	else if (ev.type === def.MOUSEMOVE) {
    PATH_ACTIVE = true;
    MOUSE.x = ev.x;
    MOUSE.y = ev.y;
		if (viewport.bounds && viewport.bounds.containsXY(ev.x, ev.y)) {
      let x0 = viewport.bounds.toInnerX(ev.x);
      let y0 = viewport.bounds.toInnerY(ev.y);
      // if (CONFIG.followPlayer && DATA.player && (DATA.player.x >= 0)) {
      //   const offsetX = DATA.player.x - VIEWPORT.bounds.centerX();
      //   const offsetY = DATA.player.y - VIEWPORT.bounds.centerY();
      //   x0 += offsetX;
      //   y0 += offsetY;
      // }
      // ev.mapX = x0;
      // ev.mapY = y0;

			ui.setCursor(x0, y0);
      if (sidebar.bounds) {
        sidebar.focus(x0, y0);
      }
			return true;
		}
    else if (sidebar.bounds && sidebar.bounds.containsXY(ev.x, ev.y)) {
      sidebar.highlightRow(ev.y);
    }
		else {
      ui.clearCursor();
      sidebar.focus(-1, -1);
		}
		if (flavor.bounds && flavor.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
	}
  else if (ev.type === def.KEYPRESS) {
    if (ev.key === 'Enter' && CLICK_MOVE) {
      if (PATH_ACTIVE) {
        ev.mapX = CURSOR.x;
        ev.mapY = CURSOR.y;
        return await commands$1.travel(ev);
      }
    }

    PATH_ACTIVE = false;
    data.player.travelDest = null;  // stop traveling

    if (sidebar.bounds) {
      if (ev.key === 'Tab') {
        PATH_ACTIVE = true;
        const loc = sidebar.nextTarget();
        ui.setCursor(loc[0], loc[1]);
        return true;
      }
      else if (ev.key === 'TAB') {
        PATH_ACTIVE = true;
        const loc = sidebar.prevTarget();
        ui.setCursor(loc[0], loc[1]);
        return true;
      }
      else if (ev.key === 'Escape') {
        if (viewport.bounds.containsXY(MOUSE.x, MOUSE.y)) {
          const x = viewport.bounds.toInnerX(MOUSE.x);
          const y = viewport.bounds.toInnerY(MOUSE.y);
          sidebar.focus(x, y);
          data.player.travelDest = null;  // stop traveling
          ui.setCursor(x, y, true);
        }
        else {
          sidebar.focus(-1, -1);
          ui.clearCursor();
        }
      }
    }

  }

	return false;
}

ui.dispatchEvent = dispatchEvent$1;


let UPDATE_REQUESTED = 0;
function requestUpdate(t=1) {
	UPDATE_REQUESTED = Math.max(UPDATE_REQUESTED, t, 1);
  ui.debug('update requested - %d', UPDATE_REQUESTED);
}

ui.requestUpdate = requestUpdate;

async function updateNow(t=1) {
	t = Math.max(t, UPDATE_REQUESTED, 0);
	UPDATE_REQUESTED = 0;
  ui.debug('update now - %d', t);
	ui.draw();
	if (t) {
		const r = await io.tickMs(t);
	}
}

ui.updateNow = updateNow;

async function updateIfRequested() {
	if (UPDATE_REQUESTED) {
		await ui.updateNow(UPDATE_REQUESTED);
	}
}

ui.updateIfRequested = updateIfRequested;

// EVENTS

function onkeydown(e) {
	if (io.ignoreKeyEvent(e)) return;

	if (e.code === 'Escape') {
		io.clearEvents();	// clear all current events, then push on the escape
  }

	const ev = io.makeKeyEvent(e);
	io.pushEvent(ev);

	e.preventDefault();
}

ui.onkeydown = onkeydown;

function onmousemove(e) {
	const x = ui.canvas.toX(e.clientX);
	const y = ui.canvas.toY(e.clientY);
	const ev = io.makeMouseEvent(e, x, y);
	io.pushEvent(ev);
}

ui.onmousemove = onmousemove;

function onmousedown(e) {
	const x = ui.canvas.toX(e.clientX);
	const y = ui.canvas.toY(e.clientY);
	const ev = io.makeMouseEvent(e, x, y);
	io.pushEvent(ev);
}

ui.onmousedown = onmousedown;

function onmouseup(e) {
	const x = ui.canvas.toX(e.clientX);
	const y = ui.canvas.toY(e.clientY);
	const ev = io.makeMouseEvent(e, x, y);
	io.pushEvent(ev);
}

ui.onmouseup = onmouseup;


//////////////////
// CURSOR

var MOUSE = ui.mouse = {
  x: -1,
  y: -1,
};

var CURSOR = ui.cursor = {
	x: -1,
	y: -1,
};

function setCursor(x, y, force) {
  const map = data.map;
  if (!map) return false;

  if (!force) {
    if (CURSOR.x == x && CURSOR.y == y) return false;
  }

  // ui.debug('set cursor', x, y);

  if (map.hasXY(CURSOR.x, CURSOR.y)) {
    map.clearCellFlags(CURSOR.x, CURSOR.y, Cell.IS_CURSOR);
    map.setCellFlags(CURSOR.x, CURSOR.y, Cell.NEEDS_REDRAW);
  }
  CURSOR.x = x;
  CURSOR.y = y;

  if (map.hasXY(x, y)) {
    if (SHOW_CURSOR) {
      map.setCellFlags(CURSOR.x, CURSOR.y, Cell.IS_CURSOR | Cell.NEEDS_REDRAW);
    }
    if (SHOW_PATH) {
      ui.updatePathToCursor();
    }

    // if (!GW.player.isMoving()) {
    //   showPathFromPlayerTo(x, y);
    // }
    flavor.showFor(x, y);
  }
  else {
    // GW.map.clearPath();
    flavor.setText('');
  }

  ui.requestUpdate();
  return true;
}

ui.setCursor = setCursor;

// function moveCursor(dx, dy) {
//   GW.map.setCursor(CURSOR.x + dx, CURSOR.y + dy);
// }
//
// GW.map.moveCursor = moveCursor;

// GW.map.cursor = CURSOR;

function clearCursor() {
  return ui.setCursor(-1,-1);
  // ui.flavorMessage(GW.map.cellFlavor(GW.PLAYER.x, GW.PLAYER.y));
}

ui.clearCursor = clearCursor;


function updatePathToCursor() {
  const player = data.player;
  const map = data.map;

  if (!SHOW_PATH) return;
  if (player.travelDest) return;  // do not update path if we are traveling...

  map.clearFlags(0, Cell.IS_IN_PATH);

  if (!PATH_ACTIVE) return;

  if (CURSOR.x == player.x && CURSOR.y == player.y) return;
  if (CURSOR.x < 0 || CURSOR.y < 0) return ui.updatePath();

  const mapToMe = player.updateMapToMe();
  const path$1 = getPath(map, mapToMe, CURSOR.x, CURSOR.y, player);

  ui.updatePath(path$1);
}

ui.updatePathToCursor = updatePathToCursor;


function updatePath(path) {
  const player = data.player;
  const map = data.map;

  if (!SHOW_PATH) return;
  map.clearFlags(0, Cell.IS_IN_PATH);

  if (path) {
    for(let pos of path) {
      if (pos[0] != player.x || pos[1] != player.y) {
        map.setCellFlag(pos[0], pos[1], Cell.IS_IN_PATH);
      }
    }
  }

}

ui.updatePath = updatePath;

// FUNCS

async function prompt(text$1, args) {
  if (args) {
    text$1 = apply(text$1, args);
  }

	if (SHOW_FLAVOR) {
		flavor.showPrompt(text$1);
	}
	else {
		console.log(text$1);
	}
}

ui.prompt = prompt;


async function fadeTo(color, duration=1000) {

  color = GW.color.from(color);
  const buffer = startDialog();

  let pct = 0;
  let elapsed = 0;

  while(elapsed < duration) {
    elapsed += 32;
    if (await io.pause(32)) {
      elapsed = duration;
    }

    pct = Math.floor(100*elapsed/duration);

    resetDialog();
    buffer.mix(color, pct);
    buffer.render();
  }

  finishDialog();

}

ui.fadeTo = fadeTo;


async function alert(duration, text$1, args) {

  const buffer = ui.startDialog();

	if (args) {
		text$1 = apply(text$1, args);
	}

  const len = text$1.length;
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 3, ' ', 'black', 'black');
	buffer.drawText(x + 2, y + 1, text$1);
	buffer.render();

	await io.pause(duration || 30 * 1000);

	ui.finishDialog();
}

ui.alert = alert;


async function confirm(opts, prompt, args) {

  let text$1;
  if (typeof opts === 'string') {
    args = prompt;
    prompt = opts;
    opts = {};
  }
  if (prompt) {
    prompt = GW.messages[prompt] || prompt;
    text$1 = apply(prompt, args);
  }

  setDefaults(opts, {
    allowCancel: true,
    bg: 'black',
  });

  const buffer = ui.startDialog();
  buffer.mix('black', 50);

	const btnOK = 'OK=Enter';
	const btnCancel = 'Cancel=Escape';
  const len = Math.max(text$1.length, btnOK.length + 4 + btnCancel.length);
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 5, ' ', 'black', opts.bg);
	buffer.drawText(x + 2, y + 1, text$1);
	buffer.drawText(x + 2, y + 3, btnOK);
  if (opts.allowCancel) {
    buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, 'white');
  }
	buffer.render();

	let result;
	while(result === undefined) {
		const ev = await io.nextEvent(1000);
		await io.dispatchEvent(ev, {
			enter() {
				result = true;
			},
			escape() {
        if (opts.allowCancel) {
          result = false;
        }
			},
			mousemove() {
				let isOK = ev.x < x + btnOK.length + 2;
				let isCancel = ev.x > x + len + 4 - btnCancel.length - 4;
				if (ev.x < x || ev.x > x + len + 4) { isOK = false; isCancel = false; }
				if (ev.y != y + 3 ) { isOK = false; isCancel = false; }
				buffer.drawText(x + 2, y + 3, btnOK, isOK ? GW.colors.teal : GW.colors.white);
        if (opts.allowCancel) {
          buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, isCancel ? GW.colors.teal : GW.colors.white);
        }
				buffer.render();
			},
			click() {
				if (ev.x < x || ev.x > x + len + 4) return;
				if (ev.y < y || ev.y > y + 5) return;
				result = ev.x < x + Math.floor(len/2) + 2;
			}
		});
	}

	ui.finishDialog();
	return result;
}

ui.confirm = confirm;


function blackOutDisplay() {
	UI_BUFFER.blackOut();
}

ui.blackOutDisplay = blackOutDisplay;


const TARGET_SPRITE = install$1('target', 'green', 50);

async function chooseTarget(choices, prompt, opts={}) {
	console.log('choose Target');

	if (!choices || choices.length == 0) return null;
	if (choices.length == 1) return choices[0];

	const buf = ui.startDialog();
	let waiting = true;
	let selected = 0;

	function draw() {
		ui.resetDialog();
		buf.wrapText(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, prompt, GW.colors.orange);
		if (selected >= 0) {
			const choice = choices[selected];

      let offsetX = 0;
      let offsetY = 0;
      if (config.followPlayer && data.player && data.player.x >= 0) {
        offsetX = data.player.x - viewport.bounds.centerX();
        offsetY = data.player.y - viewport.bounds.centerY();
      }

      const x = choice.x + viewport.bounds.x - offsetX;
      const y = choice.y + viewport.bounds.y - offsetY;

			buf.drawSprite(x, y, TARGET_SPRITE);
		}
		buf.render();
	}

	draw();

	while(waiting) {
		const ev = await GW.io.nextEvent(100);
		await io.dispatchEvent(ev, {
			escape() { waiting = false; selected = -1; },
			enter() { waiting = false; },
			tab() {
				selected = (selected + 1) % choices.length;
				draw();
			},
			dir(e) {
				if (e.dir[0] > 0 || e.dir[1] > 0) {
					selected = (selected + 1) % choices.length;
				}
				else if (e.dir[0] < 0 || e.dir[1] < 0) {
					selected = (selected + choices.length - 1) % choices.length;
				}
				draw();
			}
		});
	}

	ui.finishDialog();
	return choices[selected] || null;
}

ui.chooseTarget = chooseTarget;


async function inputNumberBox(opts, prompt, args) {

  let text$1;
  if (typeof opts === 'number') {
    opts = { max: opts };
  }
  else if (typeof opts === 'string') {
    args = prompt;
    prompt = opts;
    opts = {};
  }
  if (prompt) {
    prompt = GW.messages[prompt] || prompt;
    text$1 = apply(prompt, args);
  }

  setDefaults(opts, {
    allowCancel: true,
    min: 1,
    max: 99,
    number: true,
    bg: 'black',
  });

  const buffer = ui.startDialog();
  buffer.mix('black', 50);

	const btnOK = 'OK=Enter';
	const btnCancel = 'Cancel=Escape';
  const len = Math.max(text$1.length, btnOK.length + 4 + btnCancel.length);
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 6, ' ', 'black', opts.bg);
	buffer.drawText(x + 2, y + 1, text$1);
  buffer.fillRect(x + 2, y + 2, len - 4, 1, ' ', 'gray', 'gray');
	buffer.drawText(x + 2, y + 4, btnOK);
  if (opts.allowCancel) {
    buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 4, btnCancel);
  }
	buffer.render();

  const value = await ui.getInputAt(x + 2, y + 2, len - 4, opts);

	ui.finishDialog();
	return Number.parseInt(value);
}

ui.inputNumberBox = inputNumberBox;


// assumes you are in a dialog and give the buffer for that dialog
async function getInputAt(x, y, maxLength, opts={})
{
  let defaultEntry = opts.default || '';
  let numbersOnly = opts.number || opts.numbers || opts.numbersOnly || false;

	const textEntryBounds = (numbersOnly ? ['0', '9'] : [' ', '~']);

  const buffer = GW.ui.startDialog();
	maxLength = Math.min(maxLength, buffer.width - x);

	let inputText = defaultEntry;
	let charNum = GW.text.length(inputText);

  let ev;
	do {
    buffer.render();

		ev = await GW.io.nextKeyPress(-1);
		if ( (ev.key == 'Delete' || ev.key == 'Backspace') && charNum > 0) {
			buffer.draw(x + charNum - 1, y, ' ', 'white');
			charNum--;
			inputText = spliceRaw(inputText, charNum, 1);
		} else if (ev.key.length > 1) ; else if (ev.key >= textEntryBounds[0]
				   && ev.key <= textEntryBounds[1]) // allow only permitted input
		{
			if (charNum < maxLength) {
        if (numbersOnly) {
          const value = Number.parseInt(inputText + ev.key);
          if (opts.min !== undefined && value < opts.min) {
            continue;
          }
          if (opts.max !== undefined && value > opts.max) {
            continue;
          }
        }
        inputText += ev.key;
  			buffer.draw(x + charNum, y, ev.key, 'white');
				charNum++;
			}
		}

		if (ev.key == 'Escape') {
      GW.ui.finishDialog();
			return '';
		}

	} while ((!inputText.length) || ev.key != 'Enter');

  GW.ui.finishDialog();
  // GW.ui.draw(); // reverts to old display
	return inputText;
}

ui.getInputAt = getInputAt;


// DIALOG

const UI_LAYERS = [];
const BUFFERS = [];

function startDialog() {
  IN_DIALOG = true;
  const base = UI_OVERLAY || UI_BUFFER;
  UI_LAYERS.push(base);
  UI_OVERLAY = BUFFERS.pop() || new Buffer(ui.canvas);
  // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
  UI_OVERLAY.copy(base);
  return UI_OVERLAY;
}

ui.startDialog = startDialog;

function resetDialog() {
	if (IN_DIALOG) {
    const base = UI_LAYERS[UI_LAYERS.length - 1] || UI_BUFFER;
		UI_OVERLAY.copy(base);
	}
}

ui.resetDialog = resetDialog;

function finishDialog() {
  if (!IN_DIALOG) return;

  BUFFERS.push(UI_OVERLAY);
  UI_OVERLAY = UI_LAYERS.pop() || UI_BUFFER;
  UI_OVERLAY.render();

  IN_DIALOG = (UI_LAYERS.length > 0);
}

ui.finishDialog = finishDialog;

// DRAW

function draw() {
  if (IN_DIALOG) {
    // ui.canvas.overlay(UI_BASE);
    UI_OVERLAY.render();
  }
  else if (ui.canvas && data.map) {
    // const side = GW.sidebar.draw(UI_BUFFER);
    if (viewport.bounds) viewport.draw(UI_BUFFER);
		if (message.bounds) message.draw(UI_BUFFER);
		if (flavor.bounds) flavor.draw(UI_BUFFER);
    if (sidebar.bounds) sidebar.draw(UI_BUFFER);

    // if (commitCombatMessage() || REDRAW_UI || side || map) {
    UI_BUFFER.render();
			UPDATE_REQUESTED = 0;
    // }
  }
}

ui.draw = draw;

// Helpers

// UI

function plotProgressBar(buf, x, y, width, barText, textColor, pct, barColor) {
  if (pct > 1) pct /= 100;
  pct = clamp(pct, 0, 1);

	barColor = make$2(barColor);
  textColor = make$2(textColor);
  const darkenedBarColor = barColor.clone().mix(colors.black, 75);

  barText = center(barText, width);

  const currentFillColor = GW.make.color();
  const currentTextColor = GW.make.color();
	for (let i=0; i < width; i++) {
		currentFillColor.copy(i <= (width * pct) ? barColor : darkenedBarColor);
		if (i == Math.floor(width * pct)) {
      const perCell = Math.floor(1000 / width);
      const rem = (1000 * pct) % perCell;
			currentFillColor.mix(colors.black, 75 - Math.floor(75 * rem / perCell));
		}
		currentTextColor.copy(textColor);
		currentTextColor.mix(currentFillColor, 25);
		buf.draw(x + i, y, barText[i], currentTextColor, currentFillColor);
	}
}

ui.plotProgressBar = plotProgressBar;

const interfaceButtonColor = 	addKind('interfaceButtonColor', 	18,		15,		38,		0,		0,			0,			0,		false);
const buttonHoverColor = addKind('buttonHoverColor', 			100,	70,		40,		0,		0,			0,			0,		false);
const titleButtonColor = addKind('titleButtonColor', 			23,		15,		30,		0,		0,			0,			0,		false);


const ButtonState = {
	BUTTON_NORMAL: 0,
	BUTTON_HOVER: 1,
	BUTTON_PRESSED: 2,
};

const ButtonFlags = installFlag('button', {
	B_DRAW					: Fl(0),
	B_ENABLED				: Fl(1),
	B_GRADIENT				: Fl(2),
	B_HOVER_ENABLED			: Fl(3),
	B_WIDE_CLICK_AREA		: Fl(4),
	B_KEYPRESS_HIGHLIGHT	: Fl(5),
});


class Button {
	constructor(opts={}) {
    this.init(opts);
	}

  clear() {
    	this.text = ''; // [COLS*3];			// button label; can include color escapes
    	this.x = 0;					// button's leftmost cell will be drawn at (x, y)
    	this.y = 0;
    	this.hotkey = []; // [10];		// up to 10 hotkeys to trigger the button
    	this.color = make.color();			// background of the button; further gradient-ized when displayed
    	this.opacity = 0;				// further reduced by 50% if not enabled
    	this.symbol = [];	//[COLS]		// Automatically replace the nth asterisk in the button label text with
    								// the nth character supplied here, if one is given.
    								// (Primarily to display magic character and item symbols in the inventory display.)
    	this.flags = 0;
      this.state = 0;
  }

  init(opts={}) {
    this.clear();

    this.flags |= (ButtonFlags.B_ENABLED | ButtonFlags.B_GRADIENT | ButtonFlags.B_HOVER_ENABLED | ButtonFlags.B_DRAW | ButtonFlags.B_KEYPRESS_HIGHLIGHT);

    this.state = 0;
  	this.color.copy(opts.color || interfaceButtonColor);
  	this.opacity = opts.opacity || this.opacity || 100;
    this.text = opts.text || this.text || '';
    this.x = opts.x || this.x || 0;
    this.y = opts.y || this.y || 0;

    if (opts.hotkey) {
      if (!Array.isArray(opts.hotkey)) {
        opts.hotkey = [opts.hotkey];
      }
      this.hotkey = opts.hotkey.slice();
    }
  }

  draw(buffer) {
    let width, midPercent, symbolNumber, opacity;
  	let fColor = make.color(), bColor = make.color(), fColorBase, bColorBase, bColorEdge, bColorMid;

  	if (!(this.flags & ButtonFlags.B_DRAW)) {
  		return;
  	}

  	symbolNumber = 0;

  	width = length(this.text);
  	bColorBase = this.color.clone();
  	fColorBase = ((this.flags & ButtonFlags.B_ENABLED) ? colors.white : colors.gray).clone();

  	if (this.state == ButtonState.BUTTON_HOVER && (this.flags & ButtonFlags.B_HOVER_ENABLED)) {
  		//applyColorAugment(&fColorBase, &buttonHoverColor, 20);
  		//applyColorAugment(&bColorBase, &buttonHoverColor, 20);
  		fColorBase.mix(buttonHoverColor, 25);
  		bColorBase.mix(buttonHoverColor, 25);
  	}

  	bColorEdge = bColorBase.clone();
  	bColorMid	= bColorBase.clone();
  	bColorEdge.mix(colors.black, 50);

  	if (this.state == ButtonState.BUTTON_PRESSED) {
  		bColorMid.mix(colors.black, 75);
  		if (diff(bColorMid, bColorBase) < 50) {
  			bColorMid	= bColorBase;
  			bColorMid.mix(buttonHoverColor, 50);
  		}
  	}
  	// bColor = bColorMid.clone();

  	opacity = this.opacity;
  	if (this.state == ButtonState.BUTTON_HOVER || this.state == ButtonState.BUTTON_PRESSED) {
  		opacity = Math.floor(100 - ((100 - opacity) * opacity / 100)); // Apply the opacity twice.
  	}

    eachChar(this.text, (ch, color$1, bg, i) => {
      if (typeof color$1 === 'string') {
        color$1 = from(color$1);
      }
      fColor.copy(color$1 || fColorBase);

      if (this.flags & ButtonFlags.B_GRADIENT) {
        midPercent = smoothHiliteGradient(i, width - 1);
  			bColor.copy(bColorEdge);
  			bColor.mix(bColorMid, midPercent);
  		}
      else {
        bColor.copy(bColorMid);
      }

  		if (this.state == ButtonState.BUTTON_PRESSED) {
  			fColor.mix(bColor, 30);
  		}

  		if (this.opacity < 100) {
  			fColor.mix(bColor, 100 - opacity);
  		}

  		fColor.bake();
  		bColor.bake();
  		separate(fColor, bColor);

  		if (ch === '*') {
  			if (this.symbol[symbolNumber]) {
  				ch = this.symbol[symbolNumber];
  			}
  			symbolNumber++;
  		}

      // opacity?
			buffer.draw(this.x + i, this.y, ch, fColor, bColor);

    });

  }

}

types.Button = Button;

make.button = ((opts) => new Button(opts));



class Buttons {
  constructor() {
    // Indices of the buttons that are doing stuff:
		this.buttonFocused = -1;
		this.buttonDepressed = -1;
    this.buttonChosen = -1;

		// The buttons themselves:
		this.buttons = [];

		// The window location, to determine whether a click is a cancelation:
		// winX: 0,
		// winY: 0,
		// winWidth: 0,
		// winHeight: 0,

		// Graphical buffers:
		// dbuf, // cellDisplayBuffer [COLS][ROWS]; // Where buttons are drawn.
		// rbuf, // cellDisplayBuffer [COLS][ROWS]; // Reversion screen state.
  }

  init(buttons) {
  	// Initialize variables for the state struct:
  	this.buttonChosen = this.buttonFocused = this.buttonDepressed = -1;

  	// this.winX			= winX;
  	// this.winY			= winY;
  	// this.winWidth	= winWidth;
  	// this.winHeight	= winHeight;

    if (buttons) {
      this.buttons = buttons.slice();
    }
  }

  addButton(text, opts) {
    if (typeof text !== 'string') {
      opts = text;
      text = null;
    }
    opts = opts || {};
    if (text) {
      opts.text = text;
    }
    const button = make.button(opts);
    this.buttons.push(button);
    return button;
  }

  draw(buffer) {
    this.buttons.forEach( (button) => button.draw(buffer) );
  }

  _indexAtXY(x, y) {
    return this.buttons.findIndex( (button) => {
      return ((button.flags & ButtonFlags.B_DRAW)
        && (button.flags & ButtonFlags.B_ENABLED)
        && (button.y == y || ((button.flags & ButtonFlags.B_WIDE_CLICK_AREA) && Math.abs(button.y - y) <= 1))
        && x >= button.x
        && x < button.x + length(button.text));
    });
  }

  async press(index) {
    if (this.buttonFocused >= 0) {
      this.buttons[this.buttonFocused].state = 0;
    }
    if (this.buttonDepressed >= 0) {
      this.buttons[this.buttonDepressed].state = 0;
    }

    this.buttonFocused = this.buttonDepressed = this.buttonChosen = index;
    if (index >= 0) {
      this.buttons[index].state = ButtonState.BUTTON_PRESSED;

      console.log('DO BUTTON ACTION!');
    }
  }

  focus(index) {
    if (this.buttonFocused >= 0) {
      this.buttons[this.buttonFocused].state = 0;
    }
    this.buttonFocused = index;

    if (this.buttonDepressed >= 0) {
      this.buttons[this.buttonDepressed].state = 0;
    }
    this.buttonDepressed = this.buttonChosen = -1;

    if (index >= 0) {
      this.buttons[index].state = ButtonState.BUTTON_HOVER;
    }
  }

  async dispatchEvent(ev) {
    if (ev.type == def.MOUSEMOVE) {
      const index = this._indexAtXY(ev.x, ev.y);
      this.focus(index);
      return (index >= 0);
    }

    if (ev.type == def.CLICK) {
      const index = this._indexAtXY(ev.x, ev.y);
      await this.press(index);
      return (index >= 0);
    }
  	if (ev.type == def.KEYPRESS) {
      for(let index = 0; index < this.buttons.length; ++index) {
        const button = this.buttons[index];
        if (button.hotkey.indexOf(ev.key) >= 0) {
          await this.press(index);
          return true;
        }
      }

      if (ev.key === 'Enter' && this.buttonFocused >= 0) {
        await this.press(this.buttonFocused);
        return true;
      }
    }

    return false;
  }
}

types.Buttons = Buttons;

make.buttons = (() => new Buttons());

async function moveDir(actor, dir, opts={}) {

  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = opts.map || data.map;
  const cell = map.cell(newX, newY);
  const isPlayer = actor.isPlayer();

  const canBump = (opts.bump !== false);
  const ctx = { actor, map, x: newX, y: newY, cell };

  actor.debug('moveDir', dir);

  if (!map.hasXY(newX, newY)) {
    commands.debug('move blocked - invalid xy: %d,%d', newX, newY);
    message.forPlayer(actor, 'Blocked!');
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT, ENTANGLED

  if (cell.actor) {
    if (canBump && await cell.actor.bumpBy(actor, ctx)) {
      return true;
    }

    message.forPlayer(actor, '%s bump into %s.', actor.getName(), cell.actor.getName('the'));
    actor.endTurn(0.5);
    return true;
  }

  let isPush = false;
  if (cell.item && cell.item.hasKindFlag(ItemKind.IK_BLOCKS_MOVE)) {
    console.log('bump into item');
    if (!canBump || !(await cell.item.bumpBy(actor, ctx))) {
      console.log('bump - no action');
      message.forPlayer(actor, 'Blocked!');
      return false;
    }

    console.log('bump done', actor.turnEnded());
    if (actor.turnEnded()) {
      return true;
    }

    // if (!cell.item.hasActionFlag(Flags.Action.A_PUSH)) {
    //   ctx.item = cell.item;
    // }
    // const pushX = newX + dir[0];
    // const pushY = newY + dir[1];
    // const pushCell = map.cell(pushX, pushY);
    // if (!pushCell.isEmpty() || pushCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
    //   GW.message.forPlayer(actor, 'Blocked!');
    //   return false;
    // }
    //
    // ctx.item = cell.item;
    // map.removeItem(cell.item);
    // map.addItem(pushX, pushY, ctx.item);
    isPush = true;
    // Do we need to activate stuff - key enter, key leave?
  }

  // Can we enter new cell?
  if (cell.hasTileFlag(Tile.T_OBSTRUCTS_PASSABILITY)) {
    if (isPlayer) {
      message.forPlayer(actor, 'Blocked!');
      // TURN ENDED (1/2 turn)?
      await flashSprite(map, newX, newY, 'hit', 50, 1);
    }
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    if (isPlayer)  {
      message.forPlayer(actor, 'Blocked!');
      // TURN ENDED (1/2 turn)?
      await flashSprite(map, newX, newY, 'hit', 50, 1);
    }
    return false;
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(Tile.T_LAVA) && !cell.hasTileFlag(Tile.T_BRIDGE)) {
    if (!isPlayer) return false;
    if (!await ui.confirm('That is certain death!  Proceed anyway?')) {
      return false;
    }
  }
  else if (cell.hasTileFlag(Tile.T_HAS_STAIRS)) {
    if (actor.grabbed) {
      message.forPlayer(actor, '%s cannot use stairs while holding %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getFlavor());
      return false;
    }
  }

  if (actor.grabbed && !isPush) {
    const dirToItem = dirFromTo(actor, actor.grabbed);
    let destXY = [actor.grabbed.x + dir[0], actor.grabbed.y + dir[1]];
    const destCell = map.cell(destXY[0], destXY[1]);

    let blocked = (destCell.item || destCell.hasTileFlag(Tile.T_OBSTRUCTS_ITEMS | Tile.T_OBSTRUCTS_PASSABILITY));
    if (isOppositeDir(dirToItem, dir)) {  // pull
      if (!actor.grabbed.hasActionFlag(Action.A_PULL)) {
        message.forPlayer(actor, '%s cannot pull %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getFlavor());
        return false;
      }
    }
    else {  // slide
      if (!actor.grabbed.hasActionFlag(Action.A_SLIDE)) {
        message.forPlayer(actor, '%s cannot slide %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getFlavor());
        return false;
      }
      if (destCell.actor) {
        blocked = true;
      }
    }

    if (blocked) {
      message.forPlayer(actor, '%s let go of %s.', actor.getName(), actor.grabbed.getName('a'));
      await flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
      actor.grabbed = null;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    ERROR('Move failed! ' + newX + ',' + newY);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  if (actor.isPlayer()) {
    map.clearCellFlags(actor.x, actor.y, Cell.IS_IN_PATH);
  }

  if (actor.grabbed && !isPush) {
    map.removeItem(actor.grabbed);
    map.addItem(actor.grabbed.x + dir[0], actor.grabbed.y + dir[1], actor.grabbed);
  }

  // APPLY EFFECTS
  for(let tile of cell.tiles()) {
    await tile.applyInstantEffects(map, newX, newY, cell);
    if (data.gameHasEnded) {
      return true;
    }
  }

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)
  let fired = false;
  if (isPlayer) {
    fired = await cell.fireEvent('playerEnter', ctx);
  }
  if (!fired) {
    await cell.fireEvent('enter', ctx);
  }

  if (cell.hasTileFlag(Tile.T_HAS_STAIRS) && isPlayer) {
    console.log('Use stairs!');
    await useStairs(newX, newY);
  }

  // auto pickup any items
  if (config.autoPickup && cell.item && isPlayer) {
    await actions.pickup(actor, cell.item, ctx);
  }

  actions.debug('moveComplete');

  if (actor.isPlayer()) {
    ui.updatePathToCursor();
  }

  ui.requestUpdate();
  actor.endTurn();
  return true;
}

actions.moveDir = moveDir;

message.addKind('BASH_NO', '§you§ cannot bash §item§.');
message.addKind('BASH_ITEM', '§you§ §bash§ §the item§ [-§damage§].');
message.addKind('BASH_DESTROYED', '§the item§ §is§ destroyed.');

async function bashItem(actor, item, ctx) {

  const map = ctx.map || data.map;

  if (!item.hasActionFlag(Action.A_BASH)) {
    if (!ctx.quiet) message.add('BASH_NO', { actor, item });
    return false;
  }

  let success = false;
  if (item.kind.bash) {
    success = await item.kind.bash(item, actor, ctx);
    if (!success) return false;
  }
  else if (actor) {
    const damage = actor.kind.calcBashDamage(actor, item, ctx);
    if (item.kind.applyDamage(item, damage, actor, ctx)) {
      if (actor.isPlayer()) message.add('BASH_ITEM', { actor, item, damage });
      await flashSprite(map, item.x, item.y, 'hit', 100, 1);
    }
  }
  else {
    item.kind.applyDamage(item, ctx.damage || 1, null, ctx);
  }

  if (item.isDestroyed()) {
    map.removeItem(item);
    if (actor.isPlayer()) message.add('BASH_DESTROYED', { item });
    if (item.kind.corpse) {
      await spawn(item.kind.corpse, { map, x: item.x, y: item.y });
    }
  }
  if (actor) {
    actor.endTurn();
  }
  console.log('bash done', actor.turnEnded());
  return true;
}

actions.bashItem = bashItem;

message.addKind('PICKUP_NO', '§you§ cannot pickup §the item§.');
message.addKind('PICKUP_ITEM', '§you§ §pickup§ §the item§.');

async function pickup(actor, item, ctx) {

  if (!actor.hasActionFlag(Action.A_PICKUP)) return false;
  if (item.hasActionFlag(Action.A_NO_PICKUP)) {
    message.add('PICKUP_NO', { actor, item });
    return false;
  }

  const map = ctx.map || data.map;
  map.removeItem(item);

  let success = false;
  if (!config.inventory) {
    if (item.kind.slot) {
      success = await actions.equip(actor, item, ctx);
    }
    else {
      success = await actions.use(actor, item, ctx);
    }
    ctx.quiet = true; // no need to log the pickup - we did that in either 'equip' or 'use'
  }
  else if (item.kind.pickup) {
    success = await item.kind.pickup(item, actor, ctx);
  }
  else {
    success = actor.addToPack(item);
  }

  if (!success) {
    // put item back on floor
    map.addItem(item.x, item.y, item);
    return false;
  }

  if ((item.kind.flags & ItemKind.IK_EQUIP_ON_PICKUP) && item.kind.slot) {
    await actions.equip(actor, item, ctx);
  }
  else if (item.kind.flags & ItemKind.IK_USE_ON_PICKUP) {
    await actions.use(actor, item, ctx);
  }
  else if (!ctx.quiet) {
    message.add('PICKUP_ITEM', { actor, item });
  }

  actor.endTurn();
  return true;
}

actions.pickup = pickup;

async function openItem(actor, item, ctx={}) {
  return false;
}

actions.openItem = openItem;

async function closeItem(actor, item, ctx={}) {
  return false;
}

actions.closeItem = closeItem;

// Mostly handles arranging that the correct attack occurs
// Uses GW.combat functions to do most of the work
async function attack$1(actor, target, ctx={}) {

  if (actor.isPlayer() == target.isPlayer()) return false;

  const type = ctx.type = ctx.type || 'melee';
  const map = ctx.map = ctx.map || data.map;
  const kind = actor.kind;

  // custom combat function
  // TODO - Should this be 'GW.config.attack'?
  if (config.combat) {
    return config.combat(actor, target, ctx);
  }

  if (actor.grabbed) {
    message.forPlayer(actor, '%s cannot attack while holding %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getName('the'));
    return false;
  }

  // is this an attack by the player with an equipped item?
  const item = actor.slots[type];
  if (item) {
    if (await actions.itemAttack(actor, target, ctx)) {
      return true;
    }
  }

  const attacks = kind.attacks;
  if (!attacks) return false;

  const info = attacks[type];
  if (!info) return false;

  const dist = Math.floor(distanceFromTo(actor, target));
  if (dist > (info.range || 1)) {
    return false;
  }

  if (info.fn) {
    return await info.fn(actor, target, ctx); // custom attack
  }

  ctx.damage = actor.calcDamageTo(target, info, ctx);
  await applyDamage(actor, target, info, ctx);

  if (target.isPlayer() && target.isDead()) {
    await Game.gameOver(false, 'Killed by §attacker§.', { actor });
  }

  actor.endTurn();
  return true;
}

actions.attack = attack$1;

async function itemAttack(actor, target, ctx={}) {

  if (actor.isPlayer() == target.isPlayer()) return false;

  const slot = ctx.slot || ctx.type || 'ranged';
  const map = ctx.map || data.map;
  const kind = actor.kind;

  if (actor.grabbed) {
    message.forPlayer(actor, '%s cannot attack while holding %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getName('the'));
    return false;
  }

  const item = ctx.item || actor.slots[slot];
  if (!item) {
    return false;
  }

  const range = item.stats.range || 1;
  let damage  = item.stats.damage || 1;
  const verb  = item.kind.verb || 'hit';

  const dist = Math.floor(distanceFromTo(actor, target));
  if (dist > (range)) {
    return false;
  }

  if (item.kind.projectile) {
    await projectile(map, actor, target, item.kind.projectile);
  }

  if (typeof damage === 'function') {
    damage = damage(actor, target, ctx) || 1;
  }

  damage = target.kind.applyDamage(target, damage, actor, ctx);
  message.addCombat('§you§ §verb§ §the target§ for ΩredΩ§damage§∆ damage', { actor, verb, target, damage });

  if (target.isDead()) {
    message.addCombat('§action§ §it target§', { action: target.isInanimate() ? 'destroying' : 'killing', target });
  }

  const ctx2 = { map: map, x: target.x, y: target.y, volume: damage };

  await hit(data.map, target);
  if (target.kind.blood) {
    await spawn(target.kind.blood, ctx2);
  }
  if (target.isDead()) {
    target.kill();
    map.removeActor(target);
    if (target.kind.corpse) {
      await spawn(target.kind.corpse, ctx2);
    }
    if (target.isPlayer()) {
      await gameOver(false, 'Killed by §actor§.', { actor });
    }
  }

  actor.endTurn();
  return true;
}

actions.itemAttack = itemAttack;

async function moveToward(actor, x, y, ctx) {

  const map = ctx.map || data.map;
  const destCell = map.cell(x, y);
  const fromCell = map.cell(actor.x, actor.y);

  if (actor.x == x && actor.y == y) {
    return false; // Hmmm...  Not sure on this one
  }

  if (destCell.isVisible() && fromCell.isVisible()) {
    const dir = dirBetween(actor.x, actor.y, x, y); // TODO = try 3 directions direct, -45, +45
    const spread = dirSpread(dir);
    ctx.bump = false;
    for(let i = 0; i < spread.length; ++i) {
      const d = spread[i];
      if (await actions.moveDir(actor, d, ctx)) {
        return true;
      }
    }
    ctx.bump = true;
  }

  let travelGrid = actor.travelGrid;
  if (!travelGrid) {
    travelGrid = actor.travelGrid = alloc(map.width, map.height);
    travelGrid.x = travelGrid.y = -1;
  }
  if (travelGrid.x != x || travelGrid.y != y) {
    const costGrid = alloc(map.width, map.height);
    actor.fillCostGrid(map, costGrid);
    calculateDistances(travelGrid, x, y, costGrid, true);
    free(costGrid);
  }

  const dir = nextStep(map, travelGrid, actor.x, actor.y, actor, true);
  if (!dir) return false;

  return await actions.moveDir(actor, dir, ctx);
}



actions.moveToward = moveToward;

async function grab$1(actor, item, ctx={}) {
  if (!item) return false;

  const map = ctx.map || data.map;

  if (!actor.isPlayer()) return false;

  if (actor.grabbed) {
    if (actor.grabbed === item) {
      return false; // already grabbed
    }
    return await actions.release(actor, actor.grabbed, ctx);
  }

  actor.grabbed = item;
  message.add('§you§ §grab§ §a item§.', { actor, item: actor.grabbed });
  await flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.endTurn();
  return true;
}

actions.grab = grab$1;


async function release(actor, item, ctx={}) {
  if (!actor.grabbed) return false;

  message.add('§you§ §let§ go of §a item§.', { actor, item: actor.grabbed });
  await flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.grabbed = null;
  actor.endTurn();
  return true;
}

actions.release = release;

async function push$1(actor, item, ctx={}) {
  if (!item) return false;

  const map = ctx.map || data.map;
  const cell = ctx.cell || map.cell(ctx.x, ctx.y);
  const dir = ctx.dir || dirFromTo(actor, item);

  if (!item.hasActionFlag(Action.A_PUSH)) {
    ctx.item = item;
    if (!ctx.quiet) {
      message.forPlayer(actor, 'Blocked!');
    }
    return false;
  }
  const pushX = item.x + dir[0];
  const pushY = item.y + dir[1];
  const pushCell = map.cell(pushX, pushY);
  if (!pushCell.isEmpty() || pushCell.hasTileFlag(Tile.T_OBSTRUCTS_ITEMS | Tile.T_OBSTRUCTS_PASSABILITY)) {
    if (!ctx.quiet) message.forPlayer(actor, 'Blocked!');
    return false;
  }

  ctx.item = item;
  map.removeItem(item);
  map.addItem(pushX, pushY, item);
  // Do we need to activate stuff - key enter, key leave?
  return true;
}

actions.push = push$1;

message.addKind('USE_NOTHING', 'Nothing happens.');

async function use(actor, item, ctx) {

  let success;
  if (item.kind.use) {
    success = await item.kind.use(item, actor, ctx);
    if (!success) return false;
  }
  else {
    message.add('USE_NOTHING', { actor, item });
    return false;
  }

  if (item.kind.flags & ItemKind.IK_DESTROY_ON_USE) {
    item.quantity -= 1;
  }

  if (item.quantity <= 0) {
    item.destroy();
  }

  if (item.isDestroyed()) {
    const map = ctx.map || data.map;
    if (map) {
      map.removeItem(item);
    }

    actor.removeFromPack(item);
  }

  actor.endTurn();
  return true;
}

actions.use = use;

message.addKind('EQUIP_NO', '§the item§ §do§ not seem to be equippable.');
message.addKind('EQUIP_FAILED', '§you§ failed to equip §the item§.');
message.addKind('EQUIP_SWAP', '§you§ §swap§ your §other§ for §your actor§ §item§.');
message.addKind('EQUIP_SWAP_FLOOR', '§you§ §swap§ your §other§ for §a item§.');
message.addKind('EQUIP_ITEM', '§you§ §equip§ §your §item§.');
message.addKind('EQUIP_ITEM_FLOOR', '§you§ §equip§ §a item§.');
message.addKind('EQUIP_ALREADY', 'already equipped.');


async function equip(actor, item, ctx={}) {
  if (!item) return false;

  const slot = item.kind.slot;
  if (!slot) {
    message.add('EQUIP_NO', { actor, item });
    return false;
  }

  let success;

  const other = actor.slots[slot];
  if (other) {
    if (other === item) {
      message.add('EQUIP_ALREADY', { actor, item });
      return false;
    }

    const quietCtx = Object.assign({ quiet: true }, ctx);
    success = await actions.unequip(actor, slot, quietCtx);
    if (!success) {
      return false;
    }
  }

  success = actor.equip(item);
  if (!success) {
    const article = chainIncludes(actor.pack, item) ? 'your' : true;
    message.add('EQUIP_FAILED', { actor, item });
    // TODO - Re-equip other?
    return false;
  }

  if (!ctx.quiet) {
    let id = (other) ? 'EQUIP_SWAP' : 'EQUIP_ITEM';
    if (!config.inventory) {
      id += '_FLOOR';
    }
    message.add(id, { actor, other, item });
  }

  if (actor.kind.calcEquipmentBonuses) {
    actor.kind.calcEquipmentBonuses(actor);
  }

  return true;
}

actions.equip = equip;


message.addKind('UNEQUIP_NO', '§the item§ does not seem to be equippable.');
message.addKind('UNEQUIP_NOT_EQUIPPED', '§the item§ does not seem to be equipped.');
message.addKind('UNEQUIP_FAIL', '§you§ cannot remove §your§ §item§.');
message.addKind('UNEQUIP_ITEM', '§you§ §remove§ §your§ §item§.');

async function unequip(actor, item, ctx={}) {
  if (!item) return false;

  let slot;

  if (typeof item === 'string') {
    slot = item;
  }
  else {
    slot = item.kind.slot;
    if (!slot) {
      message.add('UNEQUIP_NO', { item });
      return false;
    }
    if (actor.slots[slot] !== item) {
      message.add('UNEQUIP_NOT_EQUIPPED', { item });
      return false;
    }
  }

  item = actor.unequipSlot(slot); // will not change item unless it was a slot name

  // TODO - test for curse, etc...

  if (actor.slots[slot]) {
    // failed to unequip
    message.add('UNEQUIP_FAIL', { actor, item: actor.slots[slot] });
    return false;
  }

  if (!config.inventory) {
    const map = ctx.map || data.map;
    map.addItemNear(actor.x, actor.y, item);
  }

  if (item && !ctx.quiet) {
    // TODO - Custom verb? item.kind.equipVerb -or- Custom message? item.kind.equipMessage
    message.add('UNEQUIP_ITEM', { actor, item });
  }

  if (actor.kind.calcEquipmentBonuses) {
    actor.kind.calcEquipmentBonuses(actor);
  }

  return true;
}

actions.unequip = unequip;

async function talk$1(actor, target, ctx={}) {
  let talker = target;
  let listener = actor;
  if (!talker.kind.talk) {
    if (!actor.kind.talk) return false;
    talker = actor;
    listener = target;
  }

  const success = await talker.kind.talk(talker, listener, ctx);

  if (success !== false) {
    actor.endTurn();
    return true;
  }
  return false;
}

actions.talk = talk$1;

async function travel$1(actor, ctx={}) {

  const map = ctx.map || data.map;

  if (!actor.travelDest) {
    return false;
  }
  if (actor.travelDest[0] == actor.x && actor.travelDest[1] == actor.y) {
    actor.travelDest = null;
    ui.updatePathToCursor();
    return false;
  }

  actor.updateMapToMe();

  const path$1 = getPath(map, actor.mapToMe, actor.travelDest[0], actor.travelDest[1], actor);
  ui.updatePath(path$1);
  if (!path$1 || path$1.length <= 1) {  // 1 step is just the destination
    actor.travelDest = null;
    return false;
  }

  const dir = dirFromTo(actor, path$1[path$1.length - 2]);
  return await actions.moveDir(actor, dir, ctx);
}



actions.travel = travel$1;

async function idle(actor, ctx) {
  actor.debug('idle');
  actor.endTurn();
  return true;
}

ai.idle = { act: idle };


async function moveRandomly(actor, ctx) {
  const dirIndex = random.number(4);
  const dir = def.dirs[dirIndex];

  if (!await actions.moveDir(actor, dir, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

ai.moveRandomly = { act: moveRandomly };


async function attackPlayer(actor, ctx) {
  const player = data.player;

  const dist = distanceFromTo(actor, player);
  if (dist >= 2) return false;

  if (!await actions.attack(actor, player, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

ai.attackPlayer = { act: attackPlayer };

async function talkToPlayer(actor, ctx) {
  const player = data.player;

  if (!actor.kind.talk) return false;

  const dist = distanceFromTo(actor, player);
  if (dist >= 2) return false;

  if (!await actions.talk(actor, player, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

ai.talkToPlayer = { act: talkToPlayer };



async function moveTowardPlayer(actor, ctx={}) {

  const player = data.player;
  const map = ctx.map || data.map;
  const cell = map.cell(actor.x, actor.y);

  const dist = distanceFromTo(actor, player);
  if (dist < 2) return false; // Already next to player

  if (cell.flags & Cell.IN_FOV) {
    // actor in player FOV so actor can see player (if in range, light, etc...)
    if (dist < actor.kind.getAwarenessDistance(actor, player)) {
      actor.lastSeenPlayerAt = [player.x, player.y];
    }
  }

  if (actor.lastSeenPlayerAt) {
    if (!await actions.moveToward(actor, actor.lastSeenPlayerAt[0], actor.lastSeenPlayerAt[1], ctx)) {
      actor.lastSeenPlayerAt = null;  // cannot move toward this location, so stop trying
      return false;
    }
    if (actor.lastSeenPlayerAt[0] == actor.x && actor.lastSeenPlayerAt[1] == actor.y) {
      // at goal
      actor.lastSeenPlayerAt = null;
    }
    return true;
  }

  return false;
}

ai.moveTowardPlayer = { act: moveTowardPlayer };

// These are the minimal set of tiles to make the diggers work
const NOTHING$1 = def.NOTHING = 0;
addTileKind(NOTHING$1, {
  sprite: { ch:'\u2205', fg: 'white', bg: 'black' },
  flags: 'T_OBSTRUCTS_PASSABILITY',
  name: "eerie nothingness", article: 'an',
  priority: 0,
});

addTileKind('FLOOR', {
  sprite: { ch: '\u00b7', fg: [30,30,30,20], bg: [2,2,10,0,2,2,0] },
  priority: 10,
  article: 'the'
});

addTileKind('DOOR', {
  sprite: { ch: '+', fg: [100,40,40], bg: [30,60,60] },
  priority: 30,
  flags: 'T_IS_DOOR, T_OBSTRUCTS_TILE_EFFECTS, T_OBSTRUCTS_ITEMS, T_OBSTRUCTS_VISION, TM_VISUALLY_DISTINCT',
  article: 'a',
  events: {
    enter: { tile: 'DOOR_OPEN' },
    open:  { tile: 'DOOR_OPEN_ALWAYS' }
  }
});

addTileKind('DOOR_OPEN',  "DOOR", {
  sprite: { ch: "'", fg: [100,40,40], bg: [30,60,60] },
  priority: 40,
  flags: '!T_OBSTRUCTS_ITEMS, !T_OBSTRUCTS_VISION',
  name: 'open door',
  article: 'an',
  events: {
    tick: { tile: 'DOOR', flags: 'DFF_SUPERPRIORITY, DFF_ONLY_IF_EMPTY' },
    enter: null,
    open: null,
    close: { tile: 'DOOR', flags: 'DFF_SUPERPRIORITY, DFF_ONLY_IF_EMPTY' }
  }
});

addTileKind('DOOR_OPEN_ALWAYS',  "DOOR_OPEN", {
  events: { tick: null, close: { tile: 'DOOR', flags: 'DFF_SUPERPRIORITY, DFF_ONLY_IF_EMPTY' } }
});

addTileKind('BRIDGE', {
  sprite: { ch: '=', fg: [100,40,40] },
  priority: 40, layer: 'SURFACE',
  flags: 'T_BRIDGE, TM_VISUALLY_DISTINCT',
  article: 'a'
});

addTileKind('UP_STAIRS',   {
  sprite: { ch: '<', fg: [100,40,40], bg: [100,60,20] },
  priority: 200,
  flags: 'T_UP_STAIRS, T_STAIR_BLOCKERS, TM_VISUALLY_DISTINCT, TM_LIST_IN_SIDEBAR',
  name: 'upward staircase', article: 'an'
});
addTileKind('DOWN_STAIRS', {
  sprite: { ch: '>', fg: [100,40,40], bg: [100,60,20] },
  priority: 200,
  flags: 'T_DOWN_STAIRS, T_STAIR_BLOCKERS, TM_VISUALLY_DISTINCT, TM_LIST_IN_SIDEBAR',
  name: 'downward staircase', article: 'a'
});

addTileKind('WALL', {
  sprite: { ch: '#', fg: [7,7,7,0,3,3,3],  bg: [40,40,40,10,10,0,5] },
  priority: 100,
  flags: 'T_OBSTRUCTS_EVERYTHING',
  article: 'a'
});

addTileKind('LAKE', {
  sprite: { ch: '~', fg: [5,8,20,10,0,4,15,1], bg: [10,15,41,6,5,5,5,1] },
  priority: 50,
  flags: 'T_DEEP_WATER',
  name: 'deep water', article: 'the'
});

const MENU_FLAME_PRECISION_FACTOR =		10;
const MENU_FLAME_RISE_SPEED =					50;
const MENU_FLAME_SPREAD_SPEED =				20;
const MENU_FLAME_COLOR_DRIFT_SPEED =	500;
const MENU_FLAME_FADE_SPEED =					20;
const MENU_FLAME_ROW_PADDING =				2;

const MENU_FLAME_DENOMINATOR =				(100 + MENU_FLAME_RISE_SPEED + MENU_FLAME_SPREAD_SPEED);

const flameSourceColor  = addKind('flameSourceColor', 		20, 7,  7, 0, 60, 40, 40, true);
const flameSourceColorSecondary = addKind('flameSourceColorSecondary', 7, 	2, 0, 0, 10, 0, 	0, true);
const flameTitleColor = addKind('flameTitleColor', 		0, 0, 0, 0, 9, 9, 15, true); // *pale blue*;



const NULL_TITLE = [
  "#############    ######    ######          ######    ",
  "      ##       ##     ###   ##  ##       ##     ###  ",
  "      ##      ##       ###  ##   ###    ##       ### ",
  "      ##      #    #    ##  ##    ##    #    #    ## ",
  "      ##     ##   ##     ## ##     ##  ##   ##     ##",
  "      ##     ##   ###    ## ##      ## ##   ###    ##",
  "      ##     ##   ####   ## ##       # ##   ####   ##",
  "      ##     ##   ####   ## ##       # ##   ####   ##",
  "      ##     ##    ###   ## ##       # ##    ###   ##",
  "      ##     ###    ##   ## ##      #  ###    ##   ##",
  "      ##      ##    #    #  ##     ##   ##    #    # ",
  "      ##      ###       ##  ##    ##    ###       ## ",
  "      ##       ###     ##   ##   ##      ###     ##  ",
  "     ####        ######    ######          ######    ",
];

const NULL_VERSION = '0.0.0';



class Flames {
  constructor(buffer, opts={}) {
    this.buffer = buffer;

    this.mask = make.grid(buffer.width, buffer.height);
    this.flames = make.grid(buffer.width, buffer.height + MENU_FLAME_ROW_PADDING, () => [0, 0, 0] );
  	this.colorSources = []; 	// [red, green, blue, rand], one for each color source
  	this.colors = make.grid(buffer.width, buffer.height + MENU_FLAME_ROW_PADDING, null );
    this.colorStorage = make.array(buffer.width, () => make.color() );

    setDefaults(opts, {
      primary: flameSourceColor,
      secondary: flameSourceColorSecondary,
      'flames.#': flameTitleColor,
      version: NULL_VERSION,
      mask: NULL_TITLE,
    });

    this._initialize(opts);

    // Simulate the background flames for a while
  	for (let i=0; i<100; i++) {
  		this.update();
  	}

  }

  _initialize(opts={}) {

    this.version = opts.version;

    this.mask.fill(0);
    this.colors.fill(null);
    this.flames.forEach( (v, x, y) => {
      v[0] = v[1] = v[2] = 0;
    });

    // Put some flame source along the bottom row.
  	let colorSourceCount = 0;
    this.colorStorage.forEach( (c, i) => {
      c.copy(opts.primary);
      c.mix(opts.secondary, 100 - (smoothHiliteGradient(i, this.colors.width - 1) + 25));
      this.colors[i][this.colors.height - 1] = c;
      colorSourceCount++;
    });

    if (opts.mask) {
  		const title = opts.mask;
      const flames = opts.flames;

  		const MENU_TITLE_WIDTH =	title[0].length;
  		const MENU_TITLE_HEIGHT =	title.length;
      const x = Math.round((this.buffer.width - MENU_TITLE_WIDTH)/2);
      const y = Math.round((this.buffer.height - MENU_TITLE_HEIGHT)/2);

  		// Wreathe the title in flames, and mask it in black.
  		for (let i=0; i<MENU_TITLE_WIDTH; i++) {
  			for (let j=0; j<MENU_TITLE_HEIGHT; j++) {
          const char = title[j][i] || ' ';
  				if (char != ' ') {
  					const thisCol = x + i; /* + MENU_TITLE_OFFSET_X */
  					const thisRow = y + j; /* + MENU_TITLE_OFFSET_Y */
            if (char != '%') {
              this.colors[thisCol][thisRow] = opts.flames[char] || opts.flames['#'];
    					colorSourceCount++;
            }
  					this.mask[thisCol][thisRow] = (char == '#') ? 100 : 50;
  				}
  			}
  		}

  		// Anti-alias the mask.
  		// antiAlias(this.mask); // SWC - I am not sure I like the anti-alias look.
  	}

    // Seed source color random components.
    const rnd = cosmetic.range.bind(cosmetic, 0, 1000);
    for(let i = 0; i < colorSourceCount; ++i) {
      this.colorSources.push( [rnd(), rnd(), rnd(), rnd()] );
    }

  }

  update() {
    let i, j, k, l, x, y;
  	let tempFlames = make.array(this.flames.width, () => [0,0,0]);
  	let colorSourceNumber, rand;

  	colorSourceNumber = 0;
  	for (j=0; j < this.flames.height; j++) {

  		// Make a temp copy of the current row.
  		for (i=0; i<this.flames.width; i++) {
  			for (k=0; k<3; k++) {
  				tempFlames[i][k] = this.flames[i][j][k];
  			}
  		}

  		for (i=0; i<this.flames.width; i++) {
  			// Each cell is the weighted average of the three color values below and itself.
  			// Weight of itself: 100
  			// Weight of left and right neighbors: MENU_FLAME_SPREAD_SPEED / 2 each
  			// Weight of below cell: MENU_FLAME_RISE_SPEED
  			// Divisor: 100 + MENU_FLAME_SPREAD_SPEED + MENU_FLAME_RISE_SPEED

  			// Itself:
  			for (k=0; k<3; k++) {
  				this.flames[i][j][k] = Math.round(100 * this.flames[i][j][k] / MENU_FLAME_DENOMINATOR);
  			}

  			// Left and right neighbors:
  			for (l = -1; l <= 1; l += 2) {
  				x = i + l;
  				if (x == -1) {
  					x = this.flames.width - 1;
  				} else if (x == this.flames.width) {
  					x = 0;
  				}
  				for (k=0; k<3; k++) {
  					this.flames[i][j][k] += Math.floor(MENU_FLAME_SPREAD_SPEED * tempFlames[x][k] / 2 / MENU_FLAME_DENOMINATOR);
  				}
  			}

  			// Below:
  			y = j + 1;
  			if (y < this.flames.height) {
  				for (k=0; k<3; k++) {
  					this.flames[i][j][k] += Math.floor(MENU_FLAME_RISE_SPEED * this.flames[i][y][k] / MENU_FLAME_DENOMINATOR);
  				}
  			}

  			// Fade a little:
  			for (k=0; k<3; k++) {
  				this.flames[i][j][k] = Math.floor((1000 - MENU_FLAME_FADE_SPEED) * this.flames[i][j][k] / 1000);
  			}

  			if (this.colors[i][j]) {
  				// If it's a color source tile:

  				// First, cause the color to drift a little.
  				for (k=0; k<4; k++) {
  					this.colorSources[colorSourceNumber][k] += cosmetic.range(-MENU_FLAME_COLOR_DRIFT_SPEED, MENU_FLAME_COLOR_DRIFT_SPEED);
  					this.colorSources[colorSourceNumber][k] = clamp(this.colorSources[colorSourceNumber][k], 0, 1000);
  				}

  				// Then, add the color to this tile's flames.
  				rand = Math.floor(this.colors[i][j]._rand * this.colorSources[colorSourceNumber][0] / 1000);
  				this.flames[i][j][0] += Math.floor((this.colors[i][j]._r	+ (this.colors[i][j]._redRand	* this.colorSources[colorSourceNumber][1] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);
  				this.flames[i][j][1] += Math.floor((this.colors[i][j]._g	+ (this.colors[i][j]._greenRand	* this.colorSources[colorSourceNumber][2] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);
  				this.flames[i][j][2] += Math.floor((this.colors[i][j]._b	+ (this.colors[i][j]._blueRand	* this.colorSources[colorSourceNumber][3] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);

  				colorSourceNumber++;
  			}
  		}
  	}
  }



  draw() {
  	let i, j;
    const tempColor = make.color();
  	const maskColor = colors.black;
    let dchar;

  	const versionString = this.version;
    const versionStringLength = length(versionString);

  	for (j=0; j < this.buffer.height; j++) {
  		for (i=0; i < this.buffer.width; i++) {
        if (j == this.buffer.height - 1 && i >= this.buffer.width - versionStringLength) {
            dchar = versionString.charAt(i - (this.mask.width - versionStringLength));
        } else {
            dchar = ' ';
        }

  			if (this.mask[i][j] == 100) {
  				this.buffer.draw(i, j, dchar, colors.gray, maskColor);
  			} else {
          const flameColor = this.flames[i][j];
          tempColor.blackOut();
  				tempColor._r	= Math.round(flameColor[0] / MENU_FLAME_PRECISION_FACTOR);
  				tempColor._g	= Math.round(flameColor[1] / MENU_FLAME_PRECISION_FACTOR);
  				tempColor._b	= Math.round(flameColor[2] / MENU_FLAME_PRECISION_FACTOR);
  				if (this.mask[i][j] > 0) {
  					tempColor.mix(maskColor, this.mask[i][j]);
  				}
  				this.buffer.draw(i, j, dchar, colors.gray, tempColor);
  			}
  		}
  	}
  }

}

types.Flames = Flames;

var flames = {
  __proto__: null,
  Flames: Flames
};

exports.actions = actions;
exports.actor = actor;
exports.actorKinds = actorKinds;
exports.addListener = addListener;
exports.ai = ai;
exports.canvas = canvas;
exports.cell = cell;
exports.clearEvent = clearEvent;
exports.color = color;
exports.colors = colors;
exports.combat = combat$1;
exports.commands = commands$1;
exports.config = config;
exports.cosmetic = cosmetic;
exports.data = data;
exports.def = def;
exports.digger = digger;
exports.diggers = diggers;
exports.dungeon = dungeon;
exports.emit = emit;
exports.flag = flag;
exports.flags = flags;
exports.flames = flames;
exports.flavor = flavor;
exports.fov = fov;
exports.frequency = frequency$1;
exports.fx = fx;
exports.game = game;
exports.grid = grid;
exports.install = install;
exports.io = io;
exports.item = item$1;
exports.itemKinds = itemKinds;
exports.light = light;
exports.lights = lights;
exports.make = make;
exports.map = map$1;
exports.maps = maps;
exports.message = message;
exports.messages = messages;
exports.off = off;
exports.on = on;
exports.once = once;
exports.path = path;
exports.player = player;
exports.random = random;
exports.removeAllListeners = removeAllListeners;
exports.removeListener = removeListener;
exports.scheduler = scheduler;
exports.sidebar = sidebar;
exports.sprite = sprite;
exports.sprites = sprites;
exports.text = text;
exports.tile = tile;
exports.tileEvent = tileEvent$1;
exports.tileEvents = tileEvents$1;
exports.tiles = tiles;
exports.types = types;
exports.ui = ui;
exports.utils = utils$1;
exports.viewport = viewport;
exports.visibility = visibility;
