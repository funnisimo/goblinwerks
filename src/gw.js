

export var def = {};
export var types = {};

export var make = {};
export var install = {};

export var utils = {};

export var ui = {};
export var message = {};
export var viewport = {};
export var flavor = {};
export var sidebar = {};

export var fx = {};
export var commands = {};
export var ai = {};

export var itemKinds = {};
export var item = {};

export var flag = {};
export var flags = {};

export var tiles = {};

export var config = {
  fx: {},
};
export var data = {};
export var maps = {};
export var lights = {};

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
