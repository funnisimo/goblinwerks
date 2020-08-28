'use strict';

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

exports.MAP = MAP;
exports.PLAYER = PLAYER;
exports.actor = actor;
exports.map = map;
exports.utils = utils;
