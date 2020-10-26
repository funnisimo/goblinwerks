
// CREDIT - This is adapted from: http://roguebasin.roguelikedevelopment.org/index.php?title=Improved_Shadowcasting_in_Java

import * as Utils from './utils.js';
import { types, def } from './gw.js';


export var fov = {};

fov.debug = Utils.NOOP;

// strategy =
// {
//    isBlocked(x, y)
//    calcRadius(x, y)
//    setVisible(x, y, v)
//    hasXY(x, y)
// }
export class FOV {
  constructor(strategy) {
    this.isBlocked = strategy.isBlocked;
    this.calcRadius = strategy.calcRadius || Utils.calcRadius;
    this.setVisible = strategy.setVisible;
    this.hasXY = strategy.hasXY || Utils.TRUE;
  }

  calculate(x, y, maxRadius) {
    this.setVisible(x, y, 1);
    this.startX = x;
    this.startY = y;
    this.maxRadius = maxRadius + 1;

    // uses the diagonals
    for (let i = 4; i < 8; ++i) {
      const d = def.dirs[i];
      this.castLight(1, 1.0, 0.0, 0, d[0], d[1], 0);
      this.castLight(1, 1.0, 0.0, d[0], 0, 0, d[1]);
    }

  }

  // NOTE: slope starts a 1 and ends at 0.
  castLight(row, startSlope, endSlope, xx, xy, yx, yy) {
      let newStart = 0.0;
      if (startSlope < endSlope) {
          return;
      }
      // fov.debug('CAST: row=%d, start=%d, end=%d, x=%d,%d, y=%d,%d', row, startSlope, endSlope, xx, xy, yx, yy);

      let blocked = false;
      for (let distance = row; distance < this.maxRadius && !blocked; distance++) {
          let deltaY = -distance;
          for (let deltaX = -distance; deltaX <= 0; deltaX++) {
              let currentX = Math.floor(this.startX + deltaX * xx + deltaY * xy);
              let currentY = Math.floor(this.startY + deltaX * yx + deltaY * yy);
              let outerSlope = (deltaX - 0.5) / (deltaY + 0.5);
              let innerSlope = (deltaX + 0.5) / (deltaY - 0.5);
              let maxSlope = ((deltaX) / (deltaY + 0.5));
              let minSlope = ((deltaX + 0.5) / (deltaY));

              if (!this.hasXY(currentX, currentY)) {
                continue;
              }

              // fov.debug('- test %d,%d ... start=%d, min=%d, max=%d, end=%d, dx=%d, dy=%d', currentX, currentY, startSlope.toFixed(2), maxSlope.toFixed(2), minSlope.toFixed(2), endSlope.toFixed(2), deltaX, deltaY);

              if (startSlope < minSlope) {
                  continue;
              } else if (endSlope > maxSlope) {
                  break;
              }

              //check if it's within the lightable area and light if needed
              const radius = this.calcRadius(deltaX, deltaY);
              if (radius < this.maxRadius) {
                  const bright = (1 - (radius / this.maxRadius));
                  this.setVisible(currentX, currentY, bright);
                  // fov.debug('       - visible');
              }

              if (blocked) { //previous cell was a blocking one
                  if (this.isBlocked(currentX,currentY)) {//hit a wall
                      newStart = innerSlope;
                      continue;
                  } else {
                      blocked = false;
                      startSlope = newStart;
                  }
              } else {
                  if (this.isBlocked(currentX, currentY) && distance < this.maxRadius) {//hit a wall within sight line
                      blocked = true;
                      this.castLight(distance + 1, startSlope, outerSlope, xx, xy, yx, yy);
                      newStart = innerSlope;
                  }
              }
          }
      }
  }
}

types.FOV = FOV;
