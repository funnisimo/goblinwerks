

import * as Flags from './flags.js';
import { utils as Utils, io as IO, events as Events, scheduler as Scheduler } from 'gw-core';
import * as Light from './light.js';
import { actor as ACTOR } from './actor.js';
import { player as PLAYER } from './player.js';
import * as Text from './text.js';
import * as Sprite from './sprite.js';
import * as Visibility from './visibility.js';
import * as FX from './fx.js';

import { viewport as VIEWPORT, data as DATA, maps as MAPS, types, ui as UI, message as MSG, make, config as CONFIG, flavor as FLAVOR, colors as COLORS } from './gw.js';

const GAME_DEBUG = Utils.NOOP;

DATA.time = 0;
DATA.running = false;
DATA.turnTime = 10;


export const scheduler = new Scheduler.Scheduler();


export async function start(opts={}) {

  DATA.time = 0;
  DATA.running = true;
  DATA.player = opts.player || null;
  DATA.gameHasEnded = false;

  GW.utils.clearObject(MAPS);

  await Events.emit('GAME_START', opts);

  if (opts.width) {
    CONFIG.width = opts.width;
    CONFIG.height = opts.height;
  }

  if (opts.buildMap) {
    buildMap = opts.buildMap;
  }

  let map = opts.map;
  if (typeof map === 'number' || !map) {
    map = await getMap(map);
  }

  if (!map) Utils.ERROR('No map!');

  if (opts.fov) {
    CONFIG.fov = true;
  }

  CONFIG.inventory = true;
  if (opts.inventory === false || opts.pack === false) {
    CONFIG.inventory = false;
  }

  if (opts.combat) {
    CONFIG.combat = combat;
  }

  await startMap(map, opts.start);
  queuePlayer();


  return loop();
}



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


export async function getMap(id=0) {
  let map = MAPS[id];
  if (!map) {
    map = await buildMap(id);
    map.id = id;
    MAPS[id] = map;
  }
  return map;
}


export async function startMap(map, loc='start') {

  // scheduler.clear();

  if (DATA.map && DATA.player) {
    await Events.emit('STOP_MAP', DATA.map);

    if (DATA.map._tick) scheduler.remove(DATA.map._tick);
    DATA.map._tick = null;

    Utils.eachChain(DATA.map.actors, (actor) => {
      if (actor._tick) {
        scheduler.remove(actor._tick);
        actor._tick = null;
      }
    });

    DATA.map.removeActor(DATA.player);
  }

  Visibility.initMap(map);
  DATA.map = map;

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

    startLoc = map.matchingLocNear(startLoc[0], startLoc[1], PLAYER.isValidStartLoc, { hallways: true });

    DATA.map.addActor(startLoc[0], startLoc[1], DATA.player);

    Visibility.update(map, DATA.player.x, DATA.player.y, DATA.player.current.fov);
  }

  Light.updateLighting(map);

  Utils.eachChain(map.actors, (actor) => {
    queueActor(actor);
  });

  UI.blackOutDisplay();
  map.redrawAll();
  UI.draw();

  if (map.events.welcome && !(map.flags & Flags.Map.MAP_SAW_WELCOME)) {
    map.flags |= Flags.Map.MAP_SAW_WELCOME;
    await map.events.welcome(map);
  }
  else if (map.events.start) {
    await map.events.start(map);
  }

  if (map.config.tick) {
    map._tick = scheduler.push( updateEnvironment, map.config.tick );
  }

  await Events.emit('MAP_START', map);

}



async function loop() {

  UI.draw();

  while (DATA.running) {

    if (DATA.gameHasEnded) {
      const ev = await IO.nextEvent(1000);
      if (ev) {
        if (!await UI.dispatchEvent(ev)) {
          await IO.dispatchEvent(ev, {
            Enter() {
              DATA.running = false;
            }
          });
        }
        await UI.updateIfRequested();
      }
    }
    else {
      const fn = scheduler.pop();
      if (!fn) {
        utils.WARN('NO ACTORS! STOPPING GAME!');
        DATA.running = false;
      }
      else {
        if (scheduler.time > DATA.time) {
          DATA.time = scheduler.time;
          GAME_DEBUG('- update now: %d', scheduler.time);
          await UI.updateIfRequested();
        }
        const turnTime = await fn();
        if (turnTime) {
          GAME_DEBUG('- push actor: %d + %d = %d', scheduler.time, turnTime, scheduler.time + turnTime);
          scheduler.push(fn, turnTime);
        }
        DATA.map.resetEvents();
      }
    }

  }

  return DATA.isWin;
}


export function queuePlayer() {
  DATA.player._tick = scheduler.push(PLAYER.takeTurn, DATA.player.kind.speed);
}


export function queueActor(actor) {
  actor._tick = scheduler.push(ACTOR.takeTurn.bind(null, actor), actor.kind.speed);
}


// TIMERS - Do something in future game time

const TIMERS = [];

export function delay(delay, fn) {
  return scheduler.push(fn, delay);
}


export async function cancelDelay(timer) {
  return scheduler.remove(timer);
}

export async function updateEnvironment() {

  GAME_DEBUG('update environment');

  const map = DATA.map;
  if (!map) return 0;

  await map.tick();
  Visibility.update(map, DATA.player.x, DATA.player.y, DATA.player.current.fov);

  // UI.requestUpdate();

  return map.config.tick;
}



Sprite.install('hilite', COLORS.white);

export async function gameOver(isWin, msg, args) {
  if (args) {
    msg = Text.apply(msg, args);
  }

  FLAVOR.clear();
  MSG.add(msg);
  if (isWin) {
    DATA.isWin = true;
    MSG.add('ΩyellowΩWINNER!');
  }
  else {
    DATA.isWin = false;
    MSG.add('ΩredΩGAME OVER');
  }
  MSG.add('Press <Enter> to continue.');
  UI.updateNow();
  await FX.flashSprite(DATA.map, DATA.player.x, DATA.player.y, 'hilite', 500, 3);
  DATA.gameHasEnded = true;
}


export async function useStairs(x, y) {
  const player = DATA.player;
  const map = DATA.map;
  const cell = map.cell(x, y);
  let start = [player.x, player.y];
  let mapId = -1;
  if (cell.hasTileFlag(Flags.Tile.T_UP_STAIRS)) {
    start = 'down';
    mapId = map.id + 1;
    MSG.add('§you§ §ascend§.', { actor: player });
  }
  else if (cell.hasTileFlag(Flags.Tile.T_DOWN_STAIRS)) {
    start = 'up';
    mapId = map.id - 1;
    MSG.add('§you§ §descend§.', { actor: player });
  }
  else if (cell.hasTileFlag(Flags.Tile.T_PORTAL)) {
    start = cell.data.portalLocation;
    mapId = cell.data.portalMap;
  }
  else {  // FALL
    mapId = map.id - 1;
  }

  GAME_DEBUG('use stairs : was on: %d [%d,%d], going to: %d %s', map.id, x, y, mapId, start);

  const newMap = await getMap(mapId);

  await startMap(newMap, start);

  return true;
}
