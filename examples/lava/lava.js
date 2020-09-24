
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

	const map = makeMap(MAP.id + 1);
	await GW.ui.messageBox('Level ' + map.id, 'light_blue', 1000);
	GW.message.add('Level: %d', map.id);
	await GW.game.startMap(map);
}

async function lavaTick(ctx) {
	if (GW.random.number(300 * 10 * 10) <= 1) {
		GW.message.add('ERUPTION @ %d,%d', ctx.x, ctx.y);
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
	'the finish line', 'you see the finish line.',
	{ playerEnter: crossedFinish }
);
const START_TILE = GW.tile.install('START', '=', 'blue', 'black', 50, 0, 0, 'the starting line');

const LAVA_TILE = GW.tile.install('LAVA_TILE', '~', 'lavaForeColor', 'lavaBackColor', 90,	0,
	'T_LAVA',
	'lava', 'you see molten lava.', { tick: lavaTick });

// LAVA_CRUST
const LAVA_CRUST = GW.tile.install('LAVA_CRUST', '~', 'lavaForeColor', 'dark_gray', 91,	GW.def.LIQUID,
	'T_BRIDGE',
	'crusted lava', 'you see crusted lava.', { tick: { chance: 10, tile: 'LAVA_CRUST_BREAKING' } });


// LAVA_CRUST_BREAKING
const LAVA_CRUST_BREAKING = GW.tile.install('LAVA_CRUST_BREAKING', '~', 'lavaForeColor', 'darkest_red', 92,	GW.def.LIQUID,
	'T_BRIDGE',
	'lava with a cracking crust', 'you see crusted lava that looks like it is unstable.', { tick: { chance: 60, flags: 'DFF_CLEAR_OTHER_TERRAIN' } });

// LAVA_ERUPTING
const LAVA_ERUPTING = GW.tile.install('LAVA_ERUPTING', '!', 'yellow', 'red', 91,	0,
	0,
	'a wave of erupting lava', 'you see a wave of hot lava.', { tick: { radius: 1, tile: 'LAVA_ERUPTING', flags: 'DFF_CLEAR_OTHER_TERRAIN', needs: 'LAVA_TILE', next: { tile: 'LAVA_ERUPTED' } }});

// LAVA_ERUPTED
const LAVA_ERUPTED = GW.tile.install('LAVA_ERUPTED', '~', 'lavaForeColor', 'lavaBackColor', 92,	0,
	0,
	'lava', 'you see lava.', { tick: { tile: 'LAVA_TILE', flags: 'DFF_SUPERPRIORITY | DFF_PROTECTED' } });

async function rest(e) {
	PLAYER.endTurn();
	return true;
}

GW.commands.rest = rest;




function makeMap(id=1) {
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

	MAP.setFlags(0, GW.flags.cell.VISIBLE);
	MAP.id = id;
	MAP.locations.start = [25, 29];
	return MAP;
}



async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.plotText(10, y++, 'GoblinWerks Lava Hop Example', 'green');
	y++;
	y = buf.wrapText(5, y, 40, 'This example is all about crossing the lava field.', 'white');
	y++;
	buf.plotText(5, y, 'DIR   ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.plotText(5, y, 'SPACE ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Rest player - lets game time animations continue.', 'white', null, 2);
	buf.plotText(5, y, '?', 'yellow');
	y = buf.wrapText(11, y, 32, ': Show this screen.', 'white');

	buf.fillRect(4, 1, 42, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}

GW.commands.showHelp = showHelp;


// start the environment
async function start() {

	const canvas = GW.ui.start({ width: 50, height: 36, div: 'game', messages: -5, cursor: true, flavor: true });
	GW.io.setKeymap({
		dir: 'moveDir', space: 'rest',
		'x': startExplosion,
		'?': 'showHelp'
	});

	MAP = makeMap();
	GW.message.add('%RWelcome to Lava Hop!\nGet across the Lava field safely to advance.\nPress <?> for help.', 'yellow');
	GW.game.start({ player: PLAYER, map: MAP });
}

window.onload = start;
