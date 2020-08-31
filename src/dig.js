
import { WARN, ERROR, sequence, first } from './utils.js';
import { Grid, allocGrid, freeGrid } from './grid.js';
import { random } from './random.js';
import { dig as DIG, diggers as DIGGERS, def } from './gw.js';

const DIRS = def.dirs;
const OPP_DIRS = [def.DOWN, def.UP, def.RIGHT, def.LEFT];

const WALL = 0;
const FLOOR = 1;
const DOOR = 2;
const LAKE = 3;


export function installDigger(id, fn, config) {
  config = fn(config || {});	// call to have function bind itself to the config
  config.fn = fn;
  config.id = id;
  DIGGERS[id] = config;
  return config;
}

DIG.installDigger = installDigger;

function _ensureBasicDiggerConfig(config, opts) {
  config = config || {};
  opts = opts || {};

  Object.entries(opts).forEach( ([key,expect]) => {
    const have = config[key];

    if (expect === true) {	// needs to be a number > 0
      if (typeof have !== 'number') {
        ERROR('Invalid configuration for digger: ' + key + ' expected number received ' + typeof have);
      }
    }
    else if (typeof expect === 'number') {	// needs to be a number, this is the default
      const have = config[key];
      if (typeof have !== 'number') {
        config[key] = expect;	// provide default
      }
    }
    else if (Array.isArray(expect)) {	// needs to be an array with this size, these are the defaults
      if (typeof have === 'number') {
        config[key] = new Array(expect.length).fill(have);
      }
      else if (!Array.isArray(have)) {
        WARN('Received unexpected config for digger : ' + key + ' expected array, received ' + typeof have + ', using defaults.');
        config[key] = expect.slice();
      }
      else if (expect.length > have.length) {
        for(let i = have.length; i < expect.length; ++i) {
          have[i] = expect[i];
        }
      }
    }
    else {
      WARN('Unexpected digger configuration parameter: ', key, expect);
    }
  });

  return config;
}


export function designCavern(config, grid) {
  config = _ensureBasicDiggerConfig(config, { width: [3,12], height: [4,8] });
  if (!grid) return config;

  let destX, destY;
  let caveX, caveY, caveWidth, caveHeight;
  let fillX, fillY;
  let foundFillPoint = false;
  let blobGrid;

  blobGrid = allocGrid(grid.width, grid.height, 0);

  const minWidth  = config.width[0];
  const maxWidth  = config.width[1];
  const minHeight = config.height[0];
  const maxHeight = config.height[1];

  grid.fill(0);
  const bounds = blobGrid.fillBlob(5, minWidth, minHeight, maxWidth, maxHeight, 55, "ffffffttt", "ffffttttt");

//    colorOverDungeon(/* Color. */darkGray);
//    hiliteGrid(blobGrid, /* Color. */tanColor, 80);
//    temporaryMessage("Here's the cave:", true);

  // Position the new cave in the middle of the grid...
  destX = Math.floor((grid.width - bounds.width) / 2);
  destY = Math.floor((grid.height - bounds.height) / 2);

  // ...pick a floodfill insertion point...
  for (fillX = 0; fillX < grid.width && !foundFillPoint; fillX++) {
      for (fillY = 0; fillY < grid.height && !foundFillPoint; fillY++) {
          if (blobGrid[fillX][fillY]) {
              foundFillPoint = true;
          }
      }
  }
  // ...and copy it to the master grid.
  insertRoomAt(grid, blobGrid, destX - bounds.x, destY - bounds.y, fillX, fillY);
  freeGrid(blobGrid);
}

DIG.cavern = designCavern;


export function designChoiceRoom(config, grid) {
  config = config || {};
  if (!Array.isArray(config.choices)) {
    ERROR('Expected choices array in digger config.');
  }
  for(let choice of config.choices) {
    if (!DIGGERS[choice]) {
      ERROR('Missing digger choice: ' + choice);
    }
  }
  if (!grid) return config;

  const id = random.item(config.choices);
  const digger = DIGGERS[id];
  digger.fn(digger, grid);
}

DIG.choiceRoom = designChoiceRoom;


// This is a special room that appears at the entrance to the dungeon on depth 1.
export function designEntranceRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { width: [8,20], height: [10,5] });
  if (!grid) return config;

  let roomWidth, roomHeight, roomWidth2, roomHeight2, roomX, roomY, roomX2, roomY2;

  grid.fill(0);

  roomWidth = config.width[0];
  roomHeight = config.height[0];
  roomWidth2 = config.width[1];
  roomHeight2 = config.height[1];

  // ALWAYS start at bottom+center of map
  roomX = Math.floor(grid.width/2 - roomWidth/2 - 1);
  roomY = grid.height - roomHeight - 2;
  roomX2 = Math.floor(grid.width/2 - roomWidth2/2 - 1);
  roomY2 = grid.height - roomHeight2 - 2;

  grid.fillRect(roomX, roomY, roomWidth, roomHeight, 1);
  grid.fillRect(roomX2, roomY2, roomWidth2, roomHeight2, 1);
}


DIG.entranceRoom = designEntranceRoom;


export function designCrossRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { width: [3,12], height: [3,7], width2: [4,20], height2: [2,5] });
  if (!grid) return config;

  let roomWidth, roomHeight, roomWidth2, roomHeight2, roomX, roomY, roomX2, roomY2;

  grid.fill(0);

  roomWidth = random.range(config.width[0], config.width[1]);
  roomX = random.range(Math.max(0, Math.floor(grid.width/2) - (roomWidth - 1)), Math.min(grid.width, Math.floor(grid.width/2)));
  roomWidth2 = random.range(config.width2[0], config.width2[1]);
  roomX2 = (roomX + Math.floor(roomWidth / 2) + random.range(0, 2) + random.range(0, 2) - 3) - Math.floor(roomWidth2 / 2);

  roomHeight = random.range(config.height[0], config.height[1]);
  roomY = Math.floor(grid.height/2 - roomHeight);

  roomHeight2 = random.range(config.height2[0], config.height2[1]);
  roomY2 = Math.floor(grid.height/2 - roomHeight2 - (random.range(0, 2) + random.range(0, 1)));

  grid.fillRect(roomX - 5, roomY + 5, roomWidth, roomHeight, 1);
  grid.fillRect(roomX2 - 5, roomY2 + 5, roomWidth2, roomHeight2, 1);
}

DIG.crossRoom = designCrossRoom;


export function designSymmetricalCrossRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { width: [4,8], height: [4,5], width2: [3,4], height2: [3,3] });
  if (!grid) return config;

  let majorWidth, majorHeight, minorWidth, minorHeight;

  grid.fill(0);

  majorWidth = random.range(config.width[0], config.width[1]);
  majorHeight = random.range(config.height[0], config.height[1]);

  minorWidth = random.range(config.width2[0], config.width2[1]);
  if (majorHeight % 2 == 0) {
      minorWidth -= 1;
  }
  minorHeight = random.range(config.height2[0], config.height2[1]);	// originally 2,3?
  if (majorWidth % 2 == 0) {
      minorHeight -= 1;
  }

  grid.fillRect(Math.floor((grid.width - majorWidth)/2), Math.floor((grid.height - minorHeight)/2), majorWidth, minorHeight, 1);
  grid.fillRect(Math.floor((grid.width - minorWidth)/2), Math.floor((grid.height - majorHeight)/2), minorWidth, majorHeight, 1);
}

DIG.symmetricalCrossRoom = designSymmetricalCrossRoom;


export function designRectangularRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { width: [3,6], height: [2,4] });
  if (!grid) return config;

  let width, height;

  grid.fill(0);
  width = random.range(config.width[0], config.width[1]);
  height = random.range(config.height[0], config.height[1]);
  grid.fillRect(Math.floor((grid.width - width) / 2), Math.floor((grid.height - height) / 2), width, height, 1);
}

DIG.rectangularRoom = designRectangularRoom;


export function designCircularRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { radius: [2,4] });
  if (!grid) return config;

  let radius = random.range(config.radius[0], config.radius[1]);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, 1);

}

DIG.circularRoom = designCircularRoom;


export function designBrogueCircularRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { radius: [2,4], radius2: [4,10], altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
  if (!grid) return config;

  let radius;

  let params = random.percent(config.altChance || 5) ? config.radius2 : config.radius;
  radius = random.range(params[0], params[1]);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, 1);

  if (radius > config.ringMinWidth + config.holeMinSize
      && random.percent(config.holeChance))
  {
      grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), random.range(config.holeMinSize, radius - config.holeMinSize), 0);
  }
}

DIG.brogueCircularRoom = designBrogueCircularRoom;


export function designChunkyRoom(config, grid) {
  config = _ensureBasicDiggerConfig(config, { count: [2,8] });
  if (!grid) return config;

  let i, x, y;
  let minX, maxX, minY, maxY;
  let chunkCount = random.range(config.count[0], config.count[1]);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), 2, 1);
  minX = Math.floor(grid.width/2) - 3;
  maxX = Math.floor(grid.width/2) + 3;
  minY = Math.floor(grid.height/2) - 3;
  maxY = Math.floor(grid.height/2) + 3;

  for (i=0; i<chunkCount;) {
      x = random.range(minX, maxX);
      y = random.range(minY, maxY);
      if (grid[x][y]) {
//            colorOverDungeon(/* Color. */darkGray);
//            hiliteGrid(grid, /* Color. */white, 100);

          grid.fillCircle(x, y, 2, 1);
          i++;
          minX = Math.max(1, Math.min(x - 3, minX));
          maxX = Math.min(grid.width - 2, Math.max(x + 3, maxX));
          minY = Math.max(1, Math.min(y - 3, minY));
          maxY = Math.min(grid.height - 2, Math.max(y + 3, maxY));

//            hiliteGrid(grid, /* Color. */green, 50);
//            temporaryMessage("Added a chunk:", true);
      }
  }
}

DIG.chunkyRoom = designChunkyRoom;


let DIG_GRID;
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

  freeGrid(DIG_GRID);
  DIG_GRID = allocGrid(width, height);

  LOCS = sequence(width * height);
  random.shuffle(LOCS);

  SITE = Object.assign({ width, height, grid: DIG_GRID, locations: { start: [startX, startY] } }, opts);

  return SITE;
}

DIG.startDig = startDig;

function mapGridToTile(v) {
  if (v == 0) return 'WALL';
  if (v == 2) return 'DOOR';
  return 'FLOOR';
}

function finishDig(tileFn) {
  // const map = GW.make.map(DIG_GRID.width, DIG_GRID.height);
  //
  // // convert grid to map
  // tileFn = tileFn || mapGridToTile;
  //
  // GW.grid.forEach(DIG_GRID, (v, x, y) => {
  //   const tile = tileFn(v);
  //   map.cells[x][y].layers[0] = tile || 'FLOOR';
  // });

  freeGrid(DIG_GRID);
  SITE.grid = null;
  DIG_GRID = null;

  // return map;
}

DIG.finishDig = finishDig;


// Returns an array of door sites if successful
export function digRoom(opts={}) {
  const hallChance = first('hallChance', opts, SITE, 0);
  const diggerId = opts.digger || opts.id || 'SMALL'; // TODO - get random id

  const digger = DIGGERS[diggerId];
  if (!digger) {
    throw new Error('Failed to find digger: ' + diggerId);
  }

  const config = Object.assign({}, digger, opts);

  const grid = allocGrid(DIG_GRID.width, DIG_GRID.height);

  let result = false;
  let tries = opts.tries || 10;
  while(--tries >= 0 && !result) {
    grid.fill(0);

    digger.fn(config, grid);
    const doors = chooseRandomDoorSites(grid);
    if (random.percent(hallChance)) {
      attachHallway(grid, doors);
    }

    if (opts.doors && opts.doors.length) {
      result = attachRoomAtDoors(grid, doors, opts.doors);
    }
    else {
      result = attachRoomToDungeon(grid, doors);
    }

  }

  freeGrid(grid);

  return result;
}

DIG.digRoom = digRoom;


export function validStairLoc(x, y, grid) {
  let count = 0;
  for(let i = 0; i < 4; ++i) {
    const dir = def.dirs[i];
    if (!grid.hasXY(x + dir[0], y + dir[1])) return false;
    if (grid[x + dir[0]][y + dir[1]]) {
      count += 1;
    }
  }
  return count == 1;
}

DIG.validStairLoc = validStairLoc;


export function randomDoor(sites, matchFn) {
  matchFn = matchFn || GW.utils.TRUE;
  const s = sequence(sites.length);
  random.shuffle(s);

  for(let dir of s) {
    if (sites[dir][0] >= 0
      && matchFn(sites[dir][0], sites[dir][1], DIG_GRID))
    {
      return sites[dir];
    }
  }
  return null;
}

DIG.randomDoor = randomDoor;


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
                        grid[i][j] = dir + 2; // So as not to conflict with 0 or 1, which are used to indicate exterior/interior.
                    }
                }
            }
        }
    }

  let doorSites = [];
  // Pick four doors, one in each direction, and store them in doorSites[dir].
  for (dir=0; dir<4; dir++) {
      const loc = grid.randomMatchingXY(dir + 2) || [-1, -1];
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



function roomAttachesAt(roomMap, roomToDungeonX, roomToDungeonY) {
    let xRoom, yRoom, xDungeon, yDungeon, i, j;

    for (xRoom = 0; xRoom < roomMap.width; xRoom++) {
        for (yRoom = 0; yRoom < roomMap.height; yRoom++) {
            if (roomMap[xRoom][yRoom]) {
                xDungeon = xRoom + roomToDungeonX;
                yDungeon = yRoom + roomToDungeonY;

                for (i = xDungeon - 1; i <= xDungeon + 1; i++) {
                    for (j = yDungeon - 1; j <= yDungeon + 1; j++) {
                        if (!DIG_GRID.hasXY(i, j)
                            || DIG_GRID.isBoundaryXY(i, j)
                            || DIG_GRID[i][j] > 0)
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



function insertRoomAt(destGrid, roomGrid, roomToDungeonX, roomToDungeonY, xRoom, yRoom) {
    let newX, newY;
    let dir;

    // GW.debug.log("insertRoomAt: ", xRoom + roomToDungeonX, yRoom + roomToDungeonY);

    destGrid[xRoom + roomToDungeonX][yRoom + roomToDungeonY] = roomGrid[xRoom][yRoom];
    for (dir = 0; dir < 4; dir++) {
        newX = xRoom + DIRS[dir][0];
        newY = yRoom + DIRS[dir][1];
        if (roomGrid.hasXY(newX, newY)
            && roomGrid[newX][newY]
            && destGrid.hasXY(newX + roomToDungeonX, newY + roomToDungeonY)
            && destGrid[newX + roomToDungeonX][newY + roomToDungeonY] == 0)
        {
          insertRoomAt(destGrid, roomGrid, roomToDungeonX, roomToDungeonY, newX, newY);
        }
    }
}


function attachRoomToDungeon(roomMap, doorSites) {

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < LOCS.length; i++) {
      const x = Math.floor(LOCS[i] / DIG_GRID.height);
      const y = LOCS[i] % DIG_GRID.height;

      const dir = directionOfDoorSite(DIG_GRID, x, y);
      if (dir != def.NO_DIRECTION) {
        const oppDir = OPP_DIRS[dir];

        if (doorSites[oppDir][0] != -1
            && roomAttachesAt(roomMap, x - doorSites[oppDir][0], y - doorSites[oppDir][1]))
        {
          // GW.debug.log("attachRoom: ", x, y, oppDir);

          // Room fits here.
          insertRoomAt(DIG_GRID, roomMap, x - doorSites[oppDir][0], y - doorSites[oppDir][1], doorSites[oppDir][0], doorSites[oppDir][1]);
          DIG_GRID[x][y] = DOOR; // Door site.
          return true;
        }
      }
  }

  return false;
}

function attachRoomAtXY(x, y, roomMap, doorSites) {

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
      insertRoomAt(DIG_GRID, roomMap, offX, offY, doorSites[oppDir][0], doorSites[oppDir][1]);
      DIG_GRID[x][y] = DOOR; // Door site.
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


function attachRoomAtDoors(roomMap, roomDoors, siteDoors) {

  const doorIndexes = sequence(siteDoors.length);
  random.shuffle(doorIndexes);

  // Slide hyperspace across real space, in a random but predetermined order, until the room matches up with a wall.
  for (let i = 0; i < doorIndexes.length; i++) {
    const index = doorIndexes[i];
    const x = siteDoors[index][0];
    const y = siteDoors[index][1];

    const doors = attachRoomAtXY(x, y, roomMap, roomDoors);
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

    lakeGrid.fill(0);
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
                  SITE.grid[i + bounds.x + x][j + bounds.y + y] = LAKE;
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

DIG.digLake = digLake;


function lakeDisruptsPassability(lakeGrid, dungeonToGridX, dungeonToGridY) {
    let result;
    let i, j, x, y;

    const walkableGrid = allocGrid(lakeGrid.width, lakeGrid.height, 0);

    x = y = -1;
    // Get all walkable locations after lake added
    SITE.grid.forEach( (v, i, j) => {
      if (v == FLOOR || v == DOOR) {
        const lakeX = i + dungeonToGridX;
        const lakeY = j + dungeonToGridY;
        if (lakeGrid.hasXY(lakeX, lakeY) && lakeGrid[lakeX][lakeY]) return;
        walkableGrid[i][j] = FLOOR;
      }
    });

    let first = true;
    let disrupts = false;
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
