
import { utils as UTILS } from './utils.js';
import { grid as GRID } from './grid.js';
import { random } from './random.js';
import { debug, def } from './gw.js';


export var digger = {};
export var diggers = {};

const DIRS = def.dirs;


const TILE = 1;


export function installDigger(id, fn, config) {
  config = fn(config || {});	// call to have function bind itself to the config
  config.fn = fn;
  config.id = id;
  diggers[id] = config;
  return config;
}

digger.install = installDigger;


function checkDiggerConfig(config, opts) {
  config = config || {};
  opts = opts || {};

  Object.entries(opts).forEach( ([key,expect]) => {
    const have = config[key];

    if (expect === true) {	// needs to be a number > 0
      if (typeof have !== 'number') {
        UTILS.ERROR('Invalid configuration for digger: ' + key + ' expected number received ' + typeof have);
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
        UTILS.WARN('Received unexpected config for digger : ' + key + ' expected array, received ' + typeof have + ', using defaults.');
        config[key] = expect.slice();
      }
      else if (expect.length > have.length) {
        for(let i = have.length; i < expect.length; ++i) {
          have[i] = expect[i];
        }
      }
    }
    else {
      UTILS.WARN('Unexpected digger configuration parameter: ', key, expect);
    }
  });

  return config;
}

digger.checkConfig = checkDiggerConfig;


export function digCavern(config, grid) {
  config = digger.checkConfig(config, { width: [3,12], height: [4,8] });
  if (!grid) return config;

  let destX, destY;
  let caveX, caveY, caveWidth, caveHeight;
  let fillX, fillY;
  let foundFillPoint = false;
  let blobGrid;

  blobGrid = GRID.alloc(grid.width, grid.height, 0);

  const minWidth  = config.width[0];
  const maxWidth  = config.width[1];
  const minHeight = config.height[0];
  const maxHeight = config.height[1];

  grid.fill(0);
  const bounds = GRID.fillBlob(blobGrid, 5, minWidth, minHeight, maxWidth, maxHeight, 55, "ffffffttt", "ffffttttt");

  // Position the new cave in the middle of the grid...
  destX = Math.floor((grid.width - bounds.width) / 2);
  destY = Math.floor((grid.height - bounds.height) / 2);

  // ...and copy it to the master grid.
  GRID.offsetZip(grid, blobGrid, destX - bounds.x, destY - bounds.y, config.tile);
  GRID.free(blobGrid);
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
    UTILS.ERROR('Expected choices to be either array of choices or map { digger: weight }');
  }
  for(let choice of choices) {
    if (!diggers[choice]) {
      UTILS.ERROR('Missing digger choice: ' + choice);
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
  debug.log('Choose room: ', id);
  digger.fn(digger, grid);
}

digger.choiceRoom = digChoiceRoom;


// This is a special room that appears at the entrance to the dungeon on depth 1.
export function digEntranceRoom(config, grid) {
  config = digger.checkConfig(config, { width: [8,20], height: [10,5] });
  if (!grid) return config;

  const roomWidth = config.width[0];
  const roomHeight = config.height[0];
  const roomWidth2 = config.width[1];
  const roomHeight2 = config.height[1];

  // ALWAYS start at bottom+center of map
  const roomX = Math.floor(grid.width/2 - roomWidth/2 - 1);
  const roomY = grid.height - roomHeight - 2;
  const roomX2 = Math.floor(grid.width/2 - roomWidth2/2 - 1);
  const roomY2 = grid.height - roomHeight2 - 2;

  grid.fill(0);
  grid.fillRect(roomX, roomY, roomWidth, roomHeight, config.tile || TILE);
  grid.fillRect(roomX2, roomY2, roomWidth2, roomHeight2, config.tile || TILE);
}


digger.entranceRoom = digEntranceRoom;


export function digCrossRoom(config, grid) {
  config = digger.checkConfig(config, { width: [3,12], height: [3,7], width2: [4,20], height2: [2,5] });
  if (!grid) return config;

  const roomWidth = random.range(config.width[0], config.width[1]);
  const roomWidth2 = random.range(config.width2[0], config.width2[1]);
  const roomHeight = random.range(config.height[0], config.height[1]);
  const roomHeight2 = random.range(config.height2[0], config.height2[1]);

  const roomX = random.range(Math.max(0, Math.floor(grid.width/2) - (roomWidth - 1)), Math.min(grid.width, Math.floor(grid.width/2)));
  const roomX2 = (roomX + Math.floor(roomWidth / 2) + random.range(0, 2) + random.range(0, 2) - 3) - Math.floor(roomWidth2 / 2);
  const roomY = Math.floor(grid.height/2 - roomHeight);
  const roomY2 = Math.floor(grid.height/2 - roomHeight2 - (random.range(0, 2) + random.range(0, 1)));

  grid.fill(0);

  grid.fillRect(roomX - 5, roomY + 5, roomWidth, roomHeight, config.tile || TILE);
  grid.fillRect(roomX2 - 5, roomY2 + 5, roomWidth2, roomHeight2, config.tile || TILE);
}

digger.crossRoom = digCrossRoom;


export function digSymmetricalCrossRoom(config, grid) {
  config = digger.checkConfig(config, { width: [4,8], height: [4,5], width2: [3,4], height2: [3,3] });
  if (!grid) return config;

  let majorWidth = random.range(config.width[0], config.width[1]);
  let majorHeight = random.range(config.height[0], config.height[1]);

  let minorWidth = random.range(config.width2[0], config.width2[1]);
  if (majorHeight % 2 == 0) {
      minorWidth -= 1;
  }
  let minorHeight = random.range(config.height2[0], config.height2[1]);	// originally 2,3?
  if (majorWidth % 2 == 0) {
      minorHeight -= 1;
  }

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - majorWidth)/2), Math.floor((grid.height - minorHeight)/2), majorWidth, minorHeight, config.tile || TILE);
  grid.fillRect(Math.floor((grid.width - minorWidth)/2), Math.floor((grid.height - majorHeight)/2), minorWidth, majorHeight, config.tile || TILE);
}

digger.symmetricalCrossRoom = digSymmetricalCrossRoom;


export function digRectangularRoom(config, grid) {
  config = digger.checkConfig(config, { width: [3,6], height: [2,4] });
  if (!grid) return config;

  const width = random.range(config.width[0], config.width[1]);
  const height = random.range(config.height[0], config.height[1]);

  grid.fill(0);
  grid.fillRect(Math.floor((grid.width - width) / 2), Math.floor((grid.height - height) / 2), width, height, config.tile || TILE);
}

digger.rectangularRoom = digRectangularRoom;


export function digCircularRoom(config, grid) {
  config = digger.checkConfig(config, { radius: [2,4] });
  if (!grid) return config;

  const radius = random.range(config.radius[0], config.radius[1]);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, config.tile || TILE);

}

digger.circularRoom = digCircularRoom;


export function digBrogueCircularRoom(config, grid) {
  config = digger.checkConfig(config, { radius: [2,4], radius2: [4,10], altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
  if (!grid) return config;

  const params = random.percent(config.altChance || 5) ? config.radius2 : config.radius;
  const radius = random.range(params[0], params[1]);

  grid.fill(0);
  grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), radius, config.tile || TILE);

  if (radius > config.ringMinWidth + config.holeMinSize
      && random.percent(config.holeChance))
  {
      grid.fillCircle(Math.floor(grid.width/2), Math.floor(grid.height/2), random.range(config.holeMinSize, radius - config.holeMinSize), 0);
  }
}

digger.brogueCircularRoom = digBrogueCircularRoom;


export function digChunkyRoom(config, grid) {
  config = digger.checkConfig(config, { count: [2,8] });
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

          grid.fillCircle(x, y, 2, config.tile || TILE);
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

digger.chunkyRoom = digChunkyRoom;



export function chooseRandomDoorSites(sourceGrid) {
  let i, j, k, newX, newY;
  let dir;
  let doorSiteFailed;

  const grid = GRID.alloc(sourceGrid.width, sourceGrid.height);
  grid.copy(sourceGrid);

  for (i=0; i<grid.width; i++) {
      for (j=0; j<grid.height; j++) {
          if (!grid[i][j]) {
              dir = GRID.directionOfDoorSite(grid, i, j);
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

  GRID.free(grid);
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

    const horizontalLength = UTILS.first('horizontalHallLength', opts, [9,15]);
    const verticalLength = UTILS.first('verticalHallLength', opts, [2,9]);

    // Pick a direction.
    dir = opts.dir;
    if (dir === undefined) {
      const dirs = UTILS.sequence(4);
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
    x = UTILS.clamp(x - DIRS[dir][0], 0, grid.width - 1);
    y = UTILS.clamp(y - DIRS[dir][1], 0, grid.height - 1); // Now (x, y) points at the last interior cell of the hallway.
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

digger.attachHallway = attachHallway;
