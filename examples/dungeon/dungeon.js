
let canvas = null;
let MAP = null;
const startingXY = [40, 28];

GW.random.seed(12345);

const TILES = GW.tiles;

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

function handleClick(e) {
	startingXY[0] = canvas.toX(e.clientX);
	startingXY[1] = canvas.toY(e.clientY);
	drawMap();
}

function handleKey(e) {
	if (e.key == 'Shift') return;
	drawMap();
}

let time = 0;

function startTimer() {
	time = performance.now();
	return time;
}

function stopTimer(text) {
	const now = performance.now();
	diff = now - time;
	console.log(text, diff);
	return diff;
}

function drawMap(attempt=0) {
	if (attempt > 20) {
		console.error('Failed to build map!');
		return false;
	}
	const seed = GW.random._v - 1;

	// dig a map
	MAP.clear();
	GW.dungeon.start(MAP);

	let loc = [startingXY[0], startingXY[1]];
	let roomCount = 0;

	const start = startTimer();
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

	if (!GW.dungeon.addStairs(startingXY[0], startingXY[1], -1, -1)) {
		console.error('Failed to place stairs.');
		return drawMap(++attempt);
	}

	GW.dungeon.finish();

	stopTimer('DIG');

	GW.viewport.draw(canvas.buffer, MAP);
	console.log('MAP SEED = ', seed);
}


// start the environment
function start() {
	MAP = GW.make.map(80, 30);
	canvas = GW.ui.start({ width: 80, height: 30, div: 'game', io: false });
	game.onmousedown = handleClick;
	document.onkeydown = handleKey;

	canvas.buffer.plotText(10, 15, 'Click to draw map with starting location at click point.', [100,50,0]);
	canvas.buffer.plotText(10, 17, 'Press any key to redesign the map at same starting point.', [100,50,0]);
}

window.onload = start;
