
const startingXY = [40, 28];
const TILES = GW.tiles;


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
