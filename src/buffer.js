
import { colors as COLORS, color as COLOR } from './color.js';
import { text as TEXT } from './text.js';
import { types, make, utils as UTILS } from './gw.js';

class Buffer extends types.Grid {
  constructor(w, h) {
    super(w, h, () => new types.Sprite() );
    this.needsUpdate = true;
  }

  copy(other) {
    this.forEach( (c, i, j) => c.copy(other[i][j]) );
    this.needsUpdate = true;
  }

  nullify() {
    this.forEach( (c) => c.nullify() );
    this.needsUpdate = true;
  }

  nullifyRect(x, y, w, h) {
    this.forRect(x, y, w, h, (c) => c.nullify() );
    this.needsUpdate = true;
  }

  nullifyCell(x, y) {
    this[x][y].nullify();
    this.needsUpdate = true;
  }

  blackOut() {
    this.forEach( (c) => c.blackOut() );
    this.needsUpdate = true;
  }

  blackOutRect(x, y, w, h) {
    this.forRect(x, y, w, h, (c) => c.blackOut() );
    this.needsUpdate = true;
  }

  blackOutCell(x, y) {
    this[x][y].blackOut();
    this.needsUpdate = true;
  }

  dump(fmt) { super.dump( fmt || ((s) => s.ch) ); }

  plot(x, y, sprite) {
    if (sprite.opacity <= 0) return;

    if (!this.hasXY(x, y)) {
      UTILS.WARN('invalid coordinates: ' + x + ', ' + y);
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
      UTILS.WARN('invalid coordinates: ' + x + ', ' + y);
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
    TEXT.eachChar(text, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || fg, bg);
    });
  }

  plotLine(x, y, w, text, fg, bg) {
    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    let len = TEXT.length(text);
    TEXT.eachChar(text, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || fg, bg);
    });
    for(let i = len; i < w; ++i) {
      this.plotChar(i + x, y, ' ', bg, bg);
    }
  }

  wrapText(x, y, width, text, fg, bg, opts={}) {
    if (typeof opts === 'number') { opts = { indent: opts }; }
    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    width = Math.min(width, this.width - x);
    if (TEXT.length(text) <= width) {
      this.plotText(x, y, text, fg, bg);
      return y + 1;
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

  fill(ch, fg, bg) {
    this.fillRect(0, 0, this.width, this.height, ch, fg, bg);
  }

  fillRect(x, y, w, h, ch, fg, bg) {
    if (typeof fg === 'string') { fg = COLORS[fg]; }
    if (typeof bg === 'string') { bg = COLORS[bg]; }
    this.forRect(x, y, w, h, (destCell, i, j) => {
      destCell.plotChar(ch, fg, bg);
    });
    this.needsUpdate = true;
  }

  // // Very low-level. Changes displayBuffer directly.
	highlight(x, y, highlightColor, strength)
	{
		const cell = this[x][y];
		COLOR.applyAugment(cell.fg, highlightColor, strength);
		COLOR.applyAugment(cell.bg, highlightColor, strength);
		cell.needsUpdate = true;
    this.needsUpdate = true;
	}

}

types.Buffer = Buffer;

function makeBuffer(w, h) {
  return new types.Buffer(w, h);
}

make.buffer = makeBuffer;
