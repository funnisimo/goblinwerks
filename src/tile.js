
import { colors as COLORS } from './color.js';
import { game as GAME } from './game.js';
import { types, def, make, data as DATA, flag as FLAG, utils as UTILS } from './gw.js';

export var tile = {};
export var tiles = [];

export const Layer = new types.Enum('GROUND', 'LIQUID', 'SURFACE', 'GAS', 'ITEM', 'ACTOR', 'PLAYER', 'FX', 'UI');

tile.Layer = Layer;


const Fl = FLAG.fl;

export const Flags = FLAG.install('tile', {
  T_OBSTRUCTS_PASSABILITY	: Fl(0),		// cannot be walked through
  T_OBSTRUCTS_VISION			: Fl(1),		// blocks line of sight
  T_OBSTRUCTS_ITEMS				: Fl(2),		// items can't be on this tile
  T_OBSTRUCTS_SURFACE		  : Fl(3),		// grass, blood, etc. cannot exist on this tile
  T_OBSTRUCTS_GAS					: Fl(4),		// blocks the permeation of gas
  T_OBSTRUCTS_LIQUID      : Fl(5),
  T_OBSTRUCTS_TILE_EFFECTS  : Fl(6),
  T_OBSTRUCTS_DIAGONAL_MOVEMENT : Fl(7),    // can't step diagonally around this tile

  T_BRIDGE                : Fl(10),   // Acts as a bridge over the folowing types:
  T_AUTO_DESCENT					: Fl(11),		// automatically drops creatures down a depth level and does some damage (2d6)
  T_LAVA			            : Fl(12),		// kills any non-levitating non-fire-immune creature instantly
  T_DEEP_WATER					  : Fl(13),		// steals items 50% of the time and moves them around randomly

  T_SPONTANEOUSLY_IGNITES	: Fl(14),		// monsters avoid unless chasing player or immune to fire
  T_IS_FLAMMABLE					: Fl(15),		// terrain can catch fire
  T_IS_FIRE								: Fl(16),		// terrain is a type of fire; ignites neighboring flammable cells
  T_ENTANGLES							: Fl(17),		// entangles players and monsters like a spiderweb

  T_CAUSES_POISON					: Fl(18),		// any non-levitating creature gets 10 poison
  T_CAUSES_DAMAGE					: Fl(19),		// anything on the tile takes max(1-2, 10%) damage per turn
  T_CAUSES_NAUSEA					: Fl(20),		// any creature on the tile becomes nauseous
  T_CAUSES_PARALYSIS			: Fl(21),		// anything caught on this tile is paralyzed
  T_CAUSES_CONFUSION			: Fl(22),		// causes creatures on this tile to become confused
  T_CAUSES_HEALING   	    : Fl(23),   // heals 20% max HP per turn for any player or non-inanimate monsters
  T_IS_TRAP								: Fl(24),		// spews gas of type specified in fireType when stepped on
  T_CAUSES_EXPLOSIVE_DAMAGE		: Fl(25),		// is an explosion; deals higher of 15-20 or 50% damage instantly, but not again for five turns
  T_SACRED                : Fl(26),   // monsters that aren't allies of the player will avoid stepping here

  T_UP_STAIRS							: Fl(27),
  T_DOWN_STAIRS						: Fl(28),
  T_PORTAL                : Fl(29),
  T_IS_DOOR								: Fl(30),

  T_HAS_STAIRS						: ['T_UP_STAIRS', 'T_DOWN_STAIRS'],
  T_OBSTRUCTS_SCENT				: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES', 'T_HAS_STAIRS'],
  T_PATHING_BLOCKER				: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_IS_FIRE', 'T_SPONTANEOUSLY_IGNITES', 'T_ENTANGLES'],
  T_DIVIDES_LEVEL       	: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER'],
  T_LAKE_PATHING_BLOCKER	: ['T_AUTO_DESCENT', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
  T_WAYPOINT_BLOCKER			: ['T_OBSTRUCTS_PASSABILITY', 'T_AUTO_DESCENT', 'T_IS_TRAP', 'T_LAVA', 'T_DEEP_WATER', 'T_SPONTANEOUSLY_IGNITES'],
  T_MOVES_ITEMS						: ['T_DEEP_WATER', 'T_LAVA'],
  T_CAN_BE_BRIDGED				: ['T_AUTO_DESCENT'],
  T_OBSTRUCTS_EVERYTHING	: ['T_OBSTRUCTS_PASSABILITY', 'T_OBSTRUCTS_VISION', 'T_OBSTRUCTS_ITEMS', 'T_OBSTRUCTS_GAS', 'T_OBSTRUCTS_SURFACE',   'T_OBSTRUCTS_DIAGONAL_MOVEMENT'],
  T_HARMFUL_TERRAIN				: ['T_CAUSES_POISON', 'T_IS_FIRE', 'T_CAUSES_DAMAGE', 'T_CAUSES_PARALYSIS', 'T_CAUSES_CONFUSION', 'T_CAUSES_EXPLOSIVE_DAMAGE'],
  T_RESPIRATION_IMMUNITIES  : ['T_CAUSES_DAMAGE', 'T_CAUSES_CONFUSION', 'T_CAUSES_PARALYSIS', 'T_CAUSES_NAUSEA'],
  T_IS_LIQUID               : ['T_LAVA', 'T_AUTO_DESCENT', 'T_DEEP_WATER'],
});

tile.flags = Flags;

///////////////////////////////////////////////////////
// TILE MECH


export const MechFlags = FLAG.install('tileMech', {
  TM_IS_SECRET							: Fl(0),		// successful search or being stepped on while visible transforms it into discoverType
  TM_PROMOTES_WITH_KEY			: Fl(1),		// promotes if the key is present on the tile (in your pack, carried by monster, or lying on the ground)
  TM_PROMOTES_WITHOUT_KEY		: Fl(2),		// promotes if the key is NOT present on the tile (in your pack, carried by monster, or lying on the ground)
  TM_PROMOTES_ON_STEP				: Fl(3),		// promotes when a creature, player or item is on the tile (whether or not levitating)
  TM_PROMOTES_ON_ITEM_REMOVE		: Fl(4),		// promotes when an item is lifted from the tile (primarily for altars)
  TM_PROMOTES_ON_PLAYER_ENTRY		: Fl(5),		// promotes when the player enters the tile (whether or not levitating)
  TM_PROMOTES_ON_SACRIFICE_ENTRY: Fl(6),		// promotes when the sacrifice target enters the tile (whether or not levitating)
  TM_PROMOTES_ON_ELECTRICITY    : Fl(7),    // promotes when hit by a lightning bolt

  TM_ALLOWS_SUBMERGING					: Fl(8),		// allows submersible monsters to submerge in this terrain
  TM_IS_WIRED										: Fl(9),		// if wired, promotes when powered, and sends power when promoting
  TM_IS_CIRCUIT_BREAKER 				: Fl(10),        // prevents power from circulating in its machine
  TM_GAS_DISSIPATES							: Fl(11),		// does not just hang in the air forever
  TM_GAS_DISSIPATES_QUICKLY			: Fl(12),		// dissipates quickly
  TM_EXTINGUISHES_FIRE					: Fl(13),		// extinguishes burning terrain or creatures
  TM_VANISHES_UPON_PROMOTION		: Fl(14),		// vanishes when creating promotion dungeon feature, even if the replacement terrain priority doesn't require it
  TM_REFLECTS_BOLTS           	: Fl(15),       // magic bolts reflect off of its surface randomly (similar to ACTIVE_CELLS flag IMPREGNABLE)
  TM_STAND_IN_TILE            	: Fl(16),		// earthbound creatures will be said to stand "in" the tile, not on it
  TM_LIST_IN_SIDEBAR          	: Fl(17),       // terrain will be listed in the sidebar with a description of the terrain type
  TM_VISUALLY_DISTINCT        	: Fl(18),       // terrain will be color-adjusted if necessary so the character stands out from the background
  TM_BRIGHT_MEMORY            	: Fl(19),       // no blue fade when this tile is out of sight
  TM_EXPLOSIVE_PROMOTE        	: Fl(20),       // when burned, will promote to promoteType instead of burningType if surrounded by tiles with T_IS_FIRE or TM_EXPLOSIVE_PROMOTE
  TM_CONNECTS_LEVEL           	: Fl(21),       // will be treated as passable for purposes of calculating level connectedness, irrespective of other aspects of this terrain layer
  TM_INTERRUPT_EXPLORATION_WHEN_SEEN : Fl(22),    // will generate a message when discovered during exploration to interrupt exploration
  TM_INVERT_WHEN_HIGHLIGHTED  	: Fl(23),       // will flip fore and back colors when highlighted with pathing
  TM_SWAP_ENCHANTS_ACTIVATION 	: Fl(24),       // in machine, swap item enchantments when two suitable items are on this terrain, and activate the machine when that happens
  TM_PROMOTES										: 'TM_PROMOTES_WITH_KEY | TM_PROMOTES_WITHOUT_KEY | TM_PROMOTES_ON_STEP | TM_PROMOTES_ON_ITEM_REMOVE | TM_PROMOTES_ON_SACRIFICE_ENTRY | TM_PROMOTES_ON_ELECTRICITY | TM_PROMOTES_ON_PLAYER_ENTRY',
});

tile.mechFlags = MechFlags;

function setFlags(tile, allFlags) {
  let flags = [];
  if (!allFlags) return;  // no flags

  if (typeof allFlags === 'string') {
    flags = allFlags.split(/[,|]/).map( (t) => t.trim() );
  }
  else if (!Array.isArray(allFlags)) {
    return UTILS.WARN('Invalid tile flags: ' + allFlags);
  }
  else if (allFlags.length <= 2) {
    if (typeof allFlags[0] === 'number') {
      tile.flags = allFlags[0] || 0;
      tile.mechFlags = allFlags[1] || 0;
      return;
    }
  }

  flags.forEach((f) => {
    if (typeof f !== 'string') {
      UTILS.WARN('Invalid tile flag: ' + f);
    }
    else if (Flags[f]) {
      tile.flags |= Flags[f];
    }
    else if (MechFlags[f]) {
      tile.mechFlags |= MechFlags[f];
    }
    else {
      UTILS.WARN('Invalid tile flag: ' + f);
    }
  });
}


export class Tile {
  constructor(ch, fg, bg, priority, layer, allFlags, text, desc) {
    this.flags = 0;
    this.mechFlags = 0;
    this.layer = layer || 0;
    this.priority = priority || 0; // lower means higher priority (50 = average)
    this.sprite = make.sprite(ch, fg, bg);
    this.events = {};
    this.light = null;
    this.desc = desc || '';
    this.text = text || '';
    this.name = null;

    setFlags(this, allFlags);
  }

  successorFlags(event) {
    const e = this.events[event];
    if (!e) return 0;
    const feature = e.feature;
    if (!feature) return 0;
    // const tile = FEATURES[feature].tile;
    // if (!tile) return 0;
    // return tiles[tile].flags;
  }
}

types.Tile = Tile;

export function makeTile(ch, fg, bg, priority, layer, allFlags, text, desc, opts={}) {
  const tile = new types.Tile(ch, fg, bg, priority, layer, allFlags, text, desc);
  // TODO - tile.light = opts.light || null;
  // TODO - tile.events.fire = opts.fire
  // TODO - tile.events.promote = opts.promote
  // TODO - tile.events.discover = opts.discover
  if (opts.playerEnter) { tile.events.playerEnter = make.tileEvent(opts.playerEnter); }
  if (opts.enter) { tile.events.enter = make.tileEvent(opts.enter); }
  if (opts.tick) {
    const tick = tile.events.tick = make.tileEvent(opts.tick);
    tick.chance = tick.chance || 100;
  }
  return tile;
}

make.tile = makeTile;

export function installTile(name, ...args) {
  let tile;
  if (args.length == 1 && args[0] instanceof Tile) {
    tile = args[0];
  }
  else {
    tile = make.tile(...args);
  }
  tile.name = name;
  tile.id = tiles.length;
  tiles.push(tile);
  return tile.id;
}

tile.install = installTile;

// These are the minimal set of tiles to make the diggers work
const NOTHING = def.NOTHING = 0;
installTile(NOTHING,       '\u2205', 'black', 'black', 0, 0, 'T_OBSTRUCTS_PASSABILITY', "an eerie nothingness", "");
installTile('FLOOR',       '\u00b7', [30,30,30,20], [2,2,10,0,2,2,0], 10, 0, 0, 'the floor');	// FLOOR
installTile('DOOR',        '+', [100,40,40], [30,60,60], 30, 0, 'T_IS_DOOR, T_OBSTRUCTS_ITEMS, T_OBSTRUCTS_TILE_EFFECTS', 'a door');	// DOOR
installTile('BRIDGE',      '=', [100,40,40], null, 40, Layer.SURFACE, 'T_BRIDGE', 'a bridge');	// BRIDGE (LAYER=SURFACE)
installTile('UP_STAIRS',   '<', [100,40,40], [100,60,20], 200, 0, 'T_UP_STAIRS', 'an upward staircase');	// UP
installTile('DOWN_STAIRS', '>', [100,40,40], [100,60,20], 200, 0, 'T_DOWN_STAIRS', 'a downward staircase');	// DOWN
installTile('WALL',        '#', [7,7,7,0,3,3,3],  [40,40,40,10,10,0,5], 100, 0, 'T_OBSTRUCTS_EVERYTHING', 'a wall');	// WALL
installTile('LAKE',        '~', [5,8,20,10,0,4,15,1], [10,15,41,6,5,5,5,1], 50, 0, 'T_DEEP_WATER', 'deep water');	// LAKE

export function withName(name) {
  return tiles.find( (t) => t.name == name );
}

tile.withName = withName;



async function applyInstantTileEffects(tile, cell) {

  const actor = cell.actor;
  const isPlayer = (actor === DATA.player);

  if (tile.flags & Flags.T_LAVA && actor) {
    if (!cell.hasTileFlag(Flags.T_BRIDGE) && !actor.status[def.STATUS_LEVITATING]) {
      actor.kill();
      await GAME.gameOver(COLORS.red, 'you fall into lava and perish.');
      return true;
    }
  }

  return false;
}

tile.applyInstantEffects = applyInstantTileEffects;
