
import * as GW from './index.js';


describe('GW.dungeon', () => {

  let map;

  beforeAll( () => {

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

  });

  beforeEach( () => {
    GW.random.seed(12345);
    map = GW.make.map(80, 30);
  });

  afterEach( () => {
    GW.dungeon.log = GW.utils.NOOP;
  });

  function tileAt(x, y) {
    return map.cell(x, y).ground;
  }

  function surfaceAt(x, y) {
    return map.cell(x, y).surface;
  }

  test('can randomly attach rooms', () => {
    GW.dungeon.start(map);

    let locs = [38, 28];
    let roomCount = 4;

    debugger;
    locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 'FLOOR' });

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', tries: 20, tile: 'FLOOR' });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // map.dump();

    expect(locs).toEqual([[36, 1], [35,10], [27,7], [-1,-1]]);
    expect(tileAt(38, 28)).toEqual('DOOR');  // starting door

    map.cells.forRect(35, 22, 17, 6, (c, i, j) => expect(tileAt(i, j)).toEqual('FLOOR'));

    expect(tileAt(52, 22)).toEqual('DOOR');
    expect(tileAt(47, 21)).toEqual('DOOR');
    expect(tileAt(45, 11)).toEqual('DOOR');
    expect(tileAt(44, 6)).toEqual('DOOR');

  });


  test('can chain five rooms', () => {
    GW.dungeon.start(map);

    let locs = [38, 28];
    let roomCount = 5;

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 'FLOOR' });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // map.dump();

    expect(locs).toEqual([[2,7], [9,13], [1,12], [-1,-1]]);
    expect(tileAt(38, 28)).toEqual('DOOR');

    map.cells.forRect(35, 22, 17, 6, (c, i, j) => expect(tileAt(i, j)).toEqual('FLOOR'));

    expect(tileAt(39, 21)).toEqual('DOOR');
    expect(tileAt(40, 11)).toEqual('DOOR');
    expect(tileAt(32, 8)).toEqual('DOOR');
    expect(tileAt(13, 10)).toEqual('DOOR');

  });

  test('adds loops', () => {

    GW.dungeon.start(map);

    let locs = [38, 28];
    let roomCount = 15;

    for(let i = 0; i < roomCount; ++i) {
  		const ok = GW.dungeon.digRoom({ digger: 'ROOM', locs, tile: 'FLOOR', width: 14, height: 10 });
  		if (!ok) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
      locs = null;
  	}

    // map.dump();

    expect(tileAt(23, 4)).toEqual(0);
    expect(tileAt(21, 21)).toEqual(0);

    GW.dungeon.addLoops(20, 5);

    // map.dump();

    expect(tileAt(23, 4)).toEqual('DOOR'); // added door
    expect(tileAt(21, 21)).toEqual('DOOR'); // added door

  });


  test('can add a lake and bridges', () => {
    GW.dungeon.start(map);

    map.fill('FLOOR');

    GW.dungeon.digLake();
    GW.dungeon.digLake();

    GW.dungeon.addBridges(20, 10);

    // map.dump();

    expect(tileAt(60, 18)).toEqual('LAKE');
    expect(surfaceAt(54, 18)).toEqual('BRIDGE');

  });

  test('no weird bridges', () => {
    GW.random.seed(1476405790);

    map.nullify();
  	GW.dungeon.start(map);

  	let roomCount = 0;

  	map.cells.forRect(2, 2, 76, 26, (c) => c.setTile('FLOOR'));
  	let lakeCount = GW.random.number(5);
  	for(let i = 0; i < lakeCount; ++i) {
  		GW.dungeon.digLake();
  	}

    // map.dump();

  	GW.dungeon.addBridges(40, 8);
  	GW.dungeon.finish();

    // map.dump();

    expect(tileAt(60, 15)).toEqual('LAKE');
    expect(surfaceAt(76, 15)).toEqual('BRIDGE');

  });



  // This test was from before the change to random.chance
  // test('no weird doors', () => {
  //   GW.random.seed(1498762992)
  //
  //   const startingXY = [40, 28];
  //
  //   map.nullify();
  // 	GW.dungeon.start(map);
  //
  // 	let loc = [startingXY[0], startingXY[1]];
  // 	let roomCount = 0;
  //
  // 	GW.dungeon.digRoom({ digger: 'FIRST_ROOM', loc, tries: 20, placeDoor: false });
  //
  // 	let fails = 0;
  // 	while(fails < 20) {
  // 		if (!GW.dungeon.digRoom({ digger: 'PROFILE', tries: 1, hallChance: 10 })) {
  // 			++fails;
  // 		}
  // 	}
  //
  // 	GW.dungeon.addLoops(20, 5);
  //
  // 	let lakeCount = GW.random.number(5);
  // 	for(let i = 0; i < lakeCount; ++i) {
  // 		GW.dungeon.digLake();
  // 	}
  //
  // 	GW.dungeon.addBridges(40, 8);
  //
  // 	if (!GW.dungeon.addStairs(startingXY[0], startingXY[1], -1, -1)) {
  // 		console.error('Failed to place stairs.');
  // 		return drawMap(++attempt);
  // 	}
  //
  // 	GW.dungeon.finish();
  //
  //   map.dump();
  //
  //   expect(tileAt(23, 19)).toEqual(1);  // FLOOR (not DOOR)
  //   expect(tileAt(27, 22)).toEqual(1);  // ...
  //   expect(tileAt(44, 24)).toEqual(1);  // ...
  //   expect(tileAt(63, 12)).toEqual(1);  // ...
  //   expect(tileAt(67, 21)).toEqual(1);  // ...
  //
  // });


  test('Use this to visualize maps built in dungeon example', () => {
    GW.random.seed(1297684405)

    // GW.dungeon.log = console.log;

    const startingXY = [39, 28];

    map.nullify();
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

  	if (!GW.dungeon.addStairs({ up: startingXY })) {
  		console.error('Failed to place stairs.');
  	}

  	GW.dungeon.finish();

    // map.dump();

    // expect(tileAt(31, 7)).toEqual(3);  // BRIDGE
    // expect(tileAt(32, 7)).not.toEqual(3);  // BRIDGE

  });

});
