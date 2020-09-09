

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

  game.startMap(opts.map, opts.x, opts.y);
  return game.loop();
}

game.start = startGame;


export function startMap(map, playerX, playerY) {

  if (DATA.map && DATA.player) {
    DATA.map.removeActor(DATA.player);
  }

  map.cells.forEach( (c) => c.redraw() );
  map.flag |= MapFlags.MAP_CHANGED;
  DATA.map = map;

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
}

game.startMap = startMap;



async function gameLoop() {

  UI.draw();

  while (DATA.running) {
    DATA.time += DATA.turnTime;
    await game.startTurn();
    if (DATA.player) {
      await game.playerTurn(DATA.turnTime);
    }
    if (DATA.actors) {
      for(let actor of DATA.actors) {
        await game.actorTurn(actor, DATA.turnTime);
      }
    }
    await game.turnEnded();
  }

}

game.loop = gameLoop;

async function startTurn() {
  // FIRE TIMERS
  await game.fireTimers(DATA.turnTime);
}

game.startTurn = startTurn;


async function turnEnded() {
  // update environment

  if (!DATA.player && (!DATA.actors || DATA.actors.length == 0)) {
    await IO.pause(1);  // to keep from spinning
  }
}

game.turnEnded = turnEnded;


export async function playerTurn(dt) {

  const player = DATA.player;

  player.elapsed += dt;
  if (player.elapsed >= player.speed) {
    console.log('player turn...', DATA.time);
    player.elapsed -= player.speed;

    player.startTurn();

    while(!player.acted) {
      const ev = await IO.nextEvent(1000);
      await IO.dispatchEvent(ev);
    }

    player.endTurn();

    console.log('...end turn', DATA.time);

    UI.draw();
  }

}

game.playerTurn = playerTurn;

export async function actorTurn(actor) {
  UI.draw();
}

game.actorTurn = actorTurn;


// TIMERS

const TIMERS = [];

export function delay(delay, fn) {
	const timer = { delay, fn };

	for(let i = 0; i < TIMERS.length; ++i) {
		if (!TIMERS[i]) {
			TIMERS[i] = timer;
			return timer;
		}
	}

	TIMERS.push(timer);
	return timer;
}

game.delay = delay;

export async function cancelDelay(timer) {
	for(let i = 0; i < TIMERS.length; ++i) {
		const timer = TIMERS[i];
		if (timer && timer === timer) {
			TIMERS[i] = null;
			await timer.fn(false);
			return true;
		}
	}
	return false;
}

game.cancelDelay = cancelDelay;


export async function fireTimers(dt) {
  for( let i = 0; i < TIMERS.length; ++i) {
    const timer = TIMERS[i];
    if (!timer) continue;
    timer.delay -= dt;
    if (timer.delay <= 0) {
      TIMERS[i] = null;
      await timer.fn(true);
    }
  }
}

game.fireTimers = fireTimers;
