
import { Mixer } from 'gw-canvas';
import * as Color from './color.js';
import { types, make, ui } from './gw.js';

const TEMP_BG = new types.Color();

export var sprites = {};
export var sprite = {};

const HANGING_LETTERS = ['y', 'p', 'g', 'j', 'q', '[', ']', '(', ')', '{', '}', '|'];
const FLYING_LETTERS = ["'", '"', '$', 'f', '[', ']', '|'];

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

	// draw(ch, fg, bg) {
	// 	this.wasHanging = this.wasHanging || (ch != null && HANGING_LETTERS.includes(ch));
  //   this.wasFlying  = this.wasFlying  || (ch != null && FLYING_LETTERS.includes(ch));
	// 	if (!this.opacity) {
	// 		this.ch = ' ';
	// 	}
  //   if (ch) { this.ch = ch; }
	// 	if (fg) { this.fg.copy(fg); }
  //   if (bg) { this.bg.copy(bg); }
  //   this.opacity = 100;
  //   this.needsUpdate = true;
	// }
  //
	// drawSprite(sprite, alpha=100) {
  //   const opacity = Math.floor(sprite.opacity * alpha / 100);
	// 	if (opacity == 0) return false;
  //
  //   if (opacity >= 100) {
  //     this.draw(sprite.ch, sprite.fg, sprite.bg);
  //     return true;
  //   }
  //
	// 	this.wasHanging = this.wasHanging || (sprite.ch != null && HANGING_LETTERS.includes(sprite.ch));
  //   this.wasFlying  = this.wasFlying  || (sprite.ch != null && FLYING_LETTERS.includes(sprite.ch));
  //
  //   // ch and fore color:
  //   if (sprite.ch && sprite.ch != ' ') { // Blank cells in the overbuf take the ch from the screen.
  //     this.ch = sprite.ch;
  //   }
  //
	// 	if (sprite.fg && sprite.ch != ' ') {
	// 		this.fg.mix(sprite.fg, opacity);
	// 	}
  //
	// 	if (sprite.bg) {
	// 		this.bg.mix(sprite.bg, opacity);
	// 	}
  //
  //   if (this.ch != ' ' && this.fg.equals(this.bg))
  //   {
  //     this.ch = ' ';
  //   }
	// 	this.opacity = Math.max(this.opacity, opacity);
	// 	this.needsUpdate = true;
	// 	return true;
	// }
  //
	// bake(force) {
	// 	if (this.fg && (force || !this.fg.dances)) {
	// 		this.fg.bake();
	// 	}
	// 	if (this.bg && (force || !this.bg.dances)) {
	// 		this.bg.bake();
	// 	}
	// }
}

types.Sprite = Sprite;

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

make.sprite = makeSprite;

export function installSprite(name, ch, fg, bg, opacity) {
	const sprite = make.sprite(ch, fg, bg, opacity);
	sprites[name] = sprite;
	return sprite;
}

sprite.install = installSprite;
