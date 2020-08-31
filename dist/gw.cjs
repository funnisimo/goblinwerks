'use strict';

var def = {};
var utils = {};
var types = {};
var debug$1 = {};

var make = {};
var install = {};

var color = {};
var colors = {};
var sprite = {};
var grid$1 = {};

var buffer = {};
var canvas = {};
var io = {};

var map = {};
var actor = {};
var MAP = null;
var PLAYER = null;


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
  if (current && current.copy) {
    current.copy(updated);
  }
  else if (updated && updated.copy) {
    dest[key] = updated;	// just use same object (shallow copy)
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
    if (typeof arg === 'string' || typeof arg === 'number') {
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

class Color extends Array {
  constructor(...args) {
    if (args.length == 1 && Array.isArray(args[0])) { args = args[0]; }
    while(args.length < 7) args.push(0);
    super(...args.slice(0,7));
    this.dances = (args.length > 7 && args[7]);
  }

  get red() 	{ return this[0]; }
  set red(v)  { this[0] = v; }
  get green()  { return this[1]; }
  set green(v) { this[1] = v; }
  get blue() 	{ return this[2]; }
  set blue(v) { this[2] = v; }

  get redRand() 	{ return this[3]; }
  set redRand(v)  { this[3] = v; }
  get greenRand()  { return this[4]; }
  set greenRand(v) { this[4] = v; }
  get blueRand() 	{ return this[5]; }
  set blueRand(v) { this[5] = v; }

  get rand() 	{ return this[6]; }
  set rand(v)  { this[6] = v; }

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



function applyMix(baseColor, newColor, opacity) {
  if (opacity <= 0) return;
  const weightComplement = 100 - opacity;
  baseColor[0] = Math.floor((baseColor[0] * weightComplement + newColor[0] * opacity) / 100);
  baseColor[1] = Math.floor((baseColor[1] * weightComplement + newColor[1] * opacity) / 100);
  baseColor[2] = Math.floor((baseColor[2] * weightComplement + newColor[2] * opacity) / 100);
}

color.applyMix = applyMix;


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
  const rand = cosmetic.value() * (color[6] || 0);
  const red = toRGB(color[0] + rand, color[3]);
  const green = toRGB(color[1] + rand, color[4]);
  const blue = toRGB(color[2] + rand, color[5]);
  return `#${toCSS(red)}${toCSS(green)}${toCSS(blue)}`;
}

color.css = css;

function equals(a, b) {
  return a.every( (v, i) => v == b[i] ) && a.dances == b.dances;
}

color.equals = equals;

const TEMP_BG = new Color();

class Sprite {
	constructor(ch, fg, bg, opacity=100) {
		this.ch = ch || ' ';
		this.fg = new Color(fg || [100,100,100,0,0,0]);
		this.bg = new Color(bg || [0,0,0,0,0,0]);
		this.opacity = opacity;
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

    let ch, fg;
    TEMP_BG.copy(sprite.bg);

    // ch and fore color:
    if (sprite.ch == ' ') { // Blank cells in the overbuf take the ch from the screen.
      ch = this.ch;
      fg = this.fg;
      // applyMix(fg, sprite.bg, sprite.opacity);
    } else {
      ch = sprite.ch;
      fg = sprite.fg;
    }

    applyMix(TEMP_BG, this.bg, 100 - sprite.opacity);

    if (ch != ' ' && equals(fg, TEMP_BG))
    {
      ch = ' ';
    }

    if (ch !== this.ch
      || !equals(fg, this.fg)
      || !equals(TEMP_BG, this.bg))
    {
      this.plotChar(ch, fg, TEMP_BG);
    }

		return this.needsUpdate;
	}

}

types.Sprite = Sprite;

function makeSprite(ch, fg, bg, opacity) {
  return new Sprite(ch, fg, bg, opacity);
}

make.sprite = makeSprite;

const GRID_CACHE = [];

const DIRS = def.dirs;
const CDIRS = def.clockDirs;

class Grid extends Array {
	constructor(w, h, v) {
		v = v || 0;
		const fn = (typeof v === 'function') ? v : (() => v);
		super(w);
		for( let i = 0; i < w; ++i ) {
			const row = new Array(h);
			for( let j = 0; j < h; ++j) {
				row[j] = fn(j, i);
			}
			this[i] = row;
		}
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

	fill(v) {
		const fn = (typeof v === 'function') ? v : (() => v);
		this.update(fn);
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

	randomMatchingXY(fn) {
		let locationCount;
	  let i, j, index;

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

		for(i = 0; i < grid.width && index >= 0; i++) {
			for(j = 0; j < grid.height && index >= 0; j++) {
        if (fn(grid[i][j], i, j)) {
          if (index == 0) {
						return [i,j];
          }
          index--;
        }
      }
    }
		return [-1,-1];
	}

	matchingXYNear(x, y, deterministic)
	{
	  let loc = [];
		let i, j, k, candidateLocs, randIndex;

		candidateLocs = 0;

		// count up the number of candidate locations
		for (k=0; k < Math.max(grid.width, grid.height) && !candidateLocs; k++) {
			for (i = x-k; i <= x+k; i++) {
				for (j = y-k; j <= y+k; j++) {
					if (grid.hasXY(i, j)
						&& (i == x-k || i == x+k || j == y-k || j == y+k)
						&& grid[i][j])
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
			randIndex = random.number(candidateLocs);
		}

		for (k=0; k < Math.max(grid.width, grid.height); k++) {
			for (i = x-k; i <= x+k; i++) {
				for (j = y-k; j <= y+k; j++) {
					if (grid.hasXY(i, j)
						&& (i == x-k || i == x+k || j == y-k || j == y+k)
						&& grid[i][j])
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

}

types.Grid = Grid;


function makeGrid(w, h, v) {
	return new Grid(w, h, v);
}


// mallocing two-dimensional arrays! dun dun DUN!
function allocGrid(w, h, v) {

	w = w || ( 100);
	h = h || ( 34);
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


function zero(grid) {
	grid.fill(0);
}

grid$1.zero = zero;



function fillCircle(grid, x, y, radius, value) {
    let i, j;

		const fn = (typeof value === 'function') ? value : (() => value);

    for (i=Math.max(0, x - radius - 1); i < Math.min(grid.width, x + radius + 1); i++) {
        for (j=Math.max(0, y - radius - 1); j < Math.min(grid.height, y + radius + 1); j++) {
            if ((i-x)*(i-x) + (j-y)*(j-y) < radius * radius + radius) {	// + radius softens the circle
                grid[i][j] = fn(grid[i][j], i, j);
            }
        }
    }
}

grid$1.fillCircle = fillCircle;
grid$1.updateCircle = fillCircle;


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
	dumpGridSquare(grid, 0, 0, grid.width, grid.height, fmtFn);
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
	else {
		return '#';
	}
}

function dumpGridSquare(grid, left, top, right, bottom, fmtFn) {
	let i, j;

	fmtFn = fmtFn || _formatGridValue;

	left = clamp(left, 0, grid.width - 2);
	right = clamp(right, 1, grid.width - 1);
	top = clamp(top, 0, grid.height - 2);
	bottom = clamp(bottom, 0, grid.height - 1);

	for(j = top; j <= bottom; j++) {
		let line = ('' + j + ']').padStart(3, ' ');
		for(i = left; i <= right; i++) {
			if (i % 10 == 0) {
				line += ' ';
			}

			const v = grid[i][j];
			line += fmtFn(v, i, j)[0];
		}
		debug$1.log(line);
	}
}

grid$1.dumpRect = dumpGridSquare;


function dumpGridAround(grid, x, y, radius) {
	dumpGridSquare(grid, x - radius, y - radius, x + radius, y + radius);
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


function fillRect(grid, x, y, width, height, value=1) {
    let i, j;
    for (i=x; i < x+width; i++) {
        for (j=y; j<y+height; j++) {
            grid[i][j] = value;
        }
    }
}

grid$1.fillRect = fillRect;

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


// Rotates around the cell, counting up the number of distinct strings of neighbors with the same test result in a single revolution.
//		Zero means there are no impassable tiles adjacent.
//		One means it is adjacent to a wall.
//		Two means it is in a hallway or something similar.
//		Three means it is the center of a T-intersection or something similar.
//		Four means it is in the intersection of two hallways.
//		Five or more means there is a bug.
function arcCount(grid, x, y, testFn) {
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
		if ((grid.hasXY(newX, newY) && testFn(grid[newX][newY], newX, newY))
			!= (grid.hasXY(oldX, oldY) && testFn(grid[oldX][oldY], oldX, oldY)))
		{
			arcCount++;
		}
	}
	return Math.floor(arcCount / 2); // Since we added one when we entered a wall and another when we left.
}

grid$1.arcCount = arcCount;


// Marks a cell as being a member of blobNumber, then recursively iterates through the rest of the blob
function floodFill(grid, x, y, fillValue) {
  let dir;
	let newX, newY, numberOfCells = 1;

	grid[x][y] = fillValue;

	// Iterate through the four cardinal neighbors.
	for (dir=0; dir<4; dir++) {
		newX = x + DIRS[dir][0];
		newY = y + DIRS[dir][1];
		if (!grid.hasXY(newX, newY)) {
			break;
		}
		if (grid[newX][newY] == 1) { // If the neighbor is an unmarked region cell,
			numberOfCells += floodFill(grid, newX, newY, fillValue); // then recurse.
		}
	}
	return numberOfCells;
}

grid$1.floodFill = floodFill;


function cellularAutomataRound(grid, birthParameters /* char[9] */, survivalParameters /* char[9] */) {
    let i, j, nbCount, newX, newY;
    let dir;
    let buffer2;

    buffer2 = allocGrid(grid.width, grid.height, 0);
    buffer2.copy(grid); // Make a backup of grid in buffer2, so that each generation is isolated.

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
            } else if (buffer2[i][j] && survivalParameters[nbCount] == 't') ; else {
                grid[i][j] = 0;	// death
            }
        }
    }

    freeGrid(buffer2);
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

	// Generate blobs until they satisfy the minBlobWidth and minBlobHeight restraints
	do {
		// Clear buffer.
    zero(grid);

		// Fill relevant portion with noise based on the percentSeeded argument.
		for(i=0; i<maxBlobWidth; i++) {
			for(j=0; j<maxBlobHeight; j++) {
				grid[i][j] = (random.percent(percentSeeded) ? 1 : 0);
			}
		}

//        colorOverDungeon(&darkGray);
//        hiliteGrid(grid, &white, 100);
//        temporaryMessage("Random starting noise:", true);

		// Some iterations of cellular automata
		for (k=0; k<roundCount; k++) {
			cellularAutomataRound(grid, birthParameters, survivalParameters);

//            colorOverDungeon(&darkGray);
//            hiliteGrid(grid, &white, 100);
//            temporaryMessage("Cellular automata progress:", true);
		}

//        colorOverDungeon(&darkGray);
//        hiliteGrid(grid, &white, 100);
//        temporaryMessage("Cellular automata result:", true);

		// Now to measure the result. These are best-of variables; start them out at worst-case values.
		topBlobSize =   0;
		topBlobNumber = 0;
		topBlobMinX =   maxBlobWidth;
		topBlobMaxX =   0;
		topBlobMinY =   maxBlobHeight;
		topBlobMaxY =   0;

		// Fill each blob with its own number, starting with 2 (since 1 means floor), and keeping track of the biggest:
		blobNumber = 2;

		for(i=0; i<grid.width; i++) {
			for(j=0; j<grid.height; j++) {
				if (grid[i][j] == 1) { // an unmarked blob
					// Mark all the cells and returns the total size:
					blobSize = floodFill(grid, i, j, blobNumber);
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

}

types.Buffer = Buffer;


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
    }

    this.width  = w;
    this.height = h;
    this.tileSize = opts.tileSize || 16;
    this.pxWidth  = this.tileSize * this.width  * this.displayRatio;
    this.pxHeight = this.tileSize * this.height * this.displayRatio;
    this.dances = false;

    if (typeof window !== 'undefined') {
      this.element.width = this.width * this.tileSize;
      this.element.height = this.height * this.tileSize;

      window.addEventListener('resize', handleResizeEvent.bind(this));
      handleResizeEvent.call(this);
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
    const tileSize = this.tileSize * this.displayRatio;

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

      const textX = x * tileSize + tileSize * 0.5;
      const textY = y * tileSize + tileSize * 0.5;

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


// KEYBOARD

function makeKeyEvent(e) {
	let ev;
  let key = e.key;

  if (e.shiftKey) {
    key = key.toUpperCase();
  }
  if (e.ctrlKey) 	{
    key = '^' + key;
  }
  if (e.metaKey) 	{
    key = '#' + key;
  }

	if (DEAD_EVENTS.length) {
  	ev = DEAD_EVENTS.pop();

		ev.shiftKey = e.shiftKey;
		ev.ctrlKey = e.ctrlKey;
		ev.altKey = e.altKey;
		ev.metaKey = e.metaKey;

    ev.type = KEYPRESS;
    ev.key = key;
    ev.code = e.code;
    ev.x = -1;
    ev.y = -1;

    return ev;
  }
  return { type: KEYPRESS, key: key, code: e.code, x: -1, y: -1, shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey };
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


function keyDirection(key) {
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

io.keyDirection = keyDirection;

// MOUSE

var mouse = {x: -1, y: -1};
io.mouse = mouse;

function makeMouseEvent(e, x, y) {

  let event = e.buttons ? CLICK : MOUSEMOVE;

	if (DEAD_EVENTS.length) {
  	ev = DEAD_EVENTS.pop();

		ev.shiftKey = e.shiftKey;
		ev.ctrlKey = e.ctrlKey;
		ev.altKey = e.altKey;
		ev.metaKey = e.metaKey;

    ev.type = event;
    ev.key = null;
    ev.code = null;
    ev.x = x;
    ev.y = y;

    return ev;
  }
  return { type: event, key: null, code: null, x: x, y: y, shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey };
}

io.makeMouseEvent = makeMouseEvent;

// export function onmousemove(e) {
// 	const x = canvas.toX(e.clientX);
// 	const y = canvas.toy(e.clientY);
// 	const ev = makeMouseEvent(e, x, y);
// 	io.pushEvent(ev);
// }
//
// io.onmousemove = onmousemove;
//
// export function onmousedown(e) {
// 	const x = canvas.toX(e.clientX);
// 	const y = canvas.toy(e.clientY);
// 	const ev = makeMouseEvent(e, x, y);
// 	io.pushEvent(ev);
// }
//
// io.onmousedown = onmousedown;

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

async function dispatchEvent(h, e) {
	if (!e || !h) return;
  const fn = h[e.type] || FALSE;
  return await fn.call(h, e);
}

io.dispatchEvent = dispatchEvent;

exports.MAP = MAP;
exports.PLAYER = PLAYER;
exports.actor = actor;
exports.buffer = buffer;
exports.canvas = canvas;
exports.color = color;
exports.colors = colors;
exports.cosmetic = cosmetic;
exports.debug = debug$1;
exports.def = def;
exports.grid = grid$1;
exports.install = install;
exports.io = io;
exports.make = make;
exports.map = map;
exports.random = random;
exports.sprite = sprite;
exports.types = types;
exports.utils = utils;
