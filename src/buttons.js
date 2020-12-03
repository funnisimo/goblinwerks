
import * as Color from './color.js';
import * as Utils from './utils.js';
import * as Flag from './flag.js';
import * as Text from './text.js';
import * as GW from './gw.js';


const interfaceButtonColor = 	Color.addKind('interfaceButtonColor', 	18,		15,		38,		0,		0,			0,			0,		false);
const buttonHoverColor = Color.addKind('buttonHoverColor', 			100,	70,		40,		0,		0,			0,			0,		false);
const titleButtonColor = Color.addKind('titleButtonColor', 			23,		15,		30,		0,		0,			0,			0,		false);


const ButtonState = {
	BUTTON_NORMAL: 0,
	BUTTON_HOVER: 1,
	BUTTON_PRESSED: 2,
};

const ButtonFlags = Flag.installFlag('button', {
	B_DRAW					: Flag.Fl(0),
	B_ENABLED				: Flag.Fl(1),
	B_GRADIENT				: Flag.Fl(2),
	B_HOVER_ENABLED			: Flag.Fl(3),
	B_WIDE_CLICK_AREA		: Flag.Fl(4),
	B_KEYPRESS_HIGHLIGHT	: Flag.Fl(5),
});


class Button {
	constructor(opts={}) {
    this.init(opts);
	}

  clear() {
    	this.text = ''; // [COLS*3];			// button label; can include color escapes
    	this.x = 0;					// button's leftmost cell will be drawn at (x, y)
    	this.y = 0;
    	this.hotkey = []; // [10];		// up to 10 hotkeys to trigger the button
    	this.color = GW.make.color();			// background of the button; further gradient-ized when displayed
    	this.opacity = 0;				// further reduced by 50% if not enabled
    	this.symbol = [];	//[COLS]		// Automatically replace the nth asterisk in the button label text with
    								// the nth character supplied here, if one is given.
    								// (Primarily to display magic character and item symbols in the inventory display.)
    	this.flags = 0;
      this.state = 0;
  }

  init(opts={}) {
    this.clear();

    this.flags |= (ButtonFlags.B_ENABLED | ButtonFlags.B_GRADIENT | ButtonFlags.B_HOVER_ENABLED | ButtonFlags.B_DRAW | ButtonFlags.B_KEYPRESS_HIGHLIGHT);

    this.state = 0;
  	this.color.copy(opts.color || interfaceButtonColor);
  	this.opacity = opts.opacity || this.opacity || 100;
    this.text = opts.text || this.text || '';
    this.x = opts.x || this.x || 0;
    this.y = opts.y || this.y || 0;

    if (opts.hotkey) {
      if (!Array.isArray(opts.hotkey)) {
        opts.hotkey = [opts.hotkey];
      }
      this.hotkey = opts.hotkey.slice();
    }
  }

  draw(buffer) {
    let i, textLoc, width, midPercent, symbolNumber, opacity, oldRNG;
  	let fColor = GW.make.color(), bColor = GW.make.color(), fColorBase, bColorBase, bColorEdge, bColorMid;
  	let displayCharacter;

  	if (!(this.flags & ButtonFlags.B_DRAW)) {
  		return;
  	}

  	symbolNumber = 0;

  	width = Text.length(this.text);
  	bColorBase = this.color.clone();
  	fColorBase = ((this.flags & ButtonFlags.B_ENABLED) ? GW.colors.white : GW.colors.gray).clone();

  	if (this.state == ButtonState.BUTTON_HOVER && (this.flags & ButtonFlags.B_HOVER_ENABLED)) {
  		//applyColorAugment(&fColorBase, &buttonHoverColor, 20);
  		//applyColorAugment(&bColorBase, &buttonHoverColor, 20);
  		fColorBase.mix(buttonHoverColor, 25);
  		bColorBase.mix(buttonHoverColor, 25);
  	}

  	bColorEdge = bColorBase.clone();
  	bColorMid	= bColorBase.clone();
  	bColorEdge.mix(GW.colors.black, 50);

  	if (this.state == ButtonState.BUTTON_PRESSED) {
  		bColorMid.mix(GW.colors.black, 75);
  		if (Color.diff(bColorMid, bColorBase) < 50) {
  			bColorMid	= bColorBase;
  			bColorMid.mix(buttonHoverColor, 50);
  		}
  	}
  	// bColor = bColorMid.clone();

  	opacity = this.opacity;
  	if (this.state == ButtonState.BUTTON_HOVER || this.state == ButtonState.BUTTON_PRESSED) {
  		opacity = Math.floor(100 - ((100 - opacity) * opacity / 100)); // Apply the opacity twice.
  	}

    Text.eachChar(this.text, (ch, color, bg, i) => {
      if (typeof color === 'string') {
        color = Color.from(color);
      }
      fColor.copy(color || fColorBase);

      if (this.flags & ButtonFlags.B_GRADIENT) {
        midPercent = Utils.smoothHiliteGradient(i, width - 1);
  			bColor.copy(bColorEdge);
  			bColor.mix(bColorMid, midPercent);
  		}
      else {
        bColor.copy(bColorMid);
      }

  		if (this.state == ButtonState.BUTTON_PRESSED) {
  			fColor.mix(bColor, 30);
  		}

  		if (this.opacity < 100) {
  			fColor.mix(bColor, 100 - opacity);
  		}

  		fColor.bake();
  		bColor.bake();
  		Color.separate(fColor, bColor);

  		if (ch === '*') {
  			if (this.symbol[symbolNumber]) {
  				ch = this.symbol[symbolNumber];
  			}
  			symbolNumber++;
  		}

  		if (buffer.hasXY(this.x + i, this.y)) {
  			buffer.plotChar(this.x + i, this.y, ch, fColor, bColor);
        // opacity???
  		}

    });

  }

}

GW.types.Button = Button;

GW.make.button = ((opts) => new Button(opts));



class Buttons {
  constructor() {
    // Indices of the buttons that are doing stuff:
		this.buttonFocused = -1;
		this.buttonDepressed = -1;
    this.buttonChosen = -1;

		// The buttons themselves:
		this.buttons = [];

		// The window location, to determine whether a click is a cancelation:
		// winX: 0,
		// winY: 0,
		// winWidth: 0,
		// winHeight: 0,

		// Graphical buffers:
		// dbuf, // cellDisplayBuffer [COLS][ROWS]; // Where buttons are drawn.
		// rbuf, // cellDisplayBuffer [COLS][ROWS]; // Reversion screen state.
  }

  init(buttons) {
  	// Initialize variables for the state struct:
  	this.buttonChosen = this.buttonFocused = this.buttonDepressed = -1;

  	// this.winX			= winX;
  	// this.winY			= winY;
  	// this.winWidth	= winWidth;
  	// this.winHeight	= winHeight;

    if (buttons) {
      this.buttons = buttons.slice();
    }
  }

  addButton(text, opts) {
    if (typeof text !== 'string') {
      opts = text;
      text = null;
    }
    opts = opts || {};
    if (text) {
      opts.text = text;
    }
    const button = GW.make.button(opts);
    this.buttons.push(button);
    return button;
  }

  draw(buffer) {
    this.buttons.forEach( (button) => button.draw(buffer) );
  }

  _indexAtXY(x, y) {
    return this.buttons.findIndex( (button) => {
      return ((button.flags & ButtonFlags.B_DRAW)
        && (button.flags & ButtonFlags.B_ENABLED)
        && (button.y == y || ((button.flags & ButtonFlags.B_WIDE_CLICK_AREA) && Math.abs(button.y - y) <= 1))
        && x >= button.x
        && x < button.x + Text.length(button.text));
    });
  }

  async press(index) {
    if (this.buttonFocused >= 0) {
      this.buttons[this.buttonFocused].state = 0;
    }
    if (this.buttonDepressed >= 0) {
      this.buttons[this.buttonDepressed].state = 0;
    }

    this.buttonFocused = this.buttonDepressed = this.buttonChosen = index;
    if (index >= 0) {
      this.buttons[index].state = ButtonState.BUTTON_PRESSED;

      console.log('DO BUTTON ACTION!');
    }
  }

  focus(index) {
    if (this.buttonFocused >= 0) {
      this.buttons[this.buttonFocused].state = 0;
    }
    this.buttonFocused = index;

    if (this.buttonDepressed >= 0) {
      this.buttons[this.buttonDepressed].state = 0;
    }
    this.buttonDepressed = this.buttonChosen = -1;

    if (index >= 0) {
      this.buttons[index].state = ButtonState.BUTTON_HOVER;
    }
  }

  async dispatchEvent(ev) {
    if (ev.type == GW.def.MOUSEMOVE) {
      const index = this._indexAtXY(ev.x, ev.y);
      this.focus(index);
      return (index >= 0);
    }

    if (ev.type == GW.def.CLICK) {
      const index = this._indexAtXY(ev.x, ev.y);
      await this.press(index);
      return (index >= 0);
    }
  	if (ev.type == GW.def.KEYPRESS) {
      for(let index = 0; index < this.buttons.length; ++index) {
        const button = this.buttons[index];
        if (button.hotkey.indexOf(ev.key) >= 0) {
          await this.press(index);
          return true;
        }
      }

      if (ev.key === 'Enter' && this.buttonFocused >= 0) {
        await this.press(this.buttonFocused);
        return true;
      }
    }

    return false;
  }
}

GW.types.Buttons = Buttons;

GW.make.buttons = (() => new Buttons());
