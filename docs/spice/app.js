

GW.random.seed(12345);

let PLAYER;
let MAP;

function makePlayer() {
  return GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
    stats: { fov: 5, gold: 100, empty: 10, hold: 10, hull: 100 },
    // sidebar(entry, y, dim, highlight, buf)
    // - Called to add this actor to the sidebar (if not provided, it will use the default)
    // - Return the new y (after adding any rows)
    sidebar(entry, y, dim, highlight, buf) {
      const player = entry.entity;
    	y = GW.sidebar.addName(entry, y, dim, highlight, buf);
      y = GW.sidebar.addProgressBar(y, buf, 'Hull', player.current.hull, player.max.hull, 'blueBar', dim);
      y = GW.sidebar.addText(buf, y, 'Gold: #gold#' + player.current.gold, null, null, { dim, highlight, indent: 8 });
      const used = player.current.hold - player.current.empty;
      y = GW.sidebar.addText(buf, y, 'Hold: #green#' + used + '##/' + player.current.hold, null, null, { dim, highlight, indent: 8 });

      return y;
    },
  });
}



async function showHelp() {
	const buf = GW.ui.startDialog();
  buf.blackOut();

	let y = 2;
	buf.plotText(10, y++, 'HELP');
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

  PLAYER = makePlayer();
	MAP = makeMap();
  resetPorts();
	GW.message.add('WELCOME', { actor: PLAYER });
	GW.game.start({ player: PLAYER, map: MAP, fov: true });
}

window.onload = start;
