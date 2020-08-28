var MAP = null;
var PLAYER = null;

var map = {};
var actor = {};
var utils = {};

function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

utils.clamp = clamp;

export { MAP, PLAYER, actor, map, utils };
