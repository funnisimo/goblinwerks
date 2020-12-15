
import * as Grid from './grid.js';
import { random } from './random.js';
import * as Utils from './utils.js';
import * as Path from './path.js';
import * as Flags from './flags.js';
import { map as MAP } from './map.js';
import { tile as TILE } from './tile.js';
import { diggers as DIGGERS, digger as DIGGER } from './digger.js';
import { def, make } from './gw.js';

const DIRS = def.dirs;

export var dungeon = {};

dungeon.debug = Utils.NOOP;

const NOTHING = 0;
let FLOOR = 'FLOOR';
let DOOR = 'DOOR';
let BRIDGE = 'BRIDGE';
let UP_STAIRS = 'UP_STAIRS';
let DOWN_STAIRS = 'DOWN_STAIRS';
let WALL = 'WALL';
let LAKE = 'LAKE';


let SITE = null;
let LOCS;


export function start(map, opts={}) {

  LOCS = random.sequence(map.width * map.height);

  const startX = opts.x || -1;
  const startY = opts.y || -1;
  if (startX > 0) {
    map.locations.start = [startX, startY];
  }

  SITE = map;
}

dungeon.start = start;


function finish() {
  removeDiagonalOpenings();
  finishWalls();
  finishDoors();
}

dungeon.finish = finish;


// Returns an array of door sites if successful
export function digRoom(opts={}) {
  const hallChance = Utils.firstOpt('hallChance', opts, SITE.config, 0);
  const diggerId = opts.digger || opts.id || 'SMALL'; // TODO - get random id

  const digger = DIGGERS[diggerId];
  if (!digger) {
    throw new Error('Failed to find digger: ' + diggerId);
  }

  const config = Object.assign({}, digger, opts);
  let locs = opts.locs || opts.loc || null;
  if (!Array.isArray(locs)) {
    locs = null;
  }
  else if (locs && locs.length && locs.length == 2 && typeof locs[0] == 'number') {
    locs = [locs];
  }
  else if (locs.length == 0) {
    locs = null;
  }

  const grid = Grid.alloc(SITE.width, SITE.height);

  let result = false;
  let tries = opts.tries || 10;
  while(--tries >= 0 && !result) {
    grid.fill(NOTHING);

    const id = digger.fn(config, grid);
    dungeon.debug('Dig room:', id);
    const doors = DIGGER.chooseRandomDoorSites(grid);
    if (random.chance(hallChance)) {
      DIGGER.attachHallway(grid, doors, SITE.config);
    }

    if (locs) {
      // try the doors first
      result = attachRoomAtDoors(grid, doors, locs, opts);
      if (!result) {
        // otherwise try everywhere
        for(let i = 0; i < locs.length && !result; ++i) {
          if (locs[i][0] > 0) {
            result = attachRoomAtXY(grid, locs[i], doors, opts);
          }
        }
      }
    }
    else {
      result = attachRoomToDungeon(grid, doors, opts);
    }

  }

  Grid.free(grid);
  return result;
}

dungeon.digRoom = digRoom;



function roomAttachesAt(roomGrid, roomToSiteX, roomToSiteY) {
    let xRoom, yRoom, xSite, ySite, i, j;

    for (xRoom = 0; xRoom < roomGrid.width; xRoom++) {
        for (yRoom = 0; yRoom < roomGrid.height; yRoom++) {
            if (roomGrid[xRoom][yRoom]) {
                xSite = xRoom + roomToSiteX;
                ySite = yRoom + roomToSiteY;

                for (i = xSite - 1; i <= xSite + 1; i++) {
                    for (j = ySite - 1; j <= ySite + 1; j++) {
                        if (!SITE.hasXY(i, j)
                            || SITE.isBoundaryXY(i, j)
                            || !SITE.cell(i, j).isNull())
                        {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}




function attachRoomToDungeon(roomGrid, doorSites, opts={}) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (!SITE.cell(x, y).isNull()) continue;
      const dir = Grid.directionOfDoorSite(SITE.cells, x, y, (c) => (c.hasTile(FLOOR) && !c.isLiquid()) );
      if (dir != def.NO_DIRECTION) {
        const oppDir = (dir + 2) % 4;

        const offsetX = x - doorSites[oppDir][0];
        const offsetY = y - doorSites[oppDir][1];

        if (doorSites[oppDir][0] != -1
            && roomAttachesAt(roomGrid, offsetX, offsetY))
        {
          dungeon.debug("- attachRoom: ", x, y, oppDir);

          // Room fits here.
          Grid.offsetZip(SITE.cells, roomGrid, offsetX, offsetY, (d, s, i, j) => SITE.setTile(i, j, opts.tile || FLOOR) );
          if (opts.door || (opts.placeDoor !== false)) {
            SITE.setTile(x, y, opts.door || DOOR); // Door site.
          }
          doorSites[oppDir][0] = -1;
          doorSites[oppDir][1] = -1;
          for(let i = 0; i < doorSites.length; ++i) {
            if (doorSites[i][0] > 0) {
              doorSites[i][0] += offsetX;
              doorSites[i][1] += offsetY;
            }
          }
          return doorSites;
        }
      }
  }

  return false;
}


function attachRoomAtXY(roomGrid, xy, doors, opts={}) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (roomGrid[x][y]) continue;

      const dir = Grid.directionOfDoorSite(roomGrid, x, y);
      if (dir != def.NO_DIRECTION) {
        const d = DIRS[dir];
        if (roomAttachesAt(roomGrid, xy[0] - x, xy[1] - y)) {
          Grid.offsetZip(SITE.cells, roomGrid, xy[0] - x, xy[1] - y, (d, s, i, j) => SITE.setTile(i, j, opts.tile || FLOOR) );
          if (opts.door || (opts.placeDoor !== false)) {
            SITE.setTile(xy[0], xy[1], opts.door || DOOR); // Door site.
          }
          doors[dir][0] = -1;
          doors[dir][1] = -1;
          for(let i = 0; i < doors.length; ++i) {
            if (doors[i][0] > 0) {
              doors[i][0] += xy[0] - x;
              doors[i][1] += xy[1] - y;
            }
          }
          return doors;
        }
      }
  }

  return false;
}



function insertRoomAtXY(x, y, roomGrid, doorSites, opts={}) {

  const dirs = random.sequence(4);

  for(let dir of dirs) {
    const oppDir = (dir + 2) % 4;

    if (doorSites[oppDir][0] != -1
        && roomAttachesAt(roomGrid, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
    {
      // dungeon.debug("attachRoom: ", x, y, oppDir);

      // Room fits here.
      const offX = x - doorSites[oppDir][0];
      const offY = y - doorSites[oppDir][1];
      Grid.offsetZip(SITE.cells, roomGrid, offX, offY, (d, s, i, j) => SITE.setTile(i, j, opts.tile || FLOOR) );
      if (opts.door || (opts.placeDoor !== false)) {
        SITE.setTile(x, y, opts.door || DOOR); // Door site.
      }
      const newDoors = doorSites.map( (site) => {
        const x0 = site[0] + offX;
        const y0 = site[1] + offY;
        if (x0 == x && y0 == y) return [-1,-1];
        return [x0,y0];
      });
      return newDoors;
    }
  }
  return false;
}


function attachRoomAtDoors(roomGrid, roomDoors, siteDoors, opts={}) {

  const doorIndexes = random.sequence(siteDoors.length);

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < doorIndexes.length; i++) {
    const index = doorIndexes[i];
    const x = siteDoors[index][0];
    const y = siteDoors[index][1];

    const doors = insertRoomAtXY(x, y, roomGrid, roomDoors, opts);
    if (doors) return doors;
  }

  return false;
}


export function digLake(opts={}) {
  let i, j, k;
  let x, y;
  let lakeMaxHeight, lakeMaxWidth, lakeMinSize, tries, maxCount, canDisrupt;
  let count = 0;

  lakeMaxHeight = opts.height || 15;
  lakeMaxWidth = opts.width || 30;
  lakeMinSize = opts.minSize || 5;
  tries = opts.tries || 20;
  maxCount = 1; // opts.count || tries;
  canDisrupt = opts.canDisrupt || false;

  const lakeGrid = Grid.alloc(SITE.width, SITE.height, 0);

  for (; lakeMaxHeight >= lakeMinSize && lakeMaxWidth >= lakeMinSize && count < maxCount; lakeMaxHeight--, lakeMaxWidth -= 2) { // lake generations

    lakeGrid.fill(NOTHING);
    const bounds = Grid.fillBlob(lakeGrid, 5, 4, 4, lakeMaxWidth, lakeMaxHeight, 55, "ffffftttt", "ffffttttt");

    for (k=0; k < tries && count < maxCount; k++) { // placement attempts
        // propose a position for the top-left of the lakeGrid in the dungeon
        x = random.range(1 - bounds.x, lakeGrid.width - bounds.width - bounds.x - 2);
        y = random.range(1 - bounds.y, lakeGrid.height - bounds.height - bounds.y - 2);

      if (canDisrupt || !lakeDisruptsPassability(lakeGrid, -x, -y)) { // level with lake is completely connected
        dungeon.debug("Placed a lake!", x, y);

        ++count;
        // copy in lake
        for (i = 0; i < bounds.width; i++) {  // skip boundary
          for (j = 0; j < bounds.height; j++) { // skip boundary
            if (lakeGrid[i + bounds.x][j + bounds.y]) {
              const sx = i + bounds.x + x;
              const sy = j + bounds.y + y;
              SITE.setTile(sx, sy, opts.tile || LAKE);
            }
          }
        }
        break;
      }
    }
  }
  Grid.free(lakeGrid);
  return count;

}

dungeon.digLake = digLake;


function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {
  return SITE.gridDisruptsPassability(lakeGrid, { gridOffsetX: dungeonToGridX, gridOffsetY: dungeonToGridY });
}



// Add some loops to the otherwise simply connected network of rooms.
export function addLoops(minimumPathingDistance, maxConnectionLength) {
    let startX, startY, endX, endY;
    let i, j, d, x, y;

    minimumPathingDistance = minimumPathingDistance || Math.floor(Math.min(SITE.width,SITE.height)/2);
    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.cells;
    const pathGrid = Grid.alloc(SITE.width, SITE.height);
    const costGrid = Grid.alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillCostGrid(costGrid);

    function isValidTunnelStart(x, y, dir) {
      if (!SITE.hasXY(x, y)) return false;
      if (!SITE.hasXY(x + dir[1], y + dir[0])) return false;
      if (!SITE.hasXY(x - dir[1], y - dir[0])) return false;
      if (!SITE.cell(x, y).isNull()) return false;
      if (!SITE.cell(x + dir[1], y + dir[0]).isNull()) return false;
      if (!SITE.cell(x - dir[1], y - dir[0]).isNull()) return false;
      return true;
    }

    function isValidTunnelEnd(x, y, dir) {
      if (!SITE.hasXY(x, y)) return false;
      if (!SITE.hasXY(x + dir[1], y + dir[0])) return false;
      if (!SITE.hasXY(x - dir[1], y - dir[0])) return false;
      if (!SITE.cell(x, y).isNull()) return true;
      if (!SITE.cell(x + dir[1], y + dir[0]).isNull()) return true;
      if (!SITE.cell(x - dir[1], y - dir[0]).isNull()) return true;
      return false;
    }

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        const cell = siteGrid[x][y];
        if (cell.isNull()) {
            for (d=0; d <= 1; d++) { // Try a horizontal door, and then a vertical door.
                let dir = dirCoords[d];
                if (!isValidTunnelStart(x, y, dir)) continue;
                j = maxConnectionLength;

                // check up/left
                if (SITE.hasXY(x + dir[0], y + dir[1]) && SITE.cell(x + dir[0], y + dir[1]).hasTile(FLOOR)) {
                  // just can't build directly into a door
                  if (!SITE.hasXY(x - dir[0], y - dir[1]) || SITE.cell(x - dir[0], y - dir[1]).hasTile(DOOR)) {
                    continue;
                  }
                }
                else if (SITE.hasXY(x - dir[0], y - dir[1]) && SITE.cell(x - dir[0], y - dir[1]).hasTile(FLOOR)) {
                  if (!SITE.hasXY(x + dir[0], y + dir[1]) || SITE.cell(x + dir[0], y + dir[1]).hasTile(DOOR)) {
                    continue;
                  }
                  dir = dir.map( (v) => -1*v );
                }
                else {
                  continue; // not valid start for tunnel
                }

                startX = x + dir[0];
                startY = y + dir[1];
                endX = x;
                endY = y;

                for(j = 0; j < maxConnectionLength; ++j) {
                  endX -= dir[0];
                  endY -= dir[1];

                  // if (SITE.hasXY(endX, endY) && !SITE.cell(endX, endY).isNull()) {
                  if (isValidTunnelEnd(endX, endY, dir)) {
                    break;
                  }
                }

                if (j < maxConnectionLength) {
                  Path.calculateDistances(pathGrid, startX, startY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[startX][startY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[endX][endY] > minimumPathingDistance && pathGrid[endX][endY] < 30000) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      dungeon.debug('Adding Loop', startX, startY, ' => ', endX, endY, ' : ', pathGrid[endX][endY]);

                      while(endX !== startX || endY !== startY) {
                        if (SITE.cell(endX, endY).isNull()) {
                          SITE.setTile(endX, endY, FLOOR);
                          costGrid[endX][endY] = 1;          // (Cost map also needs updating.)
                        }
                        endX += dir[0];
                        endY += dir[1];
                      }
                      SITE.setTile(x, y, DOOR);             // then turn the tile into a doorway.
                      break;
                  }
                }
            }
        }
    }
    Grid.free(pathGrid);
    Grid.free(costGrid);
}

dungeon.addLoops = addLoops;


function isBridgeCandidate(x, y, bridgeDir) {
  if (SITE.hasTile(x, y, BRIDGE)) return true;
  if (!SITE.isLiquid(x, y)) return false;
  if (!SITE.isLiquid(x + bridgeDir[1], y + bridgeDir[0])) return false;
  if (!SITE.isLiquid(x - bridgeDir[1], y - bridgeDir[0])) return false;
  return true;
}

// Add some loops to the otherwise simply connected network of rooms.
export function addBridges(minimumPathingDistance, maxConnectionLength) {
    let newX, newY, oppX, oppY;
    let i, j, d, x, y;

    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.cells;
    const pathGrid = Grid.alloc(SITE.width, SITE.height);
    const costGrid = Grid.alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillCostGrid(costGrid);

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        if (SITE.hasXY(x, y) && (!SITE.isNull(x, y)) && SITE.canBePassed(x, y)) {
            for (d=0; d <= 1; d++) { // Try right, then down
                const bridgeDir = dirCoords[d];
                newX = x + bridgeDir[0];
                newY = y + bridgeDir[1];
                j = maxConnectionLength;

                if (!SITE.hasXY(newX, newY)) continue;

                // check for line of lake tiles
                // if (isBridgeCandidate(newX, newY, bridgeDir)) {
                if (SITE.isLiquid(newX, newY)) {
                  for(j = 0; j < maxConnectionLength; ++j) {
                    newX += bridgeDir[0];
                    newY += bridgeDir[1];

                    // if (!isBridgeCandidate(newX, newY, bridgeDir)) {
                    if (!SITE.isLiquid(newX, newY)) {
                      break;
                    }
                  }
                }

                if ((!SITE.isNull(newX, newY)) && SITE.canBePassed(newX, newY) && (j < maxConnectionLength)) {
                  Path.calculateDistances(pathGrid, newX, newY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[newX][newY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[x][y] > minimumPathingDistance && pathGrid[x][y] < def.PDS_NO_PATH) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      dungeon.debug('Adding Bridge', x, y, ' => ', newX, newY);

                      while(x !== newX || y !== newY) {
                        if (isBridgeCandidate(x, y, bridgeDir)) {
                          SITE.setTile(x, y, BRIDGE);
                          costGrid[x][y] = 1;          // (Cost map also needs updating.)
                        }
                        else {
                          SITE.setTile(x, y, FLOOR);
                          costGrid[x][y] = 1;
                        }
                        x += bridgeDir[0];
                        y += bridgeDir[1];
                      }
                      break;
                  }
                }
            }
        }
    }
    Grid.free(pathGrid);
    Grid.free(costGrid);
}

dungeon.addBridges = addBridges;



export function removeDiagonalOpenings() {
  let i, j, k, x1, y1, x2, layer;
  let diagonalCornerRemoved;

	do {
		diagonalCornerRemoved = false;
		for (i=0; i<SITE.width-1; i++) {
			for (j=0; j<SITE.height-1; j++) {
				for (k=0; k<=1; k++) {
					if ((SITE.canBePassed(i + k, j))
						&& (!SITE.canBePassed(i + (1-k), j))
						&& (SITE.isObstruction(i + (1-k), j))
						&& (!SITE.canBePassed(i + k, j+1))
						&& (SITE.isObstruction(i + k, j+1))
						&& (SITE.canBePassed(i + (1-k), j+1)))
          {
						if (random.chance(50)) {
							x1 = i + (1-k);
							x2 = i + k;
							y1 = j;
						} else {
							x1 = i + k;
							x2 = i + (1-k);
							y1 = j + 1;
						}
            diagonalCornerRemoved = true;
            SITE.setTile(x1, y1, FLOOR);
            dungeon.debug('Removed diagonal opening', x1, y1);
					}
				}
			}
		}
	} while (diagonalCornerRemoved == true);
}

dungeon.removeDiagonalOpenings = removeDiagonalOpenings;


function finishDoors(map) {
  map = map || SITE;
  let i, j;

	for (i=1; i<map.width-1; i++) {
		for (j=1; j<map.height-1; j++) {
			if (map.isDoor(i, j))
			{
				if ((map.canBePassed(i+1, j) || map.canBePassed(i-1, j))
					&& (map.canBePassed(i, j+1) || map.canBePassed(i, j-1)))
        {
					// If there's passable terrain to the left or right, and there's passable terrain
					// above or below, then the door is orphaned and must be removed.
					map.setTile(i, j, FLOOR);
          dungeon.debug('Removed orphan door', i, j);
				} else if ((map.blocksPathing(i+1, j) ? 1 : 0)
						   + (map.blocksPathing(i-1, j) ? 1 : 0)
						   + (map.blocksPathing(i, j+1) ? 1 : 0)
						   + (map.blocksPathing(i, j-1) ? 1 : 0) >= 3)
        {
					// If the door has three or more pathing blocker neighbors in the four cardinal directions,
					// then the door is orphaned and must be removed.
          map.setTile(i, j, FLOOR);
          dungeon.debug('Removed blocked door', i, j);
				}
			}
		}
	}
}

dungeon.finishDoors = finishDoors;

function finishWalls(map) {
  map = map || SITE;
  map.forEach( (cell, i, j) => {
    if (cell.isNull()) {
      map.setTile(i, j, WALL);
    }
  });
}

dungeon.finishWalls = finishWalls;



export function isValidStairLoc(c, x, y, map) {
  map = map || SITE;
  let count = 0;
  if (!(c.isNull() || c.isWall())) return false;

  for(let i = 0; i < 4; ++i) {
    const dir = def.dirs[i];
    if (!map.hasXY(x + dir[0], y + dir[1])) return false;
    if (!map.hasXY(x - dir[0], y - dir[1])) return false;
    const cell = map.cell(x + dir[0], y + dir[1]);
    if (cell.hasTile(FLOOR)) {
      count += 1;
      const va = map.cell(x - dir[0] + dir[1], y - dir[1] + dir[0]);
      if (!(va.isNull() || va.isWall())) return false;
      const vb = map.cell(x - dir[0] - dir[1], y - dir[1] - dir[0]);
      if (!(vb.isNull() || vb.isWall())) return false;
    }
    else if (!(cell.isNull() || cell.isWall())) {
      return false;
    }
  }
  return count == 1;
}

dungeon.isValidStairLoc = isValidStairLoc;


function setupStairs(map, x, y, tile) {

	const indexes = random.sequence(4);

	let dir;
	for(let i = 0; i < indexes.length; ++i) {
		dir = def.dirs[i];
		const x0 = x + dir[0];
		const y0 = y + dir[1];
		const cell = map.cell(x0, y0);
		if (cell.hasTile(FLOOR) && cell.isEmpty()) {
			const oppCell = map.cell(x - dir[0], y - dir[1]);
			if (oppCell.isNull() || oppCell.isWall()) break;
		}

		dir = null;
	}

	if (!dir) Utils.ERROR('No stair direction found!');

	map.setTile(x, y, tile);

	const dirIndex = def.clockDirs.findIndex( (d) => d[0] == dir[0] && d[1] == dir[1] );

	for(let i = 0; i < def.clockDirs.length; ++i) {
		const l = i ? i - 1 : 7;
		const r = (i + 1) % 8;
		if (i == dirIndex || l == dirIndex || r == dirIndex ) continue;
		const d = def.clockDirs[i];
		map.setTile(x + d[0], y + d[1], WALL);
    map.setCellFlags(x + d[0], y + d[1], Flags.Cell.IMPREGNABLE);
	}

	dungeon.debug('setup stairs', x, y, tile);
	return true;
}

dungeon.setupStairs = setupStairs;


export function addStairs(opts = {}) {

  const map = opts.map || SITE;
  let needUp = (opts.up !== false);
  let needDown = (opts.down !== false);
  const minDistance = opts.minDistance || Math.floor(Math.max(map.width,map.height)/2);
  const isValidStairLoc = opts.isValid || dungeon.isValidStairLoc;
  const setupFn = opts.setup || dungeon.setupStairs;

  let upLoc = Array.isArray(opts.up) ? opts.up : null;
  let downLoc = Array.isArray(opts.down) ? opts.down : null;

  if (opts.start && typeof opts.start !== 'string') {
    let start = opts.start;
    if (start === true) {
      start = map.randomMatchingLoc( isValidStairLoc );
    }
    else {
      start = map.matchingLocNear(Utils.x(start), Utils.y(start), isValidStairLoc);
    }
    map.locations.start = start;
  }

  if (upLoc && downLoc) {
    upLoc = map.matchingLocNear(Utils.x(upLoc), Utils.y(upLoc), isValidStairLoc);
    downLoc = map.matchingLocNear(Utils.x(downLoc), Utils.y(downLoc), isValidStairLoc);
  }
  else if (upLoc && !downLoc) {
    upLoc = map.matchingLocNear(Utils.x(upLoc), Utils.y(upLoc), isValidStairLoc);
    if (needDown) {
      downLoc = map.randomMatchingLoc( (v, x, y) => {
    		if (Utils.distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
    		return isValidStairLoc(v, x, y, map);
    	});
    }
  }
  else if (downLoc && !upLoc) {
    downLoc = map.matchingLocNear(Utils.x(downLoc), Utils.y(downLoc), isValidStairLoc);
    if (needUp) {
      upLoc = map.randomMatchingLoc( (v, x, y) => {
    		if (Utils.distanceBetween(x, y, downLoc[0], downLoc[1]) < minDistance) return false;
    		return isValidStairLoc(v, x, y, map);
    	});
    }
  }
  else if (needUp) {
    upLoc = map.randomMatchingLoc( isValidStairLoc );
    if (needDown) {
      downLoc = map.randomMatchingLoc( (v, x, y) => {
    		if (Utils.distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
    		return isValidStairLoc(v, x, y, map);
    	});
    }
  }
  else if (needDown) {
    downLoc = map.randomMatchingLoc( isValidStairLoc );
  }

  if (upLoc) {
    map.locations.up = upLoc.slice();
    setupFn(map, upLoc[0], upLoc[1], opts.upTile || UP_STAIRS);
    if (opts.start === 'up') map.locations.start = map.locations.up;
  }
  if (downLoc) {
    map.locations.down = downLoc.slice();
    setupFn(map, downLoc[0], downLoc[1], opts.downTile || DOWN_STAIRS);
    if (opts.start === 'down') map.locations.start = map.locations.down;
  }

  return !!(upLoc || downLoc);
}

dungeon.addStairs = addStairs;
