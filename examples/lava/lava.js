
let MAP;
const CellFlags = GW.flags.cell;

GW.random.seed(12345);

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120
});

const GOAL_TILE = GW.tile.install('GOAL', '=', 'green', 'black', 50, 0);
const START_TILE = GW.tile.install('START', '=', 'blue', 'black', 50, 0);


async function rest(e) {
	PLAYER.endTurn();
}

GW.commands.rest = rest;




let mapCount = 0;

function makeMap(id) {
	// dig a map
	MAP = GW.make.map(50, 30);
	MAP.clear();

	MAP.fill(6);
	MAP.cells.forRect(10, 0, 30, 30, (c) => c.setTile(1));
	MAP.cells.forRect(10, 1, 30, 1, (c) => c.setTile(GOAL_TILE) );
	MAP.cells.forRect(10, 28, 30, 1, (c) => c.setTile(START_TILE) );

	GW.map.addText(MAP, 22, 1, 'FINISH', 'green');
	GW.map.addText(MAP, 23, 28, 'START', 'blue');

	MAP.id = id;
	MAP.locations.start = [25, 29];
	return MAP;
}


function newMap() {
	const map = makeMap();
	GW.game.startMap(map);
}

GW.commands.newMap = newMap;


async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.plotText(10, y++, 'GoblinWerks Lava Dodge Example', 'green');
	y++;
	y = buf.wrapText(5, y, 60, 'This example is all about dodging the fireballs.', 'white');
	y++;
	buf.plotText(5, y++, 'DIR   : Pressing a direction key moves the player.', 'white');
	buf.plotText(5, y++, 'SPACE : Rest player - lets game time animations continue.', 'white');
	buf.plotText(5, y++, '?     : Show this screen.', 'white');

	buf.fillRect(4, 1, 42, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}

GW.commands.showHelp = showHelp;


// start the environment
async function start() {

	const canvas = GW.ui.start({ width: 50, height: 35, div: 'game' });
	GW.io.addKeymap({
		dir: 'moveDir', space: 'rest',
		'>': 'newMap', '<': 'newMap',
		'?': 'showHelp'
	});

	await showHelp();
	MAP = makeMap(0);
	GW.game.start({ player: PLAYER, map: MAP });
}

window.onload = start;
