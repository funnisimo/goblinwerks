
import { Mixer } from 'gw-canvas';
import * as Color from './color.js';
import * as GW from './gw.js';

const TEMP_BG = new GW.types.Color();

export class Sprite extends Mixer {
	constructor(ch=' ', fg=null, bg=null, opacity) {
    super();
    this.draw(ch, fg, bg);
    this.needsUpdate = true;
    this.opacity = opacity || 100;
	}

  _changed() {
    this.needsUpdate = true;
    this.opacity = (this.fg.isNull() && this.bg.isNull()) ? 0 : 100;
    return this;
  }

  copy(other) {
    other.ch = other.ch || ' ';
    super.copy(other);
    this.opacity = other.opacity || 100;
    return this;
  }

  equals(other) {
    if (this.ch != other.ch) return false;
    if (this.fg) {
      if (!this.fg.equals(other.fg)) return false;
    }
    else if (other.fg) {
      return false;
    }
    if (this.bg) {
      if (!this.bg.equals(other.bg)) return false;
    }
    else if (other.bg) {
      return false;
    }

    return true;
  }

  mix(color, pct) {
    if (this.bg) this.bg.mix(color, pct);
    if (this.fg) this.fg.mix(color, pct);
    this.needsUpdate = true;
    this.opacity = this.opacity || 100;
    return this;
  }

}

GW.types.Sprite = Sprite;

export function makeSprite(ch, fg, bg, opacity) {
  if (ch && ch instanceof Color.Color) {
    bg = ch;
    ch = undefined;
  }
  else if (ch && Array.isArray(ch)) {
    [ch, fg, bg, opacity] = ch;
  }
  else if (ch && typeof ch === 'object') {
    if (ch.fg) { ch.fg = Color.from(ch.fg); }
    if (ch.bg) { ch.bg = Color.from(ch.bg); }
    return ch;
  }

  if ((bg === undefined) && ch && ch.length > 1) {
    bg = ch;
    ch = undefined;
  }

  if (typeof fg === 'number') {
    opacity = fg;
    fg = undefined;
  }
  if (typeof bg === 'number') {
    opacity = bg;
    bg = undefined;
  }

  if (fg) fg = Color.from(fg);
  if (bg) bg = Color.from(bg);

  return { ch, fg, bg, opacity };
}

GW.make.sprite = makeSprite;

export function install(name, ch, fg, bg, opacity) {
	const sprite = GW.make.sprite(ch, fg, bg, opacity);
	GW.sprites[name] = sprite;
	return sprite;
}
