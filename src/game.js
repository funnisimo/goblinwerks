

import { utils as UTILS } from './utils.js';
import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags } from './map.js';
import { io as IO } from './io.js';
import { ui as UI } from './ui.js';
import { fx as FX } from './fx.js';

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
  DATA.engine = new types.Scheduler();

  game.startMap(opts.map, opts.x, opts.y);
  return game.loop();
}

game.start = startGame;


export function startMap(map, playerX, playerY) {

  DATA.engine.clear();

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
    game.queuePlayer();

  }
}

game.startMap = startMap;



async function gameLoop() {

  UI.draw();

  while (DATA.running) {

    const fn = DATA.engine.pop();
    if (!fn) {
      utils.WARN('NO ACTORS! STOPPING GAME!');
      DATA.running = false;
    }
    else {
      DATA.time = DATA.engine.time;
      const turnTime = await fn();
      if (turnTime) {
        DATA.engine.push(fn, turnTime);
      }
    }

  }

}

game.loop = gameLoop;

function queuePlayer() {
  DATA.engine.push(game.playerTurn.bind(game, DATA.player), DATA.player.speed);
}

game.queuePlayer = queuePlayer;

function queueActor(actor) {
  DATA.engine.push(game.actorTurn.bind(game, actor), actor.speed);
}

game.queueActor = queueActor;


export async function playerTurn() {

  const player = DATA.player;

  console.log('player turn...', DATA.time);
  player.elapsed -= player.speed;

  await player.startTurn();

  while(!player.turnTime) {
    const ev = await IO.nextEvent(1000);
    await IO.dispatchEvent(ev);
  }

  await player.endTurn();

  console.log('...end turn', DATA.time);

  UI.draw();

  return player.turnTime;
}

game.playerTurn = playerTurn;

export async function actorTurn(actor) {
  console.log('actor turn...', DATA.time);
  const turnTime = await actor.act();
  if (actor.isOrWasVisible()) {
    UI.draw();
    await IO.pause(16);
  }
  return turnTime;
}

game.actorTurn = actorTurn;


// TIMERS - Do something in future game time

const TIMERS = [];

export function delay(delay, fn) {
  return DATA.engine.push(fn, delay);
}

game.delay = delay;

export async function cancelDelay(timer) {
  return DATA.engine.remove(timer);
}

game.cancelDelay = cancelDelay;
