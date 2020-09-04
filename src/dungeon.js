
import { WARN, ERROR, sequence, first } from './utils.js';
import { allocGrid, freeGrid, offsetApply } from './grid.js';
import { random } from './random.js';
import { calculateDistances } from './path.js';
import { withName } from './tile.js';
import { diggers as DIGGERS } from './digger.js';
import { def, debug } from './gw.js';

const DIRS = def.dirs;
const OPP_DIRS = [def.DOWN, def.UP, def.RIGHT, def.LEFT];

export var dungeon = {};


const NOTHING = 0;
let FLOOR = 1;
let DOOR = 2;
let BRIDGE = 3;
let UP_STAIRS = 4;
let DOWN_STAIRS = 5;
let WALL = 6;

let LAKE = 7;
let LAKE_FLOOR = 8;


class DigSite {
  constructor(w, h, opts={}) {
    Object.assign(this, opts);
    this.width = w;
    this.height = h;
    this.grid = allocGrid(w, h, NOTHING);
    this.locations = {};
  }

  isPassable(x, y) {
    if (!this.grid.hasXY(x, y)) return false;
    const v = this.grid[x][y];
    return v == FLOOR || v == DOOR || v == BRIDGE;
  }

  isObstruction(x, y) {
    if (!this.grid.hasXY(x, y)) return true;
    const v = this.grid[x][y];
    return v == WALL;
  }

  isDoor(x, y) {
    if (!this.grid.hasXY(x, y)) return true;
    const v = this.grid[x][y];
    return v == DOOR;
  }

  isBlocked(x, y) {
    if (!this.grid.hasXY(x, y)) return false;
    const v = this.grid[x][y];
    return v == WALL || v == LAKE || v == LAKE_FLOOR || v == UP_STAIRS || v == DOWN_STAIRS;
  }

  isLake(x, y) {
    if (!this.grid.hasXY(x, y)) return false;
    const v = this.grid[x][y];
    return v == LAKE || v == LAKE_FLOOR;
  }

}




let SITE = {};
let LOCS;

export function startDig(opts={}) {
  if (arguments.length == 2) {
    opts = {
      w: arguments[0], h: arguments[1]
    };
  }
  else if (arguments.length == 3) {
    opts = arguments[2];
    opts.w = arguments[0];
    opts.h = arguments[1];
  }
  const width = opts.w || opts.width || GW.CONFIG.DEFAULT_MAP_WIDTH || GW.ui.display.width || 80;
  const height = opts.h || opts.height || GW.CONFIG.DEFAULT_MAP_HEIGHT || GW.ui.display.height || 30;

  const startX = opts.x || -1;
  const startY = opts.y || -1;

  if (SITE) {
    freeGrid(SITE.grid);
  }

  FLOOR       = withName('FLOOR')       ? withName('FLOOR').id        : FLOOR;
  DOOR        = withName('DOOR')        ? withName('DOOR').id         : DOOR;
  BRIDGE      = withName('BRIDGE')      ? withName('BRIDGE').id       : BRIDGE;
  UP_STAIRS   = withName('UP_STAIRS')   ? withName('UP_STAIRS').id    : UP_STAIRS;
  DOWN_STAIRS = withName('DOWN_STAIRS') ? withName('DOWN_STAIRS').id  : DOWN_STAIRS;
  WALL        = withName('WALL')        ? withName('WALL').id         : WALL;
  LAKE        = withName('LAKE')        ? withName('LAKE').id         : LAKE;
  LAKE_FLOOR  = withName('LAKE_FLOOR')  ? withName('LAKE_FLOOR').id   : LAKE_FLOOR;

  LOCS = sequence(width * height);
  random.shuffle(LOCS);

  SITE = new DigSite(width, height, opts);
  SITE.locations.start = [startX, startY];

  return SITE;
}

dungeon.startDig = startDig;


function finishDig(tileFn) {
  // const map = GW.make.map(SITE.width, SITE.height);
  //
  // // convert grid to map
  // tileFn = tileFn || mapGridToTile;
  //
  // SITE.grid.forEach( (v, x, y) => {
  //   const tile = tileFn(v);
  //   map.cells[x][y].layers[0] = tile || 'FLOOR';
  // });

  removeDiagonalOpenings();
  finishDoors();

  SITE.grid.update( (v) => v || WALL );

  // freeGrid(SITE.grid);
  // SITE.grid = null;

  // return map;
}

dungeon.finishDig = finishDig;


// Returns an array of door sites if successful
export function digRoom(opts={}) {
  const hallChance = first('hallChance', opts, SITE, 0);
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

  const grid = allocGrid(SITE.width, SITE.height);

  let result = false;
  let tries = opts.tries || 10;
  while(--tries >= 0 && !result) {
    grid.fill(NOTHING);

    digger.fn(config, grid);
    const doors = chooseRandomDoorSites(grid);
    if (random.percent(hallChance)) {
      attachHallway(grid, doors);
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

  freeGrid(grid);

  return result;
}

dungeon.digRoom = digRoom;


export function isValidStairLoc(v, x, y) {
  let count = 0;
  if (v && v !== WALL) return false;

  for(let i = 0; i < 4; ++i) {
    const dir = def.dirs[i];
    if (!SITE.grid.hasXY(x + dir[0], y + dir[1])) return false;
    const tile = SITE.grid[x + dir[0]][y + dir[1]];
    if (tile == FLOOR) {
      count += 1;
      const va = SITE.grid[x - dir[0] + dir[1]][y - dir[1] + dir[0]];
      if (va && va != WALL) return false;
      const vb = SITE.grid[x - dir[0] - dir[1]][y - dir[1] - dir[0]];
      if (vb && vb != WALL) return false;
    }
    else if (tile && tile != WALL) {
      return false;
    }
  }
  return count == 1;
}

dungeon.isValidStairLoc = isValidStairLoc;


export function addStairs(x,y, stairTile) {
  SITE.grid[x][y] = stairTile;  // assume everything is ok
}

dungeon.addStairs = addStairs;


export function randomDoor(sites, matchFn) {
  matchFn = matchFn || GW.utils.TRUE;
  const s = sequence(sites.length);
  random.shuffle(s);

  for(let dir of s) {
    if (sites[dir][0] >= 0
      && matchFn(sites[dir][0], sites[dir][1], SITE.grid))
    {
      return sites[dir];
    }
  }
  return null;
}

dungeon.randomDoor = randomDoor;


function chooseRandomDoorSites(sourceGrid) {
    let i, j, k, newX, newY;
    let dir;
    let doorSiteFailed;

    const grid = allocGrid(sourceGrid.width, sourceGrid.height);
    grid.copy(sourceGrid);

    for (i=0; i<grid.width; i++) {
        for (j=0; j<grid.height; j++) {
            if (!grid[i][j]) {
                dir = directionOfDoorSite(grid, i, j);
                if (dir != def.NO_DIRECTION) {
                    // Trace a ray 10 spaces outward from the door site to make sure it doesn't intersect the room.
                    // If it does, it's not a valid door site.
                    newX = i + DIRS[dir][0];
                    newY = j + DIRS[dir][1];
                    doorSiteFailed = false;
                    for (k=0; k<10 && grid.hasXY(newX, newY) && !doorSiteFailed; k++) {
                        if (grid[newX][newY]) {
                            doorSiteFailed = true;
                        }
                        newX += DIRS[dir][0];
                        newY += DIRS[dir][1];
                    }
                    if (!doorSiteFailed) {
                        grid[i][j] = dir + 10000; // So as not to conflict with other tiles.
                    }
                }
            }
        }
    }

  let doorSites = [];
  // Pick four doors, one in each direction, and store them in doorSites[dir].
  for (dir=0; dir<4; dir++) {
      const loc = grid.randomMatchingXY(dir + 10000) || [-1, -1];
      doorSites[dir] = loc.slice();
  }

  freeGrid(grid);
  return doorSites;
}



function attachHallway(grid, doorSitesArray, opts) {
    let i, x, y, newX, newY;
    let dirs = []; // [4];
    let length;
    let dir, dir2;
    let allowObliqueHallwayExit;

    opts = opts || {};
    const tile = opts.tile || SITE.hallTile || 1;

    const horizontalLength = first('horizontalHallLength', opts, SITE, [9,15]);
    const verticalLength = first('verticalHallLength', opts, SITE, [2,9]);

    // Pick a direction.
    dir = opts.dir;
    if (dir === undefined) {
      const dirs = sequence(4);
      random.shuffle(dirs);
      for (i=0; i<4; i++) {
          dir = dirs[i];
          if (doorSitesArray[dir][0] != -1
              && doorSitesArray[dir][1] != -1
              && grid.hasXY(doorSitesArray[dir][0] + Math.floor(DIRS[dir][0] * horizontalLength[1]),
                                     doorSitesArray[dir][1] + Math.floor(DIRS[dir][1] * verticalLength[1])) ) {
                  break; // That's our direction!
          }
      }
      if (i==4) {
          return; // No valid direction for hallways.
      }
    }

    if (dir == def.UP || dir == def.DOWN) {
        length = random.range(...verticalLength);
    } else {
        length = random.range(...horizontalLength);
    }

    x = doorSitesArray[dir][0];
    y = doorSitesArray[dir][1];

    const attachLoc = [x - DIRS[dir][0], y - DIRS[dir][1]];
    for (i = 0; i < length; i++) {
        if (grid.hasXY(x, y)) {
            grid[x][y] = tile;
        }
        x += DIRS[dir][0];
        y += DIRS[dir][1];
    }
    x = GW.utils.clamp(x - DIRS[dir][0], 0, grid.width - 1);
    y = GW.utils.clamp(y - DIRS[dir][1], 0, grid.height - 1); // Now (x, y) points at the last interior cell of the hallway.
    allowObliqueHallwayExit = random.percent(15);
    for (dir2 = 0; dir2 < 4; dir2++) {
        newX = x + DIRS[dir2][0];
        newY = y + DIRS[dir2][1];

        if ((dir2 != dir && !allowObliqueHallwayExit)
            || !grid.hasXY(newX, newY)
            || grid[newX][newY])
        {
            doorSitesArray[dir2][0] = -1;
            doorSitesArray[dir2][1] = -1;
        } else {
            doorSitesArray[dir2][0] = newX;
            doorSitesArray[dir2][1] = newY;
        }
    }

    return attachLoc;
}



// If the indicated tile is a wall on the room stored in grid, and it could be the site of
// a door out of that room, then return the outbound direction that the door faces.
// Otherwise, return def.NO_DIRECTION.
function directionOfDoorSite(grid, x, y) {
    let dir, solutionDir;
    let newX, newY, oppX, oppY;

    if (grid[x][y]) { // Already occupied
        return def.NO_DIRECTION;
    }

    solutionDir = def.NO_DIRECTION;
    for (dir=0; dir<4; dir++) {
        newX = x + DIRS[dir][0];
        newY = y + DIRS[dir][1];
        oppX = x - DIRS[dir][0];
        oppY = y - DIRS[dir][1];
        if (grid.hasXY(oppX, oppY)
            && grid.hasXY(newX, newY)
            && grid[oppX][oppY] == 1)
        {
            // This grid cell would be a valid tile on which to place a door that, facing outward, points dir.
            if (solutionDir != def.NO_DIRECTION) {
                // Already claimed by another direction; no doors here!
                return def.NO_DIRECTION;
            }
            solutionDir = dir;
        }
    }
    return solutionDir;
}



function roomAttachesAt(roomGrid, roomToDungeonX, roomToDungeonY) {
    let xRoom, yRoom, xDungeon, yDungeon, i, j;

    for (xRoom = 0; xRoom < roomGrid.width; xRoom++) {
        for (yRoom = 0; yRoom < roomGrid.height; yRoom++) {
            if (roomGrid[xRoom][yRoom]) {
                xDungeon = xRoom + roomToDungeonX;
                yDungeon = yRoom + roomToDungeonY;

                for (i = xDungeon - 1; i <= xDungeon + 1; i++) {
                    for (j = yDungeon - 1; j <= yDungeon + 1; j++) {
                        if (!SITE.grid.hasXY(i, j)
                            || SITE.grid.isBoundaryXY(i, j)
                            || SITE.grid[i][j] > 0)
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


//
// function insertRoomAt(destGrid, roomGrid, roomToDungeonX, roomToDungeonY, xRoom, yRoom, tile) {
//     let newX, newY;
//     let dir;
//
//     // GW.debug.log("insertRoomAt: ", xRoom + roomToDungeonX, yRoom + roomToDungeonY);
//
//     destGrid[xRoom + roomToDungeonX][yRoom + roomToDungeonY] = roomGrid[xRoom][yRoom] ? (tile || roomGrid[xRoom][yRoom]) : 0;
//     for (dir = 0; dir < 4; dir++) {
//         newX = xRoom + DIRS[dir][0];
//         newY = yRoom + DIRS[dir][1];
//         if (roomGrid.hasXY(newX, newY)
//             && roomGrid[newX][newY]
//             && destGrid.hasXY(newX + roomToDungeonX, newY + roomToDungeonY)
//             && (destGrid[newX + roomToDungeonX][newY + roomToDungeonY] == NOTHING))
//         {
//           insertRoomAt(destGrid, roomGrid, roomToDungeonX, roomToDungeonY, newX, newY, tile);
//         }
//     }
// }



function attachRoomToDungeon(roomMap, doorSites, placeDoor) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / SITE.height);
      const y = LOCS[i] % SITE.height;

      const dir = directionOfDoorSite(SITE.grid, x, y);
      if (dir != def.NO_DIRECTION) {
        const oppDir = OPP_DIRS[dir];

        const offsetX = x - doorSites[oppDir][0];
        const offsetY = y - doorSites[oppDir][1];

        if (doorSites[oppDir][0] != -1
            && roomAttachesAt(roomMap, offsetX, offsetY))
        {
          // GW.debug.log("attachRoom: ", x, y, oppDir);

          // Room fits here.
          offsetApply(SITE.grid, roomMap, offsetX, offsetY);
          if (placeDoor !== false) {
            SITE.grid[x][y] = (typeof placeDoor === 'number') ? placeDoor : DOOR; // Door site.
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

      const dir = directionOfDoorSite(roomGrid, x, y);
      if (dir != def.NO_DIRECTION) {
        const d = DIRS[dir];
        if (roomAttachesAt(roomGrid, xy[0] - x, xy[1] - y)) {
          offsetApply(SITE.grid, roomGrid, xy[0] - x, xy[1] - y);
          if (placeDoor !== false) {
            SITE.grid[xy[0]][xy[1]] = (typeof placeDoor === 'number') ? placeDoor : DOOR; // Door site.
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



function insertRoomAtXY(x, y, roomMap, doorSites, placeDoor) {

  const dirs = sequence(4);
  random.shuffle(dirs);

  for(let dir of dirs) {
    const oppDir = OPP_DIRS[dir];

    if (doorSites[oppDir][0] != -1
        && roomAttachesAt(roomMap, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
    {
      // GW.debug.log("attachRoom: ", x, y, oppDir);

      // Room fits here.
      const offX = x - doorSites[oppDir][0];
      const offY = y - doorSites[oppDir][1];
      offsetApply(SITE.grid, roomMap, offX, offY);
      if (placeDoor !== false) {
        SITE.grid[x][y] = (typeof placeDoor === 'number') ? placeDoor : DOOR; // Door site.
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


function attachRoomAtDoors(roomMap, roomDoors, siteDoors, placeDoor) {

  const doorIndexes = sequence(siteDoors.length);
  random.shuffle(doorIndexes);

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < doorIndexes.length; i++) {
    const index = doorIndexes[i];
    const x = siteDoors[index][0];
    const y = siteDoors[index][1];

    const doors = insertRoomAtXY(x, y, roomMap, roomDoors, placeDoor);
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

  const lakeGrid = allocGrid(SITE.width, SITE.height, 0);

  for (; lakeMaxHeight >= lakeMinSize && lakeMaxWidth >= lakeMinSize && count < maxCount; lakeMaxHeight--, lakeMaxWidth -= 2) { // lake generations

    lakeGrid.fill(NOTHING);
    const bounds = GW.grid.fillBlob(lakeGrid, 5, 4, 4, lakeMaxWidth, lakeMaxHeight, 55, "ffffftttt", "ffffttttt");

    for (k=0; k < tries && count < maxCount; k++) { // placement attempts
        // propose a position for the top-left of the lakeGrid in the dungeon
        x = random.range(1 - bounds.x, lakeGrid.width - bounds.width - bounds.x - 2);
        y = random.range(1 - bounds.y, lakeGrid.height - bounds.height - bounds.y - 2);

      if (canDisrupt || !lakeDisruptsPassability(lakeGrid, -x, -y)) { // level with lake is completely connected
        console.log("Placed a lake!", x, y);

        ++count;
        // copy in lake
        for (i = 0; i < bounds.width; i++) {  // skip boundary
          for (j = 0; j < bounds.height; j++) { // skip boundary
              if (lakeGrid[i + bounds.x][j + bounds.y]) {
                const sx = i + bounds.x + x;
                const sy = j + bounds.y + y;
                if (!SITE.isLake(sx, sy)) {
                  if (SITE.grid[sx][sy] == BRIDGE || SITE.grid[sx][sy] == DOOR) {
                    SITE.grid[sx][sy] = FLOOR;
                  }
                  SITE.grid[sx][sy] += LAKE;
                }
              }
          }
        }
        break;
      }
    }
  }
  freeGrid(lakeGrid);
  return count;

}

dungeon.digLake = digLake;


function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {
    let result;
    let i, j, x, y;

    const walkableGrid = allocGrid(lakeGrid.width, lakeGrid.height, 0);
    let disrupts = false;

    x = y = -1;
    // Get all walkable locations after lake added
    SITE.grid.forEach( (v, i, j) => {
      const lakeX = i + dungeonToGridX;
      const lakeY = j + dungeonToGridY;
      if (v == FLOOR || v == DOOR || v == BRIDGE) {
        if (lakeGrid.hasXY(lakeX, lakeY) && lakeGrid[lakeX][lakeY]) return;
        walkableGrid[i][j] = FLOOR;
      }
      else if (v == UP_STAIRS || v == DOWN_STAIRS) {
        if (lakeGrid.hasXY(lakeX, lakeY) && lakeGrid[lakeX][lakeY]) {
          disrupts = true;
        }
        else {
          walkableGrid[i][j] = FLOOR;
        }
      }
    });

    let first = true;
    for(let i = 0; i < walkableGrid.width && !disrupts; ++i) {
      for(let j = 0; j < walkableGrid.height && !disrupts; ++j) {
        if (walkableGrid[i][j] == FLOOR) {
          if (first) {
            GW.grid.floodFill(walkableGrid, i, j, FLOOR, DOOR);
            first = false;
          }
          else {
            disrupts = true;
          }
        }
      }
    }

    GW.grid.free(walkableGrid);
    return disrupts;
}



// Add some loops to the otherwise simply connected network of rooms.
export function addLoops(minimumPathingDistance, maxConnectionLength) {
    let newX, newY, oppX, oppY;
    let i, j, d, x, y;

    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.grid;
    const pathGrid = allocGrid(SITE.width, SITE.height);
    const costGrid = allocGrid(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    siteGrid.forEach( (v, i, j) => {
      costGrid[i][j] = SITE.isPassable(i, j) ? 1 : def.PDS_OBSTRUCTION;
    });

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        const tile = siteGrid[x][y];
        if (!tile || tile == WALL) {
            for (d=0; d <= 1; d++) { // Try a horizontal door, and then a vertical door.
                newX = x + dirCoords[d][0];
                newY = y + dirCoords[d][1];
                oppX = x - dirCoords[d][0];
                oppY = y - dirCoords[d][1];
                j = maxConnectionLength;

                // check up/left
                if (SITE.isPassable(newX, newY)) {
                  oppX = x;
                  oppY = y;

                  for(j = 0; j < maxConnectionLength; ++j) {
                    oppX -= dirCoords[d][0];
                    oppY -= dirCoords[d][1];

                    if (SITE.isPassable(oppX, oppY)) {
                      break;
                    }
                  }
                }
                else if (SITE.isPassable(oppX, oppY)) {
                  newX = x;
                  newY = y;

                  for(j = 0; j < maxConnectionLength; ++j) {
                    newX += dirCoords[d][0];
                    newY += dirCoords[d][1];

                    if (SITE.isPassable(newX, newY)) {
                      break;
                    }
                  }
                }

                if (j < maxConnectionLength) {
                  calculateDistances(pathGrid, newX, newY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[newX][newY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[oppX][oppY] > minimumPathingDistance) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      debug.log('Adding Loop', newX, newY, ' => ', oppX, oppY);

                      while(oppX !== newX || oppY !== newY) {
                        const siteTile = siteGrid[oppX][oppY];
                        if (!siteTile || siteTile == WALL) {
                          siteGrid[oppX][oppY] = FLOOR;
                          costGrid[oppX][oppY] = 1;          // (Cost map also needs updating.)
                        }
                        oppX += dirCoords[d][0];
                        oppY += dirCoords[d][1];
                      }
                      siteGrid[x][y] = DOOR;             // then turn the tile into a doorway.
                      break;
                  }
                }
            }
        }
    }
    freeGrid(pathGrid);
    freeGrid(costGrid);
}

dungeon.addLoops = addLoops;


function isBridgeCandidate(x, y, bridgeDir) {
  if (!SITE.isLake(x, y)) return false;
  if (!SITE.isLake(x + bridgeDir[1], y + bridgeDir[0])) return false;
  if (!SITE.isLake(x - bridgeDir[1], y - bridgeDir[0])) return false;
  return true;
}

// Add some loops to the otherwise simply connected network of rooms.
export function addBridges(minimumPathingDistance, maxConnectionLength) {
    let newX, newY, oppX, oppY;
    let i, j, d, x, y;

    maxConnectionLength = maxConnectionLength || 1; // by default only break walls down

    const siteGrid = SITE.grid;
    const pathGrid = allocGrid(SITE.width, SITE.height);
    const costGrid = allocGrid(SITE.width, SITE.height);

    const dirCoords = [[1, 0], [0, 1]];

    siteGrid.forEach( (v, i, j) => {
      costGrid[i][j] = SITE.isPassable(i, j) ? 1 : def.PDS_OBSTRUCTION;
    });

    for (i = 0; i < LOCS.length; i++) {
        x = Math.floor(LOCS[i] / siteGrid.height);
        y = LOCS[i] % siteGrid.height;

        if (SITE.isPassable(x, y)) {
            for (d=0; d <= 1; d++) { // Try right, then down
                const bridgeDir = dirCoords[d];
                newX = x + bridgeDir[0];
                newY = y + bridgeDir[1];
                j = maxConnectionLength;

                // check for line of lake tiles
                // if (isBridgeCandidate(newX, newY, bridgeDir)) {
                if (SITE.isLake(newX, newY, bridgeDir)) {
                  for(j = 0; j < maxConnectionLength; ++j) {
                    newX += bridgeDir[0];
                    newY += bridgeDir[1];

                    // if (!isBridgeCandidate(newX, newY, bridgeDir)) {
                    if (!SITE.isLake(newX, newY, bridgeDir)) {
                      break;
                    }
                  }
                }

                if (SITE.isPassable(newX, newY) && j < maxConnectionLength) {
                  calculateDistances(pathGrid, newX, newY, costGrid, false);
                  // pathGrid.fill(30000);
                  // pathGrid[newX][newY] = 0;
                  // dijkstraScan(pathGrid, costGrid, false);
                  if (pathGrid[x][y] > minimumPathingDistance) { // and if the pathing distance between the two flanking floor tiles exceeds minimumPathingDistance,

                      debug.log('Adding Bridge', x, y, ' => ', newX, newY);

                      while(x !== newX || y !== newY) {
                        if (isBridgeCandidate(x, y, bridgeDir)) {
                          siteGrid[x][y] = BRIDGE;
                          costGrid[x][y] = 1;          // (Cost map also needs updating.)
                        }
                        else {
                          siteGrid[x][y] = FLOOR;
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
    freeGrid(pathGrid);
    freeGrid(costGrid);
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
					if ((SITE.isPassable(i + k, j))
						&& (!SITE.isPassable(i + (1-k), j))
						&& (SITE.isObstruction(i + (1-k), j))
						&& (!SITE.isPassable(i + k, j+1))
						&& (SITE.isObstruction(i + k, j+1))
						&& (SITE.isPassable(i + (1-k), j+1)))
          {
						if (random.percent(50)) {
							x1 = i + (1-k);
							x2 = i + k;
							y1 = j;
						} else {
							x1 = i + k;
							x2 = i + (1-k);
							y1 = j + 1;
						}
            diagonalCornerRemoved = true;
            SITE.grid[x1][y1] = SITE.grid[x2][y1];
            debug.log('Removed diagonal opening', x1, y1);
					}
				}
			}
		}
	} while (diagonalCornerRemoved == true);
}

dungeon.removeDiagonalOpenings = removeDiagonalOpenings;


function finishDoors(doorTile, floorTile, secretDoorChance, secretDoorTile) {
  let i, j;

	for (i=1; i<SITE.width-1; i++) {
		for (j=1; j<SITE.height-1; j++) {
			if (SITE.isDoor(i, j))
			{
				if ((SITE.isPassable(i+1, j) || SITE.isPassable(i-1, j))
					&& (SITE.isPassable(i, j+1) || SITE.isPassable(i, j-1))) {
					// If there's passable terrain to the left or right, and there's passable terrain
					// above or below, then the door is orphaned and must be removed.
					SITE.grid[i][j] = FLOOR;
          debug.log('Removed orphan door', i, j);
				} else if ((SITE.isBlocked(i+1, j) ? 1 : 0)
						   + (SITE.isBlocked(i-1, j) ? 1 : 0)
						   + (SITE.isBlocked(i, j+1) ? 1 : 0)
						   + (SITE.isBlocked(i, j-1) ? 1 : 0) >= 3) {
					// If the door has three or more pathing blocker neighbors in the four cardinal directions,
					// then the door is orphaned and must be removed.
          SITE.grid[i][j] = FLOOR;
          debug.log('Removed blocked door', i, j);
				}
			}
		}
	}
}

dungeon.finishDoors = finishDoors;
