

import { colors as COLORS } from './color.js';
import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags, map as MAP } from './map.js';
import { io as IO } from './io.js';
import { actor as ACTOR } from './actor.js';
import { player as PLAYER } from './player.js';
import { scheduler } from './scheduler.js';
import { text as TEXT } from './text.js';
import { sprite as SPRITE } from './sprite.js';
import { Flags as TileFlags } from './tile.js';

import { viewport as VIEWPORT, data as DATA, maps as MAPS, types, fx as FX, ui as UI, message as MSG, utils as UTILS, make, config as CONFIG, flavor as FLAVOR } from './gw.js';

export var game = {};

game.debug = UTILS.NOOP;

DATA.time = 0;
DATA.running = false;
DATA.turnTime = 10;



export async function startGame(opts={}) {

  DATA.time = 0;
  DATA.running = true;
  DATA.player = opts.player || null;

  if (opts.width) {
    CONFIG.width = opts.width;
    CONFIG.height = opts.height;
  }

  if (opts.buildMap) {
    game.buildMap = opts.buildMap;
  }

  let map = opts.map;
  if (typeof map === 'number' || !map) {
    map = await game.getMap(map);
  }

  if (!map) UTILS.ERROR('No map!');

  game.startMap(map, opts.start);
  game.queuePlayer();

  return game.loop();
}

game.start = startGame;


export function buildMap(id=0) {
  let width = 80;
  let height = 30;
  if (CONFIG.width) {
    width = CONFIG.width;
    height = CONFIG.height;
  }
  else if (VIEWPORT.bounds) {
    width = VIEWPORT.bounds.width;
    height = VIEWPORT.bounds.height;
  }
  const map = make.map(width, height, { tile: 'FLOOR', boundary: 'WALL' });
  map.id = id;
  return map;
}

game.buildMap = buildMap;


export async function getMap(id=0) {
  let map = MAPS[id];
  if (!map) {
    map = await game.buildMap(id);
    MAPS[id] = map;
  }
  return map;
}

game.getMap = getMap;


export function startMap(map, loc) {

  scheduler.clear();

  if (DATA.map && DATA.player) {
    DATA.map.removeActor(DATA.player);
  }

  map.cells.forEach( (c) => c.redraw() );
  map.flag |= MapFlags.MAP_CHANGED;
  DATA.map = map;

  // TODO - Add Map/Environment Updater


  if (DATA.player) {
    let startLoc;
    if (!loc) {
      if (DATA.player.x >= 0 && DATA.player.y >= 0) {
        loc = [DATA.player.x, DATA.player.y];
      }
      else {
        loc = 'start';
      }
    }

    if (Array.isArray(loc)) {
      startLoc = loc;
    }
    else if (typeof loc === 'string') {
      if (loc === 'player') {
        startLoc = [DATA.player.x, DATA.player.y];
      }
      else {
        startLoc = map.locations[loc];
      }
      if (!startLoc) {
        startLoc = [Math.floor(map.width / 2), Math.floor(map.height / 2)];
      }
    }

    startLoc = map.matchingNeighbor(startLoc[0], startLoc[1], PLAYER.isValidStartLoc, true);

    DATA.map.addActor(startLoc[0], startLoc[1], DATA.player);
  }

  UI.draw();

  if (map.config.tick) {
    scheduler.push( game.updateEnvironment, map.config.tick );
  }
}

game.startMap = startMap;



async function gameLoop() {

  UI.draw();

  while (DATA.running) {

    const fn = scheduler.pop();
    if (!fn) {
      utils.WARN('NO ACTORS! STOPPING GAME!');
      DATA.running = false;
    }
    else {
      if (scheduler.time > DATA.time) {
        DATA.time = scheduler.time;
        await UI.updateIfRequested();
      }
      const turnTime = await fn();
      if (turnTime) {
        game.debug('- push actor: %d + %d = %d', scheduler.time, turnTime, scheduler.time + turnTime);
        scheduler.push(fn, turnTime);
      }
    }

  }

}

game.loop = gameLoop;


function queuePlayer() {
  scheduler.push(PLAYER.takeTurn, DATA.player.kind.speed);
}

game.queuePlayer = queuePlayer;

function queueActor(actor) {
  scheduler.push(ACTOR.takeTurn.bind(null, actor), actor.kind.speed);
}

game.queueActor = queueActor;

// TIMERS - Do something in future game time

const TIMERS = [];

export function delay(delay, fn) {
  return scheduler.push(fn, delay);
}

game.delay = delay;

export async function cancelDelay(timer) {
  return scheduler.remove(timer);
}

game.cancelDelay = cancelDelay;

export async function updateEnvironment() {

  game.debug('update environment');

  const map = DATA.map;
  if (!map) return 0;

  await map.tick();
  UI.requestUpdate();

  return map.config.tick;
}

game.updateEnvironment = updateEnvironment;


SPRITE.install('hilite', COLORS.white);

async function gameOver(isWin, ...args) {
  const msg = TEXT.format(...args);

  FLAVOR.clear();
  MSG.add(msg);
  if (isWin) {
    MSG.add(COLORS.yellow, 'WINNER!');
  }
  else {
    MSG.add(COLORS.red, 'GAME OVER');
  }
  UI.updateNow();
  await FX.flashSprite(DATA.map, DATA.player.x, DATA.player.y, 'hilite', 500, 3);
  DATA.gameHasEnded = true;

  DATA.running = false; // ???
}

game.gameOver = gameOver;

async function useStairs(x, y) {
  const player = DATA.player;
  const map = DATA.map;
  const cell = map.cell(x, y);
  let start = [player.x, player.y];
  let mapId = -1;
  if (cell.hasTileFlag(TileFlags.T_UP_STAIRS)) {
    start = 'down';
    mapId = map.id + 1;
  }
  else if (cell.hasTileFlag(TileFlags.T_DOWN_STAIRS)) {
    start = 'up';
    mapId = map.id - 1;
  }
  else if (cell.hasTileFlag(TileFlags.T_PORTAL)) {
    start = cell.data.portalLocation;
    mapId = cell.data.portalMap;
  }
  else {  // FALL
    mapId = map.id - 1;
  }

  game.debug('use stairs : was on: %d [%d,%d], going to: %d %s', map.id, x, y, mapId, start);

  const newMap = await game.getMap(mapId);

  startMap(newMap, start);

  return true;
}

game.useStairs = useStairs;
