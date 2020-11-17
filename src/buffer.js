
import * as Text from './text.js';
import * as Utils from './utils.js';
import * as Color from './color.js';
import * as GW from './gw.js';


class Buffer extends GW.types.Grid {
  constructor(w, h) {
    super(w, h, () => new GW.types.Sprite() );
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

  blackOut(bg) {
    this.forEach( (c) => c.blackOut(bg) );
    this.needsUpdate = true;
  }

  blackOutRect(x, y, w, h, bg) {
    this.forRect(x, y, w, h, (c) => c.blackOut(bg) );
    this.needsUpdate = true;
  }

  blackOutCell(x, y) {
    this[x][y].blackOut();
    this.needsUpdate = true;
  }

  fade(color, pct) {
    color = Color.from(color);
    this.forEach( (s) => s.fade(color, pct) );
  }

  dump(fmt) { super.dump( fmt || ((s) => s.ch) ); }

  plot(x, y, sprite) {
    if (sprite.opacity <= 0) return;

    if (!this.hasXY(x, y)) {
      Utils.WARN('invalid coordinates: ' + x + ', ' + y);
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
      Utils.WARN('invalid coordinates: ' + x + ', ' + y);
      return;
    }

    if (typeof fg === 'string') { fg = GW.colors[fg]; }
    if (typeof bg === 'string') { bg = GW.colors[bg]; }
    const destCell = this[x][y];
    destCell.plotChar(ch, fg, bg);
    this.needsUpdate = true;
  }

  plotText(x, y, text, ...args) {
    if (args.length) {
      text = Text.format(text, ...args);
    }
    Text.eachChar(text, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || GW.colors.white, null);
    });
  }

  applyText(x, y, text, args) {
    text = Text.apply(text, args);
    Text.eachChar(text, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || GW.colors.white, null);
    });
  }


  plotLine(x, y, w, text, fg, bg) {
    if (typeof fg === 'string') { fg = GW.colors[fg]; }
    if (typeof bg === 'string') { bg = GW.colors[bg]; }
    fg = fg || GW.colors.white;
    let len = Text.length(text);
    Text.eachChar(text, (ch, color, i) => {
      this.plotChar(i + x, y, ch, color || fg, bg);
    });
    for(let i = len; i < w; ++i) {
      this.plotChar(i + x, y, ' ', bg, bg);
    }
  }

  wrapText(x, y, width, text, fg, bg, opts={}) {
    if (typeof opts === 'number') { opts = { indent: opts }; }
    if (typeof fg === 'string') { fg = GW.colors[fg]; }
    if (typeof bg === 'string') { bg = GW.colors[bg]; }
    width = Math.min(width, this.width - x);
    if (Text.length(text) <= width) {
      this.plotLine(x, y, width, text, fg, bg);
      return y + 1;
    }
    opts.indent = opts.indent || 0;

    const lines = Text.splitIntoLines(text, width, opts.indent);
    lines.forEach( (line, i) => {
      const offset = i ? opts.indent : 0;
      this.plotLine(x + offset, y + i, width - offset, line, fg || GW.colors.white, bg);
    });

    return y + lines.length;
  }

  fill(ch, fg, bg) {
    this.fillRect(0, 0, this.width, this.height, ch, fg, bg);
  }

  fillRect(x, y, w, h, ch, fg, bg) {
    if (typeof fg === 'string') { fg = GW.colors[fg]; }
    if (typeof bg === 'string') { bg = GW.colors[bg]; }
    this.forRect(x, y, w, h, (destCell, i, j) => {
      destCell.plotChar(ch, fg, bg);
    });
    this.needsUpdate = true;
  }

  // // Very low-level. Changes displayBuffer directly.
	highlight(x, y, highlightColor, strength)
	{
		const cell = this[x][y];
		cell.fg.add(highlightColor, strength);
		cell.bg.add(highlightColor, strength);
		cell.needsUpdate = true;
    this.needsUpdate = true;
	}

}

GW.types.Buffer = Buffer;

function makeBuffer(w, h) {
  return new GW.types.Buffer(w, h);
}

GW.make.buffer = makeBuffer;
