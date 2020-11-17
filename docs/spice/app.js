

GW.random.seed(12345);

let PLAYER;
let MAP;

function makePlayer() {
  return GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
  });
}



function makeMap(id=0) {
	const map = GW.make.map(GW.viewport.bounds.width, GW.viewport.bounds.height, { id, tile: 'FLOOR', boundary: 'WALL' });

  // TODO - Design your map


	return map;
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


GW.message.addKind('WELCOME', '#yellow#Welcome to Spice Trader!\n##Press <?> for help.');

// start the environment
async function start() {

	const canvas = GW.ui.start({ width: 100, height: 38, div: 'game', messages: -5, sidebar: -20, cursor: true, flavor: true });
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
		'?': showHelp,
	});

  PLAYER = makePlayer();
	MAP = makeMap();
	GW.message.add('WELCOME', { actor: PLAYER });
	GW.game.start({ player: PLAYER, map: MAP });
}

window.onload = start;
