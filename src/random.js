
import { Random } from 'gw-core';

// Based on random numbers in umoria
const RNG_M = 2**31 - 1;
const RNG_A = 16807;
const RNG_Q = Math.floor(RNG_M / RNG_A); // m div a 127773L
const RNG_R = RNG_M % RNG_A;   // m mod a 2836L

function makeRng(seed=0) {
  let _seed = (seed || Date.now()) % RNG_M;
  let _v = ((_seed % (RNG_M - 1)) + 1);
  let count = 0;

  // returns a pseudo-random number from [0, 1)
  function gwRandom() {
		++count;
    const high = Math.floor(_v / RNG_Q);
    const low = Math.floor(_v % RNG_Q);
    const test = Math.floor(RNG_A * low - RNG_R * high);

    if (test > 0) {
        _v = test;
    } else {
        _v = (test + RNG_M);
    }
    const v = _v - 1;
    const pct = v/RNG_M;
    if (pct >= 1.0) throw new Error('Error in gwRandom! pct=' + pct.toFixed(4));
    else if (pct < 0) throw new Error('Error in gwRandom! pct=' + pct.toFixed(4));

    return pct;
  }
  
  return gwRandom;
}

Random.configure({ make: makeRng });
