


const MENU_FLAME_UPDATE_DELAY =				50;

const lavaBackColor     = GW.color.addKind('lavaBackColor', 			70,	20,	0, 0, 15, 10,	0,	true);
const titleHighlightColor = GW.color.addKind('titleHighlightColor', 40, 20, 20, 0, 20, 20, 20, true);



const SPICE_TITLE = [
'  #####                            #######                                    ',
' #     # #####  #  ####  ######       #    #####    ##   #####  ###### #####  ',
' #       #    # # #    # #            #    #    #  #  #  #    # #      #    # ',
'  #####  #    # # #      #####        #    #    # #    # #    # #####  #    # ',
'       # #####  # #      #            #    #####  ###### #    # #      #####  ',
' #     # #      # #    # #            #    #   #  #    # #    # #      #   #  ',
'  #####  #      #  ####  ######       #    #    # #    # #####  ###### #    # ',
];

const SPICE_VERSION = '1.0.0';


const MainMenuCommands = {
  NG_NOTHING: 0,
	NG_NEW_GAME: 1,
	NG_NEW_GAME_WITH_SEED: 2,
	// NG_HIGH_SCORES: 3,
	// NG_QUIT: 4,
};




async function titleMenu(opts) {
	opts = opts || {};
	const titleMask = opts.title || SPICE_TITLE;
	const versionString = opts.version || SPICE_VERSION;

  const buffer = GW.ui.startDialog();

  const flames = new GW.types.Flames(buffer, {
    flames: {
      '*': lavaBackColor,
    },
    mask: SPICE_TITLE,
    version: SPICE_VERSION,
  });

	let i, b, x, y;
	const buttons = GW.make.buttons();

  let button;
  let text;

  text = "      ΩgoldΩN∆ew Game      ";
  button = buttons.addButton(text, { hotkey: ['n', 'N'] });

  text = " New Game with ΩgoldΩS∆eed ";
  button = buttons.addButton(text, { hotkey: ['s', 'S'] });

  text = "       SΩgoldΩt∆ory        ";
  button = buttons.addButton(text, { hotkey: ['t', 'T'] });

  text = "       ΩgoldΩA∆bout        ";
  button = buttons.addButton(text, { hotkey: ['a', 'A'] });

	x = buffer.width - 1 - 20 - 2;
	y = buffer.height - 1;
	for (i = buttons.buttons.length-1; i >= 0; i--) {
		y -= 2;
		buttons.buttons[i].x = x;
		buttons.buttons[i].y = y;
		buttons.buttons[i].color.copy(GW.colors.titleButtonColor);
		buttons.buttons[i].flags |= GW.flags.button.B_WIDE_CLICK_AREA;
	}

	buffer.blackOut();

	do {
		// Update the display.
		flames.update();
		flames.draw();
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
