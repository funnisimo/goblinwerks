(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GW = {}));
}(this, (function (exports) { 'use strict';

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

})));
