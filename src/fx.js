
import { utils as UTILS } from './utils.js';
import { grid as GRID } from './grid.js';
import { sprites as SPRITES, installSprite } from './sprite.js';
import { map as MAP } from './map.js';
import { ui as UI } from './ui.js';
import { io as IO } from './io.js';
import { scheduler } from './scheduler.js';

import { data as DATA, types, make, config as CONFIG } from './gw.js';

export var fx = {};

let ANIMATIONS = [];

export function busy() {
  return ANIMATIONS.some( (a) => a );
}

fx.busy = busy;


export async function playAll() {
  while(fx.busy()) {
    const dt = await IO.nextTick();
    ANIMATIONS.forEach( (a) => a && a.tick(dt) );
    ANIMATIONS = ANIMATIONS.filter( (a) => a && !a.done );
  }
}

fx.playAll = playAll;


export function tick(dt) {
  if (!ANIMATIONS.length) return false;

  IO.pauseEvents();
  ANIMATIONS.forEach( (a) => a && a.tick(dt) );
  ANIMATIONS = ANIMATIONS.filter( (a) => a && !a.done );
  IO.resumeEvents();

  return true;
}

fx.tick = tick;

let BUSY = false;

export async function playRealTime(animation) {
  animation.playFx = fx.playRealTime;

  animation.start();
  ANIMATIONS.push(animation);
  return new Promise( (resolve) => animation.callback = resolve );
}

fx.playRealTime = playRealTime;

export async function playGameTime(anim) {
  anim.playFx = fx.playGameTime;

  anim.start();
  scheduler.push(() => {
    anim.step();
    UI.requestUpdate(1);
    return anim.done ? 0 : anim.speed;
  },  anim.speed);

  return new Promise( (resolve) => anim.callback = resolve );
}

fx.playGameTime = playGameTime;

function lerp(from, to, pct) {
	if (pct > 1) pct = 1;
  if (pct < 0) pct = 0;
	return Math.floor(from + (to - from) * pct);
}


export class FX {
  constructor(opts={}) {
    this.tilNextTurn = opts.speed || opts.duration || 1000;
    this.speed = opts.speed || opts.duration || 1000;
    this.callback = UTILS.NOOP;
    this.done = false;
  }

  tick(dt) {
    if (this.done) return;
    this.tilNextTurn -= dt;
    while (this.tilNextTurn < 0 && !this.done) {
      this.step();
      this.tilNextTurn += this.speed;
    }
  }

  step() {
    this.stop();
  }

  start() {}

  stop(result) {
    if (this.done) return;
    this.done = true;
    this.callback(result);
  }

}

types.FX = FX;


export class SpriteFX extends FX {
  constructor(map, sprite, x, y, opts={}) {
    const count = opts.blink || 1;
    const duration = opts.duration || 1000;
    opts.speed = opts.speed || (duration / (2*count-1));
    super(opts);
    if (typeof sprite === 'string') {
      sprite = SPRITES[sprite];
    }
    this.map = map;
    this.sprite = sprite;
    this.x = x || -1;
    this.y = y || -1;
    this.count = 2*count - 1;
  }

  start() {
    this.map.addFx(this.x, this.y, this);
    return super.start();
  }

  step() {
    --this.count;
    if (this.count <= 0) return this.stop();
    if (this.count % 2 == 0) {
      this.map.removeFx(this);
    }
    else {
      this.map.addFx(this.x, this.y, this);
    }
  }

  stop(result) {
    this.map.removeFx(this);
    return super.stop(result);
  }

  moveDir(dx, dy) {
    return this.moveTo(this.x + dx, this.y + dy);
  }

  moveTo(x, y) {
    this.map.moveFx(x, y, this);
    return true;
  }

}



export async function flashSprite(map, x, y, sprite, duration=100, count=1) {
  const anim = new SpriteFX(map, sprite, x, y, { duration, blink: count });
  return fx.playRealTime(anim);
}

fx.flashSprite = flashSprite;

installSprite('bump', 'white', 50);


export async function hit(map, target, sprite, duration) {
  sprite = sprite || CONFIG.fx.hitSprite || 'hit';
  duration = duration || CONFIG.fx.hitFlashTime || 200;
  await fx.flashSprite(map, target.x, target.y, sprite, duration, 1);
}

fx.hit = hit;

installSprite('hit', 'red', 50);

export async function miss(map, target, sprite, duration) {
  sprite = sprite || CONFIG.fx.missSprite || 'miss';
  duration = duration || CONFIG.fx.missFlashTime || 200;
  await fx.flashSprite(map, target.x, target.y, sprite, duration, 1);
}

fx.miss = miss;

installSprite('miss', 'green', 50);


export class MovingSpriteFX extends SpriteFX {
  constructor(map, source, target, sprite, speed, stepFn) {
    super(map, sprite, source.x, source.y, { speed });
    this.target = target;
    this.path = MAP.getLine(this.map, source.x, source.y, this.target.x, this.target.y);
    this.stepFn = stepFn || UTILS.TRUE;
  }

  step() {
    if (this.x == this.target.x && this.y == this.target.y) return this.stop(this);
    if (!this.path.find( (loc) => loc[0] == this.target.x && loc[1] == this.target.y)) {
      this.path = MAP.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    }
    const next = this.path.shift();
    const r = this.stepFn(next[0], next[1]);
    if (r < 0) {
      return this.stop(this);
    }
    else if (r) {
      return this.moveTo(next[0], next[1]);
    }
    else {
      this.moveTo(next[0], next[1]);
      this.target.x = this.x;
      this.target.y = this.y;
    }
  }
}

types.MovingSpriteFX = MovingSpriteFX;


export async function bolt(map, source, target, sprite, opts={}) {
  if (typeof sprite === 'string') {
    sprite = SPRITES[sprite];
  }
  opts.speed = opts.speed || 3;
  opts.stepFn = opts.stepFn || ((x, y) => map.isObstruction(x, y) ? -1 : 1);
  opts.playFn = fx.playGameTime;
  if (opts.realTime || (!opts.gameTime)) {
    opts.speed *= 16;
    opts.playFn = fx.playRealTime;
  }

  const anim = new MovingSpriteFX(map, source, target, sprite, opts.speed, opts.stepFn);
  return opts.playFn(anim);
}

fx.bolt = bolt;

export async function projectile(map, source, target, chs, fg, opts) {
  if (chs.length != 4) UTILS.ERROR('projectile requires 4 chars - vert,horiz,diag-left,diag-right (e.g: "|-\\/")');

  const dir = UTILS.dirFromTo(source, target);
  const dIndex = UTILS.dirIndex(dir);
  const index = Math.floor(dIndex / 2);
  const ch = chs[index];
  const sprite = GW.make.sprite(ch, fg);

  return fx.bolt(map, source, target, sprite, opts);
}

fx.projectile = projectile;


//
// RUT.Animations.projectileToTarget = function projectileTo(map, from, target, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   if (opts === false) return;
//   opts = opts || {};
//   if (typeof opts === 'string') opts = { sprite: opts };
//
//   Object.defaults(opts, RUT.Config.Animations.projectile);
//   // if (!RUT.FOV.isVisible(shooter) && !RUT.FOV.isVisible(to)) { return Promise.resolve(); }
//   const sprite = opts.sprite;
//   let anim = new RUT.Animations.XYAnimation(map, sprite, from, () => target.xy, callback, opts.speed);
//   anim.start(); // .then( () => target.xy );
//   return anim;
// }
//

// export class DirAnimation extends FX {
//   constructor(sprite, from, dir, callback, opts={}) {
//     const speed = opts.speed || 10;
//     super(callback, { sprite, speed });
//     this.from = from;
//     this.dir = dir;
//     this.stopCell = opts.stopCell;
//     this.stopTile = opts.stopTile;
//     this.stepFn = opts.stepFn || TRUE;
//     this.range = opts.range || 99;
//   }
//
//   start() {
//     return super.start(this.from.x, this.from.y);
//   }
//
//   step() {
//     let dist = distanceFromTo(this.from, this.xy);
//     if (dist >= this.range) {
//       return this.stop(this.xy);
//     }
//
//     const newXy = this.xy.plus(this.dir);
//
//     const cell = DATA.map.cell(newXy.x, newXy.y);
//     if (!cell) {
//       return this.stop(this.xy);
//     }
//     else if (this.stopCell && RUT.Cell.hasAllFlags(cell, this.stopCell)) {
//       return this.stop(this.xy);
//     }
//     else if (this.stopTile && RUT.Cell.hasTileFlag(cell, this.stopTile)) {
//       return this.stop(this.xy);
//     }
//
//     DATA.map.moveAnimation(this.map, newXy.x, newXy.y, this);
//     if (this.stepFn(this.map, this.xy.x, this.xy.y)) {
//       return this.stop(this.xy);
//     }
//   }
// }

//
// RUT.Animations.projectileDir = function projectileTo(map, xy, dir, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   if (opts === false) return;
//   opts = opts || {};
//   if (typeof opts === 'string') opts = { sprite: opts };
//   if (opts.sprite === true) opts.sprite = RUT.Config.Animations.projectile.sprite;
//
//   Object.defaults(opts, RUT.Config.Animations.projectile);
//   let anim = new RUT.Animations.DirAnimation(map, opts.sprite, xy, dir, callback, opts);
//   anim.start(); // .then( () => anim.xy );
//   return anim;
// }
//

export class BeamFX extends FX {
  constructor(map, from, target, sprite, speed, fade, stepFn) {
    speed = speed || 20;
    super({ speed });
    this.map = map;
    this.x = from.x;
    this.y = from.y;
    this.target = target;
    this.sprite = sprite;
    this.fade = fade || speed;
    this.path = MAP.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    this.stepFn = stepFn || UTILS.TRUE;
  }

  step() {
    if (this.x == this.target.x && this.y == this.target.y) return this.stop(this);
    if (!this.path.find( (loc) => loc[0] == this.target.x && loc[1] == this.target.y)) {
      this.path = MAP.getLine(this.map, this.x, this.y, this.target.x, this.target.y);
    }
    const next = this.path.shift();
    const r = this.stepFn(next[0], next[1]);
    if (r < 0) {
      return this.stop(this);
    }
    else if (r) {
      return this.moveTo(next[0], next[1]);
    }
    else {
      this.moveTo(next[0], next[1]);
      this.target.x = this.x;
      this.target.y = this.y;
    }
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    // fx.flashSprite(this.map, x, y, this.sprite, this.fade);

    const anim = new SpriteFX(this.map, this.sprite, x, y, { duration: this.fade });
    this.playFx(anim);
  }

}

types.BeamFX = BeamFX;

export function beam(map, from, to, sprite, opts={}) {
  opts.fade = opts.fade || 5;
  opts.speed = opts.speed || 1;
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  opts.playFn = fx.playGameTime;
  if (opts.realTime || (!opts.gameTime)) {
    opts.speed *= 16;
    opts.fade *= 16;
    opts.playFn = fx.playRealTime;
  }

  const animation = new BeamFX(map, from, to, sprite, opts.speed, opts.fade, opts.stepFn);
  return opts.playFn(animation);
}

fx.beam = beam;



class ExplosionFX extends FX {
  // TODO - take opts instead of individual params (do opts setup here)
  constructor(map, fovGrid, x, y, radius, sprite, speed, fade, shape, center, stepFn) {
    speed = speed || 20;
    super({ speed });
    this.map = map;
    this.grid = GRID.alloc(map.width, map.height);
    if (fovGrid) {
      this.grid.copy(fovGrid);
    }
    else {
      this.grid.fill(1);
    }
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = radius;
    this.sprite = sprite;
    this.fade = fade || 100;
    this.shape = shape || 'o';
    this.center = (center === undefined) ? true : center;
    this.stepFn = stepFn || UTILS.TRUE;
  }

  start() {
    if (this.center) {
      this.visit(this.x, this.y);
    }
    else {
      this.step();
    }
  }

  step() {
    this.radius = Math.min(this.radius + 1, this.maxRadius);

    let done = true;
    let x = Math.max(0, Math.floor(this.x - this.maxRadius));
    const maxX = Math.min(this.grid.width - 1, Math.ceil(this.x + this.maxRadius));
    let minY = Math.max(0, Math.floor(this.y - this.maxRadius));
    const maxY = Math.min(this.grid.height - 1, Math.ceil(this.y + this.maxRadius));
    let col;
    let dist;

    for(; x <= maxX; ++x) {
      col = this.grid[x];
      for(let y = minY; y <= maxY; ++y) {
        if (col[y] != 1) continue;  // not in FOV
        dist = UTILS.distanceBetween(this.x, this.y, x, y);
        if (dist <= this.radius) {
          this.visit(x, y);
        }
        else if (dist <= this.maxRadius) {
          done = false;
        }
      }
    }
    // console.log('returning...', done);
    if (done) {
      return this.stop(this); // xy of explosion is callback value
    }
    return false;
  }

  visit(x, y) {
    if (this.isInShape(x, y) && this.stepFn(x, y)) {
      const anim = new SpriteFX(this.map, this.sprite, x, y, { duration: this.fade });
      this.playFx(anim);
      // fx.flashSprite(this.map, x, y, this.sprite, this.fade);
    }
    this.grid[x][y] = 2;
  }

  isInShape(x, y) {
    const sx = Math.abs(x - this.x);
    const sy = Math.abs(y - this.y);
    if (sx == 0 && sy == 0 && !this.center) return false;
    switch(this.shape) {
      case '+': return sx == 0 || sy == 0;
      case 'x': return sx == sy;
      case '*': return (sx == 0 || sy == 0 || sx == sy);
      default: return true;
    }
  }

  stop(result) {
    this.grid = GRID.free(this.grid);
    return super.stop(result);
  }
}

function checkExplosionOpts(opts) {
  opts.speed = opts.speed || 3;
  opts.fade = opts.fade || 5;
  opts.playFn = fx.playGameTime;
  opts.shape = opts.shape || 'o';
  if (opts.center === undefined) { opts.center = true; }

  if (opts.realTime || (!opts.gameTime)) {
    opts.speed = opts.speed * 16;
    opts.fade = opts.fade * 16;
    opts.playFn = fx.playRealTime;
  }
}

export function explosion(map, x, y, radius, sprite, opts={}) {
  checkExplosionOpts(opts);
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  const animation = new ExplosionFX(map, null, x, y, radius, sprite, opts.speed, opts.fade, opts.shape, opts.center, opts.stepFn);
  map.calcFov(animation.grid, x, y, radius);
  return opts.playFn(animation);
}

fx.explosion = explosion;

export function explosionFor(map, grid, x, y, radius, sprite, opts={}) {
  checkExplosionOpts(opts);
  opts.stepFn = opts.stepFn || ((x, y) => !map.isObstruction(x, y));
  const animation = new ExplosionFX(map, grid, x, y, radius, sprite, opts.speed, opts.fade, opts.shape, opts.center, opts.stepFn);
  return opts.playFn(animation);
}

fx.explosionFor = explosionFor;
