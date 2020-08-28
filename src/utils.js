
import { utils } from './gw.js';

export function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

utils.clamp = clamp;
