
import { random } from './random.js';
import { colors as COLORS, color as COLOR } from './color.js';
import { tiles as TILES, tile as TILE, Flags as TileFlags, MechFlags as TileMechFlags, Layer as TileLayer } from './tile.js';
import { tileEvent as TILE_EVENT } from './tileEvent.js';

import { types, make, def, config as CONFIG, data as DATA, flag as FLAG, utils as UTILS } from './gw.js';


export var cell = {};

cell.debug = UTILS.NOOP;

COLOR.install('cursorColor', 25, 100, 150);
CONFIG.cursorPathIntensity = 50;


const Fl = FLAG.fl;

export const Flags = FLAG.install('cell', {
  REVEALED					: Fl(0),
  VISIBLE							: Fl(1),	// cell has sufficient light and is in field of view, ready to draw.
  WAS_VISIBLE					: Fl(2),
  IN_FOV		          : Fl(3),	// player has unobstructed line of sight whether or not there is enough light

  HAS_PLAYER					: Fl(4),
  HAS_MONSTER					: Fl(5),
  HAS_DORMANT_MONSTER	: Fl(6),	// hidden monster on the square
  HAS_ITEM						: Fl(7),
  HAS_STAIRS					: Fl(8),

  NEEDS_REDRAW        : Fl(9),	// needs to be redrawn (maybe in path, etc...)
  CELL_CHANGED				: Fl(10),	// one of the tiles or sprites (item, actor, fx) changed

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

  LIGHT_CHANGED           : Fl(27), // Light level changed this turn
  CELL_LIT                : Fl(28),
  IS_IN_SHADOW				    : Fl(29),	// so that a player gains an automatic stealth bonus
  CELL_DARK               : Fl(30),

  PERMANENT_CELL_FLAGS : ['REVEALED', 'MAGIC_MAPPED', 'ITEM_DETECTED', 'HAS_ITEM', 'HAS_DORMANT_MONSTER',
              'HAS_STAIRS', 'STABLE_MEMORY', 'IMPREGNABLE'],

  ANY_KIND_OF_VISIBLE			: ['VISIBLE', 'CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE'],
  HAS_ACTOR               : ['HAS_PLAYER', 'HAS_MONSTER'],
  IS_WAS_ANY_KIND_OF_VISIBLE : ['VISIBLE', 'WAS_VISIBLE', 'CLAIRVOYANT_VISIBLE', 'WAS_CLAIRVOYANT_VISIBLE', 'TELEPATHIC_VISIBLE', 'WAS_TELEPATHIC_VISIBLE'],
});

cell.flags = Flags;

///////////////////////////////////////////////////////
// CELL MECH

export const MechFlags = FLAG.install('cellMech', {
  SEARCHED_FROM_HERE				: Fl(0),	// Player already auto-searched from here; can't auto search here again
  PRESSURE_PLATE_DEPRESSED	: Fl(1),	// so that traps do not trigger repeatedly while you stand on them
  KNOWN_TO_BE_TRAP_FREE			: Fl(2),	// keep track of where the player has stepped as he knows no traps are there

  CAUGHT_FIRE_THIS_TURN			: Fl(4),	// so that fire does not spread asymmetrically
  EVENT_FIRED_THIS_TURN     : Fl(5),  // so we don't update cells that have already changed this turn
  EVENT_PROTECTED           : Fl(6),

  IS_IN_LOOP					: Fl(10),	// this cell is part of a terrain loop
  IS_CHOKEPOINT				: Fl(11),	// if this cell is blocked, part of the map will be rendered inaccessible
  IS_GATE_SITE				: Fl(12),	// consider placing a locked door here
  IS_IN_ROOM_MACHINE	: Fl(13),
  IS_IN_AREA_MACHINE	: Fl(14),
  IS_POWERED					: Fl(15),	// has been activated by machine power this turn (can probably be eliminate if needed)

  IS_IN_MACHINE				: ['IS_IN_ROOM_MACHINE', 'IS_IN_AREA_MACHINE'], 	// sacred ground; don't generate items here, or teleport randomly to it

  PERMANENT_MECH_FLAGS : ['SEARCHED_FROM_HERE', 'PRESSURE_PLATE_DEPRESSED', 'KNOWN_TO_BE_TRAP_FREE', 'IS_IN_LOOP',
                          'IS_CHOKEPOINT', 'IS_GATE_SITE', 'IS_IN_MACHINE', ],
});

cell.mechFlags = MechFlags;


class CellMemory {
  constructor() {
    this.sprite = make.sprite();
    this.nullify();
  }

  nullify() {
    this.sprite.nullify();
    this.itemKind = null;
    this.itemQuantity = 0;
    this.tile = null;
    this.cellFlags = 0;
    this.cellMechFlags = 0;
    this.tileFlags = 0;
    this.tileMechFlags = 0;
  }

  copy(other) {
    UTILS.copyObject(this, other);
  }
}

types.CellMemory = CellMemory;



class Cell {
  constructor() {
    this.layers = [0,0,0,0];
    this.memory = new types.CellMemory();
    this.nullify();
  }

  copy(other) {
    UTILS.copyObject(this, other);
  }

  nullify() {
    for(let i = 0; i < this.layers.length; ++i) {
      this.layers[i] = 0;
    }

    this.sprites = null;
    this.actor = null;
    this.item = null;
    this.data = {};

    this.flags = Flags.VISIBLE | Flags.IN_FOV | Flags.NEEDS_REDRAW | Flags.CELL_CHANGED;	// non-terrain cell flags
    this.mechFlags = 0;
    this.gasVolume = 0;						// quantity of gas in cell
    this.liquidVolume = 0;
    this.machineNumber = 0;
    this.memory.nullify();
  }

  nullifyTiles(includeGas=true) {
    this.layers[1] = 0;
    this.layers[2] = 0;
    this.liquidVolume = 0;
    if (includeGas) {
      this.layers[3] = 0;
      this.gasVolume = 0;
    }
    this.flags |= Flags.CELL_CHANGED;
  }

  get ground() { return this.layers[0]; }
  get liquid() { return this.layers[1]; }
  get surface() { return this.layers[2]; }
  get gas() { return this.layers[3]; }

  get groundTile() { return TILES[this.layers[0]]; }
  get liquidTile() { return TILES[this.layers[1]]; }
  get surfaceTile() { return TILES[this.layers[2]]; }
  get gasTile() { return TILES[this.layers[3]]; }

  dump() {
    for(let i = this.layers.length - 1; i >= 0; --i) {
      if (!this.layers[i]) continue;
      const tile = TILES[this.layers[i]];
      if (tile.sprite.ch) return tile.sprite.ch;
    }
    return TILES[0].sprite.ch;
  }
  isVisible() { return this.flags & Flags.VISIBLE; }
  isAnyKindOfVisible() { return (this.flags & Flags.ANY_KIND_OF_VISIBLE) || CONFIG.playbackOmniscience; }
  isRevealed() { return this.flags & Flags.REVEALED; }
  hasVisibleLight() { return true; }  // TODO
  lightChanged() { return this.flags & Flags.LIGHT_CHANGED; }

  tile(layer=0) {
    const id = this.layers[layer] || 0;
    return TILES[id];
  }

  *tiles() {
    for(let id of this.layers) {
      if (id) {
        yield TILES[id];
      }
    }
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

  hasAllTileFlags(flags) {
    return (flags & this.tileFlags()) === flags;
  }

  hasTileMechFlag(flagMask) {
    return !!(flagMask & this.tileMechFlags());
  }

  hasAllTileMechFlags(flags) {
    return (flags & this.tileMechFlags()) === flags;
  }

  setFlags(cellFlag=0, cellMechFlag=0) {
    this.flags |= cellFlag;
    this.mechFlags |= cellMechFlag;
    // this.flags |= Flags.NEEDS_REDRAW;
  }

  clearFlags(cellFlag=0, cellMechFlag=0) {
    this.flags &= ~cellFlag;
    this.mechFlags &= ~cellMechFlag;
    // if ((~cellFlag) & Flags.NEEDS_REDRAW) {
    //   this.flags |= Flags.NEEDS_REDRAW;
    // }
  }

  hasTile(id) {
    return this.layers.includes(id);
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
    let bestPriority = -10000;
    for(let tile of this.tiles()) {
      if (tile.priority > bestPriority) {
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
  tileDesc() {
    return this.highestPriorityTile().desc;
  }

  // Retrieves a pointer to the description text of the highest-priority terrain at the given location
  tileText() {
    return this.highestPriorityTile().text;
  }

  isNull() {
    return this.ground == 0;
  }

  isEmpty() {
    return !(this.actor || this.item);
  }

  isPassableNow(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    const tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    if (!(tileFlags & TileFlags.T_PATHING_BLOCKER)) return true;
    if( tileFlags & TileFlags.T_BRIDGE) return true;

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

  isWall(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & TileFlags.T_OBSTRUCTS_EVERYTHING;
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

  obstructsLayer(layer) {
    return layer == TileLayer.SURFACE && this.hasTileFlag(TileFlags.T_OBSTRUCTS_SURFACE_EFFECTS);
  }

  setTile(tileId=0, checkPriority=false) {
    let tile;
    if (typeof tileId === 'string') {
      tile = TILES[tileId];
    }
    else if (tileId instanceof types.Tile) {
      tile = tileId;
    }
    else if (tileId !== 0){
      UTILS.ERROR('Unknown tile: ' + tileId);
    }

    if (!tile) {
      tile = TILES[0];
    }

    const oldTileId = this.layers[tile.layer] || 0;
    const oldTile = TILES[oldTileId] || TILES[0];

    if (checkPriority && oldTile.priority > tile.priority) return false;

    if ((oldTile.flags & TileFlags.T_PATHING_BLOCKER)
      != (tile.flags & TileFlags.T_PATHING_BLOCKER))
    {
      DATA.staleLoopMap = true;
    }

    if ((tile.flags & TileFlags.T_IS_FIRE)
      && !(oldTile.flags & TileFlags.T_IS_FIRE))
    {
      this.setFlags(0, CellMechFlags.CAUGHT_FIRE_THIS_TURN);
    }

    this.layers[tile.layer] = tile.id;

    if (tile.layer > 0 && this.layers[0] == 0) {
      this.layers[0] = 'FLOOR'; // TODO - Not good
    }

    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Flags.CELL_CHANGED);
    return (oldTile.glowLight !== tile.glowLight);
  }

  clearLayers(except, floorTile) {
    floorTile = floorTile === undefined ? this.layers[0] : floorTile;
    for (let layer = 0; layer < this.layers.length; layer++) {
      if (layer != except && layer != TileLayer.GAS) {
          this.layers[layer] = (layer ? 0 : floorTile);
      }
    }
    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Flags.CELL_CHANGED);
  }

  nullifyTileWithFlags(tileFlags, tileMechFlags=0) {
    for( let i = 0; i < this.layers.length; ++i ) {
      const id = this.layers[i];
      if (!id) continue;
      const tile = TILES[id];
      if (tileFlags && tileMechFlags) {
        if ((tile.flags & tileFlags) && (tile.mechFlags & tileMechFlags)) {
          this.layers[i] = 0;
        }
      }
      else if (tileFlags) {
        if (tile.flags & tileFlags) {
          this.layers[i] = 0;
        }
      }
      else if (tileMechFlags) {
        if (tile.flags & tileMechFlags) {
          this.layers[i] = 0;
        }
      }
    }
    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Flags.CELL_CHANGED);
  }

  // EVENTS

  async fireEvent(name, ctx) {
    ctx.cell = this;
    let fired = false;
    for (let tile of this.tiles()) {
      if (!tile.events) continue;
      const ev = tile.events[name];
      if (ev) {
        if (ev.chance && !random.chance(ev.chance)) {
          continue;
        }

        ctx.tile = tile;
        cell.debug('- fireEvent @%d,%d - %s', ctx.x, ctx.y, name);
        fired = await TILE_EVENT.spawn(ev, ctx) || fired;
      }
    }
    if (fired) {
      this.mechFlags |= MechFlags.EVENT_FIRED_THIS_TURN;
    }
    return fired;
  }

  // SPRITES

  addSprite(layer, sprite, priority=50) {

    // this.flags |= Flags.NEEDS_REDRAW;
    this.flags |= Flags.CELL_CHANGED;

    if (!this.sprites) {
      this.sprites = { layer, priority, sprite, next: null };
      return;
    }

    let current = this.sprites;
    while (current.next && ((current.layer < layer) || ((current.layer == layer) && (current.priority <= priority)))) {
      current = current.next;
    }

    const item = { layer, priority, sprite, next: current.next };
    current.next = item;
  }

  removeSprite(sprite) {

    // this.flags |= Flags.NEEDS_REDRAW;
    this.flags |= Flags.CELL_CHANGED;

    if (this.sprites && this.sprites.sprite === sprite) {
      this.sprites = this.sprites.next;
      return;
    }

    let prev = this.sprites;
    let current = this.sprites.next;
    while (current) {
      if (current.sprite === sprite) {
        prev.next = current.next;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  // MEMORY

  storeMemory() {
    const memory = this.memory;
    memory.tileFlags = this.tileFlags();
    memory.tileMechFlags = this.tileMechFlags();
    memory.cellFlags = this.flags;
		memory.cellMechFlags = this.mechFlags;
    memory.tile = this.highestPriorityTile().id;
		if (this.item) {
			memory.itemKind = this.item.kind;
			memory.itemQuantity = this.item.quantity || 1;
		}
		else {
			memory.itemKind = null;
			memory.itemQuantity = 0;
		}
    cell.getAppearance(this, memory.sprite);
  }

}

types.Cell = Cell;


function makeCell(...args) {
  const cell = new types.Cell(...args);
  return cell;
}


make.cell = makeCell;


export function getAppearance(cell, dest) {
  const memory = cell.memory.sprite;
  memory.blackOut();

  for( let tile of cell.tiles() ) {
    memory.plot(tile.sprite);
  }

  let current = cell.sprites;
  while(current) {
    memory.plot(current.sprite);
    current = current.next;
  }

  dest.plot(memory);
  return true;
}

cell.getAppearance = getAppearance;
