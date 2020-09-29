
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


let ERUPT_CHANCE = 300 * 10 * 10;
let CRUST_CHANCE = 5;

async function lavaTick(ctx) {
	if (GW.random.number(ERUPT_CHANCE) <= 1) {
		return await GW.tileEvent.spawn({ tile: 'LAVA_ERUPTING' }, ctx);
	}
	else if (GW.random.percent(CRUST_CHANCE)) {
		return await GW.tileEvent.spawn({ tile: 'LAVA_CRUST' }, ctx);
	}
}

async function lavaBreak(ctx) {
	if (GW.random.percent(BREAK_CHANCE)) {
		return await GW.tileEvent.spawn({ flags: GW.flags.tileEvent.DFF_CLEAR_OTHER_TERRAIN }, ctx);
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

const jumpHilite = GW.sprite.install('jumpHilite', 'green', 50);

async function jump() {
	console.log('jump');

	const buf = GW.ui.startDialog();
	let waiting = true;
	let dir = null;

	buf.plotLine(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, 'Jump: Which direction?', GW.colors.orange);

	GW.ui.draw();

	while(waiting) {
		const ev = await GW.io.nextEvent(100);
		await GW.io.dispatchEvent(ev, {
			escape() { waiting = false; dir = null; },
			enter() { waiting = false; },
			dir(e) {
				if (this.canJumpDir(e.dir)) {
					this.update(e.dir);
				}
			},
			canJumpDir(dir) {
				const nextCell = MAP.cell(PLAYER.x + dir[0], PLAYER.y + dir[1]);
				if (nextCell.hasTileFlag(GW.flags.tile.T_OBSTRUCTS_PASSABILITY)) return false;
				const destCell = MAP.cell(PLAYER.x + dir[0] * 2, PLAYER.y + dir[1] * 2);
				if (!destCell.isPassableNow()) return false;
				return true;
			},
			update(newDir) {
				GW.ui.clearDialog();
				buf.plotLine(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, 'Jump: Which direction?', GW.colors.orange);
				if (newDir) {
					buf.plot(PLAYER.x + newDir[0]*2, PLAYER.y + newDir[1]*2, jumpHilite);
				}
				dir = newDir;
				GW.ui.draw();
			}
		});
		GW.ui.draw();
	}

	GW.ui.finishDialog();

	if (dir) {
		console.log('Jump - ', dir);
		MAP.removeActor(PLAYER);
		await GW.fx.flashSprite(MAP, PLAYER.x + dir[0], PLAYER.y + dir[1], PLAYER.kind.sprite, 200);
		MAP.addActor(PLAYER.x + dir[0]*2, PLAYER.y + dir[1]*2, PLAYER);
		GW.ui.requestUpdate();
		PLAYER.endTurn();
	}

	return false;
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
	'lava with a cracking crust', 'you see crusted lava that looks like it is unstable.', { tick: lavaBreak });

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
	GW.map.addText(MAP, 22, 1, 'FINISH', 'green');
	MAP.cells.forRect(10, 28, 30, 1, (c) => c.setTile(START_TILE) );
	GW.map.addText(MAP, 23, 28, 'START', 'blue');

	// update the difficulty
	ERUPT_CHANCE = Math.max(300, 300 * (100 - id*2));
	CRUST_CHANCE = Math.max(2, Math.floor(10 - id/2));
	BREAK_CHANCE = Math.min(90, Math.floor(60 + id));

	GW.message.add(GW.colors.blue, 'Erupt: %d, Crust: %d, Break: %d', ERUPT_CHANCE, CRUST_CHANCE, BREAK_CHANCE);

	let height = 3 + Math.floor(id / 2);
	let top = Math.floor( (30 - height) / 2 ) + 1;

	MAP.cells.forRect(10, top, 30, height, (c) => c.setTile(LAVA_TILE) );



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
	y = buf.wrapText(5, y, 40, 'This example is all about crossing the lava field by walking/jumping over the crusted lava.', 'white');
	y++;
	buf.plotText(5, y, 'dir   ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.plotText(5, y, 'j     ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Jump over one cell in a direction you choose.', 'lighter_gray', null, 2);
	buf.plotText(5, y, 'space ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Wait a short time.', 'white', null, 2);
	buf.plotText(5, y, '?', 'yellow');
	y = buf.wrapText(11, y, 32, ': Show this screen.', 'lighter_gray');

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
		dir: 'moveDir', space: 'rest', 'j': jump,
		'x': startExplosion,
		'?': 'showHelp'
	});

	MAP = makeMap();
	GW.message.add('%RWelcome to Lava Hop!\nGet across the Lava field safely to advance.\nPress <?> for help.', 'yellow');
	GW.game.start({ player: PLAYER, map: MAP });
}

window.onload = start;