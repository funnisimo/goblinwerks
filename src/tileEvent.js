
import { color as COLOR } from './color.js';
import { random } from './random.js';
import { grid as GRID } from './grid.js';
import { tiles as TILES, Flags as TileFlags, tile as TILE, Layer as TileLayer } from './tile.js';
import { Flags as CellFlags, MechFlags as CellMechFlags } from './cell.js';
import { KindFlags as ItemKindFlags } from './item.js';
import { map as MAP } from './map.js';
import { types, make, def, data as DATA, ui as UI, message as MSG, flag as FLAG, utils as UTILS, itemKinds as ITEMKINDS } from './gw.js';


export var tileEvent = {};
export var tileEvents = {};

tileEvent.debug = UTILS.NOOP;

const Fl = FLAG.fl;

export const Flags = FLAG.install('tileEvent', {
	DFF_SUBSEQ_ALWAYS							: Fl(0),	// Always fire the subsequent event, even if no tiles changed.
	DFF_SUBSEQ_EVERYWHERE			    : Fl(1),	// Subsequent DF spawns in every cell that this DF spawns in, instead of only the origin
	DFF_TREAT_AS_BLOCKING			    : Fl(2),	// If filling the footprint of this DF with walls would disrupt level connectivity, then abort.
	DFF_PERMIT_BLOCKING				    : Fl(3),	// Generate this DF without regard to level connectivity.
	DFF_ACTIVATE_DORMANT_MONSTER	: Fl(4),	// Dormant monsters on this tile will appear -- e.g. when a statue bursts to reveal a monster.
	DFF_BLOCKED_BY_OTHER_LAYERS		: Fl(6),	// Will not propagate into a cell if any layer in that cell has a superior priority.
	DFF_SUPERPRIORITY				      : Fl(7),	// Will overwrite terrain of a superior priority.
  DFF_AGGRAVATES_MONSTERS       : Fl(8),  // Will act as though an aggravate monster scroll of effectRadius radius had been read at that point.
  DFF_RESURRECT_ALLY            : Fl(9),  // Will bring back to life your most recently deceased ally.
	DFF_EMIT_EVENT								: Fl(10), // Will emit the event when activated
	DFF_NO_REDRAW_CELL						: Fl(11),
	DFF_ABORT_IF_BLOCKS_MAP				: Fl(12),

	DFF_ALWAYS_FIRE								: Fl(14),	// Fire even if the cell is marked as having fired this turn
	DFF_NO_MARK_FIRED							: Fl(15),	// Do not mark this cell as having fired an event
	// MUST_REPLACE_LAYER
	// NEEDS_EMPTY_LAYER
	DFF_PROTECTED									: Fl(18),

	DFF_SPREAD_CIRCLE							: Fl(20),	// Spread in a circle around the spot (using FOV), radius calculated using spread+decrement
	DFF_SPREAD_LINE								: Fl(21),	// Spread in a line in one random direction

	DFF_CLEAR_CELL			  	: Fl(22),	// Erase other terrain in the footprint of this DF.
	DFF_EVACUATE_CREATURES	: Fl(23),	// Creatures in the DF area get moved outside of it
	DFF_EVACUATE_ITEMS			: Fl(24),	// Creatures in the DF area get moved outside of it

});

tileEvent.Flags = Flags;


class TileEvent {
	constructor(opts={})
	{
		if (typeof opts === 'function') {
			opts = {
				fn: opts,
			};
		}

		this.tile = opts.tile || 0;
		this.fn = opts.fn || null;
		this.item = opts.item || null;
		this.chance = opts.chance || 0;
		this.volume = opts.volume || 0;

		// spawning pattern:
		this.spread = opts.spread || 0;
		this.radius = opts.radius || 0;
		this.decrement = opts.decrement || 0;
		this.flags = Flags.toFlag(opts.flags);
		this.matchTile = opts.matchTile || opts.needs || 0;	/* ENUM tileType */
		this.next = opts.next || null;	/* ENUM makeEventTypes */

		this.message = opts.message || null;
	  this.lightFlare = opts.flare || 0;
		this.flashColor = opts.flash ? COLOR.from(opts.flash) : null;
		// this.effectRadius = radius || 0;
		this.messageDisplayed = false;
		this.eventName = opts.event || null;	// name of the event to emit when activated
		this.id = opts.id || null;
	}

}

types.TileEvent = TileEvent;


// Dungeon features, spawned from Architect.c:
function makeEvent(opts) {
	const te = new types.TileEvent(opts);
	return te;
}

make.tileEvent = makeEvent;


export function installEvent(id, event) {
	if (arguments.length > 2 || !(event instanceof types.TileEvent)) {
		event = make.tileEvent(...[].slice.call(arguments, 1));
	}
  tileEvents[id] = event;
	if (event) tileEvent.id = id;
	return event;
}

tileEvent.install = installEvent;

installEvent('DF_NONE');



export function resetAllMessages() {
	Object.values(tileEvents).forEach( (f) => {
		if (f instanceof types.Event) {
			f.messageDisplayed = false;
		}
	});
}

tileEvent.resetAllMessages = resetAllMessages;



// returns whether the feature was successfully generated (false if we aborted because of blocking)
async function spawn(feat, ctx) {
	let i, j, layer;
	let monst;
	let tile, itemKind;

	if (!feat) return false;
	if (!ctx) return false;

	if (typeof feat === 'string') {
		const name = feat;
		feat = tileEvents[feat];
		if (!feat) UTILS.ERROR('Unknown tile Event: ' + name);
	}

	if (typeof feat === 'function') {
		return feat(ctx);
	}

	const map = ctx.map;
	const x = ctx.x;
	const y = ctx.y;

	if (!map || x === undefined || y === undefined) {
		UTILS.ERROR('MAP, x, y are required in context.');
	}

	if (map.hasCellMechFlag(x, y, CellMechFlags.EVENT_FIRED_THIS_TURN)) {
		if (!(feat.flags & Flags.DFF_ALWAYS_FIRE)) {
			return false;
		}
	}

	tileEvent.debug('spawn', x, y, 'id=', feat.id, 'tile=', feat.tile, 'item=', feat.item);

	const refreshCell = ctx.refreshCell = ctx.refreshCell || !(feat.flags & Flags.DFF_NO_REDRAW_CELL);
	const abortIfBlocking = ctx.abortIfBlocking = ctx.abortIfBlocking || (feat.flags & Flags.DFF_ABORT_IF_BLOCKS_MAP);

  // if ((feat.flags & DFF_RESURRECT_ALLY) && !resurrectAlly(x, y))
	// {
  //     return false;
  // }

  if (feat.message && feat.message.length && !feat.messageDisplayed && map.isVisible(x, y)) {
		feat.messageDisplayed = true;
		MSG.add(feat.message);
	}

  if (feat.tile) {
		if (typeof feat.tile === 'string') {
			tile = TILE.withName(feat.tile);
			if (tile) {
				feat.tile = tile.id;
			}
		}
		else {
			tile = TILES[feat.tile];
		}

		if (!tile) {
			UTILS.ERROR('Unknown tile: ' + feat.tile);
		}
	}

	if (feat.item) {
		itemKind = ITEMKINDS[feat.item];
		if (!itemKind) {
			UTILS.ERROR('Unknown item: ' + feat.item);
		}
	}

	// Blocking keeps track of whether to abort if it turns out that the DF would obstruct the level.
	const blocking = ctx.blocking = ((abortIfBlocking
							 && !(feat.flags & Flags.DFF_PERMIT_BLOCKING)
							 && ((tile && (tile.flags & (TileFlags.T_PATHING_BLOCKER)))
										|| (itemKind && (itemKind.flags & ItemKindFlags.IK_BLOCKS_MOVE))
										|| (feat.flags & Flags.DFF_TREAT_AS_BLOCKING))) ? true : false);

	tileEvent.debug('- blocking', blocking);

	const spawnMap = GRID.alloc(map.width, map.height);

	let succeeded = false;
	tileEvent.computeSpawnMap(feat, spawnMap, ctx);
  if (!blocking || !MAP.gridDisruptsPassability(map, spawnMap, { bounds: ctx.bounds })) {
		if (feat.flags & Flags.DFF_EVACUATE_CREATURES) { // first, evacuate creatures, so that they do not re-trigger the tile.
				await tileEvent.evacuateCreatures(map, spawnMap);
		}

		if (feat.flags & Flags.DFF_EVACUATE_ITEMS) { // first, evacuate items, so that they do not re-trigger the tile.
				await tileEvent.evacuateItems(map, spawnMap);
		}

		if (feat.flags & Flags.DFF_CLEAR_CELL) { // first, clear other tiles (not base/ground)
				await tileEvent.clearCells(map, spawnMap);
		}

		if (tile || itemKind || feat.fn) {
			succeeded = await tileEvent.spawnTiles(feat, spawnMap, ctx, tile, itemKind);
		}
	}

	if (succeeded && (feat.flags & Flags.DFF_PROTECTED)) {
		spawnMap.forEach( (v, i, j) => {
			if (!v) return;
			const cell = map.cell(i, j);
			cell.mechFlags |= CellMechFlags.EVENT_PROTECTED;
		});
	}

  if (succeeded) {
      // if ((feat.flags & Flags.DFF_AGGRAVATES_MONSTERS) && feat.effectRadius) {
      //     await aggravateMonsters(feat.effectRadius, x, y, /* Color. */gray);
      // }
      // if (refreshCell && feat.flashColor && feat.effectRadius) {
      //     await colorFlash(feat.flashColor, 0, (IN_FIELD_OF_VIEW | CLAIRVOYANT_VISIBLE), 4, feat.effectRadius, x, y);
      // }
      // if (refreshCell && feat.lightFlare) {
      //     createFlare(x, y, feat.lightFlare);
      // }
  }

	// if (refreshCell && feat.tile
	// 	&& (tile.flags & (TileFlags.T_IS_FIRE | TileFlags.T_AUTO_DESCENT))
	// 	&& map.hasTileFlag(PLAYER.xLoc, PLAYER.yLoc, (TileFlags.T_IS_FIRE | TileFlags.T_AUTO_DESCENT)))
	// {
	// 	await applyInstantTileEffectsToCreature(PLAYER);
	// }

	// apply tile effects
	if (succeeded) {
		for(let i = 0; i < spawnMap.width; ++i) {
			for(let j = 0; j < spawnMap.height; ++j) {
				const v = spawnMap[i][j];
				if (!v || DATA.gameHasEnded) continue;
				const cell = map.cell(i, j);
				if (cell.actor || cell.item) {
					for(let t of cell.tiles()) {
						await TILE.applyInstantEffects(t, cell);
						if (DATA.gameHasEnded) {
							return true;
						}
					}
				}
			}
		}
	}

	if (DATA.gameHasEnded) {
		GRID.free(spawnMap);
		return succeeded;
	}

  //	if (succeeded && feat.message[0] && !feat.messageDisplayed && isVisible(x, y)) {
  //		feat.messageDisplayed = true;
  //		message(feat.message, false);
  //	}
  if (feat.next && (succeeded || feat.flags & Flags.DFF_SUBSEQ_ALWAYS)) {
    if (feat.flags & Flags.DFF_SUBSEQ_EVERYWHERE) {
        for (i=0; i<map.width; i++) {
            for (j=0; j<map.height; j++) {
                if (spawnMap[i][j]) {
                    await tileEvent.spawn(feat.next, { map, x: i, y: j });
                }
            }
        }
    }
		else {
        await tileEvent.spawn(feat.next, { map, x, y });
    }
	}
	if (succeeded) {
    if (feat.tile
        && (tile.flags & (TileFlags.T_IS_DEEP_WATER | TileFlags.T_LAVA | TileFlags.T_AUTO_DESCENT)))
		{
        DATA.updatedMapToShoreThisTurn = false;
    }

    // awaken dormant creatures?
    // if (feat.flags & Flags.DFF_ACTIVATE_DORMANT_MONSTER) {
    //     for (monst of map.dormant) {
    //         if (monst.x == x && monst.y == y || spawnMap[monst.x][monst.y]) {
    //             // found it!
    //             toggleMonsterDormancy(monst);
    //         }
    //     }
    // }
  }



	// if (succeeded && feat.flags & Flags.DFF_EMIT_EVENT && feat.eventName) {
	// 	await GAME.emit(feat.eventName, x, y);
	// }

	if (succeeded) {
		UI.requestUpdate();

		if (feat.flags & Flags.DFF_NO_MARK_FIRED) {
			succeeded = false;
		}
	}

	GRID.free(spawnMap);
	return succeeded;
}

tileEvent.spawn = spawn;


function computeSpawnMap(feat, spawnMap, ctx)
{
	let i, j, dir, t, x2, y2;
	let madeChange;

	const map = ctx.map;
	const x = ctx.x;
	const y = ctx.y;
	const bounds = ctx.bounds || null;

	if (bounds) {
		tileEvent.debug('- bounds', bounds);
	}

	let matchTile = feat.matchTile || 0;
	const requireMatch = (matchTile ? true : false);
	let startProb = feat.spread || 0;
	let probDec = feat.decrement || 0;

	if (typeof matchTile === 'string') {
		matchTile = TILE.withName(matchTile).id;
	}

	spawnMap[x][y] = t = 1; // incremented before anything else happens

	let radius = feat.radius || 0;
	if (feat.flags & Flags.DFF_SPREAD_CIRCLE) {
		radius = 0;
		startProb = startProb || 100;
		if (startProb >= 100) {
			probDec = probDec || 100;
		}
		while ( random.chance(startProb) ) {
			startProb -= probDec;
			++radius;
		}
		startProb = 100;
		probDec = 0;
	}

	if (radius) {
		startProb = startProb || 100;
		spawnMap.updateCircle(x, y, radius, (v, i, j) => {
			if (matchTile && !map.hasTile(i, j, matchTile)) return 0;
			if ((!matchTile) && map.hasTileFlag(i, j, TileFlags.T_OBSTRUCTS_TILE_EFFECTS)) return 0;
			if (bounds && !bounds.containsXY(i, j)) return 0;

			const dist = Math.floor(UTILS.distanceBetween(x, y, i, j));
			const prob = startProb - (dist * probDec);
			if (!random.chance(prob)) return 0;
			return 1;
		});
		spawnMap[x][y] = 1;
	}
	else if (startProb) {
		madeChange = true;
		if (startProb >= 100) {
			probDec = probDec || 100;
		}

		if (feat.flags & Flags.DFF_SPREAD_LINE) {
			x2 = x;
			y2 = y;
			const dir = def.dirs[random.number(4)];
			while(madeChange) {
				madeChange = false;
				x2 = x2 + dir[0];
				y2 = y2 + dir[1];
				if (map.hasXY(x2, y2) && !spawnMap[x2][y2]
					&& (!bounds || bounds.containsXY(x2, y2))
					&& (!requireMatch || (matchTile && map.hasTile(x2, y2, matchTile)))
					&& (!map.hasTileFlag(x2, y2, TileFlags.T_OBSTRUCTS_TILE_EFFECTS) || (matchTile && map.hasTile(x2, y2, matchTile)))
					&& random.chance(startProb))
				{
					spawnMap[x2][y2] = ++t;
					madeChange = true;
					startProb -= probDec;
				}
			}
		}
		else {

			while (madeChange && startProb > 0) {
				madeChange = false;
				t++;
				for (i = 0; i < map.width; i++) {
					for (j=0; j < map.height; j++) {
						if (spawnMap[i][j] == t - 1) {
							for (dir = 0; dir < 4; dir++) {
								x2 = i + def.dirs[dir][0];
								y2 = j + def.dirs[dir][1];
								if (map.hasXY(x2, y2) && !spawnMap[x2][y2]
									&& (!bounds || bounds.containsXY(x2, y2))
									&& (!requireMatch || (matchTile && map.hasTile(x2, y2, matchTile)))
									&& (!map.hasTileFlag(x2, y2, TileFlags.T_OBSTRUCTS_TILE_EFFECTS) || (matchTile && map.hasTile(x2, y2, matchTile)))
									&& random.chance(startProb))
								{
									spawnMap[x2][y2] = t;
									madeChange = true;
								}
							}
						}
					}
				}
				startProb -= probDec;
			}

		}

	}

	if (requireMatch && !map.hasTile(x, y, matchTile)) {
			spawnMap[x][y] = 0;
	}
}

tileEvent.computeSpawnMap = computeSpawnMap;


async function spawnTiles(feat, spawnMap, ctx, tile, itemKind)
{
	let i, j;
	let monst;
	let theItem;
	let accomplishedSomething;

	accomplishedSomething = false;

	const blockedByOtherLayers = (feat.flags & Flags.DFF_BLOCKED_BY_OTHER_LAYERS);
	const superpriority = (feat.flags & Flags.DFF_SUPERPRIORITY);
	const applyEffects = ctx.refreshCell;
	const map = ctx.map;

	for (i=0; i<spawnMap.width; i++) {
		for (j=0; j<spawnMap.height; j++) {

			if (!spawnMap[i][j]) continue;	// If it's not flagged for building in the spawn map,
			spawnMap[i][j] = 0; // so that the spawnmap reflects what actually got built

			const cell = map.cell(i, j);
			if (cell.mechFlags & CellMechFlags.EVENT_PROTECTED) continue;

			if (tile) {
				if ( (cell.layers[tile.layer] !== tile.id)  														// If the new cell does not already contains the fill terrain,
					&& (superpriority || cell.tile(tile.layer).priority < tile.priority)  // If the terrain in the layer to be overwritten has a higher priority number (unless superpriority),
					&& (!cell.obstructsLayer(tile.layer)) 																// If we will be painting into the surface layer when that cell forbids it,
					&& (!blockedByOtherLayers || cell.highestPriorityTile().priority < tile.priority))  // if the fill won't violate the priority of the most important terrain in this cell:
				{
					spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built

					cell.setTile(tile);
					if (feat.volume && cell.gas) {
					    cell.volume += (feat.volume || 0);
					}

					tileEvent.debug('- tile', i, j, 'tile=', tile.id);

					cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;
					accomplishedSomething = true;
				}
			}

			if (itemKind) {
				if (superpriority || !cell.item) {
					if (!cell.hasTileFlag(TileFlags.T_OBSTRUCTS_ITEMS)) {
						if (cell.item) {
							map.removeItem(cell.item);
						}
						const item = make.item(itemKind);
						map.addItem(i, j, item);
						cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;
						accomplishedSomething = true;
						tileEvent.debug('- item', i, j, 'item=', itemKind.id);
					}
				}
			}

			if (feat.fn) {
				if (await feat.fn(i, j, ctx)) {
					cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;
					accomplishedSomething = true;
				}
			}

			if (applyEffects) {
				// if (PLAYER.xLoc == i && PLAYER.yLoc == j && !PLAYER.status[STATUS_LEVITATING] && refresh) {
				// 	flavorMessage(tileFlavor(PLAYER.xLoc, PLAYER.yLoc));
				// }
				// if (cell.actor || cell.item) {
				// 	for(let t of cell.tiles()) {
				// 		await TILE.applyInstantEffects(t, cell);
				// 		if (DATA.gameHasEnded) {
				// 			return true;
				// 		}
				// 	}
				// }
				// if (tile.flags & TileFlags.T_IS_FIRE) {
				// 	if (cell.flags & CellFlags.HAS_ITEM) {
				// 		theItem = map.itemAt(i, j);
				// 		if (theItem.flags & ItemFlags.ITEM_FLAMMABLE) {
				// 			await burnItem(theItem);
				// 		}
				// 	}
				// }
			}
		}
	}
	if (accomplishedSomething) {
		map.changed(true);
	}
	return accomplishedSomething;
}

tileEvent.spawnTiles = spawnTiles;



function clearCells(map, spawnMap) {
	spawnMap.forEach( (v, i, j) => {
		if (!v) return;
		map.clearCellTiles(i, j, false);	// skip gas
	});
}

tileEvent.clearCells = clearCells;


async function evacuateCreatures(map, blockingMap) {
	let i, j;
	let monst;

	for (i=0; i<map.width; i++) {
		for (j=0; j<map.height; j++) {
			if (blockingMap[i][j]
				&& (map.hasCellFlag(i, j, CellFlags.HAS_ACTOR)))
			{
				monst = map.actorAt(i, j);
				const forbidFlags = monst.forbiddenTileFlags();
				const loc = map.matchingXYNear(
									 i, j, (cell) => {
										 if (cell.hasFlags(CellFlags.HAS_ACTOR)) return false;
										 if (cell.hasTileFlags(forbidFlags)) return false;
										 return true;
									 },
									 { hallwaysAllowed: true, blockingMap });
				await map.moveActor(loc[0], loc[1], monst);
			}
		}
	}
}

tileEvent.evacuateCreatures = evacuateCreatures;



async function evacuateItems(map, blockingMap) {
	let i, j;
	let item;

	blockingMap.forEach( (v, i, j) => {
		if (!v) return;
		const cell = map.cell(i, j);
		if (!cell.item) return;

		const forbidFlags = cell.item.forbiddenTileFlags();
		const loc = map.matchingXYNear(
							 i, j, (cell) => {
								 if (cell.hasFlags(CellFlags.HAS_ITEM)) return false;
								 if (cell.hasTileFlags(forbidFlags)) return false;
								 return true;
							 },
							 { hallwaysAllowed: true, blockingMap });
		if (loc) {
			map.removeItem(cell.item);
			map.addItem(loc[0], loc[1], cell.item);
		}
	});
}

tileEvent.evacuateItems = evacuateItems;
