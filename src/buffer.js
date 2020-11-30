
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

  // XXXXXXXXXX
  plotText(x, y, text, fg, bg) {
    Text.eachChar(text, (ch, color, bg, i) => {
      this.plotChar(i + x, y, ch, color || GW.colors.white, bg);
    }, fg, bg);
  }

  applyText(x, y, text, args={}) {
    text = Text.apply(text, args);
    Text.eachChar(text, (ch, color, bg, i) => {
      this.plotChar(i + x, y, ch, color || GW.colors.white, null);
    }, args.fg, args.bg);
  }


  plotLine(x, y, w, text, fg, bg) {
    if (typeof fg === 'string') { fg = GW.colors[fg]; }
    if (typeof bg === 'string') { bg = GW.colors[bg]; }
    fg = fg || GW.colors.white;
    let len = Text.length(text);
    Text.eachChar(text, (ch, color, bg, i) => {
      this.plotChar(i + x, y, ch, color || fg, bg);
    });
    for(let i = len; i < w; ++i) {
      this.plotChar(i + x, y, ' ', bg, bg);
    }
  }

  wrapText(x0, y0, width, text, fg, bg, opts={}) {
    if (typeof opts === 'number') { opts = { indent: opts }; }
    fg = fg || 'white';
    if (typeof fg === 'string') { fg = GW.colors[fg]; }
    if (typeof bg === 'string') { bg = GW.colors[bg]; }
    width = Math.min(width, this.width - x0);
    const indent = opts.indent || 0;

    text = Text.wordWrap(text, width, indent);

    let x = x0;
    let y = y0;
    Text.eachChar(text, (ch, fg0, bg0) => {
      if (ch == '\n') {
        ++y;
        x = x0 + indent;
        return;
      }
      this.plotChar(x++, y, ch, fg0, bg0);
    }, fg, bg);

    return ++y;
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
