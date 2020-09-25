
import { utils } from './utils.js';
import { make, types } from './gw.js';


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



export class Random {
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
  }

}

Random.MAX = RNG_M;

types.Random = Random;


var RANDOM_SEED = Date.now();

export function makeRng(seed) {
  return new types.Random(seed);
}

make.rng = makeRng;

export var random = new Random(RANDOM_SEED);
export var cosmetic = new Random(RANDOM_SEED);




export class Range {
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


export function makeRange(config, rng) {

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
