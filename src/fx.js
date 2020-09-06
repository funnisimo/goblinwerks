
import { NOOP, TRUE, distanceFromTo, dirFromTo, ERROR } from './utils.js';
import { sprites as SPRITES, installSprite } from './sprite.js';
import { data as DATA, types, make } from './gw.js';

export var fx = {};

let ANIMATIONS = [];

export function busy() {
  return (ANIMATIONS.length > 0);
}

fx.busy = busy;


export function tick(dt) {
  ANIMATIONS.forEach( (a) => a.tick(dt) );
  ANIMATIONS = ANIMATIONS.filter( (a) => !a.done );
  return fx.busy();
}

fx.tick = tick;




export class FX {
  constructor(map, callback, opts={}) {
    if (typeof callback != 'function' && arguments.length == 1) {
      opts = callback || {};
      callback = NOOP;
    }

    this.map = map;
    this.x = -1;
    this.y = -1;
    this.sprite = opts.sprite;
    this.tilNextTurn = opts.speed || opts.duration || 1000;
    this.speed = opts.speed || opts.duration || 1000;
    this.callback = callback || RUT.NOOP;
    this.done = false;
  }

  tick(dt) {
    if (this.done) return;
    this.tilNextTurn -= dt;
    if (this.tilNextTurn < 0) {
      this.step();
      this.tilNextTurn += this.speed;
    }
  }

  step() {
    this.stop();
  }

  start(x, y) {
    this.map.addFx(x, y, this);
  }

  stop(result) {
    if (this.done) return;
    this.done = true;
    this.map.removeFx(this);
    this.callback(result);
  }

  moveDir(dir) {
    return this.moveTo(this.x + dir[0], this.y + dir[1]);
  }

  moveTo(newXy) {
    this.map.moveFx(newXy.x, newXy.y, this);
    return true;
  }

}

types.FX = FX;


// export class XYAnimation extends FX {
//   constructor(sprite, from, dest, callback, speed=10) {
//     super(callback, { speed, sprite });
//     this.from = from;
//     this.dest = dest;
//     this.distance = distanceFromTo(from, dest);
//   }
//
//   start() {
//     return super.start(this.from.x, this.from.y);
//   }
//
//   step() {
//     const dest = (typeof this.dest == 'function') ? this.dest() : this.dest;
//     const distance = distanceFromTo(this.xy, dest);
//
//     if (distance == 0) {
//       this.stop(this);
//       return;
//     }
//
//     const dir = dirFromTo(this, dest);
//     DATA.map.moveAnimation(this.x + dir[0], this.y + dir[1], this);
//   }
// }



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



// RUT.Animations.Explosion = class Explosion extends FX {
//   constructor(map, grid, sprite, x, y, radius, callback, opts={}) {
//     if (opts === true) opts = {};
//     Object.defaults(opts, { speed:100, duration:300, sprite });
//     super(map, callback, opts);
//     this.center = { x, y };
//     this.max_radius = radius;
//     this.duration = opts.duration;
//     this.stepFn = opts.stepFn;
//
//     this.grid = RUT.Grid.allocCopy(grid);
//
//     this.add(x, y);
//     this.grid[x][y] = 2;
//     this.radius = 1;
//   }
//
//   step() {
//     this.radius = Math.min(this.radius + 1, this.max_radius);
//
//     let done = true;
//     let x = Math.max(0, Math.floor(this.center.x - this.max_radius));
//     const maxX = Math.min(this.grid.width - 1, Math.ceil(this.center.x + this.max_radius));
//     let minY = Math.max(0, Math.floor(this.center.y - this.max_radius));
//     const maxY = Math.min(this.grid.height - 1, Math.ceil(this.center.y + this.max_radius));
//     let col;
//     let dist;
//
//     for(; x <= maxX; ++x) {
//       col = this.grid[x];
//       for(let y = minY; y <= maxY; ++y) {
//         if (!(col[y] & FovFlags.IN_FOV)) continue;
//         dist = distanceFromTo(this.center.x, this.center.y, x, y);
//         if (dist <= this.radius) {
//           this.add(x, y);
//           col[y] = 2;
//         }
//         else if (dist <= this.max_radius) {
//           done = false;
//         }
//         else {
//           console.log('weird dist', dist, this.center, x, y);
//         }
//       }
//     }
//     // console.log('returning...', done);
//     if (done) {
//       RUT.Grid.free(this.grid);
//       return this.stop(this.center); // xy of explosion is callback value
//     }
//     return false;
//   }
//
//   add(x, y) {
//     RUT.Animations.flashSprite(this.map, x, y, this.sprite, this.duration);
//
//     if (this.stepFn) {
//       this.stepFn(this.map, x, y);
//     }
//   }
// }



export async function flashSprite(map, x, y, sprite, duration) {

  if (typeof sprite === 'string') {
    sprite = SPRITES[sprite];
  }

  return new Promise( (resolve) => {
    const animation = new FX(map, resolve, { sprite, duration });
    animation.start(x, y);
    ANIMATIONS.push(animation);
  });
}

fx.flashSprite = flashSprite;

installSprite('hit', 'red', 50);
installSprite('miss', '!', 'green');

// RUT.Animations.hit = function hit(defender, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   if (opts === false) return;
//   opts = opts || {};
//   if (typeof opts == 'string') opts = { sprite: opts };
//   if (typeof opts == 'number') opts = { duration: opts };
//   Object.defaults(opts, RUT.Config.Animations.hit);
//
//   if (!defender.map || !defender.xy) {
//     console.warn('map and xy required for RUT.Animations.hit::defender');
//     return callback();
//   }
//
//   const map = defender.map;
//   const x = defender.xy.x;
//   const y = defender.xy.y;
//   const spriteName = opts.sprite;
//
//   if (RUT.Animations._debug) console.log('hit animation - added', x, y, RUT.App.time);
//   return RUT.Animations.flashSprite(map, x, y, spriteName, opts.duration, callback);
// }
// RUT.Config.Animations.hit = { duration:200, sprite: 'effect.hit' };
// RUT.Sprite.add('effect.hit', { ch: '*', fg: 'red' });
//
//
// RUT.Animations.miss = function miss(defender, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   if (opts === false) return;
//   opts = opts || {};
//   if (typeof opts == 'string') opts = { sprite: opts };
//   if (typeof opts == 'number') opts = { duration: opts };
//   Object.defaults(opts, RUT.Config.Animations.miss);
//
//   if (!defender.map || !defender.xy) {
//     console.warn('map and xy required for RUT.Animations.miss::defender');
//     return callback();
//   }
//   // if (!RUT.FOV.isVisible(defender)) { return Promise.resolve(); }
//
//   const map = defender.map;
//   const x = defender.xy.x;
//   const y = defender.xy.y;
//   const spriteName = opts.sprite;
//
//   if (RUT.Animations._debug) console.log('miss animation - added', x, y, RUT.App.time);
//   return RUT.Animations.flashSprite(map, x, y, spriteName, opts.duration, callback);
// }
// RUT.Config.Animations.miss = { duration:200, sprite: 'effect.miss' };
// RUT.Sprite.add('effect.miss', { ch: '*', fg: 'green' });
//
//
//
// RUT.Animations.projectileTo = function projectileTo(map, from, to, callback, opts) {
//   if (typeof callback != 'Function' && opts === undefined) {
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
//   const anim = new RUT.Animations.XYAnimation(map, sprite, from, to, callback, opts.speed);
//   anim.start();
//   return anim;
// }
// RUT.Config.Animations.projectile = {
//   speed: 50,
//   sprite: 'projectile',
//   stopCell: 0,
//   stopTile: TileFlags.T_OBSTRUCTS_PASSABILITY,
//   stepFn: undefined
// };
//
// RUT.Sprite.add('projectile', { ch: '|', fg: 'orange' });
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
//
// RUT.Animations.explosionAt = function explosionAt(map, x, y, radius, callback, opts) {
//   if (typeof callback != 'function' && opts === undefined) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   opts = opts || {};
//   if (typeof opts == 'string') opts = { sprite: opts };
//   Object.defaults(opts, RUT.Config.Animations.explosion);
//
//   const fov = RUT.FOV.getFovMask(map, x, y, radius, 0, opts.blocks);
//   return RUT.Animations.explosionFor(map, fov, x, y, radius, callback, opts);
// }
//
// RUT.Config.Animations.explosion = {
//   sprite: 'effect.hit',
//   speed:100,
//   duration:300,
//   blocks: TileFlags.T_OBSTRUCTS_PASSABILITY
// }
//
//
// RUT.Animations.explosionFor = function explosionFor(map, grid, x, y, radius, callback, opts) {
//   if (typeof callback != 'function' && arguments.length == 6) {
//     opts = callback;
//     callback = RUT.NOOP;
//   }
//   if (opts === true) opts = {};
//   opts = opts || {};
//   if (typeof opts == 'string') opts = { sprite: opts };
//   Object.defaults(opts, RUT.Config.Animations.explosion);
//
//   // TODO - Check edges of explosion
//   // if (!RUT.FOV.isVisible(xy)) { return Promise.resolve(); }
//   const sprite = opts.sprite;
//   let anim = new RUT.Animations.Explosion(map, grid, sprite, x, y, radius, callback, opts);
//   anim.start();
//   return anim;
// }
