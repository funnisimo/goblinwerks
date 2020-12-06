
import { cosmetic } from './random.js';
import { types, make, ui as UI } from './gw.js';


const DEFAULT_FONT = 'monospace';

export var canvas = {};



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

  const rect = this.node.getBoundingClientRect();
  this.pxWidth  = rect.width;
  this.pxHeight = rect.height;
  UI.debug('canvas resize', rect);

  this._buffer._data.forEach((c) => { c.needsUpdate = true; });
}



class Canvas {
  constructor(w, h, div, opts={}) {
    this._buffer = make.buffer(w, h);
    this.dead = [];
    this.displayRatio = 1;
    this.width  = w;
    this.height = h;

    if (typeof document !== 'undefined') {
      let parent = document;
      this.node = document.getElementById(div);
      if (this.node && this.node.tagName !== 'CANVAS') {
        parent = this.node;
        this.node = null;
      }
      if (!this.node) {
        // Need to create canvas
        this.node = document.createElement('canvas');
        parent.appendChild(this.node);
      }

      this.ctx = this.node.getContext('2d');
      this.displayRatio = window.devicePixelRatio || 1;

      const bounds = this.node.getBoundingClientRect();
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
      this.node.width = this.width * this.tileSize;
      this.node.height = this.height * this.tileSize;

      window.addEventListener('resize', handleResizeEvent.bind(this));
      handleResizeEvent.call(this);

      this.font = opts.font;
      setFont(this, this.tileSize, this.font);
    }

  }

  hasXY(x, y) {
    return this._buffer._data.hasXY(x, y);
  }

  toX(x) {
    return Math.floor(this._buffer.width * x / this.pxWidth);
  }

  toY(y) {
    return Math.floor(this._buffer.height * y / this.pxHeight);
  }

  render() {
    if ((this._buffer.needsUpdate || this.dances)) {
      let i, j;

      this._buffer.needsUpdate = false;
      this.dances = false;
      const _drawCell = canvas.drawCell;

      this._buffer._data.forEach( (cell, i, j) => {
        if (cell.fg.dances || cell.bg.dances) {
          this.dances = true;
          if (cosmetic.value() < 0.0005) {
            cell.needsUpdate = true;
          }
        }

        if (cell.needsUpdate) {
          if (cell.wasHanging && j < this._buffer.height - 1) {
            this._buffer._data[i][j + 1].needsUpdate = true;	// redraw the row below any hanging letters that changed
            cell.wasHanging = false;
          }
          if (cell.wasFlying && j) {
            this._buffer._data[i][j - 1].needsUpdate = true;
            this._buffer.needsUpdate = true;
            cell.wasFlying = false;
          }

          this._renderCell(cell, i, j);
          cell.needsUpdate = false;
        }
      });

    }
  }

  _renderCell(cell, x, y) {
    const ctx = this.ctx;
    const tileSize = this.tileSize;// * this.displayRatio;

    if (cell.bg && !cell.bg.isNull()) {
      const backCss = cell.bg.css();
      ctx.fillStyle = backCss;

      ctx.fillRect(
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      );
    }

    if (cell.ch && cell.ch !== ' ' && cell.fg && !cell.fg.isNull()) {
      const foreCss = cell.fg.css();
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

  allocBuffer() {
    let buf;
    if (this.dead.length) {
      buf = this.dead.pop();
    }
    else {
      buf = new types.Buffer(this._buffer.width, this._buffer.height);
    }

    buf.copy(this._buffer);
    return buf;
  }

  freeBuffer(...bufs) {
    bufs.forEach( (buf) => this.dead.push(buf) );
  }

  copyBuffer(dest) {
    dest.copy(this._buffer);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlay( overBuf,  previousBuf) {
    if (previousBuf) {
      previousBuf.copy(this._buffer);
    }
    this._overlayRect(overBuf, 0, 0, this._buffer.width, this._buffer.height);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  _overlayRect(overBuf, x, y, w, h) {
    let i, j;

    for (i=x; i<x + w; i++) {
      for (j=y; j<y + h; j++) {
        const src = overBuf._data[i][j];
        if (src.opacity) {
          const dest = this._buffer._data[i][j];
          if (!dest.equals(src)) {
            dest.copy(src); // was copy
            dest.needsUpdate = true;
            this._buffer.needsUpdate = true;
          }
        }
      }
    }

  }

}

types.Canvas = Canvas;
