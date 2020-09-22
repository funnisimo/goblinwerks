
let MAP;
const CellFlags = GW.flags.cell;

GW.random.seed(12345);

GW.color.install('fireForeColor', 			70,		20,		0,		0, 15,	10,	0, true);
GW.color.install('lavaForeColor', 			20,		20,		20,		0, 100,	10,	0, true);
GW.color.install('lavaBackColor', 			70,		20,		0,		0, 15,	10,	0, true);

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120
});

async function crossedFinish() {
	++mapCount;
	await GW.ui.messageBox('Level ' + mapCount, 'blue', 1000);

	const map = makeMap(mapCount);
	await GW.game.startMap(map);
}

async function lavaTick(ctx) {
	if (GW.random.number(300 * 10 * 10) <= 1) {
		console.warn('ERUPT', ctx.x, ctx.y);
		return await GW.tileEvent.spawn({ tile: 'LAVA_ERUPTING' }, ctx);
	}
	else if (GW.random.percent(5)) {
		return await GW.tileEvent.spawn({ tile: 'LAVA_CRUST' }, ctx);
	}
}


async function startExplosion() {
	console.log('set crust');
	const cell = MAP.cell(25, 15);
	cell.setTile(LAVA_ERUPTING);
	cell.mechFlags |= GW.flags.cellMech.EVENT_FIRED_THIS_TURN;
	MAP.changed(true);
	GW.ui.requestUpdate();
}

const GOAL_TILE = GW.tile.install('GOAL', '=', 'green', 'black', 50, 0, 0,
	'finish line', 'you see the finish line.',
	{ playerEnter: crossedFinish }
);
const START_TILE = GW.tile.install('START', '=', 'blue', 'black', 50, 0);

const LAVA_TILE = GW.tile.install('LAVA_TILE', '~', 'lavaForeColor', 'lavaBackColor', 90,	0,
	'T_LAVA',
	'lava', 'you see molten lava.', { tick: lavaTick });

// LAVA_CRUST
const LAVA_CRUST = GW.tile.install('LAVA_CRUST', '~', 'lavaForeColor', 'dark_gray', 40,	GW.def.LIQUID,
	'T_BRIDGE',
	'crusted lava', 'you see crusted lava.', { tick: { chance: 10, tile: 'LAVA_CRUST_BREAKING' } });


// LAVA_CRUST_BREAKING
const LAVA_CRUST_BREAKING = GW.tile.install('LAVA_CRUST_BREAKING', '~', 'lavaForeColor', 'darkest_red', 45,	GW.def.LIQUID,
	'T_BRIDGE',
	'crusted lava', 'you see crusted lava that looks like it is unstable.', { tick: { chance: 60, flags: 'DFF_CLEAR_OTHER_TERRAIN' } });

// LAVA_ERUPTING
const LAVA_ERUPTING = GW.tile.install('LAVA_ERUPTING', '!', 'red', 'yellow', 91,	0,
	0,
	'erupting lava', 'you see a wave of hot lava.', { tick: { radius: 1, tile: 'LAVA_ERUPTING', flags: 'DFF_CLEAR_OTHER_TERRAIN', needs: 'LAVA_TILE', next: { tile: 'LAVA_ERUPTED' } }});

// LAVA_ERUPTED
const LAVA_ERUPTED = GW.tile.install('LAVA_ERUPTED', '~', 'blue', 'green', 92,	0,
	0,
	'lava', 'you see lava.', { tick: { tile: 'LAVA_TILE', flags: 'DFF_SUPERPRIORITY | DFF_PROTECTED' } });

async function rest(e) {
	PLAYER.endTurn();
	return true;
}

GW.commands.rest = rest;




let mapCount = 1;

function makeMap(id) {
	// dig a map
	MAP = GW.make.map(50, 30);
	MAP.clear();

	MAP.fill(6);
	MAP.cells.forRect(10, 0, 30, 30, (c) => c.setTile(1));
	MAP.cells.forRect(10, 1, 30, 1, (c) => c.setTile(GOAL_TILE) );
	MAP.cells.forRect(10, 28, 30, 1, (c) => c.setTile(START_TILE) );

	let height = 9; // 2 + Math.floor(id / 2);
	let top = Math.floor( (30 - height) / 2 ) + 1;

	MAP.cells.forRect(10, top, 30, height, (c) => c.setTile(LAVA_TILE) );

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
	GW.io.setKeymap({
		dir: 'moveDir', space: 'rest',
		'>': 'newMap', '<': 'newMap',
		'x': startExplosion,
		'?': 'showHelp'
	});

	await showHelp();
	MAP = makeMap(0);
	GW.game.start({ player: PLAYER, map: MAP });
}

window.onload = start;
