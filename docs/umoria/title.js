

const MENU_FLAME_PRECISION_FACTOR =		10;
const MENU_FLAME_RISE_SPEED =					50;
const MENU_FLAME_SPREAD_SPEED =				20;
const MENU_FLAME_COLOR_DRIFT_SPEED =	500;
const MENU_FLAME_FADE_SPEED =					20;
const MENU_FLAME_UPDATE_DELAY =				50;
const MENU_FLAME_ROW_PADDING =				2;
// const MENU_TITLE_OFFSET_X =						(-4);
// const MENU_TITLE_OFFSET_Y =						(-1);

const MENU_FLAME_COLOR_SOURCE_COUNT =	1136;

const MENU_FLAME_DENOMINATOR =				(100 + MENU_FLAME_RISE_SPEED + MENU_FLAME_SPREAD_SPEED);

var noMenu = false;

const lavaBackColor     = GW.color.addKind('lavaBackColor', 			70,	20,	0, 0, 15, 10,	0,	true);
const flameSourceColor  = GW.color.addKind('flameSourceColor', 		20, 7,  7, 0, 60, 40, 40, true);
const flameSourceColorSecondary = GW.color.addKind('flameSourceColorSecondary', 7, 	2, 0, 0, 10, 0, 	0, true);

const flameTitleColor = GW.color.addKind('flameTitleColor', 		0, 0, 0, 0, 9, 9, 15, true); // *pale blue*;
const titleHighlightColor = GW.color.addKind('titleHighlightColor', 40, 20, 20, 0, 20, 20, 20, true);



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

const UMORIA_TITLE = [
  " #                       #  ####        ####    ###    ########    ####      ###    ",
  " #                       #   ##          ##    ## ##    ##   ###    ##      ## ##   ",
  " #                       #   ###        ###   ##   ##   ##    ##    ##      ## ##   ",
  " #         %%%%%         #   ####      ####  ##     ##  ##    ##    ##     ##   ##  ",
  " #       %%     %%       #   ## ##    ## ##  ##     ##  ##    ##    ##     ##   ##  ",
  " ##    %%    #    %%    ##   ##  ##  ##  ##  ##     ##  ##   ##     ##    ###   ### ",
  " ## %**      #      **% ##   ##   ####   ##  ##     ##  ## ###      ##    ######### ",
  " ##    **    #    **    ##   ##    ##    ##  ##     ##  ##  ##      ##    ##     ## ",
  " ##      **     **      ##   ##          ##  ##     ##  ##   ##     ##    ##     ## ",
  " ##        *****        ##   ##          ##  ##     ##  ##   ##     ##    ##     ## ",
  " ##                     ##   ##          ##  ##     ##  ##    ##    ##    ##     ## ",
  " ###                   ###   ##          ##   ##   ##   ##    ##    ##    ##     ## ",
  "  ###                 ###    ##          ##    ## ##    ##     ##   ##    ##     ## ",
  "   ###               ###    ####        ####    ###    ####    ### ####  ####   ####",
  "     #################                                                              ",
  "        ##########                                                                  ",
  "            ##                                                                      ",
  "            ##                                                                      ",
  "           ####                                                                     ",
];

const UMORIA_VERSION = '5.7.11';  // Based on this version


const MainMenuCommands = {
  NG_NOTHING: 0,
	NG_NEW_GAME: 1,
	NG_NEW_GAME_WITH_SEED: 2,
	// NG_HIGH_SCORES: 3,
	// NG_QUIT: 4,
};



function drawMenuFlames(buf, flames,  mask, versionString) {
	let i, j, versionStringLength;
  const tempColor = GW.make.color();
	const maskColor = GW.colors.black;
  let dchar;

	versionString = versionString || '0.0.0';

  versionStringLength = GW.text.length(versionString);

	for (j=0; j < buf.height; j++) {
		for (i=0; i < buf.width; i++) {
      if (j == buf.height - 1 && i >= buf.width - versionStringLength) {
          dchar = versionString.charAt(i - (mask.width - versionStringLength));
      } else {
          dchar = ' ';
      }

			if (mask[i][j] == 100) {
				buf.plotChar(i, j, dchar, GW.colors.gray, maskColor);
			} else {
        const flameColor = flames[i][j];
        tempColor.clear();
				tempColor.red	= Math.round(flameColor[0] / MENU_FLAME_PRECISION_FACTOR);
				tempColor.green	= Math.round(flameColor[1] / MENU_FLAME_PRECISION_FACTOR);
				tempColor.blue	= Math.round(flameColor[2] / MENU_FLAME_PRECISION_FACTOR);
				if (mask[i][j] > 0) {
					tempColor.mix(maskColor, mask[i][j]);
				}
				buf.plotChar(i, j, dchar, GW.colors.gray, tempColor);
			}
		}
	}
}


function updateMenuFlames( colors /* color[COLS][(ROWS + MENU_FLAME_ROW_PADDING)] */,
						colorSources /* short[MENU_FLAME_COLOR_SOURCE_COUNT][4] */,
						flames /* short[COLS][(ROWS + MENU_FLAME_ROW_PADDING)][3] */)
{
	let i, j, k, l, x, y;
	let tempFlames = GW.make.array(flames.width, () => [0,0,0]); // short[COLS][3];
	let colorSourceNumber, rand;

	colorSourceNumber = 0;
	for (j=0; j<flames.height; j++) {

		// Make a temp copy of the current row.
		for (i=0; i<flames.width; i++) {
			for (k=0; k<3; k++) {
				tempFlames[i][k] = flames[i][j][k];
			}
		}

		for (i=0; i<flames.width; i++) {
			// Each cell is the weighted average of the three color values below and itself.
			// Weight of itself: 100
			// Weight of left and right neighbors: MENU_FLAME_SPREAD_SPEED / 2 each
			// Weight of below cell: MENU_FLAME_RISE_SPEED
			// Divisor: 100 + MENU_FLAME_SPREAD_SPEED + MENU_FLAME_RISE_SPEED

			// Itself:
			for (k=0; k<3; k++) {
				flames[i][j][k] = Math.round(100 * flames[i][j][k] / MENU_FLAME_DENOMINATOR);
			}

			// Left and right neighbors:
			for (l = -1; l <= 1; l += 2) {
				x = i + l;
				if (x == -1) {
					x = flames.width - 1;
				} else if (x == flames.width) {
					x = 0;
				}
				for (k=0; k<3; k++) {
					flames[i][j][k] += Math.floor(MENU_FLAME_SPREAD_SPEED * tempFlames[x][k] / 2 / MENU_FLAME_DENOMINATOR);
				}
			}

			// Below:
			y = j + 1;
			if (y < flames.height) {
				for (k=0; k<3; k++) {
					flames[i][j][k] += Math.floor(MENU_FLAME_RISE_SPEED * flames[i][y][k] / MENU_FLAME_DENOMINATOR);
				}
			}

			// Fade a little:
			for (k=0; k<3; k++) {
				flames[i][j][k] = Math.floor((1000 - MENU_FLAME_FADE_SPEED) * flames[i][j][k] / 1000);
			}

			if (colors[i][j]) {
				// If it's a color source tile:

				// First, cause the color to drift a little.
				for (k=0; k<4; k++) {
					colorSources[colorSourceNumber][k] += GW.cosmetic.range(-MENU_FLAME_COLOR_DRIFT_SPEED, MENU_FLAME_COLOR_DRIFT_SPEED);
					colorSources[colorSourceNumber][k] = GW.utils.clamp(colorSources[colorSourceNumber][k], 0, 1000);
				}

				// Then, add the color to this tile's flames.
				rand = Math.floor(colors[i][j].rand * colorSources[colorSourceNumber][0] / 1000);
				flames[i][j][0] += Math.floor((colors[i][j].red	+ (colors[i][j].redRand	* colorSources[colorSourceNumber][1] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);
				flames[i][j][1] += Math.floor((colors[i][j].green	+ (colors[i][j].greenRand	* colorSources[colorSourceNumber][2] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);
				flames[i][j][2] += Math.floor((colors[i][j].blue	+ (colors[i][j].blueRand	* colorSources[colorSourceNumber][3] / 1000) + rand) * MENU_FLAME_PRECISION_FACTOR);

				colorSourceNumber++;
			}
		}
	}
}


// // Takes a grid of values, each of which is 0 or 100, and fills in some middle values in the interstices.
function antiAlias(mask /* char[COLS][ROWS] */) {
	let i, j, x, y, dir, nbCount;
	let intensity = [0, 0, 35, 50, 60];

	for (i=0; i<mask.width; i++) {
		for (j=0; j<mask.height; j++) {
			if (mask[i][j] < 100) {
				nbCount = 0;
				for (dir=0; dir<4; dir++) {
					x = i + nbDirs[dir][0];
					y = j + nbDirs[dir][1];
					if (mask.hasXY(x, y) && mask[x][y] == 100) {
						nbCount++;
					}
				}
				mask[i][j] = intensity[nbCount];
			}
		}
	}
}




function initializeMenuFlames(titleMask,
	colors, 			// const color *[COLS][(ROWS + MENU_FLAME_ROW_PADDING)],
	colorStorage, // color[COLS],
	colorSources, // signed short [MENU_FLAME_COLOR_SOURCE_COUNT][4],
	flames, 			// signed short [COLS][(ROWS + MENU_FLAME_ROW_PADDING)][3],
	mask) 				// unsigned char [COLS][ROWS])
{

	let i, j, k;

  mask.fill(0);
  colors.fill(null);
  flames.forEach( (v, x, y) => {
    v[0] = v[1] = v[2] = 0;
  });

	// Seed source color random components.
  colorSources.forEach( (v) => {
    for (k=0; k<4; k++) {
			v[k] = GW.cosmetic.range(0, 1000);
		}
  });

	// Put some flame source along the bottom row.
	let colorSourceCount = 0;
  colorStorage.forEach( (c, i) => {
    c.copy(flameSourceColor);
    c.mix(flameSourceColorSecondary, 100 - (smoothHiliteGradient(i, colors.width - 1) + 25));
    colors[i][colors.height - 1] = c;
    colorSourceCount++;
  });

	if (titleMask) {
		const title = titleMask;

		const MENU_TITLE_WIDTH =	title[0].length;
		const MENU_TITLE_HEIGHT =	title.length;

		// Wreathe the title in flames, and mask it in black.
		for (i=0; i<MENU_TITLE_WIDTH; i++) {
			for (j=0; j<MENU_TITLE_HEIGHT; j++) {
        const char = title[j][i] || ' ';
				if (char != ' ') {
					const thisCol = Math.round((mask.width - MENU_TITLE_WIDTH)/2 + i /* + MENU_TITLE_OFFSET_X */);
					const thisRow = Math.round((mask.height - MENU_TITLE_HEIGHT)/2 + j /* + MENU_TITLE_OFFSET_Y */);
          if (char != '%') {
            colors[thisCol][thisRow] = char == '#' ? flameTitleColor : lavaBackColor;
  					colorSourceCount++;
          }
					mask[thisCol][thisRow] = (char == '#') ? 100 : 50;
				}
			}
		}

		// Anti-alias the mask.
		// antiAlias(mask); // SWC - I am not sure I like the anti-alias look.
	}

	// brogueAssert(colorSourceCount <= MENU_FLAME_COLOR_SOURCE_COUNT);

	// Simulate the background flames for a while
	for (i=0; i<100; i++) {
		updateMenuFlames(colors, colorSources, flames);
	}
}



async function titleMenu(opts) {
	opts = opts || {};
	const titleMask = opts.title || NULL_TITLE;
	const versionString = opts.version || NULL_VERSION;

  const buffer = GW.ui.startDialog();

	const flames = GW.make.grid(buffer.width, buffer.height + MENU_FLAME_ROW_PADDING, () => [0, 0, 0] );
	const colorSources = GW.make.array(MENU_FLAME_COLOR_SOURCE_COUNT, () => [0, 0, 0, 0] ); 	// red, green, blue, and rand, one for each color source (no more than MENU_FLAME_COLOR_SOURCE_COUNT).
	const colors = GW.make.grid(buffer.width, buffer.height + MENU_FLAME_ROW_PADDING, null );
  const colorStorage = GW.make.array(buffer.width, GW.make.color );
	const mask = GW.make.grid(buffer.width, buffer.height);
	let controlKeyWasDown = false;

	let i, b, x, y;
	const buttons = GW.make.buttons();

	let whiteColorEscape  = '';
	let goldColorEscape   = '';
	let newGameText       = '';
	let customNewGameText = '';

  let button;
  let text;

  text = GW.text.format("    %FQ%Fuick start     ", 'gold', null);
  button = buttons.addButton(text, { hotkey: ['q', 'Q'] });

  text = GW.text.format("      %FN%Few Game      ", 'gold', null);
  button = buttons.addButton(text, { hotkey: ['n', 'N'] });

  text = GW.text.format(" New Game with %FS%Feed ", 'gold', null);
  button = buttons.addButton(text, { hotkey: ['s', 'S'] });

  text = GW.text.format("       S%Ft%Fory        ", 'gold', null);
  button = buttons.addButton(text, { hotkey: ['t', 'T'] });

  text = GW.text.format("       %FA%Fbout        ", 'gold', null);
  button = buttons.addButton(text, { hotkey: ['a', 'A'] });

	x = buffer.width - 1 - 20 - 2;
	y = buffer.height - 1;
	for (i = buttons.buttons.length-1; i >= 0; i--) {
		y -= 2;
		buttons.buttons[i].x = x;
		buttons.buttons[i].y = y;
		buttons.buttons[i].color.copy(titleButtonColor);
		buttons.buttons[i].flags |= ButtonFlags.B_WIDE_CLICK_AREA;
	}

	buffer.blackOut();
	initializeMenuFlames(titleMask, colors, colorStorage, colorSources, flames, mask);

	do {
		// Update the display.
		updateMenuFlames(colors, colorSources, flames);
		drawMenuFlames(buffer, flames, mask, versionString);
    buffer.fillRect(x-1, y-1, 22, buttons.buttons.length*2+1, ' ', 'black', 'black');
    buttons.draw(buffer);
    GW.ui.draw();

		// Pause briefly.
    let ev = {};			// There was input during the pause! Get the input.
		while ((!ev.dt) && buttons.buttonChosen == -1) {
			// Process the input.
      ev = await GW.io.nextEvent(MENU_FLAME_UPDATE_DELAY);			// There was input during the pause! Get the input.
		  buttons.dispatchEvent(ev);
		}
	} while (buttons.buttonChosen == -1);

	GW.ui.finishDialog();
	return buttons.buttonChosen;
}
