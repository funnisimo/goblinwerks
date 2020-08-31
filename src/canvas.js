
import { Color, applyMix, css } from './color.js';
import { Sprite } from './sprite.js';
import { Grid } from './grid.js';
import { clamp } from './utils';
import { cosmetic } from './random.js';

import { canvas, buffer, types, debug } from './gw.js';


const HANGING_LETTERS = ['y', 'p', 'g', 'j', 'q', '[', ']', '(', ')', '{', '}'];
const DANCING_FORECOLOR = 1 << 0;
const DANCING_BACKCOLOR = 1 << 1;
const DISPLAY_FONT = 'monospace';



class Buffer extends Grid {
  constructor(w, h) {
    super(w, h, () => new Sprite() );
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

  plotChar(x, y, ch, fg, bg) {
    if (!this.hasXY(x, y)) {
      debug.log('invalid coordinates: ' + x + ', ' + y);
      return;
    }

    const destCell = this[x][y];
    destCell.plot(ch, fg, bg);
    this.needsUpdate = true;
  }

}

types.Buffer = Buffer;



function setFont(canvas, size, name) {
  canvas.font = name || 'monospace';
  canvas.ctx.font = (size * canvas.displayRatio) + 'px ' + canvas.font;
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
  console.log('canvas', rect);

  // this.tileSize = Math.min(Math.floor(window.innerWidth / this.buffer.width), Math.floor(window.innerHeight / this.buffer.height));
  //
  // let width = this.buffer.width * this.tileSize;
  // let height = this.buffer.height * this.tileSize;
  //
  // DISPLAY_PIXEL_RATIO = window.devicePixelRatio || 1;
  // if (DISPLAY_PIXEL_RATIO !== 1) {
  //     // CANVAS.style.width = width + 'px';
  //     // CANVAS.style.height = height + 'px';
  //     // CANVAS.style.width = '100%';
  //     // CANVAS.style.height = '100%';
  //
  //     width = Math.floor(width * DISPLAY_PIXEL_RATIO);
  //     height = Math.floor(height * DISPLAY_PIXEL_RATIO);
  // }
  //
  // CANVAS.width = width;
  // CANVAS.height = height;
  //
  // const rect = CANVAS.getBoundingClientRect();
  // SCREEN_WIDTH = rect.width;
  // SCREEN_HEIGHT = rect.height;
  //
  // GW.debug.log('resize', SCREEN_WIDTH, SCREEN_HEIGHT, this.tileSize, DISPLAY_PIXEL_RATIO);
  //
  // setFont(this, this.tileSize, this.font);
  // fillBg(this, '#000');

  this.buffer.forEach((c) => { c.needsUpdate = true; });

}


function plotCharToDisplayBuffer(buffer, x, y, ch, fg, bg) {

  const destCell = buffer[x][y];

  fg = fg || destCell.fg;
  bg = bg || destCell.bg;

  if (ch != ' '
    && fg[0] === bg[0]
    && fg[1] === bg[1]
    && fg[2] === bg[2])
  {
    ch = ' ';
  }

  if (ch		!== destCell.ch
    || fg[0] !== destCell.fg[0]
    || fg[1] !== destCell.fg[1]
    || fg[2] !== destCell.fg[2]
    || bg[0] !== destCell.bg[0]
    || bg[1] !== destCell.bg[1]
    || bg[2] !== destCell.bg[2])
  {
    if (HANGING_LETTERS.includes(destCell.ch) && y < buffer.height - 1) {
      buffer[x][y + 1].needsUpdate = true;	// redraw the row below any hanging letters that changed
    }

    destCell.plot(ch, fg, bg);
    if (fg.dances) {
      destCell.flags |= DANCING_FORECOLOR;
    }
    if (bg.dances) {
      destCell.flags |= DANCING_BACKCOLOR;
    }
    buffer.needsUpdate = true;
  }

}



class Canvas {
  constructor(w, h, div, opts={}) {
    this.buffer = new Buffer(w, h);
    this.dead = [];
    this.displayRatio = 1;

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
    }

    this.width  = w;
    this.height = h;
    this.tileSize = opts.tileSize || 16;
    this.pxWidth  = this.tileSize * this.width  * this.displayRatio;
    this.pxHeight = this.tileSize * this.height * this.displayRatio;
    this.dances = false;

    if (typeof window !== 'undefined') {
      this.element.width = this.width * this.tileSize;
      this.element.height = this.height * this.tileSize;
      
      window.addEventListener('resize', handleResizeEvent.bind(this));
      handleResizeEvent.call(this);
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
        if (cell.flags & (DANCING_BACKCOLOR | DANCING_FORECOLOR)) {
          this.dances = true;
          if (cosmetic.value() < 0.002) {
            cell.needsUpdate = true;
          }
        }

        if (cell.needsUpdate) {
          this.drawCell(cell, i, j);
          cell.needsUpdate = false;
        }
      });

    }
  }

  drawCell(cell, x, y) {
    const ctx = this.ctx;
    const tileSize = this.tileSize * this.displayRatio;

    const backCss = css(cell.bg);
    ctx.fillStyle = backCss;

    ctx.fillRect(
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    );

    if (cell.ch && cell.ch !== ' ') {
      const foreCss = css(cell.fg);
      ctx.fillStyle = foreCss;

      const textX = x * tileSize + tileSize * 0.5;
      const textY = y * tileSize + tileSize * 0.5;

      ctx.fillText(
        cell.ch,
        textX,
        textY
      );
    }
  }


  plotChar(x, y, ch, fg, bg) {
    this.buffer.plotChar(x, y, ch, fg, bg);
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


  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlay( overBuf,  previousBuf) {
    if (previousBuf) {
      previousBuf.copy(this.buffer);
    }
    overlayRect(overBuf, 0, 0, this.buffer.width, this.buffer.height);
  }

  // draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
  // If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
  overlayRect( overBuf,  x, y, w, h) {
    let i, j;
    let foreColor, tempColor, backColor = new Color();
    let character;

    for (i=x; i<x + w; i++) {
      for (j=y; j<y + h; j++) {

        if (overBuf[i][j].opacity != 0) {
          backColor.copy(overBuf[i][j].bg);

          // character and fore color:
          if (overBuf[i][j].ch == ' ') { // Blank cells in the overbuf take the character from the screen.
            character = this.buffer[i][j].ch;
            foreColor = this.buffer[i][j].fg;
            applyMix(foreColor, backColor, overBuf[i][j].opacity);
          } else {
            character = overBuf[i][j].ch;
            foreColor = overBuf[i][j].fg;
          }

          // back color:
          tempColor = this.buffer[i][j].bg;
          applyMix(backColor, tempColor, 100 - overBuf[i][j].opacity);

          plotCharToDisplayBuffer(this.buffer, i, j, character, foreColor, backColor);
        }
      }
    }

  }

}

types.Canvas = Canvas;
