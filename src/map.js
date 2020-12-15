
import { random } from './random.js';
import * as Grid from './grid.js';
import * as Color from './color.js';
import { cell as CELL } from './cell.js';
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { types, def, make, data as DATA, config as CONFIG, flag as FLAG, colors as COLORS } from './gw.js';


export var map = {};
map.debug = Utils.NOOP;

const TileLayer = def.layer;

Utils.setDefaults(CONFIG, {
  'map.deepestLevel': 99,
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
    this.flags = Flags.Map.toFlag(Flags.Map.MAP_DEFAULT, opts.flags);
		this.ambientLight = null;
		const ambient = (opts.ambient || opts.ambientLight || opts.light);
		if (ambient) {
			this.ambientLight = make.color(ambient);
		}
    this.lights = null;
    this.id = opts.id;
    this.events = opts.events || {};
	}

  async start() {}

	nullify() { this.cells.forEach( (c) => c.nullify() ); }
	dump(fmt) { this.cells.dump(fmt || ((c) => c.dump()) ); }
	cell(x, y)   { return this.cells[x][y]; }

  eachCell(fn) { this.cells.forEach( (c, i, j) => fn(c, i, j, this) ); }
	forEach(fn)  { this.cells.forEach( (c, i, j) => fn(c, i, j, this) ); }
	forRect(x, y, w, h, fn) { this.cells.forRect(x, y, w, h, (c, i, j) => fn(c, i, j, this) ); }
	eachNeighbor(x, y, fn, only4dirs) { this.cells.eachNeighbor(x, y, (c, i, j) => fn(c, i, j, this), only4dirs); }

	hasXY(x, y)    		 { return this.cells.hasXY(x, y); }
	isBoundaryXY(x, y) { return this.cells.isBoundaryXY(x, y); }

	changed(v) {
		if (v === true) {
			this.flags |= Flags.Map.MAP_CHANGED;
		}
		else if (v === false) {
			this.flags &= ~Flags.Map.MAP_CHANGED;
		}
		return (this.flags & Flags.Map.MAP_CHANGED);
	}

	hasCellFlag(x, y, flag) 		{ return this.cell(x, y).flags & flag; }
	hasCellMechFlag(x, y, flag) { return this.cell(x, y).mechFlags & flag; }
	hasTileFlag(x, y, flag) 		{ return this.cell(x, y).hasTileFlag(flag); }
	hasTileMechFlag(x, y, flag) { return this.cell(x, y).hasTileMechFlag(flag); }

  setCellFlag(x, y, flag) {
    this.cell(x, y).flags |= flag;
  }

	redrawCell(cell) {
    // if (cell.isAnyKindOfVisible()) {
      cell._needsRedraw();
  		this.flags |= Flags.Map.MAP_CHANGED;
    // }
	}

	redrawXY(x, y) {
    const cell = this.cell(x, y);
    this.redrawCell(cell);
	}

  redrawAll() {
    this.forEach( (c) => {
      // if (c.isAnyKindOfVisible()) {
        c.flags |= Flags.Cell.NEEDS_REDRAW;
      // }
    });
		this.flags |= Flags.Map.MAP_CHANGED;
  }

  revealAll() {
    this.forEach( (c) => {
      c.markRevealed();
      c.storeMemory();
    });
  }
	markRevealed(x, y) {
		if (!this.cell(x, y).markRevealed()) return;
    if (DATA.player) {
      DATA.player.invalidateCostMap();
    }
	}
	isVisible(x, y)    { return this.cell(x, y).isVisible(); }
	isAnyKindOfVisible(x, y) { return this.cell(x, y).isAnyKindOfVisible(); }
  isOrWasAnyKindOfVisible(x, y) { return this.cell(x, y).isOrWasAnyKindOfVisible(); }
	hasVisibleLight(x, y) { return this.cell(x, y).hasVisibleLight(); }

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
		this.flags |= Flags.Map.MAP_CHANGED;
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
  isLiquid(x, y, limitToPlayerKnowledge) { return this.cells[x][y].isLiquid(limitToPlayerKnowledge); }
  hasGas(x, y, limitToPlayerKnowledge) { return this.cells[x][y].hasGas(limitToPlayerKnowledge); }

  blocksPathing(x, y, limitToPlayerKnowledge) { return this.cells[x][y].blocksPathing(limitToPlayerKnowledge); }
  blocksVision(x, y) { return this.cells[x][y].blocksVision(); }

	highestPriorityLayer(x, y, skipGas) { return this.cells[x][y].highestPriorityLayer(x, y); }
	highestPriorityTile(x, y, skipGas) { return this.cells[x][y].highestPriorityTile(x, y); }

	tileFlavor(x, y) { return this.cells[x][y].tileFlavor(); }
	tileFlavor(x, y)   { return this.cells[x][y].tileFlavor(); }

	setTile(x, y, tileId, volume=0) {
		return this.cell(x, y)._setTile(tileId, volume, this);
	}

	nullifyTileWithFlags(x, y, tileFlags, tileMechFlags=0) {
		const cell = this.cell(x, y);
		cell.nullifyTileWithFlags(tileFlags, tileMechFlags);
	}

	nullifyCellLayers(x, y, nullLiquid, nullSurface, nullGas) {
		this.changed(true);
		return this.cell(x, y).nullifyLayers(nullLiquid, nullSurface, nullGas);
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
	    if (locFlags1 & Flags.Tile.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    const locFlags2 = this.tileFlags(x2, y1, limitToPlayerKnowledge);
	    if (locFlags2 & Flags.Tile.T_OBSTRUCTS_DIAGONAL_MOVEMENT) {
	        return true;
	    }
	    return false;
	}

	fillCostGrid(costGrid, costFn) {
		costFn = costFn || Utils.ONE;
		this.cells.forEach( (cell, i, j) => {
      if (cell.isNull()) {
        costGrid[i][j] = def.PDS_OBSTRUCTION;
      }
      else {
        costGrid[i][j] = cell.canBePassed() ? costFn(cell, i, j) : def.PDS_OBSTRUCTION;
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
	matchingLocNear(x, y, matcher, opts={})
	{
		let i, j, k;

    if (typeof matcher !== 'function') {
      opts = matcher || opts;
      matcher = opts.match || opts.test;
    }

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
					if ((Math.ceil(Utils.distanceBetween(x, y, i, j)) == k)
							&& (!blockingMap || !blockingMap[i][j])
							&& matcher(cell, i, j, this)
							&& (!forbidLiquid || !cell.liquid)
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
	randomMatchingLoc(opts={}) {
		let failsafeCount = 0;
		let x;
		let y;
		let cell;

    if (typeof opts === 'function') {
      opts = { match: opts };
    }

    const hallwaysAllowed = opts.hallwaysAllowed || opts.hallways || false;
		const blockingMap = opts.blockingMap || null;
		const forbidLiquid = opts.forbidLiquid || opts.forbidLiquids || false;
    const matcher = opts.match || opts.test || Utils.TRUE;
    const forbidCellFlags = opts.forbidCellFlags || 0;
    const forbidTileFlags = opts.forbidTileFlags || 0;
    const forbidTileMechFlags = opts.forbidTileMechFlags || 0;
    const tile = opts.tile || null;
    let tries = opts.tries || 500;

		let retry = true;
		while(retry) {
			tries--;
			if (!tries) break;

			x = random.range(0, this.width - 1);
			y = random.range(0, this.height - 1);
			cell = this.cell(x, y);

			if ((!blockingMap || !blockingMap[x][y])
          && ((!tile) || cell.hasTile(tile))
      		&& (!forbidLiquid || !cell.liquid)
          && (!forbidCellFlags || !(cell.flags & forbidCellFlags))
          && (!forbidTileFlags || !(cell.hasTileFlag(forbidTileFlags)))
          && (!forbidTileMechFlags || !(cell.hasTileMechFlag(forbidTileMechFlags)))
      		&& (hallwaysAllowed || this.passableArcCount(x, y) < 2)
          && matcher(cell, x, y, this))
      {
				retry = false;
			}
		};

		if (!tries) {
			// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => FAIL');
			return false;
		}

		// map.debug('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => ', x, y);
		return [ x, y ];
	}

  // LIGHT

  addLight(x, y, light) {
    const info = { x, y, light, next: this.lights };
    this.lights = info;
    this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS | Flags.Map.MAP_STABLE_GLOW_LIGHTS);
    return info;
  }

  removeLight(info) {
    Utils.removeFromChain(this, 'lights', info);
    this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS | Flags.Map.MAP_STABLE_GLOW_LIGHTS);
  }

  eachLight( fn ) {
    Utils.eachChain(this.lights, (info) => fn(info.light, info.x, info.y));
    this.eachCell( (cell, x, y) => {
      for(let tile of cell.tiles() ) {
        if (tile.light) {
          fn(tile.light, x, y);
        }
      }
    });
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
		this.flags |= Flags.Map.MAP_CHANGED;
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
    theActor.next = this.actors;
		this.actors = theActor;

		const layer = (theActor === DATA.player) ? TileLayer.PLAYER : TileLayer.ACTOR;
		cell.addSprite(layer, theActor.sprite || theActor.kind.sprite);

		const flag = (theActor === DATA.player) ? Flags.Cell.HAS_PLAYER : Flags.Cell.HAS_MONSTER;
		cell.flags |= flag;
		// if (theActor.flags & Flags.Actor.MK_DETECTED)
		// {
		// 	cell.flags |= Flags.Cell.MONSTER_DETECTED;
		// }

    if (theActor.light || theActor.kind.light) {
      this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS);
    }

    // If the player moves or an actor that blocks vision and the cell is visible...
    // -- we need to update the FOV
    if (theActor.isPlayer() || (cell.isAnyKindOfVisible() && (theActor.kind.flags & Flags.ActorKind.AK_BLOCKS_VISION))) {
      this.flags |= Flags.Map.MAP_FOV_CHANGED;
    }

		theActor.x = x;
		theActor.y = y;
    this.redrawCell(cell);

		return true;
	}

	addActorNear(x, y, theActor) {
		const forbidTileFlags = GW.actor.avoidedFlags(theActor);
		const loc = this.matchingLocNear(x, y, (cell, i, j) => {
			if (cell.flags & (Flags.Cell.HAS_ACTOR)) return false;
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
    if (actor.light || actor.kind.light) {
      this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS);
    }

		return true;
	}

	removeActor(actor) {
    if (!this.hasXY(actor.x, actor.y)) return false;
		const cell = this.cell(actor.x, actor.y);
		if (cell.actor === actor) {
			cell.actor = null;
      Utils.removeFromChain(this, 'actors', actor);
			cell.flags &= ~Flags.Cell.HAS_ACTOR;
      cell.removeSprite(actor.sprite);
			cell.removeSprite(actor.kind.sprite);

      if (actor.light || actor.kind.light) {
        this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS);
      }
      // If the player moves or an actor that blocks vision and the cell is visible...
      // -- we need to update the FOV
      if (actor.isPlayer() || (cell.isAnyKindOfVisible() && (actor.kind.flags & Flags.ActorKind.AK_BLOCKS_VISION))) {
        this.flags |= Flags.Map.MAP_FOV_CHANGED;
      }

      this.redrawCell(cell);
      return true;
		}
    return false;
	}

  killActorAt(x, y) {
    const actor = this.actorAt(x, y);
    if (!actor) return false;
    this.removeActor(actor);
    actor.kill();
    return true;
  }

	// dormantAt(x, y) {  // creature *
	// 	if (!(this.cell(x, y).flags & Flags.Cell.HAS_DORMANT_MONSTER)) {
	// 		return null;
	// 	}
	// 	return this.dormantActors.find( (m) => m.x == x && m.y == y );
	// }
	//
	// addDormant(x, y, actor) {
	// 	theActor.x = x;
	// 	theActor.y = y;
	// 	this.dormant.add(theActor);
	// 	cell.flags |= (Flags.Cell.HAS_DORMANT_MONSTER);
	// 	this.flags |= Flags.Map.MAP_CHANGED;
	// 	return true;
	// }
	//
	// removeDormant(actor) {
	// 	const cell = this.cell(actor.x, actor.y);
	// 	cell.flags &= ~(Flags.Cell.HAS_DORMANT_MONSTER);
	// 	cell.flags |= Flags.Cell.NEEDS_REDRAW;
	// 	this.flags |= Flags.Map.MAP_CHANGED;
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
		if (cell.flags & Flags.Cell.HAS_ITEM) {
			// GW.ui.message(colors.badMessageColor, 'There is already an item there.');
			return false;
		}
		theItem.x = x;
		theItem.y = y;

		cell.item = theItem;
		theItem.next = this.items;
		this.items = theItem;

		cell.addSprite(TileLayer.ITEM, theItem.sprite || theItem.kind.sprite);
		cell.flags |= (Flags.Cell.HAS_ITEM);

    if (theItem.light || theItem.kind.light) {
      this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS);
    }

    this.redrawCell(cell);

		if ( ((theItem.flags & Flags.Item.ITEM_MAGIC_DETECTED) && GW.item.magicChar(theItem)) ||
					CONFIG.D_ITEM_OMNISCIENCE)
		{
			cell.flags |= Flags.Cell.ITEM_DETECTED;
		}

		return true;
	}

	addItemNear(x, y, theItem) {
		const loc = this.matchingLocNear(x, y, (cell, i, j) => {
			if (cell.flags & Flags.Cell.HAS_ITEM) return false;
			return !cell.hasTileFlag(theItem.kind.forbiddenTileFlags());
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
    if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.item !== theItem) return false;

    cell.removeSprite(theItem.sprite);
		cell.removeSprite(theItem.kind.sprite);

		cell.item = null;
    Utils.removeFromChain(this, 'items', theItem);

    if (theItem.light || theItem.kind.light) {
      this.flags &= ~(Flags.Map.MAP_STABLE_LIGHTS);
    }

		cell.flags &= ~(Flags.Cell.HAS_ITEM | Flags.Cell.ITEM_DETECTED);
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



  gridDisruptsPassability(blockingGrid, opts={})
  {
  	let result;
  	let i, j, x, y;

  	const walkableGrid = Grid.alloc(this.width, this.height);
  	let disrupts = false;

  	const gridOffsetX = opts.gridOffsetX || 0;
  	const gridOffsetY = opts.gridOffsetY || 0;
  	const bounds = opts.bounds || null;

  	x = y = -1;
  	// Get all walkable locations after lake added
  	this.cells.forEach( (cell, i, j) => {
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
  		else if (cell.hasTileFlag(Flags.Tile.T_HAS_STAIRS)) {
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
  					Grid.floodFill(walkableGrid, i, j, 1, 2);
  					first = false;
  				}
  				else {
  					disrupts = true;
  				}
  			}
  		}
  	}

  	Grid.free(walkableGrid);
  	return disrupts;
  }

	// FOV

	// Returns a boolean grid indicating whether each square is in the field of view of (xLoc, yLoc).
	// forbiddenTerrain is the set of terrain flags that will block vision (but the blocking cell itself is
	// illuminated); forbiddenFlags is the set of map flags that will block vision.
	// If cautiousOnWalls is set, we will not illuminate blocking tiles unless the tile one space closer to the origin
	// is visible to the player; this is to prevent lights from illuminating a wall when the player is on the other
	// side of the wall.
	calcFov(grid, x, y, maxRadius, forbiddenFlags=0, forbiddenTerrain=Flags.Tile.T_OBSTRUCTS_VISION, cautiousOnWalls=false) {
    maxRadius = maxRadius || (this.width + this.height);
    grid.fill(0);
    const map = this;
	  const FOV = new types.FOV({
      isBlocked(i, j) {
	       return (!grid.hasXY(i, j)) || map.hasCellFlag(i, j, forbiddenFlags) || map.hasTileFlag(i, j, forbiddenTerrain) ;
	    },
      calcRadius(x, y) {
        return Math.sqrt(x**2 + y ** 2);
      },
      setVisible(x, y, v) {
        grid[x][y] = 1;
      },
      hasXY(x, y) { return grid.hasXY(x, y); }
    });
	  return FOV.calculate(x, y, maxRadius, cautiousOnWalls);
	}

  losFromTo(a, b) {
    const line = getLine(this, a.x, a.y, b.x, b.y);
    if ((!line) || (!line.length)) return false;

    return !line.some( (loc) => {
      return this.blocksVision(loc[0], loc[1]);
    });
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
				if (cell.flags & Flags.Cell.ANY_KIND_OF_VISIBLE) {
					this.storeMemory(x, y);
				}
				cell.flags &= Flags.Cell.PERMANENT_CELL_FLAGS | CONFIG.PERMANENT_CELL_FLAGS;
				cell.mechFlags &= Flags.Cell.PERMANENT_MECH_FLAGS | CONFIG.PERMANENT_MECH_FLAGS;
			}
		}
	}

	// TICK

	async tick() {
    map.debug('tick');
		this.forEach( (c) => c.mechFlags &= ~(Flags.CellMech.EVENT_FIRED_THIS_TURN | Flags.CellMech.EVENT_PROTECTED));
		for(let x = 0; x < this.width; ++x) {
			for(let y = 0; y < this.height; ++y) {
				const cell = this.cells[x][y];
				await cell.fireEvent('tick', { map: this, x, y, cell, safe: true });
			}
		}
    map.updateLiquid(this);
	}

  resetEvents() {
    this.forEach( (c) => c.mechFlags &= ~(Flags.CellMech.EVENT_FIRED_THIS_TURN | Flags.CellMech.EVENT_PROTECTED));
  }

}

types.Map = Map;


export function makeMap(w, h, opts={}) {
  if (typeof opts === 'string') {
    opts = { tile: opts };
  }
	const map = new types.Map(w, h, opts);
	const floor = opts.tile || opts.floor || opts.floorTile;
	const boundary = opts.boundary || opts.wall || opts.wallTile;
	if (floor) {
		map.fill(floor, boundary);
	}
  if (!DATA.map) {
    DATA.map = map;
  }
	return map;
}

make.map = makeMap;


export function getCellAppearance(map, x, y, dest) {
	dest.blackOut();
	if (!map.hasXY(x, y)) return;
	const cell = map.cell(x, y);

  if (cell.isAnyKindOfVisible() && (cell.flags & (Flags.Cell.CELL_CHANGED | Flags.Cell.NEEDS_REDRAW))) {
    CELL.getAppearance(cell, dest);
  }
  else if (cell.isRevealed()) {
    dest.drawSprite(cell.memory.sprite);
  }

  if (cell.isVisible()) {
    // keep here to allow for games that do not use fov to work
  }
  else if ( !cell.isRevealed()) {
    dest.blackOut();
  }
  else if (!cell.isAnyKindOfVisible()) {
    dest.bg.mix(COLORS.black, 30);
    dest.fg.mix(COLORS.black, 30);
  }

  let needDistinctness = false;
  if (cell.flags & (Flags.Cell.IS_CURSOR | Flags.Cell.IS_IN_PATH)) {
    const highlight = (cell.flags & Flags.Cell.IS_CURSOR) ? COLORS.cursorColor : COLORS.yellow;
    if (cell.hasTileMechFlag(Flags.TileMech.TM_INVERT_WHEN_HIGHLIGHTED)) {
      Color.swap(dest.fg, dest.bg);
    } else {
      // if (!GAME.trueColorMode || !dest.needDistinctness) {
          // dest.fg.mix(highlight, CONFIG.cursorPathIntensity || 20);
      // }
      dest.bg.mix(highlight, CONFIG.cursorPathIntensity || 20);
    }
    needDistinctness = true;
  }

  if (needDistinctness) {
    Color.separate(dest.fg, dest.bg);
  }

	// dest.bake();
}

map.getCellAppearance = getCellAppearance;



export function addText(map, x, y, text, fg, bg, layer) {
	for(let ch of text) {
		const sprite = make.sprite(ch, fg, bg);
    const cell = map.cell(x++, y);
    cell.addSprite(layer || TileLayer.GROUND, sprite);
	}
}

map.addText = addText;


export function updateGas(map) {

  if (map.flags & Flags.Map.MAP_NO_GAS) return;

  const newVolume = Grid.alloc(map.width, map.height);

	map.forEach( (c, x, y) => {
		if (c.hasTileFlag(Flags.Tile.T_OBSTRUCTS_GAS)) return;

    let liquid = c.gas;
    let highest = c.gasVolume;
  	let sum = c.gasVolume;
    let count = 1;
    map.eachNeighbor(x, y, (n) => {
			if (n.hasTileFlag(Flags.Tile.T_OBSTRUCTS_GAS)) return;
    	++count;
      sum += n.gasVolume;
      if (n.gasVolume > highest) {
        gas = n.gas;
        highest = n.gasVolume;
      }
    });

    if (!sum) return;

    const newVol = Math.floor(sum / count);
    if (c.gas != gas) {
      c._setTile(gas, newVol, this); // volume = 1 to start, will change later
    }
    newVolume[x][y] += newVol;

    const rem = sum - (count * Math.floor(sum/count));
    if (rem && (random.number(count) < rem)) {
    	newVolume[x][y] += 1;
    }
    // disperses
    // if (newVolume[x][y] && random.chance(20)) {
    // 	newVolume[x][y] -= 1;
    // }
	});

  let hasGas = false;
  newVolume.forEach( (v, i, j) => {
    const cell =  map.cell(i, j);
    if (v) {
      hasGas = true;
      if (cell.gas && cell.gasVolume !== v) {
        cell.gasVolume = v;
        map.redrawCell(cell);
      }
    }
    else if (cell.gas) {
      cell.clearLayer('GAS');
      map.redrawCell(cell);
    }
  });

  if (hasGas) {
    map.flags &= ~Flags.Map.MAP_NO_GAS;
  }
  else {
    map.flags |= Flags.Map.MAP_NO_GAS;
  }
  map.changed(true);

  Grid.free(newVolume);
}

map.updateGas = updateGas;



export function updateLiquid(map) {

  if (map.flags & Flags.Map.MAP_NO_LIQUID) return;

  const newVolume = Grid.alloc(map.width, map.height);

	map.forEach( (c, x, y) => {
		if (c.hasTileFlag(Flags.Tile.T_OBSTRUCTS_LIQUID)) return;

    let liquid = c.liquid;
    let highest = c.liquidVolume;
    let count = 1;

    map.eachNeighbor(x, y, (n) => {
			if (n.hasTileFlag(Flags.Tile.T_OBSTRUCTS_LIQUID)) return;
    	++count;
      if (n.liquidVolume > highest) {
        liquid = n.liquid;
        highest = n.liquidVolume;
      }
    });

    let newVol = c.liquidVolume;
    if ((newVol > 10) && (count > 1)) {
      let spread = Math.round(0.2 * c.liquidVolume);
      if (spread > 5) {
        newVol -= spread;
        if (c.liquid != liquid) {
          c._setTile(liquid, newVol, this); // volume = 1 to start, will change later
        }

        // spread = Math.floor(spread / count);
        if (spread) {
          newVolume.eachNeighbor(x, y, (v, i, j) => {
            newVolume[i][j] = v + spread;
          });
        }
      }
    }

    newVolume[x][y] += newVol;

    // disperses
    const tile = c.liquidTile;
    if (newVolume[x][y] && random.chance(tile.dissipate, 10000)) {
    	newVolume[x][y] -= 1;
    }
	});

  let hasLiquid = false;
  newVolume.forEach( (v, i, j) => {
    const cell =  map.cell(i, j);
    if (v) {
      hasLiquid = true;
      if (cell.liquid && cell.liquidVolume !== v) {
        cell.liquidVolume = v;
        map.redrawCell(cell);
      }
    }
    else if (cell.liquid) {
      cell.clearLayer('LIQUID');
      map.redrawCell(cell);
    }
  });

  if (hasLiquid) {
    map.flags &= ~Flags.Map.MAP_NO_LIQUID;
  }
  else {
    map.flags |= Flags.Map.MAP_NO_LIQUID;
  }

  map.changed(true);

  Grid.free(newVolume);
}

map.updateLiquid = updateLiquid;


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
