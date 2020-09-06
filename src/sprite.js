
import { Color, applyMix, equals, makeColor } from './color.js';
import { types, make } from './gw.js';

const TEMP_BG = new Color();

export class Sprite {
	constructor(ch, fg, bg, opacity) {
		this.ch = ch !== null ? (ch || ' ') : null;
		this.fg = fg !== null ? makeColor(fg || 'white') : null;
		this.bg = bg !== null ? makeColor(bg || 'black') : null;
		this.opacity = opacity || 100;
		this.needsUpdate = true;
	}

	copy(other) {
		this.ch = other.ch;
		this.fg.copy(other.fg);
		this.bg.copy(other.bg);
		this.opacity = other.opacity || 0;
		this.needsUpdate = other.needsUpdate || false;
	}

	clear() {
		this.ch = ' ';
		this.fg.clear();
		this.bg.clear();
		this.opacity = 0;
		this.needsUpdate = false;
	}

	erase() {
		this.clear();
		this.opacity = 100;
		this.needsUpdate = true;
	}

	plotChar(ch, fg, bg) {
    if (ch) { this.ch = ch; }
		if (fg) { this.fg.copy(fg); }
    if (bg) { this.bg.copy(bg); }
    this.opacity = 100;
    this.needsUpdate = true;
	}

	plot(sprite) {
		if (sprite.opacity == 0) return false;

    if (sprite.opacity == 100) {
      this.plotChar(sprite.ch, sprite.fg, sprite.bg);
      return true;
    }

    // ch and fore color:
    if (sprite.ch && sprite.ch != ' ') { // Blank cells in the overbuf take the ch from the screen.
      this.ch = sprite.ch;
      this.fg.copy(sprite.fg);
    }

		if (sprite.bg) {
			applyMix(this.bg, sprite.bg, sprite.opacity);
		}

    if (this.ch != ' ' && equals(this.fg, this.bg))
    {
      this.ch = ' ';
    }
		this.needsUpdate = true;
		return true;
	}

}

types.Sprite = Sprite;

export function makeSprite(ch, fg, bg, opacity) {
  return new Sprite(ch, fg, bg, opacity);
}

make.sprite = makeSprite;
