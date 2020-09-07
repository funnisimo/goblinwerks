(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GW = {}));
}(this, (function (exports) { 'use strict';

  var def = {};
  var utils = {};
  var types = {};
  var debug$1 = {};

  var make = {};
  var install = {};
  var grid$1 = {};

  var buffer = {};
  var canvas$1 = {};
  var io = {};

  var path = {};
  var actor = {};

  var commands = {};
  var config = {};
  var data = {};

  def.dirs    = [[0,-1], [0,1],  [-1,0], [1,0],  [-1,-1], [-1,1], [1,-1], [1,1]];
  def.oppDirs = [[0,1],  [0,-1], [1,0],  [-1,0], [1,1],   [1,-1], [-1,1], [-1,-1]];
  def.clockDirs = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

  def.NO_DIRECTION = -1;
  def.UP = 0;
  def.DOWN = 1;
  def.LEFT = 2;
  def.RIGHT = 3;
  def.LEFT_UP = 4;
  def.LEFT_DOWN = 5;
  def.RIGHT_UP = 6;
  def.RIGHT_DOWN = 7;

  debug$1.log = console.log;

  function NOOP()  {}
  utils.NOOP = NOOP;

  function TRUE()  { return true; }
  utils.TRUE = TRUE;

  function FALSE() { return false; }
  utils.FALSE = FALSE;

  function IDENTITY(x) { return x; }
  utils.IDENTITY = IDENTITY;


  function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  utils.clamp = clamp;

  function copyXY(dest, src) {
    dest.x = src.x || src[0] || 0;
    dest.y = src.y || src[1] || 0;
  }

  utils.copyXY = copyXY;

  function addXY(dest, src) {
    dest.x += src.x || src[0] || 0;
    dest.y += src.y || src[1] || 0;
  }

  utils.addXY = addXY;

  function equalsXY(dest, src) {
    return (dest.x == (src.x || src[0] || 0))
    && (dest.y == (src.y || src[1] || 0));
  }

  utils.equalsXY = equalsXY;

  function distanceBetween(x1, y1, x2, y2) {
    const x = Math.abs(x1 - x2);
    const y = Math.abs(y1 - y2);
    const min = Math.min(x, y);
    return x + y - (0.6 * min);
  }

  utils.distanceBetween = distanceBetween;

  function distanceFromTo(a, b) {
    return distanceBetween(a.x || a[0] || 0, a.y || a[1] || 0, b.x || b[0] || 0, b.y || b[1] || 0);
  }

  utils.distanceFromTo = distanceFromTo;

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

  utils.dirBetween = dirBetween;

  function dirFromTo(a, b) {
    return dirBetween(a.x || a[0] || 0, a.y || a[1] || 0, b.x || b[0] || 0, b.y || b[1] || 0);
  }

  utils.dirFromTo = dirFromTo;


  function extend(obj, name, fn) {
    const base = obj[name] || NOOP;
    const newFn = fn.bind(obj, base.bind(obj));
    newFn.fn = fn;
    newFn.base = base;
    obj[name] = newFn;
  }

  utils.extend = extend;

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

  utils.rebase = rebase;

  function cloneObject(obj) {
    const other = Object.create(obj.__proto__);
    utils.assignObject(other, obj);
    return other;
  }

  utils.cloneObject = cloneObject;

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

  utils.copyObject = copyObject;

  function assignObject(dest, src) {
    Object.keys(src).forEach( (key) => {
      assignField(dest, src, key);
    });
  }

  utils.assignObject = assignObject;

  function setDefault(obj, field, val) {
    if (obj[field] === undefined) {
      obj[field] = val;
    }
  }

  utils.setDefault = setDefault;

  function setDefaults(obj, def) {
    Object.keys(def).forEach( (key) => {
      const current = obj[key];
      if (current === undefined) {
        obj[key] = def[key];
      }
    });
  }

  utils.setDefaults = setDefaults;

  function ERROR(message) {
    throw new Error(message);
  }

  utils.ERROR = ERROR;

  function WARN(...args) {
    console.warn(...args);
  }

  utils.WARN = WARN;

  function getOpt(obj, member, _default) {
    const v = obj[member];
    if (v === undefined) return _default;
    return v;
  }

  utils.getOpt = getOpt;


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

  utils.first = first;

  function arraysIntersect(a, b) {
    return a.some( (av) => b.includes(av) );
  }

  utils.arraysIntersect = arraysIntersect;


  function sequence(listLength) {
    const list = [];
    let i;
    for (i=0; i<listLength; i++) {
        list[i] = i;
    }
    return list;
  }

  utils.sequence = sequence;

  var flag = {};
  var flags = {};

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

  function makeFlag(obj, ...args) {
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
    constructor(name) {
    }
    toString(v) {
      return flagToText(this, v);
    }
    toFlag(...args) {
      return makeFlag(this, ...args);
    }
    install(obj) {
      Object.getOwnPropertyNames(this).forEach( (name) => {
        obj[name] = this[name];
      });
    }
  }

  types.Flag = Flag;

  function installFlag(flagName, values) {
    const flag = new Flag(flagName);
    Object.entries(values).forEach( ([key, value]) => {
      if (Array.isArray(value)) {
        value = value.reduce( (out, name) => {
          return out | flag[name];
        }, 0);
      }
      flag[key] = def[key] = value;
    });

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
        this[name] = index + offset;
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
  			debug.log('Lottery Draw - no frequencies', frequencies, frequencies.length);
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
      debug.log('Lottery Draw failed.', frequencies, frequencies.length);
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
      return max ? (v % max) : v;
    }

    value() {
      return (this.number() / (RNG_M - 1));
    }

    range(lo, hi) {
    	const diff = (hi - lo) + 1;
    	return lo + (this.number() % diff);
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

    // TODO - should this be : chance(percent)
    percent(percent) {
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

    if (typeof config == 'function') utils.ERROR('Custom range functions not supported - extend Range');

    if (config === undefined || config === null) return new Range(0, 0, 0, rng);
    if (typeof config == 'number') return new Range(config, config, 1, rng);

    if (config === true || config === false) utils.ERROR('Invalid random config: ' + config);

    if (Array.isArray(config)) {
  		return new Range(config[0], config[1], config[2], rng);
  	}
    if (config.lo !== undefined) {
      return new Range(config.lo, config.hi, config.clumps, rng);
    }
    if (typeof config !== 'string') {
      utils.ERROR('Calculations must be strings.  Received: ' + JSON.stringify(config));
    }
    if (config.length == 0) return new Range(0);

  	const RE = /^(?:([+-]?\d*)[Dd](\d+)([+-]?\d*)|([+-]?\d+)-(\d+):?(\d+)?|([+-]?\d+\.?\d*))/g;
    let results;
    while ((results = RE.exec(config)) !== null) {
      // GW.debug.log(results);
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
    return clamp(Math.round(2.551 * (v + cosmetic.value() * vr) ), 0, 255);
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
    return a.every( (v, i) => v == b[i] ) && a.dances == b.dances;
  }

  color.equals = equals;

  function clampColor(theColor) {
    theColor.red		= clamp(theColor.red, 0, 100);
    theColor.green	= clamp(theColor.green, 0, 100);
    theColor.blue		= clamp(theColor.blue, 0, 100);
  }

  color.clamp = clampColor;


  function bakeColor(/* color */theColor) {
    let rand;
    rand = cosmetic.range(0, theColor.rand);
    theColor.red   += Math.round(GW.random.cosmetic.range(0, theColor.redRand) + rand);
    theColor.green += Math.round(GW.random.cosmetic.range(0, theColor.greenRand) + rand);
    theColor.blue  += Math.round(GW.random.cosmetic.range(0, theColor.blueRand) + rand);
    theColor.redRand = theColor.greenRand = theColor.blueRand = theColor.rand = 0;
  }

  color.bake = bakeColor;


  function lightenColor(destColor, percent) {
    destColor.red =    Math.round(destColor.red + (100 - destColor.red) * percent / 100);
    destColor.green =  Math.round(destColor.green + (100 - destColor.green) * percent / 100);
    destColor.blue =   Math.round(destColor.blue + (100 - destColor.blue) * percent / 100);

    // leave randoms the same
    return destColor;
  }

  color.lighten = lightenColor;

  function darkenColor(destColor, percent) {
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

    f.red			= clamp(f.red, 0, 100);
    f.green		= clamp(f.green, 0, 100);
    f.blue		= clamp(f.blue, 0, 100);
    b.red			= clamp(b.red, 0, 100);
    b.green		= clamp(b.green, 0, 100);
    b.blue		= clamp(b.blue, 0, 100);

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

  const TEMP_BG = new Color();

  var sprites = {};
  var sprite = {};

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
  		this.fg = fg !== null ? makeColor(fg || 'white') : null;
  		this.bg = bg !== null ? makeColor(bg || 'black') : null;
  		this.opacity = opacity || 100;
  		this.needsUpdate = true;
  	}

  	copy(other) {
  		this.ch = other.ch;
  		this.fg.copy(other.fg);
  		this.bg.copy(other.bg);
  		this.opacity = other.opacity || 0;
  		this.needsUpdate = other.needsUpdate || false;
  	}

  	clear() {
  		this.ch = ' ';
  		this.fg.clear();
  		this.bg.clear();
  		this.opacity = 0;
  		this.needsUpdate = false;
  	}

  	erase() {
  		this.clear();
  		this.opacity = 100;
  		this.needsUpdate = true;
  	}

  	plotChar(ch, fg, bg) {
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

      // ch and fore color:
      if (sprite.ch && sprite.ch != ' ') { // Blank cells in the overbuf take the ch from the screen.
        this.ch = sprite.ch;
        this.fg.copy(sprite.fg);
      }

  		if (sprite.bg) {
  			applyMix(this.bg, sprite.bg, sprite.opacity);
  		}

      if (this.ch != ' ' && equals(this.fg, this.bg))
      {
        this.ch = ' ';
      }
  		this.needsUpdate = true;
  		return true;
  	}

  }

  types.Sprite = Sprite;

  function makeSprite(ch, fg, bg, opacity) {
    return new Sprite(ch, fg, bg, opacity);
  }

  make.sprite = makeSprite;

  function installSprite(name, ch, fg, bg, opacity) {
  	const sprite = make.sprite(ch, fg, bg, opacity);
  	sprites[name] = sprite;
  	return sprite;
  }

  sprite.installSprite = installSprite;

  const GRID_CACHE = [];

  const DIRS = def.dirs;
  const CDIRS = def.clockDirs;


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
  	  let bestDistance = grid.width + grid.height;

  		this.forEach( (v, i, j) => {
  			if (fn(v, i, j)) {
  				const dist = distanceBetween(x, y, i, j);
  				if (dist < bestDistance) {
  					bestLoc[0] = i;
  					bestLoc[1] = j;
  					bestDistance = dist;
  				}
  				else if (dist == bestDistance && random.percent(50)) {
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

  		testFn = testFn || IDENTITY;

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

  grid$1.alloc = allocGrid;


  function freeGrid(grid) {
  	if (grid) {
  		GRID_CACHE.push(grid);
  	}
  }

  grid$1.free = freeGrid;


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

  grid$1.dump = dumpGrid;


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

  grid$1.dumpRect = gridDumpRect;


  function dumpGridAround(grid, x, y, radius) {
  	gridDumpRect(grid, x - radius, y - radius, 2 * radius, 2 * radius);
  }

  grid$1.dumpAround = dumpGridAround;





  function findAndReplace(grid, findValueMin, findValueMax, fillValue)
  {
  	grid.update( (v, x, y) => {
  		if (v >= findValidMin && v <= findValueMax) {
  			return fillValue;
  		}
  		return v;
  	});
  }

  grid$1.findAndReplace = findAndReplace;


  // Flood-fills the grid from (x, y) along cells that are within the eligible range.
  // Returns the total count of filled cells.
  function floodFillRange(grid, x, y, eligibleValueMin, eligibleValueMax, fillValue) {
    let dir;
  	let newX, newY, fillCount = 1;

    if (fillValue >= eligibleValueMin && fillValue <= eligibleValueMax) {
  		console.error('Invalid grid flood fill');
  		return 0;
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

  grid$1.floodFillRange = floodFillRange;


  function invert(grid) {
  	grid.update((v, i, j) => !v );
  }

  grid$1.invert = invert;


  function intersection(onto, a, b) {
  	b = b || onto;
  	onto.update((v, i, j) => a[i][j] && b[i][j] );
  }

  grid$1.intersection = intersection;


  function unite(onto, a, b) {
  	b = b || onto;
  	onto.update((v, i, j) => b[i][j] || a[i][j] );
  }

  grid$1.unite = unite;




  function closestLocationWithValue(grid, x, y, value)
  {
  	return grid.closestMatchingXY(x, y, (v) => v == value);
  }

  grid$1.closestLocationWithValue = closestLocationWithValue;


  // Takes a grid as a mask of valid locations, chooses one randomly and returns it as (x, y).
  // If there are no valid locations, returns (-1, -1).
  function randomLocationWithValue(grid, validValue) {
  	return grid.randomMatchingXY( (v, i, j) => v == validValue );
  }

  grid$1.randomLocationWithValue = randomLocationWithValue;


  function getQualifyingLocNear(grid, x, y, deterministic)
  {
  	return grid.matchingXYNear(x, y, (v, i, j) => !!v);
  }

  grid$1.getQualifyingLocNear = getQualifyingLocNear;

  function leastPositiveValue(grid) {
  	let least = Number.MAX_SAFE_INTEGER;
  	grid.forEach((v) => {
  		if (v > 0 && (v < least)) {
  				least = v;
  		}
  	});
  	return least;
  }

  grid$1.leastPositiveValue = leastPositiveValue;

  // Finds the lowest positive number in a grid, chooses one location with that number randomly and returns it as (x, y).
  // If there are no valid locations, returns (-1, -1).
  function randomLeastPositiveLocation(grid, deterministic) {
    const targetValue = grid$1.leastPositiveValue(grid);
  	return grid.randomMatchingXY( (v) => v == targetValue );
  }

  grid$1.randomLeastPositiveLocation = randomLeastPositiveLocation;

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

  grid$1.floodFill = floodFill;



  function offsetZip(destGrid, srcGrid, srcToDestX, srcToDestY, value) {
  	const fn = (typeof value === 'function') ? value : ((d, s, i, j) => destGrid[i][j] = value || s);
  	srcGrid.forEach( (c, i, j) => {
  		const destX = i + srcToDestX;
  		const destY = j + srcToDestY;
  		if (!destGrid.hasXY(destX, destY)) return;
  		if (!c) return;
  		fn(destGrid[destX][destY], c, i, j);
  	});
  }

  grid$1.offsetZip = offsetZip;



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

  grid$1.directionOfDoorSite = directionOfDoorSite;


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
  				grid[i + left][j + top] = (random.percent(percentSeeded) ? 1 : 0);
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

  grid$1.fillBlob = fillBlob;

  const HANGING_LETTERS = ['y', 'p', 'g', 'j', 'q', '[', ']', '(', ')', '{', '}'];
  const DEFAULT_FONT = 'monospace';



  class Buffer extends Grid {
    constructor(w, h) {
      super(w, h, () => new Sprite() );
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

    erase() {
      this.forEach( (c) => c.erase() );
      this.needsUpdate = true;
    }

    eraseRect(x, y, w, h) {
      this.forRect(x, y, w, h, (c) => c.erase() );
      this.needsUpdate = true;
    }

    plot(x, y, sprite) {
      if (!this.hasXY(x, y)) {
        debug$1.log('invalid coordinates: ' + x + ', ' + y);
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
        debug$1.log('invalid coordinates: ' + x + ', ' + y);
        return;
      }

      const destCell = this[x][y];
      destCell.plotChar(ch, fg, bg);
      this.needsUpdate = true;
    }

    plotText(x, y, text, fg, bg) {
      let len = text.length;
      for(let i = 0; i < len; ++i) {
        this.plotChar(i + x, y, text[i], fg, bg);
      }
    }

  }

  types.Buffer = Buffer;



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
    console.log('canvas resize', rect);

    this.buffer.forEach((c) => { c.needsUpdate = true; });

  }



  class Canvas {
    constructor(w, h, div, opts={}) {
      this.buffer = new Buffer(w, h);
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
            if (HANGING_LETTERS.includes(cell.ch) && j < buffer.height - 1) {
              this.buffer[i][j + 1].needsUpdate = true;	// redraw the row below any hanging letters that changed
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

      const backCss = css(cell.bg);
      ctx.fillStyle = backCss;

      ctx.fillRect(
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      );

      if (cell.ch && cell.ch !== ' ') {
        const foreCss = css(cell.fg);
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

    plot(x, y, sprite) {
      this.buffer.plot(x, y, sprite);
    }

    plotChar(x, y, ch, fg, bg) {
      this.buffer.plotChar(x, y, ch, fg, bg);
    }

    plotText(x, y, text, fg, bg) {
      this.buffer.plotText(x, y, text, fg, bg);
    }

    allocBuffer() {
      let buf;
      if (this.dead.length) {
        buf = this.dead.pop();
      }
      else {
        buf = new Buffer(this.buffer.width, this.buffer.height);
      }

      buf.copy(this.buffer);
      return buf;
    }

    freeBuffer(...bufs) {
      bufs.forEach( (buf) => this.dead.push(buf) );
    }


    // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
    // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
    overlay( overBuf,  previousBuf) {
      if (previousBuf) {
        previousBuf.copy(this.buffer);
      }
      overlayRect(overBuf, 0, 0, this.buffer.width, this.buffer.height);
    }

    // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
    // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
    overlayRect(overBuf, x, y, w, h) {
      let i, j;

      for (i=x; i<x + w; i++) {
        for (j=y; j<y + h; j++) {
          this.buffer.plot(i, j, overBuf[i][j]);
        }
      }

    }

  }

  types.Canvas = Canvas;

  const KEYMAPS = [];
  const EVENTS = [];
  const DEAD_EVENTS = [];
  const TIMERS = [];

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


  function addKeymap(keymap) {
  	KEYMAPS.push(keymap);
  }

  io.addKeymap = addKeymap;

  function busy() {
  	return EVENTS.length > 0;
  }

  io.busy = busy;

  function clearEvents() {
  	while (EVENTS.length) {
  		const ev = EVENTS.shift();
  		DEAD_EVENTS.push(ev);
  	}
  }

  io.clearEvents = clearEvents;


  function pushEvent(ev) {
    if (EVENTS.length && ev.type === MOUSEMOVE) {
    	last = EVENTS[EVENTS.length - 1];
      if (last.type === MOUSEMOVE) {
  			last.x = ev.x;
  		  last.y = ev.y;
        return;
      }
    }

  	if (CURRENT_HANDLER) {
    	CURRENT_HANDLER(ev);
    }
    else {
    	EVENTS.push(ev);
    }
  }

  io.pushEvent = pushEvent;


  function dispatchEvent(ev) {
  	for(let i = KEYMAPS.length - 1; i >= 0; --i) {
  		const km = KEYMAPS[i];
  		let command;
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
  				return command(ev);
  			}
  			else if (commands[command]) {
  				return commands[command](ev);
  			}
  		}

  		if (km.next === false) return false;
  	}
  	return false;
  }

  io.dispatchEvent = dispatchEvent;

  function recycleEvent(ev) {
  	DEAD_EVENTS.push(ev);
  }

  io.recycleEvent = recycleEvent;


  // TIMERS

  function setTimeout(delay, fn) {
  	fn = fn || NOOP;
  	const h = { delay, fn, resolve: null, promise: null };

  	const p = new Promise( (resolve) => {
  		h.resolve = resolve;
  	});

  	h.promise = p;

  	for(let i = 0; i < TIMERS.length; ++i) {
  		if (!TIMERS[i]) {
  			TIMERS[i] = h;
  			return p;
  		}
  	}

  	TIMERS.push(h);
  	return p;
  }

  io.setTimeout = setTimeout;

  function clearTimeout(promise) {
  	for(let i = 0; i < TIMERS.length; ++i) {
  		const timer = TIMERS[i];
  		if (timer && timer.promise === promise) {
  			TIMERS[i] = null;
  			timer.resolve(false);
  			return true;
  		}
  	}
  	return false;
  }

  io.clearTimeout = clearTimeout;

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

  function onkeydown(e) {
  	if (CONTROL_CODES.includes(e.code)) return;

  	if (e.code === 'Escape') {
  		io.clearEvents();	// clear all current events, then push on the escape
    }

  	const ev = makeKeyEvent(e);
  	io.pushEvent(ev);
  }

  io.onkeydown = onkeydown;


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

  function onmousemove(e) {
  	const x = canvas.toX(e.clientX);
  	const y = canvas.toY(e.clientY);
  	const ev = makeMouseEvent(e, x, y);
  	io.pushEvent(ev);
  }

  io.onmousemove = onmousemove;

  function onmousedown(e) {
  	const x = canvas.toX(e.clientX);
  	const y = canvas.toY(e.clientY);
  	const ev = makeMouseEvent(e, x, y);
  	io.pushEvent(ev);
  }

  io.onmousedown = onmousedown;

  // IO


  function nextEvent(ms, match) {
  	match = match || TRUE;
  	let elapsed = 0;

  	if (EVENTS.length) {
    	const e = EVENTS.shift();
      e.dt = 0;
  		if (e.type === MOUSEMOVE) {
  			io.mouse.x = e.x;
  			io.mouse.y = e.y;
  		}

      return e;
    }

    let done;

  	if (!ms) return null;

    CURRENT_HANDLER = ((e) => {
  		if (e.type === MOUSEMOVE) {
  			io.mouse.x = e.x;
  			io.mouse.y = e.y;
  		}

    	if (e.type === TICK) {
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

  async function nextKeypress(ms, match) {
  	match = match || TRUE;
  	function matchingKey(e) {
    	if (e.type !== KEYPRESS) return false;
      return match(e);
    }
    return nextEvent(ms, matchingKey);
  }

  io.nextKeypress = nextKeypress;

  async function nextKeyOrClick(ms) {
  	function match(e) {
    	if (e.type !== KEYPRESS && e.type !== CLICK) return false;
      return true;
    }
    return nextEvent(ms, match);
  }

  io.nextKeyOrClick = nextKeyOrClick;

  async function pause(ms) {
  	const e = await nextKeyOrClick(ms);
    return (e.type !== TICK);
  }

  io.pause = pause;

  function waitForAck() {
  	return io.pause(5 * 60 * 1000);	// 5 min
  }

  io.waitForAck = waitForAck;

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
  		links: makeArray(w * h, (i) => makeCostLink(i) ),
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

  path.dijkstraScan = dijkstraScan;

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

  path.calculateDistances = calculateDistances;

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

  const DIRS$2 = def.dirs;


  const TILE = 1;


  function installDigger(id, fn, config) {
    config = fn(config || {});	// call to have function bind itself to the config
    config.fn = fn;
    config.id = id;
    diggers[id] = config;
    return config;
  }

  digger.install = installDigger;


  function checkDiggerConfig(config, opts) {
    config = config || {};
    opts = opts || {};

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


  function digCavern(config, grid) {
    config = digger.checkConfig(config, { width: [3,12], height: [4,8] });
    if (!grid) return config;

    let destX, destY;
    let blobGrid;

    blobGrid = allocGrid(grid.width, grid.height, 0);

    const minWidth  = config.width[0];
    const maxWidth  = config.width[1];
    const minHeight = config.height[0];
    const maxHeight = config.height[1];

    grid.fill(0);
    const bounds = fillBlob(blobGrid, 5, minWidth, minHeight, maxWidth, maxHeight, 55, "ffffffttt", "ffffttttt");

    // Position the new cave in the middle of the grid...
    destX = Math.floor((grid.width - bounds.width) / 2);
    destY = Math.floor((grid.height - bounds.height) / 2);

    // ...and copy it to the master grid.
    offsetZip(grid, blobGrid, destX - bounds.x, destY - bounds.y, config.tile);
    freeGrid(blobGrid);
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
    debug$1.log('Choose room: ', id);
    digger.fn(digger, grid);
  }

  digger.choiceRoom = digChoiceRoom;


  // This is a special room that appears at the entrance to the dungeon on depth 1.
  function digEntranceRoom(config, grid) {
    config = digger.checkConfig(config, { width: [8,20], height: [10,5] });
    if (!grid) return config;

    const roomWidth = config.width[0];
    const roomHeight = config.height[0];
    const roomWidth2 = config.width[1];
    const roomHeight2 = config.height[1];

    // ALWAYS start at bottom+center of map
    const roomX = Math.floor(grid.width/2 - roomWidth/2 - 1);
    const roomY = grid.height - roomHeight - 2;
    const roomX2 = Math.floor(grid.width/2 - roomWidth2/2 - 1);
    const roomY2 = grid.height - roomHeight2 - 2;

    grid.fill(0);
    grid.fillRect(roomX, roomY, roomWidth, roomHeight, config.tile || TILE);
    grid.fillRect(roomX2, roomY2, roomWidth2, roomHeight2, config.tile || TILE);
  }


  digger.entranceRoom = digEntranceRoom;


  function digCrossRoom(config, grid) {
    config = digger.checkConfig(config, { width: [3,12], height: [3,7], width2: [4,20], height2: [2,5] });
    if (!grid) return config;

    const roomWidth = random.range(config.width[0], config.width[1]);
    const roomWidth2 = random.range(config.width2[0], config.width2[1]);
    const roomHeight = random.range(config.height[0], config.height[1]);
    const roomHeight2 = random.range(config.height2[0], config.height2[1]);

    const roomX = random.range(Math.max(0, Math.floor(grid.width/2) - (roomWidth - 1)), Math.min(grid.width, Math.floor(grid.width/2)));
    const roomX2 = (roomX + Math.floor(roomWidth / 2) + random.range(0, 2) + random.range(0, 2) - 3) - Math.floor(roomWidth2 / 2);
    const roomY = Math.floor(grid.height/2 - roomHeight);
    const roomY2 = Math.floor(grid.height/2 - roomHeight2 - (random.range(0, 2) + random.range(0, 1)));

    grid.fill(0);

    grid.fillRect(roomX - 5, roomY + 5, roomWidth, roomHeight, config.tile || TILE);
    grid.fillRect(roomX2 - 5, roomY2 + 5, roomWidth2, roomHeight2, config.tile || TILE);
  }

  digger.crossRoom = digCrossRoom;


  function digSymmetricalCrossRoom(config, grid) {
    config = digger.checkConfig(config, { width: [4,8], height: [4,5], width2: [3,4], height2: [3,3] });
    if (!grid) return config;

    let majorWidth = random.range(config.width[0], config.width[1]);
    let majorHeight = random.range(config.height[0], config.height[1]);

    let minorWidth = random.range(config.width2[0], config.width2[1]);
    if (majorHeight % 2 == 0) {
        minorWidth -= 1;
    }
    let minorHeight = random.range(config.height2[0], config.height2[1]);	// originally 2,3?
    if (majorWidth % 2 == 0) {
        minorHeight -= 1;
    }

    grid.fill(0);
    grid.fillRect(Math.floor((grid.width - majorWidth)/2), Math.floor((grid.height - minorHeight)/2), majorWidth, minorHeight, config.tile || TILE);
    grid.fillRect(Math.floor((grid.width - minorWidth)/2), Math.floor((grid.height - majorHeight)/2), minorWidth, majorHeight, config.tile || TILE);
  }

  digger.symmetricalCrossRoom = digSymmetricalCrossRoom;


  function digRectangularRoom(config, grid) {
    config = digger.checkConfig(config, { width: [3,6], height: [2,4] });
    if (!grid) return config;

    const width = random.range(config.width[0], config.width[1]);
    const height = random.range(config.height[0], config.height[1]);

    grid.fill(0);
    grid.fillRect(Math.floor((grid.width - width) / 2), Math.floor((grid.height - height) / 2), width, height, config.tile || TILE);
  }

  digger.rectangularRoom = digRectangularRoom;


  function digCircularRoom(config, grid) {
    config = digger.checkConfig(config, { radius: [2,4] });
    if (!grid) return config;

    const radius = random.range(config.radius[0], config.radius[1]);

    grid.fill(0);
    grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, config.tile || TILE);

  }

  digger.circularRoom = digCircularRoom;


  function digBrogueCircularRoom(config, grid) {
    config = digger.checkConfig(config, { radius: [2,4], radius2: [4,10], altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
    if (!grid) return config;

    const params = random.percent(config.altChance || 5) ? config.radius2 : config.radius;
    const radius = random.range(params[0], params[1]);

    grid.fill(0);
    grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, config.tile || TILE);

    if (radius > config.ringMinWidth + config.holeMinSize
        && random.percent(config.holeChance))
    {
        grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), random.range(config.holeMinSize, radius - config.holeMinSize), 0);
    }
  }

  digger.brogueCircularRoom = digBrogueCircularRoom;


  function digChunkyRoom(config, grid) {
    config = digger.checkConfig(config, { count: [2,8] });
    if (!grid) return config;

    let i, x, y;
    let minX, maxX, minY, maxY;
    let chunkCount = random.range(config.count[0], config.count[1]);

    grid.fill(0);
    grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), 2, 1);
    minX = Math.floor(grid.width/2) - 3;
    maxX = Math.floor(grid.width/2) + 3;
    minY = Math.floor(grid.height/2) - 3;
    maxY = Math.floor(grid.height/2) + 3;

    for (i=0; i<chunkCount;) {
        x = random.range(minX, maxX);
        y = random.range(minY, maxY);
        if (grid[x][y]) {
  //            colorOverDungeon(/* Color. */darkGray);
  //            hiliteGrid(grid, /* Color. */white, 100);

            grid.fillCircle(x, y, 2, config.tile || TILE);
            i++;
            minX = Math.max(1, Math.min(x - 3, minX));
            maxX = Math.min(grid.width - 2, Math.max(x + 3, maxX));
            minY = Math.max(1, Math.min(y - 3, minY));
            maxY = Math.min(grid.height - 2, Math.max(y + 3, maxY));

  //            hiliteGrid(grid, /* Color. */green, 50);
  //            temporaryMessage("Added a chunk:", true);
        }
    }
  }

  digger.chunkyRoom = digChunkyRoom;



  function chooseRandomDoorSites(sourceGrid) {
    let i, j, k, newX, newY;
    let dir;
    let doorSiteFailed;

    const grid = allocGrid(sourceGrid.width, sourceGrid.height);
    grid.copy(sourceGrid);

    for (i=0; i<grid.width; i++) {
        for (j=0; j<grid.height; j++) {
            if (!grid[i][j]) {
                dir = directionOfDoorSite(grid, i, j);
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

    freeGrid(grid);
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

      const horizontalLength = first('horizontalHallLength', opts, [9,15]);
      const verticalLength = first('verticalHallLength', opts, [2,9]);

      // Pick a direction.
      dir = opts.dir;
      if (dir === undefined) {
        const dirs = sequence(4);
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
      x = clamp(x - DIRS$2[dir][0], 0, grid.width - 1);
      y = clamp(y - DIRS$2[dir][1], 0, grid.height - 1); // Now (x, y) points at the last interior cell of the hallway.
      allowObliqueHallwayExit = random.percent(15);
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

  var tile = {};
  var tiles = [];


  const Flags = installFlag('tile', {
    T_OBSTRUCTS_PASSABILITY	: Fl(0),		// cannot be walked through
    T_OBSTRUCTS_VISION			: Fl(1),		// blocks line of sight
    T_OBSTRUCTS_ITEMS				: Fl(2),		// items can't be on this tile
    T_OBSTRUCTS_SURFACE		  : Fl(3),		// grass, blood, etc. cannot exist on this tile
    T_OBSTRUCTS_GAS					: Fl(4),		// blocks the permeation of gas
    T_OBSTRUCTS_DIAGONAL_MOVEMENT : Fl(5),    // can't step diagonally around this tile

    T_AUTO_DESCENT					: Fl(6),		// automatically drops creatures down a depth level and does some damage (2d6)
    T_LAVA			            : Fl(7),		// kills any non-levitating non-fire-immune creature instantly
    T_DEEP_WATER					  : Fl(8),		// steals items 50% of the time and moves them around randomly

    T_SPONTANEOUSLY_IGNITES	: Fl(9),		// monsters avoid unless chasing player or immune to fire
    T_IS_FLAMMABLE					: Fl(10),		// terrain can catch fire
    T_IS_FIRE								: Fl(11),		// terrain is a type of fire; ignites neighboring flammable cells
    T_ENTANGLES							: Fl(12),		// entangles players and monsters like a spiderweb

    T_CAUSES_POISON					: Fl(13),		// any non-levitating creature gets 10 poison
    T_CAUSES_DAMAGE					: Fl(14),		// anything on the tile takes max(1-2, 10%) damage per turn
    T_CAUSES_NAUSEA					: Fl(15),		// any creature on the tile becomes nauseous
    T_CAUSES_PARALYSIS			: Fl(16),		// anything caught on this tile is paralyzed
    T_CAUSES_CONFUSION			: Fl(17),		// causes creatures on this tile to become confused
    T_CAUSES_HEALING   	    : Fl(18),   // heals 20% max HP per turn for any player or non-inanimate monsters
    T_IS_TRAP								: Fl(19),		// spews gas of type specified in fireType when stepped on
    T_CAUSES_EXPLOSIVE_DAMAGE		: Fl(20),		// is an explosion; deals higher of 15-20 or 50% damage instantly, but not again for five turns
    T_SACRED                : Fl(21),   // monsters that aren't allies of the player will avoid stepping here

    T_UP_STAIRS							: Fl(22),
    T_DOWN_STAIRS						: Fl(23),
    T_PORTAL                : Fl(24),
    T_IS_DOOR								: Fl(25),

    T_HAS_STAIRS						: ['T_UP_STAIRS', 'T_DOWN_STAIRS'],
    T_OBSTRUCTS_SCENT				: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES', 'T_HAS_STAIRS'],
    T_PATHING_BLOCKER				: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_IS_FIRE', 'T_SPONTANEOUSLY_IGNITES', 'T_ENTANGLES'],
    T_DIVIDES_LEVEL       	: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER'],
    T_LAKE_PATHING_BLOCKER	: ['T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
    T_WAYPOINT_BLOCKER			: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
    T_MOVES_ITEMS						: ['T_DEEP_WATER', 'T_LAVA'],
    T_CAN_BE_BRIDGED				: ['T_AUTO_DESCENT'],
    T_OBSTRUCTS_EVERYTHING	: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_OBSTRUCTS_ITEMS', 'T_OBSTRUCTS_GAS', 'T_OBSTRUCTS_SURFACE',   'T_OBSTRUCTS_DIAGONAL_MOVEMENT'],
    T_HARMFUL_TERRAIN				: ['T_CAUSES_POISON', 'T_IS_FIRE', 'T_CAUSES_DAMAGE', 'T_CAUSES_PARALYSIS', 'T_CAUSES_CONFUSION', 'T_CAUSES_EXPLOSIVE_DAMAGE'],
    T_RESPIRATION_IMMUNITIES  : ['T_CAUSES_DAMAGE', 'T_CAUSES_CONFUSION', 'T_CAUSES_PARALYSIS', 'T_CAUSES_NAUSEA'],
    T_IS_LIQUID               : ['T_LAVA', 'T_AUTO_DESCENT', 'T_DEEP_WATER'],
  });

  tile.flags = Flags;

  ///////////////////////////////////////////////////////
  // TILE MECH


  const MechFlags = installFlag('tileMech', {
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
    TM_IS_CIRCUIT_BREAKER 				: Fl(10),        // prevents power from circulating in its machine
    TM_GAS_DISSIPATES							: Fl(11),		// does not just hang in the air forever
    TM_GAS_DISSIPATES_QUICKLY			: Fl(12),		// dissipates quickly
    TM_EXTINGUISHES_FIRE					: Fl(13),		// extinguishes burning terrain or creatures
    TM_VANISHES_UPON_PROMOTION		: Fl(14),		// vanishes when creating promotion dungeon feature, even if the replacement terrain priority doesn't require it
    TM_REFLECTS_BOLTS           	: Fl(15),       // magic bolts reflect off of its surface randomly (similar to ACTIVE_CELLS flag IMPREGNABLE)
    TM_STAND_IN_TILE            	: Fl(16),		// earthbound creatures will be said to stand "in" the tile, not on it
    TM_LIST_IN_SIDEBAR          	: Fl(17),       // terrain will be listed in the sidebar with a description of the terrain type
    TM_VISUALLY_DISTINCT        	: Fl(18),       // terrain will be color-adjusted if necessary so the character stands out from the background
    TM_BRIGHT_MEMORY            	: Fl(19),       // no blue fade when this tile is out of sight
    TM_EXPLOSIVE_PROMOTE        	: Fl(20),       // when burned, will promote to promoteType instead of burningType if surrounded by tiles with T_IS_FIRE or TM_EXPLOSIVE_PROMOTE
    TM_CONNECTS_LEVEL           	: Fl(21),       // will be treated as passable for purposes of calculating level connectedness, irrespective of other aspects of this terrain layer
    TM_INTERRUPT_EXPLORATION_WHEN_SEEN : Fl(22),    // will generate a message when discovered during exploration to interrupt exploration
    TM_INVERT_WHEN_HIGHLIGHTED  	: Fl(23),       // will flip fore and back colors when highlighted with pathing
    TM_SWAP_ENCHANTS_ACTIVATION 	: Fl(24),       // in machine, swap item enchantments when two suitable items are on this terrain, and activate the machine when that happens
    TM_PROMOTES										: 'TM_PROMOTES_WITH_KEY | TM_PROMOTES_WITHOUT_KEY | TM_PROMOTES_ON_STEP | TM_PROMOTES_ON_ITEM_REMOVE | TM_PROMOTES_ON_SACRIFICE_ENTRY | TM_PROMOTES_ON_ELECTRICITY | TM_PROMOTES_ON_PLAYER_ENTRY',
  });

  tile.mechFlags = MechFlags;

  function setFlags(tile, allFlags) {
    let flags = [];
    if (!allFlags) return;  // no flags

    if (typeof allFlags === 'string') {
      flags = allFlags.split(/[,|]/).map( (t) => t.trim() );
    }
    else if (!Array.isArray(allFlags)) {
      return WARN('Invalid tile flags: ' + allFlags);
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
        WARN('Invalid tile flag: ' + f);
      }
      else if (Flags[f]) {
        tile.flags |= Flags[f];
      }
      else if (MechFlags[f]) {
        tile.mechFlags |= MechFlags[f];
      }
      else {
        WARN('Invalid tile flag: ' + f);
      }
    });
  }


  class Tile {
    constructor(ch, fg, bg, layer, priority, allFlags, desc, flavor) {
      this.flags = 0;
      this.mechFlags = 0;
      this.layer = layer || 0;
      this.priority = priority || 50; // lower means higher priority (50 = average)
      this.sprite = makeSprite(ch, fg, bg);
      this.events = {};
      this.light = null;
      this.desc = desc || '';
      this.flavor = flavor || '';
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

  function makeTile(ch, fg, bg, priority, layer, allFlags, desc, flavor, opts={}) {
    const tile = new types.Tile(ch, fg, bg, layer, priority, allFlags, desc, flavor);
    // TODO - tile.light = opts.light || null;
    // TODO - tile.events.fire = opts.fire
    // TODO - tile.events.promote = opts.promote
    // TODO - tile.events.discover = opts.discover
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
  installTile(NOTHING,       '\u2205', 'black', 'black', 100, 0, 'T_OBSTRUCTS_PASSABILITY', "an eerie nothingness", "");
  installTile('FLOOR',       '\u00b7', [30,30,30,20], [2,2,10,0,2,2,0], 90);	// FLOOR
  installTile('DOOR',        '+', [100,40,40], [30,60,60], 50, 0, 'T_IS_DOOR');	// DOOR
  installTile('BRIDGE',      '=', [100,40,40], [60,40,0], 30);	// BRIDGE
  installTile('UP_STAIRS',   '<', [100,40,40], [100,60,20], 10);	// UP
  installTile('DOWN_STAIRS', '>', [100,40,40], [100,60,20], 10);	// DOWN
  installTile('WALL',        '#', [7,7,7,0,3,3,3],  [40,40,40,10,10,0,5], 20, 0, 'T_OBSTRUCTS_EVERYTHING');	// WALL
  installTile('LAKE',        '~', [5,8,20,10,0,4,15,1], [10,15,41,6,5,5,5,1], 40, 0, 'T_DEEP_WATER');	// LAKE

  function withName(name) {
    return tiles.find( (t) => t.name == name );
  }

  tile.withName = withName;

  const DIRS$3 = def.dirs;
  const OPP_DIRS = [def.DOWN, def.UP, def.RIGHT, def.LEFT];

  var dungeon = {};


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

    FLOOR       = withName('FLOOR')       ? withName('FLOOR').id        : FLOOR;
    DOOR        = withName('DOOR')        ? withName('DOOR').id         : DOOR;
    BRIDGE      = withName('BRIDGE')      ? withName('BRIDGE').id       : BRIDGE;
    UP_STAIRS   = withName('UP_STAIRS')   ? withName('UP_STAIRS').id    : UP_STAIRS;
    DOWN_STAIRS = withName('DOWN_STAIRS') ? withName('DOWN_STAIRS').id  : DOWN_STAIRS;
    WALL        = withName('WALL')        ? withName('WALL').id         : WALL;
    LAKE        = withName('LAKE')        ? withName('LAKE').id         : LAKE;

    LOCS = sequence(map.width * map.height);
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
    const hallChance = first('hallChance', opts, SITE.config, 0);
    const diggerId = opts.digger || opts.id || 'SMALL'; // TODO - get random id

    const digger = diggers[diggerId];
    if (!digger) {
      throw new Error('Failed to find digger: ' + diggerId);
    }

    const config = Object.assign({}, digger, opts);
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

    const grid = allocGrid(SITE.width, SITE.height);

    let result = false;
    let tries = opts.tries || 10;
    while(--tries >= 0 && !result) {
      grid.fill(NOTHING$1);

      digger.fn(config, grid);
      const doors = chooseRandomDoorSites(grid);
      if (random.percent(hallChance)) {
        attachHallway(grid, doors, SITE.config);
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

    freeGrid(grid);
    return result;
  }

  dungeon.digRoom = digRoom;


  function isValidStairLoc(c, x, y) {
    let count = 0;
    if (!c.isEmpty()) return false;

    for(let i = 0; i < 4; ++i) {
      const dir = def.dirs[i];
      if (!SITE.hasXY(x + dir[0], y + dir[1])) return false;
      const cell = SITE.cell(x + dir[0], y + dir[1]);
      if (cell.hasTile(FLOOR)) {
        count += 1;
        const va = SITE.cell(x - dir[0] + dir[1], y - dir[1] + dir[0]);
        if (!va.isEmpty()) return false;
        const vb = SITE.cell(x - dir[0] - dir[1], y - dir[1] - dir[0]);
        if (!vb.isEmpty()) return false;
      }
      else if (!cell.isEmpty()) {
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
                              || !SITE.cell(i, j).isEmpty())
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

        if (!SITE.cell(x, y).isEmpty()) continue;
        const dir = directionOfDoorSite(SITE.cells, x, y, (c) => (c.hasTile(FLOOR) && !c.isLiquid()) );
        if (dir != def.NO_DIRECTION) {
          const oppDir = OPP_DIRS[dir];

          const offsetX = x - doorSites[oppDir][0];
          const offsetY = y - doorSites[oppDir][1];

          if (doorSites[oppDir][0] != -1
              && roomAttachesAt(roomGrid, offsetX, offsetY))
          {
            // GW.debug.log("attachRoom: ", x, y, oppDir);

            // Room fits here.
            offsetZip(SITE.cells, roomGrid, offsetX, offsetY, (d, s, i, j) => d.setTile(s) );
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

        const dir = directionOfDoorSite(roomGrid, x, y);
        if (dir != def.NO_DIRECTION) {
          const d = DIRS$3[dir];
          if (roomAttachesAt(roomGrid, xy[0] - x, xy[1] - y)) {
            offsetZip(SITE.cells, roomGrid, xy[0] - x, xy[1] - y, (d, s, i, j) => d.setTile(s) );
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

    const dirs = sequence(4);
    random.shuffle(dirs);

    for(let dir of dirs) {
      const oppDir = OPP_DIRS[dir];

      if (doorSites[oppDir][0] != -1
          && roomAttachesAt(roomGrid, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
      {
        // GW.debug.log("attachRoom: ", x, y, oppDir);

        // Room fits here.
        const offX = x - doorSites[oppDir][0];
        const offY = y - doorSites[oppDir][1];
        offsetZip(SITE.cells, roomGrid, offX, offY, (d, s, i, j) => d.setTile(s) );
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

    const doorIndexes = sequence(siteDoors.length);
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

    const lakeGrid = allocGrid(SITE.width, SITE.height, 0);

    for (; lakeMaxHeight >= lakeMinSize && lakeMaxWidth >= lakeMinSize && count < maxCount; lakeMaxHeight--, lakeMaxWidth -= 2) { // lake generations

      lakeGrid.fill(NOTHING$1);
      const bounds = fillBlob(lakeGrid, 5, 4, 4, lakeMaxWidth, lakeMaxHeight, 55, "ffffftttt", "ffffttttt");

      for (k=0; k < tries && count < maxCount; k++) { // placement attempts
          // propose a position for the top-left of the lakeGrid in the dungeon
          x = random.range(1 - bounds.x, lakeGrid.width - bounds.width - bounds.x - 2);
          y = random.range(1 - bounds.y, lakeGrid.height - bounds.height - bounds.y - 2);

        if (canDisrupt || !lakeDisruptsPassability(lakeGrid, -x, -y)) { // level with lake is completely connected
          console.log("Placed a lake!", x, y);

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
    freeGrid(lakeGrid);
    return count;

  }

  dungeon.digLake = digLake;


  function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {

      const walkableGrid = allocGrid(lakeGrid.width, lakeGrid.height, 0);
      let disrupts = false;
      // Get all walkable locations after lake added
      SITE.cells.forEach( (cell, i, j) => {
        const lakeX = i + dungeonToGridX;
        const lakeY = j + dungeonToGridY;
        if (cell.isEmpty()) {
          return; // do nothing
        }
        else if (cell.canBePassed()) {
          if (lakeGrid.hasXY(lakeX, lakeY) && lakeGrid[lakeX][lakeY]) return;
          walkableGrid[i][j] = 1;
        }
        else if (cell.hasTileFlag(Flags.T_HAS_STAIRS)) {
          if (lakeGrid.hasXY(lakeX, lakeY) && lakeGrid[lakeX][lakeY]) {
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

      freeGrid(walkableGrid);
      return disrupts;
  }



  // Add some loops to the otherwise simply connected network of rooms.
  function addLoops(minimumPathingDistance, maxConnectionLength) {
      let newX, newY, oppX, oppY;
      let i, j, d, x, y;

      minimumPathingDistance = minimumPathingDistance || Math.floor(Math.min(SITE.width,SITE.height)/2);
      maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

      const siteGrid = SITE.cells;
      const pathGrid = allocGrid(SITE.width, SITE.height);
      const costGrid = allocGrid(SITE.width, SITE.height);

      const dirCoords = [[1, 0], [0, 1]];

      SITE.fillBasicCostGrid(costGrid);

      for (i = 0; i < LOCS.length; i++) {
          x = Math.floor(LOCS[i] / siteGrid.height);
          y = LOCS[i] % siteGrid.height;

          const cell = siteGrid[x][y];
          if (cell.isEmpty()) {
              for (d=0; d <= 1; d++) { // Try a horizontal door, and then a vertical door.
                  newX = x + dirCoords[d][0];
                  newY = y + dirCoords[d][1];
                  oppX = x - dirCoords[d][0];
                  oppY = y - dirCoords[d][1];
                  j = maxConnectionLength;

                  // check up/left
                  if (SITE.hasXY(newX, newY) && !SITE.cell(newX, newY).isEmpty()) {
                    oppX = x;
                    oppY = y;

                    for(j = 0; j < maxConnectionLength; ++j) {
                      oppX -= dirCoords[d][0];
                      oppY -= dirCoords[d][1];

                      if (SITE.hasXY(oppX, oppY) && !SITE.cell(oppX, oppY).isEmpty()) {
                        break;
                      }
                    }
                  }
                  else if (SITE.hasXY(oppX, oppY) && !SITE.cell(oppX, oppY).isEmpty()) {
                    newX = x;
                    newY = y;

                    for(j = 0; j < maxConnectionLength; ++j) {
                      newX += dirCoords[d][0];
                      newY += dirCoords[d][1];

                      if (SITE.hasXY(newX, newY) && !SITE.cell(newX, newY).isEmpty()) {
                        break;
                      }
                    }
                  }

                  if (j < maxConnectionLength) {
                    calculateDistances(pathGrid, newX, newY, costGrid, false);
                    // pathGrid.fill(30000);
                    // pathGrid[newX][newY] = 0;
                    // dijkstraScan(pathGrid, costGrid, false);
                    if (pathGrid[oppX][oppY] > minimumPathingDistance) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                        debug$1.log('Adding Loop', newX, newY, ' => ', oppX, oppY);

                        while(oppX !== newX || oppY !== newY) {
                          if (SITE.cell(oppX, oppY).isEmpty()) {
                            SITE.setTile(oppX, oppY, FLOOR);
                            costGrid[oppX][oppY] = 1;          // (Cost map also needs updating.)
                          }
                          oppX += dirCoords[d][0];
                          oppY += dirCoords[d][1];
                        }
                        SITE.setTile(x, y, DOOR);             // then turn the tile into a doorway.
                        break;
                    }
                  }
              }
          }
      }
      freeGrid(pathGrid);
      freeGrid(costGrid);
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
      const pathGrid = allocGrid(SITE.width, SITE.height);
      const costGrid = allocGrid(SITE.width, SITE.height);

      const dirCoords = [[1, 0], [0, 1]];

      SITE.fillBasicCostGrid(costGrid);

      for (i = 0; i < LOCS.length; i++) {
          x = Math.floor(LOCS[i] / siteGrid.height);
          y = LOCS[i] % siteGrid.height;

          if (SITE.hasXY(x, y) && (!SITE.isEmpty(x, y)) && SITE.canBePassed(x, y)) {
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

                  if ((!SITE.isEmpty(newX, newY)) && SITE.canBePassed(newX, newY) && (j < maxConnectionLength)) {
                    calculateDistances(pathGrid, newX, newY, costGrid, false);
                    // pathGrid.fill(30000);
                    // pathGrid[newX][newY] = 0;
                    // dijkstraScan(pathGrid, costGrid, false);
                    if (pathGrid[x][y] > minimumPathingDistance && pathGrid[x][y] < def.PDS_NO_PATH) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                        debug$1.log('Adding Bridge', x, y, ' => ', newX, newY);

                        while(x !== newX || y !== newY) {
                          if (isBridgeCandidate(x, y, bridgeDir)) {
                            SITE.setTile(x, y, BRIDGE, true);
                            costGrid[x][y] = 1;          // (Cost map also needs updating.)
                          }
                          else {
                            SITE.setTile(x, y, FLOOR, true);
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
      freeGrid(pathGrid);
      freeGrid(costGrid);
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
  						if (random.percent(50)) {
  							x1 = i + (1-k);
  							y1 = j;
  						} else {
  							x1 = i + k;
  							y1 = j + 1;
  						}
              diagonalCornerRemoved = true;
              SITE.setTile(x1, y1, FLOOR, true);
              debug$1.log('Removed diagonal opening', x1, y1);
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
  					SITE.setTile(i, j, FLOOR, true);
            debug$1.log('Removed orphan door', i, j);
  				} else if ((SITE.blocksPathing(i+1, j) ? 1 : 0)
  						   + (SITE.blocksPathing(i-1, j) ? 1 : 0)
  						   + (SITE.blocksPathing(i, j+1) ? 1 : 0)
  						   + (SITE.blocksPathing(i, j-1) ? 1 : 0) >= 3) {
  					// If the door has three or more pathing blocker neighbors in the four cardinal directions,
  					// then the door is orphaned and must be removed.
            SITE.setTile(i, j, FLOOR, true);
            debug$1.log('Removed blocked door', i, j);
  				}
  			}
  		}
  	}
  }

  dungeon.finishDoors = finishDoors;

  function finishWalls() {
    SITE.cells.forEach( (cell, i, j) => {
      if (cell.isEmpty()) {
        cell.setTile(WALL);
      }
    });
  }

  dungeon.finishWalls = finishWalls;


  function addStairs(upX, upY, downX, downY, minDistance) {

    upX = upX || random.number(SITE.width);
    upY = upY || random.number(SITE.height);
    downX = downX || -1;
    downY = downY || -1;
    minDistance = minDistance || Math.floor(Math.max(SITE.width,SITE.height)/2);

    const upLoc = SITE.cells.matchingXYNear(upX, upY, dungeon.isValidStairLoc);
  	if (!upLoc || upLoc[0] < 0) {
      console.log('no up location');
      return false;
    }

    let downLoc;
    if (downX < 0) {
      downLoc = SITE.cells.randomMatchingXY( (v, x, y) => {
    		if (distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
    		return dungeon.isValidStairLoc(v, x, y);
    	});
    }
    else {
      downLoc = SITE.cells.matchingXYNear(downX, downY, dungeon.isValidStairLoc);
    }

    if (!downLoc || downLoc[0] < 0) {
      console.log('No down location');
      return false;
    }

    SITE.setTile(upLoc[0], upLoc[1], UP_STAIRS);
  	SITE.locations.start = upLoc.slice();
    SITE.setTile(downLoc[0], downLoc[1], DOWN_STAIRS);
  	SITE.locations.finish = downLoc.slice();

    return true;
  }

  dungeon.addStairs = addStairs;

  var cell$1 = {};


  const Flags$1 = installFlag('cell', {
    REVEALED					: Fl(0),
    VISIBLE							: Fl(1),	// cell has sufficient light and is in field of view, ready to draw.
    WAS_VISIBLE					: Fl(2),
    IN_FOV		          : Fl(3),	// player has unobstructed line of sight whether or not there is enough light

    HAS_PLAYER					: Fl(4),
    HAS_MONSTER					: Fl(5),
    HAS_DORMANT_MONSTER	: Fl(6),	// hidden monster on the square
    HAS_ITEM						: Fl(7),
    HAS_STAIRS					: Fl(8),
    HAS_FX              : Fl(9),

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

    NEEDS_REDRAW            : Fl(26),	// needs to be redrawn (maybe in path, etc...)
    TILE_CHANGED						: Fl(27),	// one of the tiles changed

    CELL_LIT                : Fl(28),
    IS_IN_SHADOW				    : Fl(29),	// so that a player gains an automatic stealth bonus
    CELL_DARK               : Fl(30),

    PERMANENT_CELL_FLAGS : ['REVEALED', 'MAGIC_MAPPED', 'ITEM_DETECTED', 'HAS_ITEM', 'HAS_DORMANT_MONSTER',
                'HAS_STAIRS', 'STABLE_MEMORY', 'IMPREGNABLE'],

    ANY_KIND_OF_VISIBLE			: ['VISIBLE', 'CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE'],
    HAS_ACTOR               : ['HAS_PLAYER', 'HAS_MONSTER'],
  });

  cell$1.flags = Flags$1;

  ///////////////////////////////////////////////////////
  // CELL MECH

  const MechFlags$1 = installFlag('cellMech', {
    SEARCHED_FROM_HERE				: Fl(0),	// Player already auto-searched from here; can't auto search here again
    CAUGHT_FIRE_THIS_TURN			: Fl(1),	// so that fire does not spread asymmetrically
    PRESSURE_PLATE_DEPRESSED	: Fl(2),	// so that traps do not trigger repeatedly while you stand on them
    KNOWN_TO_BE_TRAP_FREE			: Fl(3),	// keep track of where the player has stepped as he knows no traps are there

    IS_IN_LOOP					: Fl(5),	// this cell is part of a terrain loop
    IS_CHOKEPOINT				: Fl(6),	// if this cell is blocked, part of the map will be rendered inaccessible
    IS_GATE_SITE				: Fl(7),	// consider placing a locked door here
    IS_IN_ROOM_MACHINE	: Fl(8),
    IS_IN_AREA_MACHINE	: Fl(9),
    IS_POWERED					: Fl(10),	// has been activated by machine power this turn (can probably be eliminate if needed)

    IS_IN_MACHINE				: ['IS_IN_ROOM_MACHINE', 'IS_IN_AREA_MACHINE'], 	// sacred ground; don't generate items here, or teleport randomly to it

    PERMANENT_MECH_FLAGS : ['SEARCHED_FROM_HERE', 'PRESSURE_PLATE_DEPRESSED', 'KNOWN_TO_BE_TRAP_FREE', 'IS_IN_LOOP',
                            'IS_CHOKEPOINT', 'IS_GATE_SITE', 'IS_IN_MACHINE', ],
  });

  cell$1.mechFlags = MechFlags$1;


  class CellMemory {
    constructor() {
      this.sprite = makeSprite();
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
      copyObject(this, other);
    }
  }

  types.CellMemory = CellMemory;

  class Cell {
    constructor() {
      this.memory = new types.CellMemory();
      this.clear();
    }

    copy(other) {
      copyObject(this, other);
    }

    clear() {
      this.base = 0;
      this.surface = 0;
      this.gas = 0;
      this.liquid = 0;
      this.flags = 0;							// non-terrain cell flags
      this.mechFlags = 0;
      this.gasVolume = 0;						// quantity of gas in cell
      this.liquidVolume = 0;
      this.machineNumber = 0;
      this.memory.clear();
    }

    dump() { return tiles[this.base].sprite.ch; }
    isVisible() { return this.flags & Flags$1.VISIBLE; }
    isAnyKindOfVisible() { return (this.flags & Flags$1.ANY_KIND_OF_VISIBLE) || config.playbackOmniscience; }

    *tiles() {
      if (this.base) yield tiles[this.base];
      if (this.surface) yield tiles[this.surface];
      if (this.liquid) yield tiles[this.liquid];
      if (this.gas) yield tiles[this.gas];
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

    hasTileMechFlag(flagMask) {
      return !!(flagMask & this.tileMechFlags());
    }

    setFlags(cellFlag=0, cellMechFlag=0) {
      this.flags |= cellFlag;
      this.mechFlags |= cellMechFlag;
      this.flags |= Flags$1.NEEDS_REDRAW;
    }

    clearFlags(cellFlag=0, cellMechFlag=0) {
      this.flags &= ~cellFlag;
      this.mechFlags &= ~cellMechFlag;
      if (~cellFlag & Flags$1.NEEDS_REDRAW) {
        this.flags |= Flags$1.NEEDS_REDRAW;
      }
    }

    hasTile(id) {
      return this.base === id || this.surface === id || this.gas === id || this.liquid === id;
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
      let bestPriority = 10000;
      for(let tile of this.tiles()) {
        if (tile.priority < bestPriority) {
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
    tileFlavor() {
      return this.highestPriorityTile().flavor;
    }

    // Retrieves a pointer to the description text of the highest-priority terrain at the given location
    tileText() {
      return this.highestPriorityTile().desc;
    }

    isEmpty() {
      return this.base == 0;
    }

    isPassableNow(limitToPlayerKnowledge) {
      const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
      const tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
      if (!(tileFlags & Flags.T_PATHING_BLOCKER)) return true;

      let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
      return limitToPlayerKnowledge ? false : this.isSecretDoor();
    }

    canBePassed(limitToPlayerKnowledge) {
      if (this.isPassableNow(limitToPlayerKnowledge)) return true;
      const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
      let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
      if (tileMechFlags & MechFlags.TM_CONNECTS_LEVEL) return true;
      return ((tileMechFlags & MechFlags.TM_PROMOTES) && !(this.promotedTileFlags() & Flags.T_PATHING_BLOCKER));
    }

    isObstruction(limitToPlayerKnowledge) {
      const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
      let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
      return tileFlags & Flags.T_OBSTRUCTS_DIAGONAL_MOVEMENT;
    }

    isDoor(limitToPlayerKnowledge) {
      const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
      let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
      return tileFlags & Flags.T_IS_DOOR;
    }

    isSecretDoor(limitToPlayerKnowledge) {
      if (limitToPlayerKnowledge) return false;
      const tileMechFlags = this.tileMechFlags();
      return (tileMechFlags & MechFlags.TM_IS_SECRET) && !(this.discoveredTileFlags() & Flags.T_PATHING_BLOCKER)
    }

    blocksPathing(limitToPlayerKnowledge) {
      const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
      let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
      return tileFlags & Flags.T_PATHING_BLOCKER;
    }

    isLiquid(limitToPlayerKnowledge) {
      const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
      let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
      return tileFlags & Flags.T_IS_LIQUID;
    }

    markRevealed() {
      this.flags &= ~Flags$1.STABLE_MEMORY;
      if (!(this.flags & Flags$1.REVEALED)) {
        this.flags |= Flags$1.REVEALED;
        if (!this.hasTileFlag(Flags.T_PATHING_BLOCKER)) {
          data.xpxpThisTurn++;
        }
      }
    }

    setTile(tileId, force) {
      let tile;
      if (typeof tileId === 'string') {
        tile = withName(tileId);
      }
      else {
        tile = tiles[tileId];
      }

      if (!tile) {
        tile = tiles[0];
      }

      const oldTileId = this.base || 0;
      const oldTile = tiles[oldTileId] || tiles[0];

      if (!force && oldTile.priority < tile.priority) return false;

      this.base = tile.id;
      this.flags |= (Flags$1.NEEDS_REDRAW | Flags$1.TILE_CHANGED);
      return (oldTile.glowLight !== tile.glowLight);
    }

    setSurface(tileId, force) {

    }

    setGas(tileId, volume, force) {

    }

    setLiquid(tileId, volume, force) {

    }

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
    const tile = cell.highestPriorityTile();
    dest.copy(tile.sprite);
    return true;
  }

  cell$1.getAppearance = getAppearance;

  var map = {};


  const Flags$2 = installFlag('map', {
  	MAP_CHANGED: Fl(0),
  	MAP_STABLE_GLOW_LIGHTS:  Fl(1),
  	MAP_STABLE_LIGHTS: Fl(2),
  });



  class Map {
  	constructor(w, h, opts={}) {
  		this.width = w;
  		this.height = h;
  		this.cells = make.grid(w, h, () => new types.Cell() );
  		this.locations = opts.locations || {};
  		this.config = Object.assign({}, opts);
  		this.fx = [];
  	}

  	clear() { this.cells.forEach( (c) => c.clear() ); }
  	dump() { this.cells.dump((c) => c.dump()); }
  	cell(x, y)   { return this.cells[x][y]; }
  	eachCell(fn) { this.cells.forEach(fn); }

  	hasXY(x, y)    		 { return this.cells.hasXY(x, y); }
  	isBoundaryXY(x, y) { return this.cells.isBoundaryXY(x, y); }

  	changed(v) {
  		if (arguments.length == 1) {
  			if (v) {
  				this.flags |= Flags$2.MAP_CHANGED;
  			}
  			else {
  				this.flags &= ~MAP_CHANGED;
  			}
  		}
  		return (this.flags & MAP_CHANGED);
  	}

  	hasCellFlag(x, y, flag) 		{ return this.cell(x, y).flags & flag; }
  	hasCellMechFlag(x, y, flag) { return this.cell(x, y).mechFlags & flag; }
  	hasTileFlag(x, y, flag) 		{ return this.cell(x, y).hasTileFlag(flag); }
  	hasTileMechFlag(x, y, flag) { return this.cell(x, y).hasTileMechFlag(flag); }

  	redrawCell(x, y) {
  		this.cell(x, y).flags |= Flags$1.NEEDS_REDRAW;
  		this.flags |= Flags$2.MAP_CHANGED;
  	}

  	markRevealed(x, y) { return this.cell(x, y).markRevealed(); }
  	isVisible(x, y)    { return this.cell(x, y).isVisible(); }
  	isAnyKindOfVisible(x, y) { return this.cell(x, y).isAnyKindOfVisible(); }

  	setFlags(mapFlag, cellFlag, cellMechFlag) {
  		if (mapFlag) {
  			this.flags |= mapFlag;
  		}
  		if (cellFlag || cellMechFlag) {
  			this.eachCell( (c) => c.setFlags(cellFlag, cellMechFlag) );
  		}
  		this.flags |= Flags$2.MAP_CHANGED;
  	}

  	clearFlags(mapFlag, cellFlag, cellMechFlag) {
  		if (mapFlag) {
  			this.flags &= ~mapFlag;
  		}
  		if (cellFlag || cellMechFlag) {
  			this.eachCell( (cell) => cell.clearFlags(cellFlag, cellMechFlag) );
  		}
  		this.flags |= Flags$2.MAP_CHANGED;
  	}

  	setCellFlags(x, y, cellFlag, cellMechFlag) {
  		this.cell(x, y).setFlags(cellFlag, cellMechFlag);
  		this.flags |= Flags$2.MAP_CHANGED;
  	}

  	clearCellFlags(x, y, cellFlags, cellMechFlags) {
  		this.cell(x, y).clearFlags(cellFlags, cellMechFlags);
  		this.flags |= Flags$2.MAP_CHANGED;
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

  	isEmpty(x, y) { return this.cells[x][y].isEmpty(); }
  	isObstruction(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isObstruction(limitToPlayerKnowledge); }
    isDoor(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isDoor(limitToPlayerKnowledge); }
    blocksPathing(x, y, limitToPlayerKnowledge) { return this.cells[x][y].blocksPathing(limitToPlayerKnowledge); }
    isLiquid(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isLiquid(limitToPlayerKnowledge); }
    hasGas(x, y, limitToPlayerKnowledge) { return this.cells[x][y].hasGas(limitToPlayerKnowledge); }

  	highestPriorityLayer(x, y, skipGas) { return this.cells[x][y].highestPriorityLayer(x, y); }
  	highestPriorityTile(x, y, skipGas) { return this.cells[x][y].highestPriorityTile(x, y); }

  	tileFlavor(x, y) { return this.cells[x][y].tileFlavor(); }
  	tileText(x, y)   { return this.cells[x][y].tileText(); }

  	setTile(x, y, tileId, force) {
  		const cell = this.cell(x, y);
  		if (cell.setTile(tileId, force)) {
  			this.flags &= ~(Flags$2.MAP_STABLE_GLOW_LIGHTS);
  		}
  		this.flags |= Flags$2.MAP_CHANGED;
  	  return true;
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

  	passableArcCount(x, y) {
  		if (!this.hasXY(x, y)) return -1;
  		return this.cells.arcCount(x, y, (c) => c.isPassableNow() );
  	}

  	diagonalBlocked(x1, y1, x2, y2, limitToPlayerKnowledge) {
  	    if (x1 == x2 || y1 == y2) {
  	      return false; // If it's not a diagonal, it's not diagonally blocked.
  	    }
  	    const locFlags1 = this.tileFlags(x1, y2, limitToPlayerKnowledge);
  	    if (locFlags1 & TileFlags.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
  	        return true;
  	    }
  	    const locFlags2 = this.tileFlags(x2, y1, limitToPlayerKnowledge);
  	    if (locFlags2 & TileFlags.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
  	        return true;
  	    }
  	    return false;
  	}

  	fillBasicCostGrid(costGrid) {
  		this.cells.forEach( (cell, i, j) => {
        if (cell.isEmpty()) {
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
  					if ((Math.floor(distanceBetween(x, y, i, j)) == k)
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
  			randIndex = random.number(candidateLocs.length) - 1;
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
  			// GW.debug.log('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => FAIL');
  			return false;
  		}

  		// GW.debug.log('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => ', x, y);
  		return [ x, y ];
  	}

  	// FX

  	addFx(x, y, anim) {
  		if (!this.hasXY(x, y)) return false;
  		const cell = this.cell(x, y);
  		cell.setFlags(Flags$1.HAS_FX);
  		anim.x = x;
  		anim.y = y;
  		this.fx.push(anim);
  		return true;
  	}

  	moveFx(x, y, anim) {
  		if (!this.hasXY(x, y)) return false;
  		const cell = this.cell(x, y);
  		const oldCell = this.cell(anim.x, anim.y);
  		oldCell.clearFlags(Flags$1.HAS_FX);
  		cell.setFlags(Flags$1.HAS_FX);
  		anim.x = x;
  		anim.y = y;
  		return true;
  	}

  	removeFx(anim) {
  		const oldCell = this.cell(anim.x, anim.y);
  		oldCell.clearFlags(Flags$1.HAS_FX);
  		anim.x = -1;
  		anim.y = -1;
  		this.fx = this.fx.filter( (a) => a !== anim );
  		return true;
  	}

  	// ACTORS

  	// will return the PLAYER if the PLAYER is at (x, y).
  	actorAt(x, y) { // creature *
  		if (!(this.cell(x, y).flags & Flags$1.HAS_ACTOR)) {
  			return null;
  		}
  		if (data.player && data.player.x == x && data.player.y == y) {
  			return data.player;
  		}
  	  return this.actors.find( (m) => m.x == x && m.y == y );
  	}

  	addActor(x, y, theActor) {
  		if (!this.hasXY(x, y)) return false;
  		const cell = this.cell(x, y);
  		if (cell.flags & Flags$1.HAS_ACTOR) {
  			// GW.ui.message(colors.badMessageColor, 'There is already an actor there.');
  			return false;
  		}
  		theActor.x = x;
  		theActor.y = y;
  		this.actors.add(theActor);
  		cell.flags |= (Flags$1.HAS_MONSTER | Flags$1.NEEDS_REDRAW);

  		this.flags |= Flags$2.MAP_CHANGED;
  		if (theActor.flags & ActorFlags.MK_DETECTED)
  		{
  			cell.flags |= Flags$1.MONSTER_DETECTED;
  		}

  		return true;
  	}

  	addActorNear(x, y, theActor) {
  		const forbidTileFlags = GW.actor.avoidedFlags(theActor);
  		const loc = this.getMatchingLocNear(x, y, (cell, i, j) => {
  			if (cell.flags & (Flags$1.HAS_ACTOR)) return false;
  			return !cell.hasTileFlag(forbidTileFlags);
  		});
  		if (!loc || loc[0] < 0) {
  			// GW.ui.message(colors.badMessageColor, 'There is no place to put the actor.');
  			return false;
  		}

  		return this.addActor(loc[0], loc[1], theActor);
  	}

  	removeActor(actor) {
  		const cell = this.cell(actor.x, actor.y);
  		cell.flags &= ~(Flags$1.HAS_PLAYER | Flags$1.HAS_MONSTER);
  		cell.flags |= Flags$1.NEEDS_REDRAW;
  		this.flags |= Flags$2.MAP_CHANGED;
  		this.actors.remove(actor);
  	}

  	dormantAt(x, y) {  // creature *
  		if (!(this.cell(x, y).flags & Flags$1.HAS_DORMANT_MONSTER)) {
  			return null;
  		}
  		return this.dormantActors.find( (m) => m.x == x && m.y == y );
  	}

  	addDormant(x, y, theActor) {
  		theActor.x = x;
  		theActor.y = y;
  		this.dormant.add(theActor);
  		cell.flags |= (Flags$1.HAS_DORMANT_MONSTER);
  		this.flags |= Flags$2.MAP_CHANGED;
  		return true;
  	}

  	removeDormant(actor) {
  		const cell = this.cell(actor.x, actor.y);
  		cell.flags &= ~(Flags$1.HAS_DORMANT_MONSTER);
  		cell.flags |= Flags$1.NEEDS_REDRAW;
  		this.flags |= Flags$2.MAP_CHANGED;
  		this.dormant.remove(actor);
  	}

  	// ITEMS

  	itemAt(x, y) {
  		if (!(this.cell(x, y).flags & Flags$1.HAS_ITEM)) {
  			return null;
  		}
  		return this.items.find( (i) => i.x == x && i.y == y );
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
  		this.items.add(theItem);
  		cell.flags |= (Flags$1.HAS_ITEM | Flags$1.NEEDS_REDRAW);

  		this.flags |= Flags$2.MAP_CHANGED;
  		if ( ((theItem.flags & ItemFlags.ITEM_MAGIC_DETECTED) && GW.item.magicChar(theItem)) ||
  					config.D_ITEM_OMNISCIENCE)
  		{
  			cell.flags |= Flags$1.ITEM_DETECTED;
  		}

  		return true;
  	}

  	addItemNear(x, y, theItem) {
  		const loc = this.getMatchingLocNear(x, y, (cell, i, j) => {
  			if (cell.flags & Flags$1.HAS_ITEM) return false;
  			return !cell.hasTileFlag(TileFlags.T_OBSTRUCTS_ITEMS);
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
  		if (this.items.remove(theItem)) {
  			this.flags |= Flags$2.MAP_CHANGED;
  			const cell = this.cell(x, y);
  			cell.flags &= ~(Flags$1.HAS_ITEM | Flags$1.ITEM_DETECTED);
  			cell.flags |= Flags$1.NEEDS_REDRAW;
  			return true;
  		}
  		return false;
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
  	const cell = map.cell(x, y);
  	getAppearance(cell, dest);

  	// add fx (if any)
  	if (cell.flags & Flags$1.HAS_FX) {
  		map.fx.forEach( (a) => {
  			if (a.x != x || a.y != y) return;
  			dest.plot(a.sprite);
  		});
  	}
  }

  map.getCellAppearance = getCellAppearance;

  var game = {};
  data.time = performance.now();

  function setTime(t) {
    const dt = t - data.time;
    data.time = t;
    return Math.max(0, dt);
  }

  game.setTime = setTime;

  //
  //
  //
  // export class Game {
  //   constructor(opts={}) {
  //     this.environmentUpdateTicks = opts.encironmentUpdateTicks || 100;
  //
  //     this.currentIndex = -1;
  //     this.currentActor = undefined;
  //     this.timeDelta = opts.timeDelta || 10;
  //     this.newTurn = true;
  //     this.lastTurnTime = 0;
  //   }
  //
  //   beginLoop(time, dt) {
  //     if (this.newTurn) {
  //       debug.log('New Turn', Math.floor(time - this.lastTurnTime));
  //       this.lastTurnTime = time;
  //       // this.mapUpdater.tick(this.timeDelta);
  //       this.newTurn = false;
  //     }
  //   }
  //
  //   update(dt) {
  //     let actor = this.currentActor || this.nextActor();
  //     while (actor && !this.newTurn) {
  //       // We want all animations to end before anybody gets to act, so we
  //       // need to process then until they are all gone before moving on to the
  //       // next step.
  //       this.updateAll(this.fx.animations, dt);
  //       if (this.map.animations.length) {
  //         return;
  //       }
  //
  //       // process all the input
  //       while (RUT.Keyboard.busy()) {
  //         if (!RUT.Keyboard.process(dt)) return;
  //       }
  //
  //       this.updateActor(actor);
  //       actor = this.nextActor();
  //     }
  //
  //   }
  //
  //   // if you want to do something before or after the update, do it here...
  //   // return false if you want to pause on this actor for some reason...
  //   updateActor(actor) {
  //     if (RUT.App._debug) console.log('TICK : ', actor.toString());
  //     RUT.active.actor = actor;
  //     actor.tick(this.timeDelta);
  //   }
  //
  //   updateAll(actors, dt) {
  //     let index = 0;
  //     while ( index < actors.length) {
  //       const current = actors[index];
  //       current.tick(dt); // Really only have to deal with removing self (I think)
  //       if (actors[index] === current) {
  //         index += 1;
  //       }
  //     }
  //   }
  //
  //   nextActor() {
  //     const actors = this.map.beings;
  //     if (!this.currentActor) {
  //       this.currentIndex = 0;
  //     }
  //     else if (actors[this.currentIndex] === this.currentActor) {
  //       this.currentIndex += 1;
  //     }
  //     else {
  //       const index = actors.indexOf(this.currentActor);
  //       if (index >= 0) {
  //         this.currentIndex = index + 1;
  //       }
  //     }
  //
  //     if (this.currentIndex >= actors.length) {
  //       this.currentIndex = 0;
  //       this.newTurn = true;
  //     }
  //     this.currentActor = actors[this.currentIndex];
  //     return this.currentActor;
  //   }
  //
  //   draw() {
  //     // RUT.Light.updateLighting(this.map);
  //     // RUT.FOV.calcFor(this.player);
  //     // this.display.draw(this.map, this.player.fov);
  //   }
  //
  //   end(fps, panic) {
  //     this.mapUpdater.updateDancingLights = (fps >= 30);
  //
  //     RUT.Map.clearChanged(this.map);
  //   }
  //
  // }
  //

  var fx = {};

  let ANIMATIONS = [];

  function busy$1() {
    return (ANIMATIONS.length > 0);
  }

  fx.busy = busy$1;


  function tick(dt) {
    ANIMATIONS.forEach( (a) => a.tick(dt) );
    ANIMATIONS = ANIMATIONS.filter( (a) => !a.done );
    return fx.busy();
  }

  fx.tick = tick;




  class FX {
    constructor(map, callback, opts={}) {
      if (typeof callback != 'function' && arguments.length == 1) {
        opts = callback || {};
        callback = NOOP;
      }

      this.map = map;
      this.x = -1;
      this.y = -1;
      this.sprite = opts.sprite;
      this.tilNextTurn = opts.speed || opts.duration || 1000;
      this.speed = opts.speed || opts.duration || 1000;
      this.callback = callback || RUT.NOOP;
      this.done = false;
    }

    tick(dt) {
      if (this.done) return;
      this.tilNextTurn -= dt;
      if (this.tilNextTurn < 0) {
        this.step();
        this.tilNextTurn += this.speed;
      }
    }

    step() {
      this.stop();
    }

    start(x, y) {
      this.map.addFx(x, y, this);
    }

    stop(result) {
      if (this.done) return;
      this.done = true;
      this.map.removeFx(this);
      this.callback(result);
    }

    moveDir(dir) {
      return this.moveTo(this.x + dir[0], this.y + dir[1]);
    }

    moveTo(newXy) {
      this.map.moveFx(newXy.x, newXy.y, this);
      return true;
    }

  }

  types.FX = FX;


  // export class XYAnimation extends FX {
  //   constructor(sprite, from, dest, callback, speed=10) {
  //     super(callback, { speed, sprite });
  //     this.from = from;
  //     this.dest = dest;
  //     this.distance = distanceFromTo(from, dest);
  //   }
  //
  //   start() {
  //     return super.start(this.from.x, this.from.y);
  //   }
  //
  //   step() {
  //     const dest = (typeof this.dest == 'function') ? this.dest() : this.dest;
  //     const distance = distanceFromTo(this.xy, dest);
  //
  //     if (distance == 0) {
  //       this.stop(this);
  //       return;
  //     }
  //
  //     const dir = dirFromTo(this, dest);
  //     DATA.map.moveAnimation(this.x + dir[0], this.y + dir[1], this);
  //   }
  // }



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



  // RUT.Animations.Explosion = class Explosion extends FX {
  //   constructor(map, grid, sprite, x, y, radius, callback, opts={}) {
  //     if (opts === true) opts = {};
  //     Object.defaults(opts, { speed:100, duration:300, sprite });
  //     super(map, callback, opts);
  //     this.center = { x, y };
  //     this.max_radius = radius;
  //     this.duration = opts.duration;
  //     this.stepFn = opts.stepFn;
  //
  //     this.grid = RUT.Grid.allocCopy(grid);
  //
  //     this.add(x, y);
  //     this.grid[x][y] = 2;
  //     this.radius = 1;
  //   }
  //
  //   step() {
  //     this.radius = Math.min(this.radius + 1, this.max_radius);
  //
  //     let done = true;
  //     let x = Math.max(0, Math.floor(this.center.x - this.max_radius));
  //     const maxX = Math.min(this.grid.width - 1, Math.ceil(this.center.x + this.max_radius));
  //     let minY = Math.max(0, Math.floor(this.center.y - this.max_radius));
  //     const maxY = Math.min(this.grid.height - 1, Math.ceil(this.center.y + this.max_radius));
  //     let col;
  //     let dist;
  //
  //     for(; x <= maxX; ++x) {
  //       col = this.grid[x];
  //       for(let y = minY; y <= maxY; ++y) {
  //         if (!(col[y] & FovFlags.IN_FOV)) continue;
  //         dist = distanceFromTo(this.center.x, this.center.y, x, y);
  //         if (dist <= this.radius) {
  //           this.add(x, y);
  //           col[y] = 2;
  //         }
  //         else if (dist <= this.max_radius) {
  //           done = false;
  //         }
  //         else {
  //           console.log('weird dist', dist, this.center, x, y);
  //         }
  //       }
  //     }
  //     // console.log('returning...', done);
  //     if (done) {
  //       RUT.Grid.free(this.grid);
  //       return this.stop(this.center); // xy of explosion is callback value
  //     }
  //     return false;
  //   }
  //
  //   add(x, y) {
  //     RUT.Animations.flashSprite(this.map, x, y, this.sprite, this.duration);
  //
  //     if (this.stepFn) {
  //       this.stepFn(this.map, x, y);
  //     }
  //   }
  // }



  async function flashSprite(map, x, y, sprite, duration) {

    if (typeof sprite === 'string') {
      sprite = sprites[sprite];
    }

    return new Promise( (resolve) => {
      const animation = new FX(map, resolve, { sprite, duration });
      animation.start(x, y);
      ANIMATIONS.push(animation);
    });
  }

  fx.flashSprite = flashSprite;

  installSprite('hit', 'x', 'red');
  installSprite('miss', '!', 'green');
  installSprite('bump', 'white', 50);

  // RUT.Animations.hit = function hit(defender, callback, opts) {
  //   if (typeof callback != 'function' && opts === undefined) {
  //     opts = callback;
  //     callback = RUT.NOOP;
  //   }
  //   if (opts === true) opts = {};
  //   if (opts === false) return;
  //   opts = opts || {};
  //   if (typeof opts == 'string') opts = { sprite: opts };
  //   if (typeof opts == 'number') opts = { duration: opts };
  //   Object.defaults(opts, RUT.Config.Animations.hit);
  //
  //   if (!defender.map || !defender.xy) {
  //     console.warn('map and xy required for RUT.Animations.hit::defender');
  //     return callback();
  //   }
  //
  //   const map = defender.map;
  //   const x = defender.xy.x;
  //   const y = defender.xy.y;
  //   const spriteName = opts.sprite;
  //
  //   if (RUT.Animations._debug) console.log('hit animation - added', x, y, RUT.App.time);
  //   return RUT.Animations.flashSprite(map, x, y, spriteName, opts.duration, callback);
  // }
  // RUT.Config.Animations.hit = { duration:200, sprite: 'effect.hit' };
  // RUT.Sprite.add('effect.hit', { ch: '*', fg: 'red' });
  //
  //
  // RUT.Animations.miss = function miss(defender, callback, opts) {
  //   if (typeof callback != 'function' && opts === undefined) {
  //     opts = callback;
  //     callback = RUT.NOOP;
  //   }
  //   if (opts === true) opts = {};
  //   if (opts === false) return;
  //   opts = opts || {};
  //   if (typeof opts == 'string') opts = { sprite: opts };
  //   if (typeof opts == 'number') opts = { duration: opts };
  //   Object.defaults(opts, RUT.Config.Animations.miss);
  //
  //   if (!defender.map || !defender.xy) {
  //     console.warn('map and xy required for RUT.Animations.miss::defender');
  //     return callback();
  //   }
  //   // if (!RUT.FOV.isVisible(defender)) { return Promise.resolve(); }
  //
  //   const map = defender.map;
  //   const x = defender.xy.x;
  //   const y = defender.xy.y;
  //   const spriteName = opts.sprite;
  //
  //   if (RUT.Animations._debug) console.log('miss animation - added', x, y, RUT.App.time);
  //   return RUT.Animations.flashSprite(map, x, y, spriteName, opts.duration, callback);
  // }
  // RUT.Config.Animations.miss = { duration:200, sprite: 'effect.miss' };
  // RUT.Sprite.add('effect.miss', { ch: '*', fg: 'green' });
  //
  //
  //
  // RUT.Animations.projectileTo = function projectileTo(map, from, to, callback, opts) {
  //   if (typeof callback != 'Function' && opts === undefined) {
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
  //   const anim = new RUT.Animations.XYAnimation(map, sprite, from, to, callback, opts.speed);
  //   anim.start();
  //   return anim;
  // }
  // RUT.Config.Animations.projectile = {
  //   speed: 50,
  //   sprite: 'projectile',
  //   stopCell: 0,
  //   stopTile: TileFlags.T_OBSTRUCTS_PASSABILITY,
  //   stepFn: undefined
  // };
  //
  // RUT.Sprite.add('projectile', { ch: '|', fg: 'orange' });
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
  //
  // RUT.Animations.explosionAt = function explosionAt(map, x, y, radius, callback, opts) {
  //   if (typeof callback != 'function' && opts === undefined) {
  //     opts = callback;
  //     callback = RUT.NOOP;
  //   }
  //   opts = opts || {};
  //   if (typeof opts == 'string') opts = { sprite: opts };
  //   Object.defaults(opts, RUT.Config.Animations.explosion);
  //
  //   const fov = RUT.FOV.getFovMask(map, x, y, radius, 0, opts.blocks);
  //   return RUT.Animations.explosionFor(map, fov, x, y, radius, callback, opts);
  // }
  //
  // RUT.Config.Animations.explosion = {
  //   sprite: 'effect.hit',
  //   speed:100,
  //   duration:300,
  //   blocks: TileFlags.T_OBSTRUCTS_PASSABILITY
  // }
  //
  //
  // RUT.Animations.explosionFor = function explosionFor(map, grid, x, y, radius, callback, opts) {
  //   if (typeof callback != 'function' && arguments.length == 6) {
  //     opts = callback;
  //     callback = RUT.NOOP;
  //   }
  //   if (opts === true) opts = {};
  //   opts = opts || {};
  //   if (typeof opts == 'string') opts = { sprite: opts };
  //   Object.defaults(opts, RUT.Config.Animations.explosion);
  //
  //   // TODO - Check edges of explosion
  //   // if (!RUT.FOV.isVisible(xy)) { return Promise.resolve(); }
  //   const sprite = opts.sprite;
  //   let anim = new RUT.Animations.Explosion(map, grid, sprite, x, y, radius, callback, opts);
  //   anim.start();
  //   return anim;
  // }

  exports.actor = actor;
  exports.buffer = buffer;
  exports.canvas = canvas$1;
  exports.cell = cell$1;
  exports.color = color;
  exports.colors = colors;
  exports.commands = commands;
  exports.config = config;
  exports.cosmetic = cosmetic;
  exports.data = data;
  exports.debug = debug$1;
  exports.def = def;
  exports.digger = digger;
  exports.diggers = diggers;
  exports.dungeon = dungeon;
  exports.flag = flag;
  exports.flags = flags;
  exports.fx = fx;
  exports.game = game;
  exports.grid = grid$1;
  exports.install = install;
  exports.io = io;
  exports.make = make;
  exports.map = map;
  exports.path = path;
  exports.random = random;
  exports.sprite = sprite;
  exports.sprites = sprites;
  exports.tile = tile;
  exports.tiles = tiles;
  exports.types = types;
  exports.utils = utils;

})));
