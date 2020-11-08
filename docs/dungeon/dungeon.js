
let canvas = null;
const startingXY = [40, 28];

GW.random.seed(12345);

const TILES = GW.tiles;

const PLAYER = GW.make.player({
		sprite: GW.make.sprite('@', 'white'),
		name: 'you',
		speed: 120
});

// GW.cell.debug = console.log;
// GW.tileEvent.debug = console.log;


GW.digger.install('ROOM',     			GW.digger.rectangularRoom,  { width: 20, height: 10 });
GW.digger.install('CROSS',         GW.digger.crossRoom,        { width: 12, height: 7 });
GW.digger.install('SYMMETRICAL_CROSS', GW.digger.symmetricalCrossRoom, { width: 8, height: 5 });
GW.digger.install('SMALL_ROOM',    GW.digger.rectangularRoom,  { width: 6, height: 4 });
GW.digger.install('LARGE_ROOM',    GW.digger.rectangularRoom,  { width: 40, height: 20 });
GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: 76, height: 28 });
GW.digger.install('SMALL_CIRCLE',  GW.digger.circularRoom,     { width: 6, height: 6 });
GW.digger.install('LARGE_CIRCLE',  GW.digger.circularRoom,     { width: 10, height: 10 });
GW.digger.install('BROGUE_DONUT', GW.digger.brogueDonut,
											{ width: 10, height: 10, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
GW.digger.install('COMPACT_CAVE', 	GW.digger.cavern,           { width: 12, height: 8 });
GW.digger.install('LARGE_NS_CAVE', GW.digger.cavern,           { width: 12, height: 27 });
GW.digger.install('LARGE_EW_CAVE', GW.digger.cavern,           { width: 27, height: 8 });
GW.digger.install('BROGUE_CAVE',   GW.digger.choiceRoom,       { choices: ['COMPACT_CAVE', 'LARGE_NS_CAVE', 'LARGE_EW_CAVE'] });
GW.digger.install('HUGE_CAVE', 		GW.digger.cavern,           { width: 77, height: 27 });
GW.digger.install('BROGUE_ENTRANCE', GW.digger.entranceRoom,   { width: 20, height: 10 });
GW.digger.install('CHUNKY', 				GW.digger.chunkyRoom, 			 { width: 10, height: 10 })

GW.digger.install('PROFILE',   		GW.digger.choiceRoom,
										{ choices: {
											ROOM: 10,
											CROSS: 20,
											SYMMETRICAL_CROSS: 20,
											LARGE_ROOM: 5,
											SMALL_CIRCLE: 10,
											LARGE_CIRCLE: 5,
											BROGUE_DONUT: 5,
											CHUNKY: 10,
										} });


GW.digger.install('FIRST_ROOM',   		GW.digger.choiceRoom,
										{ choices: {
											ROOM: 5,
											CROSS: 5,
											SYMMETRICAL_CROSS: 5,
											LARGE_ROOM: 5,
											HUGE_ROOM: 5,
											LARGE_CIRCLE: 5,
											BROGUE_DONUT: 5,
											BROGUE_CAVE: 30,	// These are harder to match
											HUGE_CAVE: 30,		// ...
											BROGUE_ENTRANCE: 5,
											CHUNKY: 5,
										} });


let time = 0;

function designNewLevel(id=0, attempt=0) {
	if (attempt > 20) {
		console.error('Failed to build map!');
		return false;
	}
	const seed = GW.random._v - 1;

	// dig a map
	const map = GW.make.map(80, 30);
	map.id = id;
	GW.dungeon.start(map);

	let loc = [startingXY[0], startingXY[1]];
	let roomCount = 0;

	GW.dungeon.digRoom({ digger: 'FIRST_ROOM', loc, tries: 20, placeDoor: false });

	let fails = 0;
	while(fails < 20) {
		if (!GW.dungeon.digRoom({ digger: 'PROFILE', tries: 1, hallChance: 10 })) {
			++fails;
		}
	}

	GW.dungeon.addLoops(20, 5);

	let lakeCount = GW.random.number(5);
	for(let i = 0; i < lakeCount; ++i) {
		GW.dungeon.digLake();
	}

	GW.dungeon.addBridges(40, 8);

	let stairOpts = { start: 'up' };
	if (id == 0) {
		stairOpts.start = startingXY;
		stairOpts.up = false;
	}
	else {
		stairOpts.up = GW.data.map.locations.down;
	}

	if (!GW.dungeon.addStairs(stairOpts)) {
		console.error('Failed to place stairs.');
		return drawMap(++attempt);
	}

	GW.dungeon.finish();

	console.log('MAP SEED = ', seed);
	return map;
}


async function showHelp() {
	const buf = GW.ui.startDialog();

	let y = 2;
	buf.plotText(20, y++, '%FGoblinWerks Dungeon Dig Example', 'green');
	y++;
	y = buf.wrapText(15, y, 50, 'Explore the caves.');
	y++;
	buf.plotText(15, y, '%Fdir   ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Pressing an arrow key moves the player in that direction.', 'white', null, 2);
	buf.plotText(15, y, '%Fspace ', 'yellow');
	y = buf.wrapText(21, y, 42, ': Wait a short time.', 'white', null, 2);
	buf.plotText(15, y, '%F?', 'yellow');
	y = buf.wrapText(21, y, 42, ': Show this screen.', 'lighter_gray');

	buf.fillRect(14, 1, 52, y, null, null, 'black' );

	GW.ui.draw();
	await GW.io.nextKeyPress(-1);
	GW.ui.finishDialog();
}


async function forceStairs(ev) {
	const isUp = (ev.key == '<');

	const mapId = GW.data.map.id + (isUp ? 1 : -1);

	if (isUp && GW.data.map.id == 0) {
		GW.message.add(GW.colors.teal, 'At start of dungeon.');
		return false;
	}
	else if (isUp) {
		GW.message.add('You ascend to level %d.', Math.abs(mapId));
	}
	else {
		GW.message.add('You descend to level %d.', Math.abs(mapId));
	}

	const newMap = await GW.game.getMap(mapId);

  GW.game.startMap(newMap, isUp ? 'down' : 'up');

  GW.ui.requestUpdate();
  PLAYER.endTurn();
  return true;
}

// start the environment
function start() {
	const canvas = GW.ui.start({ width: 80, height: 36, div: 'game', messages: -5, cursor: true, flavor: true });
	GW.io.setKeymap({
		dir: 'movePlayer', space: 'rest',
		'>': forceStairs, '<': forceStairs,
		'?': showHelp
	});

	GW.message.add('%FWelcome to the Dungeon!\n%FSomewhere at the bottom of this labrynth is a portal that will take you back to your home town.  Find it or perish!\n%FPress <?> for help.', 'yellow', 'purple', null);
	GW.game.start({ player: PLAYER, buildMap: designNewLevel, fov: true });
}

window.onload = start;
