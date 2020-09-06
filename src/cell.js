
import { copyObject } from './utils.js';
import { Enum } from './enum.js';
import { installFlag, Fl } from './flag.js';
import { makeSprite } from './sprite.js';
import { tiles as TILES, Flags as TileFlags, MechFlags as TileMechFlags, withName } from './tile.js';

import { types, make, def, config as CONFIG, data as DATA } from './gw.js';


export var cell = {};


export const Flags = installFlag('cell', {
  REVEALED					: Fl(0),
  VISIBLE							: Fl(1),	// cell has sufficient light and is in field of view, ready to draw.
  WAS_VISIBLE					: Fl(2),
  IN_FOV		          : Fl(3),	// player has unobstructed line of sight whether or not there is enough light

  HAS_PLAYER					: Fl(4),
  HAS_MONSTER					: Fl(5),
  HAS_DORMANT_MONSTER	: Fl(6),	// hidden monster on the square
  HAS_ITEM						: Fl(7),
  HAS_STAIRS					: Fl(8),
  HAS_FX              : Fl(9),

  IS_IN_PATH					: Fl(12),	// the yellow trail leading to the cursor
  IS_CURSOR						: Fl(13),	// the current cursor

  MAGIC_MAPPED				: Fl(14),
  ITEM_DETECTED				: Fl(15),

  STABLE_MEMORY						: Fl(16),	// redraws will simply be pulled from the memory array, not recalculated

  CLAIRVOYANT_VISIBLE			: Fl(17),
  WAS_CLAIRVOYANT_VISIBLE	: Fl(18),
  CLAIRVOYANT_DARKENED		: Fl(19),	// magical blindness from a cursed ring of clairvoyance

  IMPREGNABLE							: Fl(20),	// no tunneling allowed!

  TELEPATHIC_VISIBLE			: Fl(22),	// potions of telepathy let you see through other creatures' eyes
  WAS_TELEPATHIC_VISIBLE	: Fl(23),	// potions of telepathy let you see through other creatures' eyes

  MONSTER_DETECTED				: Fl(24),
  WAS_MONSTER_DETECTED		: Fl(25),

  NEEDS_REDRAW            : Fl(26),	// needs to be redrawn (maybe in path, etc...)
  TILE_CHANGED						: Fl(27),	// one of the tiles changed

  CELL_LIT                : Fl(28),
  IS_IN_SHADOW				    : Fl(29),	// so that a player gains an automatic stealth bonus
  CELL_DARK               : Fl(30),

  PERMANENT_CELL_FLAGS : ['REVEALED', 'MAGIC_MAPPED', 'ITEM_DETECTED', 'HAS_ITEM', 'HAS_DORMANT_MONSTER',
              'HAS_STAIRS', 'STABLE_MEMORY', 'IMPREGNABLE'],

  ANY_KIND_OF_VISIBLE			: ['VISIBLE', 'CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE'],
  HAS_ACTOR               : ['HAS_PLAYER', 'HAS_MONSTER'],
});

cell.flags = Flags;

///////////////////////////////////////////////////////
// CELL MECH

export const MechFlags = installFlag('cellMech', {
  SEARCHED_FROM_HERE				: Fl(0),	// Player already auto-searched from here; can't auto search here again
  CAUGHT_FIRE_THIS_TURN			: Fl(1),	// so that fire does not spread asymmetrically
  PRESSURE_PLATE_DEPRESSED	: Fl(2),	// so that traps do not trigger repeatedly while you stand on them
  KNOWN_TO_BE_TRAP_FREE			: Fl(3),	// keep track of where the player has stepped as he knows no traps are there

  IS_IN_LOOP					: Fl(5),	// this cell is part of a terrain loop
  IS_CHOKEPOINT				: Fl(6),	// if this cell is blocked, part of the map will be rendered inaccessible
  IS_GATE_SITE				: Fl(7),	// consider placing a locked door here
  IS_IN_ROOM_MACHINE	: Fl(8),
  IS_IN_AREA_MACHINE	: Fl(9),
  IS_POWERED					: Fl(10),	// has been activated by machine power this turn (can probably be eliminate if needed)

  IS_IN_MACHINE				: ['IS_IN_ROOM_MACHINE', 'IS_IN_AREA_MACHINE'], 	// sacred ground; don't generate items here, or teleport randomly to it

  PERMANENT_MECH_FLAGS : ['SEARCHED_FROM_HERE', 'PRESSURE_PLATE_DEPRESSED', 'KNOWN_TO_BE_TRAP_FREE', 'IS_IN_LOOP',
                          'IS_CHOKEPOINT', 'IS_GATE_SITE', 'IS_IN_MACHINE', ],
});

cell.mechFlags = MechFlags;


class CellMemory {
  constructor() {
    this.sprite = makeSprite();
    this.clear();
  }

  clear() {
    this.sprite.clear();
    this.itemKind = null;
    this.itemQuantity = 0;
    this.tile = null;
    this.cellFlags = 0;
    this.cellMechFlags = 0;
    this.tileFlags = 0;
    this.tileMechFlags = 0;
  }

  copy(other) {
    copyObject(this, other);
  }
}

types.CellMemory = CellMemory;

class Cell {
  constructor() {
    this.memory = new types.CellMemory();
    this.clear();
  }

  copy(other) {
    copyObject(this, other);
  }

  clear() {
    this.base = 0;
    this.surface = 0;
    this.gas = 0;
    this.liquid = 0;
    this.flags = 0;							// non-terrain cell flags
    this.mechFlags = 0;
    this.gasVolume = 0;						// quantity of gas in cell
    this.liquidVolume = 0;
    this.machineNumber = 0;
    this.memory.clear();
  }

  dump() { return TILES[this.base].sprite.ch; }
  isVisible() { return this.flags & Flags.VISIBLE; }
  isAnyKindOfVisible() { return (this.flags & Flags.ANY_KIND_OF_VISIBLE) || CONFIG.playbackOmniscience; }

  *tiles() {
    if (this.base) yield TILES[this.base];
    if (this.surface) yield TILES[this.surface];
    if (this.liquid) yield TILES[this.liquid];
    if (this.gas) yield TILES[this.gas];
  }

  tileFlags(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge && !this.isVisible()) {
      return this.memory.tileFlags;
    }
    let flags = 0;
    for( let tile of this.tiles()) {
      flags |= tile.flags;
    }
    return flags;
  }

  tileMechFlags(limitToPlayerKnowledge)	{
    if (limitToPlayerKnowledge && !this.isVisible()) {
      return this.memory.tileMechFlags;
    }
    let flags = 0;
    for( let tile of this.tiles()) {
      flags |= tile.mechFlags;
    }
    return flags;
  }

  hasTileFlag(flagMask)	{
    return !!(flagMask & this.tileFlags());
  }

  hasTileMechFlag(flagMask) {
    return !!(flagMask & this.tileMechFlags());
  }

  setFlags(cellFlag=0, cellMechFlag=0) {
    this.flags |= cellFlag;
    this.mechFlags |= cellMechFlag;
    this.flags |= Flags.NEEDS_REDRAW;
  }

  clearFlags(cellFlag=0, cellMechFlag=0) {
    this.flags &= ~cellFlag;
    this.mechFlags &= ~cellMechFlag;
    if (~cellFlag & Flags.NEEDS_REDRAW) {
      this.flags |= Flags.NEEDS_REDRAW;
    }
  }

  hasTile(id) {
    return this.base === id || this.surface === id || this.gas === id || this.liquid === id;
  }

  // hasTileInGroup(...groups) {
  //   if (groups.length == 1 && Array.isArray(groups[0])) {
  //     groups = groups[0];
  //   }
  //   return this.layers.some( (tileId) => {
  //     const tile = TILES[tileId] || TILES.NOTHING;
  //     return GW.utils.intersect(groups, tile.groups);
  //   });
  // }

  successorTileFlags(event) {
    let flags = 0;
    for( let tile of this.tiles()) {
      flags |= tile.successorFlags(event);
    }
    return flags;
  }

  promotedTileFlags() {
    return this.successorTileFlags('promote');
  }

  discoveredTileFlags() {
    return this.successorTileFlags('discover');
  }

  hasDiscoveredTileFlag(flag) {
    // if (!this.hasTileMechFlag(TM_IS_SECRET)) return false;
    return this.discoveredTileFlags() & flag;
  }

  highestPriorityTile() {
    let best = TILES[0];
    let bestPriority = 10000;
    for(let tile of this.tiles()) {
      if (tile.priority < bestPriority) {
        best = tile;
        bestPriority = tile.priority;
      }
    }
    return best;
  }

  tileWithFlag(tileFlag) {
    for(let tile of this.tiles()) {
      if (tile.flags & tileFlags) return tile;
    }
    return null;
  }

  tileWithMechFlag(mechFlag) {
    for(let tile of this.tiles()) {
      if (tile.mechFlags & mechFlags) return tile;
    }
    return null;
  }

  // Retrieves a pointer to the flavor text of the highest-priority terrain at the given location
  tileFlavor() {
    return this.highestPriorityTile().flavor;
  }

  // Retrieves a pointer to the description text of the highest-priority terrain at the given location
  tileText() {
    return this.highestPriorityTile().desc;
  }

  isEmpty() {
    return this.base == 0;
  }

  isPassableNow(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    const tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    if (!(tileFlags & TileFlags.T_PATHING_BLOCKER)) return true;

    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    return limitToPlayerKnowledge ? false : this.isSecretDoor();
  }

  canBePassed(limitToPlayerKnowledge) {
    if (this.isPassableNow(limitToPlayerKnowledge)) return true;
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    if (tileMechFlags & TileMechFlags.TM_CONNECTS_LEVEL) return true;
    return ((tileMechFlags & TileMechFlags.TM_PROMOTES) && !(this.promotedTileFlags() & TileFlags.T_PATHING_BLOCKER));
  }

  isObstruction(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & TileFlags.T_OBSTRUCTS_DIAGONAL_MOVEMENT;
  }

  isDoor(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & TileFlags.T_IS_DOOR;
  }

  isSecretDoor(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge) return false;
    const tileMechFlags = this.tileMechFlags();
    return (tileMechFlags & TileMechFlags.TM_IS_SECRET) && !(this.discoveredTileFlags() & TileFlags.T_PATHING_BLOCKER)
  }

  blocksPathing(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & TileFlags.T_PATHING_BLOCKER;
  }

  isLiquid(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & TileFlags.T_IS_LIQUID;
  }

  markRevealed() {
    this.flags &= ~Flags.STABLE_MEMORY;
    if (!(this.flags & Flags.REVEALED)) {
      this.flags |= Flags.REVEALED;
      if (!this.hasTileFlag(TileFlags.T_PATHING_BLOCKER)) {
        DATA.xpxpThisTurn++;
      }
    }
  }

  setTile(tileId, force) {
    let tile;
    if (typeof tileId === 'string') {
      tile = withName(tileId);
    }
    else {
      tile = TILES[tileId];
    }

    if (!tile) {
      tile = TILES[0];
    }

    const oldTileId = this.base || 0;
    const oldTile = TILES[oldTileId] || TILES[0];

    if (!force && oldTile.priority < tile.priority) return false;

    this.base = tile.id;
    this.flags |= (Flags.NEEDS_REDRAW | Flags.TILE_CHANGED);
    return (oldTile.glowLight !== tile.glowLight);
  }

  setSurface(tileId, force) {

  }

  setGas(tileId, volume, force) {

  }

  setLiquid(tileId, volume, force) {

  }

  storeMemory(item) {
    const memory = this.memory;
    memory.tileFlags = this.tileFlags();
    memory.tileMechFlags = this.tileMechFlags();
    memory.cellFlags = this.flags;
		memory.cellMechFlags = this.mechFlags;
    memory.tile = this.highestPriorityTile().id;
		if (item) {
			memory.itemKind = item.kind;
			memory.itemQuantity = item.quantity || 1;
		}
		else {
			memory.itemKind = null;
			memory.itemQuantity = 0;
		}
  }

}

types.Cell = Cell;


function makeCell(...args) {
  const cell = new types.Cell(...args);
  return cell;
}


make.cell = makeCell;


export function getAppearance(cell, dest) {
	dest.clear();
  const tile = cell.highestPriorityTile();
  dest.copy(tile.sprite);
  return true;
}

cell.getAppearance = getAppearance;
