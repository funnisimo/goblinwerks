
import * as Color from './color.js';
import * as Text from './text.js';
import * as Utils from './utils.js';
import { cosmetic } from './random.js';
import * as GW from './gw.js';


const MENU_FLAME_PRECISION_FACTOR =		10;
const MENU_FLAME_RISE_SPEED =					50;
const MENU_FLAME_SPREAD_SPEED =				20;
const MENU_FLAME_COLOR_DRIFT_SPEED =	500;
const MENU_FLAME_FADE_SPEED =					20;
const MENU_FLAME_UPDATE_DELAY =				50;
const MENU_FLAME_ROW_PADDING =				2;

const MENU_FLAME_COLOR_SOURCE_COUNT =	1136;

const MENU_FLAME_DENOMINATOR =				(100 + MENU_FLAME_RISE_SPEED + MENU_FLAME_SPREAD_SPEED);

const flameSourceColor  = Color.addKind('flameSourceColor', 		20, 7,  7, 0, 60, 40, 40, true);
const flameSourceColorSecondary = Color.addKind('flameSourceColorSecondary', 7, 	2, 0, 0, 10, 0, 	0, true);
const flameTitleColor = Color.addKind('flameTitleColor', 		0, 0, 0, 0, 9, 9, 15, true); // *pale blue*;



const NULL_TITLE = [
  "#############    ######    ######          ######    ",
  "      ##       ##     ###   ##  ##       ##     ###  ",
  "      ##      ##       ###  ##   ###    ##       ### ",
  "      ##      #    #    ##  ##    ##    #    #    ## ",
  "      ##     ##   ##     ## ##     ##  ##   ##     ##",
  "      ##     ##   ###    ## ##      ## ##   ###    ##",
  "      ##     ##   ####   ## ##       # ##   ####   ##",
  "      ##     ##   ####   ## ##       # ##   ####   ##",
  "      ##     ##    ###   ## ##       # ##    ###   ##",
  "      ##     ###    ##   ## ##      #  ###    ##   ##",
  "      ##      ##    #    #  ##     ##   ##    #    # ",
  "      ##      ###       ##  ##    ##    ###       ## ",
  "      ##       ###     ##   ##   ##      ###     ##  ",
  "     ####        ######    ######          ######    ",
];

const NULL_VERSION = '0.0.0';





// // Takes a grid of values, each of which is 0 or 100, and fills in some middle values in the interstices.
function antiAlias(mask /* char[COLS][ROWS] */) {
	let i, j, x, y, dir, nbCount;
	let intensity = [0, 0, 35, 50, 60];

	for (i=0; i<mask.width; i++) {
		for (j=0; j<mask.height; j++) {
			if (mask[i][j] < 100) {
				nbCount = 0;
				for (dir=0; dir<4; dir++) {
					x = i + GW.def.dirs[dir][0];
					y = j + GW.def.dirs[dir][1];
					if (mask.hasXY(x, y) && mask[x][y] == 100) {
						nbCount++;
					}
				}
				mask[i][j] = intensity[nbCount];
			}
		}
	}
}



export class Flames {
  constructor(buffer, opts={}) {
    this.buffer = buffer;

    this.mask = GW.make.grid(buffer.width, buffer.height);
    this.flames = GW.make.grid(buffer.width, buffer.height + MENU_FLAME_ROW_PADDING, () => [0, 0, 0] );
  	this.colorSources = []; 	// [red, green, blue, rand], one for each color source
  	this.colors = GW.make.grid(buffer.width, buffer.height + MENU_FLAME_ROW_PADDING, null );
    this.colorStorage = GW.make.array(buffer.width, () => GW.make.color() );

    Utils.setDefaults(opts, {
      primary: flameSourceColor,
      secondary: flameSourceColorSecondary,
      'flames.#': flameTitleColor,
      version: NULL_VERSION,
      mask: NULL_TITLE,
    });

    this._initialize(opts);

    // Simulate the background flames for a while
  	for (let i=0; i<100; i++) {
  		this.update();
  	}

  }

  _initialize(opts={}) {

    this.version = opts.version;

    this.mask.fill(0);
    this.colors.fill(null);
    this.flames.forEach( (v, x, y) => {
      v[0] = v[1] = v[2] = 0;
    });

    // Put some flame source along the bottom row.
  	let colorSourceCount = 0;
    this.colorStorage.forEach( (c, i) => {
      c.copy(opts.primary);
      c.mix(opts.secondary, 100 - (Utils.smoothHiliteGradient(i, this.colors.width - 1) + 25));
      this.colors[i][this.colors.height - 1] = c;
      colorSourceCount++;
    });

    if (opts.mask) {
  		const title = opts.mask;
      const flames = opts.flames;

  		const MENU_TITLE_WIDTH =	title[0].length;
  		const MENU_TITLE_HEIGHT =	title.length;
      const x = Math.round((this.buffer.width - MENU_TITLE_WIDTH)/2);
      const y = Math.round((this.buffer.height - MENU_TITLE_HEIGHT)/2);

  		// Wreathe the title in flames, and mask it in black.
  		for (let i=0; i<MENU_TITLE_WIDTH; i++) {
  			for (let j=0; j<MENU_TITLE_HEIGHT; j++) {
          const char = title[j][i] || ' ';
  				if (char != ' ') {
  					const thisCol = x + i; /* + MENU_TITLE_OFFSET_X */
  					const thisRow = y + j; /* + MENU_TITLE_OFFSET_Y */
            if (char != '%') {
              this.colors[thisCol][thisRow] = opts.flames[char] || opts.flames['#'];
    					colorSourceCount++;
            }
  					this.mask[thisCol][thisRow] = (char == '#') ? 100 : 50;
  				}
  			}
  		}

  		// Anti-alias the mask.
  		// antiAlias(this.mask); // SWC - I am not sure I like the anti-alias look.
  	}

    // Seed source color random components.
    const rnd = cosmetic.range.bind(cosmetic, 0, 1000);
    for(let i = 0; i < colorSourceCount; ++i) {
      this.colorSources.push( [rnd(), rnd(), rnd(), rnd()] );
    }

  }

  update() {
    let i, j, k, l, x, y;
  	let tempFlames = GW.make.array(this.flames.width, () => [0,0,0]);
  	let colorSourceNumber, rand;

  	colorSourceNumber = 0;
  	for (j=0; j < this.flames.height; j++) {

  		// Make a temp copy of the current row.
  		for (i=0; i<this.flames.width; i++) {
  			for (k=0; k<3; k++) {
  				tempFlames[i][k] = this.flames[i][j][k];
  			}
  		}

  		for (i=0; i<this.flames.width; i++) {
  			// Each cell is the weighted average of the three color values below and itself.
  			// Weight of itself: 100
  			// Weight of left and right neighbors: MENU_FLAME_SPREAD_SPEED / 2 each
  			// Weight of below cell: MENU_FLAME_RISE_SPEED
  			// Divisor: 100 + MENU_FLAME_SPREAD_SPEED + MENU_FLAME_RISE_SPEED

  			// Itself:
  			for (k=0; k<3; k++) {
  				this.flames[i][j][k] = Math.round(100 * this.flames[i][j][k] / MENU_FLAME_DENOMINATOR);
  			}

  			// Left and right neighbors:
  			for (l = -1; l <= 1; l += 2) {
  				x = i + l;
  				if (x == -1) {
  					x = this.flames.width - 1;
  				} else if (x == this.flames.width) {
  					x = 0;
  				}
  				for (k=0; k<3; k++) {
  					this.flames[i][j][k] += Math.floor(MENU_FLAME_SPREAD_SPEED * tempFlames[x][k] / 2 / MENU_FLAME_DENOMINATOR);
  				}
  			}

  			// Below:
  			y = j + 1;
  			if (y < this.flames.height) {
  				for (k=0; k<3; k++) {
  					this.flames[i][j][k] += Math.floor(MENU_FLAME_RISE_SPEED * this.flames[i][y][k] / MENU_FLAME_DENOMINATOR);
  				}
  			}

  			// Fade a little:
  			for (k=0; k<3; k++) {
  				this.flames[i][j][k] = Math.floor((1000 - MENU_FLAME_FADE_SPEED) * this.flames[i][j][k] / 1000);
  			}

  			if (this.colors[i][j]) {
  				// If it's a color source tile:

  				// First, cause the color to drift a little.
  				for (k=0; k<4; k++) {
  					this.colorSources[colorSourceNumber][k] += cosmetic.range(-MENU_FLAME_COLOR_DRIFT_SPEED, MENU_FLAME_COLOR_DRIFT_SPEED);
  					this.colorSources[colorSourceNumber][k] = Utils.clamp(this.colorSources[colorSourceNumber][k], 0, 1000);
  				}

  				// Then, add the color to this tile's flames.
  				rand = Math.floor(this.colors[i][j]._rand * this.colorSources[colorSourceNumber][0] / 1000);
  				this.flames[i][j][0] += Math.floor((this.colors[i][j]._r	+ (this.colors[i][j]._redRand	* this.colorSources[colorSourceNumber][1] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);
  				this.flames[i][j][1] += Math.floor((this.colors[i][j]._g	+ (this.colors[i][j]._greenRand	* this.colorSources[colorSourceNumber][2] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);
  				this.flames[i][j][2] += Math.floor((this.colors[i][j]._b	+ (this.colors[i][j]._blueRand	* this.colorSources[colorSourceNumber][3] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);

  				colorSourceNumber++;
  			}
  		}
  	}
  }



  draw() {
  	let i, j;
    const tempColor = GW.make.color();
  	const maskColor = GW.colors.black;
    let dchar;

  	const versionString = this.version;
    const versionStringLength = Text.length(versionString);

  	for (j=0; j < this.buffer.height; j++) {
  		for (i=0; i < this.buffer.width; i++) {
        if (j == this.buffer.height - 1 && i >= this.buffer.width - versionStringLength) {
            dchar = versionString.charAt(i - (this.mask.width - versionStringLength));
        } else {
            dchar = ' ';
        }

  			if (this.mask[i][j] == 100) {
  				this.buffer.draw(i, j, dchar, GW.colors.gray, maskColor);
  			} else {
          const flameColor = this.flames[i][j];
          tempColor.blackOut();
  				tempColor._r	= Math.round(flameColor[0] / MENU_FLAME_PRECISION_FACTOR);
  				tempColor._g	= Math.round(flameColor[1] / MENU_FLAME_PRECISION_FACTOR);
  				tempColor._b	= Math.round(flameColor[2] / MENU_FLAME_PRECISION_FACTOR);
  				if (this.mask[i][j] > 0) {
  					tempColor.mix(maskColor, this.mask[i][j]);
  				}
  				this.buffer.draw(i, j, dchar, GW.colors.gray, tempColor);
  			}
  		}
  	}
  }

}

GW.types.Flames = Flames;
