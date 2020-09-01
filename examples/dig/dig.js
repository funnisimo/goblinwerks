
let canvas = null;
const startingXY = { x: 40, y: 28 };

GW.random.seed(12345);

const TILES = [
	GW.make.sprite('#', [50,50,50], [20,20,20]),
	GW.make.sprite('\u00b7', [30,30,30], [90,90,90]),
	GW.make.sprite('+', [100,40,40], [30,60,60]),
	GW.make.sprite('~', [0,80,100], [0,30,100]),	// LAKE
	GW.make.sprite('\u00b7', [0,80,100], [30,50,100]),	// LAKE_FLOOR
	GW.make.sprite('+', [0,80,100], [30,50,100]),	// LAKE_DOOR
];

GW.dig.installDigger('ROOM',     			GW.dig.rectangularRoom,  { width: [10,20], height: [5,10] });
GW.dig.installDigger('CROSS',         GW.dig.crossRoom,        { width: [3,12], height: [3,7], width2: [4,20], height2: [2,5] });
GW.dig.installDigger('SYMMETRICAL_CROSS', GW.dig.symmetricalCrossRoom,
											{ width: [4,8], height: [4,5], width2: [3,4], height2: [3,3] });
GW.dig.installDigger('SMALL_ROOM',    GW.dig.rectangularRoom,  { width: [3,6], height: [2,4] });
GW.dig.installDigger('LARGE_ROOM',    GW.dig.rectangularRoom,  { width: [25,40], height: [10,20] });
GW.dig.installDigger('HUGE_ROOM',     GW.dig.rectangularRoom,  { width: [50,76], height: [15,28] });
GW.dig.installDigger('SMALL_CIRCLE',  GW.dig.circularRoom,     { radius: [2,4] });
GW.dig.installDigger('LARGE_CIRCLE',  GW.dig.circularRoom,     { radius: [4,10] });
GW.dig.installDigger('BROGUE_CIRCLE', GW.dig.brogueCircularRoom,
											{ radius: [2,4], radius2: [4,10], altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
GW.dig.installDigger('COMPACT_CAVE', 	GW.dig.cavern,           { width: [ 3,12], height: [ 4, 8] });
GW.dig.installDigger('LARGE_NS_CAVE', GW.dig.cavern,           { width: [ 3,12], height: [15,27] });
GW.dig.installDigger('LARGE_EW_CAVE', GW.dig.cavern,           { width: [20,27], height: [ 4, 8] });
GW.dig.installDigger('BROGUE_CAVE',   GW.dig.choiceRoom,       { choices: ['COMPACT_CAVE', 'LARGE_NS_CAVE', 'LARGE_EW_CAVE'] });
GW.dig.installDigger('HUGE_CAVE', 		GW.dig.cavern,           { width: [50,77], height: [20,27] });
GW.dig.installDigger('BROGUE_ENTRANCE', GW.dig.entranceRoom,   { width: [8,20], height: [10, 5] });
GW.dig.installDigger('CHUNKY', 				GW.dig.chunkyRoom, 			 { count: [2,8] })

GW.dig.installDigger('PROFILE',   		GW.dig.choiceRoom,
										{ choices: {
											ROOM: 10,
											CROSS: 20,
											SYMMETRICAL_CROSS: 20,
											LARGE_ROOM: 5,
											SMALL_CIRCLE: 10,
											LARGE_CIRCLE: 5,
											BROGUE_CIRCLE: 5,
											CHUNKY: 10,
										} });


GW.dig.installDigger('FIRST_ROOM',   		GW.dig.choiceRoom,
										{ choices: {
											ROOM: 10,
											CROSS: 20,
											SYMMETRICAL_CROSS: 10,
											LARGE_ROOM: 5,
											HUGE_ROOM: 5,
											LARGE_CIRCLE: 5,
											BROGUE_CIRCLE: 5,
											BROGUE_CAVE: 5,
											HUGE_CAVE: 5,
											BROGUE_ENTRANCE: 5,
											CHUNKY: 10,
										} });

function handleClick(e) {
	startingXY.x = canvas.toX(e.clientX);
	startingXY.y = canvas.toY(e.clientY);
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

function drawMap() {
	// dig a map
	const SITE = GW.dig.startDig(80, 30);

	let doors = [ [startingXY.x, startingXY.y] ];
	let roomCount = 0;

	const start = startTimer();
	GW.dig.digRoom({ digger: 'FIRST_ROOM', doors, tries: 20, tile: 1, placeDoor: false });
	stopTimer('first room');

	let fails = 0;
	while(fails < 20) {
		startTimer();
		if (!GW.dig.digRoom({ digger: 'PROFILE', tries: 1, tile: 1, hallChance: 10 })) {
			++fails;
		}
		stopTimer('room #' + ++roomCount);
	}

	startTimer();
	GW.dig.addLoops(20, 5);
	stopTimer('loops');

	for(let i = 0; i < 5; ++i) {
		startTimer();
		GW.dig.digLake();
		stopTimer('lake #' + i);
	}

	GW.dig.removeDiagonalOpenings();
	GW.dig.finishDoors();

	time = start;
	stopTimer('DIG');

	SITE.grid.forEach( (v, i, j) => {
		const tile = TILES[v];
		if (tile) {
			canvas.plot(i, j, tile);
		}
		else {
			console.warn('missing tile ', v, i, j);
		}
	});

	canvas.draw();
}


// start the environment
function start() {
	canvas = new GW.types.Canvas(80, 30, 'game');
	game.onmousedown = handleClick;
	document.onkeydown = handleKey;

	canvas.plotText(10, 15, 'Click to draw map with starting location at click point.', [100,50,0]);
	canvas.plotText(10, 17, 'Press any key to redesign map at same starting point.', [100,50,0]);
	canvas.draw();
}

window.onload = start;
