
import { Color, applyMix, equals, makeColor } from './color.js';
import { types, make } from './gw.js';

const TEMP_BG = new Color();

export class Sprite {
	constructor(ch, fg, bg, opacity=100) {
		this.ch = ch || ' ';
		this.fg = makeColor(fg || 'white');
		this.bg = makeColor(bg || 'black');
		this.opacity = opacity;
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

    let ch, fg;
    TEMP_BG.copy(sprite.bg);

    // ch and fore color:
    if (sprite.ch == ' ') { // Blank cells in the overbuf take the ch from the screen.
      ch = this.ch;
      fg = this.fg;
      // applyMix(fg, sprite.bg, sprite.opacity);
    } else {
      ch = sprite.ch;
      fg = sprite.fg;
    }

    applyMix(TEMP_BG, this.bg, 100 - sprite.opacity);

    if (ch != ' ' && equals(fg, TEMP_BG))
    {
      ch = ' ';
    }

    if (ch !== this.ch
      || !equals(fg, this.fg)
      || !equals(TEMP_BG, this.bg))
    {
      this.plotChar(ch, fg, TEMP_BG);
    }

		return this.needsUpdate;
	}

}

types.Sprite = Sprite;

export function makeSprite(ch, fg, bg, opacity) {
  return new Sprite(ch, fg, bg, opacity);
}

make.sprite = makeSprite;
