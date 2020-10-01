var def = {};
var types = {};

var make = {};
var install = {};

var utils$1 = {};

var ui = {};
var message = {};
var viewport = {};
var flavor = {};

var fx = {};
var commands = {};

var itemKinds = {};
var item = {};

var flag = {};
var flags = {};

var config = {
  fx: {},
};
var data = {};

def.dirs    = [[0,-1], [0,1],  [-1,0], [1,0],  [-1,-1], [1,1],   [-1,1], [1,-1]];
def.oppDirs = [[0,1],  [0,-1], [1,0],  [-1,0], [1,1],   [-1,-1], [1,-1], [-1,1]];
def.clockDirs = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

def.NO_DIRECTION = -1;
def.UP = 0;
def.DOWN = 1;
def.LEFT = 2;
def.RIGHT = 3;
def.LEFT_UP = 4;
def.RIGHT_DOWN = 5;
def.LEFT_DOWN = 6;
def.RIGHT_UP = 7;

class Bounds {
  constructor(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = w || 0;
    this.height = h || 0;
  }

  containsXY(x, y) {
    return this.width > 0
      && this.x <= x
      && this.y <= y
      && this.x + this.width > x
      && this.y + this.height > y;
  }

  toInnerX(x) { return x - this.x; }
  toInnerY(y) { return y - this.y; }

  toOuterX(x) {
    let offset = 0;
    if (x < 0) { offset = this.width - 1; }
    return x + this.x + offset;
  }
  toOuterY(y) {
    let offset = 0;
    if (y < 0) { offset = this.height - 1; }
    return y + this.y + offset;
  }
}

types.Bounds = Bounds;

function NOOP()  {}
utils$1.NOOP = NOOP;

function TRUE()  { return true; }
utils$1.TRUE = TRUE;

function FALSE() { return false; }
utils$1.FALSE = FALSE;

function IDENTITY(x) { return x; }
utils$1.IDENTITY = IDENTITY;


function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

utils$1.clamp = clamp;

function x(src) {
  return src.x || src[0] || 0;
}

utils$1.x = x;

function y(src) {
  return src.y || src[1] || 0;
}

utils$1.y = y;

function copyXY(dest, src) {
  dest.x = utils$1.x(src);
  dest.y = utils$1.y(src);
}

utils$1.copyXY = copyXY;

function addXY(dest, src) {
  dest.x += utils$1.x(src);
  dest.y += utils$1.y(src);
}

utils$1.addXY = addXY;

function equalsXY(dest, src) {
  return (dest.x == utils$1.x(src))
  && (dest.y == utils$1.y(src));
}

utils$1.equalsXY = equalsXY;

function distanceBetween(x1, y1, x2, y2) {
  const x = Math.abs(x1 - x2);
  const y = Math.abs(y1 - y2);
  const min = Math.min(x, y);
  return x + y - (0.6 * min);
}

utils$1.distanceBetween = distanceBetween;

function distanceFromTo(a, b) {
  return distanceBetween(utils$1.x(a), utils$1.y(a), utils$1.x(b), utils$1.y(b));
}

utils$1.distanceFromTo = distanceFromTo;

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

utils$1.dirBetween = dirBetween;

function dirFromTo(a, b) {
  return dirBetween(utils$1.x(a), utils$1.y(a), utils$1.x(b), utils$1.y(b));
}

utils$1.dirFromTo = dirFromTo;

function dirIndex(dir) {
  return def.dirs.findIndex( (a) => a[0] == dir[0] && a[1] == dir[1] );
}

utils$1.dirIndex = dirIndex;


function extend(obj, name, fn) {
  const base = obj[name] || NOOP;
  const newFn = fn.bind(obj, base.bind(obj));
  newFn.fn = fn;
  newFn.base = base;
  obj[name] = newFn;
}

utils$1.extend = extend;

function rebase(obj, name, newBase) {
  const fns = [];
  let fn = obj[name];

  while(fn && fn.fn) {
    fns.push(fn.fn);
    fn = fn.base;
  }

  obj[name] = newBase;

  while(fns.length) {
    fn = fns.pop();
    extend(obj, name, fn);
  }
}

utils$1.rebase = rebase;

function cloneObject(obj) {
  const other = Object.create(obj.__proto__);
  utils$1.assignObject(other, obj);
  return other;
}

utils$1.cloneObject = cloneObject;

function assignField(dest, src, key) {
  const current = dest[key];
  const updated = src[key];
  if (current && current.copy && updated) {
    current.copy(updated);
  }
  else if (current && current.clear && !updated) {
    current.clear();
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

utils$1.copyObject = copyObject;

function assignObject(dest, src) {
  Object.keys(src).forEach( (key) => {
    assignField(dest, src, key);
  });
}

utils$1.assignObject = assignObject;

function setDefault(obj, field, val) {
  if (obj[field] === undefined) {
    obj[field] = val;
  }
}

utils$1.setDefault = setDefault;

function setDefaults(obj, def) {
  Object.keys(def).forEach( (key) => {
    const current = obj[key];
    if (current === undefined) {
      obj[key] = def[key];
    }
  });
}

utils$1.setDefaults = setDefaults;

function ERROR(message) {
  throw new Error(message);
}

utils$1.ERROR = ERROR;

function WARN(...args) {
  console.warn(...args);
}

utils$1.WARN = WARN;

function getOpt(obj, member, _default) {
  const v = obj[member];
  if (v === undefined) return _default;
  return v;
}

utils$1.getOpt = getOpt;


function first(field, ...args) {
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

utils$1.first = first;

function arraysIntersect(a, b) {
  return a.some( (av) => b.includes(av) );
}

utils$1.arraysIntersect = arraysIntersect;


function sequence(listLength) {
  const list = [];
  let i;
  for (i=0; i<listLength; i++) {
      list[i] = i;
  }
  return list;
}

utils$1.sequence = sequence;

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
      value = value.split(/[,|]/).map( (t) => t.trim() );
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

///////////////////////////////////
// ENUM

// export var enums = {};
// export var enum = {};

class Enum {
  constructor(...names) {
    let offset = 0;
    if (typeof names[0] === 'number') {
      offset = names.shift();
    }
    names.forEach( (name, index) => {
      this[name] = def[name] = index + offset;
    });
  }

  toString(v) {
    if (v === undefined) return JSON.stringify(this);
    return Object.entries(this).reduce( (out, [key, value]) => (value == v) ? key : out, '?' );
  }
}

types.Enum = Enum;

// export function installEnum(enumName, ...names) {
//   const out = new types.Enum(...names);
//   enums[enumName] = out;
//   return out;
// }
//
// enum.install = installEnum;

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
			utils$1.WARN('Lottery Draw - no frequencies', frequencies, frequencies.length);
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
    utils$1.WARN('Lottery Draw failed.', frequencies, frequencies.length);
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
    this.debug = utils$1.NOOP;
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
    if (Array.isArray(weights)) {
      return lotteryDrawArray(this, weights);
    }
    return lotteryDrawObject(this, weights);
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

  chance(percent) {
    if (percent <= 0) return false;
    if (percent >= 100) return true;
  	return (this.range(0, 99) < percent);
  }

  item(list) {
  	return list[this.range(0, list.length - 1)];
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

  if (typeof config == 'function') utils$1.ERROR('Custom range functions not supported - extend Range');

  if (config === undefined || config === null) return new Range(0, 0, 0, rng);
  if (typeof config == 'number') return new Range(config, config, 1, rng);

  if (config === true || config === false) utils$1.ERROR('Invalid random config: ' + config);

  if (Array.isArray(config)) {
		return new Range(config[0], config[1], config[2], rng);
	}
  if (config.lo !== undefined) {
    return new Range(config.lo, config.hi, config.clumps, rng);
  }
  if (typeof config !== 'string') {
    utils$1.ERROR('Calculations must be strings.  Received: ' + JSON.stringify(config));
  }
  if (config.length == 0) return new Range(0);

	const RE = /^(?:([+-]?\d*)[Dd](\d+)([+-]?\d*)|([+-]?\d+)-(\d+):?(\d+)?|([+-]?\d+\.?\d*))/g;
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
		else if (results[7]) {
      const v = Number.parseFloat(results[7]);
      return new Range(1, v, 1, rng);
    }
  }

  return null;  // This is not a valid range
}

make.range = makeRange;

var color = {};
var colors = {};


class Color extends Array {
  constructor(...args) {
    if (args.length == 1 && Array.isArray(args[0])) { args = args[0]; }
    while(args.length < 7) args.push(0);
    super(...args.slice(0,7));
    this.dances = (args.length > 7 && !!args[7]);
  }

  get red() 	{ return this[0]; }
  set red(v)  { this[0] = v; }
  get green()  { return this[1]; }
  set green(v) { this[1] = v; }
  get blue() 	{ return this[2]; }
  set blue(v) { this[2] = v; }

  get rand() 	{ return this[3]; }
  set rand(v)  { this[3] = v; }

  get redRand() 	{ return this[4]; }
  set redRand(v)  { this[4] = v; }
  get greenRand()  { return this[5]; }
  set greenRand(v) { this[5] = v; }
  get blueRand() 	{ return this[6]; }
  set blueRand(v) { this[6] = v; }

  clone() {
    const other = new Color(...this);
    other.dances = this.dances;
    return other;
  }

  copy(other) {
    for(let i = 0; i < 7; ++i) {
      this[i] = other[i] || 0;
    }
    this.dances = other.dances || false;
    return this;
  }

  clear() {
    for(let i = 0; i < 7; ++i) {
      this[i] = 0;
    }
    this.dances = false;
  }

}

types.Color = Color;

function makeColor(...args) {
  let hex = args[0];
  if (args.length == 0) { return new types.Color(0,0,0); }
  if (args.length == 1 && hex instanceof types.Color) {
    return hex.clone();
  }
  else if (Array.isArray(hex)) {
    return new types.Color(...hex);
  }
  else if (args.length >= 3) {
    return new types.Color(...args);
  }
  if (typeof hex === 'string') {
    let color = colors[hex] || null;
    if (color) return color.clone();

    if (!hex.startsWith('#')) return null;
    if (hex.length === 4) {
      const r = hex.charAt(1);
      const g = hex.charAt(2);
      const b = hex.charAt(3);
      hex = `#${r}${r}${g}${g}${b}${b}`;
    }
    hex = Number.parseInt(hex.substring(1), 16);
  }

  if (typeof hex === 'number') {
    const r = Math.floor( ((hex & 0xFF0000) >> 16) / 2.55 );
    const g = Math.floor( ((hex & 0x00FF00) >> 8)  / 2.55 );
    const b = Math.floor( (hex & 0x0000FF) / 2.55 );
    return new types.Color(r,g,b);
  }

  return null;
}

make.color = makeColor;


function installColor(name, ...args) {
	const color = make.color(...args);
	colors[name] = color;
	return color;
}

color.install = installColor;

function colorFrom(arg) {
  if (typeof arg === 'string') {
    return colors[arg] || make.color(arg);
  }
  return make.color(arg);
}

color.from = colorFrom;


function applyMix(baseColor, newColor, opacity) {
  if (opacity <= 0) return;
  const weightComplement = 100 - opacity;
  for(let i = 0; i < baseColor.length; ++i) {
    baseColor[i] = Math.floor((baseColor[i] * weightComplement + newColor[i] * opacity) / 100);
  }
  baseColor.dances = (baseColor.dances || newColor.dances);
  return baseColor;
}

color.applyMix = applyMix;
color.applyAverage = applyMix;


function toRGB(v, vr) {
  return utils$1.clamp(Math.round(2.551 * (v + cosmetic.value() * vr) ), 0, 255);
}

const V_TO_CSS = [];
for(let i = 0; i < 256; ++i) {
  V_TO_CSS[i] = i.toString(16).padStart(2, '0');
}

function toCSS(v) {
  return V_TO_CSS[Math.floor(v)];
}

function css(color) {
  const rand = cosmetic.value() * (color.rand || 0);
  const red = toRGB(color.red + rand, color.redRand);
  const green = toRGB(color.green + rand, color.greenRand);
  const blue = toRGB(color.blue + rand, color.blueRand);
  return `#${toCSS(red)}${toCSS(green)}${toCSS(blue)}`;
}

color.css = css;

function equals(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.every( (v, i) => v === b[i] ) && a.dances === b.dances;
}

color.equals = equals;

function clampColor(theColor) {
  theColor.red		= utils$1.clamp(theColor.red, 0, 100);
  theColor.green	= utils$1.clamp(theColor.green, 0, 100);
  theColor.blue		= utils$1.clamp(theColor.blue, 0, 100);
}

color.clamp = clampColor;


function bakeColor(/* color */theColor) {
  let rand;
  rand = cosmetic.range(0, theColor.rand);
  theColor.red   += Math.round(cosmetic.range(0, theColor.redRand) + rand);
  theColor.green += Math.round(cosmetic.range(0, theColor.greenRand) + rand);
  theColor.blue  += Math.round(cosmetic.range(0, theColor.blueRand) + rand);
  theColor.redRand = theColor.greenRand = theColor.blueRand = theColor.rand = 0;
}

color.bake = bakeColor;


function lightenColor(destColor, percent) {
  utils$1.clamp(percent, 0, 100);
  destColor.red =    Math.round(destColor.red + (100 - destColor.red) * percent / 100);
  destColor.green =  Math.round(destColor.green + (100 - destColor.green) * percent / 100);
  destColor.blue =   Math.round(destColor.blue + (100 - destColor.blue) * percent / 100);

  // leave randoms the same
  return destColor;
}

color.lighten = lightenColor;

function darkenColor(destColor, percent) {
  utils$1.clamp(percent, 0, 100);
  destColor.red =    Math.round(destColor.red * (100 - percent) / 100);
  destColor.green =  Math.round(destColor.green * (100 - percent) / 100);
  destColor.blue =   Math.round(destColor.blue * (100 - percent) / 100);

  // leave randoms the same
  return destColor;
}

color.darken = darkenColor;


function applyColorAugment(baseColor, augmentColor, weight) {
  baseColor.red += Math.floor((augmentColor.red * weight) / 100);
  baseColor.redRand += Math.floor((augmentColor.redRand * weight) / 100);
  baseColor.green += Math.floor((augmentColor.green * weight) / 100);
  baseColor.greenRand += Math.floor((augmentColor.greenRand * weight) / 100);
  baseColor.blue += Math.floor((augmentColor.blue * weight) / 100);
  baseColor.blueRand += Math.floor((augmentColor.blueRand * weight) / 100);
  baseColor.rand += Math.floor((augmentColor.rand * weight) / 100);
  return baseColor;
}

color.applyAugment = applyColorAugment;


function applyColorMultiplier(baseColor, multiplierColor) {
  baseColor.red = Math.round(baseColor.red * multiplierColor.red / 100);
  baseColor.redRand = Math.round(baseColor.redRand * multiplierColor.redRand / 100);
  baseColor.green = Math.round(baseColor.green * multiplierColor.green / 100);
  baseColor.greenRand = Math.round(baseColor.greenRand * multiplierColor.greenRand / 100);
  baseColor.blue = Math.round(baseColor.blue * multiplierColor.blue / 100);
  baseColor.blueRand = Math.round(baseColor.blueRand * multiplierColor.blueRand / 100);
  baseColor.rand = Math.round(baseColor.rand * multiplierColor.rand / 100);
  baseColor.dances = baseColor.dances || multiplierColor.dances;
  return baseColor;
}

color.applyMultiplier = applyColorMultiplier;

function applyColorScalar(baseColor, scalar) {
  baseColor.red          = Math.round(baseColor.red        * scalar / 100);
  baseColor.redRand      = Math.round(baseColor.redRand    * scalar / 100);
  baseColor.green        = Math.round(baseColor.green      * scalar / 100);
  baseColor.greenRand    = Math.round(baseColor.greenRand  * scalar / 100);
  baseColor.blue         = Math.round(baseColor.blue       * scalar / 100);
  baseColor.blueRand     = Math.round(baseColor.blueRand   * scalar / 100);
  baseColor.rand         = Math.round(baseColor.rand       * scalar / 100);
}

color.applyScalar = applyColorScalar;

function _randomizeColorByPercent(input, percent) {
  return (cosmetic.range( Math.floor(input * (100 - percent) / 100), Math.floor(input * (100 + percent) / 100)));
}

function randomizeColor(baseColor, randomizePercent) {
  baseColor.red = _randomizeColorByPercent(baseColor.red, randomizePercent);
  baseColor.green = _randomizeColorByPercent(baseColor.green, randomizePercent);
  baseColor.blue = _randomizeColorByPercent(baseColor.blue, randomizePercent);
}

color.randomize = randomizeColor;

function swapColors(color1, color2) {
    const tempColor = color1.clone();
    color1.copy(color2);
    color2.copy(tempColor);
}

color.swap = swapColors;

const MIN_COLOR_DIFF =			600;

// weighted sum of the squares of the component differences. Weights are according to color perception.
function colorDiff(f, b)		 {
  return ((f.red - b.red) * (f.red - b.red) * 0.2126
    + (f.green - b.green) * (f.green - b.green) * 0.7152
    + (f.blue - b.blue) * (f.blue - b.blue) * 0.0722);
}

color.diff = colorDiff;

function normColor(baseColor, aggregateMultiplier, colorTranslation) {

    baseColor.red += colorTranslation;
    baseColor.green += colorTranslation;
    baseColor.blue += colorTranslation;
    const vectorLength =  baseColor.red + baseColor.green + baseColor.blue;

    if (vectorLength != 0) {
        baseColor.red =    Math.round(baseColor.red * 300    / vectorLength * aggregateMultiplier / 100);
        baseColor.green =  Math.round(baseColor.green * 300  / vectorLength * aggregateMultiplier / 100);
        baseColor.blue =   Math.round(baseColor.blue * 300   / vectorLength * aggregateMultiplier / 100);
    }
    baseColor.redRand = 0;
    baseColor.greenRand = 0;
    baseColor.blueRand = 0;
    baseColor.rand = 0;
}

color.normalize = normColor;


// if forecolor is too similar to back, darken or lighten it and return true.
// Assumes colors have already been baked (no random components).
function separateColors(/* color */ fore, /* color */ back) {
  let f, b, modifier = null;
  let failsafe;
  let madeChange;

  f = fore.clone();
  b = back.clone();

  f.red			= utils$1.clamp(f.red, 0, 100);
  f.green		= utils$1.clamp(f.green, 0, 100);
  f.blue		= utils$1.clamp(f.blue, 0, 100);
  b.red			= utils$1.clamp(b.red, 0, 100);
  b.green		= utils$1.clamp(b.green, 0, 100);
  b.blue		= utils$1.clamp(b.blue, 0, 100);

  if (f.red + f.blue + f.green > 50 * 3) {
    modifier = colors.black;
  } else {
    modifier = colors.white;
  }

  madeChange = false;
  failsafe = 10;

  while(color.diff(f, b) < MIN_COLOR_DIFF && --failsafe) {
    applyMix(f, modifier, 20);
    madeChange = true;
  }

  if (madeChange) {
    fore.copy(f);
    return true;
  } else {
    return false;
  }
}

color.separate = separateColors;


function installColorSpread(name, r, g, b) {
	let baseColor;
	baseColor = installColor(name, r, g, b);
	installColor('light_' + name, color.lighten(baseColor.clone(), 25));
	installColor('lighter_' + name, color.lighten(baseColor.clone(), 50));
	installColor('lightest_' + name, color.lighten(baseColor.clone(), 75));
	installColor('dark_' + name, color.darken(baseColor.clone(), 25));
	installColor('darker_' + name, color.darken(baseColor.clone(), 50));
	installColor('darkest_' + name, color.darken(baseColor.clone(), 75));
	return baseColor;
}

color.installSpread = installColorSpread;

installColor('white', 				100,	100,	100);
installColor('black', 				0,		0,		0);

installColorSpread('teal', 				30,		100,	100);
installColorSpread('brown', 			60,		40,		0);
installColorSpread('tanColor', 		80,		67,		15);
installColorSpread('pink', 				100,	60,		66);
installColorSpread('gray', 				50,		50,		50);
installColorSpread('yellow', 			100,	100,	0);
installColorSpread('purple', 			100,	0,		100);
installColorSpread('green', 			0,		100,	0);
installColorSpread('orange', 			100,	50,		0);
installColorSpread('blue', 				0,		0,		100);
installColorSpread('red', 				100,	0,		0);

installColorSpread('amber', 			100,  75,   0);
installColorSpread('flame', 			100,  25,   0);
installColorSpread('fuchsia', 		100,  0,    100);
installColorSpread('magenta', 		100,  0,    75);
installColorSpread('crimson', 		100,  0,    25);
installColorSpread('lime', 			  75,   100,  0);
installColorSpread('chartreuse',  50,   100,  0);
installColorSpread('sepia', 			50,   40,   25);
installColorSpread('violet', 		  50,   0,    100);
installColorSpread('han', 				25,   0,    100);
installColorSpread('cyan', 			  0,    100,  100);
installColorSpread('turquoise', 	0,    100,  75);
installColorSpread('sea', 				0,    100,  50);
installColorSpread('sky', 				0,    75,   100);
installColorSpread('azure', 			0,    50,   100);

var text = {};

///////////////////////////////////
// Message String

// color escapes
const COLOR_ESCAPE =			25;
const COLOR_END    =      26;
const COLOR_VALUE_INTERCEPT =	0; // 25;
const TEMP_COLOR = make.color();



// class Message {
//   constructor(value) {
//     this.text = value || '';
//     this._textLength = -1;
//   }
//
//   get fullLength() { return this.text.length; }
//
//   get length() {
//     throw new Error('Convert to fullLength or textLength');
//   }
//
//   get textLength() {
//     if (this._textLength > -1) return this._textLength;
//
//     let length = 0;
//
//     for(let i = 0; i < this.text.length; ++i) {
//       const ch = this.text.charCodeAt(i);
//       if (ch === COLOR_ESCAPE) {
//           i += 3;	// skip color parts
//       }
//       else if (ch === COLOR_END) {
//           // skip
//       }
//       else {
//         ++length;
//       }
//     }
//
//     this._textLength = length;
//     return this._textLength;
//   }
//
//   eachChar(callback) {
//     let color = null;
//     const components = [100, 100, 100];
//     let index = 0;
//
//     for(let i = 0; i < this.text.length; ++i) {
//       const ch = this.text.charCodeAt(i);
//       if (ch === COLOR_ESCAPE) {
//           components[0] = this.text.charCodeAt(i + 1) - COLOR_VALUE_INTERCEPT;
//           components[1] = this.text.charCodeAt(i + 2) - COLOR_VALUE_INTERCEPT;
//           components[2] = this.text.charCodeAt(i + 3) - COLOR_VALUE_INTERCEPT;
//           color = TEMP_COLOR.copy(components);
//           i += 3;
//       }
//       else if (ch === COLOR_END) {
//         color = null;
//       }
//       else {
//         callback(this.text[i], color, index);
//         ++index;
//       }
//     }
//
//   }
//
//   encodeColor(color, i) {
//     let colorText;
//     if (!color) {
//       colorText = String.fromCharCode(COLOR_END);
//     }
//     else {
//       const copy = color.clone();
//       bakeColor(copy);
//       clampColor(copy);
//       colorText = String.fromCharCode(COLOR_ESCAPE, copy.red + COLOR_VALUE_INTERCEPT, copy.green + COLOR_VALUE_INTERCEPT, copy.blue + COLOR_VALUE_INTERCEPT);
//     }
//     if (i == 0) {
//       this.text = colorText;
//     }
//     else if (i < this.text.length) {
//       this.splice(i, 4, colorText);
//     }
//     else {
//       this.text += colorText;
//     }
//     return this;
//   }
//
//   setText(value) {
//     if (value instanceof BrogueString) {
//       this.text = value.text;
//       this._textLength = value._textLength;
//       return this;
//     }
//
//     this.text = value || '';
//     this._textLength = -1;
//     return this;
//   }
//
//   append(value) {
//     if (value instanceof BrogueString) {
//       this.text += value.text;
//       this._textLength = -1;
//       return this;
//     }
//
//     this.text += value;
//     this._textLength = -1;
//     return this;
//   }
//
//   clear() {
//     this.text = '';
//     this._textLength = 0;
//     return this;
//   }
//
//   capitalize() {
//     if (!this.text.length) return;
//
//     let index = 0;
//     let ch = this.text.charCodeAt(index);
//     while (ch === COLOR_ESCAPE) {
//       index += 4;
//       ch = this.text.charCodeAt(index);
//     }
//
//     const preText = index ? this.text.substring(0, index) : '';
//     this.text = preText + this.text[index].toUpperCase() + this.text.substring(index + 1);
//     return this;
//   }
//
//   padStart(finalLength) {
//     const diff = (finalLength - this.textLength);
//     if (diff <= 0) return this;
//     this.text = this.text.padStart(diff + this.text.length, ' ');
//     this._textLength += diff;
//     return this;
//   }
//
//   padEnd(finalLength) {
//     const diff = (finalLength - this.textLength);
//     if (diff <= 0) return this;
//     this.text = this.text.padEnd(diff + this.text.length, ' ');
//     this._textLength += diff;
//     return this;
//   }
//
//   toString() {
//     return this.text;
//   }
//
//   charAt(index) {
//     return this.text.charAt(index);
//   }
//
//   charCodeAt(index) {
//     return this.text.charCodeAt(index);
//   }
//
//   copy(other) {
//     this.text = other.text;
//     this._textLength = other._textLength;
//     return this;
//   }
//
//   splice(begin, length, add) {
//     const preText = this.text.substring(0, begin);
//     const postText = this.text.substring(begin + length);
//     add = (add && add.text) ? add.text : (add || '');
//
//     this.text = preText + add + postText;
//     this._textLength = -1;
//   }
//
//   toString() {
//     return this.text;
//   }
//
// }
//
//
// types.String = BrogueString;
//
//
// // return a new string object
// function STRING(text) {
//   if (text instanceof BrogueString) return text;
//   return new BrogueString(text);
// }
//
// make.string = STRING;

function eachChar(msg, fn) {
  let color = null;
  const components = [100, 100, 100];
  let index = 0;
  if (!msg || !msg.length) return;

  for(let i = 0; i < msg.length; ++i) {
    const ch = msg.charCodeAt(i);
    if (ch === COLOR_ESCAPE) {
        components[0] = msg.charCodeAt(i + 1) - COLOR_VALUE_INTERCEPT;
        components[1] = msg.charCodeAt(i + 2) - COLOR_VALUE_INTERCEPT;
        components[2] = msg.charCodeAt(i + 3) - COLOR_VALUE_INTERCEPT;
        color = TEMP_COLOR.copy(components);
        i += 3;
    }
    else if (ch === COLOR_END) {
      color = null;
    }
    else {
      fn(msg[i], color, index);
      ++index;
    }
  }
}

text.eachChar = eachChar;

//
// function strlen(bstring) {
//   if (!bstring) return 0;
//   if (typeof bstring === 'string') return bstring.length;
//   return bstring.fullLength;
// }
//
// text.strlen = strlen;
//

function textlen(msg) {
  let length = 0;

  if (!msg || !msg.length) return 0;

  for(let i = 0; i < msg.length; ++i) {
    const ch = msg.charCodeAt(i);
    if (ch === COLOR_ESCAPE) {
        i += 3;	// skip color parts
    }
    else if (ch === COLOR_END) ;
    else {
      ++length;
    }
  }

  return length;
}

text.length = textlen;


function splice(msg, begin, length, add) {
  const preText = msg.substring(0, begin);
  const postText = msg.substring(begin + length);
  add = add || '';

  return preText + add + postText;
}

text.splice = splice;

// function strcat(bstring, txt) {
//   bstring.append(txt);
// }
//
// text.strcat = strcat;
//
// function strncat(bstring, txt, n) {
//   txt = STRING(txt);
//   bstring.append(txt.text.substring(0, n));
// }
//
// text.strncat = strncat;
//
// function strcpy(bstring, txt) {
//   bstring.setText(txt);
// }
//
// text.strcpy = strcpy;

// function eachChar(bstring, callback) {
// 	bstring = STRING(bstring);
// 	return bstring.eachChar(callback);
// }



// Returns true if either string has a null terminator before they otherwise disagree.
function stringsMatch(str1, str2) {
  let i, j;

  // str1 = STRING(str1);
  // str2 = STRING(str2);

  const limit = Math.min( str1.length , str2.length );

  for (i=0, j=0; limit > 0; --limit) {

    // TODO - Handle COLOR_END also
    while (str1.charCodeAt(i) === COLOR_ESCAPE) {
      i += 4;
    }
    while(str2.charCodeAt(j) === COLOR_ESCAPE) {
      j += 4;
    }

    if (str1.charAt(i).toLowerCase() != str2.charAt(j).toLowerCase()) {
      return false;
    }
  }
  return true;
}

text.matches = stringsMatch;


function centerText(msg, len) {
  const textlen = text.length(msg);
  const totalPad = (len - textlen);
  const leftPad = Math.round(totalPad/2);
  return msg.padStart(leftPad + textlen, ' ').padEnd(len, ' ');
}

text.center = centerText;


function capitalize(msg) {
  if (!msg.length) return;

  let index = 0;
  let ch = msg.charCodeAt(index);
  while (ch === COLOR_ESCAPE || ch === COLOR_END) {
    index += (ch === COLOR_ESCAPE ? 4 : 1);
    ch = msg.charCodeAt(index);
  }

  const preText = index ? msg.substring(0, index) : '';
  msg = preText + msg[index].toUpperCase() + msg.substring(index + 1);
  return msg;
}

text.capitalize = capitalize;

// // Gets the length of a string without the color escape sequences, since those aren't displayed.
// function strLenWithoutEscapes(text) {
//   text = STRING(text);
//   return text.textLength;
// }
//
// text.textLength = strLenWithoutEscapes;
//
// function strcmp(a, b) {
//   a = STRING(a);
//   b = STRING(b);
//
//   if (a.text == b.text) return 0;
//   return (a.text < b.text) ? -1 : 1;
// }
//
// text.strcmp = strcmp;


// Inserts a four-character color escape sequence into a string at the insertion point.
// Does NOT check string lengths, so it could theoretically write over the null terminator.
// Returns the new insertion point.
function encodeColor(theColor) {
  if (!theColor) {
    return String.fromCharCode(COLOR_END);
  }

  const copy = color.from(theColor);
  color.bake(copy);
  color.clamp(copy);
  return String.fromCharCode(COLOR_ESCAPE, copy.red + COLOR_VALUE_INTERCEPT, copy.green + COLOR_VALUE_INTERCEPT, copy.blue + COLOR_VALUE_INTERCEPT);
}
//
//
// // Call this when the i'th character of msg is COLOR_ESCAPE.
// // It will return the encoded color, and will advance i past the color escape sequence.
// function strDecodeColor(msg, i, /* color */ returnColor) {
//
//   msg = STRING(msg).text;
//
//   if (msg.charCodeAt(i) !== COLOR_ESCAPE) {
//     printf("\nAsked to decode a color escape that didn't exist!", msg, i);
//     returnColor.copy(white);
//   } else {
//     i++;
//     returnColor.copy(black);
//     returnColor.red	= (msg.charCodeAt(i++) - COLOR_VALUE_INTERCEPT);
//     returnColor.green	= (msg.charCodeAt(i++) - COLOR_VALUE_INTERCEPT);
//     returnColor.blue	= (msg.charCodeAt(i++) - COLOR_VALUE_INTERCEPT);
//
//     returnColor.red	= clamp(returnColor.red, 0, 100);
//     returnColor.green	= clamp(returnColor.green, 0, 100);
//     returnColor.blue	= clamp(returnColor.blue, 0, 100);
//   }
//   return i;
// }
//
//
// function isVowelish(str) {
//   str = STRING(str);
//
//   if (stringsMatch(str, "uni")) return false;  // Words that start with "uni" aren't treated like vowels; e.g., "a" unicorn.
//   if (stringsMatch(str, "eu"))  return false;  // Words that start with "eu" aren't treated like vowels; e.g., "a" eucalpytus staff.
//
//   let i = 0;
//   while( str.charCodeAt(i) == COLOR_ESCAPE ) {
//     i += 4;
//   }
//
//   // TODO - Get rid of 'charAt'
//   const ch = str.charAt(i).toLowerCase();
//   return ['a', 'e', 'i', 'o', 'u'].includes(ch);
// }
//
// text.isVowelish = isVowelish;
//
//
// function arrayToString(array, lastSeperator) {
//   lastSeperator = lastSeperator || 'and';
//
//   let index;
//   let out = '';
//   for(index in array) {
//     if (index > 0 && index == array.length - 1) {
//       out += lastSeperator;
//     }
//     else if (index > 0) {
//       out += ', ';
//     }
//     out += array[index];
//   }
//   return out;
// }
//
// GW.utils.arrayToString = arrayToString;
//

// Inserts line breaks into really long words. Optionally adds a hyphen, but doesn't do anything
// clever regarding hyphen placement. Plays nicely with color escapes.
function hyphenate(msg, width, useHyphens) {
  let buf = ''; // char[COLS * ROWS * 2] = "";
  let i, nextChar, wordWidth;
  //const short maxLength = useHyphens ? width - 1 : width;

  // i iterates over characters in sourceText; m keeps track of the length of buf.
  wordWidth = 0;
  for (i=0; msg[i]; ) {
    if (msg.charCodeAt(i) === COLOR_ESCAPE) {
      buf += msg.substring(i, i + 4);
      i += 4;
    }
    else if (msg.charCodeAt(i) === COLOR_END) {
      buf += msg.substring(i, i + 1);
      i += 1;
    } else if (msg[i] === ' ' || msg[i] === '\n') {
      wordWidth = 0;
      buf += msg[i++];
    } else {
      if (!useHyphens && wordWidth >= width) {
        buf += '\n';
        wordWidth = 0;
      } else if (useHyphens && wordWidth >= width - 1) {
        nextChar = i+1;
        while (msg[nextChar] === COLOR_ESCAPE || msg[nextChar] === COLOR_END) {
          nextChar += (msg[nextChar] === COLOR_ESCAPE ? 4 : 1);
        }
        if (msg[nextChar] && msg[nextChar] !== ' ' && msg[nextChar] !== '\n') {
          buf += '-\n';
          wordWidth = 0;
        }
      }
      buf += msg[i++];
      wordWidth++;
    }
  }
  return buf;
}

text.hyphenate = hyphenate;


// Returns the number of lines, including the newlines already in the text.
// Puts the output in "to" only if we receive a "to" -- can make it null and just get a line count.
function splitIntoLines(sourceText, width) {
  let i, w, textLength;
  let spaceLeftOnLine, wordWidth;

  if (!width) GW.utils.ERROR('Need string and width');

  let printString = text.hyphenate(sourceText, width, true); // break up any words that are wider than the width.
  textLength = text.length(printString); // do NOT discount escape sequences

  // Now go through and replace spaces with newlines as needed.

  // Fast foward until i points to the first character that is not a color escape.
  for (i=0; printString.charCodeAt(i) == COLOR_ESCAPE; i+= 4);
  spaceLeftOnLine = width;

  while (i < textLength) {
    // wordWidth counts the word width of the next word without color escapes.
    // w indicates the position of the space or newline or null terminator that terminates the word.
    wordWidth = 0;
    for (w = i + 1; w < textLength && printString[w] !== ' ' && printString[w] !== '\n';) {
      if (printString.charCodeAt(w) === COLOR_ESCAPE) {
        w += 4;
      }
      else if (printString.charCodeAt(w) === COLOR_END) {
        w += 1;
      }
      else {
        w++;
        wordWidth++;
      }
    }

    if (1 + wordWidth > spaceLeftOnLine || printString[i] === '\n') {
      printString = text.splice(printString, i, 1, '\n');	// [i] = '\n';
      spaceLeftOnLine = width - wordWidth; // line width minus the width of the word we just wrapped
      //printf("\n\n%s", printString);
    } else {
      spaceLeftOnLine -= 1 + wordWidth;
    }
    i = w; // Advance to the terminator that follows the word.
  }

  return printString.split('\n');}

text.splitIntoLines = splitIntoLines;


function format(fmt, ...args) {

  const RE = /%([\-\+0\ \#]+)?(\d+|\*)?(\.\*|\.\d+)?([hLIw]|l{1,2}|I32|I64)?([cCdiouxXeEfgGaAnpsRSZ%])/g;

  if (fmt instanceof types.Color) {
    const buf = encodeColor(fmt) + args.shift();
    fmt = buf;
  }
  if (typeof fmt !== 'string') {
    fmt = '' + fmt;
  }

  let result = fmt.replace(RE, (m, p1, p2, p3, p4, p5, offset) => {

    p1 = p1 || '';
    p2 = p2 || '';
    p3 = p3 || '';

    let r;
    let sign = '';

    let pad = Number.parseInt(p2) || 0;
    const wantSign = p1.includes('+');
    if (p1.includes(' ')) {
      sign = ' ';
    }

    if (p5 == 's') {
      if (p1.includes(' ')) return m;
      r = args.shift() || '';
      r = r.text || r;	// BrogueString
    }
    else if (p5 == 'c') {
      if (m !== '%c') return m;
      r = (args.shift() || '');
      r = r.text || r;	// BrogueString
      r = r[0] || '';
    }
    else if (p5 == 'd' || p5 == 'i' || p5 == 'u') {
      let n = args.shift() || 0;
      if (n < 0) {
        sign = '-';
      }
      else if (wantSign) {
        sign = '+';
      }
      r = '' + Math.abs(n);
    }
    else if (p5 == 'f') {
      let n = args.shift() || 0;
      const fixed = p3.substring(1) || 0;
      if (fixed) {
        r = Math.abs(n).toFixed(fixed);
      }
      else {
        r = '' + Math.abs(n);
      }

      if (n < 0) {
        sign = '-';
      }
      else if (wantSign) {
        sign = '+';
      }
    }
    else if (p5 == 'R') {
      let color$1 = args.shift() || null;
      if (color$1 && !(color$1 instanceof types.Color)) {
        color$1 = color.from(color$1);
      }
      r = encodeColor(color$1);
    }
    else if (p5 == '%') {
      return '%';
    }
    else {
      return m;
    }

    if (p1.includes('-')) {
      r = sign + r.padEnd(pad - sign.length, ' ');
    }
    else {
      if (p1.includes('0')) {
        r = sign + r.padStart(pad - sign.length, '0');
      }
      else {
        r = (sign + r).padStart(pad, ' ');
      }
    }

    return r;
  });

  if (args.length) {
    if (result.length) {
      result += ' ';
    }
    result = result + args.join(' ');
  }

  return result;
}

text.format = format;

// function sprintf(dest, fmt, ...args) {
//   dest = STRING(dest);
//   dest._textLength = -1;
//   dest.text = text.format(fmt, ...args);
//   return dest;
// }
//
// text.sprintf = sprintf;

const TEMP_BG = new types.Color();

var sprites = {};
var sprite = {};

const HANGING_LETTERS = ['y', 'p', 'g', 'j', 'q', '[', ']', '(', ')', '{', '}', '|'];

class Sprite {
	constructor(ch, fg, bg, opacity) {
		const args = Array.prototype.filter.call(arguments, (v) => v !== undefined );

		let argCount = args.length;
		const opIndex = args.findIndex( (v) => typeof v === 'number' );
		if (opIndex >= 0) {
			--argCount;
			opacity = args[opIndex];
		}
		if (argCount == 0) {
			ch = ' ';
			fg = 'white';
			bg = 'black';
		}
		else if (argCount == 1) {
			if (typeof args[0] === 'string' && args[0].length == 1) {
				ch = args[0];
				fg = 'white';
				bg = null;
			}
			else {
				ch = null;
				fg = null;
				bg = args[0];
			}
		}
		else if (argCount == 2) {
			ch = args[0];
			fg = args[1];
			bg = null;
		}

		this.ch = ch !== null ? (ch || ' ') : null;
		this.fg = fg !== null ? make.color(fg || 'white') : null;
		this.bg = bg !== null ? make.color(bg || 'black') : null;
		this.opacity = opacity || 100;
		this.needsUpdate = true;
		this.wasHanging = false;
	}

	copy(other) {
		this.ch = other.ch;

		if (this.fg && this.bg) { this.fg.copy(other.fg); }
		else if (this.fg) { this.fg.clear(); }
		else { this.fg = other.fg.clone(); }

		if (this.bg && other.bg) { this.bg.copy(other.bg); }
		else if (this.bg) { this.bg.clear(); }
		else { this.bg = other.bg.clone(); }

		this.opacity = other.opacity || 0;
		this.needsUpdate = other.needsUpdate || false;
		this.wasHanging = other.wasHanging || false;
	}

	clone() {
		const other = new types.Sprite(this.ch, this.fg, this.bg, this.opacity);
		other.wasHanging = this.wasHanging;
		other.needsUpdate = this.needsUpdate;
		return other;
	}

	clear() {
		if (HANGING_LETTERS.includes(this.ch)) {
			this.wasHanging = true;
		}
		this.ch = ' ';
		if (this.fg) this.fg.clear();
		if (this.bg) this.bg.clear();
		this.opacity = 0;
		// this.needsUpdate = false;
	}

	erase() {
		this.clear();
		this.opacity = 100;
		this.needsUpdate = true;
		this.wasHanging = false;
	}

	plotChar(ch, fg, bg) {
		this.wasHanging = this.wasHanging || (ch != null && HANGING_LETTERS.includes(ch));
		if (!this.opacity) {
			this.ch = ' ';
		}
    if (ch) { this.ch = ch; }
		if (fg) { this.fg.copy(fg); }
    if (bg) { this.bg.copy(bg); }
    this.opacity = 100;
    this.needsUpdate = true;
	}

	plot(sprite) {
		if (sprite.opacity == 0) return false;

    if (sprite.opacity == 100) {
      this.plotChar(sprite.ch, sprite.fg, sprite.bg);
      return true;
    }

		this.wasHanging = this.wasHanging || (sprite.ch != null && HANGING_LETTERS.includes(sprite.ch));

    // ch and fore color:
    if (sprite.ch && sprite.ch != ' ') { // Blank cells in the overbuf take the ch from the screen.
      this.ch = sprite.ch;
    }

		if (sprite.fg && sprite.ch != ' ') {
			color.applyMix(this.fg, sprite.fg, sprite.opacity);
		}

		if (sprite.bg) {
			color.applyMix(this.bg, sprite.bg, sprite.opacity);
		}

    if (this.ch != ' ' && color.equals(this.fg, this.bg))
    {
      this.ch = ' ';
    }
		this.opacity = Math.max(this.opacity, sprite.opacity);
		this.needsUpdate = true;
		return true;
	}

	equals(other) {
		return this.ch == other.ch && color.equals(this.fg, other.fg) && color.equals(this.bg, other.bg);
	}

	bake() {
		if (this.fg && !this.fg.dances) {
			color.bake(this.fg);
		}
		if (this.bg && !this.bg.dances) {
			color.bake(this.bg);
		}
	}
}

types.Sprite = Sprite;

function makeSprite(ch, fg, bg, opacity) {
	if (arguments.length == 1 && typeof arguments[0] === 'object' && ch !== null) {
		opacity = ch.opacity || null;
		bg = ch.bg || null;
		fg = ch.fg || null;
		ch = ch.ch || null;
	}
  return new Sprite(ch, fg, bg, opacity);
}

make.sprite = makeSprite;

function installSprite(name, ch, fg, bg, opacity) {
	const sprite = make.sprite(ch, fg, bg, opacity);
	sprites[name] = sprite;
	return sprite;
}

sprite.install = installSprite;

const GRID_CACHE = [];

const DIRS = def.dirs;
const CDIRS = def.clockDirs;

var GRID = {};


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
				fn(this[i][j], i, j);
			}
		}
	}

	eachNeighbor(x, y, fn, only4dirs) {
		const maxIndex = only4dirs ? 4 : 8;
		for(let d = 0; d < maxIndex; ++d) {
			const dir = def.dirs[d];
			const i = x + dir[0];
			const j = y + dir[1];
			if (this.hasXY(i, j)) {
				fn(this[i][j], i, j);
			}
		}
	}

	forRect(x, y, w, h, fn) {
		w = Math.min(this.width - x, w);
		h = Math.min(this.height - y, h);

		for(let i = x; i < x + w; ++i) {
			for(let j = y; j < y + h; ++j) {
				fn(this[i][j], i, j);
			}
		}
	}

	map(fn) {
		return super.map( (col, x) => {
			return col.map( (v, y) => fn(v, x, y) );
		});
	}

	forCircle(x, y, radius, fn) {
		let i, j;

		for (i=Math.max(0, x - radius - 1); i < Math.min(this.width, x + radius + 1); i++) {
				for (j=Math.max(0, y - radius - 1); j < Math.min(this.height, y + radius + 1); j++) {
						if (this.hasXY(i, j) && (((i-x)*(i-x) + (j-y)*(j-y)) < radius * radius + radius)) {	// + radius softens the circle
								fn(this[i][j], i, j);
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
				this[i][j] = fn(this[i][j], i, j);
			}
		}
	}

	updateRect(x, y, width, height, fn) {
	    let i, j;
	    for (i=x; i < x+width; i++) {
	        for (j=y; j<y+height; j++) {
						if (this.hasXY(i, j)) {
							this[i][j] = fn(this[i][j], i, j);
						}
	        }
	    }
	}

	updateCircle(x, y, radius, fn) {
	    let i, j;

	    for (i=Math.max(0, x - radius - 1); i < Math.min(this.width, x + radius + 1); i++) {
	        for (j=Math.max(0, y - radius - 1); j < Math.min(this.height, y + radius + 1); j++) {
	            if (this.hasXY(i, j) && (((i-x)*(i-x) + (j-y)*(j-y)) < radius * radius + radius)) {	// + radius softens the circle
	                this[i][j] = fn(this[i][j], i, j);
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
		this.forEach((v, i, j) => { if (fn(v,i,j)) ++count; });
	  return count;
	}

	dump(fmtFn) {
		gridDumpRect(this, 0, 0, this.width, this.height, fmtFn);
	}

	closestMatchingXY(x, y, fn) {
		let bestLoc = [-1, -1];
	  let bestDistance = this.width + this.height;

		this.forEach( (v, i, j) => {
			if (fn(v, i, j)) {
				const dist = utils$1.distanceBetween(x, y, i, j);
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
				if (fn(this[i][j], i, j)) {
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
			if (fn(v, i, j)) {
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
        if (fn(this[i][j], i, j)) {
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
						&& fn(this[i][j], i, j))
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
						&& fn(this[i][j], i, j))
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

		testFn = testFn || utils$1.IDENTITY;

		arcCount = 0;
		for (dir = 0; dir < CDIRS.length; dir++) {
			oldX = x + CDIRS[(dir + 7) % 8][0];
			oldY = y + CDIRS[(dir + 7) % 8][1];
			newX = x + CDIRS[dir][0];
			newY = y + CDIRS[dir][1];
			// Counts every transition from passable to impassable or vice-versa on the way around the cell:
			if ((this.hasXY(newX, newY) && testFn(this[newX][newY], newX, newY))
				!= (this.hasXY(oldX, oldY) && testFn(this[oldX][oldY], oldX, oldY)))
			{
				arcCount++;
			}
		}
		return Math.floor(arcCount / 2); // Since we added one when we entered a wall and another when we left.
	}

}

types.Grid = Grid;


function makeGrid(w, h, v) {
	return new types.Grid(w, h, v);
}

make.grid = makeGrid;


// mallocing two-dimensional arrays! dun dun DUN!
function allocGrid(w, h, v) {

	w = w || (data.map ? data.map.width : 100);
	h = h || (data.map ? data.map.height : 34);
	v = v || 0;

	let grid = GRID_CACHE.pop();
  if (!grid) {
    return makeGrid(w, h, v);
  }
  return resizeAndClearGrid(grid, w, h, v);
}

GRID.alloc = allocGrid;


function freeGrid(grid) {
	if (grid) {
		GRID_CACHE.push(grid);
	}
}

GRID.free = freeGrid;


function resizeAndClearGrid(grid, width, height, value=0) {
	if (!grid) return allocGrid(width, height, () => value());

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
// GRID.mapCellsInCircle = gridMapCellsInCircle;


function dumpGrid(grid, fmtFn) {
	gridDumpRect(grid, 0, 0, grid.width, grid.height, fmtFn);
}

GRID.dump = dumpGrid;


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

function gridDumpRect(grid, left, top, width, height, fmtFn) {
	let i, j;

	fmtFn = fmtFn || _formatGridValue;

	left = utils$1.clamp(left, 0, grid.width - 2);
	top = utils$1.clamp(top, 0, grid.height - 2);
	const right = utils$1.clamp(left + width, 1, grid.width - 1);
	const bottom = utils$1.clamp(top + height, 1, grid.height - 1);

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

GRID.dumpRect = gridDumpRect;


function dumpGridAround(grid, x, y, radius) {
	gridDumpRect(grid, x - radius, y - radius, 2 * radius, 2 * radius);
}

GRID.dumpAround = dumpGridAround;





function findAndReplace(grid, findValueMin, findValueMax, fillValue)
{
	grid.update( (v, x, y) => {
		if (v >= findValidMin && v <= findValueMax) {
			return fillValue;
		}
		return v;
	});
}

GRID.findAndReplace = findAndReplace;


// Flood-fills the grid from (x, y) along cells that are within the eligible range.
// Returns the total count of filled cells.
function floodFillRange(grid, x, y, eligibleValueMin, eligibleValueMax, fillValue) {
  let dir;
	let newX, newY, fillCount = 1;

  if (fillValue >= eligibleValueMin && fillValue <= eligibleValueMax) {
		utils$1.ERROR('Invalid grid flood fill');
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

GRID.floodFillRange = floodFillRange;


function invert(grid) {
	grid.update((v, i, j) => !v );
}

GRID.invert = invert;


function intersection(onto, a, b) {
	b = b || onto;
	onto.update((v, i, j) => a[i][j] && b[i][j] );
}

GRID.intersection = intersection;


function unite(onto, a, b) {
	b = b || onto;
	onto.update((v, i, j) => b[i][j] || a[i][j] );
}

GRID.unite = unite;




function closestLocationWithValue(grid, x, y, value)
{
	return grid.closestMatchingXY(x, y, (v) => v == value);
}

GRID.closestLocationWithValue = closestLocationWithValue;


// Takes a grid as a mask of valid locations, chooses one randomly and returns it as (x, y).
// If there are no valid locations, returns (-1, -1).
function randomLocationWithValue(grid, validValue) {
	return grid.randomMatchingXY( (v, i, j) => v == validValue );
}

GRID.randomLocationWithValue = randomLocationWithValue;


function getQualifyingLocNear(grid, x, y, deterministic)
{
	return grid.matchingXYNear(x, y, (v, i, j) => !!v);
}

GRID.getQualifyingLocNear = getQualifyingLocNear;

function leastPositiveValue(grid) {
	let least = Number.MAX_SAFE_INTEGER;
	grid.forEach((v) => {
		if (v > 0 && (v < least)) {
				least = v;
		}
	});
	return least;
}

GRID.leastPositiveValue = leastPositiveValue;

// Finds the lowest positive number in a grid, chooses one location with that number randomly and returns it as (x, y).
// If there are no valid locations, returns (-1, -1).
function randomLeastPositiveLocation(grid, deterministic) {
  const targetValue = GRID.leastPositiveValue(grid);
	return grid.randomMatchingXY( (v) => v == targetValue );
}

GRID.randomLeastPositiveLocation = randomLeastPositiveLocation;

// Marks a cell as being a member of blobNumber, then recursively iterates through the rest of the blob
function floodFill(grid, x, y, matchValue, fillValue) {
  let dir;
	let newX, newY, numberOfCells = 1;

	const matchFn = (typeof matchValue == 'function') ? matchValue : ((v) => v == matchValue);
	const fillFn  = (typeof fillValue  == 'function') ? fillValue  : (() => fillValue);

	grid[x][y] = fillFn(grid[x][y], x, y);

	// Iterate through the four cardinal neighbors.
	for (dir=0; dir<4; dir++) {
		newX = x + DIRS[dir][0];
		newY = y + DIRS[dir][1];
		if (!grid.hasXY(newX, newY)) {
			break;
		}
		if (matchFn(grid[newX][newY], newX, newY)) { // If the neighbor is an unmarked region cell,
			numberOfCells += floodFill(grid, newX, newY, matchFn, fillFn); // then recurse.
		}
	}
	return numberOfCells;
}

GRID.floodFill = floodFill;



function offsetZip(destGrid, srcGrid, srcToDestX, srcToDestY, value) {
	const fn = (typeof value === 'function') ? value : ((d, s, dx, dy, sx, sy) => destGrid[dx][dy] = value || s);
	srcGrid.forEach( (c, i, j) => {
		const destX = i + srcToDestX;
		const destY = j + srcToDestY;
		if (!destGrid.hasXY(destX, destY)) return;
		if (!c) return;
		fn(destGrid[destX][destY], c, destX, destY, i, j);
	});
}

GRID.offsetZip = offsetZip;



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
            && fnOpen(grid[oppX][oppY],oppX, oppY))
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

GRID.directionOfDoorSite = directionOfDoorSite;


function cellularAutomataRound(grid, birthParameters /* char[9] */, survivalParameters /* char[9] */) {
    let i, j, nbCount, newX, newY;
    let dir;
    let buffer2;

    buffer2 = allocGrid(grid.width, grid.height, 0);
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

    freeGrid(buffer2);
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

GRID.fillBlob = fillBlob;

class Buffer extends types.Grid {
  constructor(w, h) {
    super(w, h, () => new types.Sprite() );
    this.needsUpdate = true;
  }

  copy(other) {
    this.forEach( (c, i, j) => c.copy(other[i][j]) );
    this.needsUpdate = true;
  }

  clear() {
    this.forEach( (c) => c.clear() );
    this.needsUpdate = true;
  }

  clearRect(x, y, w, h) {
    this.forRect(x, y, w, h, (c) => c.clear() );
    this.needsUpdate = true;
  }

  clearCell(x, y) {
    this[x][y].clear();
    this.needsUpdate = true;
  }

  erase() {
    this.forEach( (c) => c.erase() );
    this.needsUpdate = true;
  }

  eraseRect(x, y, w, h) {
    this.forRect(x, y, w, h, (c) => c.erase() );
    this.needsUpdate = true;
  }

  eraseCell(x, y) {
    this[x][y].erase();
    this.needsUpdate = true;
  }

  dump() { super.dump( (s) => s.ch ); }

  plot(x, y, sprite) {
    if (sprite.opacity <= 0) return;

    if (!this.hasXY(x, y)) {
      utils$1.warn('invalid coordinates: ' + x + ', ' + y);
      return false;
    }
    const destCell = this[x][y];
    if (destCell.plot(sprite)) {
      this.needsUpdate = true;
    }
    return this.needsUpdate;
  }

  plotChar(x, y, ch, fg, bg) {
    if (!this.hasXY(x, y)) {
      utils$1.warn('invalid coordinates: ' + x + ', ' + y);
      return;
    }

    if (typeof fg === 'string') { fg = colors[fg]; }
    if (typeof bg === 'string') { bg = colors[bg]; }
    const destCell = this[x][y];
    destCell.plotChar(ch, fg, bg);
    this.needsUpdate = true;
  }

  plotText(x, y, text$1, fg, bg) {
    if (typeof fg === 'string') { fg = colors[fg]; }
    if (typeof bg === 'string') { bg = colors[bg]; }
    let len = text$1.length;
    text.eachChar(text$1, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || fg, bg);
    });
  }

  plotLine(x, y, w, text$1, fg, bg) {
    if (typeof fg === 'string') { fg = colors[fg]; }
    if (typeof bg === 'string') { bg = colors[bg]; }
    let len = text.length(text$1);
    text.eachChar(text$1, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || fg, bg);
    });
    for(let i = len; i < w; ++i) {
      this.plotChar(i + x, y, ' ', bg, bg);
    }
  }

  wrapText(x, y, width, text, fg, bg, opts={}) {
    if (typeof opts === 'number') { opts = { indent: opts }; }
    if (typeof fg === 'string') { fg = colors[fg]; }
    if (typeof bg === 'string') { bg = colors[bg]; }
    width = Math.min(width, this.width - x);
    if (text.length <= width) {
      this.plotText(x, y, text, fg, bg);
      return y + 1;
    }
    let first = true;
    let start = 0;
    let last = 0;
    for(let index = 0; index < text.length; ++index) {
      const ch = text[index];
      if (ch === '\n') {
        last = index;
      }
      if ((index - start >= width) || (ch === '\n')) {
        const sub = text.substring(start, last);
        this.plotText(x, y++, sub, fg, bg);
        if (first) {
          x += (opts.indent || 0);
          first = false;
        }
        start = last;
      }
      if (ch === ' ') {
        last = index + 1;
      }
    }

    if (start < text.length - 1) {
      const sub = text.substring(start);
      this.plotText(x, y++, sub, fg, bg);
    }
    return y;
  }

  fill(ch, fg, bg) {
    this.fillRect(0, 0, this.width, this.height, ch, fg, bg);
  }

  fillRect(x, y, w, h, ch, fg, bg) {
    if (typeof fg === 'string') { fg = colors[fg]; }
    if (typeof bg === 'string') { bg = colors[bg]; }
    this.forRect(x, y, w, h, (destCell, i, j) => {
      destCell.plotChar(ch, fg, bg);
    });
    this.needsUpdate = true;
  }

}

types.Buffer = Buffer;

function makeBuffer(w, h) {
  return new types.Buffer(w, h);
}

make.buffer = makeBuffer;

const DEFAULT_FONT = 'monospace';

var canvas = {};



function setFont(canvas, size, name) {
  canvas.font = name || DEFAULT_FONT;
  canvas.ctx.font = (size) + 'px ' + canvas.font;
  canvas.ctx.textAlign = 'center';
  canvas.ctx.textBaseline = 'middle';
}


function handleResizeEvent() {

  const rect = this.element.getBoundingClientRect();
  this.pxWidth  = rect.width;
  this.pxHeight = rect.height;
  ui.debug('canvas resize', rect);

  this.buffer.forEach((c) => { c.needsUpdate = true; });
}



class Canvas {
  constructor(w, h, div, opts={}) {
    this.buffer = make.buffer(w, h);
    this.dead = [];
    this.displayRatio = 1;
    this.width  = w;
    this.height = h;

    if (typeof document !== 'undefined') {
      let parent = document;
      this.element = document.getElementById(div);
      if (this.element && this.element.tagName !== 'CANVAS') {
        parent = this.element;
        this.element = null;
      }
      if (!this.element) {
        // Need to create canvas
        this.element = document.createElement('canvas');
        parent.appendChild(this.element);
      }

      this.ctx = this.element.getContext('2d');
      this.displayRatio = window.devicePixelRatio || 1;

      const bounds = this.element.getBoundingClientRect();
      const size = Math.min(Math.floor(bounds.width / this.width), Math.floor(bounds.height / this.height));

      this.tileSize = opts.tileSize || size;
      this.pxWidth  = bounds.width;
      this.pxHeight = bounds.height;
    }
    else {
      this.tileSize = opts.tileSize || 16;
      this.pxWidth  = this.tileSize * this.width  * this.displayRatio;
      this.pxHeight = this.tileSize * this.height * this.displayRatio;
    }

    this.dances = false;

    if (typeof window !== 'undefined') {
      this.element.width = this.width * this.tileSize;
      this.element.height = this.height * this.tileSize;

      window.addEventListener('resize', handleResizeEvent.bind(this));
      handleResizeEvent.call(this);

      setFont(this, this.tileSize);
    }


  }

  hasXY(x, y) {
    return this.buffer.hasXY(x, y);
  }

  toX(x) {
    return Math.floor(this.buffer.width * x / this.pxWidth);
  }

  toY(y) {
    return Math.floor(this.buffer.height * y / this.pxHeight);
  }

  draw() {
    if ((this.buffer.needsUpdate || this.dances)) {

      this.buffer.needsUpdate = false;
      this.dances = false;

      this.buffer.forEach( (cell, i, j) => {
        if (cell.fg.dances || cell.bg.dances) {
          this.dances = true;
          if (cosmetic.value() < 0.002) {
            cell.needsUpdate = true;
          }
        }

        if (cell.needsUpdate) {
          if (cell.wasHanging && j < this.buffer.height - 1) {
            this.buffer[i][j + 1].needsUpdate = true;	// redraw the row below any hanging letters that changed
            cell.wasHanging = false;
          }

          this.drawCell(cell, i, j);
          cell.needsUpdate = false;
        }
      });

    }
  }

  drawCell(cell, x, y) {
    const ctx = this.ctx;
    const tileSize = this.tileSize;// * this.displayRatio;

    const backCss = color.css(cell.bg);
    ctx.fillStyle = backCss;

    ctx.fillRect(
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    );

    if (cell.ch && cell.ch !== ' ') {
      const foreCss = color.css(cell.fg);
      ctx.fillStyle = foreCss;

      const textX = x * tileSize + Math.floor(tileSize * 0.5);
      const textY = y * tileSize + Math.floor(tileSize * 0.5);

      ctx.fillText(
        cell.ch,
        textX,
        textY
      );
    }
  }

  allocBuffer() {
    let buf;
    if (this.dead.length) {
      buf = this.dead.pop();
    }
    else {
      buf = new types.Buffer(this.buffer.width, this.buffer.height);
    }

    buf.copy(this.buffer);
    return buf;
  }

  freeBuffer(...bufs) {
    bufs.forEach( (buf) => this.dead.push(buf) );
  }

  copyBuffer(dest) {
    dest.copy(this.buffer);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlay( overBuf,  previousBuf) {
    if (previousBuf) {
      previousBuf.copy(this.buffer);
    }
    this.overlayRect(overBuf, 0, 0, this.buffer.width, this.buffer.height);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlayRect(overBuf, x, y, w, h) {
    let i, j;

    for (i=x; i<x + w; i++) {
      for (j=y; j<y + h; j++) {
        const src = overBuf[i][j];
        if (src.opacity) {
          const dest = this.buffer[i][j];
          if (!dest.equals(src)) {
            dest.copy(src); // was copy
            dest.needsUpdate = true;
            this.buffer.needsUpdate = true;
          }
        }
      }
    }

  }

}

types.Canvas = Canvas;

var io = {};

io.debug = utils$1.NOOP;

let KEYMAP = {};
// const KEYMAPS = [];
const EVENTS = [];
const DEAD_EVENTS = [];

const KEYPRESS  = def.KEYPRESS  = 'keypress';
const MOUSEMOVE = def.MOUSEMOVE = 'mousemove';
const CLICK 		 = def.CLICK 		 = 'click';
const TICK 		 = def.TICK 		 = 'tick';

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
	return EVENTS.length;
}

io.hasEvents = hasEvents;


function clearEvents() {
	while (EVENTS.length) {
		const ev = EVENTS.shift();
		DEAD_EVENTS.push(ev);
	}
}

io.clearEvents = clearEvents;


function pushEvent(ev) {
  if (EVENTS.length) {
		const last = EVENTS[EVENTS.length - 1];
		if (last.type === MOUSEMOVE) {
	    if (last.type === ev.type) {
				last.x = ev.x;
			  last.y = ev.y;
				io.recycleEvent(ev);
	      return;
	    }
		}
  }

	if (CURRENT_HANDLER) {
  	CURRENT_HANDLER(ev);
  }
  else {
		if (ev.type === TICK) {
			const first = EVENTS[0];
			if (first && first.type === TICK) {
				first.dt += ev.dt;
				io.recycleEvent(ev);
				return;
			}
			EVENTS.unshift(ev);	// ticks go first
		}
		else {
			EVENTS.push(ev);
		}
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
		command = km[ev.key] || km[ev.code];
	}
	else if (km[ev.type]) {
		command = km[ev.type];
	}

	if (command) {
		if (typeof command === 'function') {
			result = await command.call(km, ev);
		}
		else if (commands[command]) {
			result = await commands[command](ev);
		}
		else {
			utils$1.WARN('No command found: ' + command);
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

  ev.type = e.buttons ? CLICK : MOUSEMOVE;
  ev.key = null;
  ev.code = null;
  ev.x = x;
  ev.y = y;
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
	// io.debug('events paused');
}

io.pauseEvents = pauseEvents;

function resumeEvents() {
	CURRENT_HANDLER = PAUSED;
	PAUSED = null;
	// io.debug('resuming events');

	if (EVENTS.length && CURRENT_HANDLER) {
		const e = EVENTS.shift();
		// io.debug('- processing paused event', e.type);
		CURRENT_HANDLER(e);
		// io.recycleEvent(e);	// DO NOT DO THIS B/C THE HANDLER MAY PUT IT BACK ON THE QUEUE (see tickMs)
	}
	// io.debug('events resumed');
}

io.resumeEvents = resumeEvents;


function nextEvent(ms, match) {
	match = match || utils$1.TRUE;
	let elapsed = 0;

	while (EVENTS.length) {
  	const e = EVENTS.shift();
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
	let elapsed = 0;

	CURRENT_HANDLER = ((e) => {
  	if (e.type !== TICK) {
			EVENTS.push(e);
    	return;
    }
		elapsed += e.dt;
		if (elapsed >= ms) {
			CURRENT_HANDLER = null;
			done(elapsed);
		}
  });

  return new Promise( (resolve) => done = resolve );
}

io.tickMs = tickMs;


// TODO - io.tickMs(ms)

async function nextKeyPress(ms, match) {
	ms = ms || 0;
	match = match || utils$1.TRUE;
	function matchingKey(e) {
  	if (e.type !== KEYPRESS) return false;
    return match(e);
  }
  return io.nextEvent(ms, matchingKey);
}

io.nextKeyPress = nextKeyPress;

async function nextKeyOrClick(ms, matchFn) {
	ms = ms || 0;
	matchFn = matchFn || utils$1.TRUE;
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

var PATH = {};


const PDS_FORBIDDEN   = def.PDS_FORBIDDEN   = -1;
const PDS_OBSTRUCTION = def.PDS_OBSTRUCTION = -2;
const PDS_NO_PATH     = def.PDS_NO_PATH     = 30000;

// GW.actor.avoidsCell = GW.actor.avoidsCell || GW.utils.FALSE;
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

PATH.dijkstraScan = dijkstraScan;

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

PATH.calculateDistances = calculateDistances;

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



//
// // Returns -1 if there are no beneficial moves.
// // If preferDiagonals is true, we will prefer diagonal moves.
// // Always rolls downhill on the distance map.
// // If monst is provided, do not return a direction pointing to
// // a cell that the monster avoids.
// function nextStep( /* short **/ distanceMap, x, y, /* creature */ traveler, useDiagonals) {
// 	let newX, newY, bestScore;
//   let dir, bestDir;
//   let blocker;	// creature *
//   let blocked;
//
//   // brogueAssert(coordinatesAreInMap(x, y));
//
// 	bestScore = 0;
// 	bestDir = def.NO_DIRECTION;
//
// 	for (dir = 0; dir < (useDiagonals ? 8 : 4); ++dir)
//   {
// 		newX = x + DIRS[dir][0];
// 		newY = y + DIRS[dir][1];
//
//     if (GW.MAP.hasLoc(newX, newY)) {
//         blocked = false;
//         blocker = GW.MAP.actorAt(newX, newY);
//         if (traveler
//             && GW.actor.avoidsCell(traveler, newX, newY))
// 				{
//             blocked = true;
//         } else if (traveler && blocker
//                    && !GW.actor.canPass(traveler, blocker))
// 				{
//             blocked = true;
//         }
//         if (!blocked
// 						&& (distanceMap[x][y] - distanceMap[newX][newY]) > bestScore
//             && !GW.MAP.diagonalBlocked(x, y, newX, newY, traveler === GW.PLAYER)
//             && GW.MAP.isPassableNow(newX, newY, traveler === GW.PLAYER))
// 				{
//             bestDir = dir;
//             bestScore = distanceMap[x][y] - distanceMap[newX][newY];
//         }
//     }
// 	}
// 	return bestDir;
// }
//
// GW.path.nextStep = nextStep;
//


//
// function getClosestValidLocationOnMap(map, x, y) {
// 	let i, j, dist, closestDistance, lowestMapScore;
// 	let locX = -1;
// 	let locY = -1;
//
// 	closestDistance = 10000;
// 	lowestMapScore = 10000;
// 	for (i=1; i<map.width-1; i++) {
// 		for (j=1; j<map.height-1; j++) {
// 			if (map[i][j] >= 0 && map[i][j] < PDS_NO_PATH) {
// 				dist = (i - x)*(i - x) + (j - y)*(j - y);
// 				//hiliteCell(i, j, &purple, min(dist / 2, 100), false);
// 				if (dist < closestDistance
// 					|| dist == closestDistance && map[i][j] < lowestMapScore)
// 				{
// 					locX = i;
// 					locY = j;
// 					closestDistance = dist;
// 					lowestMapScore = map[i][j];
// 				}
// 			}
// 		}
// 	}
// 	if (locX >= 0) return [locX, locY];
// 	return null;
// }
//
//
// // Populates path[][] with a list of coordinates starting at origin and traversing down the map. Returns the number of steps in the path.
// function getMonsterPathOnMap(distanceMap, originX, originY, monst) {
// 	let dir, x, y, steps;
//
// 	// monst = monst || GW.PLAYER;
// 	x = originX;
// 	y = originY;
// 	steps = 0;
//
//
// 	if (distanceMap[x][y] < 0 || distanceMap[x][y] >= PDS_NO_PATH) {
// 		const loc = getClosestValidLocationOnMap(distanceMap, x, y);
// 		if (loc) {
// 			x = loc[0];
// 			y = loc[1];
// 		}
// 	}
//
// 	const path = [[x, y]];
// 	dir = 0;
// 	while (dir != def.NO_DIRECTION) {
// 		dir = GW.path.nextStep(distanceMap, x, y, monst, true);
// 		if (dir != def.NO_DIRECTION) {
// 			x += DIRS[dir][0];
// 			y += DIRS[dir][1];
// 			// path[steps][0] = x;
// 			// path[steps][1] = y;
// 			path.push([x,y]);
// 			steps++;
//       // brogueAssert(coordinatesAreInMap(x, y));
// 		}
// 	}
//
// 	return steps ? path : null;
// }
//
// GW.path.from = getMonsterPathOnMap;

var digger = {};
var diggers = {};

digger.debug = utils$1.NOOP;

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

  if (!config.width || !config.height) utils$1.ERROR('All diggers require config to include width and height.');

  Object.entries(opts).forEach( ([key,expect]) => {
    const have = config[key];

    if (expect === true) {	// needs to be a number > 0
      if (typeof have !== 'number') {
        utils$1.ERROR('Invalid configuration for digger: ' + key + ' expected number received ' + typeof have);
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
        utils$1.WARN('Received unexpected config for digger : ' + key + ' expected array, received ' + typeof have + ', using defaults.');
        config[key] = expect.slice();
      }
      else if (expect.length > have.length) {
        for(let i = have.length; i < expect.length; ++i) {
          have[i] = expect[i];
        }
      }
    }
    else {
      utils$1.WARN('Unexpected digger configuration parameter: ', key, expect);
    }
  });

  return config;
}

digger.checkConfig = checkDiggerConfig;


function digCavern(config, grid) {
  config = digger.checkConfig(config, { width: 12, height: 8 });
  if (!grid) return config;

  let destX, destY;
  let blobGrid;

  blobGrid = GRID.alloc(grid.width, grid.height, 0);

  const minWidth  = Math.floor(0.5 * config.width); // 6
  const maxWidth  = config.width;
  const minHeight = Math.floor(0.5 * config.height);  // 4
  const maxHeight = config.height;

  grid.fill(0);
  const bounds = GRID.fillBlob(blobGrid, 5, minWidth, minHeight, maxWidth, maxHeight, 55, "ffffffttt", "ffffttttt");

  // Position the new cave in the middle of the grid...
  destX = Math.floor((grid.width - bounds.width) / 2);
  destY = Math.floor((grid.height - bounds.height) / 2);

  // ...and copy it to the master grid.
  GRID.offsetZip(grid, blobGrid, destX - bounds.x, destY - bounds.y, config.tile);
  GRID.free(blobGrid);
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
    utils$1.ERROR('Expected choices to be either array of choices or map { digger: weight }');
  }
  for(let choice of choices) {
    if (!diggers[choice]) {
      utils$1.ERROR('Missing digger choice: ' + choice);
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
  grid.fillRect(roomX, roomY, roomWidth, roomHeight, config.tile || TILE);
  grid.fillRect(roomX2, roomY2, roomWidth2, roomHeight2, config.tile || TILE);
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

  grid.fillRect(roomX - 5, roomY + 5, roomWidth, roomHeight, config.tile || TILE);
  grid.fillRect(roomX2 - 5, roomY2 + 5, roomWidth2, roomHeight2, config.tile || TILE);
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
  grid.fillRect(Math.floor((grid.width - majorWidth)/2), Math.floor((grid.height - minorHeight)/2), majorWidth, minorHeight, config.tile || TILE);
  grid.fillRect(Math.floor((grid.width - minorWidth)/2), Math.floor((grid.height - majorHeight)/2), minorWidth, majorHeight, config.tile || TILE);
  return config.id;
}

digger.symmetricalCrossRoom = digSymmetricalCrossRoom;


function digRectangularRoom(config, grid) {
  config = digger.checkConfig(config, { width: 6, height: 4, minPct: 50 });
  if (!grid) return config;

  const width = Math.floor( config.width * random.range(config.minPct, 100) / 100);  // [3,6]
  const height = Math.floor( config.height * random.range(config.minPct, 100) / 100);  // [2,4]

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - width) / 2), Math.floor((grid.height - height) / 2), width, height, config.tile || TILE);
  return config.id;
}

digger.rectangularRoom = digRectangularRoom;


function digCircularRoom(config, grid) {
  config = digger.checkConfig(config, { width: 6, height: 6 });
  if (!grid) return config;

  const radius = Math.floor( (Math.min(config.width, config.height)-1) * random.range(75, 100) / 200);  // [3,4]

  grid.fill(0);
  if (radius > 1) {
    grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, config.tile || TILE);
  }

  return config.id;
}

digger.circularRoom = digCircularRoom;


function digBrogueDonut(config, grid) {
  config = digger.checkConfig(config, { width: 10, height: 10, altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
  if (!grid) return config;

  const radius = Math.floor( Math.min(config.width, config.height) * random.range(75, 100) / 100);  // [5,10]

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, config.tile || TILE);

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

          grid.fillCircle(x, y, 2, config.tile || TILE);
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

  const grid = GRID.alloc(sourceGrid.width, sourceGrid.height);
  grid.copy(sourceGrid);

  for (i=0; i<grid.width; i++) {
      for (j=0; j<grid.height; j++) {
          if (!grid[i][j]) {
              dir = GRID.directionOfDoorSite(grid, i, j);
              if (dir != def.NO_DIRECTION) {
                  // Trace a ray 10 spaces outward from the door site to make sure it doesn't intersect the room.
                  // If it does, it's not a valid door site.
                  newX = i + DIRS$2[dir][0];
                  newY = j + DIRS$2[dir][1];
                  doorSiteFailed = false;
                  for (k=0; k<10 && grid.hasXY(newX, newY) && !doorSiteFailed; k++) {
                      if (grid[newX][newY]) {
                          doorSiteFailed = true;
                      }
                      newX += DIRS$2[dir][0];
                      newY += DIRS$2[dir][1];
                  }
                  if (!doorSiteFailed) {
                      grid[i][j] = dir + 10000; // So as not to conflict with other tiles.
                  }
              }
          }
      }
  }

  let doorSites = [];
  // Pick four doors, one in each direction, and store them in doorSites[dir].
  for (dir=0; dir<4; dir++) {
      const loc = grid.randomMatchingXY(dir + 10000) || [-1, -1];
      doorSites[dir] = loc.slice();
  }

  GRID.free(grid);
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

    const horizontalLength = utils$1.first('horizontalHallLength', opts, [9,15]);
    const verticalLength = utils$1.first('verticalHallLength', opts, [2,9]);

    // Pick a direction.
    dir = opts.dir;
    if (dir === undefined) {
      const dirs = utils$1.sequence(4);
      random.shuffle(dirs);
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
    x = utils$1.clamp(x - DIRS$2[dir][0], 0, grid.width - 1);
    y = utils$1.clamp(y - DIRS$2[dir][1], 0, grid.height - 1); // Now (x, y) points at the last interior cell of the hallway.
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

var tileEvent = {};
var tileEvents = {};

tileEvent.debug = utils$1.NOOP;

const Fl$1 = flag.fl;

const Flags = flag.install('tileEvent', {
	DFF_SUBSEQ_ALWAYS							: Fl$1(0),	// Always fire the subsequent event, even if no tiles changed.
	DFF_SUBSEQ_EVERYWHERE			    : Fl$1(1),	// Subsequent DF spawns in every cell that this DF spawns in, instead of only the origin
	DFF_TREAT_AS_BLOCKING			    : Fl$1(2),	// If filling the footprint of this DF with walls would disrupt level connectivity, then abort.
	DFF_PERMIT_BLOCKING				    : Fl$1(3),	// Generate this DF without regard to level connectivity.
	DFF_ACTIVATE_DORMANT_MONSTER	: Fl$1(4),	// Dormant monsters on this tile will appear -- e.g. when a statue bursts to reveal a monster.
	DFF_BLOCKED_BY_OTHER_LAYERS		: Fl$1(6),	// Will not propagate into a cell if any layer in that cell has a superior priority.
	DFF_SUPERPRIORITY				      : Fl$1(7),	// Will overwrite terrain of a superior priority.
  DFF_AGGRAVATES_MONSTERS       : Fl$1(8),  // Will act as though an aggravate monster scroll of effectRadius radius had been read at that point.
  DFF_RESURRECT_ALLY            : Fl$1(9),  // Will bring back to life your most recently deceased ally.
	DFF_EMIT_EVENT								: Fl$1(10), // Will emit the event when activated
	DFF_NO_REDRAW_CELL						: Fl$1(11),
	DFF_ABORT_IF_BLOCKS_MAP				: Fl$1(12),

	DFF_ALWAYS_FIRE								: Fl$1(14),	// Fire even if the cell is marked as having fired this turn
	DFF_NO_MARK_FIRED							: Fl$1(15),	// Do not mark this cell as having fired an event
	// MUST_REPLACE_LAYER
	// NEEDS_EMPTY_LAYER
	DFF_PROTECTED									: Fl$1(18),

	DFF_SPREAD_CIRCLE							: Fl$1(20),	// Spread in a circle around the spot (using FOV), radius calculated using spread+decrement
	DFF_SPREAD_LINE								: Fl$1(21),	// Spread in a line in one random direction

	DFF_CLEAR_CELL			  	: Fl$1(22),	// Erase other terrain in the footprint of this DF.
	DFF_EVACUATE_CREATURES	: Fl$1(23),	// Creatures in the DF area get moved outside of it
	DFF_EVACUATE_ITEMS			: Fl$1(24),	// Creatures in the DF area get moved outside of it

	DFF_BUILD_IN_WALLS			: Fl$1(25),
	DFF_MUST_TOUCH_WALLS		: Fl$1(26),
	DFF_NO_TOUCH_WALLS			: Fl$1(27),

});

tileEvent.Flags = Flags;


class TileEvent {
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
		this.flags = Flags.toFlag(opts.flags);
		this.matchTile = opts.matchTile || opts.needs || 0;	/* ENUM tileType */
		this.next = opts.next || null;	/* ENUM makeEventTypes */

		this.message = opts.message || null;
	  this.lightFlare = opts.flare || 0;
		this.flashColor = opts.flash ? color.from(opts.flash) : null;
		// this.effectRadius = radius || 0;
		this.messageDisplayed = false;
		this.eventName = opts.event || null;	// name of the event to emit when activated
		this.id = opts.id || null;
	}

}

types.TileEvent = TileEvent;


// Dungeon features, spawned from Architect.c:
function makeEvent(opts) {
	const te = new types.TileEvent(opts);
	return te;
}

make.tileEvent = makeEvent;


function installEvent(id, event) {
	if (arguments.length > 2 || !(event instanceof types.TileEvent)) {
		event = make.tileEvent(...[].slice.call(arguments, 1));
	}
  tileEvents[id] = event;
	if (event) tileEvent.id = id;
	return event;
}

tileEvent.install = installEvent;

installEvent('DF_NONE');



function resetAllMessages() {
	Object.values(tileEvents).forEach( (f) => {
		if (f instanceof types.Event) {
			f.messageDisplayed = false;
		}
	});
}

tileEvent.resetAllMessages = resetAllMessages;



// returns whether the feature was successfully generated (false if we aborted because of blocking)
async function spawn(feat, ctx) {
	let i, j;
	let tile$1, itemKind;

	if (!feat) return false;
	if (!ctx) return false;

	if (typeof feat === 'string') {
		const name = feat;
		feat = tileEvents[feat];
		if (!feat) utils$1.ERROR('Unknown tile Event: ' + name);
	}

	if (typeof feat === 'function') {
		return feat(ctx);
	}

	const map$1 = ctx.map;
	const x = ctx.x;
	const y = ctx.y;

	if (!map$1 || x === undefined || y === undefined) {
		utils$1.ERROR('MAP, x, y are required in context.');
	}

	if (map$1.hasCellMechFlag(x, y, MechFlags.EVENT_FIRED_THIS_TURN)) {
		if (!(feat.flags & Flags.DFF_ALWAYS_FIRE)) {
			return false;
		}
	}

	tileEvent.debug('spawn', x, y, 'id=', feat.id, 'tile=', feat.tile, 'item=', feat.item);

	const refreshCell = ctx.refreshCell = ctx.refreshCell || !(feat.flags & Flags.DFF_NO_REDRAW_CELL);
	const abortIfBlocking = ctx.abortIfBlocking = ctx.abortIfBlocking || (feat.flags & Flags.DFF_ABORT_IF_BLOCKS_MAP);

  // if ((feat.flags & DFF_RESURRECT_ALLY) && !resurrectAlly(x, y))
	// {
  //     return false;
  // }

  if (feat.message && feat.message.length && !feat.messageDisplayed && map$1.isVisible(x, y)) {
		feat.messageDisplayed = true;
		message.add(feat.message);
	}

  if (feat.tile) {
		if (typeof feat.tile === 'string') {
			tile$1 = tile.withName(feat.tile);
			if (tile$1) {
				feat.tile = tile$1.id;
			}
		}
		else {
			tile$1 = tiles[feat.tile];
		}

		if (!tile$1) {
			utils$1.ERROR('Unknown tile: ' + feat.tile);
		}
	}

	if (feat.item) {
		itemKind = itemKinds[feat.item];
		if (!itemKind) {
			utils$1.ERROR('Unknown item: ' + feat.item);
		}
	}

	// Blocking keeps track of whether to abort if it turns out that the DF would obstruct the level.
	const blocking = ctx.blocking = ((abortIfBlocking
							 && !(feat.flags & Flags.DFF_PERMIT_BLOCKING)
							 && ((tile$1 && (tile$1.flags & (Flags$2.T_PATHING_BLOCKER)))
										|| (itemKind && (itemKind.flags & KindFlags.IK_BLOCKS_MOVE))
										|| (feat.flags & Flags.DFF_TREAT_AS_BLOCKING))) ? true : false);

	tileEvent.debug('- blocking', blocking);

	const spawnMap = GRID.alloc(map$1.width, map$1.height);

	let succeeded = false;
	tileEvent.computeSpawnMap(feat, spawnMap, ctx);
  if (!blocking || !map.gridDisruptsPassability(map$1, spawnMap, { bounds: ctx.bounds })) {
		if (feat.flags & Flags.DFF_EVACUATE_CREATURES) { // first, evacuate creatures, so that they do not re-trigger the tile.
				await tileEvent.evacuateCreatures(map$1, spawnMap);
		}

		if (feat.flags & Flags.DFF_EVACUATE_ITEMS) { // first, evacuate items, so that they do not re-trigger the tile.
				await tileEvent.evacuateItems(map$1, spawnMap);
		}

		if (feat.flags & Flags.DFF_CLEAR_CELL) { // first, clear other tiles (not base/ground)
				await tileEvent.clearCells(map$1, spawnMap);
		}

		if (tile$1 || itemKind || feat.fn) {
			succeeded = await tileEvent.spawnTiles(feat, spawnMap, ctx, tile$1, itemKind);
		}
	}

	if (succeeded && (feat.flags & Flags.DFF_PROTECTED)) {
		spawnMap.forEach( (v, i, j) => {
			if (!v) return;
			const cell = map$1.cell(i, j);
			cell.mechFlags |= MechFlags.EVENT_PROTECTED;
		});
	}

	// if (refreshCell && feat.tile
	// 	&& (tile.flags & (TileFlags.T_IS_FIRE | TileFlags.T_AUTO_DESCENT))
	// 	&& map.hasTileFlag(PLAYER.xLoc, PLAYER.yLoc, (TileFlags.T_IS_FIRE | TileFlags.T_AUTO_DESCENT)))
	// {
	// 	await applyInstantTileEffectsToCreature(PLAYER);
	// }

	// apply tile effects
	if (succeeded) {
		for(let i = 0; i < spawnMap.width; ++i) {
			for(let j = 0; j < spawnMap.height; ++j) {
				const v = spawnMap[i][j];
				if (!v || data.gameHasEnded) continue;
				const cell = map$1.cell(i, j);
				if (cell.actor || cell.item) {
					for(let t of cell.tiles()) {
						await tile.applyInstantEffects(t, cell);
						if (data.gameHasEnded) {
							return true;
						}
					}
				}
			}
		}
	}

	if (data.gameHasEnded) {
		GRID.free(spawnMap);
		return succeeded;
	}

  //	if (succeeded && feat.message[0] && !feat.messageDisplayed && isVisible(x, y)) {
  //		feat.messageDisplayed = true;
  //		message(feat.message, false);
  //	}
  if (feat.next && (succeeded || feat.flags & Flags.DFF_SUBSEQ_ALWAYS)) {
    if (feat.flags & Flags.DFF_SUBSEQ_EVERYWHERE) {
        for (i=0; i<map$1.width; i++) {
            for (j=0; j<map$1.height; j++) {
                if (spawnMap[i][j]) {
										ctx.x = i;
										ctx.y = j;
                    await tileEvent.spawn(feat.next, ctx);
                }
            }
        }
				ctx.x = x;
				ctx.y = y;
    }
		else {
        await tileEvent.spawn(feat.next, ctx);
    }
	}
	if (succeeded) {
    if (feat.tile
        && (tile$1.flags & (Flags$2.T_IS_DEEP_WATER | Flags$2.T_LAVA | Flags$2.T_AUTO_DESCENT)))
		{
        data.updatedMapToShoreThisTurn = false;
    }

    // awaken dormant creatures?
    // if (feat.flags & Flags.DFF_ACTIVATE_DORMANT_MONSTER) {
    //     for (monst of map.dormant) {
    //         if (monst.x == x && monst.y == y || spawnMap[monst.x][monst.y]) {
    //             // found it!
    //             toggleMonsterDormancy(monst);
    //         }
    //     }
    // }
  }

	// if (succeeded && feat.flags & Flags.DFF_EMIT_EVENT && feat.eventName) {
	// 	await GAME.emit(feat.eventName, x, y);
	// }

	if (succeeded) {
		ui.requestUpdate();

		if (!(feat.flags & Flags.DFF_NO_MARK_FIRED)) {
			spawnMap.forEach( (v, i, j) => {
				if (v) {
					map$1.setCellFlags(i, j, 0, MechFlags.EVENT_FIRED_THIS_TURN);
				}
			});
		}
	}

	GRID.free(spawnMap);
	return succeeded;
}

tileEvent.spawn = spawn;


function cellIsOk(feat, x, y, ctx) {
	const map = ctx.map;
	if (!map.hasXY(x, y)) return false;
	const cell = map.cell(x, y);

	if (feat.flags & Flags.DFF_BUILD_IN_WALLS) {
		if (!cell.isWall()) return false;
	}
	else if (feat.flags & Flags.DFF_MUST_TOUCH_WALLS) {
		let ok = false;
		map.eachNeighbor(x, y, (c) => {
			if (c.isWall()) {
				ok = true;
			}
		});
		if (!ok) return false;
	}
	else if (feat.flags & Flags.DFF_NO_TOUCH_WALLS) {
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
	if (cell.hasTileFlag(Flags$2.T_OBSTRUCTS_TILE_EFFECTS) && !feat.matchTile) return false;

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

	if (bounds) {
		tileEvent.debug('- bounds', bounds);
	}

	let startProb = feat.spread || 0;
	let probDec = feat.decrement || 0;

	if (feat.matchTile && typeof feat.matchTile === 'string') {
		const name = feat.matchTile;
		const tile$1 = tile.withName(name);
		if (!tile$1) {
			utils$1.ERROR('Failed to find match tile with name:' + name);
		}
		feat.matchTile = tile$1.id;
	}

	spawnMap[x][y] = t = 1; // incremented before anything else happens

	let radius = feat.radius || 0;
	if (feat.flags & Flags.DFF_SPREAD_CIRCLE) {
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

			const dist = Math.floor(utils$1.distanceBetween(x, y, i, j));
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

		if (feat.flags & Flags.DFF_SPREAD_LINE) {
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

tileEvent.computeSpawnMap = computeSpawnMap;


async function spawnTiles(feat, spawnMap, ctx, tile, itemKind)
{
	let i, j;
	let accomplishedSomething;

	accomplishedSomething = false;

	const blockedByOtherLayers = (feat.flags & Flags.DFF_BLOCKED_BY_OTHER_LAYERS);
	const superpriority = (feat.flags & Flags.DFF_SUPERPRIORITY);
	const applyEffects = ctx.refreshCell;
	const map = ctx.map;

	for (i=0; i<spawnMap.width; i++) {
		for (j=0; j<spawnMap.height; j++) {

			if (!spawnMap[i][j]) continue;	// If it's not flagged for building in the spawn map,
			spawnMap[i][j] = 0; // so that the spawnmap reflects what actually got built

			const cell = map.cell(i, j);
			if (cell.mechFlags & MechFlags.EVENT_PROTECTED) continue;

			if (tile) {
				if ( (cell.layers[tile.layer] !== tile.id)  														// If the new cell does not already contains the fill terrain,
					&& (superpriority || cell.tile(tile.layer).priority < tile.priority)  // If the terrain in the layer to be overwritten has a higher priority number (unless superpriority),
					&& (!cell.obstructsLayer(tile.layer)) 																// If we will be painting into the surface layer when that cell forbids it,
					&& (!blockedByOtherLayers || cell.highestPriorityTile().priority < tile.priority))  // if the fill won't violate the priority of the most important terrain in this cell:
				{
					spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built

					cell.setTile(tile);
					if (feat.volume && cell.gas) {
					    cell.volume += (feat.volume || 0);
					}

					tileEvent.debug('- tile', i, j, 'tile=', tile.id);

					// cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;
					accomplishedSomething = true;
				}
			}

			if (itemKind) {
				if (superpriority || !cell.item) {
					if (!cell.hasTileFlag(Flags$2.T_OBSTRUCTS_ITEMS)) {
						spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built
						if (cell.item) {
							map.removeItem(cell.item);
						}
						const item = make.item(itemKind);
						map.addItem(i, j, item);
						// cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;
						accomplishedSomething = true;
						tileEvent.debug('- item', i, j, 'item=', itemKind.id);
					}
				}
			}

			if (feat.fn) {
				if (await feat.fn(i, j, ctx)) {
					spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built
					// cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;
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

tileEvent.spawnTiles = spawnTiles;



function clearCells(map, spawnMap) {
	spawnMap.forEach( (v, i, j) => {
		if (!v) return;
		map.clearCellTiles(i, j, false);	// skip gas
	});
}

tileEvent.clearCells = clearCells;


async function evacuateCreatures(map, blockingMap) {
	let i, j;
	let monst;

	for (i=0; i<map.width; i++) {
		for (j=0; j<map.height; j++) {
			if (blockingMap[i][j]
				&& (map.hasCellFlag(i, j, Flags$1.HAS_ACTOR)))
			{
				monst = map.actorAt(i, j);
				const forbidFlags = monst.forbiddenTileFlags();
				const loc = map.matchingXYNear(
									 i, j, (cell) => {
										 if (cell.hasFlags(Flags$1.HAS_ACTOR)) return false;
										 if (cell.hasTileFlags(forbidFlags)) return false;
										 return true;
									 },
									 { hallwaysAllowed: true, blockingMap });
				await map.moveActor(loc[0], loc[1], monst);
			}
		}
	}
}

tileEvent.evacuateCreatures = evacuateCreatures;



async function evacuateItems(map, blockingMap) {

	blockingMap.forEach( (v, i, j) => {
		if (!v) return;
		const cell = map.cell(i, j);
		if (!cell.item) return;

		const forbidFlags = cell.item.forbiddenTileFlags();
		const loc = map.matchingXYNear(
							 i, j, (cell) => {
								 if (cell.hasFlags(Flags$1.HAS_ITEM)) return false;
								 if (cell.hasTileFlags(forbidFlags)) return false;
								 return true;
							 },
							 { hallwaysAllowed: true, blockingMap });
		if (loc) {
			map.removeItem(cell.item);
			map.addItem(loc[0], loc[1], cell.item);
		}
	});
}

tileEvent.evacuateItems = evacuateItems;

var cell = {};


color.install('cursorColor', 25, 100, 150);
config.cursorPathIntensity = 50;


const Fl$2 = flag.fl;

const Flags$1 = flag.install('cell', {
  REVEALED					: Fl$2(0),
  VISIBLE							: Fl$2(1),	// cell has sufficient light and is in field of view, ready to draw.
  WAS_VISIBLE					: Fl$2(2),
  IN_FOV		          : Fl$2(3),	// player has unobstructed line of sight whether or not there is enough light

  HAS_PLAYER					: Fl$2(4),
  HAS_MONSTER					: Fl$2(5),
  HAS_DORMANT_MONSTER	: Fl$2(6),	// hidden monster on the square
  HAS_ITEM						: Fl$2(7),
  HAS_STAIRS					: Fl$2(8),

  NEEDS_REDRAW        : Fl$2(9),	// needs to be redrawn (maybe in path, etc...)
  TILE_CHANGED				: Fl$2(10),	// one of the tiles changed

  IS_IN_PATH					: Fl$2(12),	// the yellow trail leading to the cursor
  IS_CURSOR						: Fl$2(13),	// the current cursor

  MAGIC_MAPPED				: Fl$2(14),
  ITEM_DETECTED				: Fl$2(15),

  STABLE_MEMORY						: Fl$2(16),	// redraws will simply be pulled from the memory array, not recalculated

  CLAIRVOYANT_VISIBLE			: Fl$2(17),
  WAS_CLAIRVOYANT_VISIBLE	: Fl$2(18),
  CLAIRVOYANT_DARKENED		: Fl$2(19),	// magical blindness from a cursed ring of clairvoyance

  IMPREGNABLE							: Fl$2(20),	// no tunneling allowed!

  TELEPATHIC_VISIBLE			: Fl$2(22),	// potions of telepathy let you see through other creatures' eyes
  WAS_TELEPATHIC_VISIBLE	: Fl$2(23),	// potions of telepathy let you see through other creatures' eyes

  MONSTER_DETECTED				: Fl$2(24),
  WAS_MONSTER_DETECTED		: Fl$2(25),

  CELL_LIT                : Fl$2(28),
  IS_IN_SHADOW				    : Fl$2(29),	// so that a player gains an automatic stealth bonus
  CELL_DARK               : Fl$2(30),

  PERMANENT_CELL_FLAGS : ['REVEALED', 'MAGIC_MAPPED', 'ITEM_DETECTED', 'HAS_ITEM', 'HAS_DORMANT_MONSTER',
              'HAS_STAIRS', 'STABLE_MEMORY', 'IMPREGNABLE'],

  ANY_KIND_OF_VISIBLE			: ['VISIBLE', 'CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE'],
  HAS_ACTOR               : ['HAS_PLAYER', 'HAS_MONSTER'],
});

cell.flags = Flags$1;

///////////////////////////////////////////////////////
// CELL MECH

const MechFlags = flag.install('cellMech', {
  SEARCHED_FROM_HERE				: Fl$2(0),	// Player already auto-searched from here; can't auto search here again
  PRESSURE_PLATE_DEPRESSED	: Fl$2(1),	// so that traps do not trigger repeatedly while you stand on them
  KNOWN_TO_BE_TRAP_FREE			: Fl$2(2),	// keep track of where the player has stepped as he knows no traps are there

  CAUGHT_FIRE_THIS_TURN			: Fl$2(4),	// so that fire does not spread asymmetrically
  EVENT_FIRED_THIS_TURN     : Fl$2(5),  // so we don't update cells that have already changed this turn
  EVENT_PROTECTED           : Fl$2(6),

  IS_IN_LOOP					: Fl$2(10),	// this cell is part of a terrain loop
  IS_CHOKEPOINT				: Fl$2(11),	// if this cell is blocked, part of the map will be rendered inaccessible
  IS_GATE_SITE				: Fl$2(12),	// consider placing a locked door here
  IS_IN_ROOM_MACHINE	: Fl$2(13),
  IS_IN_AREA_MACHINE	: Fl$2(14),
  IS_POWERED					: Fl$2(15),	// has been activated by machine power this turn (can probably be eliminate if needed)

  IS_IN_MACHINE				: ['IS_IN_ROOM_MACHINE', 'IS_IN_AREA_MACHINE'], 	// sacred ground; don't generate items here, or teleport randomly to it

  PERMANENT_MECH_FLAGS : ['SEARCHED_FROM_HERE', 'PRESSURE_PLATE_DEPRESSED', 'KNOWN_TO_BE_TRAP_FREE', 'IS_IN_LOOP',
                          'IS_CHOKEPOINT', 'IS_GATE_SITE', 'IS_IN_MACHINE', ],
});

cell.mechFlags = MechFlags;


class CellMemory {
  constructor() {
    this.sprite = make.sprite();
    this.clear();
  }

  clear() {
    this.sprite.clear();
    this.itemKind = null;
    this.itemQuantity = 0;
    this.tile = null;
    this.cellFlags = 0;
    this.cellMechFlags = 0;
    this.tileFlags = 0;
    this.tileMechFlags = 0;
  }

  copy(other) {
    utils$1.copyObject(this, other);
  }
}

types.CellMemory = CellMemory;



class Cell {
  constructor() {
    this.layers = [0,0,0,0];
    this.memory = new types.CellMemory();
    this.clear();
  }

  copy(other) {
    utils$1.copyObject(this, other);
  }

  clear() {
    for(let i = 0; i < this.layers.length; ++i) {
      this.layers[i] = 0;
    }

    this.sprites = null;
    this.actor = null;
    this.item = null;

    this.flags = 0;							// non-terrain cell flags
    this.mechFlags = 0;
    this.gasVolume = 0;						// quantity of gas in cell
    this.liquidVolume = 0;
    this.machineNumber = 0;
    this.memory.clear();
    this.layerFlags = 0;
  }

  clearTiles(includeGas=true) {
    this.layers[1] = 0;
    this.layers[2] = 0;
    this.liquidVolume = 0;
    if (includeGas) {
      this.layers[3] = 0;
      this.gasVolume = 0;
    }
    this.redraw();
  }

  get ground() { return this.layers[0]; }
  get liquid() { return this.layers[1]; }
  get surface() { return this.layers[2]; }
  get gas() { return this.layers[3]; }

  dump() {
    for(let i = this.layers.length - 1; i >= 0; --i) {
      if (!this.layers[i]) continue;
      const tile = tiles[this.layers[i]];
      if (tile.sprite.ch) return tile.sprite.ch;
    }
    return tiles[0].sprite.ch;
  }
  isVisible() { return this.flags & Flags$1.VISIBLE; }
  isAnyKindOfVisible() { return (this.flags & Flags$1.ANY_KIND_OF_VISIBLE) || config.playbackOmniscience; }
  hasVisibleLight() { return true; }  // TODO

  redraw() { this.flags |= Flags$1.NEEDS_REDRAW; }

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
    this.flags |= Flags$1.NEEDS_REDRAW;
  }

  clearFlags(cellFlag=0, cellMechFlag=0) {
    this.flags &= ~cellFlag;
    this.mechFlags &= ~cellMechFlag;
    if ((~cellFlag) & Flags$1.NEEDS_REDRAW) {
      this.flags |= Flags$1.NEEDS_REDRAW;
    }
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
  //     return GW.utils.intersect(groups, tile.groups);
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

  // Retrieves a pointer to the flavor text of the highest-priority terrain at the given location
  tileDesc() {
    return this.highestPriorityTile().desc;
  }

  // Retrieves a pointer to the description text of the highest-priority terrain at the given location
  tileText() {
    return this.highestPriorityTile().text;
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
    if (!(tileFlags & Flags$2.T_PATHING_BLOCKER)) return true;
    if( tileFlags & Flags$2.T_BRIDGE) return true;

    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    return limitToPlayerKnowledge ? false : this.isSecretDoor();
  }

  canBePassed(limitToPlayerKnowledge) {
    if (this.isPassableNow(limitToPlayerKnowledge)) return true;
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    if (tileMechFlags & MechFlags$1.TM_CONNECTS_LEVEL) return true;
    return ((tileMechFlags & MechFlags$1.TM_PROMOTES) && !(this.promotedTileFlags() & Flags$2.T_PATHING_BLOCKER));
  }

  isWall(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags$2.T_OBSTRUCTS_EVERYTHING;
  }

  isObstruction(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags$2.T_OBSTRUCTS_DIAGONAL_MOVEMENT;
  }

  isDoor(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags$2.T_IS_DOOR;
  }

  isSecretDoor(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge) return false;
    const tileMechFlags = this.tileMechFlags();
    return (tileMechFlags & MechFlags$1.TM_IS_SECRET) && !(this.discoveredTileFlags() & Flags$2.T_PATHING_BLOCKER)
  }

  blocksPathing(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags$2.T_PATHING_BLOCKER;
  }

  isLiquid(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags$2.T_IS_LIQUID;
  }

  markRevealed() {
    this.flags &= ~Flags$1.STABLE_MEMORY;
    if (!(this.flags & Flags$1.REVEALED)) {
      this.flags |= Flags$1.REVEALED;
      if (!this.hasTileFlag(Flags$2.T_PATHING_BLOCKER)) {
        data.xpxpThisTurn++;
      }
    }
  }

  obstructsLayer(layer) {
    return layer == Layer.SURFACE && this.hasTileFlag(Flags$2.T_OBSTRUCTS_SURFACE_EFFECTS);
  }

  setTile(tileId=0, checkPriority=false) {
    let tile$1;
    if (typeof tileId === 'string') {
      tile$1 = tile.withName(tileId);
    }
    else if (tileId instanceof types.Tile) {
      tile$1 = tileId;
      tileId = tile$1.id;
    }
    else {
      tile$1 = tiles[tileId];
    }

    if (!tile$1) {
      tile$1 = tiles[0];
      tileId = 0;
    }

    const oldTileId = this.layers[tile$1.layer] || 0;
    const oldTile = tiles[oldTileId] || tiles[0];

    if (checkPriority && oldTile.priority > tile$1.priority) return false;

    if ((oldTile.flags & Flags$2.T_PATHING_BLOCKER)
      != (tile$1.flags & Flags$2.T_PATHING_BLOCKER))
    {
      data.staleLoopMap = true;
    }

    if ((tile$1.flags & Flags$2.T_IS_FIRE)
      && !(oldTile.flags & Flags$2.T_IS_FIRE))
    {
      this.setFlags(0, CellMechFlags.CAUGHT_FIRE_THIS_TURN);
    }

    this.layerFlags &= ~Fl$2(tile$1.layer); // turn off layer flag
    this.layers[tile$1.layer] = tile$1.id;

    if (tile$1.layer > 0 && this.layers[0] == 0) {
      this.layers[0] = tile.withName('FLOOR').id; // TODO - Not good
    }

    this.flags |= (Flags$1.NEEDS_REDRAW | Flags$1.TILE_CHANGED);
    return (oldTile.glowLight !== tile$1.glowLight);
  }

  clearLayers(except, floorTile) {
    floorTile = floorTile === undefined ? this.layers[0] : floorTile;
    for (let layer = 0; layer < this.layers.length; layer++) {
      if (layer != except && layer != Layer.GAS) {
          this.layers[layer] = (layer ? 0 : floorTile);
      }
    }
    this.flags |= (Flags$1.NEEDS_REDRAW | Flags$1.TILE_CHANGED);
  }

  clearTileWithFlags(tileFlags, tileMechFlags=0) {
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
    this.flags |= (Flags$1.NEEDS_REDRAW | Flags$1.TILE_CHANGED);
  }

  // EVENTS

  async fireEvent(name, ctx) {
    ctx.cell = this;
    let fired = false;
    for (let tile of this.tiles()) {
      if (!tile.events) continue;
      const ev = tile.events[name];
      if (ev) {
        if (ev.chance && !random.chance(ev.chance)) {
          continue;
        }

        ctx.tile = tile;
        fired = await tileEvent.spawn(ev, ctx) || fired;
      }
    }
    if (fired) {
      this.mechFlags |= MechFlags.EVENT_FIRED_THIS_TURN;
    }
    return fired;
  }


  // setTickFlag() {
  //   let flag = 0;
  //   for(let i = 0; i < this.layers.length; ++i) {
  //     const id = this.layers[i];
  //     if (!id) continue;
  //     const tile = TILES[id];
  //     if (!tile.events.tick) continue;
  //     if (random.chance(tile.events.tick.chance)) {
  //       flag |= Fl(i);
  //     }
  //   }
  //   this.layerFlags = flag;
  //   return flag;
  // }
  //
  // async fireTick(ctx) {
  //   if (!this.layerFlags) return false;
  //
  //   ctx.cell = this;
  //   let fired = false;
  //   for(let i = 0; i < this.layers.length; ++i) {
  //     if (this.layerFlags & Fl(i)) {
  //       const tile = TILES[this.layers[i]];
  //       ctx.tile = tile;
  //       await TILE_EVENT.spawn(tile.events.tick, ctx);
  //       fired = true;
  //     }
  //   }
  //   this.layerFlags = 0;
  //   return fired;
  // }

  // SPRITES

  addSprite(layer, sprite, priority=50) {

    this.flags |= Flags$1.NEEDS_REDRAW;

    if (!this.sprites) {
      this.sprites = { layer, priority, sprite, next: null };
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

    this.flags |= Flags$1.NEEDS_REDRAW;

    if (this.sprites && this.sprites.sprite === sprite) {
      this.sprites = this.sprites.next;
      return;
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

  storeMemory(item) {
    const memory = this.memory;
    memory.tileFlags = this.tileFlags();
    memory.tileMechFlags = this.tileMechFlags();
    memory.cellFlags = this.flags;
		memory.cellMechFlags = this.mechFlags;
    memory.tile = this.highestPriorityTile().id;
		if (item) {
			memory.itemKind = item.kind;
			memory.itemQuantity = item.quantity || 1;
		}
		else {
			memory.itemKind = null;
			memory.itemQuantity = 0;
		}
  }

}

types.Cell = Cell;


function makeCell(...args) {
  const cell = new types.Cell(...args);
  return cell;
}


make.cell = makeCell;


function getAppearance(cell, dest) {
  dest.clear();
  for( let tile of cell.tiles() ) {
    dest.plot(tile.sprite);
  }

  let current = cell.sprites;
  while(current) {
    dest.plot(current.sprite);
    current = current.next;
  }

  let needDistinctness = false;
  if (cell.flags & (Flags$1.IS_CURSOR | Flags$1.IS_IN_PATH)) {
    const highlight = (cell.flags & Flags$1.IS_CURSOR) ? colors.cursorColor : colors.yellow;
    if (cell.hasTileMechFlag(MechFlags$1.TM_INVERT_WHEN_HIGHLIGHTED)) {
      color.swap(dest.fg, dest.bg);
    } else {
      // if (!GAME.trueColorMode || !dest.needDistinctness) {
          color.applyMix(dest.fg, highlight, config.cursorPathIntensity || 20);
      // }
      color.applyMix(dest.bg, highlight, config.cursorPathIntensity || 20);
    }
    needDistinctness = true;
  }

  if (needDistinctness) {
    color.separate(dest.fg, dest.bg);
  }

  return true;
}

cell.getAppearance = getAppearance;

var actor = {};
actor.debug = utils$1.NOOP;

function actorDebug(actor, ...args) {
	// if actor.flags & DEBUG
	actor.debug(...args);
}

class Actor {
	constructor(kind) {
		this.x = -1;
    this.y = -1;
    this.flags = 0;
    this.kind = kind || {};
    this.turnTime = 0;
		this.status = {};

		this.kind.speed = this.kind.speed || config.defaultSpeed || 120;
  }

	startTurn() {
		actor.startTurn(this);
	}

	act() {
		actor.act(this);
	}

	// TODO - This is a command/task
	async moveDir(dir) {
    const map = data.map;
    await map.moveActor(this.x + dir[0], this.y + dir[1], this);
		this.endTurn();
  }

	endTurn(turnTime) {
		actor.endTurn(this, turnTime);
	}

	isOrWasVisible() {
		return true;
	}

	forbiddenTileFlags() {
		return Flags$2.T_PATHING_BLOCKER;
	}

	kill() {
		const map = data.map;
		map.removeActor(this);
		// in the future do something here (HP = 0?  Flag?)
	}

}

types.Actor = Actor;


function makeActor(kind) {
  return new types.Actor(kind);
}

make.actor = makeActor;


// TODO - move back to game??
async function takeTurn(theActor) {
  actorDebug(theActor, 'actor turn...', data.time);
	theActor.startTurn();
	await theActor.act();
  return theActor.turnTime;	// actual or idle time
}

actor.takeTurn = takeTurn;


function startTurn(theActor) {
}

actor.startTurn = startTurn;


function act(theActor) {
	theActor.endTurn();
	return true;
}

actor.act = act;

function endTurn(theActor, turnTime) {
	theActor.turnTime = turnTime || Math.floor(theActor.kind.speed/2);	// doing nothing takes time
	if (theActor.isOrWasVisible() && theActor.turnTime) {
		ui.requestUpdate();
	}
}

actor.endTurn = endTurn;

var player = {};

player.debug = utils$1.NOOP;


class Player extends types.Actor {
  constructor(kind) {
    super(kind);
  }

  startTurn() {
    player.startTurn(this);
  }

  visionRadius() {
  	return CONFIG.MAX_FOV_RADIUS || (data.map.width + data.map.height);
  }

  endTurn(turnTime) {
    player.endTurn(this, turnTime);
  }

}

types.Player = Player;


function makePlayer(kind) {
  return new types.Player(kind);
}

make.player = makePlayer;



async function takeTurn$1() {
  const PLAYER = data.player;
  player.debug('player turn...', data.time);
  await PLAYER.startTurn();

  while(!PLAYER.turnTime) {
    const ev = await io.nextEvent(1000);
    await ui.dispatchEvent(ev);
    await ui.updateIfRequested();
    if (data.gameHasEnded) {
      return 0;
    }
  }

  player.debug('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn$1;


function startTurn$1(PLAYER) {
	PLAYER.turnTime = 0;
}

player.startTurn = startTurn$1;


function act$1() {
	return true;
}

player.act = act$1;

function endTurn$1(PLAYER, turnTime) {
  PLAYER.turnTime = turnTime || Math.floor(PLAYER.kind.speed/2);  // doing nothing takes time
  ui.requestUpdate();
}

player.endTurn = endTurn$1;

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
		if (this.next === item) {
			this.next = item.next;
			return;
		}
		prev = this.next;
		current = prev.next;
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

var game = {};

game.debug = utils$1.NOOP;

data.time = 0;
data.running = false;
data.turnTime = 10;



function startGame(opts={}) {
  if (!opts.map) utils$1.ERROR('map is required.');

  data.time = 0;
  data.running = true;
  data.player = opts.player || null;

  game.startMap(opts.map, opts.x, opts.y);
  game.queuePlayer();

  return game.loop();
}

game.start = startGame;


function startMap(map, playerX, playerY) {

  scheduler.clear();

  if (data.map && data.player) {
    data.map.removeActor(data.player);
  }

  map.cells.forEach( (c) => c.redraw() );
  map.flag |= Flags$4.MAP_CHANGED;
  data.map = map;

  // TODO - Add Map/Environment Updater

  if (data.player) {
    let x = playerX || 0;
    let y = playerY || 0;
    if (x <= 0) {
      const start = map.locations.start;
      x = start[0];
      y = start[1];
    }
    if (x <= 0) {
      x = data.player.x || Math.floor(map.width / 2);
      y = data.player.y || Math.floor(map.height / 2);
    }
    data.map.addActor(x, y, data.player);
  }

  ui.draw();

  if (map.config.tick) {
    scheduler.push( game.updateEnvironment, map.config.tick );
  }
}

game.startMap = startMap;



async function gameLoop() {

  ui.draw();

  while (data.running) {

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
        game.debug('- push actor: %d + %d = %d', scheduler.time, turnTime, scheduler.time + turnTime);
        scheduler.push(fn, turnTime);
      }
    }

  }

}

game.loop = gameLoop;


function queuePlayer() {
  scheduler.push(player.takeTurn, data.player.kind.speed);
}

game.queuePlayer = queuePlayer;

function queueActor(actor$1) {
  scheduler.push(actor.takeTurn.bind(null, actor$1), actor$1.kind.speed);
}

game.queueActor = queueActor;

function delay(delay, fn) {
  return scheduler.push(fn, delay);
}

game.delay = delay;

async function cancelDelay(timer) {
  return scheduler.remove(timer);
}

game.cancelDelay = cancelDelay;

async function updateEnvironment() {

  game.debug('update environment');

  const map = data.map;
  if (!map) return 0;

  await map.tick();
  ui.requestUpdate();

  return map.config.tick;
}

game.updateEnvironment = updateEnvironment;


sprite.install('hilite', colors.white);

async function gameOver(...args) {
  const msg = text.format(...args);
  message.add(msg);
  message.add(colors.red, 'GAME OVER');
  ui.updateNow();
  await fx.flashSprite(data.map, data.player.x, data.player.y, 'hilite', 500, 3);
  data.gameHasEnded = true;

  data.running = false; // ???
}

game.gameOver = gameOver;

var tile = {};
var tiles = [];

const Layer = new types.Enum('GROUND', 'LIQUID', 'SURFACE', 'GAS', 'ITEM', 'ACTOR', 'PLAYER', 'FX', 'UI');

tile.Layer = Layer;


const Fl$3 = flag.fl;

const Flags$2 = flag.install('tile', {
  T_OBSTRUCTS_PASSABILITY	: Fl$3(0),		// cannot be walked through
  T_OBSTRUCTS_VISION			: Fl$3(1),		// blocks line of sight
  T_OBSTRUCTS_ITEMS				: Fl$3(2),		// items can't be on this tile
  T_OBSTRUCTS_SURFACE		  : Fl$3(3),		// grass, blood, etc. cannot exist on this tile
  T_OBSTRUCTS_GAS					: Fl$3(4),		// blocks the permeation of gas
  T_OBSTRUCTS_LIQUID      : Fl$3(5),
  T_OBSTRUCTS_TILE_EFFECTS  : Fl$3(6),
  T_OBSTRUCTS_DIAGONAL_MOVEMENT : Fl$3(7),    // can't step diagonally around this tile

  T_BRIDGE                : Fl$3(10),   // Acts as a bridge over the folowing types:
  T_AUTO_DESCENT					: Fl$3(11),		// automatically drops creatures down a depth level and does some damage (2d6)
  T_LAVA			            : Fl$3(12),		// kills any non-levitating non-fire-immune creature instantly
  T_DEEP_WATER					  : Fl$3(13),		// steals items 50% of the time and moves them around randomly

  T_SPONTANEOUSLY_IGNITES	: Fl$3(14),		// monsters avoid unless chasing player or immune to fire
  T_IS_FLAMMABLE					: Fl$3(15),		// terrain can catch fire
  T_IS_FIRE								: Fl$3(16),		// terrain is a type of fire; ignites neighboring flammable cells
  T_ENTANGLES							: Fl$3(17),		// entangles players and monsters like a spiderweb

  T_CAUSES_POISON					: Fl$3(18),		// any non-levitating creature gets 10 poison
  T_CAUSES_DAMAGE					: Fl$3(19),		// anything on the tile takes max(1-2, 10%) damage per turn
  T_CAUSES_NAUSEA					: Fl$3(20),		// any creature on the tile becomes nauseous
  T_CAUSES_PARALYSIS			: Fl$3(21),		// anything caught on this tile is paralyzed
  T_CAUSES_CONFUSION			: Fl$3(22),		// causes creatures on this tile to become confused
  T_CAUSES_HEALING   	    : Fl$3(23),   // heals 20% max HP per turn for any player or non-inanimate monsters
  T_IS_TRAP								: Fl$3(24),		// spews gas of type specified in fireType when stepped on
  T_CAUSES_EXPLOSIVE_DAMAGE		: Fl$3(25),		// is an explosion; deals higher of 15-20 or 50% damage instantly, but not again for five turns
  T_SACRED                : Fl$3(26),   // monsters that aren't allies of the player will avoid stepping here

  T_UP_STAIRS							: Fl$3(27),
  T_DOWN_STAIRS						: Fl$3(28),
  T_PORTAL                : Fl$3(29),
  T_IS_DOOR								: Fl$3(30),

  T_HAS_STAIRS						: ['T_UP_STAIRS', 'T_DOWN_STAIRS'],
  T_OBSTRUCTS_SCENT				: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES', 'T_HAS_STAIRS'],
  T_PATHING_BLOCKER				: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_IS_FIRE', 'T_SPONTANEOUSLY_IGNITES', 'T_ENTANGLES'],
  T_DIVIDES_LEVEL       	: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER'],
  T_LAKE_PATHING_BLOCKER	: ['T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
  T_WAYPOINT_BLOCKER			: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
  T_MOVES_ITEMS						: ['T_DEEP_WATER', 'T_LAVA'],
  T_CAN_BE_BRIDGED				: ['T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER'],
  T_OBSTRUCTS_EVERYTHING	: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_OBSTRUCTS_ITEMS', 'T_OBSTRUCTS_GAS', 'T_OBSTRUCTS_SURFACE',   'T_OBSTRUCTS_DIAGONAL_MOVEMENT'],
  T_HARMFUL_TERRAIN				: ['T_CAUSES_POISON', 'T_IS_FIRE', 'T_CAUSES_DAMAGE', 'T_CAUSES_PARALYSIS', 'T_CAUSES_CONFUSION', 'T_CAUSES_EXPLOSIVE_DAMAGE'],
  T_RESPIRATION_IMMUNITIES  : ['T_CAUSES_DAMAGE', 'T_CAUSES_CONFUSION', 'T_CAUSES_PARALYSIS', 'T_CAUSES_NAUSEA'],
  T_IS_LIQUID               : ['T_LAVA', 'T_AUTO_DESCENT', 'T_DEEP_WATER'],
  T_STAIR_BLOCKERS          : 'T_OBSTRUCTS_ITEMS, T_OBSTRUCTS_SURFACE, T_OBSTRUCTS_GAS, T_OBSTRUCTS_LIQUID, T_OBSTRUCTS_TILE_EFFECTS',
});

tile.flags = Flags$2;

///////////////////////////////////////////////////////
// TILE MECH


const MechFlags$1 = flag.install('tileMech', {
  TM_IS_SECRET							: Fl$3(0),		// successful search or being stepped on while visible transforms it into discoverType
  TM_PROMOTES_WITH_KEY			: Fl$3(1),		// promotes if the key is present on the tile (in your pack, carried by monster, or lying on the ground)
  TM_PROMOTES_WITHOUT_KEY		: Fl$3(2),		// promotes if the key is NOT present on the tile (in your pack, carried by monster, or lying on the ground)
  TM_PROMOTES_ON_STEP				: Fl$3(3),		// promotes when a creature, player or item is on the tile (whether or not levitating)
  TM_PROMOTES_ON_ITEM_REMOVE		: Fl$3(4),		// promotes when an item is lifted from the tile (primarily for altars)
  TM_PROMOTES_ON_PLAYER_ENTRY		: Fl$3(5),		// promotes when the player enters the tile (whether or not levitating)
  TM_PROMOTES_ON_SACRIFICE_ENTRY: Fl$3(6),		// promotes when the sacrifice target enters the tile (whether or not levitating)
  TM_PROMOTES_ON_ELECTRICITY    : Fl$3(7),    // promotes when hit by a lightning bolt

  TM_ALLOWS_SUBMERGING					: Fl$3(8),		// allows submersible monsters to submerge in this terrain
  TM_IS_WIRED										: Fl$3(9),		// if wired, promotes when powered, and sends power when promoting
  TM_IS_CIRCUIT_BREAKER 				: Fl$3(10),        // prevents power from circulating in its machine
  TM_GAS_DISSIPATES							: Fl$3(11),		// does not just hang in the air forever
  TM_GAS_DISSIPATES_QUICKLY			: Fl$3(12),		// dissipates quickly
  TM_EXTINGUISHES_FIRE					: Fl$3(13),		// extinguishes burning terrain or creatures
  TM_VANISHES_UPON_PROMOTION		: Fl$3(14),		// vanishes when creating promotion dungeon feature, even if the replacement terrain priority doesn't require it
  TM_REFLECTS_BOLTS           	: Fl$3(15),       // magic bolts reflect off of its surface randomly (similar to ACTIVE_CELLS flag IMPREGNABLE)
  TM_STAND_IN_TILE            	: Fl$3(16),		// earthbound creatures will be said to stand "in" the tile, not on it
  TM_LIST_IN_SIDEBAR          	: Fl$3(17),       // terrain will be listed in the sidebar with a description of the terrain type
  TM_VISUALLY_DISTINCT        	: Fl$3(18),       // terrain will be color-adjusted if necessary so the character stands out from the background
  TM_BRIGHT_MEMORY            	: Fl$3(19),       // no blue fade when this tile is out of sight
  TM_EXPLOSIVE_PROMOTE        	: Fl$3(20),       // when burned, will promote to promoteType instead of burningType if surrounded by tiles with T_IS_FIRE or TM_EXPLOSIVE_PROMOTE
  TM_CONNECTS_LEVEL           	: Fl$3(21),       // will be treated as passable for purposes of calculating level connectedness, irrespective of other aspects of this terrain layer
  TM_INTERRUPT_EXPLORATION_WHEN_SEEN : Fl$3(22),    // will generate a message when discovered during exploration to interrupt exploration
  TM_INVERT_WHEN_HIGHLIGHTED  	: Fl$3(23),       // will flip fore and back colors when highlighted with pathing
  TM_SWAP_ENCHANTS_ACTIVATION 	: Fl$3(24),       // in machine, swap item enchantments when two suitable items are on this terrain, and activate the machine when that happens
  TM_PROMOTES										: 'TM_PROMOTES_WITH_KEY | TM_PROMOTES_WITHOUT_KEY | TM_PROMOTES_ON_STEP | TM_PROMOTES_ON_ITEM_REMOVE | TM_PROMOTES_ON_SACRIFICE_ENTRY | TM_PROMOTES_ON_ELECTRICITY | TM_PROMOTES_ON_PLAYER_ENTRY',
});

tile.mechFlags = MechFlags$1;

function setFlags(tile, allFlags) {
  let flags = [];
  if (!allFlags) return;  // no flags

  if (typeof allFlags === 'string') {
    flags = allFlags.split(/[,|]/).map( (t) => t.trim() );
  }
  else if (!Array.isArray(allFlags)) {
    return utils$1.WARN('Invalid tile flags: ' + allFlags);
  }
  else if (allFlags.length <= 2) {
    if (typeof allFlags[0] === 'number') {
      tile.flags = allFlags[0] || 0;
      tile.mechFlags = allFlags[1] || 0;
      return;
    }
  }

  flags.forEach((f) => {
    if (typeof f !== 'string') {
      utils$1.WARN('Invalid tile flag: ' + f);
    }
    else if (Flags$2[f]) {
      tile.flags |= Flags$2[f];
    }
    else if (MechFlags$1[f]) {
      tile.mechFlags |= MechFlags$1[f];
    }
    else {
      utils$1.WARN('Invalid tile flag: ' + f);
    }
  });
}


class Tile {
  constructor(ch, fg, bg, priority, layer, allFlags, text, desc) {
    this.flags = 0;
    this.mechFlags = 0;
    this.layer = layer || 0;
    this.priority = priority || 0; // lower means higher priority (50 = average)
    this.sprite = make.sprite(ch, fg, bg);
    this.events = {};
    this.light = null;
    this.desc = desc || '';
    this.text = text || '';
    this.name = null;

    setFlags(this, allFlags);
  }

  successorFlags(event) {
    const e = this.events[event];
    if (!e) return 0;
    const feature = e.feature;
    if (!feature) return 0;
    // const tile = FEATURES[feature].tile;
    // if (!tile) return 0;
    // return tiles[tile].flags;
  }
}

types.Tile = Tile;

function makeTile(ch, fg, bg, priority, layer, allFlags, text, desc, opts={}) {
  const tile = new types.Tile(ch, fg, bg, priority, layer, allFlags, text, desc);
  // TODO - tile.light = opts.light || null;
  // TODO - tile.events.fire = opts.fire
  // TODO - tile.events.promote = opts.promote
  // TODO - tile.events.discover = opts.discover
  if (opts.playerEnter) { tile.events.playerEnter = make.tileEvent(opts.playerEnter); }
  if (opts.enter) { tile.events.enter = make.tileEvent(opts.enter); }
  if (opts.tick) {
    const tick = tile.events.tick = make.tileEvent(opts.tick);
    tick.chance = tick.chance || 100;
  }
  return tile;
}

make.tile = makeTile;

function installTile(name, ...args) {
  let tile;
  if (args.length == 1 && args[0] instanceof Tile) {
    tile = args[0];
  }
  else {
    tile = make.tile(...args);
  }
  tile.name = name;
  tile.id = tiles.length;
  tiles.push(tile);
  return tile.id;
}

tile.install = installTile;

// These are the minimal set of tiles to make the diggers work
const NOTHING = def.NOTHING = 0;
installTile(NOTHING,       '\u2205', 'black', 'black', 0, 0, 'T_OBSTRUCTS_PASSABILITY', "an eerie nothingness", "");
installTile('FLOOR',       '\u00b7', [30,30,30,20], [2,2,10,0,2,2,0], 10, 0, 0, 'the floor');	// FLOOR
installTile('DOOR',        '+', [100,40,40], [30,60,60], 30, 0, 'T_IS_DOOR, T_OBSTRUCTS_ITEMS, T_OBSTRUCTS_TILE_EFFECTS', 'a door');	// DOOR
installTile('BRIDGE',      '=', [100,40,40], null, 40, Layer.SURFACE, 'T_BRIDGE', 'a bridge');	// BRIDGE (LAYER=SURFACE)
installTile('UP_STAIRS',   '<', [100,40,40], [100,60,20], 200, 0, 'T_UP_STAIRS, T_STAIR_BLOCKERS', 'an upward staircase');	// UP
installTile('DOWN_STAIRS', '>', [100,40,40], [100,60,20], 200, 0, 'T_DOWN_STAIRS, T_STAIR_BLOCKERS', 'a downward staircase');	// DOWN
installTile('WALL',        '#', [7,7,7,0,3,3,3],  [40,40,40,10,10,0,5], 100, 0, 'T_OBSTRUCTS_EVERYTHING', 'a wall');	// WALL
installTile('LAKE',        '~', [5,8,20,10,0,4,15,1], [10,15,41,6,5,5,5,1], 50, 0, 'T_DEEP_WATER', 'deep water');	// LAKE

function withName(name) {
  return tiles.find( (t) => t.name == name );
}

tile.withName = withName;



async function applyInstantTileEffects(tile, cell) {

  const actor = cell.actor;

  if (tile.flags & Flags$2.T_LAVA && actor) {
    if (!cell.hasTileFlag(Flags$2.T_BRIDGE) && !actor.status[def.STATUS_LEVITATING]) {
      actor.kill();
      await game.gameOver(colors.red, 'you fall into lava and perish.');
      return true;
    }
  }

  return false;
}

tile.applyInstantEffects = applyInstantTileEffects;

const Fl$4 = flag.fl;


const ActionFlags = flag.install('action', {
	A_USE			: Fl$4(0),
	A_EQUIP		: Fl$4(1),
	A_PUSH		: Fl$4(2),
	A_RENAME	: Fl$4(3),
	A_ENCHANT	: Fl$4(4),
	A_THROW		: Fl$4(5),
	A_SPECIAL	: Fl$4(6),

	A_PULL		: Fl$4(7),
	A_SLIDE		: Fl$4(8),

	A_NO_PICKUP		: Fl$4(9),
	A_NO_DESTROY	: Fl$4(10),

	A_GRABBABLE : 'A_PUSH, A_PULL, A_SLIDE',
});


const KindFlags = flag.install('itemKind', {
	IK_ENCHANT_SPECIALIST 	: Fl$4(0),
	IK_HIDE_FLAVOR_DETAILS	: Fl$4(1),

	IK_AUTO_TARGET					: Fl$4(2),

	IK_HALF_STACK_STOLEN		: Fl$4(3),
	IK_ENCHANT_USES_STR 		: Fl$4(4),

	IK_ARTICLE_THE					: Fl$4(5),
	IK_NO_ARTICLE						: Fl$4(6),
	IK_PRENAMED	  					: Fl$4(7),

	IK_BREAKS_ON_FALL				: Fl$4(8),
	IK_DESTROY_ON_USE				: Fl$4(9),
	IK_FLAMMABLE						: Fl$4(10),

  IK_ALWAYS_IDENTIFIED  	: Fl$4(11),
	IK_IDENTIFY_BY_KIND			: Fl$4(12),
	IK_CURSED								: Fl$4(13),

	IK_BLOCKS_MOVE					: Fl$4(14),
	IK_BLOCKS_VISION				: Fl$4(15),

	IK_PLACE_ANYWHERE				: Fl$4(16),
	IK_KIND_AUTO_ID       	: Fl$4(17),	// the item type will become known when the item is picked up.
	IK_PLAYER_AVOIDS				: Fl$4(18),	// explore and travel will try to avoid picking the item up

	IK_TWO_HANDED						: Fl$4(19),
	IK_NAME_PLURAL					: Fl$4(20),

	IK_STACKABLE						: Fl$4(21),
	IK_STACK_SMALL					: Fl$4(22),
	IK_STACK_LARGE					: Fl$4(23),
	IK_SLOW_RECHARGE				: Fl$4(24),

	IK_CAN_BE_SWAPPED      	: Fl$4(25),
	IK_CAN_BE_RUNIC					: Fl$4(26),
	IK_CAN_BE_DETECTED		  : Fl$4(27),

	IK_TREASURE							: Fl$4(28),
	IK_INTERRUPT_EXPLORATION_WHEN_SEEN:	Fl$4(29),
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


const AttackFlags = flag.install('itemAttack', {
	IA_MELEE:		Fl$4(0),
	IA_THROWN:	Fl$4(1),
	IA_RANGED:	Fl$4(2),
	IA_AMMO:		Fl$4(3),

	IA_RANGE_5:				Fl$4(5),	// Could move this to range field of kind
	IA_RANGE_10:			Fl$4(6),
	IA_RANGE_15:			Fl$4(7),
	IA_CAN_LONG_SHOT:	Fl$4(8),

	IA_ATTACKS_SLOWLY				: Fl$4(10),	// mace, hammer
	IA_ATTACKS_QUICKLY    	: Fl$4(11),   // rapier

	IA_HITS_STAGGER					: Fl$4(15),		// mace, hammer
	IA_EXPLODES_ON_IMPACT		: Fl$4(16),

  IA_ATTACKS_EXTEND     	: Fl$4(20),   // whip???
	IA_ATTACKS_PENETRATE		: Fl$4(21),		// spear, pike	???
	IA_ATTACKS_ALL_ADJACENT : Fl$4(22),		// whirlwind
  IA_LUNGE_ATTACKS      	: Fl$4(23),   // rapier
	IA_PASS_ATTACKS       	: Fl$4(24),   // flail	???
  IA_SNEAK_ATTACK_BONUS 	: Fl$4(25),   // dagger
	IA_ATTACKS_WIDE					: Fl$4(26),		// axe

});


const Flags$3 = flag.install('item', {
	ITEM_IDENTIFIED			: Fl$4(0),
	ITEM_EQUIPPED				: Fl$4(1),
	ITEM_CURSED					: Fl$4(2),
	ITEM_PROTECTED			: Fl$4(3),
	ITEM_INDESTRUCTABLE	: Fl$4(4),		// Cannot die - even if falls into T_LAVA_INSTA_DEATH
	ITEM_RUNIC					: Fl$4(5),
	ITEM_RUNIC_HINTED		: Fl$4(6),
	ITEM_RUNIC_IDENTIFIED		: Fl$4(7),
	ITEM_CAN_BE_IDENTIFIED	: Fl$4(8),
	ITEM_PREPLACED					: Fl$4(9),
	ITEM_MAGIC_DETECTED			: Fl$4(11),
	ITEM_MAX_CHARGES_KNOWN	: Fl$4(12),
	ITEM_IS_KEY							: Fl$4(13),


	ITEM_DESTROYED					: Fl$4(30),
});



class ItemKind {
  constructor(opts={}) {
		this.name = opts.name || 'item';
		this.description = opts.description || opts.desc || '';
		this.sprite = make.sprite(opts.sprite);
    this.flags = KindFlags.toFlag(opts.flags);
		this.actionFlags = ActionFlags.toFlag(opts.flags);
		this.attackFlags = AttackFlags.toFlag(opts.flags);
		this.stats = Object.assign({}, opts.stats || {});
		this.id = opts.id || null;
  }
}

types.ItemKind = ItemKind;

function installItemKind(id, opts={}) {
	opts.id = id;
	const kind = new types.ItemKind(opts);
	itemKinds[id] = kind;
	return kind;
}

item.installKind = installItemKind;


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
				this.flags |= Flags$3.ITEM_DESTROYED;
			}
			return true;
		}
		return false;
	}

	isDestroyed() { return this.flags & Flags$3.ITEM_DESTROYED; }

	forbiddenTileFlags() { return Flags$2.T_OBSTRUCTS_ITEMS; }
}

types.Item = Item;

function makeItem(kind) {
	if (typeof kind === 'string') {
		const name = kind;
		kind = itemKinds[name];
		if (!kind) utils$1.ERROR('Unknown Item Kind: ' + name);
	}
	return new types.Item(kind);
}

make.item = makeItem;

var map = {};
map.debug = utils$1.NOOP;

const Fl$5 = flag.fl;

const Flags$4 = flag.install('map', {
	MAP_CHANGED: Fl$5(0),
	MAP_STABLE_GLOW_LIGHTS:  Fl$5(1),
	MAP_STABLE_LIGHTS: Fl$5(2),
	MAP_ALWAYS_LIT:	Fl$5(3),
});



class Map {
	constructor(w, h, opts={}) {
		this.width = w;
		this.height = h;
		this.cells = make.grid(w, h, () => new types.Cell() );
		this.locations = opts.locations || {};
		this.config = Object.assign({}, opts);
		this.config.tick = this.config.tick || 100;
		this.actors = null;
		this.items = null;
	}

	clear() { this.cells.forEach( (c) => c.clear() ); }
	dump() { this.cells.dump((c) => c.dump()); }
	cell(x, y)   { return this.cells[x][y]; }

	forEach(fn) { this.cells.forEach(fn); }
	forRect(x, y, w, h, fn) { this.cells.forRect(x, y, w, h, fn ); }
	eachNeighbor(x, y, fn, only4dirs) { this.cells.eachNeighbor(x, y, fn, only4dirs); }

	hasXY(x, y)    		 { return this.cells.hasXY(x, y); }
	isBoundaryXY(x, y) { return this.cells.isBoundaryXY(x, y); }

	changed(v) {
		if (v === true) {
			this.flags |= Flags$4.MAP_CHANGED;
		}
		else if (v === false) {
			this.flags &= ~Flags$4.MAP_CHANGED;
		}
		return (this.flags & Flags$4.MAP_CHANGED);
	}

	hasCellFlag(x, y, flag) 		{ return this.cell(x, y).flags & flag; }
	hasCellMechFlag(x, y, flag) { return this.cell(x, y).mechFlags & flag; }
	hasTileFlag(x, y, flag) 		{ return this.cell(x, y).hasTileFlag(flag); }
	hasTileMechFlag(x, y, flag) { return this.cell(x, y).hasTileMechFlag(flag); }

	redrawCell(x, y) {
		this.cell(x, y).redraw();
		this.flags |= Flags$4.MAP_CHANGED;
	}

	redraw() {
		this.forEach( (c) => c.redraw() );
		this.flags |= Flags$4.MAP_CHANGED;
	}

	markRevealed(x, y) { return this.cell(x, y).markRevealed(); }
	isVisible(x, y)    { return this.cell(x, y).isVisible(); }
	isAnyKindOfVisible(x, y) { return this.cell(x, y).isAnyKindOfVisible(); }
	hasVisibleLight(x, y) { return (this.flags & Flags$4.MAP_ALWAYS_LIT) || this.cell(x, y).hasVisibleLight(); }

	setFlags(mapFlag, cellFlag, cellMechFlag) {
		if (mapFlag) {
			this.flags |= mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.forEach( (c) => c.setFlags(cellFlag, cellMechFlag) );
		}
		this.changed(true);
	}

	clearFlags(mapFlag, cellFlag, cellMechFlag) {
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
		this.flags |= Flags$4.MAP_CHANGED;
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
	isObstruction(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isObstruction(limitToPlayerKnowledge); }
  isDoor(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isDoor(limitToPlayerKnowledge); }
  blocksPathing(x, y, limitToPlayerKnowledge) { return this.cells[x][y].blocksPathing(limitToPlayerKnowledge); }
  isLiquid(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isLiquid(limitToPlayerKnowledge); }
  hasGas(x, y, limitToPlayerKnowledge) { return this.cells[x][y].hasGas(limitToPlayerKnowledge); }

	highestPriorityLayer(x, y, skipGas) { return this.cells[x][y].highestPriorityLayer(x, y); }
	highestPriorityTile(x, y, skipGas) { return this.cells[x][y].highestPriorityTile(x, y); }

	tileFlavor(x, y) { return this.cells[x][y].tileFlavor(); }
	tileText(x, y)   { return this.cells[x][y].tileText(); }

	setTile(x, y, tileId, checkPriority) {
		const cell = this.cell(x, y);
		if (cell.setTile(tileId, checkPriority)) {
			this.flags &= ~(Flags$4.MAP_STABLE_GLOW_LIGHTS);
		}
		this.changed(true);
	  return true;
	}

	clearTileWithFlags(x, y, tileFlags, tileMechFlags=0) {
		const cell = this.cell(x, y);
		cell.clearTileWithFlags(tileFlags, tileMechFlags);
	}

	clearCellTiles(x, y, includeGas) {
		this.changed(true);
		return this.cell(x, y).clearTiles(includeGas);
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
	    if (locFlags1 & Flags$2.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    const locFlags2 = this.tileFlags(x2, y1, limitToPlayerKnowledge);
	    if (locFlags2 & Flags$2.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    return false;
	}

	fillBasicCostGrid(costGrid) {
		this.cells.forEach( (cell, i, j) => {
      if (cell.isNull()) {
        costGrid[i][j] = def.PDS_OBSTRUCTION;
      }
      else {
        costGrid[i][j] = cell.canBePassed() ? 1 : def.PDS_OBSTRUCTION;
      }
    });
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
					if ((Math.floor(utils$1.distanceBetween(x, y, i, j)) == k)
							&& (!blockingMap || !blockingMap[i][j])
							&& matcher(cell, i, j)
							&& (!forbidLiquid || cell.liquid == def.NOTHING)
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
	randomMatchingXY(matcher, opts={}) {
		let failsafeCount = 0;
		let x;
		let y;
		let cell;

		// dungeonType -1 => ignore, otherwise match with 0 = NOTHING, 'string' = MATCH
		// liquidType  -1 => ignore, otherwise match with 0 = NOTHING, 'string' = MATCH

		let retry = true;
		while(retry) {
			failsafeCount++;
			if (failsafeCount >= 500) break;

			x = random.range(0, this.width - 1);
			y = random.range(0, this.height - 1);
			cell = this.cell(x, y);

			if (matcher(cell, x, y)) {
				retry = false;
			}
		}
		if (failsafeCount >= 500) {
			// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => FAIL');
			return false;
		}

		// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => ', x, y);
		return [ x, y ];
	}

	// FX

	addFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		cell.addSprite(Layer.FX, anim.sprite);
		anim.x = x;
		anim.y = y;
		this.flags |= Flags$4.MAP_CHANGED;
		return true;
	}

	moveFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.removeSprite(anim.sprite);
		cell.addSprite(Layer.FX, anim.sprite);
		this.flags |= Flags$4.MAP_CHANGED;
		anim.x = x;
		anim.y = y;
		return true;
	}

	removeFx(anim) {
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.removeSprite(anim.sprite);
		this.flags |= Flags$4.MAP_CHANGED;
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

		const layer = (theActor === data.player) ? Layer.PLAYER : Layer.ACTOR;
		cell.addSprite(layer, theActor.kind.sprite);

		const flag = (theActor === data.player) ? Flags$1.HAS_PLAYER : Flags$1.HAS_MONSTER;
		cell.flags |= (flag | Flags$1.NEEDS_REDRAW);
		// if (theActor.flags & ActorFlags.MK_DETECTED)
		// {
		// 	cell.flags |= CellFlags.MONSTER_DETECTED;
		// }

		theActor.x = x;
		theActor.y = y;
		this.flags |= Flags$4.MAP_CHANGED;

		return true;
	}

	addActorNear(x, y, theActor) {
		const forbidTileFlags = GW.actor.avoidedFlags(theActor);
		const loc = this.matchingXYNear(x, y, (cell, i, j) => {
			if (cell.flags & (Flags$1.HAS_ACTOR)) return false;
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
		return true;
	}

	removeActor(actor) {
		const cell = this.cell(actor.x, actor.y);
		if (cell.actor === actor) {
			cell.actor = null;
			cell.flags &= ~Flags$1.HAS_ACTOR;
			cell.flags |= Flags$1.NEEDS_REDRAW;
			this.flags |= Flags$4.MAP_CHANGED;
			cell.removeSprite(actor.kind.sprite);
		}
	}

	// dormantAt(x, y) {  // creature *
	// 	if (!(this.cell(x, y).flags & CellFlags.HAS_DORMANT_MONSTER)) {
	// 		return null;
	// 	}
	// 	return this.dormantActors.find( (m) => m.x == x && m.y == y );
	// }
	//
	// addDormant(x, y, theActor) {
	// 	theActor.x = x;
	// 	theActor.y = y;
	// 	this.dormant.add(theActor);
	// 	cell.flags |= (CellFlags.HAS_DORMANT_MONSTER);
	// 	this.flags |= Flags.MAP_CHANGED;
	// 	return true;
	// }
	//
	// removeDormant(actor) {
	// 	const cell = this.cell(actor.x, actor.y);
	// 	cell.flags &= ~(CellFlags.HAS_DORMANT_MONSTER);
	// 	cell.flags |= CellFlags.NEEDS_REDRAW;
	// 	this.flags |= Flags.MAP_CHANGED;
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
		if (cell.flags & Flags$1.HAS_ITEM) {
			// GW.ui.message(colors.badMessageColor, 'There is already an item there.');
			return false;
		}
		theItem.x = x;
		theItem.y = y;

		cell.item = theItem;
		theItem.next = this.items;
		this.items = theItem;

		cell.addSprite(Layer.ITEM, theItem.kind.sprite);

		cell.flags |= (Flags$1.HAS_ITEM | Flags$1.NEEDS_REDRAW);

		this.flags |= Flags$4.MAP_CHANGED;
		if ( ((theItem.flags & Flags$3.ITEM_MAGIC_DETECTED) && GW.item.magicChar(theItem)) ||
					config.D_ITEM_OMNISCIENCE)
		{
			cell.flags |= Flags$1.ITEM_DETECTED;
		}

		return true;
	}

	addItemNear(x, y, theItem) {
		const loc = this.matchingXYNear(x, y, (cell, i, j) => {
			if (cell.flags & Flags$1.HAS_ITEM) return false;
			return !cell.hasTileFlag(theItem.forbiddenTileFlags());
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
		const cell = this.cell(x, y);
		if (cell.item !== theItem) return false;

		cell.removeSprite(theItem.kind.sprite);

		cell.item = null;
		if (this.items === theItem) {
			this.items = theItem.next;
		}
		else {
			let prev = this.items;
			let current = prev.next;
			while(current && current !== theItem) {
				prev = current;
				current = prev.next;
			}
			if (current === theItem) {
				prev.next = current.next;
			}
		}

		this.flags |= Flags$4.MAP_CHANGED;
		cell.flags &= ~(Flags$1.HAS_ITEM | Flags$1.ITEM_DETECTED);
		cell.flags |= Flags$1.NEEDS_REDRAW;
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


	// FOV

	// Returns a boolean grid indicating whether each square is in the field of view of (xLoc, yLoc).
	// forbiddenTerrain is the set of terrain flags that will block vision (but the blocking cell itself is
	// illuminated); forbiddenFlags is the set of map flags that will block vision.
	// If cautiousOnWalls is set, we will not illuminate blocking tiles unless the tile one space closer to the origin
	// is visible to the player; this is to prevent lights from illuminating a wall when the player is on the other
	// side of the wall.
	calcFov(grid, x, y, maxRadius, forbiddenFlags=0, forbiddenTerrain=Flags$2.T_OBSTRUCTS_VISION, cautiousOnWalls=true) {
	  const FOV = new types.FOV(grid, (i, j) => {
	    return (!this.hasXY(i, j)) || this.hasCellFlag(i, j, forbiddenFlags) || this.hasTileFlag(i, j, forbiddenTerrain) ;
	  });
	  return FOV.calculate(x, y, maxRadius, cautiousOnWalls);
	}

	// MEMORIES

	storeMemory(x, y) {
		const cell = this.cell(x, y);
		cell.storeMemory(this.itemAt(x, y));
	}

	storeMemories() {
		let x, y;
		for(x = 0; x < this.width; ++x) {
			for(y = 0; y < this.height; ++y) {
				const cell = this.cell(x, y);
				if (cell.flags & Flags$1.ANY_KIND_OF_VISIBLE) {
					this.storeMemory(x, y);
				}
				cell.flags &= Flags$1.PERMANENT_CELL_FLAGS | config.PERMANENT_CELL_FLAGS;
				cell.mechFlags &= Flags$1.PERMANENT_MECH_FLAGS | config.PERMANENT_MECH_FLAGS;
			}
		}
	}

	// TICK

	async tick() {
		this.forEach( (c) => c.mechFlags &= ~(MechFlags.EVENT_FIRED_THIS_TURN | MechFlags.EVENT_PROTECTED));
		for(let x = 0; x < this.width; ++x) {
			for(let y = 0; y < this.height; ++y) {
				const cell = this.cells[x][y];
				await cell.fireEvent('tick', { map: this, x, y, cell });
			}
		}
	}

}

types.Map = Map;


function makeMap(w, h, opts={}) {
	const map = new types.Map(w, h, opts);
	if (opts.tile) {
		map.fill(opts.tile, opts.boundary);
	}
	return map;
}

make.map = makeMap;


function getCellAppearance(map, x, y, dest) {
	dest.clear();
	if (!map.hasXY(x, y)) return;
	const cell$1 = map.cell(x, y);
	cell.getAppearance(cell$1, dest);
	dest.bake();
}

map.getCellAppearance = getCellAppearance;


function gridDisruptsPassability(theMap, blockingGrid, opts={})
{

	const walkableGrid = GRID.alloc(theMap.width, theMap.height);
	let disrupts = false;

	const gridOffsetX = opts.gridOffsetX || 0;
	const gridOffsetY = opts.gridOffsetY || 0;
	const bounds = opts.bounds || null;
	// Get all walkable locations after lake added
	theMap.cells.forEach( (cell, i, j) => {
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
		else if (cell.hasTileFlag(Flags$2.T_HAS_STAIRS)) {
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
					GRID.floodFill(walkableGrid, i, j, 1, 2);
					first = false;
				}
				else {
					disrupts = true;
				}
			}
		}
	}

	GRID.free(walkableGrid);
	return disrupts;
}

map.gridDisruptsPassability = gridDisruptsPassability;


function addText(map, x, y, text, fg, bg) {
	for(let ch of text) {
		const sprite = make.sprite(ch, fg, bg);
		const fx = { sprite, x, y };
		map.addFx(x++, y, fx);
	}
}

map.addText = addText;


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

map.getLine = getLine;

const DIRS$3 = def.dirs;
const OPP_DIRS = [def.DOWN, def.UP, def.RIGHT, def.LEFT];

var dungeon = {};

dungeon.debug = utils$1.NOOP;

const NOTHING$1 = 0;
let FLOOR = 1;
let DOOR = 2;
let BRIDGE = 3;
let UP_STAIRS = 4;
let DOWN_STAIRS = 5;
let WALL = 6;

let LAKE = 7;


let SITE = null;
let LOCS;


function start(map, opts={}) {

  FLOOR       = tile.withName('FLOOR')       ? tile.withName('FLOOR').id        : FLOOR;
  DOOR        = tile.withName('DOOR')        ? tile.withName('DOOR').id         : DOOR;
  BRIDGE      = tile.withName('BRIDGE')      ? tile.withName('BRIDGE').id       : BRIDGE;
  UP_STAIRS   = tile.withName('UP_STAIRS')   ? tile.withName('UP_STAIRS').id    : UP_STAIRS;
  DOWN_STAIRS = tile.withName('DOWN_STAIRS') ? tile.withName('DOWN_STAIRS').id  : DOWN_STAIRS;
  WALL        = tile.withName('WALL')        ? tile.withName('WALL').id         : WALL;
  LAKE        = tile.withName('LAKE')        ? tile.withName('LAKE').id         : LAKE;

  LOCS = utils$1.sequence(map.width * map.height);
  random.shuffle(LOCS);

  const startX = opts.x || -1;
  const startY = opts.y || -1;
  if (startX > 0) {
    map.locations.start = [startX, startY];
  }

  SITE = map;
}

dungeon.start = start;


function finish() {
  removeDiagonalOpenings();
  finishWalls();
  finishDoors();
}

dungeon.finish = finish;


// Returns an array of door sites if successful
function digRoom(opts={}) {
  const hallChance = utils$1.first('hallChance', opts, SITE.config, 0);
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

  const grid = GRID.alloc(SITE.width, SITE.height);

  let result = false;
  let tries = opts.tries || 10;
  while(--tries >= 0 && !result) {
    grid.fill(NOTHING$1);

    const id = digger$1.fn(config, grid);
    dungeon.debug('Dig room:', id);
    const doors = digger.chooseRandomDoorSites(grid);
    if (random.chance(hallChance)) {
      digger.attachHallway(grid, doors, SITE.config);
    }

    if (locs) {
      // try the doors first
      result = attachRoomAtDoors(grid, doors, locs, opts.placeDoor);
      if (!result) {
        // otherwise try everywhere
        for(let i = 0; i < locs.length && !result; ++i) {
          if (locs[i][0] > 0) {
            result = attachRoomAtXY(grid, locs[i], doors, opts.placeDoor);
          }
        }
      }
    }
    else {
      result = attachRoomToDungeon(grid, doors, opts.placeDoor);
    }

  }

  GRID.free(grid);
  return result;
}

dungeon.digRoom = digRoom;


function isValidStairLoc(c, x, y) {
  let count = 0;
  if (!c.isNull()) return false;

  for(let i = 0; i < 4; ++i) {
    const dir = def.dirs[i];
    if (!SITE.hasXY(x + dir[0], y + dir[1])) return false;
    if (!SITE.hasXY(x - dir[0], y - dir[1])) return false;
    const cell = SITE.cell(x + dir[0], y + dir[1]);
    if (cell.hasTile(FLOOR)) {
      count += 1;
      const va = SITE.cell(x - dir[0] + dir[1], y - dir[1] + dir[0]);
      if (!va.isNull()) return false;
      const vb = SITE.cell(x - dir[0] - dir[1], y - dir[1] - dir[0]);
      if (!vb.isNull()) return false;
    }
    else if (!cell.isNull()) {
      return false;
    }
  }
  return count == 1;
}

dungeon.isValidStairLoc = isValidStairLoc;




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




function attachRoomToDungeon(roomGrid, doorSites, placeDoor) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (!SITE.cell(x, y).isNull()) continue;
      const dir = GRID.directionOfDoorSite(SITE.cells, x, y, (c) => (c.hasTile(FLOOR) && !c.isLiquid()) );
      if (dir != def.NO_DIRECTION) {
        const oppDir = OPP_DIRS[dir];

        const offsetX = x - doorSites[oppDir][0];
        const offsetY = y - doorSites[oppDir][1];

        if (doorSites[oppDir][0] != -1
            && roomAttachesAt(roomGrid, offsetX, offsetY))
        {
          dungeon.debug("- attachRoom: ", x, y, oppDir);

          // Room fits here.
          GRID.offsetZip(SITE.cells, roomGrid, offsetX, offsetY, (d, s, i, j) => d.setTile(s) );
          if (placeDoor !== false) {
            SITE.setTile(x, y, (typeof placeDoor === 'number') ? placeDoor : DOOR); // Door site.
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


function attachRoomAtXY(roomGrid, xy, doors, placeDoor) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (roomGrid[x][y]) continue;

      const dir = GRID.directionOfDoorSite(roomGrid, x, y);
      if (dir != def.NO_DIRECTION) {
        const d = DIRS$3[dir];
        if (roomAttachesAt(roomGrid, xy[0] - x, xy[1] - y)) {
          GRID.offsetZip(SITE.cells, roomGrid, xy[0] - x, xy[1] - y, (d, s, i, j) => d.setTile(s) );
          if (placeDoor !== false) {
            SITE.setTile(xy[0], xy[1], (typeof placeDoor === 'number') ? placeDoor : DOOR); // Door site.
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



function insertRoomAtXY(x, y, roomGrid, doorSites, placeDoor) {

  const dirs = utils$1.sequence(4);
  random.shuffle(dirs);

  for(let dir of dirs) {
    const oppDir = OPP_DIRS[dir];

    if (doorSites[oppDir][0] != -1
        && roomAttachesAt(roomGrid, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
    {
      // dungeon.debug("attachRoom: ", x, y, oppDir);

      // Room fits here.
      const offX = x - doorSites[oppDir][0];
      const offY = y - doorSites[oppDir][1];
      GRID.offsetZip(SITE.cells, roomGrid, offX, offY, (d, s, i, j) => d.setTile(s) );
      if (placeDoor !== false) {
        SITE.setTile(x, y, (typeof placeDoor === 'number') ? placeDoor : DOOR); // Door site.
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


function attachRoomAtDoors(roomGrid, roomDoors, siteDoors, placeDoor) {

  const doorIndexes = utils$1.sequence(siteDoors.length);
  random.shuffle(doorIndexes);

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < doorIndexes.length; i++) {
    const index = doorIndexes[i];
    const x = siteDoors[index][0];
    const y = siteDoors[index][1];

    const doors = insertRoomAtXY(x, y, roomGrid, roomDoors, placeDoor);
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

  const lakeGrid = GRID.alloc(SITE.width, SITE.height, 0);

  for (; lakeMaxHeight >= lakeMinSize && lakeMaxWidth >= lakeMinSize && count < maxCount; lakeMaxHeight--, lakeMaxWidth -= 2) { // lake generations

    lakeGrid.fill(NOTHING$1);
    const bounds = GRID.fillBlob(lakeGrid, 5, 4, 4, lakeMaxWidth, lakeMaxHeight, 55, "ffffftttt", "ffffttttt");

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
  GRID.free(lakeGrid);
  return count;

}

dungeon.digLake = digLake;


function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {
  return map.gridDisruptsPassability(SITE, lakeGrid, { gridOffsetX: dungeonToGridX, gridOffsetY: dungeonToGridY });
}



// Add some loops to the otherwise simply connected network of rooms.
function addLoops(minimumPathingDistance, maxConnectionLength) {
    let startX, startY, endX, endY;
    let i, j, d, x, y;

    minimumPathingDistance = minimumPathingDistance || Math.floor(Math.min(SITE.width,SITE.height)/2);
    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.cells;
    const pathGrid = GRID.alloc(SITE.width, SITE.height);
    const costGrid = GRID.alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillBasicCostGrid(costGrid);

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
                  PATH.calculateDistances(pathGrid, startX, startY, costGrid, false);
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
    GRID.free(pathGrid);
    GRID.free(costGrid);
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
    const pathGrid = GRID.alloc(SITE.width, SITE.height);
    const costGrid = GRID.alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillBasicCostGrid(costGrid);

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
                  PATH.calculateDistances(pathGrid, newX, newY, costGrid, false);
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
    GRID.free(pathGrid);
    GRID.free(costGrid);
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


function finishDoors() {
  let i, j;

	for (i=1; i<SITE.width-1; i++) {
		for (j=1; j<SITE.height-1; j++) {
			if (SITE.isDoor(i, j))
			{
				if ((SITE.canBePassed(i+1, j) || SITE.canBePassed(i-1, j))
					&& (SITE.canBePassed(i, j+1) || SITE.canBePassed(i, j-1))) {
					// If there's passable terrain to the left or right, and there's passable terrain
					// above or below, then the door is orphaned and must be removed.
					SITE.setTile(i, j, FLOOR);
          dungeon.debug('Removed orphan door', i, j);
				} else if ((SITE.blocksPathing(i+1, j) ? 1 : 0)
						   + (SITE.blocksPathing(i-1, j) ? 1 : 0)
						   + (SITE.blocksPathing(i, j+1) ? 1 : 0)
						   + (SITE.blocksPathing(i, j-1) ? 1 : 0) >= 3) {
					// If the door has three or more pathing blocker neighbors in the four cardinal directions,
					// then the door is orphaned and must be removed.
          SITE.setTile(i, j, FLOOR);
          dungeon.debug('Removed blocked door', i, j);
				}
			}
		}
	}
}

dungeon.finishDoors = finishDoors;

function finishWalls() {
  SITE.cells.forEach( (cell, i, j) => {
    if (cell.isNull()) {
      cell.setTile(WALL);
    }
  });
}

dungeon.finishWalls = finishWalls;


function addStairs(opts = {}) {

  let upLoc = opts.up || null;
  let downLoc = opts.down || null;
  const minDistance = opts.minDistance || Math.floor(Math.max(SITE.width,SITE.height)/2);
  const isValidStairLoc = opts.isValid || dungeon.isValidStairLoc;
  const setup = opts.setup || SITE.setTile.bind(SITE);

  if (upLoc) {
    upLoc = SITE.cells.matchingXYNear(utils$1.x(upLoc), utils$1.y(upLoc), isValidStairLoc);
  }
  else {
    upLoc = SITE.cells.randomMatchingXY( isValidStairLoc );
  }
  if (!upLoc || upLoc[0] < 0) {
    dungeon.debug('No up stairs location.');
    return false;
  }

  if (downLoc) {
    downLoc = SITE.cells.matchingXYNear(utils$1.x(downLoc), utils$1.y(downLoc), isValidStairLoc);
  }
  else {
    downLoc = SITE.cells.randomMatchingXY( (v, x, y) => {
  		if (utils$1.distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
  		return isValidStairLoc(v, x, y);
  	});
  }
  if (!downLoc || downLoc[0] < 0) {
    dungeon.debug('No down location');
    return false;
  }

  setup(upLoc[0], upLoc[1], UP_STAIRS);
	SITE.locations.start = upLoc.slice();
  setup(downLoc[0], downLoc[1], DOWN_STAIRS);
	SITE.locations.finish = downLoc.slice();

  return true;
}

dungeon.addStairs = addStairs;

fx.debug = utils$1.NOOP;

let ANIMATIONS = [];

function busy$1() {
  return ANIMATIONS.some( (a) => a );
}

fx.busy = busy$1;


async function playAll() {
  while(fx.busy()) {
    const dt = await io.nextTick();
    ANIMATIONS.forEach( (a) => a && a.tick(dt) );
    ANIMATIONS = ANIMATIONS.filter( (a) => a && !a.done );
  }
}

fx.playAll = playAll;


function tick(dt) {
  if (!ANIMATIONS.length) return false;

  io.pauseEvents();
  ANIMATIONS.forEach( (a) => a && a.tick(dt) );
  ANIMATIONS = ANIMATIONS.filter( (a) => a && !a.done );
  io.resumeEvents();

  return true;
}

fx.tick = tick;

async function playRealTime(animation) {
  animation.playFx = fx.playRealTime;

  animation.start();
  ANIMATIONS.push(animation);
  return new Promise( (resolve) => animation.callback = resolve );
}

fx.playRealTime = playRealTime;

async function playGameTime(anim) {
  anim.playFx = fx.playGameTime;

  anim.start();
  scheduler.push(() => {
    anim.step();
    ui.requestUpdate(1);
    return anim.done ? 0 : anim.speed;
  },  anim.speed);

  return new Promise( (resolve) => anim.callback = resolve );
}

fx.playGameTime = playGameTime;


class FX {
  constructor(opts={}) {
    this.tilNextTurn = opts.speed || opts.duration || 1000;
    this.speed = opts.speed || opts.duration || 1000;
    this.callback = utils$1.NOOP;
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
  return fx.playRealTime(anim);
}

fx.flashSprite = flashSprite;

installSprite('bump', 'white', 50);


async function hit(map, target, sprite, duration) {
  sprite = sprite || config.fx.hitSprite || 'hit';
  duration = duration || config.fx.hitFlashTime || 200;
  await fx.flashSprite(map, target.x, target.y, sprite, duration, 1);
}

fx.hit = hit;

installSprite('hit', 'red', 50);

async function miss(map, target, sprite, duration) {
  sprite = sprite || config.fx.missSprite || 'miss';
  duration = duration || config.fx.missFlashTime || 200;
  await fx.flashSprite(map, target.x, target.y, sprite, duration, 1);
}

fx.miss = miss;

installSprite('miss', 'green', 50);


class MovingSpriteFX extends SpriteFX {
  constructor(map$1, source, target, sprite, speed, stepFn) {
    super(map$1, sprite, source.x, source.y, { speed });
    this.target = target;
    this.path = map.getLine(this.map, source.x, source.y, this.target.x, this.target.y);
    this.stepFn = stepFn || utils$1.TRUE;
  }

  step() {
    if (this.x == this.target.x && this.y == this.target.y) return this.stop(this);
    if (!this.path.find( (loc) => loc[0] == this.target.x && loc[1] == this.target.y)) {
      this.path = map.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
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
    sprite = sprites[sprite];
  }
  opts.speed = opts.speed || 3;
  opts.stepFn = opts.stepFn || ((x, y) => map.isObstruction(x, y) ? -1 : 1);
  opts.playFn = fx.playGameTime;
  if (opts.realTime || (!opts.gameTime)) {
    opts.speed *= 16;
    opts.playFn = fx.playRealTime;
  }

  const anim = new MovingSpriteFX(map, source, target, sprite, opts.speed, opts.stepFn);
  return opts.playFn(anim);
}

fx.bolt = bolt;

async function projectile(map, source, target, chs, fg, opts) {
  if (chs.length != 4) utils$1.ERROR('projectile requires 4 chars - vert,horiz,diag-left,diag-right (e.g: "|-\\/")');

  const dir = utils$1.dirFromTo(source, target);
  const dIndex = utils$1.dirIndex(dir);
  const index = Math.floor(dIndex / 2);
  const ch = chs[index];
  const sprite = GW.make.sprite(ch, fg);

  return fx.bolt(map, source, target, sprite, opts);
}

fx.projectile = projectile;


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
  constructor(map$1, from, target, sprite, speed, fade, stepFn) {
    speed = speed || 20;
    super({ speed });
    this.map = map$1;
    this.x = from.x;
    this.y = from.y;
    this.target = target;
    this.sprite = sprite;
    this.fade = fade || speed;
    this.path = map.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    this.stepFn = stepFn || utils$1.TRUE;
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
      fx.debug('BEAM - invalid x,y', x, y);
      return;
    }
    this.x = x;
    this.y = y;
    // fx.flashSprite(this.map, x, y, this.sprite, this.fade);

    const anim = new SpriteFX(this.map, this.sprite, x, y, { duration: this.fade });
    this.playFx(anim);
  }

}

types.BeamFX = BeamFX;

function beam(map, from, to, sprite, opts={}) {
  opts.fade = opts.fade || 5;
  opts.speed = opts.speed || 1;
  opts.stepFn = opts.stepFn || ((x, y) => map.isObstruction(x, y) ? -1 : 1);
  opts.playFn = fx.playGameTime;
  if (opts.realTime || (!opts.gameTime)) {
    opts.speed *= 8;
    opts.fade *= 8;
    opts.playFn = fx.playRealTime;
  }

  const animation = new BeamFX(map, from, to, sprite, opts.speed, opts.fade, opts.stepFn);
  return opts.playFn(animation);
}

fx.beam = beam;



class ExplosionFX extends FX {
  // TODO - take opts instead of individual params (do opts setup here)
  constructor(map, fovGrid, x, y, radius, sprite, speed, fade, shape, center, stepFn) {
    speed = speed || 20;
    super({ speed });
    this.map = map;
    this.grid = GRID.alloc(map.width, map.height);
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
    this.stepFn = stepFn || utils$1.TRUE;
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
        dist = utils$1.distanceBetween(this.x, this.y, x, y);
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
      // fx.flashSprite(this.map, x, y, this.sprite, this.fade);
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
    this.grid = GRID.free(this.grid);
    return super.stop(result);
  }
}

function checkExplosionOpts(opts) {
  opts.speed = opts.speed || 5;
  opts.fade = opts.fade || 10;
  opts.playFn = fx.playGameTime;
  opts.shape = opts.shape || 'o';
  if (opts.center === undefined) { opts.center = true; }

  if (opts.realTime || (!opts.gameTime)) {
    opts.speed = opts.speed * 8;
    opts.fade = opts.fade * 8;
    opts.playFn = fx.playRealTime;
  }
}

function explosion(map, x, y, radius, sprite, opts={}) {
  checkExplosionOpts(opts);
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  const animation = new ExplosionFX(map, null, x, y, radius, sprite, opts.speed, opts.fade, opts.shape, opts.center, opts.stepFn);
  map.calcFov(animation.grid, x, y, radius);
  return opts.playFn(animation);
}

fx.explosion = explosion;

function explosionFor(map, grid, x, y, radius, sprite, opts={}) {
  checkExplosionOpts(opts);
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  const animation = new ExplosionFX(map, grid, x, y, radius, sprite, opts.speed, opts.fade, opts.shape, opts.center, opts.stepFn);
  return opts.playFn(animation);
}

fx.explosionFor = explosionFor;

var fov = {};

fov.debug = utils$1.NOOP;

const FP_BASE$1 = 16;
const BIG_BASE = 16n;
const LOS_SLOPE_GRANULARITY =	32768;		// how finely we divide up the squares when calculating slope;


config.DEFAULT_CELL_FLAGS = 0;




/* Computing the number of leading zeros in a word. */
function clz(x)
{
    let n;

    /* See "Hacker's Delight" book for more details */
    if (x == 0) return 32;
    n = 0;
    if (x <= 0x0000FFFF) {n = n +16; x = (x <<16) >>> 0;}
    if (x <= 0x00FFFFFF) {n = n + 8; x = (x << 8) >>> 0;}
    if (x <= 0x0FFFFFFF) {n = n + 4; x = (x << 4) >>> 0;}
    if (x <= 0x3FFFFFFF) {n = n + 2; x = (x << 2) >>> 0;}
    if (x <= 0x7FFFFFFF) {n = n + 1;}

    return n;
}


function fp_sqrt(val)
{
    let x;
    let bitpos;
    let v;		// int64

    if(!val)
        return val;

    if (val < 0) {
    	throw new Error('MATH OVERFLOW - limit is 32767 << FP_BASE (about 181 * 181)! Received: ' + val);
    }

    /* clz = count-leading-zeros. bitpos is the position of the most significant bit,
        relative to "1" or 1 << FP_BASE */
    bitpos = FP_BASE$1 - clz(val);

    /* Calculate our first estimate.
        We use the identity 2^a * 2^a = 2^(2*a) or:
         sqrt(2^a) = 2^(a/2)
    */
    if(bitpos > 0) /* val > 1 */
        x = BigInt((1<<FP_BASE$1) << (bitpos >> 1));
    else if(bitpos < 0) /* 0 < val < 1 */
        x = BigInt((1<<FP_BASE$1) << ((~bitpos) << 1));
    else /* val == 1 */
        x = BigInt((1<<FP_BASE$1));

    /* We need to scale val with FP_BASE due to the division.
       Also val /= 2, hence the subtraction of one*/
    v = BigInt(val) << (BIG_BASE - 1n);  // v = val <<  (FP_BASE - 1);

    /* The actual iteration */
    x = (x >> 1n) + (v/x);
    x = (x >> 1n) + (v/x);
    x = (x >> 1n) + (v/x);
    x = (x >> 1n) + (v/x);

    return Number(x);
}

//
// function updateFieldOfViewDisplay(i, j, refreshDisplay) {
//
// 	refreshDisplay = (refreshDisplay !== false);
//
//   const map = DATA.map;
// 	const cell = map.cell(i, j);
//
// 	if (cell.flags & CellFlags.IN_FIELD_OF_VIEW
// 		&& (map.hasVisibleLight(i, j))
// 		&& !(cell.flags & CellFlags.CLAIRVOYANT_DARKENED))
// 	{
// 		cell.flags |= CellFlags.VISIBLE;
// 	}
//
// 	if ((cell.flags & CellFlags.VISIBLE) && !(cell.flags & CellFlags.WAS_VISIBLE)) { // if the cell became visible this move
// 		if (!(cell.flags & CellFlags.REVEALED) && DATA.automationActive) {
//         if (cell.flags & CellFlags.HAS_ITEM) {
//             const theItem = map.itemAt(i, j);
//             if (theItem && theItem.category && (GW.categories[theItem.category].flags & GW.const.IC_INTERRUPT_EXPLORATION_WHEN_SEEN)) {
//                 const name = GW.item.name(theItem, false, true, NULL);
//                 const buf = GW.string.format("you see %s.", name);
//                 GW.ui.message(GW.colors.itemMessageColor, buf);
//             }
//         }
//         if (!(cell.flags & CellFlags.MAGIC_MAPPED)
//             && map.hasTileMechFlag(i, j, TM_INTERRUPT_EXPLORATION_WHEN_SEEN))
// 				{
//             const name = map.tileWithMechFlag(i, j, TM_INTERRUPT_EXPLORATION_WHEN_SEEN).description;
//             const buf = GW.string.format("you see %s.", name);
//             GW.ui.message(GW.colors.backgroundMessageColor, buf);
//         }
//     }
//     map.markRevealed(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.VISIBLE) && (cell.flags & CellFlags.WAS_VISIBLE)) { // if the cell ceased being visible this move
//     map.storeMemory(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.CLAIRVOYANT_VISIBLE) && (cell.flags & CellFlags.WAS_CLAIRVOYANT_VISIBLE)) { // ceased being clairvoyantly visible
// 		map.storeMemory(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.WAS_CLAIRVOYANT_VISIBLE) && (cell.flags & CellFlags.CLAIRVOYANT_VISIBLE)) { // became clairvoyantly visible
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.TELEPATHIC_VISIBLE) && (cell.flags & CellFlags.WAS_TELEPATHIC_VISIBLE)) { // ceased being telepathically visible
//     map.storeMemory(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.WAS_TELEPATHIC_VISIBLE) && (cell.flags & CellFlags.TELEPATHIC_VISIBLE)) { // became telepathically visible
//     if (!(cell.flags & CellFlags.REVEALED)
// 			&& !map.hasTileFlag(i, j, T_PATHING_BLOCKER))
// 		{
// 			DATA.xpxpThisTurn++;
//     }
//
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.MONSTER_DETECTED) && (cell.flags & CellFlags.WAS_MONSTER_DETECTED)) { // ceased being detected visible
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 			map.storeMemory(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.WAS_MONSTER_DETECTED) && (cell.flags & CellFlags.MONSTER_DETECTED)) { // became detected visible
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 			map.storeMemory(i, j);
// 		}
// 	} else if (GW.player.canSeeOrSense(i, j)
// 			   && GW.map.lightChanged(i, j)) // if the cell's light color changed this move
// 	{
//    if (refreshDisplay) {
// 	   map.redrawCell(i, j);
//    }
// 	}
// }
//
// fov.updateCellDisplay = updateFieldOfViewDisplay;
//
//
//
// function demoteVisibility() {
// 	let i, j;
//
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			const cell = DATA.map.cell(i, j);
// 			cell.flags &= ~WAS_VISIBLE;
// 			if (cell.flags & CellFlags.VISIBLE) {
// 				cell.flags &= ~VISIBLE;
// 				cell.flags |= WAS_VISIBLE;
// 			}
// 		}
// 	}
// }
//
//
// function updateVision(refreshDisplay) {
// 	let i, j;
// 	let theItem;	// item *
// 	let monst;	// creature *
//
//   demoteVisibility();
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			DATA.map.cell(i, j).flags &= ~IN_FIELD_OF_VIEW;
// 		}
// 	}
//
// 	// Calculate player's field of view (distinct from what is visible, as lighting hasn't been done yet).
// 	const maxRadius = GW.player.visionRadius();
// 	const grid = GW.grid.alloc();
// 	getFOVMask(grid, GW.PLAYER.x, GW.PLAYER.y, maxRadius, (T_OBSTRUCTS_VISION), 0, false);
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			if (grid[i][j]) {
// 				DATA.map.setCellFlags(i, j, IN_FIELD_OF_VIEW);
// 			}
// 		}
// 	}
// 	GW.grid.free(grid);
//
// 	DATA.map.setCellFlags(GW.PLAYER.x, GW.PLAYER.y, IN_FIELD_OF_VIEW | VISIBLE);
//
// 	// if (PLAYER.bonus.clairvoyance < 0) {
//   //   discoverCell(PLAYER.xLoc, PLAYER.yLoc);
// 	// }
// 	//
// 	// if (PLAYER.bonus.clairvoyance != 0) {
// 	// 	updateClairvoyance();
// 	// }
//
//   // updateTelepathy();
// 	// updateMonsterDetection();
//
// 	// updateLighting();
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			fov.updateCellDisplay(i, j, refreshDisplay);
// 		}
// 	}
//
// 	if (GW.PLAYER.status[GW.const.STATUS_HALLUCINATING] > 0) {
// 		for (theItem of GW.ITEMS) {
// 			if (DATA.map.hasCellFlag(theItem.x, theItem.y, REVEALED) && refreshDisplay) {
// 				DATA.map.redrawCell(theItem.x, theItem.y);
// 			}
// 		}
// 		for (monst of GW.ACTORS) {
// 			if (DATA.map.hasCellFlag(monst.x, monst.y, REVEALED) && refreshDisplay) {
// 				DATA.map.redrawCell(monst.x, monst.y);
// 			}
// 		}
// 	}
//
// }
//
//
// fov.update = updateVision;
//



//		   Octants:      //
//			\7|8/        //
//			6\|/1        //
//			--@--        //
//			5/|\2        //
//			/4|3\        //

function betweenOctant1andN(x, y, x0, y0, n) {
	let x1 = x, y1 = y;
	let dx = x1 - x0, dy = y1 - y0;
	switch (n) {
		case 1:
			return [x,y];
		case 2:
			return [x, y0 - dy];
		case 5:
			return [x0 - dx, y0 - dy];
		case 6:
			return [x0 - dx, y];
		case 8:
			return [x0 - dy, y0 - dx];
		case 3:
			return [x0 - dy, y0 + dx];
		case 7:
			return [x0 + dy, y0 - dx];
		case 4:
			return [x0 + dy, y0 + dx];
	}
}


class FOV {
  constructor(grid, isBlocked) {
    this.grid = grid;
    this.isBlocked = isBlocked;
  }

  isVisible(x, y) { return this.grid.hasXY(x, y) && this.grid[x][y]; }
  setVisible(x, y) { this.grid[x][y] = 1; }

  calculate(x, y, maxRadius, cautiousOnWalls) {
    this.grid.fill(0);
    this.grid[x][y] = 1;
    for (let i=1; i<=8; i++) {
  		this._scanOctant(x, y, i, (maxRadius + 1) << FP_BASE$1, 1, LOS_SLOPE_GRANULARITY * -1, 0, cautiousOnWalls);
  	}
  }

  // This is a custom implementation of recursive shadowcasting.
  _scanOctant(xLoc, yLoc, octant, maxRadius,
  				   columnsRightFromOrigin, startSlope, endSlope, cautiousOnWalls)
  {
  	// fov.debug('scanOctantFOV', xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin, startSlope, endSlope);
  	if ((columnsRightFromOrigin << FP_BASE$1) >= maxRadius) {
  		// fov.debug(' - columnsRightFromOrigin >= maxRadius', columnsRightFromOrigin << FP_BASE, maxRadius);
  		return;
  	}

  	let i, a, b, iStart, iEnd, x, y, x2, y2; // x and y are temporary variables on which we do the octant transform
  	let newStartSlope, newEndSlope;
  	let cellObstructed;
  	let loc;

  	// if (Math.floor(maxRadius) != maxRadius) {
  	// 		maxRadius = Math.floor(maxRadius);
  	// }
  	newStartSlope = startSlope;

  	a = (((LOS_SLOPE_GRANULARITY / -2 + 1) + startSlope * columnsRightFromOrigin) / LOS_SLOPE_GRANULARITY) >> 0;
  	b = (((LOS_SLOPE_GRANULARITY / -2 + 1) + endSlope * columnsRightFromOrigin) / LOS_SLOPE_GRANULARITY) >> 0;

  	iStart = Math.min(a, b);
  	iEnd = Math.max(a, b);

  	// restrict vision to a circle of radius maxRadius

  	let radiusSquared = Number(BigInt(maxRadius*maxRadius) >> (BIG_BASE*2n));
  	radiusSquared += (maxRadius >> FP_BASE$1);
  	if ((columnsRightFromOrigin*columnsRightFromOrigin + iEnd*iEnd) >= radiusSquared ) {
  		// fov.debug(' - columnsRightFromOrigin^2 + iEnd^2 >= radiusSquared', columnsRightFromOrigin, iEnd, radiusSquared);
  		return;
  	}
  	if ((columnsRightFromOrigin*columnsRightFromOrigin + iStart*iStart) >= radiusSquared ) {
  		const bigRadiusSquared = Number(BigInt(maxRadius*maxRadius) >> BIG_BASE); // (maxRadius*maxRadius >> FP_BASE)
  		const bigColumsRightFromOriginSquared = Number(BigInt(columnsRightFromOrigin*columnsRightFromOrigin) << BIG_BASE);	// (columnsRightFromOrigin*columnsRightFromOrigin << FP_BASE)
  		iStart = Math.floor(-1 * fp_sqrt(bigRadiusSquared - bigColumsRightFromOriginSquared) >> FP_BASE$1);
  	}

  	x = xLoc + columnsRightFromOrigin;
  	y = yLoc + iStart;
  	loc = betweenOctant1andN(x, y, xLoc, yLoc, octant);
  	x = loc[0];
  	y = loc[1];
  	let currentlyLit = this.isBlocked(x, y);

  	// fov.debug(' - scan', iStart, iEnd);
  	for (i = iStart; i <= iEnd; i++) {
  		x = xLoc + columnsRightFromOrigin;
  		y = yLoc + i;
  		loc = betweenOctant1andN(x, y, xLoc, yLoc, octant);
  		x = loc[0];
  		y = loc[1];

  		cellObstructed = this.isBlocked(x, y);
  		// if we're cautious on walls and this is a wall:
  		if (cautiousOnWalls && cellObstructed) {
  			// (x2, y2) is the tile one space closer to the origin from the tile we're on:
  			x2 = xLoc + columnsRightFromOrigin - 1;
  			y2 = yLoc + i;
  			if (i < 0) {
  				y2++;
  			} else if (i > 0) {
  				y2--;
  			}
  			loc = betweenOctant1andN(x2, y2, xLoc, yLoc, octant);
  			x2 = loc[0];
  			y2 = loc[1];

  			if (this.isVisible(x2, y2)) {
  				// previous tile is visible, so illuminate
  				this.setVisible(x, y);
  			}
  		} else {
  			// illuminate
        this.setVisible(x, y);
  		}
  		if (!cellObstructed && !currentlyLit) { // next column slope starts here
  			newStartSlope = ((LOS_SLOPE_GRANULARITY * (i) - LOS_SLOPE_GRANULARITY / 2) / (columnsRightFromOrigin * 2 + 1) * 2) >> 0;
  			currentlyLit = true;
  		} else if (cellObstructed && currentlyLit) { // next column slope ends here
  			newEndSlope = ((LOS_SLOPE_GRANULARITY * (i) - LOS_SLOPE_GRANULARITY / 2)
  							/ (columnsRightFromOrigin * 2 - 1) * 2) >> 0;
  			if (newStartSlope <= newEndSlope) {
  				// run next column
  				this._scanOctant(xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin + 1, newStartSlope, newEndSlope, cautiousOnWalls);
  			}
  			currentlyLit = false;
  		}
  	}
  	if (currentlyLit) { // got to the bottom of the scan while lit
  		newEndSlope = endSlope;
  		if (newStartSlope <= newEndSlope) {
  			// run next column
  			this._scanOctant(xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin + 1, newStartSlope, newEndSlope, cautiousOnWalls);
  		}
  	}
  }
}

types.FOV = FOV;

async function moveDir(e) {
  const actor = e.actor || data.player;
  const newX = e.dir[0] + actor.x;
  const newY = e.dir[1] + actor.y;
  const map = data.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };

  if (!map.hasXY(newX, newY)) {
    message.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT

  // Can we enter new cell?
  if (cell.hasTileFlag(Flags$2.T_OBSTRUCTS_PASSABILITY)) {
    message.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    message.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(Flags$2.T_LAVA) && !cell.hasTileFlag(Flags$2.T_BRIDGE)) {
    if (!await ui.confirm('That is certain death!  Proceed anyway?')) {
      return false;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    message.moveFailed(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // APPLY EFFECTS
  for(let tile$1 of cell.tiles()) {
    await tile.applyInstantEffects(tile$1, cell);
    if (data.gameHasEnded) {
      return true;
    }
  }

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)
  let fired;
  if (data.player === actor) {
    fired = await cell.fireEvent('playerEnter', ctx);
  }
  if (!fired) {
    await cell.fireEvent('enter', ctx);
  }

  ui.requestUpdate();
  actor.endTurn();
  return true;
}

commands.moveDir = moveDir;


// async function moveTo(x, y, actor) {
//   actor = actor || DATA.player;
//   return commands.moveDir(x - actor.x, y - actor.y, actor);
// }

var SETUP = null;

// messages
const ARCHIVE = [];
const DISPLAYED = [];
const CONFIRMED = [];
var ARCHIVE_LINES = 30;
var CURRENT_ARCHIVE_POS = 0;
var NEEDS_UPDATE = false;
var INTERFACE_OPACITY = 90;



function setup(opts) {
  opts.height = opts.height || 1;
  for(let i = 0; i < opts.height; ++i) {
    CONFIRMED[i] = null;
    DISPLAYED[i] = null;
  }

  SETUP = message.bounds = new types.Bounds(opts.x, opts.y, opts.w || opts.width, opts.h || opts.height);
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

function moveBlocked(ctx) {
  message.add('Blocked!');
}

message.moveBlocked = moveBlocked;


function add(...args) {
  if (args.length == 0) return;
  let msg = args[0];
  if (args.length > 1) {
    msg = text.format(...args);
  }
  addMessage(msg);
}

message.add = add;






function drawMessages(buffer) {
	let i;
	const tempColor = make.color();
	let messageColor;

  if (!NEEDS_UPDATE || !SETUP) return false;

  const isOnTop = (SETUP.y < 10);

	for (i=0; i < SETUP.height; i++) {
		messageColor = tempColor;
		messageColor.copy(colors.white);

		if (CONFIRMED[i]) {
			color.applyMix(messageColor, colors.black, 50);
			color.applyMix(messageColor, colors.black, 75 * i / (2*SETUP.height));
		}

    const localY = isOnTop ? (SETUP.height - i - 1) : i;
    const y = SETUP.toOuterY(localY);

		text.eachChar( DISPLAYED[i], (c, color$1, j) => {
			const x = SETUP.toOuterX(j);

			if (color$1 && (messageColor !== color$1) && CONFIRMED[i]) {
				color.applyMix(color$1, colors.black, 50);
				color.applyMix(color$1, colors.black, 75 * i / (2*SETUP.height));
			}
			messageColor = color$1 || messageColor;
			buffer.plotChar(x, y, c, messageColor, colors.black);
		});

		for (let j = text.length(DISPLAYED[i]); j < SETUP.width; j++) {
			const x = SETUP.toOuterX(j);
			buffer.plotChar(x, y, ' ', colors.black, colors.black);
		}
	}

  NEEDS_UPDATE = false;
  return true;
}

message.draw = drawMessages;


// function messageWithoutCaps(msg, requireAcknowledgment) {
function addMessageLine(msg) {
	let i;

	if (!text.length(msg)) {
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
	// displayCombatText();

	msg = text.capitalize(msg);

  if (!SETUP) {
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
	// 			text.splice(i, 2, replace);
  //     }
  // }

	const lines = text.splitIntoLines(msg, SETUP.width);

  if (SETUP.y < 10) {  // On top of UI
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


// let COMBAT_MESSAGE = null;
//
// function combatMessage(...args) {
// 	const msg = message.format(...args);
// 	if (!COMBAT_MESSAGE) {
// 		COMBAT_MESSAGE = msg;
// 	}
// 	else {
// 		COMBAT_MESSAGE += ' ' + message.capitalize(msg);;
// 	}
// NEEDS_UPDATE = true;
// UI.requestUpdate();
// }
//
// UI.combatMessage = combatMessage;
//
//
// function commitCombatMessage() {
// 	if (!COMBAT_MESSAGE) return false;
// 	addMessage(COMBAT_MESSAGE);
// 	COMBAT_MESSAGE = null;
// 	return true;
// }
//
//
function confirmAll() {
	for (let i=0; i<CONFIRMED.length; i++) {
		CONFIRMED[i] = true;
	}
  NEEDS_UPDATE = true;
  ui.requestUpdate();
}

message.confirmAll = confirmAll;


async function showArchive() {
	let i, j, k, reverse, fadePercent, totalMessageCount, currentMessageCount;
	let fastForward;

  if (!SETUP) return;

	// Count the number of lines in the archive.
	for (totalMessageCount=0;
		 totalMessageCount < ARCHIVE_LINES && ARCHIVE[totalMessageCount];
		 totalMessageCount++);

	if (totalMessageCount <= SETUP.height) return;

  const isOnTop = (SETUP.y < 10);
	const dbuf = ui.startDialog();

	// Pull-down/pull-up animation:
	for (reverse = 0; reverse <= 1; reverse++) {
		fastForward = false;
		for (currentMessageCount = (reverse ? totalMessageCount : SETUP.height);
			 (reverse ? currentMessageCount >= SETUP.height : currentMessageCount <= totalMessageCount);
			 currentMessageCount += (reverse ? -1 : 1))
	  {
			dbuf.clear();

			// Print the message archive text to the dbuf.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				const pos = (CURRENT_ARCHIVE_POS - currentMessageCount + ARCHIVE_LINES + j) % ARCHIVE_LINES;
        const y = isOnTop ? j : dbuf.height - j - 1;

				dbuf.plotLine(SETUP.toOuterX(0), y, SETUP.width, ARCHIVE[pos], colors.white, colors.black);
			}

			// Set the dbuf opacity, and do a fade from bottom to top to make it clear that the bottom messages are the most recent.
			for (j=0; j < currentMessageCount && j < dbuf.height; j++) {
				fadePercent = 40 * (j + totalMessageCount - currentMessageCount) / totalMessageCount + 60;
				for (i=0; i<SETUP.width; i++) {
					const x = SETUP.toOuterX(i);

          const y = isOnTop ? j : dbuf.height - j - 1;
					dbuf[x][y].opacity = INTERFACE_OPACITY;
					if (dbuf[x][y].char != ' ') {
						for (k=0; k<3; k++) {
							dbuf[x][y].fg[k] = dbuf[x][y].fg[k] * fadePercent / 100;
						}
					}
				}
			}

			ui.draw();

			if (!fastForward && await io.pause(reverse ? 15 : 45)) {
				fastForward = true;
				// dequeueEvent();
				currentMessageCount = (reverse ? SETUP.height + 1 : totalMessageCount - 1); // skip to the end
			}
		}

		if (!reverse) {
    	if (!data.autoPlayingLevel) {
        const y = isOnTop ? 0 : dbuf.height - 1;
        dbuf.plotText(SETUP.toOuterX(-8), y, "--DONE--", colors.black, colors.white);
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
}

viewport.setup = setup$1;

// DRAW

function drawViewport(buffer, map$1) {
  map$1 = map$1 || data.map;
  if (!map$1) return;
  if (!map$1.flags & Flags$4.MAP_CHANGED) return;

  map$1.cells.forEach( (c, i, j) => {
    if (!VIEWPORT.containsXY(i + VIEWPORT.x, j + VIEWPORT.y)) return;

    if (c.flags & Flags$1.NEEDS_REDRAW) {
      const buf = buffer[i + VIEWPORT.x][j + VIEWPORT.y];
      map.getCellAppearance(map$1, i, j, buf);
      c.clearFlags(Flags$1.NEEDS_REDRAW);
      buffer.needsUpdate = true;
    }
  });

  map$1.flags &= ~Flags$4.MAP_CHANGED;
}


viewport.draw = drawViewport;

const flavorTextColor = color.install('flavorText', 50, 40, 90);
const flavorPromptColor = color.install('flavorPrompt', 100, 90, 20);

let FLAVOR_TEXT = '';
let NEED_FLAVOR_UPDATE = false;
let SETUP$1 = null;
let IS_PROMPT = false;

function setupFlavor(opts={}) {
  SETUP$1 = flavor.bounds = new types.Bounds(opts.x, opts.y, opts.w, 1);
}

flavor.setup = setupFlavor;

function setFlavorText(text$1) {
  FLAVOR_TEXT = text.capitalize(text$1);
  NEED_FLAVOR_UPDATE = true;
  IS_PROMPT = false;
  ui.requestUpdate();
}

flavor.setText = setFlavorText;


function showPrompt(text$1) {
  FLAVOR_TEXT = text.capitalize(text$1);
  NEED_FLAVOR_UPDATE = true;
  IS_PROMPT = true;
  ui.requestUpdate();
}

flavor.showPrompt = showPrompt;


function drawFlavor(buffer) {
  if (!NEED_FLAVOR_UPDATE || !SETUP$1) return;
  const color = IS_PROMPT ? flavorPromptColor : flavorTextColor;
  buffer.plotLine(SETUP$1.x, SETUP$1.y, SETUP$1.width, FLAVOR_TEXT, color, colors.black);
}

flavor.draw = drawFlavor;



function showFlavorFor(x, y) {
  if (!data.map) return;
  const map = data.map;
	const cell = map.cell(x, y);
	let buf;

	let monst;
	let theItem;
	let standsInTerrain;
	let object;

  const player = data.player || null;

	monst = null;
	standsInTerrain = ((cell.highestPriorityTile().mechFlags & MechFlags$1.TM_STAND_IN_TILE) ? true : false);
	theItem = map.itemAt(x, y);
	if (cell.flags & Flags$1.HAS_MONSTER) {
		monst = map.actorAt(x, y);
	} else if (cell.flags & Flags$1.HAS_DORMANT_MONSTER) {
		monst = map.dormantAt(x, y);
	}

	if (player && x == player.x && y == player.y) {
		if (player.status[def.STATUS_LEVITATING]) {
			buf = text.format("you are hovering above %s.", cell.tileText());
		}
    else {
			// if (theItem) {
			// 	buf = ITEM.flavorText(theItem);
			// }
      // else {
        buf = 'you see yourself.';
      // }
		}
    flavor.setText(buf);
		return true;
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
		if (cell.flags & Flags$1.REVEALED) { // memory
			// if (cell.rememberedItemCategory) {
      //   if (player.status[GW.const.STATUS_HALLUCINATING] && !GW.GAME.playbackOmniscience) {
      //       object = GW.item.describeHallucinatedItem();
      //   } else {
      //       object = GW.item.describeItemBasedOnParameters(cell.rememberedItemCategory, cell.rememberedItemKind, cell.rememberedItemQuantity);
      //   }
			// } else {
				object = tiles[cell.memory.tile].description;
			// }
			buf = text.format("you remember seeing %s here.", object);
		} else if (cell.flags & Flags$1.MAGIC_MAPPED) { // magic mapped
			buf = text.format("you expect %s to be here.", tiles[cell.memory.tile].description);
		}
		flavor.setText(buf);
    return true;
	}

	// if (monst) {
	// 	return GW.actor.flavorText(monst);
	// } else if (theItem) {
	// 	return GW.item.flavorText(theItem);
	// }

	buf = text.format("you %s %s.", (map.isVisible(x, y) ? "see" : "sense"), cell.tileText());
  flavor.setText(buf);
	return true;
}

flavor.showFor = showFlavorFor;

ui.debug = utils$1.NOOP;
let SHOW_CURSOR = false;

let UI_BUFFER = null;
let UI_BASE = null;
let UI_OVERLAY = null;
let IN_DIALOG = false;

let time = performance.now();

let RUNNING = false;

function uiLoop(t) {
	t = t || performance.now();

  if (RUNNING) {
    requestAnimationFrame(uiLoop);
  }

	const dt = Math.floor(t - time);
	time = t;

	if ((!IN_DIALOG) && fx.tick(dt)) {
		ui.draw();
	}
	else {
		const ev = io.makeTickEvent(dt);
		io.pushEvent(ev);
	}

	ui.canvas.draw();
}


function start$1(opts={}) {

  utils$1.setDefaults(opts, {
    width: 100,
    height: 34,
    bg: 'black',
    sidebar: false,
    messages: false,
		cursor: false,
		flavor: false,
    menu: false,
    div: 'canvas',
    io: true,
  });

  if (!ui.canvas) {
    ui.canvas = new types.Canvas(opts.width, opts.height, opts.div, opts);

    if (opts.io && typeof document !== 'undefined') {
      ui.canvas.element.onmousedown = ui.onmousedown;
      ui.canvas.element.onmousemove = ui.onmousemove;
    	document.onkeydown = ui.onkeydown;
    }
  }

  // TODO - init sidebar, messages, flavor, menu
  UI_BUFFER = UI_BUFFER || ui.canvas.allocBuffer();
  UI_BASE = UI_BASE || ui.canvas.allocBuffer();
  UI_OVERLAY = UI_OVERLAY || ui.canvas.allocBuffer();
  UI_BASE.clear();
  UI_OVERLAY.clear();

  IN_DIALOG = false;

	let viewX = 0;
	let viewY = 0;
	let viewW = opts.width;
	let viewH = opts.height;

	let flavorLine = -1;

	if (opts.messages) {
		if (opts.messages < 0) {	// on bottom of screen
			message.setup({x: 0, y: ui.canvas.height + opts.messages, width: ui.canvas.width, height: -opts.messages, archive: ui.canvas.height });
			viewH += opts.messages;	// subtract off message height
			if (opts.flavor) {
				viewH -= 1;
				flavorLine = ui.canvas.height + opts.messages - 1;
			}
		}
		else {	// on top of screen
			message.setup({x: 0, y: 0, width: ui.canvas.width, height: opts.messages, archive: ui.canvas.height });
			viewY = opts.messages;
			viewH -= opts.messages;
			if (opts.flavor) {
				viewY += 1;
				viewH -= 1;
				flavorLine = opts.messages;
			}
		}
	}

	if (opts.flavor) {
		flavor.setup({ x: viewX, y: flavorLine, w: viewW, h: 1 });
	}

	viewport.setup({ x: viewX, y: viewY, w: viewW, h: viewH });
	SHOW_CURSOR = opts.cursor;

  ui.blackOutDisplay();
	RUNNING = true;
	uiLoop();

  return ui.canvas;
}

ui.start = start$1;


function stop() {
	RUNNING = false;
}

ui.stop = stop;



async function dispatchEvent$1(ev) {

	if (ev.type === def.CLICK) {
		if (message.bounds && message.bounds.containsXY(ev.x, ev.y)) {
			await message.showArchive();
			return true;
		}
		if (flavor.bounds && flavor.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
	}
	else if (ev.type === def.MOUSEMOVE) {
		if (viewport.bounds && viewport.bounds.containsXY(ev.x, ev.y)) {
			if (SHOW_CURSOR) {
				ui.setCursor(viewport.bounds.toInnerX(ev.x), viewport.bounds.toInnerY(ev.y));
			}
			return true;
		}
		else {
			ui.clearCursor();
		}
		if (flavor.bounds && flavor.bounds.containsXY(ev.x, ev.y)) {
			return true;
		}
	}

	await io.dispatchEvent(ev);
}

ui.dispatchEvent = dispatchEvent$1;


let UPDATE_REQUESTED = 0;
function requestUpdate(t=1) {
	UPDATE_REQUESTED = Math.max(UPDATE_REQUESTED, t, 1);
}

ui.requestUpdate = requestUpdate;

async function updateNow(t=1) {
	t = Math.max(t, UPDATE_REQUESTED, 0);
	UPDATE_REQUESTED = 0;

	ui.draw();
	ui.canvas.draw();
	if (t) {
		// const now = performance.now();
		// ui.debug('UI update - with timeout:', t);
		const r = await io.tickMs(t);
		// ui.debug('- done', r, Math.floor(performance.now() - now));
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

function setCursor(x, y) {
  const map = data.map;
  if (!map) return false;

  if (CURSOR.x == x && CURSOR.y == y) return false;

  // ui.debug('set cursor', x, y);

  if (map.hasXY(CURSOR.x, CURSOR.y)) {
    map.clearCellFlags(CURSOR.x, CURSOR.y, CellFlags.IS_CURSOR);
  }
  CURSOR.x = x;
  CURSOR.y = y;

  if (map.hasXY(x, y)) {
    // if (!DATA.player || DATA.player.x !== x || DATA.player.y !== y ) {
      map.setCellFlags(CURSOR.x, CURSOR.y, CellFlags.IS_CURSOR);
    // }

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
  // GW.ui.flavorMessage(GW.map.cellFlavor(GW.PLAYER.x, GW.PLAYER.y));
}

ui.clearCursor = clearCursor;


async function messageBox(text, fg, duration) {

  const buffer = ui.startDialog();

  const len = text.length;
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 3, ' ', 'black', 'black');
	buffer.plotText(x + 2, y + 1, text, fg || 'white');
	ui.draw();

	await io.pause(duration || 30 * 1000);

	ui.finishDialog();
}

ui.messageBox = messageBox;


async function confirm(text, fg) {

  const buffer = ui.startDialog();

	const btnOK = 'OK=Enter';
	const btnCancel = 'Cancel=Escape';
  const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
  const x = Math.floor((ui.canvas.width - len - 4) / 2) - 2;
  const y = Math.floor(ui.canvas.height / 2) - 1;
  buffer.fillRect(x, y, len + 4, 5, ' ', 'black', 'black');
	buffer.plotText(x + 2, y + 1, text, fg || 'white');
	buffer.plotText(x + 2, y + 3, btnOK, 'white');
	buffer.plotText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, 'white');
	ui.draw();

	let result;
	while(result === undefined) {
		const ev = await io.nextEvent(1000);
		await io.dispatchEvent(ev, {
			enter() {
				result = true;
			},
			escape() {
				result = false;
			},
			mousemove() {
				let isOK = ev.x < x + btnOK.length + 2;
				let isCancel = ev.x > x + len + 4 - btnCancel.length - 4;
				if (ev.x < x || ev.x > x + len + 4) { isOK = false; isCancel = false; }
				if (ev.y != y + 3 ) { isOK = false; isCancel = false; }
				buffer.plotText(x + 2, y + 3, btnOK, isOK ? 'blue' : 'white');
				buffer.plotText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, isCancel ? 'blue' : 'white');
				ui.draw();
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
	UI_BUFFER.erase();
}

ui.blackOutDisplay = blackOutDisplay;


// DIALOG

function startDialog() {
  IN_DIALOG = true;
  ui.canvas.copyBuffer(UI_BASE);
	ui.canvas.copyBuffer(UI_OVERLAY);
	UI_OVERLAY.forEach( (c) => c.opacity = 0 );
  // UI_OVERLAY.clear();
  return UI_OVERLAY;
}

ui.startDialog = startDialog;

function clearDialog() {
	if (IN_DIALOG) {
		UI_OVERLAY.copy(UI_BASE);
	}
}

ui.clearDialog = clearDialog;

function finishDialog() {
  IN_DIALOG = false;
  ui.canvas.overlay(UI_BASE);
  UI_OVERLAY.clear();
}

ui.finishDialog = finishDialog;

// DRAW

function draw() {
  if (IN_DIALOG) {
    // ui.canvas.overlay(UI_BASE);
    ui.canvas.overlay(UI_OVERLAY);
  }
  else if (ui.canvas) {
    // const side = GW.sidebar.draw(UI_BUFFER);
    if (viewport.bounds) viewport.draw(ui.canvas.buffer);
		if (message.bounds) message.draw(ui.canvas.buffer);
		if (flavor.bounds) flavor.draw(ui.canvas.buffer);
			UPDATE_REQUESTED = 0;
    // }
  }
}

ui.draw = draw;

export { actor, canvas, cell, color, colors, commands, config, cosmetic, data, def, digger, diggers, dungeon, flag, flags, flavor, fov, fx, game, GRID as grid, install, io, item, itemKinds, make, map, message, PATH as path, player, random, scheduler, sprite, sprites, text, tile, tileEvent, tileEvents, tiles, types, ui, utils$1 as utils, viewport };
