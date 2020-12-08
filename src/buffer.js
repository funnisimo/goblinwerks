
import { DataBuffer, Buffer } from 'gw-canvas';

import * as Text from './text.js';
import * as Utils from './utils.js';
import * as Color from './color.js';
import * as Grid from './grid.js';
import { Sprite } from './sprite.js';
import * as GW from './gw.js';

DataBuffer.prototype.drawText = function(x, y, text, fg, bg) {
  Text.eachChar(text, (ch, color, bg, i) => {
    this.draw(i + x, y, ch, color || GW.colors.white, bg);
  }, fg, bg);
  return ++y;
}

DataBuffer.prototype.wrapText = function(x0, y0, width, text, fg, bg, opts={}) {
  if (typeof opts === 'number') { opts = { indent: opts }; }
  fg = fg || 'white';
  // if (typeof fg === 'string') { fg = GW.colors[fg]; }
  // if (typeof bg === 'string') { bg = GW.colors[bg]; }
  width = Math.min(width, this.width - x0);
  const indent = opts.indent || 0;

  text = Text.wordWrap(text, width, indent);

  let x = x0;
  let y = y0;
  Text.eachChar(text, (ch, fg0, bg0) => {
    if (ch == '\n') {
      while(x < x0 + width) {
        this.draw(x++, y, ' ', GW.colors.black, bg0);
      }
      ++y;
      x = x0 + indent;
      return;
    }
    this.draw(x++, y, ch, fg0, bg0);
  }, fg, bg);

  while(x < x0 + width) {
    this.draw(x++, y, ' ', GW.colors.black, bg);
  }

  return ++y;
}

DataBuffer.prototype.fillRect = function(x, y, w, h, ch, fg, bg) {
  // if (typeof fg === 'string') { fg = GW.colors[fg]; }
  // if (typeof bg === 'string') { bg = GW.colors[bg]; }
  for(let i = x; i < x + w; ++i) {
    for(let j = y; j < y + h; ++j) {
      this.draw(i, j, ch, fg, bg);
    }
  }
  return this;
}

DataBuffer.prototype.blackOutRect = function(x, y, w, h, bg) {
  bg = bg || 'black';
  return this.fillRect(x, y, w, h, 0, 0, bg);
}

DataBuffer.prototype.highlight = function(x, y, highlightColor, strength)
{
  const mixer = new Sprite();
	const data = this.get(x, y);
  mixer.drawSprite(data);
	mixer.fg.add(highlightColor, strength);
	mixer.bg.add(highlightColor, strength);
  this.drawSprite(x, y, mixer);
  return this;
}

DataBuffer.prototype.mix = function(color, percent) {

  const mixer = new Sprite();
  for(let x = 0; x < this.width; ++x) {
    for(let y = 0; y < this.height; ++y) {
      const data = this.get(x, y);
      mixer.drawSprite(data);
    	mixer.fg.mix(color, percent);
    	mixer.bg.mix(color, percent);
      this.drawSprite(x, y, mixer);
    }
  }
  return this;
}


DataBuffer.prototype.dump = function() {
  const data = [];
  let header = '    ';
  for(let x = 0; x < this.width; ++x) {
    if ((x%10) == 0) header += ' ';
    header += (x%10);
  }
  data.push(header);
  data.push('');

  for(let y = 0; y < this.height; ++y) {
    let line = `${(''+y).padStart(2)}] `;
    for(let x = 0; x < this.width; ++x) {
      if ((x % 10) == 0) line += ' ';
      const data = this.get(x, y);
      line += String.fromCharCode(data.glyph || 32);
    }
    data.push(line);
  }
  console.log(data.join('\n'));
}

let NEXT_GLYPH = 128;

Buffer.prototype._toGlyph = function(ch) {
  if (ch === null || ch === undefined) return -1;

  let glyph = this.canvas.glyphs.forChar(ch);
  if (glyph < 0) {
    console.log('Register new Glyph', ch, ch.charCodeAt(0), NEXT_GLYPH);
    glyph = NEXT_GLYPH;
    this.canvas.glyphs.draw(NEXT_GLYPH++, ch);
  }
  return glyph;
}


export { DataBuffer, Buffer };

GW.types.DataBuffer = DataBuffer;
GW.types.Buffer = Buffer;
