
import { copyObject } from './utils.js';
import { Enum } from './enum.js';
import { installFlag, Fl } from './flag.js';
import { makeSprite } from './sprite.js';
import { tiles as TILES, Flags as TileFlags, MechFlags as TileMechFlags } from './tile.js';

import { types, make, def } from './gw.js';


export var cell = {};


export const Layers = new Enum(-1,
  'NO_LAYER',
  'GROUND',		// dungeon-level tile	(e.g. walls)
  'LIQUID',				// liquid-level tile	(e.g. lava)
  'GAS',				// gas-level tile		(e.g. fire, smoke, swamp gas)
  'SURFACE',			// surface-level tile	(e.g. grass)
  'NUMBER_TERRAIN_LAYERS'
);

def.layers = Layers;
cell.layers = Layers;


export const Flags = installFlag('cell', {
  REVEALED					: Fl(0),
  VISIBLE							: Fl(1),	// cell has sufficient light and is in field of view, ready to draw.
  WAS_VISIBLE					: Fl(2),
  IN_FIELD_OF_VIEW		: Fl(3),	// player has unobstructed line of sight whether or not there is enough light

  HAS_PLAYER					: Fl(4),
  HAS_MONSTER					: Fl(5),
  HAS_DORMANT_MONSTER	: Fl(6),	// hidden monster on the square
  HAS_ITEM						: Fl(7),
  HAS_STAIRS					: Fl(8),

  IS_IN_PATH					: Fl(9),	// the yellow trail leading to the cursor
  IS_CURSOR						: Fl(10),	// the current cursor

  MAGIC_MAPPED				: Fl(11),
  ITEM_DETECTED				: Fl(12),

  STABLE_MEMORY						: Fl(13),	// redraws will simply be pulled from the memory array, not recalculated

  CLAIRVOYANT_VISIBLE			: Fl(14),
  WAS_CLAIRVOYANT_VISIBLE	: Fl(15),
  CLAIRVOYANT_DARKENED		: Fl(16),	// magical blindness from a cursed ring of clairvoyance

  IMPREGNABLE							: Fl(17),	// no tunneling allowed!
  TERRAIN_COLORS_DANCING	: Fl(18),	// colors here will sparkle when the game is idle

  TELEPATHIC_VISIBLE			: Fl(19),	// potions of telepathy let you see through other creatures' eyes
  WAS_TELEPATHIC_VISIBLE	: Fl(20),	// potions of telepathy let you see through other creatures' eyes

  MONSTER_DETECTED				: Fl(21),
  WAS_MONSTER_DETECTED		: Fl(22),

  NEEDS_REDRAW            : Fl(23),	// needs to be redrawn (maybe in path, etc...)
  TILE_CHANGED						: Fl(24),	// one of the tiles changed

  CELL_LIT                : Fl(25),
  IS_IN_SHADOW				    : Fl(26),	// so that a player gains an automatic stealth bonus
  CELL_DARK               : Fl(27),

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

    this.layers = [0, 0, 0, 0]; // [NUMBER_TERRAIN_LAYERS];	// terrain  /* ENUM tileType */
    this.flags = 0;							// non-terrain cell flags
    this.mechFlags = 0;
    this.volume = 0;						// quantity of gas in cell
    this.machineNumber = 0;
    this.memory = new types.CellMemory();
  }

  copy(other) {
    copyObject(this, other);
    const app = this.memory;
    super.copy(other);
    this.layers = other.layers.slice();
    this.memory = app;
    this.memory.copy(other.memory);			// how the player remembers the cell to look
  }

  isVisible() { return this.flags & Flags.VISIBLE; }
  isAnyKindOfVisible() { return (this.flags & Flags.ANY_KIND_OF_VISIBLE) || GW.GAME.playbackOmniscience; }

  *tiles() {
    for(let i = 0; i < this.layers.length; ++i) {
      const t = this.layers[i];
      if (t) {
        yield TILES[t];
      }
    }
  }

  tileFlags(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge && !this.isVisible()) {
      return this.memory.tileFlags;
    }
    return this.layers.reduce( (out, t) => {
      if (!t) return out;
      return out | TILES[t].flags;
    }, 0);
  }

  tileMechFlags(limitToPlayerKnowledge)	{
    if (limitToPlayerKnowledge && !this.isVisible()) {
      return this.memory.tileMechFlags;
    }
    return this.layers.reduce( (out, t) => {
      if (!t) return out;
      return out | TILES[t].mechFlags;
    }, 0);
  }

  hasTileFlag(flagMask)	{
    return !!(flagMask & this.tileFlags());
  }

  hasTileMechFlag(flagMask) {
    return !!(flagMask & this.tileMechFlags());
  }

  setFlags(cellFlag, cellMechFlag) {
    if ((this.flags & cellFlag) !== cellFlag) {
      this.flags |= (cellFlag | Flags.NEEDS_REDRAW);
    }
    if ((this.mechFlags & cellMechFlag) !== cellMechFlag) {
      this.mechFlags |= cellMechFlag;
      this.flags |= Flags.NEEDS_REDRAW;
    }
  }

  clearFlags(cellFlag, cellMechFlag) {
    if (this.flags & cellFlag) {
      this.flags &= ~cellFlag;
      this.flags |= Flags.NEEDS_REDRAW;
    }
    if (this.mechFlags & cellMechFlag) {
      this.mechFlags &= ~cellMechFlag;
      this.flags |= Flags.NEEDS_REDRAW;
    }
  }

  hasTile(tile) {
    return this.layers.includes(tile);
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
    return this.layers.reduce( (out, t) => {
      if (!t) return out;
      return out | TILES[t].successorFlags(event);
    }, 0);
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

  highestPriorityLayer(skipGas) {	// enum dungeonLayers
    let bestPriority = 10000;
    let tt, best = 0;

    for (tt = 0; tt < this.layers.length; tt++) {
      if (tt == Layers.GAS && skipGas) {
        continue;
      }
      if (this.layers[tt] && TILES[this.layers[tt]].priority < bestPriority) {
        bestPriority = TILES[this.layers[tt]].priority;
        best = tt;
      }
    }
    return best;
  }

  highestPriorityTile(skipGas) {
    const layer = this.highestPriorityLayer(skipGas);
    return TILES[this.layers[layer]];
  }

  tileWithFlag(tileFlag) {
    return this.layers.find( (t) => t && (TILES[t].flags & tileFlag) );
  }

  tileWithMechFlag(mechFlag) {
    return this.layers.find( (t) => t && (TILES[t].mechFlags & mechFlag) );
  }

  // Retrieves a pointer to the flavor text of the highest-priority terrain at the given location
  tileFlavor() {
    return this.highestPriorityTile(false).flavor;
  }

  // Retrieves a pointer to the description text of the highest-priority terrain at the given location
  tileText() {
    return this.highestPriorityTile(false).desc;
  }

  isPassableNow(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    const tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    if (!(tileFlags & TileFlags.T_PATHING_BLOCKER)) return true;

    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    return (tileMechFlags & TileMechFlags.TM_IS_SECRET) && !(this.discoveredTileFlags() & TileFlags.T_PATHING_BLOCKER);
  }

  canBePassed(limitToPlayerKnowledge) {
    if (this.isPassableNow(limitToPlayerKnowledge)) return true;
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    if (tileMechFlags & TileMechFlags.TM_CONNECTS_LEVEL) return true;
    return ((tileMechFlags & TileMechFlags.TM_PROMOTES) && !(this.promotedTileFlags() & TileFlags.T_PATHING_BLOCKER));
  }

  markRevealed() {
    this.flags &= ~Flags.STABLE_MEMORY;
    if (!(this.flags & Flags.REVEALED)) {
      this.flags |= Flags.REVEALED;
      if (!this.hasTileFlag(TIleFlags.T_PATHING_BLOCKER)) {
        GW.GAME.xpxpThisTurn++;
      }
    }
  }

  setTile(tileId, volume=0) {
    let tile = TILES[tileId];

    if (!tile) {
      tileId = 0;
      tile = TILES[0];
    }

    const oldTileId = this.layers[tile.layer] || 0;
    const oldTile = TILES[oldTileId] || TILES[0];

    if (tile.layer == Layers.GAS) {
        this.volume += (volume || 0);
    }
    this.layers[tile.layer] = tileId;
    this.flags |= (Flags.NEEDS_REDRAW | Flags.TILE_CHANGED);
    return (oldTile.glowLight !== tile.glowLight);
  }

  storeMemory(item) {
    const memory = this.memory;
    memory.tileFlags = this.tileFlags();
    memory.tileMechFlags = this.tileMechFlags();
    memory.cellFlags = this.flags;
		memory.cellMechFlags = this.mechFlags;
    memory.tile = this.layers[this.highestPriorityLayer(false)];	// id
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


function makeCell() {
  const cell = new GW.types.Cell();
  return cell;
}


make.cell = makeCell;
