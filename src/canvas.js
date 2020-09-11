
import { color as COLOR, colors as COLORS } from './color.js';
import { cosmetic } from './random.js';

import { types, debug } from './gw.js';


const DEFAULT_FONT = 'monospace';


export var canvas = {};


class Buffer extends types.Grid {
  constructor(w, h) {
    super(w, h, () => new types.Sprite() );
    this.needsUpdate = true;
  }

  copy(other) {
    this.forEach( (c, i, j) => c.copy(other[i][j]) );
    this.needsUpdate = true;
  }

  clear() {
    this.forEach( (c) => c.clear() );
    this.needsUpdate = true;
  }

  clearRect(x, y, w, h) {
    this.forRect(x, y, w, h, (c) => c.clear() );
    this.needsUpdate = true;
  }

  erase() {
    this.forEach( (c) => c.erase() );
    this.needsUpdate = true;
  }

  eraseRect(x, y, w, h) {
    this.forRect(x, y, w, h, (c) => c.erase() );
    this.needsUpdate = true;
  }

  plot(x, y, sprite) {
    if (sprite.opacity <= 0) return;

    if (!this.hasXY(x, y)) {
      debug.log('invalid coordinates: ' + x + ', ' + y);
      return false;
    }
    const destCell = this[x][y];
    if (destCell.plot(sprite)) {
      this.needsUpdate = true;
    }
    return this.needsUpdate;
  }

  plotChar(x, y, ch, fg, bg) {
    if (!this.hasXY(x, y)) {
      debug.log('invalid coordinates: ' + x + ', ' + y);
      return;
    }

    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    const destCell = this[x][y];
    destCell.plotChar(ch, fg, bg);
    this.needsUpdate = true;
  }

  plotText(x, y, text, fg, bg) {
    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    let len = text.length;
    for(let i = 0; i < len; ++i) {
      this.plotChar(i + x, y, text[i], fg, bg);
    }
  }

  wrapText(x, y, width, text, fg, bg, opts={}) {
    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    width = Math.min(width, this.width - x);
    if (text.length <= width) {
      return this.plotText(x, y, text, fg, bg);
    }
    let first = true;
    let start = 0;
    let last = 0;
    for(let index = 0; index < text.length; ++index) {
      const ch = text[index];
      if (ch === '\n') {
        last = index;
      }
      if ((index - start >= width) || (ch === '\n')) {
        const sub = text.substring(start, last);
        this.plotText(x, y++, sub, fg, bg);
        if (first) {
          x += (opts.indent || 0);
          first = false;
        }
        start = last;
      }
      if (ch === ' ') {
        last = index + 1;
      }
    }

    if (start < text.length - 1) {
      const sub = text.substring(start);
      this.plotText(x, y++, sub, fg, bg);
    }
    return y;
  }

  fillRect(x, y, w, h, ch, fg, bg) {
    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    this.forRect(x, y, w, h, (destCell, i, j) => {
      destCell.plotChar(ch, fg, bg);
    });
    this.needsUpdate = true;
  }

}

types.Buffer = Buffer;



function setFont(canvas, size, name) {
  canvas.font = name || DEFAULT_FONT;
  canvas.ctx.font = (size) + 'px ' + canvas.font;
  canvas.ctx.textAlign = 'center';
  canvas.ctx.textBaseline = 'middle';
}


function fillBg(canvas, css) {
    canvas.ctx.fillStyle = css || '#000';
    canvas.ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


function handleResizeEvent() {

  const rect = this.element.getBoundingClientRect();
  this.pxWidth  = rect.width;
  this.pxHeight = rect.height;
  console.log('canvas resize', rect);

  this.buffer.forEach((c) => { c.needsUpdate = true; });

}



class Canvas {
  constructor(w, h, div, opts={}) {
    this.buffer = new Buffer(w, h);
    this.dead = [];
    this.displayRatio = 1;
    this.width  = w;
    this.height = h;

    if (typeof document !== 'undefined') {
      let parent = document;
      this.element = document.getElementById(div);
      if (this.element && this.element.tagName !== 'CANVAS') {
        parent = this.element;
        this.element = null;
      }
      if (!this.element) {
        // Need to create canvas
        this.element = document.createElement('canvas');
        parent.appendChild(this.element);
      }

      this.ctx = this.element.getContext('2d');
      this.displayRatio = window.devicePixelRatio || 1;

      const bounds = this.element.getBoundingClientRect();
      const size = Math.min(Math.floor(bounds.width / this.width), Math.floor(bounds.height / this.height));

      this.tileSize = opts.tileSize || size;
      this.pxWidth  = bounds.width;
      this.pxHeight = bounds.height;
    }
    else {
      this.tileSize = opts.tileSize || 16;
      this.pxWidth  = this.tileSize * this.width  * this.displayRatio;
      this.pxHeight = this.tileSize * this.height * this.displayRatio;
    }

    this.dances = false;

    if (typeof window !== 'undefined') {
      this.element.width = this.width * this.tileSize;
      this.element.height = this.height * this.tileSize;

      window.addEventListener('resize', handleResizeEvent.bind(this));
      handleResizeEvent.call(this);

      setFont(this, this.tileSize);
    }


  }

  hasXY(x, y) {
    return this.buffer.hasXY(x, y);
  }

  toX(x) {
    return Math.floor(this.buffer.width * x / this.pxWidth);
  }

  toY(y) {
    return Math.floor(this.buffer.height * y / this.pxHeight);
  }

  draw() {
    if ((this.buffer.needsUpdate || this.dances)) {
      let i, j;

      this.buffer.needsUpdate = false;
      this.dances = false;
      const _drawCell = canvas.drawCell;

      this.buffer.forEach( (cell, i, j) => {
        if (cell.fg.dances || cell.bg.dances) {
          this.dances = true;
          if (cosmetic.value() < 0.002) {
            cell.needsUpdate = true;
          }
        }

        if (cell.needsUpdate) {
          if (cell.wasHanging && j < this.buffer.height - 1) {
            this.buffer[i][j + 1].needsUpdate = true;	// redraw the row below any hanging letters that changed
            cell.wasHanging = false;
          }

          this.drawCell(cell, i, j);
          cell.needsUpdate = false;
        }
      });

    }
  }

  drawCell(cell, x, y) {
    const ctx = this.ctx;
    const tileSize = this.tileSize;// * this.displayRatio;

    const backCss = COLOR.css(cell.bg);
    ctx.fillStyle = backCss;

    ctx.fillRect(
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    );

    if (cell.ch && cell.ch !== ' ') {
      const foreCss = COLOR.css(cell.fg);
      ctx.fillStyle = foreCss;

      const textX = x * tileSize + Math.floor(tileSize * 0.5);
      const textY = y * tileSize + Math.floor(tileSize * 0.5);

      ctx.fillText(
        cell.ch,
        textX,
        textY
      );
    }
  }

  plot(x, y, sprite) {
    this.buffer.plot(x, y, sprite);
  }

  plotChar(x, y, ch, fg, bg) {
    this.buffer.plotChar(x, y, ch, fg, bg);
  }

  plotText(x, y, text, fg, bg) {
    this.buffer.plotText(x, y, text, fg, bg);
  }

  fillRect(x, y, w, h, ch, fg, bg) {
    this.buffer.fillRect(x, y, w, h, ch, fg, bg);
  }

  allocBuffer() {
    let buf;
    if (this.dead.length) {
      buf = this.dead.pop();
    }
    else {
      buf = new Buffer(this.buffer.width, this.buffer.height);
    }

    buf.copy(this.buffer);
    return buf;
  }

  freeBuffer(...bufs) {
    bufs.forEach( (buf) => this.dead.push(buf) );
  }

  copyBuffer(dest) {
    dest.copy(this.buffer);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlay( overBuf,  previousBuf) {
    if (previousBuf) {
      previousBuf.copy(this.buffer);
    }
    this.overlayRect(overBuf, 0, 0, this.buffer.width, this.buffer.height);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlayRect(overBuf, x, y, w, h) {
    let i, j;

    for (i=x; i<x + w; i++) {
      for (j=y; j<y + h; j++) {
        const src = overBuf[i][j];
        if (src.opacity) {
          const dest = this.buffer[i][j];
          if (!dest.equals(src)) {
            dest.copy(src);
            dest.needsUpdate = true;
            this.buffer.needsUpdate = true;
          }
        }
      }
    }

  }

}

types.Canvas = Canvas;
