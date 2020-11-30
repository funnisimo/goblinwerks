
import * as Grid from './grid.js';
import { random } from './random.js';
import * as Utils from './utils.js';
import { make, def } from './gw.js';

export var digger = {};
export var diggers = {};

digger.debug = Utils.NOOP;

const DIRS = def.dirs;


const TILE = 1;


export function installDigger(id, fn, config) {
  config = fn(config || {});	// call to have function setup the config
  config.fn = fn;
  config.id = id;
  diggers[id] = config;
  return config;
}

digger.install = installDigger;


function checkDiggerConfig(config, opts) {
  config = config || {};
  opts = opts || {};

  if (!config.width || !config.height) Utils.ERROR('All diggers require config to include width and height.');

  Object.entries(opts).forEach( ([key,expect]) => {
    const have = config[key];

    if (expect === true) {	// needs to be a number > 0
      if (typeof have !== 'number') {
        Utils.ERROR('Invalid configuration for digger: ' + key + ' expected number received ' + typeof have);
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
        Utils.WARN('Received unexpected config for digger : ' + key + ' expected array, received ' + typeof have + ', using defaults.');
        config[key] = expect.slice();
      }
      else if (expect.length > have.length) {
        for(let i = have.length; i < expect.length; ++i) {
          have[i] = expect[i];
        }
      }
    }
    else {
      Utils.WARN('Unexpected digger configuration parameter: ', key, expect);
    }
  });

  return config;
}

digger.checkConfig = checkDiggerConfig;


export function digCavern(config, grid) {
  config = digger.checkConfig(config, { width: 12, height: 8 });
  if (!grid) return config;

  let destX, destY;
  let caveX, caveY, caveWidth, caveHeight;
  let fillX, fillY;
  let foundFillPoint = false;
  let blobGrid;

  blobGrid = Grid.alloc(grid.width, grid.height, 0);

  const minWidth  = Math.floor(0.5 * config.width); // 6
  const maxWidth  = config.width;
  const minHeight = Math.floor(0.5 * config.height);  // 4
  const maxHeight = config.height;

  grid.fill(0);
  const bounds = Grid.fillBlob(blobGrid, 5, minWidth, minHeight, maxWidth, maxHeight, 55, "ffffffttt", "ffffttttt");

  // Position the new cave in the middle of the grid...
  destX = Math.floor((grid.width - bounds.width) / 2);
  destY = Math.floor((grid.height - bounds.height) / 2);

  // ...and copy it to the master grid.
  Grid.offsetZip(grid, blobGrid, destX - bounds.x, destY - bounds.y, TILE);
  Grid.free(blobGrid);
  return config.id;
}

digger.cavern = digCavern;


export function digChoiceRoom(config, grid) {
  config = config || {};
  let choices;
  if (Array.isArray(config.choices)) {
    choices = config.choices;
  }
  else if (typeof config.choices == 'object') {
    choices = Object.keys(config.choices);
  }
  else {
    Utils.ERROR('Expected choices to be either array of choices or map { digger: weight }');
  }
  for(let choice of choices) {
    if (!diggers[choice]) {
      Utils.ERROR('Missing digger choice: ' + choice);
    }
  }

  if (!grid) return config;

  let id;
  if (Array.isArray(config.choices)) {
    id = random.item(config.choices);
  }
  else {
    id = random.lottery(config.choices);
  }
  const digger = diggers[id];
  let digConfig = digger;
  if (config.opts) {
    digConfig = Object.assign({}, digger, config.opts);
  }
  // digger.debug('Chose room: ', id);
  digger.fn(digConfig, grid);
  return digger.id;
}

digger.choiceRoom = digChoiceRoom;


// From BROGUE => This is a special room that appears at the entrance to the dungeon on depth 1.
export function digEntranceRoom(config, grid) {
  config = digger.checkConfig(config, { width: 20, height: 10 });
  if (!grid) return config;

  const roomWidth = Math.floor(0.4 * config.width); // 8
  const roomHeight = config.height;
  const roomWidth2 = config.width;
  const roomHeight2 = Math.floor(0.5 * config.height);  // 5

  // ALWAYS start at bottom+center of map
  const roomX = Math.floor(grid.width/2 - roomWidth/2 - 1);
  const roomY = grid.height - roomHeight - 2;
  const roomX2 = Math.floor(grid.width/2 - roomWidth2/2 - 1);
  const roomY2 = grid.height - roomHeight2 - 2;

  grid.fill(0);
  grid.fillRect(roomX, roomY, roomWidth, roomHeight, TILE);
  grid.fillRect(roomX2, roomY2, roomWidth2, roomHeight2, TILE);
  return config.id;
}


digger.entranceRoom = digEntranceRoom;


export function digCrossRoom(config, grid) {
  config = digger.checkConfig(config, { width: 12, height: 20 });
  if (!grid) return config;

  const roomWidth = Math.max(2, Math.floor( config.width * random.range(15, 60) / 100)); // [3,12]
  const roomWidth2 = Math.max(2, Math.floor( config.width * random.range(20, 100) / 100)); // [4,20]
  const roomHeight = Math.max(2, Math.floor( config.height * random.range(50, 100) / 100));  // [3,7]
  const roomHeight2 = Math.max(2, Math.floor( config.height * random.range(25, 75) / 100));  // [2,5]

  const roomX = random.range(Math.max(0, Math.floor(grid.width/2) - (roomWidth - 1)), Math.min(grid.width, Math.floor(grid.width/2)));
  const roomX2 = (roomX + Math.floor(roomWidth / 2) + random.range(0, 2) + random.range(0, 2) - 3) - Math.floor(roomWidth2 / 2);
  const roomY = Math.floor(grid.height/2 - roomHeight);
  const roomY2 = Math.floor(grid.height/2 - roomHeight2 - (random.range(0, 2) + random.range(0, 1)));

  grid.fill(0);

  grid.fillRect(roomX - 5, roomY + 5, roomWidth, roomHeight, TILE);
  grid.fillRect(roomX2 - 5, roomY2 + 5, roomWidth2, roomHeight2, TILE);
  return config.id;
}

digger.crossRoom = digCrossRoom;


export function digSymmetricalCrossRoom(config, grid) {
  config = digger.checkConfig(config, { width: 8, height: 5 });
  if (!grid) return config;

  let majorWidth = Math.floor( config.width * random.range(50, 100) / 100); // [4,8]
  let majorHeight = Math.floor( config.height * random.range(75, 100) / 100); // [4,5]

  let minorWidth = Math.max(2, Math.floor( config.width * random.range(25, 50) / 100));  // [2,4]
  if (majorHeight % 2 == 0 && minorWidth > 2) {
      minorWidth -= 1;
  }
  let minorHeight = Math.max(2, Math.floor( config.height * random.range(25, 50) / 100));	// [2,3]?
  if (majorWidth % 2 == 0 && minorHeight > 2) {
      minorHeight -= 1;
  }

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - majorWidth)/2), Math.floor((grid.height - minorHeight)/2), majorWidth, minorHeight, TILE);
  grid.fillRect(Math.floor((grid.width - minorWidth)/2), Math.floor((grid.height - majorHeight)/2), minorWidth, majorHeight, TILE);
  return config.id;
}

digger.symmetricalCrossRoom = digSymmetricalCrossRoom;


export function digRectangularRoom(config, grid) {
  config = digger.checkConfig(config, { width: 6, height: 4, minPct: 50 });
  if (!grid) return config;

  const width = Math.floor( config.width * random.range(config.minPct, 100) / 100);  // [3,6]
  const height = Math.floor( config.height * random.range(config.minPct, 100) / 100);  // [2,4]

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - width) / 2), Math.floor((grid.height - height) / 2), width, height, TILE);
  return config.id;
}

digger.rectangularRoom = digRectangularRoom;


export function digCircularRoom(config, grid) {
  config = digger.checkConfig(config, { width: 6, height: 6 });
  if (!grid) return config;

  const radius = Math.floor( (Math.min(config.width, config.height)-1) * random.range(75, 100) / 200);  // [3,4]

  grid.fill(0);
  if (radius > 1) {
    grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, TILE);
  }

  return config.id;
}

digger.circularRoom = digCircularRoom;


export function digBrogueDonut(config, grid) {
  config = digger.checkConfig(config, { width: 10, height: 10, altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
  if (!grid) return config;

  const radius = Math.floor( Math.min(config.width, config.height) * random.range(75, 100) / 100);  // [5,10]

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, TILE);

  if (radius > config.ringMinWidth + config.holeMinSize
      && random.chance(config.holeChance))
  {
      grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), random.range(config.holeMinSize, radius - config.holeMinSize), 0);
  }
  return config.id;
}

digger.brogueDonut = digBrogueDonut;


export function digChunkyRoom(config, grid) {
  config = digger.checkConfig(config, { count: 8 });
  if (!grid) return config;

  let i, x, y;
  let minX, maxX, minY, maxY;
  let chunkCount = Math.floor( config.count * random.range(25, 100) / 100); // [2,8]

  minX = Math.floor(grid.width/2) - Math.floor(config.width/2);
  maxX = Math.floor(grid.width/2) + Math.floor(config.width/2);
  minY = Math.floor(grid.height/2) - Math.floor(config.height/2);
  maxY = Math.floor(grid.height/2) + Math.floor(config.height/2);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), 2, 1);

  for (i=0; i<chunkCount;) {
      x = random.range(minX, maxX);
      y = random.range(minY, maxY);
      if (grid[x][y]) {
//            colorOverDungeon(/* Color. */darkGray);
//            hiliteGrid(grid, /* Color. */white, 100);

          if (x - 2 < minX) continue;
          if (x + 2 > maxX) continue;
          if (y - 2 < minY) continue;
          if (y + 2 > maxY) continue;

          grid.fillCircle(x, y, 2, TILE);
          i++;

//            hiliteGrid(grid, /* Color. */green, 50);
//            temporaryMessage("Added a chunk:", true);
      }
  }
  return config.id;
}

digger.chunkyRoom = digChunkyRoom;



export function chooseRandomDoorSites(sourceGrid) {
  let i, j, k, newX, newY;
  let dir;
  let doorSiteFailed;

  const grid = Grid.alloc(sourceGrid.width, sourceGrid.height);
  grid.copy(sourceGrid);

  for (i=0; i<grid.width; i++) {
      for (j=0; j<grid.height; j++) {
          if (!grid[i][j]) {
              dir = Grid.directionOfDoorSite(grid, i, j);
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

  Grid.free(grid);
  return doorSites;
}

digger.chooseRandomDoorSites = chooseRandomDoorSites;



export function attachHallway(grid, doorSitesArray, opts) {
    let i, x, y, newX, newY;
    let dirs = []; // [4];
    let length;
    let dir, dir2;
    let allowObliqueHallwayExit;

    opts = opts || {};
    const tile = opts.tile || 1;

    const horizontalLength = Utils.firstOpt('horizontalHallLength', opts, [9,15]);
    const verticalLength = Utils.firstOpt('verticalHallLength', opts, [2,9]);

    // Pick a direction.
    dir = opts.dir;
    if (dir === undefined) {
      const dirs = random.sequence(4);
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
    x = Utils.clamp(x - DIRS[dir][0], 0, grid.width - 1);
    y = Utils.clamp(y - DIRS[dir][1], 0, grid.height - 1); // Now (x, y) points at the last interior cell of the hallway.
    allowObliqueHallwayExit = random.chance(15);
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

digger.attachHallway = attachHallway;
