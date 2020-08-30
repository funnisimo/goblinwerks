
import { Color, applyMix } from './color.js';
import { Sprite } from './sprite.js';
import { Grid } from './grid.js';
import { clamp } from './utils';
import { cosmetic } from './random.js';

import { canvas, buffer, types, debug } from './gw.js';


const HANGING_LETTERS = ['y', 'p', 'g', 'j', 'q', '[', ']', '(', ')', '{', '}'];

const DEAD_BUFFERS = [];
export var BUFFER = null;
export var CANVAS = null;
var DISPLAY_CTX = null;

var DISPLAY_DANCES = false;
var TILE_SIZE = 0;
var DISPLAY_PIXEL_RATIO = 1;
var SCREEN_WIDTH = 0;
var SCREEN_HEIGHT = 0;

var DISPLAY_FONT = 'monospace';

const DANCING_FORECOLOR = 1 << 0;
const DANCING_BACKCOLOR = 1 << 1;

canvas.width = -1;
canvas.height = -1;

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


function toRGB(v, vr) {
  return clamp(Math.floor(2.55 * (v + cosmetic.value() * vr) ), 0, 255);
}

const V_TO_CSS = [];
for(let i = 0; i < 256; ++i) {
  V_TO_CSS[i] = i.toString(16).padStart(2, '0');
}

function toCSS(v) {
  return V_TO_CSS[Math.floor(v)];
}

export function drawCell(x, y, cell) {
  const ctx = DISPLAY_CTX;
  const tileSize = TILE_SIZE * DISPLAY_PIXEL_RATIO;

  let rf = Math.random() * (cell.fg[6] || 0);
  let rb = Math.random() * (cell.bg[6] || 0);

  const fr = toRGB(cell.fg[0] + rf, cell.fg[3]);
  const fg = toRGB(cell.fg[1] + rf, cell.fg[4]);
  const fb = toRGB(cell.fg[2] + rf, cell.fg[5]);

  const br = toRGB(cell.bg[0] + rb, cell.bg[3]);
  const bg = toRGB(cell.bg[1] + rb, cell.bg[4]);
  const bb = toRGB(cell.bg[2] + rb, cell.bg[5]);

  const backCss = `#${toCSS(br)}${toCSS(bg)}${toCSS(bb)}`;
  ctx.fillStyle = backCss;

  ctx.fillRect(
    x * tileSize,
    y * tileSize,
    tileSize,
    tileSize
  );

  if (cell.ch && cell.ch !== ' ') {
    const foreCss = `#${toCSS(fr)}${toCSS(fg)}${toCSS(fb)}`;
    ctx.fillStyle = foreCss;

    const textX = x * tileSize + tileSize * 0.5;  // TODO - offsetX
    const textY = y * tileSize + tileSize * 0.5;  // TODO - offsetY

    ctx.fillText(
      cell.ch,
      textX,
      textY
    );
  }

}

canvas.drawCell = drawCell;


export function draw(force) {

  if (BUFFER && (BUFFER.needsUpdate || DISPLAY_DANCES || force)) {
    let i, j;

    BUFFER.needsUpdate = false;
    DISPLAY_DANCES = false;
    const _drawCell = canvas.drawCell;

    BUFFER.forEach( (cell, i, j) => {
      if (cell.flags & (DANCING_BACKCOLOR | DANCING_FORECOLOR)) {
        DISPLAY_DANCES = true;
        if (cosmetic.value() < 0.002) {
          cell.needsUpdate = true;
        }
      }

      if (cell.needsUpdate) {
        _drawCell(i, j, cell);
        cell.needsUpdate = false;
      }
    });

  }
}

canvas.draw = draw;


export function hasXY(x, y) {
  return BUFFER && BUFFER.hasXY(x, y);
}

canvas.hasXY = hasXY;

export function toX(x) {
  return Math.floor(BUFFER.width * x / SCREEN_WIDTH);
}

canvas.toX = toX;

export function toY(y) {
  return Math.floor(BUFFER.height * y / SCREEN_HEIGHT);
}

canvas.toY = toY;


export function setup(w, h, div) {
  BUFFER = new Buffer(w, h);

  if (typeof document !== 'undefined') {
    let parent = document;
    CANVAS = document.getElementById(div);
    if (CANVAS && CANVAS.tagName !== 'CANVAS') {
      parent = CANVAS;
      CANVAS = null;
    }
    if (!CANVAS) {
      // Need to create canvas
      CANVAS = document.createElement('canvas');
      parent.appendChild(CANVAS);
    }

    DISPLAY_CTX = CANVAS.getContext('2d');
  }

  canvas.width = w;
  canvas.height = h;
  canvas.BUFFER = BUFFER;
  canvas.element = CANVAS;

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResizeEvent);
    handleResizeEvent();
  }

  return true;
}

canvas.setup = setup;


function setFont(size, name) {
  DISPLAY_FONT = name || 'monospace';
  DISPLAY_CTX.font = (size * DISPLAY_PIXEL_RATIO) + 'px ' + DISPLAY_FONT;
  DISPLAY_CTX.textAlign = 'center';
  DISPLAY_CTX.textBaseline = 'middle';
}


function fillBg(css) {
    DISPLAY_CTX.fillStyle = css || '#000';
    DISPLAY_CTX.fillRect(
        0,
        0,
        CANVAS.width,
        CANVAS.height
    );
}


function handleResizeEvent() {

  TILE_SIZE = Math.min(Math.floor(window.innerWidth / BUFFER.width), Math.floor(window.innerHeight / BUFFER.height));

  let width = BUFFER.width * TILE_SIZE;
  let height = BUFFER.height * TILE_SIZE;

  DISPLAY_PIXEL_RATIO = window.devicePixelRatio || 1;
  if (DISPLAY_PIXEL_RATIO !== 1) {
      // CANVAS.style.width = width + 'px';
      // CANVAS.style.height = height + 'px';
      CANVAS.style.width = '100%';
      CANVAS.style.height = '100%';

      width = Math.floor(width * DISPLAY_PIXEL_RATIO);
      height = Math.floor(height * DISPLAY_PIXEL_RATIO);
  }

  CANVAS.width = width;
  CANVAS.height = height;

  const rect = CANVAS.getBoundingClientRect();
  SCREEN_WIDTH = rect.width;
  SCREEN_HEIGHT = rect.height;

  GW.debug.log('resize', SCREEN_WIDTH, SCREEN_HEIGHT, TILE_SIZE, DISPLAY_PIXEL_RATIO);

  setFont(TILE_SIZE, DISPLAY_FONT);
  fillBg('#000');

  BUFFER.forEach((c) => { c.needsUpdate = true; });

}


export function plotChar(x, y, ch, fg, bg) {
  BUFFER.plotChar(x, y, ch, fg, bg);
}

canvas.plotChar = plotChar;




function allocBuffer() {
  let buf;
  if (DEAD_BUFFERS.length) {
    buf = DEAD_BUFFERS.pop();
  }
  else {
    buf = new Buffer(BUFFER.width, BUFFER.height);
  }

  buf.copy(BUFFER);
  return buf;
}

canvas.allocBuffer = allocBuffer;


export function freeBuffer(...bufs) {
  bufs.forEach( (buf) => DEAD_BUFFERS.push(buf) );
}

canvas.freeBuffer = freeBuffer;


function plotCharToDisplayBuffer(x, y, ch, fg, bg) {

  const destCell = BUFFER[x][y];

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
    if (HANGING_LETTERS.includes(destCell.ch) && y < BUFFER.height - 1) {
      BUFFER[x][y + 1].needsUpdate = true;	// redraw the row below any hanging letters that changed
    }

    destCell.plot(ch, fg, bg);
    if (fg.dances) {
      destCell.flags |= DANCING_FORECOLOR;
    }
    if (bg.dances) {
      destCell.flags |= DANCING_BACKCOLOR;
    }
    BUFFER.needsUpdate = true;
  }

}






// draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
// If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
export function overlay( overBuf,  previousBuf) {
  if (previousBuf) {
    previousBuf.copy(BUFFER);
  }
  overlayRect(overBuf, 0, 0, BUFFER.width, BUFFER.height);
}

canvas.overlay = overlay;



// draws overBuf over the current canvas with per-cell pseudotransparency as specified in overBuf.
// If previousBuf is not null, it gets filled with the preexisting canvas for reversion purposes.
export function overlayRect( overBuf,  x, y, w, h) {
  let i, j;
  let foreColor, tempColor, backColor = new Color();
  let character;

  for (i=x; i<x + w; i++) {
    for (j=y; j<y + h; j++) {

      if (overBuf[i][j].opacity != 0) {
        backColor.copy(overBuf[i][j].bg);

        // character and fore color:
        if (overBuf[i][j].ch == ' ') { // Blank cells in the overbuf take the character from the screen.
          character = BUFFER[i][j].ch;
          foreColor = BUFFER[i][j].fg;
          applyMix(foreColor, backColor, overBuf[i][j].opacity);
        } else {
          character = overBuf[i][j].ch;
          foreColor = overBuf[i][j].fg;
        }

        // back color:
        tempColor = BUFFER[i][j].bg;
        applyMix(backColor, tempColor, 100 - overBuf[i][j].opacity);

        plotCharToDisplayBuffer(i, j, character, foreColor, backColor);
      }
    }
  }

}


canvas.overlayRect = overlayRect;
