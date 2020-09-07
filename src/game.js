

import { ERROR } from './utils.js';
import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags } from './map.js';

import { data as DATA, types } from './gw.js';

export var game = {};
DATA.time = performance.now();

export function setTime(t) {
  const dt = t - DATA.time;
  DATA.time = t;
  return Math.max(0, dt);
}

game.setTime = setTime;


export function startGame(opts={}) {
  if (!opts.map) ERROR('map is required.');

  const width = opts.width || 100;
  const height = opts.height || 34;

  DATA.canvas = new types.Canvas(80, 30, 'game');
  DATA.player = opts.player || null;

  game.startMap(opts.map, opts.x, opts.y);
  startLoop();
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
      if (!start) ERROR('Need x,y or start location.');
      x = start[0];
      y = start[1];
    }
    DATA.map.addActor(x, y, DATA.player);
  }
}

game.startMap = startMap;


function drawMap() {
  const buffer = DATA.canvas.buffer;
	DATA.map.cells.forEach( (c, i, j) => {
		if (c.flags & CellFlags.NEEDS_REDRAW) {
      const buf = buffer[i][j];
			GW.map.getCellAppearance(DATA.map, i, j, buf);
			c.clearFlags(CellFlags.NEEDS_REDRAW);
      buffer.needsUpdate = true;
		}
	});
}

function startLoop(t) {
	t = t || performance.now();

	requestAnimationFrame(startLoop);

	gameLoop(t);

	DATA.canvas.draw();
}


async function gameLoop(t) {
	const dt = GW.game.setTime(t);
	GW.fx.tick(dt)
	if (GW.fx.busy()) {
		drawMap();
		return;
	}

	let ev = GW.io.makeTickEvent(dt);
	GW.io.pushEvent(ev);

	while (GW.io.hasEvents() && !GW.io.busy()) {
		ev = GW.io.nextEvent();
		GW.io.dispatchEvent(ev);
	}

	if (GW.io.busy()) {
		return;
	}

	drawMap();
}


//
//
//
// export class Game {
//   constructor(opts={}) {
//     this.environmentUpdateTicks = opts.encironmentUpdateTicks || 100;
//
//     this.currentIndex = -1;
//     this.currentActor = undefined;
//     this.timeDelta = opts.timeDelta || 10;
//     this.newTurn = true;
//     this.lastTurnTime = 0;
//   }
//
//   beginLoop(time, dt) {
//     if (this.newTurn) {
//       debug.log('New Turn', Math.floor(time - this.lastTurnTime));
//       this.lastTurnTime = time;
//       // this.mapUpdater.tick(this.timeDelta);
//       this.newTurn = false;
//     }
//   }
//
//   update(dt) {
//     let actor = this.currentActor || this.nextActor();
//     while (actor && !this.newTurn) {
//       // We want all animations to end before anybody gets to act, so we
//       // need to process then until they are all gone before moving on to the
//       // next step.
//       this.updateAll(this.fx.animations, dt);
//       if (this.map.animations.length) {
//         return;
//       }
//
//       // process all the input
//       while (RUT.Keyboard.busy()) {
//         if (!RUT.Keyboard.process(dt)) return;
//       }
//
//       this.updateActor(actor);
//       actor = this.nextActor();
//     }
//
//   }
//
//   // if you want to do something before or after the update, do it here...
//   // return false if you want to pause on this actor for some reason...
//   updateActor(actor) {
//     if (RUT.App._debug) console.log('TICK : ', actor.toString());
//     RUT.active.actor = actor;
//     actor.tick(this.timeDelta);
//   }
//
//   updateAll(actors, dt) {
//     let index = 0;
//     while ( index < actors.length) {
//       const current = actors[index];
//       current.tick(dt); // Really only have to deal with removing self (I think)
//       if (actors[index] === current) {
//         index += 1;
//       }
//     }
//   }
//
//   nextActor() {
//     const actors = this.map.beings;
//     if (!this.currentActor) {
//       this.currentIndex = 0;
//     }
//     else if (actors[this.currentIndex] === this.currentActor) {
//       this.currentIndex += 1;
//     }
//     else {
//       const index = actors.indexOf(this.currentActor);
//       if (index >= 0) {
//         this.currentIndex = index + 1;
//       }
//     }
//
//     if (this.currentIndex >= actors.length) {
//       this.currentIndex = 0;
//       this.newTurn = true;
//     }
//     this.currentActor = actors[this.currentIndex];
//     return this.currentActor;
//   }
//
//   draw() {
//     // RUT.Light.updateLighting(this.map);
//     // RUT.FOV.calcFor(this.player);
//     // this.display.draw(this.map, this.player.fov);
//   }
//
//   end(fps, panic) {
//     this.mapUpdater.updateDancingLights = (fps >= 30);
//
//     RUT.Map.clearChanged(this.map);
//   }
//
// }
//
