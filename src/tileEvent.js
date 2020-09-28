
import { utils as UTILS } from './utils.js';
import { color as COLOR } from './color.js';
import { random } from './random.js';
import { flag as FLAG } from './flag.js';
import { grid as GRID } from './grid.js';
import { tiles as TILES, Flags as TileFlags, tile as TILE, Layer as TileLayer } from './tile.js';
import { Flags as CellFlags, MechFlags as CellMechFlags } from './cell.js';
import { types, make, def, data as DATA, ui as UI, message as MSG } from './gw.js';


export var tileEvent = {};
export var tileEvents = {};

const Fl = FLAG.fl;

export const Flags = FLAG.install('tileEvent', {
	DFF_EVACUATE_CREATURES_FIRST	: Fl(0),	// Creatures in the DF area get moved outside of it
	DFF_SUBSEQ_EVERYWHERE			    : Fl(1),	// Subsequent DF spawns in every cell that this DF spawns in, instead of only the origin
	DFF_TREAT_AS_BLOCKING			    : Fl(2),	// If filling the footprint of this DF with walls would disrupt level connectivity, then abort.
	DFF_PERMIT_BLOCKING				    : Fl(3),	// Generate this DF without regard to level connectivity.
	DFF_ACTIVATE_DORMANT_MONSTER	: Fl(4),	// Dormant monsters on this tile will appear -- e.g. when a statue bursts to reveal a monster.
	DFF_CLEAR_OTHER_TERRAIN			  : Fl(5),	// Erase other terrain in the footprint of this DF.
	DFF_BLOCKED_BY_OTHER_LAYERS		: Fl(6),	// Will not propagate into a cell if any layer in that cell has a superior priority.
	DFF_SUPERPRIORITY				      : Fl(7),	// Will overwrite terrain of a superior priority.
  DFF_AGGRAVATES_MONSTERS       : Fl(8),  // Will act as though an aggravate monster scroll of effectRadius radius had been read at that point.
  DFF_RESURRECT_ALLY            : Fl(9),  // Will bring back to life your most recently deceased ally.
	DFF_EMIT_EVENT								: Fl(10), // Will emit the event when activated
	DFF_NO_REDRAW_CELL						: Fl(11),
	DFF_ABORT_IF_BLOCKS_MAP				: Fl(12),
	DFF_SPREAD_CIRCLE							: Fl(13),	// Spread in a circle around the spot (using FOV), radius calculated using spread+decrement
	DFF_ALWAYS_FIRE								: Fl(14),	// Fire even if the cell is marked as having fired this turn
	DFF_NO_MARK_FIRED							: Fl(15),	// Do not mark this cell as having fired an event
	// MUST_REPLACE_LAYER
	// NEEDS_EMPTY_LAYER
	DFF_PROTECTED									: Fl(18),
});

tileEvent.Flags = Flags;


class TileEvent {
	constructor(tile, spread, decr, flag, text, flare, color, radius, matchTile, subEvent, eventName, fn)
	{
		this.tile = tile || 0;
		this.fn = fn || null;
		this.chance = 0;

		// spawning pattern:
		this.spread = spread || 0;
		this.radius = radius || 0;
		this.decrement = decr || 0;
		this.flags = flag || 0;
		this.matchTile = matchTile || 0;	/* ENUM tileType */
		this.next = subEvent || 0;	/* ENUM makeEventTypes */

		this.message = text || null;
	  this.lightFlare = flare || 0;
		this.flashColor = color ? COLOR.from(color) : null;
		// this.effectRadius = radius || 0;
		this.messageDisplayed = false;
		this.eventName = eventName || null;	// name of the event to emit when activated
		this.id = null;
	}

}

types.TileEvent = TileEvent;


// Dungeon features, spawned from Architect.c:
function makeEvent(tile, spread, decr, flag, text, flare, color, radius, matchTile, subEvent, eventName, fn) {
	let chance = 0;
	if (arguments.length == 1 && tile) {
		if (typeof tile === 'object') {
			const opts = tile;
			tile = opts.tile || 0;
			spread = opts.spread || 0;
			decr = opts.decrement || 0;
			flag = opts.flags || opts.flag || 0;
			text = opts.message || null;
			flare = opts.flare || null;
			color = opts.flash || null;
			radius = opts.radius || null;
			matchTile = opts.matchTile || opts.needs || 0;
			subEvent = opts.next || null;
			eventName = opts.event || null;
			fn = opts.fn || null;
			chance = opts.chance || 0;
		}
		else if (typeof tile === 'function') {
			fn = tile;
			tile = 0;
			spread = 100;
		}
	}

	flag = Flags.toFlag(flag);
	const te = new types.TileEvent(tile, spread, decr, flag, text, flare, color, radius, matchTile, subEvent, eventName, fn);
	te.chance = chance;
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
	let succeeded;
	let monst;
	let tile;

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

	const refreshCell = ctx.refreshCell || !(feat.flags & Flags.DFF_NO_REDRAW_CELL);
	const abortIfBlocking = ctx.abortIfBlocking || (feat.flags & Flags.DFF_ABORT_IF_BLOCKS_MAP);

  // if ((feat.flags & DFF_RESURRECT_ALLY) && !resurrectAlly(x, y))
	// {
  //     return false;
  // }

  if (feat.message && feat.message.length && !feat.messageDisplayed && map.isVisible(x, y)) {
		feat.messageDisplayed = true;
		MSG.add(feat.message);
	}

	const spawnMap = GRID.alloc(map.width, map.height);

	if (feat.fn) {
		succeeded = await feat.fn(ctx) || false;
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

		// Blocking keeps track of whether to abort if it turns out that the DF would obstruct the level.
	  const blocking = ((abortIfBlocking
	               && !(feat.flags & Flags.DFF_PERMIT_BLOCKING)
	               && ((feat.tile && (tile.flags & (TileFlags.T_PATHING_BLOCKER)))
	                   || (feat.flags & Flags.DFF_TREAT_AS_BLOCKING))) ? true : false);


    // if (tile.layer == GAS) {
    //     pmap[x][y].volume += feat.chance;
    //     pmap[x][y].layers[GAS] = feat.tile;
    //     if (refreshCell) {
    //         map.redrawCell(x, y);
    //     }
    //     succeeded = true;
    // } else {

    tileEvent.computeSpawnMap(map, x, y, feat, spawnMap);

		// if (GW.config.D_INSPECT_AUTOGENERATORS) {
		// 	let spawnCount = 0;
		// 	for(i = 0; i < map.width; ++i) {
		// 		for(j = 0; j < map.height; ++j) {
		// 			if (spawnMap[i][j]) {
		// 				spawnCount += 1;
		// 			}
		// 		}
		// 	}
		// 	await temporaryMessage(`Spawn ${spawnCount} cells.`, true);
		// }

    if (!blocking || !MAP.gridDisruptsPassability(map, spawnMap)) {
        if (feat.flags & Flags.DFF_EVACUATE_CREATURES_FIRST) { // first, evacuate creatures if necessary, so that they do not re-trigger the tile.
            await tileEvent.evacuateCreatures(map, spawnMap);
        }

        //succeeded = spawnTiles(tile.layer, feat.tile, spawnMap, (feat.flags & DFF_BLOCKED_BY_OTHER_LAYERS), refreshCell, (feat.flags & DFF_SUPERPRIORITY));
        await tileEvent.spawnTiles(map, tile, spawnMap,
                     (feat.flags & Flags.DFF_BLOCKED_BY_OTHER_LAYERS),
                     (feat.flags & Flags.DFF_SUPERPRIORITY),
									 		refreshCell); // this can tweak the spawn map too
        succeeded = true; // fail ONLY if we blocked the level. We succeed even if, thanks to priority, nothing gets built.
    } else {
        succeeded = false;
    }
  	// }
  } else {
      spawnMap[x][y] = 1;
      succeeded = true; // Automatically succeed if there is no terrain to place.
      if (feat.flags & Flags.DFF_EVACUATE_CREATURES_FIRST) { // first, evacuate creatures if necessary, so that they do not re-trigger the tile.
          await tileEvent.evacuateCreatures(map, spawnMap);
      }
  }

  if (succeeded && (feat.flags & Flags.DFF_CLEAR_OTHER_TERRAIN)) {
		// const exceptLayer = feat.tile ? tile.layer : TileLayer.GROUND;
		const exceptLayer = TileLayer.GROUND;
		spawnMap.forEach( (v, i, j) => {
			if (!v) return;
			const cell = map.cell(i, j);
			// console.log('Clear other terrain', i, j);
			cell.clearLayers(exceptLayer); // , map.floorTile);
		});
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
  if (succeeded) {
      if (feat.next) {
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


function computeSpawnMap(map, x, y, feat, spawnMap)
{
	let i, j, dir, t, x2, y2;
	let madeChange;

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

	if (requireMatch && !map.hasTile(x, y, matchTile)) {
			spawnMap[x][y] = 0;
	}
}

tileEvent.computeSpawnMap = computeSpawnMap;


async function spawnTiles(map, tile, 	// layer, surfaceTileType,
					 spawnMap,
					 blockedByOtherLayers,
					 superpriority,
				 		applyEffects)
{
	let i, j;
	let monst;
	let theItem;
	let accomplishedSomething;

	accomplishedSomething = false;

	for (i=0; i<map.width; i++) {
		for (j=0; j<map.height; j++) {

			if (!spawnMap[i][j]) continue;	// If it's not flagged for building in the spawn map,
			spawnMap[i][j] = 0; // so that the spawnmap reflects what actually got built

			const cell = map.cell(i, j);
			if (cell.mechFlags & CellMechFlags.EVENT_PROTECTED) continue;
			if (cell.layers[tile.layer] == tile.id) continue; // If the new cell already contains the fill terrain,
			if ((!superpriority) && cell.tile(tile.layer).priority >= tile.priority) continue; // If the terrain in the layer to be overwritten has a higher priority number (unless superpriority),
			if (cell.obstructsLayer(tile.layer)) continue; // If we will be painting into the surface layer when that cell forbids it,
			if (blockedByOtherLayers && cell.highestPriorityTile().priority >= tile.priority) continue; // if the fill won't violate the priority of the most important terrain in this cell:


			spawnMap[i][j] = 1; // so that the spawnmap reflects what actually got built

			cell.setTile(tile);
			cell.mechFlags |= CellMechFlags.EVENT_FIRED_THIS_TURN;

			// const oldTile = cell.tile(tile.layer);
			// cell.layers[tile.layer] = tile.id; // Place the terrain!
			// cell.redraw();
			accomplishedSomething = true;

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
