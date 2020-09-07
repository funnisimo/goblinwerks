
import { distanceBetween } from './utils.js';
import { installFlag, Fl } from './flag.js';
import { random } from './random.js';
import { colors } from './color.js';
import { Flags as CellFlags, MechFlags as CellMechFlags, getAppearance as cellGetAppearance } from './cell.js';
import { types, def, make, data as DATA, config as CONFIG } from './gw.js';


export var map = {};


export const Flags = installFlag('map', {
	MAP_CHANGED: Fl(0),
	MAP_STABLE_GLOW_LIGHTS:  Fl(1),
	MAP_STABLE_LIGHTS: Fl(2),
});



export class Map {
	constructor(w, h, opts={}) {
		this.width = w;
		this.height = h;
		this.cells = make.grid(w, h, () => new types.Cell() );
		this.locations = opts.locations || {};
		this.config = Object.assign({}, opts);
		this.fx = [];
	}

	clear() { this.cells.forEach( (c) => c.clear() ); }
	dump() { this.cells.dump((c) => c.dump()); }
	cell(x, y)   { return this.cells[x][y]; }
	eachCell(fn) { this.cells.forEach(fn); }

	hasXY(x, y)    		 { return this.cells.hasXY(x, y); }
	isBoundaryXY(x, y) { return this.cells.isBoundaryXY(x, y); }

	changed(v) {
		if (arguments.length == 1) {
			if (v) {
				this.flags |= Flags.MAP_CHANGED;
			}
			else {
				this.flags &= ~MAP_CHANGED;
			}
		}
		return (this.flags & MAP_CHANGED);
	}

	hasCellFlag(x, y, flag) 		{ return this.cell(x, y).flags & flag; }
	hasCellMechFlag(x, y, flag) { return this.cell(x, y).mechFlags & flag; }
	hasTileFlag(x, y, flag) 		{ return this.cell(x, y).hasTileFlag(flag); }
	hasTileMechFlag(x, y, flag) { return this.cell(x, y).hasTileMechFlag(flag); }

	redrawCell(x, y) {
		this.cell(x, y).redraw();
		this.flags |= Flags.MAP_CHANGED;
	}

	markRevealed(x, y) { return this.cell(x, y).markRevealed(); }
	isVisible(x, y)    { return this.cell(x, y).isVisible(); }
	isAnyKindOfVisible(x, y) { return this.cell(x, y).isAnyKindOfVisible(); }

	setFlags(mapFlag, cellFlag, cellMechFlag) {
		if (mapFlag) {
			this.flags |= mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.eachCell( (c) => c.setFlags(cellFlag, cellMechFlag) );
		}
		this.flags |= Flags.MAP_CHANGED;
	}

	clearFlags(mapFlag, cellFlag, cellMechFlag) {
		if (mapFlag) {
			this.flags &= ~mapFlag;
		}
		if (cellFlag || cellMechFlag) {
			this.eachCell( (cell) => cell.clearFlags(cellFlag, cellMechFlag) );
		}
		this.flags |= Flags.MAP_CHANGED;
	}

	setCellFlags(x, y, cellFlag, cellMechFlag) {
		this.cell(x, y).setFlags(cellFlag, cellMechFlag);
		this.flags |= Flags.MAP_CHANGED;
	}

	clearCellFlags(x, y, cellFlags, cellMechFlags) {
		this.cell(x, y).clearFlags(cellFlags, cellMechFlags);
		this.flags |= Flags.MAP_CHANGED;
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

	setTile(x, y, tileId, force) {
		const cell = this.cell(x, y);
		if (cell.setTile(tileId, force)) {
			this.flags &= ~(Flags.MAP_STABLE_GLOW_LIGHTS);
		}
		this.flags |= Flags.MAP_CHANGED;
	  return true;
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
      if (cell.isEmpty()) {
        costGrid[i][j] = def.PDS_OBSTRUCTION;
      }
      else {
        costGrid[i][j] = cell.canBePassed() ? 1 : def.PDS_OBSTRUCTION;
      }
    });
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
					if ((Math.floor(distanceBetween(x, y, i, j)) == k)
							&& (!blockingMap || !blockingMap[i][j])
							&& matcher(cell, i, j)
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
			randIndex = random.number(candidateLocs.length) - 1;
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

			if (matcher(cell, x, y)) {
				retry = false;
			}
		};

		if (failsafeCount >= 500) {
			// GW.debug.log('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => FAIL');
			return false;
		}

		// GW.debug.log('randomMatchingLocation', dungeonType, liquidType, terrainType, ' => ', x, y);
		return [ x, y ];
	}

	// FX

	addFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		cell.setFlags(CellFlags.HAS_FX);
		anim.x = x;
		anim.y = y;
		this.fx.push(anim);
		return true;
	}

	moveFx(x, y, anim) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.clearFlags(CellFlags.HAS_FX);
		cell.setFlags(CellFlags.HAS_FX);
		anim.x = x;
		anim.y = y;
		return true;
	}

	removeFx(anim) {
		const oldCell = this.cell(anim.x, anim.y);
		oldCell.clearFlags(CellFlags.HAS_FX);
		this.fx = this.fx.filter( (a) => a !== anim );
		return true;
	}

	// ACTORS

	// will return the PLAYER if the PLAYER is at (x, y).
	actorAt(x, y) { // creature *
		let monst; // creature *
		if (!(this.cell(x, y).flags & CellFlags.HAS_ACTOR)) {
			return null;
		}
		if (DATA.player && DATA.player.x == x && DATA.player.y == y) {
			return DATA.player;
		}
	  return this.actors.find( (m) => m.x == x && m.y == y );
	}

	addActor(x, y, theActor) {
		if (!this.hasXY(x, y)) return false;
		const cell = this.cell(x, y);
		if (cell.flags & CellFlags.HAS_ACTOR) {
			// GW.ui.message(colors.badMessageColor, 'There is already an actor there.');
			return false;
		}

		theActor.x = x;
		theActor.y = y;

		let flag = CellFlags.HAS_PLAYER;
		if (theActor !== DATA.player) {
			this.actors.add(theActor);
			flag = CellFlags.HAS_MONSTER;
		}
		cell.flags |= (flag | CellFlags.NEEDS_REDRAW);

		this.flags |= Flags.MAP_CHANGED;
		// if (theActor.flags & ActorFlags.MK_DETECTED)
		// {
		// 	cell.flags |= CellFlags.MONSTER_DETECTED;
		// }

		return true;
	}

	addActorNear(x, y, theActor) {
		const forbidTileFlags = GW.actor.avoidedFlags(theActor);
		const loc = this.getMatchingLocNear(x, y, (cell, i, j) => {
			if (cell.flags & (CellFlags.HAS_ACTOR)) return false;
			return !cell.hasTileFlag(forbidTileFlags);
		});
		if (!loc || loc[0] < 0) {
			// GW.ui.message(colors.badMessageColor, 'There is no place to put the actor.');
			return false;
		}

		return this.addActor(loc[0], loc[1], theActor);
	}

	removeActor(actor) {
		const cell = this.cell(actor.x, actor.y);
		cell.flags &= ~CellFlags.HAS_ACTOR;
		cell.flags |= CellFlags.NEEDS_REDRAW;
		this.flags |= Flags.MAP_CHANGED;
		if (actor !== DATA.player) {
			this.actors.remove(actor);
		}
	}

	dormantAt(x, y) {  // creature *
		if (!(this.cell(x, y).flags & CellFlags.HAS_DORMANT_MONSTER)) {
			return null;
		}
		return this.dormantActors.find( (m) => m.x == x && m.y == y );
	}

	addDormant(x, y, theActor) {
		theActor.x = x;
		theActor.y = y;
		this.dormant.add(theActor);
		cell.flags |= (CellFlags.HAS_DORMANT_MONSTER);
		this.flags |= Flags.MAP_CHANGED;
		return true;
	}

	removeDormant(actor) {
		const cell = this.cell(actor.x, actor.y);
		cell.flags &= ~(CellFlags.HAS_DORMANT_MONSTER);
		cell.flags |= CellFlags.NEEDS_REDRAW;
		this.flags |= Flags.MAP_CHANGED;
		this.dormant.remove(actor);
	}

	// ITEMS

	itemAt(x, y) {
		if (!(this.cell(x, y).flags & CellFlags.HAS_ITEM)) {
			return null;
		}
		return this.items.find( (i) => i.x == x && i.y == y );
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
		this.items.add(theItem);
		cell.flags |= (CellFlags.HAS_ITEM | CellFlags.NEEDS_REDRAW);

		this.flags |= Flags.MAP_CHANGED;
		if ( ((theItem.flags & ItemFlags.ITEM_MAGIC_DETECTED) && GW.item.magicChar(theItem)) ||
					CONFIG.D_ITEM_OMNISCIENCE)
		{
			cell.flags |= CellFlags.ITEM_DETECTED;
		}

		return true;
	}

	addItemNear(x, y, theItem) {
		const loc = this.getMatchingLocNear(x, y, (cell, i, j) => {
			if (cell.flags & CellFlags.HAS_ITEM) return false;
			return !cell.hasTileFlag(TileFlags.T_OBSTRUCTS_ITEMS);
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
		if (this.items.remove(theItem)) {
			this.flags |= Flags.MAP_CHANGED;
			const cell = this.cell(x, y);
			cell.flags &= ~(CellFlags.HAS_ITEM | CellFlags.ITEM_DETECTED);
			cell.flags |= CellFlags.NEEDS_REDRAW;
			return true;
		}
		return false;
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

	// MEMORIES

	storeMemory(x, y) {
		const cell = this.cell(x, y);
		cell.storeMemory(this.itemAt(x, y));
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
	dest.clear();
	if (!map.hasXY(x, y)) return;
	const cell = map.cell(x, y);
	cellGetAppearance(cell, dest);

	if (cell.flags & CellFlags.HAS_PLAYER) {
		dest.plot(DATA.player.kind.sprite);
	}
	else if (cell.flags & CellFlags.HAS_MONSTER) {
		const monst = map.actorAt(x, y);
		if (monst) {
			dest.plot(monst.kind.sprite);
		}
	}

	// add fx (if any)
	if (cell.flags & CellFlags.HAS_FX) {
		map.fx.forEach( (a) => {
			if (a.x != x || a.y != y) return;
			dest.plot(a.sprite);
		});
	}
}

map.getCellAppearance = getCellAppearance;
