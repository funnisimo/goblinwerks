

export var def = {};
export var types = {};
export var debug = {};

export var make = {};
export var install = {};

export var fx = {};
export var commands = {};

export var config = {
  fx: {},
};
export var data = {};

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

debug.log = console.log;
