

import { utils as UTILS } from './utils.js';
import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags, map as MAP } from './map.js';
import { io as IO } from './io.js';
import { actor as ACTOR } from './actor.js';
import { player as PLAYER } from './player.js';
import { scheduler } from './scheduler.js';

import { data as DATA, types, fx as FX, ui as UI } from './gw.js';

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
    let x = playerX || 0;
    let y = playerY || 0;
    if (x <= 0) {
      const start = map.locations.start;
      x = start[0];
      y = start[1];
    }
    if (x <= 0) {
      x = DATA.player.x || Math.floor(map.width / 2);
      y = DATA.player.y || Math.floor(map.height / 2);
    }
    DATA.map.addActor(x, y, DATA.player);
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

export async function updateEnvironment() {

  console.log('update environment');

  const map = DATA.map;
  if (!map) return 0;

  await map.tick();
  UI.requestUpdate();

  return map.config.tick;
}

game.updateEnvironment = updateEnvironment;
