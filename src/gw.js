



export var def = {};
export var utils = {};
export var types = {};
export var debug = {};

export var make = {};
export var install = {};

export var color = {};
export var colors = {};
export var sprite = {};
export var grid = {};

export var buffer = {};
export var canvas = {};
export var io = {};

export var dig = {};
export var diggers = {};

export var map = {};
export var actor = {};

export var random = null;
export var cosmetic = null;
export var MAP = null;
export var PLAYER = null;


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

debug.log = console.log;
