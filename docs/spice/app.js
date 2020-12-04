

GW.random.seed(12345);

let PLAYER;
let MAP;

function makePlayer() {
  return GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
    stats: {
      fov: 5, gold: 100, empty: 10, hold: 10, hull: 100,
      favor: 500,
      fancy: 1000,
    },
    // sidebar(entry, y, dim, highlight, buf)
    // - Called to add this actor to the sidebar (if not provided, it will use the default)
    // - Return the new y (after adding any rows)
    sidebar(entry, y, dim, highlight, buf) {
      const player = entry.entity;
      y = GW.sidebar.addText(buf, y, 'Spice Trader', 'green', null, { dim, highlight, indent: 8 });
      y = GW.sidebar.addProgressBar(y, buf, 'Governor Favor', player.current.favor, 10000, 'greenBar', false);
      y = GW.sidebar.addProgressBar(y, buf, 'Daughter Fancy', player.current.fancy, 10000, 'greenBar', false);

    	y = GW.sidebar.addName(entry, y + 1, dim, highlight, buf);
      y = GW.sidebar.addProgressBar(y, buf, 'Hull', player.current.hull, player.max.hull, 'blueBar', dim);
      y = GW.sidebar.addText(buf, y, 'Gold: ΩgoldΩ' + player.current.gold, null, null, { dim, highlight, indent: 8 });
      const used = player.current.hold - player.current.empty;
      y = GW.sidebar.addText(buf, y, 'Hold: ΩgreenΩ' + used + '∆/' + player.current.hold, null, null, { dim, highlight, indent: 8 });

      return y;
    },
  });
}



async function showHelp() {
	const buf = GW.ui.startDialog();
  buf.blackOut();

	let y = 2;
	buf.drawText(10, y++, 'HELP');
	y++;
	y = buf.wrapText(5, y, 40, 'This is where you add your help information.');

	GW.ui.draw();

	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}


GW.message.addKind('WELCOME', 'ΩyellowΩWelcome to Spice Trader!∆\nPress <?> for help.');

// start the environment
async function start() {

	const canvas = GW.ui.start({ width: 96, height: 38, div: 'game', messages: -5, sidebar: -32, cursor: true, flavor: true, wideMessages: true, autoCenter: true, showPath: true, clickToMove: true });
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
		'?': showHelp,
	});

  let running = true;
  while(running) {
    const choice = await titleMenu();
    if (choice == 0 || choice == 1) {
      PLAYER = makePlayer();
      MAP = makeMap();
      resetPorts();
      GW.message.add('WELCOME', { actor: PLAYER });
      await GW.game.start({ player: PLAYER, map: MAP, fov: true });
    }
    else if (choice == 2) {
      await showStory();
    }
    else if (choice == 3) {
      await showAbout();
    }

  }

}

window.onload = start;
