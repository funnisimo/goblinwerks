
const GW = require('../dist/gw.cjs');


describe('GW.dungeon', () => {

  let map;

  beforeAll( () => {
    GW.digger.install('ROOM',     			GW.digger.rectangularRoom,  { width: [10,20], height: [5,10] });
    GW.digger.install('CROSS',         GW.digger.crossRoom,        { width: [3,12], height: [3,7], width2: [4,20], height2: [2,5] });
    GW.digger.install('SYMMETRICAL_CROSS', GW.digger.symmetricalCrossRoom,
    											{ width: [4,8], height: [4,5], width2: [3,4], height2: [3,3] });
    GW.digger.install('SMALL_ROOM',    GW.digger.rectangularRoom,  { width: [3,6], height: [2,4] });
    GW.digger.install('LARGE_ROOM',    GW.digger.rectangularRoom,  { width: [25,40], height: [10,20] });
    GW.digger.install('HUGE_ROOM',     GW.digger.rectangularRoom,  { width: [50,76], height: [15,28] });
    GW.digger.install('SMALL_CIRCLE',  GW.digger.circularRoom,     { radius: [2,4] });
    GW.digger.install('LARGE_CIRCLE',  GW.digger.circularRoom,     { radius: [4,10] });
    GW.digger.install('BROGUE_CIRCLE', GW.digger.brogueCircularRoom,
    											{ radius: [2,4], radius2: [4,10], altChance: 5, ringMinWidth: 3, holeMinSize: 3, holeChance: 50 });
    GW.digger.install('COMPACT_CAVE', 	GW.digger.cavern,           { width: [ 3,12], height: [ 4, 8] });
    GW.digger.install('LARGE_NS_CAVE', GW.digger.cavern,           { width: [ 3,12], height: [15,27] });
    GW.digger.install('LARGE_EW_CAVE', GW.digger.cavern,           { width: [20,27], height: [ 4, 8] });
    GW.digger.install('BROGUE_CAVE',   GW.digger.choiceRoom,       { choices: ['COMPACT_CAVE', 'LARGE_NS_CAVE', 'LARGE_EW_CAVE'] });
    GW.digger.install('HUGE_CAVE', 		GW.digger.cavern,           { width: [50,77], height: [20,27] });
    GW.digger.install('BROGUE_ENTRANCE', GW.digger.entranceRoom,   { width: [8,20], height: [10, 5] });
    GW.digger.install('CHUNKY', 				GW.digger.chunkyRoom, 			 { count: [2,8] })

    GW.digger.install('PROFILE',   		GW.digger.choiceRoom,
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


    GW.digger.install('FIRST_ROOM',   		GW.digger.choiceRoom,
    										{ choices: {
    											ROOM: 5,
    											CROSS: 5,
    											SYMMETRICAL_CROSS: 5,
    											LARGE_ROOM: 5,
    											HUGE_ROOM: 5,
    											LARGE_CIRCLE: 5,
    											BROGUE_CIRCLE: 5,
    											BROGUE_CAVE: 30,	// These are harder to match
    											HUGE_CAVE: 30,		// ...
    											BROGUE_ENTRANCE: 5,
    											CHUNKY: 5,
    										} });
  });

  beforeEach( () => {
    GW.random.seed(12345);
    map = GW.make.map(80, 30);
  });

  function tileAt(x, y) {
    return map.cell(x, y).tile;
  }

  test('can randomly attach rooms', () => {
    GW.dungeon.start(map);

    let locs = [38, 28];
    let roomCount = 4;

    locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 1 });

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', tries: 20, tile: 1 });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // map.dump();

    expect(locs).toEqual([[75,8], [60,18], [-1,-1], [76,9]]);
    expect(tileAt(70, 15)).toEqual(1);

    map.cells.forRect(36, 22, 14, 6, (c, i, j) => expect(tileAt(i, j)).toEqual(1));

    expect(tileAt(47, 21)).toEqual(2);
    expect(tileAt(35, 22)).toEqual(2);
    expect(tileAt(45, 11)).toEqual(2);
    expect(tileAt(59, 9)).toEqual(2);

  });


  test('can chain five rooms', () => {
    GW.dungeon.start(map);

    let locs = [38, 28];
    let roomCount = 5;

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 1 });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // map.dump();

    expect(locs).toEqual([[-1,-1], [63,22], [56,17], [74,21]]);
    expect(tileAt(70, 15)).toEqual(1);

    map.cells.forRect(36, 22, 14, 6, (c, i, j) => expect(tileAt(i, j)).toEqual(1));

    expect(tileAt(49, 21)).toEqual(2);
    expect(tileAt(44, 11)).toEqual(2);
    expect(tileAt(58, 10)).toEqual(2);
    expect(tileAt(59, 16)).toEqual(2);

  });

  test('adds loops', () => {

    GW.dungeon.start(map);

    let locs = [38, 28];
    let roomCount = 5;

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 1 });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // map.dump();

    expect(tileAt(56, 18)).toEqual(0);
    expect(tileAt(69, 16)).toEqual(0);

    GW.dungeon.addLoops(20, 5);

    // map.dump();

    expect(tileAt(56, 18)).toEqual(2); // added door
    expect(tileAt(69, 16)).toEqual(2); // added door

  });


  test('can add a lake and bridges', () => {
    GW.dungeon.start(map);

    map.fill(1, 0);
    GW.dungeon.digLake();
    GW.dungeon.digLake();

    GW.dungeon.addBridges(20, 10);

    // map.dump();

    expect(tileAt(60, 18)).toEqual(7);  // LAKE
    expect(tileAt(54, 18)).toEqual(3);  // BRIDGE

  });

  test('no weird bridges', () => {
    GW.random.seed(1476405790);

    map.clear();
  	GW.dungeon.start(map);

  	let roomCount = 0;

  	map.cells.forRect(2, 2, 76, 26, (c) => c.setTile(1));
  	let lakeCount = GW.random.number(5);
  	for(let i = 0; i < lakeCount; ++i) {
  		GW.dungeon.digLake();
  	}

    // map.dump();

  	GW.dungeon.addBridges(40, 8);
  	GW.dungeon.finish();

    // map.dump();

    expect(tileAt(60, 15)).toEqual(7);  // LAKE
    expect(tileAt(76, 15)).toEqual(3);  // BRIDGE

  });



  test('no weird doors', () => {
    GW.random.seed(1498762992)

    const startingXY = [40, 28];

    map.clear();
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

  	if (!GW.dungeon.addStairs(startingXY[0], startingXY[1], -1, -1)) {
  		console.error('Failed to place stairs.');
  		return drawMap(++attempt);
  	}

  	GW.dungeon.finish();

    map.dump();

    expect(tileAt(23, 19)).toEqual(1);  // FLOOR (not DOOR)
    expect(tileAt(27, 22)).toEqual(1);  // ...
    expect(tileAt(44, 24)).toEqual(1);  // ...
    expect(tileAt(63, 12)).toEqual(1);  // ...
    expect(tileAt(67, 21)).toEqual(1);  // ...

  });


  test('no weird bridges', () => {
    GW.random.seed(134349164)

    const startingXY = [38, 22];

    map.clear();
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

  	if (!GW.dungeon.addStairs(startingXY[0], startingXY[1], -1, -1)) {
  		console.error('Failed to place stairs.');
  		return drawMap(++attempt);
  	}

  	GW.dungeon.finish();

    // map.dump();

    expect(tileAt(31, 7)).toEqual(3);  // BRIDGE
    expect(tileAt(32, 7)).not.toEqual(3);  // BRIDGE

  });

});
