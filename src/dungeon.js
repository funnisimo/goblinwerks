
import { grid as GRID } from './grid.js';
import { random } from './random.js';
import { path as PATH } from './path.js';
import { map as MAP } from './map.js';
import { tile as TILE, Flags as TileFlags } from './tile.js';
import { diggers as DIGGERS, digger as DIGGER } from './digger.js';
import { def, debug, utils as UTILS } from './gw.js';

const DIRS = def.dirs;
const OPP_DIRS = [def.DOWN, def.UP, def.RIGHT, def.LEFT];

export var dungeon = {};

dungeon.log = UTILS.NOOP;

const NOTHING = 0;
let FLOOR = 1;
let DOOR = 2;
let BRIDGE = 3;
let UP_STAIRS = 4;
let DOWN_STAIRS = 5;
let WALL = 6;

let LAKE = 7;


let SITE = null;
let LOCS;


export function start(map, opts={}) {

  FLOOR       = TILE.withName('FLOOR')       ? TILE.withName('FLOOR').id        : FLOOR;
  DOOR        = TILE.withName('DOOR')        ? TILE.withName('DOOR').id         : DOOR;
  BRIDGE      = TILE.withName('BRIDGE')      ? TILE.withName('BRIDGE').id       : BRIDGE;
  UP_STAIRS   = TILE.withName('UP_STAIRS')   ? TILE.withName('UP_STAIRS').id    : UP_STAIRS;
  DOWN_STAIRS = TILE.withName('DOWN_STAIRS') ? TILE.withName('DOWN_STAIRS').id  : DOWN_STAIRS;
  WALL        = TILE.withName('WALL')        ? TILE.withName('WALL').id         : WALL;
  LAKE        = TILE.withName('LAKE')        ? TILE.withName('LAKE').id         : LAKE;

  LOCS = UTILS.sequence(map.width * map.height);
  random.shuffle(LOCS);

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
  const hallChance = UTILS.first('hallChance', opts, SITE.config, 0);
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

  const grid = GRID.alloc(SITE.width, SITE.height);

  let result = false;
  let tries = opts.tries || 10;
  while(--tries >= 0 && !result) {
    grid.fill(NOTHING);

    const id = digger.fn(config, grid);
    dungeon.log('Dig room:', id);
    const doors = DIGGER.chooseRandomDoorSites(grid);
    if (random.chance(hallChance)) {
      DIGGER.attachHallway(grid, doors, SITE.config);
    }

    if (locs) {
      // try the doors first
      result = attachRoomAtDoors(grid, doors, locs, opts.placeDoor);
      if (!result) {
        // otherwise try everywhere
        for(let i = 0; i < locs.length && !result; ++i) {
          if (locs[i][0] > 0) {
            result = attachRoomAtXY(grid, locs[i], doors, opts.placeDoor);
          }
        }
      }
    }
    else {
      result = attachRoomToDungeon(grid, doors, opts.placeDoor);
    }

  }

  GRID.free(grid);
  return result;
}

dungeon.digRoom = digRoom;


export function isValidStairLoc(c, x, y) {
  let count = 0;
  if (!c.isEmpty()) return false;

  for(let i = 0; i < 4; ++i) {
    const dir = def.dirs[i];
    if (!SITE.hasXY(x + dir[0], y + dir[1])) return false;
    const cell = SITE.cell(x + dir[0], y + dir[1]);
    if (cell.hasTile(FLOOR)) {
      count += 1;
      const va = SITE.cell(x - dir[0] + dir[1], y - dir[1] + dir[0]);
      if (!va.isEmpty()) return false;
      const vb = SITE.cell(x - dir[0] - dir[1], y - dir[1] - dir[0]);
      if (!vb.isEmpty()) return false;
    }
    else if (!cell.isEmpty()) {
      return false;
    }
  }
  return count == 1;
}

dungeon.isValidStairLoc = isValidStairLoc;




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
                            || !SITE.cell(i, j).isEmpty())
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




function attachRoomToDungeon(roomGrid, doorSites, placeDoor) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (!SITE.cell(x, y).isEmpty()) continue;
      const dir = GRID.directionOfDoorSite(SITE.cells, x, y, (c) => (c.hasTile(FLOOR) && !c.isLiquid()) );
      if (dir != def.NO_DIRECTION) {
        const oppDir = OPP_DIRS[dir];

        const offsetX = x - doorSites[oppDir][0];
        const offsetY = y - doorSites[oppDir][1];

        if (doorSites[oppDir][0] != -1
            && roomAttachesAt(roomGrid, offsetX, offsetY))
        {
          dungeon.log("- attachRoom: ", x, y, oppDir);

          // Room fits here.
          GRID.offsetZip(SITE.cells, roomGrid, offsetX, offsetY, (d, s, i, j) => d.setTile(s) );
          if (placeDoor !== false) {
            SITE.setTile(x, y, (typeof placeDoor === 'number') ? placeDoor : DOOR); // Door site.
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


function attachRoomAtXY(roomGrid, xy, doors, placeDoor) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      if (roomGrid[x][y]) continue;

      const dir = GRID.directionOfDoorSite(roomGrid, x, y);
      if (dir != def.NO_DIRECTION) {
        const d = DIRS[dir];
        if (roomAttachesAt(roomGrid, xy[0] - x, xy[1] - y)) {
          GRID.offsetZip(SITE.cells, roomGrid, xy[0] - x, xy[1] - y, (d, s, i, j) => d.setTile(s) );
          if (placeDoor !== false) {
            SITE.setTile(xy[0], xy[1], (typeof placeDoor === 'number') ? placeDoor : DOOR); // Door site.
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



function insertRoomAtXY(x, y, roomGrid, doorSites, placeDoor) {

  const dirs = UTILS.sequence(4);
  random.shuffle(dirs);

  for(let dir of dirs) {
    const oppDir = OPP_DIRS[dir];

    if (doorSites[oppDir][0] != -1
        && roomAttachesAt(roomGrid, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
    {
      // GW.dungeon.log("attachRoom: ", x, y, oppDir);

      // Room fits here.
      const offX = x - doorSites[oppDir][0];
      const offY = y - doorSites[oppDir][1];
      GRID.offsetZip(SITE.cells, roomGrid, offX, offY, (d, s, i, j) => d.setTile(s) );
      if (placeDoor !== false) {
        SITE.setTile(x, y, (typeof placeDoor === 'number') ? placeDoor : DOOR); // Door site.
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


function attachRoomAtDoors(roomGrid, roomDoors, siteDoors, placeDoor) {

  const doorIndexes = UTILS.sequence(siteDoors.length);
  random.shuffle(doorIndexes);

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < doorIndexes.length; i++) {
    const index = doorIndexes[i];
    const x = siteDoors[index][0];
    const y = siteDoors[index][1];

    const doors = insertRoomAtXY(x, y, roomGrid, roomDoors, placeDoor);
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

  const lakeGrid = GRID.alloc(SITE.width, SITE.height, 0);

  for (; lakeMaxHeight >= lakeMinSize && lakeMaxWidth >= lakeMinSize && count < maxCount; lakeMaxHeight--, lakeMaxWidth -= 2) { // lake generations

    lakeGrid.fill(NOTHING);
    const bounds = GRID.fillBlob(lakeGrid, 5, 4, 4, lakeMaxWidth, lakeMaxHeight, 55, "ffffftttt", "ffffttttt");

    for (k=0; k < tries && count < maxCount; k++) { // placement attempts
        // propose a position for the top-left of the lakeGrid in the dungeon
        x = random.range(1 - bounds.x, lakeGrid.width - bounds.width - bounds.x - 2);
        y = random.range(1 - bounds.y, lakeGrid.height - bounds.height - bounds.y - 2);

      if (canDisrupt || !lakeDisruptsPassability(lakeGrid, -x, -y)) { // level with lake is completely connected
        dungeon.log("Placed a lake!", x, y);

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
  GRID.free(lakeGrid);
  return count;

}

dungeon.digLake = digLake;


function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {
  return MAP.gridDisruptsPassability(SITE, lakeGrid, dungeonToGridX, dungeonToGridY);
}



// Add some loops to the otherwise simply connected network of rooms.
export function addLoops(minimumPathingDistance, maxConnectionLength) {
    let startX, startY, endX, endY;
    let i, j, d, x, y;

    minimumPathingDistance = minimumPathingDistance || Math.floor(Math.min(SITE.width,SITE.height)/2);
    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.cells;
    const pathGrid = GRID.alloc(SITE.width, SITE.height);
    const costGrid = GRID.alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillBasicCostGrid(costGrid);

    function isValidTunnelStart(x, y, dir) {
      if (!SITE.hasXY(x, y)) return false;
      if (!SITE.hasXY(x + dir[1], y + dir[0])) return false;
      if (!SITE.hasXY(x - dir[1], y - dir[0])) return false;
      if (!SITE.cell(x, y).isEmpty()) return false;
      if (!SITE.cell(x + dir[1], y + dir[0]).isEmpty()) return false;
      if (!SITE.cell(x - dir[1], y - dir[0]).isEmpty()) return false;
      return true;
    }

    function isValidTunnelEnd(x, y, dir) {
      if (!SITE.hasXY(x, y)) return false;
      if (!SITE.hasXY(x + dir[1], y + dir[0])) return false;
      if (!SITE.hasXY(x - dir[1], y - dir[0])) return false;
      if (!SITE.cell(x, y).isEmpty()) return true;
      if (!SITE.cell(x + dir[1], y + dir[0]).isEmpty()) return true;
      if (!SITE.cell(x - dir[1], y - dir[0]).isEmpty()) return true;
      return false;
    }

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        const cell = siteGrid[x][y];
        if (cell.isEmpty()) {
            for (d=0; d <= 1; d++) { // Try a horizontal door, and then a vertical door.
                let dir = dirCoords[d];
                if (!isValidTunnelStart(x, y, dir)) continue;
                j = maxConnectionLength;

                // check up/left
                if (SITE.hasXY(x + dir[0], y + dir[1]) && !SITE.cell(x + dir[0], y + dir[1]).isEmpty()) {
                  // ok
                }
                else if (SITE.hasXY(x - dir[0], y - dir[1]) && !SITE.cell(x - dir[0], y - dir[1]).isEmpty()) {
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

                  // if (SITE.hasXY(endX, endY) && !SITE.cell(endX, endY).isEmpty()) {
                  if (isValidTunnelEnd(endX, endY, dir)) {
                    break;
                  }
                }

                if (j < maxConnectionLength) {
                  PATH.calculateDistances(pathGrid, startX, startY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[startX][startY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[endX][endY] > minimumPathingDistance && pathGrid[endX][endY] < 30000) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      dungeon.log('Adding Loop', startX, startY, ' => ', endX, endY, ' : ', pathGrid[endX][endY]);

                      while(endX !== startX || endY !== startY) {
                        if (SITE.cell(endX, endY).isEmpty()) {
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
    GRID.free(pathGrid);
    GRID.free(costGrid);
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
    const pathGrid = GRID.alloc(SITE.width, SITE.height);
    const costGrid = GRID.alloc(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    SITE.fillBasicCostGrid(costGrid);

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        if (SITE.hasXY(x, y) && (!SITE.isEmpty(x, y)) && SITE.canBePassed(x, y)) {
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

                if ((!SITE.isEmpty(newX, newY)) && SITE.canBePassed(newX, newY) && (j < maxConnectionLength)) {
                  PATH.calculateDistances(pathGrid, newX, newY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[newX][newY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[x][y] > minimumPathingDistance && pathGrid[x][y] < def.PDS_NO_PATH) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      dungeon.log('Adding Bridge', x, y, ' => ', newX, newY);

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
    GRID.free(pathGrid);
    GRID.free(costGrid);
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
            dungeon.log('Removed diagonal opening', x1, y1);
					}
				}
			}
		}
	} while (diagonalCornerRemoved == true);
}

dungeon.removeDiagonalOpenings = removeDiagonalOpenings;


function finishDoors() {
  let i, j;

	for (i=1; i<SITE.width-1; i++) {
		for (j=1; j<SITE.height-1; j++) {
			if (SITE.isDoor(i, j))
			{
				if ((SITE.canBePassed(i+1, j) || SITE.canBePassed(i-1, j))
					&& (SITE.canBePassed(i, j+1) || SITE.canBePassed(i, j-1))) {
					// If there's passable terrain to the left or right, and there's passable terrain
					// above or below, then the door is orphaned and must be removed.
					SITE.setTile(i, j, FLOOR);
          dungeon.log('Removed orphan door', i, j);
				} else if ((SITE.blocksPathing(i+1, j) ? 1 : 0)
						   + (SITE.blocksPathing(i-1, j) ? 1 : 0)
						   + (SITE.blocksPathing(i, j+1) ? 1 : 0)
						   + (SITE.blocksPathing(i, j-1) ? 1 : 0) >= 3) {
					// If the door has three or more pathing blocker neighbors in the four cardinal directions,
					// then the door is orphaned and must be removed.
          SITE.setTile(i, j, FLOOR);
          dungeon.log('Removed blocked door', i, j);
				}
			}
		}
	}
}

dungeon.finishDoors = finishDoors;

function finishWalls() {
  SITE.cells.forEach( (cell, i, j) => {
    if (cell.isEmpty()) {
      cell.setTile(WALL);
    }
  });
}

dungeon.finishWalls = finishWalls;


export function addStairs(upX, upY, downX, downY, minDistance) {

  upX = upX || random.number(SITE.width);
  upY = upY || random.number(SITE.height);
  downX = downX || -1;
  downY = downY || -1;
  minDistance = minDistance || Math.floor(Math.max(SITE.width,SITE.height)/2);

  const upLoc = SITE.cells.matchingXYNear(upX, upY, dungeon.isValidStairLoc);
	if (!upLoc || upLoc[0] < 0) {
    dungeon.log('no up location');
    return false;
  }

  let downLoc;
  if (downX < 0) {
    downLoc = SITE.cells.randomMatchingXY( (v, x, y) => {
  		if (UTILS.distanceBetween(x, y, upLoc[0], upLoc[1]) < minDistance) return false;
  		return dungeon.isValidStairLoc(v, x, y);
  	});
  }
  else {
    downLoc = SITE.cells.matchingXYNear(downX, downY, dungeon.isValidStairLoc);
  }

  if (!downLoc || downLoc[0] < 0) {
    dungeon.log('No down location');
    return false;
  }

  SITE.setTile(upLoc[0], upLoc[1], UP_STAIRS);
	SITE.locations.start = upLoc.slice();
  SITE.setTile(downLoc[0], downLoc[1], DOWN_STAIRS);
	SITE.locations.finish = downLoc.slice();

  return true;
}

dungeon.addStairs = addStairs;
