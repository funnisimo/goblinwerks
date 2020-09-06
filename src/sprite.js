
import { Color, applyMix, equals, makeColor } from './color.js';
import { types, make } from './gw.js';

const TEMP_BG = new Color();

export class Sprite {
	constructor(ch, fg, bg, opacity) {
		const args = Array.prototype.slice.call(arguments);
		this.ch = null;
		this.fg = null;
		this.bg = null;
		this.opacity = 100;

		let i = 0;
		if (typeof args[i] === 'string' && args[i].length == 1) {
			this.ch = args[i++];
			if (args[i] && (Array.isArray(args[i]) || typeof args[i] == 'string')) {
				this.fg = makeColor(args[i++]);
			}
			else {
				this.fg = makeColor('white');
			}
		}
		if (args[i] && (Array.isArray(args[i]) || typeof args[i] == 'string')) {
			this.bg = makeColor(args[i++]);
		}

		if (args[i] && typeof args[i] === 'number') {
			this.opacity = args[i++];
		}

		if (this.ch === null && this.fg === null && this.bg === null) {
			this.ch = ' ';
			this.fg = makeColor('white');
			this.bg = makeColor('black');
		}

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
