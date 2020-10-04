
import { random } from './random.js';
import { grid as GRID } from './grid.js';
import { color as COLOR, colors as COLORS } from './color.js';
import { Flags as ItemFlags } from './item.js';
import { Flags as TileFlags, MechFlags as TileMechFlags, Layer as TileLayer } from './tile.js';
import { Flags as CellFlags, MechFlags as CellMechFlags, cell as CELL } from './cell.js';
import { types, def, make, data as DATA, config as CONFIG, flag as FLAG, utils as UTILS } from './gw.js';


export var map = {};
map.debug = UTILS.NOOP;

const Fl = FLAG.fl;

export const Flags = FLAG.install('map', {
	MAP_CHANGED: Fl(0),
	MAP_STABLE_GLOW_LIGHTS:  Fl(1),
	MAP_STABLE_LIGHTS: Fl(2),
	MAP_ALWAYS_LIT:	Fl(3),
});



export class Map {
	constructor(w, h, opts={}) {
		this.width = w;
		this.height = h;
		this.cells = make.grid(w, h, () => new types.Cell() );
		this.locations = opts.locations || {};
		this.config = Object.assign({}, opts);
		this.config.tick = this.config.tick || 100;
		this.actors = null;
		this.items = null;
	}

	nullify() { this.cells.forEach( (c) => c.nullify() ); }
	dump(fmt) { this.cells.dump(fmt || ((c) => c.dump()) ); }
	cell(x, y)   { return this.cells[x][y]; }

	forEach(fn) { this.cells.forEach( (c, i, j) => fn(c, i, j, this) ); }
	forRect(x, y, w, h, fn) { this.cells.forRect(x, y, w, h, (c, i, j) => fn(c, i, j, this) ); }
	eachNeighbor(x, y, fn, only4dirs) { this.cells.eachNeighbor(x, y, (c, i, j) => fn(c, i, j, this), only4dirs); }

	hasXY(x, y)    		 { return this.cells.hasXY(x, y); }
	isBoundaryXY(x, y) { return this.cells.isBoundaryXY(x, y); }

	changed(v) {
		if (v === true) {
			this.flags |= Flags.MAP_CHANGED;
		}
		else if (v === false) {
			this.flags &= ~Flags.MAP_CHANGED;
		}
		return (this.flags & Flags.MAP_CHANGED);
	}

	hasCellFlag(x, y, flag) 		{ return this.cell(x, y).flags & flag; }
	hasCellMechFlag(x, y, flag) { return this.cell(x, y).mechFlags & flag; }
	hasTileFlag(x, y, flag) 		{ return this.cell(x, y).hasTileFlag(flag); }
	hasTileMechFlag(x, y, flag) { return this.cell(x, y).hasTileMechFlag(flag); }

	redrawCell(cell) {
    // if (cell.isAnyKindOfVisible()) {
      cell.flags |= CellFlags.NEEDS_REDRAW;
  		this.flags |= Flags.MAP_CHANGED;
    // }
	}

	redraw(x, y) {
    const cell = this.cell(x, y);
    this.redrawCell(cell);
	}

  redrawAll() {
    this.forEach( (c) => {
      // if (c.isAnyKindOfVisible()) {
        c.flags |= CellFlags.NEEDS_REDRAW;
      // }
    });
		this.flags |= Flags.MAP_CHANGED;
  }

	markRevealed(x, y) { return this.cell(x, y).markRevealed(); }
	isVisible(x, y)    { return this.cell(x, y).isVisible(); }
	isAnyKindOfVisible(x, y) { return this.cell(x, y).isAnyKindOfVisible(); }
	hasVisibleLight(x, y) { return (this.flags & Flags.MAP_ALWAYS_LIT) || this.cell(x, y).hasVisibleLight(); }

	setFlags(mapFlag, cellFlag, cellMechFlag) {
		if (mapFlag) {
			this.flags |= mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.forEach( (c) => c.setFlags(cellFlag, cellMechFlag) );
		}
		this.changed(true);
	}

	clearFlags(mapFlag=0, cellFlag=0, cellMechFlag=0) {
		if (mapFlag) {
			this.flags &= ~mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.forEach( (cell) => cell.clearFlags(cellFlag, cellMechFlag) );
		}
		this.changed(true);
	}

	setCellFlags(x, y, cellFlag, cellMechFlag) {
		this.cell(x, y).setFlags(cellFlag, cellMechFlag);
		this.flags |= Flags.MAP_CHANGED;
	}

	clearCellFlags(x, y, cellFlags, cellMechFlags) {
		this.cell(x, y).clearFlags(cellFlags, cellMechFlags);
		this.changed(true);
	}

	hasTile(x, y, tile)	{ return this.cells[x][y].hasTile(tile); }

	tileFlags(x, y, limitToPlayerKnowledge)			{ return this.cells[x][y].tileFlags(limitToPlayerKnowledge); }
	tileMechFlags(x, y, limitToPlayerKnowledge)	{ return this.cells[x][y].tileMechFlags(limitToPlayerKnowledge); }

	tileWithFlag(x, y, flag) { return this.cells[x][y].tileWithFlag(flag); }
	tileWithMechFlag(x, y, mechFlag) { return this.cells[x][y].tileWithMechFlag(mechFlag); }

	hasKnownTileFlag(x, y, flagMask) { return this.cells[x][y].memory.tileFlags & flagMask; }

	// hasTileInGroup(x, y, ...groups) { return this.cells[x][y].hasTileInGroup(...groups); }

	discoveredTileFlags(x, y) { return this.cells[x][y].discoveredTileFlags(); }
	hasDiscoveredTileFlag(x, y, flag) { return this.cells[x][y].hasDiscoveredTileFlag(flag); }

	canBePassed(x, y, limitToPlayerKnowledge) { return this.cells[x][y].canBePassed(limitToPlayerKnowledge); }
	isPassableNow(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isPassableNow(limitToPlayerKnowledge); }

	isNull(x, y) { return this.cells[x][y].isNull(); }
  isEmpty(x, y) { return this.cells[x][y].isEmpty(); }
	isObstruction(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isObstruction(limitToPlayerKnowledge); }
  isDoor(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isDoor(limitToPlayerKnowledge); }
  blocksPathing(x, y, limitToPlayerKnowledge) { return this.cells[x][y].blocksPathing(limitToPlayerKnowledge); }
  isLiquid(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isLiquid(limitToPlayerKnowledge); }
  hasGas(x, y, limitToPlayerKnowledge) { return this.cells[x][y].hasGas(limitToPlayerKnowledge); }

	highestPriorityLayer(x, y, skipGas) { return this.cells[x][y].highestPriorityLayer(x, y); }
	highestPriorityTile(x, y, skipGas) { return this.cells[x][y].highestPriorityTile(x, y); }

	tileFlavor(x, y) { return this.cells[x][y].tileFlavor(); }
	tileText(x, y)   { return this.cells[x][y].tileText(); }

	setTile(x, y, tileId, checkPriority) {
		const cell = this.cell(x, y);
		if (cell.setTile(tileId, checkPriority)) {
			this.flags &= ~(Flags.MAP_STABLE_GLOW_LIGHTS);
		}
	  return true;
	}

	nullifyTileWithFlags(x, y, tileFlags, tileMechFlags=0) {
		const cell = this.cell(x, y);
		cell.nullifyTileWithFlags(tileFlags, tileMechFlags);
	}

	nullifyCellTiles(x, y, includeGas) {
		this.changed(true);
		return this.cell(x, y).nullifyTiles(includeGas);
	}

	fill(tileId, boundaryTile) {
		let i, j;
		if (boundaryTile === undefined) {
			boundaryTile = tileId;
		}
		for(i=0; i < this.width; ++i) {
			for(j = 0; j < this.height; ++j) {
				if (this.isBoundaryXY(i, j)) {
					this.setTile(i, j, boundaryTile);
				}
				else {
					this.setTile(i, j, tileId);
				}
			}
		}
	}

	neighborCount(x, y, matchFn, only4dirs) {
		let count = 0;
		this.eachNeighbor(x, y, (...args) => {
			if (matchFn(...args)) ++count;
		}, only4dirs);
		return count;
	}

	passableArcCount(x, y) {
		if (!this.hasXY(x, y)) return -1;
		return this.cells.arcCount(x, y, (c) => c.isPassableNow() );
	}

	diagonalBlocked(x1, y1, x2, y2, limitToPlayerKnowledge) {
	    let tFlags;
	    if (x1 == x2 || y1 == y2) {
	      return false; // If it's not a diagonal, it's not diagonally blocked.
	    }
	    const locFlags1 = this.tileFlags(x1, y2, limitToPlayerKnowledge);
	    if (locFlags1 & TileFlags.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    const locFlags2 = this.tileFlags(x2, y1, limitToPlayerKnowledge);
	    if (locFlags2 & TileFlags.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    return false;
	}

	fillBasicCostGrid(costGrid) {
		this.cells.forEach( (cell, i, j) => {
      if (cell.isNull()) {
        costGrid[i][j] = def.PDS_OBSTRUCTION;
      }
      else {
        costGrid[i][j] = cell.canBePassed() ? 1 : def.PDS_OBSTRUCTION;
      }
    });
	}

	matchingNeighbor(x, y, matcher, only4dirs) {
		const maxIndex = only4dirs ? 4 : 8;
		for(let d = 0; d < maxIndex; ++d) {
			const dir = def.dirs[d];
			const i = x + dir[0];
			const j = y + dir[1];
			if (this.hasXY(i, j)) {
				if (matcher(this.cells[i][j], i, j, this)) return [i, j];
			}
		}
		return null;
	}

	// blockingMap is optional
	matchingXYNear(x, y, matcher, opts={})
	{
	  let loc = [-1,-1];
		let i, j, k;

		const hallwaysAllowed = opts.hallwaysAllowed || opts.hallways || false;
		const blockingMap = opts.blockingMap || null;
		const forbidLiquid = opts.forbidLiquid || opts.forbidLiquids || false;
		const deterministic = opts.deterministic || false;

		const candidateLocs = [];

		// count up the number of candidate locations
		for (k=0; k<Math.max(this.width, this.height) && !candidateLocs.length; k++) {
			for (i = x-k; i <= x+k; i++) {
				for (j = y-k; j <= y+k; j++) {
					if (!this.hasXY(i, j)) continue;
					const cell = this.cell(i, j);
					// if ((i == x-k || i == x+k || j == y-k || j == y+k)
					if ((Math.ceil(UTILS.distanceBetween(x, y, i, j)) == k)
							&& (!blockingMap || !blockingMap[i][j])
							&& matcher(cell, i, j, this)
							&& (!forbidLiquid || cell.liquid == def.NOTHING)
							&& (hallwaysAllowed || this.passableArcCount(i, j) < 2))
	        {
						candidateLocs.push([i, j]);
					}
				}
			}
		}

		if (candidateLocs.length == 0) {
			return null;
		}

		// and pick one
		let randIndex = 0;
		if (deterministic) {
	    randIndex = Math.floor(candidateLocs.length / 2);
		} else {
			randIndex = random.number(candidateLocs.length);
		}
		return candidateLocs[randIndex];
	}



	// fills (*x, *y) with the coordinates of a random cell with
	// no creatures, items or stairs and with either a matching liquid and dungeon type
	// or at least one layer of type terrainType.
	// A dungeon, liquid type of -1 will match anything.
	randomMatchingXY(matcher, opts={}) {
		let failsafeCount = 0;
		let x;
		let y;
		let cell;

		// dungeonType -1 => ignore, otherwise match with 0 = NOTHING, 'string' = MATCH
		// liquidType  -1 => ignore, otherwise match with 0 = NOTHING, 'string' = MATCH

		let retry = true;
		while(retry) {
			failsafeCount++;
			if (failsafeCount >= 500) break;

			x = random.range(0, this.width - 1);
			y = random.range(0, this.height - 1);
			cell = this.cell(x, y);

			if (matcher(cell, x, y, this)) {
				retry = false;
			}
		};

		if (failsafeCount >= 500) {
			// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => FAIL');
			return false;
		}

		// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => ', x, y);
		return [ x, y ];
	}

	// FX

	addFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		cell.addSprite(TileLayer.FX, anim.sprite);
		anim.x = x;
		anim.y = y;
		this.redrawCell(cell);
		return true;
	}

	moveFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.removeSprite(anim.sprite);
    this.redrawCell(oldCell);
		cell.addSprite(TileLayer.FX, anim.sprite);
    this.redrawCell(cell);
		anim.x = x;
		anim.y = y;
		return true;
	}

	removeFx(anim) {
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.removeSprite(anim.sprite);
    this.redrawCell(oldCell);
		this.flags |= Flags.MAP_CHANGED;
		return true;
	}

	// ACTORS

	// will return the PLAYER if the PLAYER is at (x, y).
	actorAt(x, y) { // creature *
		if (!this.hasXY(x, y)) return null;
		const cell = this.cell(x, y);
		return cell.actor;
	}

	addActor(x, y, theActor) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.actor) {
			return false;
		}

		cell.actor = theActor;

		const layer = (theActor === DATA.player) ? TileLayer.PLAYER : TileLayer.ACTOR;
		cell.addSprite(layer, theActor.kind.sprite);

		const flag = (theActor === DATA.player) ? CellFlags.HAS_PLAYER : CellFlags.HAS_MONSTER;
		cell.flags |= flag;
		// if (theActor.flags & ActorFlags.MK_DETECTED)
		// {
		// 	cell.flags |= CellFlags.MONSTER_DETECTED;
		// }

		theActor.x = x;
		theActor.y = y;
    this.redrawCell(cell);

		return true;
	}

	addActorNear(x, y, theActor) {
		const forbidTileFlags = GW.actor.avoidedFlags(theActor);
		const loc = this.matchingXYNear(x, y, (cell, i, j) => {
			if (cell.flags & (CellFlags.HAS_ACTOR)) return false;
			return !cell.hasTileFlag(forbidTileFlags);
		});
		if (!loc || loc[0] < 0) {
			// GW.ui.message(colors.badMessageColor, 'There is no place to put the actor.');
			return false;
		}

		return this.addActor(loc[0], loc[1], theActor);
	}

	moveActor(x, y, actor) {
		if (!this.hasXY(x, y)) return false;
		this.removeActor(actor);

		if (!this.addActor(x, y, actor)) {
			this.addActor(actor.x, actor.y, actor);
			return false;
		}
		return true;
	}

	removeActor(actor) {
		const cell = this.cell(actor.x, actor.y);
		if (cell.actor === actor) {
			cell.actor = null;
			cell.flags &= ~CellFlags.HAS_ACTOR;
			cell.removeSprite(actor.kind.sprite);
      this.redrawCell(cell);
		}
	}

	// dormantAt(x, y) {  // creature *
	// 	if (!(this.cell(x, y).flags & CellFlags.HAS_DORMANT_MONSTER)) {
	// 		return null;
	// 	}
	// 	return this.dormantActors.find( (m) => m.x == x && m.y == y );
	// }
	//
	// addDormant(x, y, theActor) {
	// 	theActor.x = x;
	// 	theActor.y = y;
	// 	this.dormant.add(theActor);
	// 	cell.flags |= (CellFlags.HAS_DORMANT_MONSTER);
	// 	this.flags |= Flags.MAP_CHANGED;
	// 	return true;
	// }
	//
	// removeDormant(actor) {
	// 	const cell = this.cell(actor.x, actor.y);
	// 	cell.flags &= ~(CellFlags.HAS_DORMANT_MONSTER);
	// 	cell.flags |= CellFlags.NEEDS_REDRAW;
	// 	this.flags |= Flags.MAP_CHANGED;
	// 	this.dormant.remove(actor);
	// }

	// ITEMS

	itemAt(x, y) {
		const cell = this.cell(x, y);
		return cell.item;
	}

	addItem(x, y, theItem) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.flags & CellFlags.HAS_ITEM) {
			// GW.ui.message(colors.badMessageColor, 'There is already an item there.');
			return false;
		}
		theItem.x = x;
		theItem.y = y;

		cell.item = theItem;
		theItem.next = this.items;
		this.items = theItem;

		cell.addSprite(TileLayer.ITEM, theItem.kind.sprite);
		cell.flags |= (CellFlags.HAS_ITEM);
    this.redrawCell(cell);

		if ( ((theItem.flags & ItemFlags.ITEM_MAGIC_DETECTED) && GW.item.magicChar(theItem)) ||
					CONFIG.D_ITEM_OMNISCIENCE)
		{
			cell.flags |= CellFlags.ITEM_DETECTED;
		}

		return true;
	}

	addItemNear(x, y, theItem) {
		const loc = this.matchingXYNear(x, y, (cell, i, j) => {
			if (cell.flags & CellFlags.HAS_ITEM) return false;
			return !cell.hasTileFlag(theItem.forbiddenTileFlags());
		});
		if (!loc || loc[0] < 0) {
			// GW.ui.message(colors.badMessageColor, 'There is no place to put the item.');
			return false;
		}

		return this.addItem(loc[0], loc[1], theItem);
	}


	removeItem(theItem, skipRefresh) {
		const x = theItem.x;
		const y = theItem.y;
		const cell = this.cell(x, y);
		if (cell.item !== theItem) return false;

		cell.removeSprite(theItem.kind.sprite);

		cell.item = null;
		if (this.items === theItem) {
			this.items = theItem.next;
		}
		else {
			let prev = this.items;
			let current = prev.next;
			while(current && current !== theItem) {
				prev = current;
				current = prev.next;
			}
			if (current === theItem) {
				prev.next = current.next;
			}
		}

		cell.flags &= ~(CellFlags.HAS_ITEM | CellFlags.ITEM_DETECTED);
    this.redrawCell(cell);
		return true;
	}

	// // PROMOTE
	//
	// async promote(x, y, mechFlag) {
	// 	if (this.hasTileMechFlag(x, y, mechFlag)) {
	// 		const cell = this.cell(x, y);
	// 		for (let tile of cell.tiles()) {
	// 			if (tile.mechFlags & mechFlag) {
	// 				await tile.promote(this, x, y, false);
	// 			}
	// 		}
	// 	}
	// }


	// FOV

	// Returns a boolean grid indicating whether each square is in the field of view of (xLoc, yLoc).
	// forbiddenTerrain is the set of terrain flags that will block vision (but the blocking cell itself is
	// illuminated); forbiddenFlags is the set of map flags that will block vision.
	// If cautiousOnWalls is set, we will not illuminate blocking tiles unless the tile one space closer to the origin
	// is visible to the player; this is to prevent lights from illuminating a wall when the player is on the other
	// side of the wall.
	calcFov(grid, x, y, maxRadius, forbiddenFlags=0, forbiddenTerrain=TileFlags.T_OBSTRUCTS_VISION, cautiousOnWalls=true) {
    maxRadius = maxRadius || (this.width + this.height);
	  const FOV = new types.FOV(grid, (i, j) => {
	    return (!this.hasXY(i, j)) || this.hasCellFlag(i, j, forbiddenFlags) || this.hasTileFlag(i, j, forbiddenTerrain) ;
	  });
	  return FOV.calculate(x, y, maxRadius, cautiousOnWalls);
	}

	// MEMORIES

	storeMemory(x, y) {
		const cell = this.cell(x, y);
		cell.storeMemory();
	}

	storeMemories() {
		let x, y;
		for(x = 0; x < this.width; ++x) {
			for(y = 0; y < this.height; ++y) {
				const cell = this.cell(x, y);
				if (cell.flags & CellFlags.ANY_KIND_OF_VISIBLE) {
					this.storeMemory(x, y);
				}
				cell.flags &= CellFlags.PERMANENT_CELL_FLAGS | CONFIG.PERMANENT_CELL_FLAGS;
				cell.mechFlags &= CellFlags.PERMANENT_MECH_FLAGS | CONFIG.PERMANENT_MECH_FLAGS;
			}
		}
	}

	// TICK

	async tick() {
		this.forEach( (c) => c.mechFlags &= ~(CellMechFlags.EVENT_FIRED_THIS_TURN | CellMechFlags.EVENT_PROTECTED));
		for(let x = 0; x < this.width; ++x) {
			for(let y = 0; y < this.height; ++y) {
				const cell = this.cells[x][y];
				await cell.fireEvent('tick', { map: this, x, y, cell });
			}
		}
	}

}

types.Map = Map;


export function makeMap(w, h, opts={}) {
	const map = new types.Map(w, h, opts);
	if (opts.tile) {
		map.fill(opts.tile, opts.boundary);
	}
	return map;
}

make.map = makeMap;


export function getCellAppearance(map, x, y, dest) {
	dest.blackOut();
	if (!map.hasXY(x, y)) return;
	const cell = map.cell(x, y);

  if (cell.isAnyKindOfVisible() && (cell.flags & CellFlags.CELL_CHANGED)) {
    CELL.getAppearance(cell, dest);
  }
  else if (cell.isRevealed()) {
    dest.plot(cell.memory.sprite);
  }

  if (cell.isVisible()) {
    // keep here to allow for games that do not use fov to work
  }
  else if ( !cell.isRevealed()) {
    dest.blackOut();
  }
  else if (!cell.isAnyKindOfVisible()) {
    COLOR.applyMix(dest.bg, COLORS.black, 30);
    COLOR.applyMix(dest.fg, COLORS.black, 30);
    COLOR.bake(dest.bg);
    COLOR.bake(dest.fg);
  }

  let needDistinctness = false;
  if (cell.flags & (CellFlags.IS_CURSOR | CellFlags.IS_IN_PATH)) {
    const highlight = (cell.flags & CellFlags.IS_CURSOR) ? COLORS.cursorColor : COLORS.yellow;
    if (cell.hasTileMechFlag(TileMechFlags.TM_INVERT_WHEN_HIGHLIGHTED)) {
      COLOR.swap(dest.fg, dest.bg);
    } else {
      // if (!GAME.trueColorMode || !dest.needDistinctness) {
          COLOR.applyMix(dest.fg, highlight, CONFIG.cursorPathIntensity || 20);
      // }
      COLOR.applyMix(dest.bg, highlight, CONFIG.cursorPathIntensity || 20);
    }
    needDistinctness = true;
  }

  if (needDistinctness) {
    COLOR.separate(dest.fg, dest.bg);
  }

	dest.bake();
}

map.getCellAppearance = getCellAppearance;


export function gridDisruptsPassability(theMap, blockingGrid, opts={})
{
	let result;
	let i, j, x, y;

	const walkableGrid = GRID.alloc(theMap.width, theMap.height);
	let disrupts = false;

	const gridOffsetX = opts.gridOffsetX || 0;
	const gridOffsetY = opts.gridOffsetY || 0;
	const bounds = opts.bounds || null;

	x = y = -1;
	// Get all walkable locations after lake added
	theMap.cells.forEach( (cell, i, j) => {
		if (bounds && !bounds.containsXY(i, j)) return;	// outside bounds
		const blockingX = i + gridOffsetX;
		const blockingY = j + gridOffsetY;
		if (cell.isNull()) {
			return; // do nothing
		}
		else if (cell.canBePassed()) {
			if (blockingGrid.hasXY(blockingX, blockingY) && blockingGrid[blockingX][blockingY]) return;
			walkableGrid[i][j] = 1;
		}
		else if (cell.hasTileFlag(TileFlags.T_HAS_STAIRS)) {
			if (blockingGrid.hasXY(blockingX, blockingY) && blockingGrid[blockingX][blockingY]) {
				disrupts = true;
			}
			else {
				walkableGrid[i][j] = 1;
			}
		}
	});

	let first = true;
	for(let i = 0; i < walkableGrid.width && !disrupts; ++i) {
		for(let j = 0; j < walkableGrid.height && !disrupts; ++j) {
			if (walkableGrid[i][j] == 1) {
				if (first) {
					GRID.floodFill(walkableGrid, i, j, 1, 2);
					first = false;
				}
				else {
					disrupts = true;
				}
			}
		}
	}

	GRID.free(walkableGrid);
	return disrupts;
}

map.gridDisruptsPassability = gridDisruptsPassability;


export function addText(map, x, y, text, fg, bg) {
	for(let ch of text) {
		const sprite = make.sprite(ch, fg, bg);
		const fx = { sprite, x, y };
		map.addFx(x++, y, fx);
	}
}

map.addText = addText;


const FP_BASE = 16;
const FP_FACTOR = (1<<16);

// ADAPTED FROM BROGUE 1.7.5
// Simple line algorithm (maybe this is Bresenham?) that returns a list of coordinates
// that extends all the way to the edge of the map based on an originLoc (which is not included
// in the list of coordinates) and a targetLoc.
// Returns the number of entries in the list, and includes (-1, -1) as an additional
// terminus indicator after the end of the list.
export function getLine(map, fromX, fromY, toX, toY) {
	let targetVector = [], error = [], currentVector = [], previousVector = [], quadrantTransform = [];
	let largerTargetComponent, i;
	let currentLoc = [], previousLoc = [];

	const line = [];

	if (fromX == toX && fromY == toY) {
		return line;
	}

	const originLoc = [fromX, fromY];
	const targetLoc = [toX, toY];

	// Neither vector is negative. We keep track of negatives with quadrantTransform.
	for (i=0; i<= 1; i++) {
		targetVector[i] = (targetLoc[i] - originLoc[i]) << FP_BASE;	// FIXME: should use parens?
		if (targetVector[i] < 0) {
			targetVector[i] *= -1;
			quadrantTransform[i] = -1;
		} else {
			quadrantTransform[i] = 1;
		}
		currentVector[i] = previousVector[i] = error[i] = 0;
		currentLoc[i] = originLoc[i];
	}

	// normalize target vector such that one dimension equals 1 and the other is in [0, 1].
	largerTargetComponent = Math.max(targetVector[0], targetVector[1]);
	// targetVector[0] = Math.floor( (targetVector[0] << FP_BASE) / largerTargetComponent);
	// targetVector[1] = Math.floor( (targetVector[1] << FP_BASE) / largerTargetComponent);
	targetVector[0] = Math.floor(targetVector[0] * FP_FACTOR / largerTargetComponent);
	targetVector[1] = Math.floor(targetVector[1] * FP_FACTOR / largerTargetComponent);

	do {
		for (i=0; i<= 1; i++) {

			previousLoc[i] = currentLoc[i];

			currentVector[i] += targetVector[i] >> FP_BASE;
			error[i] += (targetVector[i] == FP_FACTOR ? 0 : targetVector[i]);

			if (error[i] >= Math.floor(FP_FACTOR / 2) ) {
				currentVector[i]++;
				error[i] -= FP_FACTOR;
			}

			currentLoc[i] = Math.floor(quadrantTransform[i]*currentVector[i] + originLoc[i]);

		}

		if (map.hasXY(currentLoc[0], currentLoc[1])) {
			line.push(currentLoc.slice());
		}
		else {
			break;
		}

	} while (true);

	return line;
}

map.getLine = getLine;
