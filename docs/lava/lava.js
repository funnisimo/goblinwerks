
let MAP;
const CellFlags = GW.flags.cell;

GW.random.seed(12345);

GW.color.addKind('fireForeColor', 			70,		20,		0,		0, 15,	10,	0, true);
GW.color.addKind('lavaForeColor', 			20,		20,		20,		0, 100,	10,	0, true);
GW.color.addKind('lavaBackColor', 			70,		20,		0,		0, 15,	10,	0, true);

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120
});

GW.message.addKind('FINISH', 'Level: §level§');

async function crossedFinish() {
	const map = makeMap(MAP.id + 1);
	await GW.ui.alert(1000, 'Ωlight_blueΩLevel §level§.',{ level: map.id });
	GW.message.add('FINISH', { actor: PLAYER, level: map.id });
	await GW.game.startMap(map, 'start');
}


let ERUPT_CHANCE = 300 * 10 * 10;
let CRUST_CHANCE = 5;
let LAVA_START_BREAK = 20;

async function lavaTick(x, y, ctx) {
	const ctx2 = Object.assign({}, ctx, { x, y });
	if (GW.random.number(ERUPT_CHANCE) <= 1) {
    console.log('erupt', x, y);
		return await GW.tileEvent.spawn({ tile: 'LAVA_ERUPTING' }, ctx2);
	}
	else if (GW.random.chance(CRUST_CHANCE)) {
		const r = await GW.tileEvent.spawn({ tile: 'LAVA_CRUST' }, ctx2);
    console.log('crust', x, y, r, ctx.map.cell(x, y).layers);
    return r;
	}
}

async function lavaCrustTick(x, y, ctx) {
  if (GW.random.chance(LAVA_START_BREAK)) {
    console.log('breaking', x, y);
    const ctx2 = Object.assign({}, ctx, { x, y });
    return await GW.tileEvent.spawn({ tile: 'LAVA_CRUST_BREAKING' }, ctx2);
  }
}

async function lavaBreakingTick(x, y, ctx) {
	const ctx2 = Object.assign({}, ctx, { x, y });
	if (GW.random.chance(BREAK_CHANCE)) {
    console.log('reset', x, y);
		return await GW.tileEvent.spawn({ flags: GW.flags.tileEvent.DFF_NULL_SURFACE }, ctx2);
	}
}

async function startExplosion() {
	console.log('set crust');
	const cell = MAP.cell(25, 15);
	map.setTile(25, 15, 'LAVA_ERUPTING');
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

	buf.wrapText(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, 'Jump: Which direction?', GW.colors.orange);

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
				GW.ui.resetDialog();
				buf.wrapText(GW.flavor.bounds.x, GW.flavor.bounds.y, GW.flavor.bounds.width, 'Jump: Which direction?', GW.colors.orange);
				if (newDir) {
					buf.drawSprite(PLAYER.x + newDir[0]*2, PLAYER.y + newDir[1]*2, jumpHilite);
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


GW.tile.addKind('GOAL', {
	sprite: { ch: '=', fg: 'green', bg: 'black' }, priority: 50,
	name: 'finish line', article: 'the',
	events: { playerEnter: crossedFinish }
});

GW.tile.addKind('START', {
	sprite: { ch: '=', fg: 'blue', bg: 'black' }, priority: 50, name: 'starting line', article: 'the'
});

GW.tile.addKind('LAVA_TILE', {
	sprite: { ch: '~', fg: 'lavaForeColor', bg: 'lavaBackColor' }, priority: 90,
	flags: 'T_LAVA',
	name: 'molten lava', article: 'some',
	events: { tick: lavaTick }
});

GW.tile.addKind('LAVA_CRUST', {
	sprite: { ch: '~', fg: 'lavaForeColor', bg: 'dark_gray' }, priority: 91, layer: 'SURFACE',
	flags: 'T_BRIDGE',
	name: 'crusted lava', article: 'some',
	events: { tick: lavaCrustTick }
});

GW.tile.addKind('LAVA_CRUST_BREAKING', {
	sprite: { ch: '~', fg: 'lavaForeColor', bg: 'darkest_red' }, priority: 92,	layer: 'SURFACE',
	flags: 'T_BRIDGE',
	name: 'lava with a cracking crust', article: 'some',
	events: { tick: lavaBreakingTick }
});

GW.tile.addKind('LAVA_ERUPTING', {
	sprite: { ch: '!', fg: 'yellow', bg: 'red' }, priority: 91,
	name: 'wave of erupting lava', article: 'a',
	events: { tick: { radius: 1, tile: 'LAVA_ERUPTING', flags: 'DFF_NULL_SURFACE | DFF_SUBSEQ_ALWAYS', needs: 'LAVA_TILE', next: { tile: 'LAVA_ERUPTED' } }}
});

GW.tile.addKind('LAVA_ERUPTED', {
	sprite: { ch: '~', fg: 'lavaForeColor', bg: 'lavaBackColor' }, priority: 92,
	name: 'lava', article: 'some',
	events: { tick: { tile: 'LAVA_TILE', flags: 'DFF_SUPERPRIORITY | DFF_PROTECTED' } }
});




GW.message.addKind('MAP_WELCOME', 'Ωlight_blueΩErupt: §erupt§, Crust: §crust§, StartBreak: §start§, Break: §break§');

function makeMap(id=1) {
	// dig a map
	MAP = GW.make.map(50, 30);
	MAP.nullify();

	MAP.fill('WALL');
	MAP.cells.forRect(10, 0, 30, 30, (c, x, y) => MAP.setTile(x, y, 'FLOOR'));
	MAP.cells.forRect(10, 1, 30, 1, (c, x, y) => MAP.setTile(x, y, 'GOAL') );
	GW.map.addText(MAP, 22, 1, 'FINISH', 'green');
	MAP.cells.forRect(10, 28, 30, 1, (c, x, y) => MAP.setTile(x, y, 'START') );
	GW.map.addText(MAP, 23, 28, 'START', 'blue');

	// update the difficulty
	ERUPT_CHANCE = Math.max(5000, 30000 - (1000 * id));
	CRUST_CHANCE = Math.max(2, Math.floor(10 - id/2));
	BREAK_CHANCE = Math.min(90, Math.floor(60 + id));
  LAVA_START_BREAK = Math.min(90, Math.floor(20 + id*2));

	GW.message.add('MAP_WELCOME', {
    erupt: ERUPT_CHANCE, crust: CRUST_CHANCE, start: LAVA_START_BREAK, break: BREAK_CHANCE
  });

	let height = 3 + Math.floor(id / 2);
	let top = Math.floor( (30 - height) / 2 ) + 1;

	MAP.cells.forRect(10, top, 30, height, (c, x, y) => MAP.setTile(x, y, 'LAVA_TILE') );

	MAP.setFlags(0, GW.flags.cell.VISIBLE);
	MAP.id = id;
	MAP.locations.start = [25, 29];
	return MAP;
}



async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.drawText(10, y++, 'GoblinWerks Lava Hop Example', 'green');
	y++;
	y = buf.wrapText(5, y, 40, 'This example is all about crossing the lava field by walking/jumping over the crusted lava.', 'white');
	y++;
	buf.drawText(5, y, 'dir   ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.drawText(5, y, 'j     ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Jump over one cell in a direction you choose.', 'lighter_gray', null, 2);
	buf.drawText(5, y, 'space ', 'yellow');
	y = buf.wrapText(11, y, 32, ': Wait a short time.', 'white', null, 2);
	buf.drawText(5, y, '?', 'yellow');
	y = buf.wrapText(11, y, 32, ': Show this screen.', 'lighter_gray');

	buf.fillRect(4, 1, 42, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}

GW.commands.showHelp = showHelp;

GW.message.addKind('WELCOME', 'ΩyellowΩWelcome to Lava Hop!∆\nGet across the Lava field safely to advance.\nPress <?> for help.');

// start the environment
async function start() {

	const canvas = GW.ui.start({ width: 50, height: 36, div: 'game', messages: -5, cursor: true, flavor: true });
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest', 'j': jump,
		'x': startExplosion,
		'?': 'showHelp'
	});

	MAP = makeMap();
	GW.message.add('WELCOME');
	await GW.game.start({ player: PLAYER, map: MAP });
  console.log('DONE');
}

window.onload = start;
