
import { Color } from './color.js';
import { types, make } from './gw.js';

export class Sprite {
	constructor(ch, fg, bg) {
		this.ch = ch || ' ';
		this.fg = new Color(fg || [0,0,0,0,0,0]);
		this.bg = new Color(bg || [0,0,0,0,0,0]);
		this.opacity = 100;
		this.needsUpdate = true;
		this.flags = 0;
	}

	copy(other) {
		this.ch = other.ch;
		this.fg.copy(other.fg);
		this.bg.copy(other.bg);
		this.opacity = other.opacity || 0;
		this.needsUpdate = other.needsUpdate || false;
		this.flags = other.flags || 0;
	}

	clear() {
		this.ch = ' ';
		this.fg.clear();
		this.bg.clear();
		this.opacity = 0;
		this.needsUpdate = false;
		this.flags = 0;
	}

	erase() {
		this.clear();
		this.opacity = 100;
		this.needsUpdate = true;
	}

	plot(ch, fg, bg) {
    if (ch) { this.ch = ch; }
		if (fg) { this.fg.copy(fg); }
    if (bg) { this.bg.copy(bg); }
    this.opacity = 100;
    this.needsUpdate = true;
		this.flags = 0;
	}
}

types.Sprite = Sprite;

export function makeSprite(ch, fg, bg) {
  return new Sprite(ch, fg, bg);
}

make.sprite = makeSprite;
