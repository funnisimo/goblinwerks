

import { utils as UTILS } from './utils.js';
import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags } from './map.js';
import { io as IO } from './io.js';
import { ui as UI } from './ui.js';
import { fx as FX } from './fx.js';
import { actor as ACTOR } from './actor.js';
import { player as PLAYER } from './player.js';
import { scheduler } from './scheduler.js';

import { data as DATA, types } from './gw.js';

export var game = {};

DATA.time = 0;
DATA.running = false;
DATA.turnTime = 10;


export function setTime(t) {
  const dt = t - DATA.time;
  DATA.time = t;
  return Math.max(0, dt);
}

game.setTime = setTime;


export function startGame(opts={}) {
  if (!opts.map) UTILS.ERROR('map is required.');

  DATA.time = 0;
  DATA.running = true;
  DATA.player = opts.player || null;

  game.startMap(opts.map, opts.x, opts.y);
  game.queuePlayer();

  return game.loop();
}

game.start = startGame;


export function startMap(map, playerX, playerY) {

  scheduler.clear();

  if (DATA.map && DATA.player) {
    DATA.map.removeActor(DATA.player);
  }

  map.cells.forEach( (c) => c.redraw() );
  map.flag |= MapFlags.MAP_CHANGED;
  DATA.map = map;

  // TODO - Add Map/Environment Updater

  if (DATA.player) {
    let x = playerX || DATA.player.x || 0;
    let y = playerY || DATA.player.y || 0;
    if (x <= 0) {
      const start = map.locations.start;
      if (!start) UTILS.ERROR('Need x,y or start location.');
      x = start[0];
      y = start[1];
    }
    DATA.map.addActor(x, y, DATA.player);

  }

  UI.draw();
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
        console.log('- push actor', turnTime, scheduler.time);
        scheduler.push(fn, turnTime);
      }
    }

  }

}

game.loop = gameLoop;


function queuePlayer() {
  scheduler.push(PLAYER.takeTurn, DATA.player.speed);
}

game.queuePlayer = queuePlayer;

function queueActor(actor) {
  scheduler.push(ACTOR.takeTurn.bind(null, actor), actor.speed);
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
