
import { color as COLOR } from './color.js';
import { types, make } from './gw.js';

const TEMP_BG = new types.Color();

export var sprites = {};
export var sprite = {};

const HANGING_LETTERS = ['y', 'p', 'g', 'j', 'q', '[', ']', '(', ')', '{', '}', '|'];

export class Sprite {
	constructor(ch, fg, bg, opacity) {
		const args = Array.prototype.filter.call(arguments, (v) => v !== undefined );

		let argCount = args.length;
		const opIndex = args.findIndex( (v) => typeof v === 'number' );
		if (opIndex >= 0) {
			--argCount;
			opacity = args[opIndex];
		}
		if (argCount == 0) {
			ch = ' ';
			fg = 'white';
			bg = 'black';
		}
		else if (argCount == 1) {
			if (typeof args[0] === 'string' && args[0].length == 1) {
				ch = args[0];
				fg = 'white';
				bg = null;
			}
			else {
				ch = null;
				fg = null;
				bg = args[0];
			}
		}
		else if (argCount == 2) {
			ch = args[0];
			fg = args[1];
			bg = null;
		}

		this.ch = ch !== null ? (ch || ' ') : null;
		this.fg = fg !== null ? make.color(fg || 'white') : null;
		this.bg = bg !== null ? make.color(bg || 'black') : null;
		this.opacity = opacity || 100;
		this.needsUpdate = true;
		this.wasHanging = false;
	}

	copy(other) {
		this.ch = other.ch;

		if (this.fg && this.bg) { this.fg.copy(other.fg); }
		else if (this.fg) { this.fg.clear(); }
		else { this.fg = other.fg.clone(); }

		if (this.bg && other.bg) { this.bg.copy(other.bg); }
		else if (this.bg) { this.bg.clear(); }
		else { this.bg = other.bg.clone(); }

		this.opacity = other.opacity || 0;
		this.needsUpdate = other.needsUpdate || false;
		this.wasHanging = other.wasHanging || false;
	}

	clone() {
		const other = new types.Sprite(this.ch, this.fg, this.bg, this.opacity);
		other.wasHanging = this.wasHanging;
		other.needsUpdate = this.needsUpdate;
		return other;
	}

	nullify() {
		if (HANGING_LETTERS.includes(this.ch)) {
			this.wasHanging = true;
		}
		this.ch = ' ';
		if (this.fg) this.fg.clear();
		if (this.bg) this.bg.clear();
		this.opacity = 0;
		// this.needsUpdate = false;
	}

	blackOut() {
		this.nullify();
		this.opacity = 100;
		this.needsUpdate = true;
		this.wasHanging = false;
	}

	plotChar(ch, fg, bg) {
		this.wasHanging = this.wasHanging || (ch != null && HANGING_LETTERS.includes(ch));
		if (!this.opacity) {
			this.ch = ' ';
		}
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

		this.wasHanging = this.wasHanging || (sprite.ch != null && HANGING_LETTERS.includes(sprite.ch));

    // ch and fore color:
    if (sprite.ch && sprite.ch != ' ') { // Blank cells in the overbuf take the ch from the screen.
      this.ch = sprite.ch;
    }

		if (sprite.fg && sprite.ch != ' ') {
			COLOR.applyMix(this.fg, sprite.fg, sprite.opacity);
		}

		if (sprite.bg) {
			COLOR.applyMix(this.bg, sprite.bg, sprite.opacity);
		}

    if (this.ch != ' ' && COLOR.equals(this.fg, this.bg))
    {
      this.ch = ' ';
    }
		this.opacity = Math.max(this.opacity, sprite.opacity);
		this.needsUpdate = true;
		return true;
	}

	equals(other) {
		return this.ch == other.ch && COLOR.equals(this.fg, other.fg) && COLOR.equals(this.bg, other.bg);
	}

	bake() {
		if (this.fg && !this.fg.dances) {
			COLOR.bake(this.fg);
		}
		if (this.bg && !this.bg.dances) {
			COLOR.bake(this.bg);
		}
	}
}

types.Sprite = Sprite;

export function makeSprite(ch, fg, bg, opacity) {
	if (arguments.length == 1 && typeof arguments[0] === 'object' && ch !== null) {
		opacity = ch.opacity || null;
		bg = ch.bg || null;
		fg = ch.fg || null;
		ch = ch.ch || null;
	}
  return new Sprite(ch, fg, bg, opacity);
}

make.sprite = makeSprite;

export function installSprite(name, ch, fg, bg, opacity) {
	const sprite = make.sprite(ch, fg, bg, opacity);
	sprites[name] = sprite;
	return sprite;
}

sprite.install = installSprite;
