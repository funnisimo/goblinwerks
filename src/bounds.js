
import { types } from './gw.js';


class Bounds {
  constructor(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = w || 0;
    this.height = h || 0;
  }

  containsXY(x, y) {
    return this.width > 0
      && this.x <= x
      && this.y <= y
      && this.x + this.width > x
      && this.y + this.height > y;
  }

  centerX() { return Math.round(this.width / 2) + this.x; }
  centerY() { return Math.round(this.height / 2) + this.y; }

  toInnerX(x) { return x - this.x; }
  toInnerY(y) { return y - this.y; }

  toOuterX(x) {
    let offset = 0;
    if (x < 0) { offset = this.width - 1; }
    return x + this.x + offset;
  }
  toOuterY(y) {
    let offset = 0;
    if (y < 0) { offset = this.height - 1; }
    return y + this.y + offset;
  }
}

types.Bounds = Bounds;
