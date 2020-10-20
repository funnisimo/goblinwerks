
import { random } from './random.js';
import * as Flags from './flags.js';
import { colors as COLORS, color as COLOR } from './color.js';
import { tileEvent as TILE_EVENT } from './tileEvent.js';

import { types, make, def, config as CONFIG, data as DATA, flag as FLAG, tiles as TILES, utils as UTILS } from './gw.js';

export var cell = {};

const TileLayer = def.layer;

cell.debug = UTILS.NOOP;

COLOR.install('cursorColor', 25, 100, 150);
CONFIG.cursorPathIntensity = 50;



class CellMemory {
  constructor() {
    this.sprite = make.sprite();
    this.nullify();
  }

  nullify() {
    this.sprite.nullify();
    this.itemKind = null;
    this.itemQuantity = 0;
    this.actorKind = null;
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

    this.flags = Flags.Cell.VISIBLE | Flags.Cell.IN_FOV | Flags.Cell.NEEDS_REDRAW | Flags.Cell.CELL_CHANGED;	// non-terrain cell flags
    this.mechFlags = 0;
    this.gasVolume = 0;						// quantity of gas in cell
    this.liquidVolume = 0;
    this.machineNumber = 0;
    this.memory.nullify();
  }

  nullifyLayers(nullLiquid, nullSurface, nullGas) {
    if (nullLiquid) {
      this.layers[1] = 0;
      this.liquidVolume = 0;
    }
    if (nullSurface) {
      this.layers[2] = 0;
    }
    if (nullGas) {
      this.layers[3] = 0;
      this.gasVolume = 0;
    }
    this.flags |= Flags.Cell.CELL_CHANGED;
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
  changed() { return this.flags & Flags.Cell.CELL_CHANGED; }
  isVisible() { return this.flags & Flags.Cell.VISIBLE; }
  isAnyKindOfVisible() { return (this.flags & Flags.Cell.ANY_KIND_OF_VISIBLE) || CONFIG.playbackOmniscience; }
  isOrWasAnyKindOfVisible() { return (this.flags & Flags.Cell.IS_WAS_ANY_KIND_OF_VISIBLE) || CONFIG.playbackOmniscience; }
  isRevealed(orMapped) {
    const flag = Flags.Cell.REVEALED | (orMapped ? Flags.Cell.MAGIC_MAPPED : 0);
    return this.flags & flag;
  }
  listInSidebar() {
    return this.hasTileMechFlag(Flags.TileMech.TM_LIST_IN_SIDEBAR);
  }

  hasVisibleLight() { return true; }  // TODO
  isDark() { return false; }  // TODO
  lightChanged() { return this.flags & Flags.Cell.LIGHT_CHANGED; }

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
    // this.flags |= Flags.Cell.NEEDS_REDRAW;
  }

  clearFlags(cellFlag=0, cellMechFlag=0) {
    this.flags &= ~cellFlag;
    this.mechFlags &= ~cellMechFlag;
    // if ((~cellFlag) & Flags.Cell.NEEDS_REDRAW) {
    //   this.flags |= Flags.Cell.NEEDS_REDRAW;
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

  tileDesc() {
    return this.highestPriorityTile().desc;
  }

  tileFlavor() {
    return this.highestPriorityTile().getFlavor();
  }

  getName(opts={}) {
    return this.highestPriorityTile().getName(opts);
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
    if (!(tileFlags & Flags.Tile.T_PATHING_BLOCKER)) return true;
    if( tileFlags & Flags.Tile.T_BRIDGE) return true;

    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    return limitToPlayerKnowledge ? false : this.isSecretDoor();
  }

  canBePassed(limitToPlayerKnowledge) {
    if (this.isPassableNow(limitToPlayerKnowledge)) return true;
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileMechFlags = (useMemory) ? this.memory.tileMechFlags : this.tileMechFlags();
    if (tileMechFlags & Flags.TileMech.TM_CONNECTS_LEVEL) return true;
    return ((tileMechFlags & Flags.TileMech.TM_PROMOTES) && !(this.promotedTileFlags() & Flags.Tile.T_PATHING_BLOCKER));
  }

  isWall(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags.Tile.T_OBSTRUCTS_EVERYTHING;
  }

  isObstruction(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags.Tile.T_OBSTRUCTS_DIAGONAL_MOVEMENT;
  }

  isDoor(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags.Tile.T_IS_DOOR;
  }

  isSecretDoor(limitToPlayerKnowledge) {
    if (limitToPlayerKnowledge) return false;
    const tileMechFlags = this.tileMechFlags();
    return (tileMechFlags & Flags.TileMech.TM_IS_SECRET) && !(this.discoveredTileFlags() & Flags.Tile.T_PATHING_BLOCKER)
  }

  blocksPathing(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags.Tile.T_PATHING_BLOCKER;
  }

  isLiquid(limitToPlayerKnowledge) {
    const useMemory = limitToPlayerKnowledge && !this.isAnyKindOfVisible();
    let tileFlags = (useMemory) ? this.memory.tileFlags : this.tileFlags();
    return tileFlags & Flags.Tile.T_IS_LIQUID;
  }

  markRevealed() {
    this.flags &= ~Flags.Cell.STABLE_MEMORY;
    if (!(this.flags & Flags.Cell.REVEALED)) {
      this.flags |= Flags.Cell.REVEALED;
      if (!this.hasTileFlag(Flags.Tile.T_PATHING_BLOCKER)) {
        DATA.xpxpThisTurn++;
      }
    }
  }

  obstructsLayer(layer) {
    return layer == TileLayer.SURFACE && this.hasTileFlag(Flags.Tile.T_OBSTRUCTS_SURFACE_EFFECTS);
  }

  setTile(tileId=0, volume=0) {
    let tile;
    if (typeof tileId === 'string') {
      tile = TILES[tileId];
    }
    else if (tileId instanceof types.Tile) {
      tile = tileId;
      tileId = tile.id;
    }
    else if (tileId !== 0){
      UTILS.ERROR('Unknown tile: ' + tileId);
    }

    if (!tile) {
      UTILS.WARN('Unknown tile - ' + tileId);
      tile = TILES[0];
      tileId = 0;
    }

    const oldTileId = this.layers[tile.layer] || 0;
    const oldTile = TILES[oldTileId] || TILES[0];

    if ((oldTile.flags & Flags.Tile.T_PATHING_BLOCKER)
      != (tile.flags & Flags.Tile.T_PATHING_BLOCKER))
    {
      DATA.staleLoopMap = true;
    }

    if ((tile.flags & Flags.Tile.T_IS_FIRE)
      && !(oldTile.flags & Flags.Tile.T_IS_FIRE))
    {
      this.setFlags(0, Flags.CellMech.CAUGHT_FIRE_THIS_TURN);
    }

    this.layers[tile.layer] = tile.id;
    if (tile.layer == TileLayer.LIQUID) {
      this.liquidVolume = volume + (tileId == oldTileId ? this.liquidVolume : 0);
    }
    else if (tile.layer == TileLayer.GAS) {
      this.gasVolume = volume + (tileId == oldTileId ? this.vasVolume : 0);
    }

    if (tile.layer > 0 && this.layers[0] == 0) {
      this.layers[0] = 'FLOOR'; // TODO - Not good
    }

    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Flags.Cell.CELL_CHANGED);
    return (oldTile.glowLight !== tile.glowLight);
  }

  clearLayer(layer) {
    if (typeof layer === 'string') layer = TileLayer[layer];
    if (this.layers[layer]) {
      // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
      this.flags |= (Flags.Cell.CELL_CHANGED);
    }
    this.layers[layer] = 0;
    if (layer == TileLayer.LIQUID) {
      this.liquidVolume = 0;
    }
    else if (layer == TileLayer.GAS) {
      this.gasVolume = 0;
    }
  }

  clearLayers(except, floorTile) {
    floorTile = floorTile === undefined ? this.layers[0] : floorTile;
    for (let layer = 0; layer < this.layers.length; layer++) {
      if (layer != except && layer != TileLayer.GAS) {
          this.layers[layer] = (layer ? 0 : floorTile);
      }
    }
    // this.flags |= (Flags.NEEDS_REDRAW | Flags.CELL_CHANGED);
    this.flags |= (Flags.Cell.CELL_CHANGED);
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
    this.flags |= (Flags.Cell.CELL_CHANGED);
  }

  // EVENTS

  async fireEvent(name, ctx) {
    ctx.cell = this;
    let fired = false;
    cell.debug('fire event - %s', name);
    for (let tile of this.tiles()) {
      if (!tile.events) continue;
      const ev = tile.events[name];
      if (ev) {
        cell.debug(' - has event');
        if (ev.chance && !random.chance(ev.chance, 10000)) {
          continue;
        }

        ctx.tile = tile;
        cell.debug(' - spawn event @%d,%d - %s', ctx.x, ctx.y, name);
        fired = await TILE_EVENT.spawn(ev, ctx) || fired;
        cell.debug(' - spawned');
        if (fired) {
          break;
        }
      }
    }
    if (fired) {
      // this.mechFlags |= Flags.CellMech.EVENT_FIRED_THIS_TURN;
    }
    return fired;
  }

  hasTileWithEvent(name) {
    for (let tile of this.tiles()) {
      if (tile.hasEvent(name)) return true;
    }
    return false;
  }

  // SPRITES

  addSprite(layer, sprite, priority=50) {

    // this.flags |= Flags.NEEDS_REDRAW;
    this.flags |= Flags.Cell.CELL_CHANGED;

    if (!this.sprites || ((this.sprites.layer > layer) || ((this.sprites.layer == layer) && (this.sprites.priority > priority)))) {
      this.sprites = { layer, priority, sprite, next: this.sprites };
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
    this.flags |= Flags.Cell.CELL_CHANGED;

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
    memory.actorKind = (this.actor ? this.actor.kind : null);
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
    let alpha = 100;
    if (tile.layer == TileLayer.LIQUID) {
      alpha = UTILS.clamp(cell.liquidVolume || 0, 20, 100);
    }
    else if (tile.layer == TileLayer.GAS) {
      alpha = UTILS.clamp(cell.gasVolume || 0, 20, 100);
    }
    memory.plot(tile.sprite, alpha);
  }

  let current = cell.sprites;
  while(current) {
    memory.plot(current.sprite);
    current = current.next;
  }

  memory.bake();
  dest.plot(memory);
  return true;
}

cell.getAppearance = getAppearance;
