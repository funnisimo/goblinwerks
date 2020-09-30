
const GW = require('../dist/gw.cjs');
const UTILS = require('../test/utils.js');

describe('tileEvent', () => {

  let map;
  let grid;
  let feat;
  let ctx;

  const LAKE = 7;
  let ROUGH_WATER;
  let WAVE;

  beforeAll( () => {
    ROUGH_WATER = GW.tile.install('ROUGH_WATER', 'R', 'blue', 'green', 70,	0,
      'T_DEEP_WATER',
      'water', 'you see water.', { tick: { tile: LAKE, flags: 'DFF_SUPERPRIORITY | DFF_PROTECTED' } });
    WAVE = GW.tile.install('WAVE', 'W', 'white', 'blue', 60,	0,
      'T_DEEP_WATER',
      'wave crest', 'you see a wave of water.', { tick: { radius: 1, tile: 'WAVE', flags: 'DFF_CLEAR_CELL | DFF_SUBSEQ_ALWAYS', needs: LAKE, next: { tile: ROUGH_WATER } }});
  });

  afterAll( () => {
    if (ROUGH_WATER) {
      delete GW.tiles[ROUGH_WATER];
      ROUGH_WATER = 0;
    }
    if (WAVE) {
      delete GW.tiles[WAVE];
      WAVE = 0;
    }
  });

  beforeEach( () => {
    map = GW.make.map(20, 20, { tile: 'FLOOR', boundary: 'WALL' });
    ctx = { map, x: 10, y: 10 };
    grid = null;
  });

  afterEach( () => {
    if (grid) GW.grid.free(grid);
    grid = null;
    GW.tileEvent.debug = GW.utils.NOOP;
  });

  function countTile(map, tile) {
    if (typeof tile === 'string') {
      tile = GW.tile.withName(tile).id;
    }
    let count = 0;
    map.forEach( (c) => {
      if (c.hasTile(tile)) {
        ++count;
      }
    });
    return count;
  }


  // COMPUTE SPAWN MAP

  test('can compute a spawn map', () => {
    grid = GW.grid.alloc(20, 20);

    // only a single tile
    feat = GW.make.tileEvent({ tile: 6 });
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    expect(grid.count(1)).toEqual(1);
    expect(grid.count(0)).toEqual(20*20 - 1);
    expect(grid[10][10]).toEqual(1);

    // tile and neighbors
    feat = GW.make.tileEvent({ tile: 6, spread: 100, decrement: 100 });
    grid.fill(0);
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    expect(grid.count(0)).toEqual(20*20 - 5);
    expect(grid[10][10]).toEqual(1);
    grid.eachNeighbor(10, 10, (v) => expect(v).toEqual(2), true);

    // 2 levels
    feat = GW.make.tileEvent({ tile: 6, spread: 200, decrement: 100 });
    grid.fill(0);
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    expect(grid.count(0)).toEqual(20*20 - 1 - 4 - 8);
    expect(grid[10][10]).toEqual(1);
    grid.eachNeighbor(10, 10, (v) => expect(v).toEqual(2), true);
    expect(grid.count(3)).toEqual(8);

  });

  // { spread: 50 }
  test('{ spread: 50 }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, spread: 50 });
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(12);
    expect(grid[10][10]).toEqual(1);
    expect(grid[9][5]).toEqual(9);
    expect(grid[8][11]).toEqual(0);
  });

  // { spread: 75, matchTile: 2 }
  test('{ spread: 75, matchTile: 2 }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, spread: 50, matchTile: 2 });
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(0);  // There are no doors!

    map.setTile(9, 10, 2);
    map.setTile(11, 10, 2);
    map.setTile(10, 9, 2);
    map.setTile(10, 11, 2);

    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(2);  // match some doors

  });


  // { spread: 50, decrement: 10 }
  test('{ spread: 50, decrement: 10 }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, spread: 50, decrement: 10 });
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(7);
    expect(grid[10][10]).toEqual(1);
    expect(grid[9][5]).toEqual(0);
    expect(grid[8][11]).toEqual(6);
  });


  // DFF_SPREAD_CIRCLE
  test('{ spread: 50, decrement: 10, spread circle }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, spread: 90, decrement: 10, flags: 'DFF_SPREAD_CIRCLE' });

    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(61);
    grid.forCircle(10, 10, 4, (v) => expect(v).toEqual(1) );
  });

  test.todo('Add some walls and test that circle does not pass through them.');

  // { radius: 3 }
  test('{ radius: 3 }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, radius: 3 });
    // console.log(feat);
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(37);
    expect(grid[10][10]).toEqual(1);
    expect(grid[8][11]).toEqual(1);
  });

  // { radius: 3, spread: 75 }
  test('{ radius: 3, spread: 75 }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, radius: 3, spread: 75 });
    // console.log(feat);
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(24);
    expect(grid[10][10]).toEqual(1);
    expect(grid[11][10]).toEqual(0);
    expect(grid[12][10]).toEqual(1);
  });

  // { radius: 3, spread: 75, decrement: 20 }
  test('{ radius: 3, spread: 75, decrement: 20 }', () => {
    GW.random.seed(12345);
    grid = GW.grid.alloc(20, 20);
    feat = GW.make.tileEvent({ tile: 6, radius: 3, spread: 75, decrement: 20 });
    // console.log(feat);
    GW.tileEvent.computeSpawnMap(feat, grid, ctx);
    // grid.dump();
    expect(grid.count( (v) => !!v )).toEqual(9);
    expect(grid[10][10]).toEqual(1);
    expect(grid[11][10]).toEqual(0);
    expect(grid[12][10]).toEqual(1);
  });

  // { match: 2, radius: 1 }
  // { match: 1, radius: 1 }
  // { match: [0,1], radius: 1 }
  // { match: fn, radius: 3 }
  // { radius: 5, decrement: 20, match: [0,1] }


  // SPAWN TILE

  test('will fill a map with a spawn map', async () => {
    grid = GW.grid.alloc(20, 20);
    grid.fillRect(5, 5, 3, 3, 1);
    const feat = GW.make.tileEvent({ tile: 6 });

    map.forRect(5, 5, 3, 3, (cell) => expect(cell.hasTile(6)).toBeFalsy() );
    await GW.tileEvent.spawnTiles(feat, grid, { map }, GW.tiles[6]);
    map.forRect(5, 5, 3, 3, (cell) => {
      expect(cell.hasTile(6)).toBeTruthy();
      expect(cell.mechFlags & GW.flags.cellMech.EVENT_FIRED_THIS_TURN).toBeTruthy();
    });
  });


  test('will skip tiles that are event protected', async () => {
    grid = GW.grid.alloc(20, 20);
    grid.fillRect(5, 5, 3, 3, 1);

    map.forRect(5, 5, 3, 3, (cell) => expect(cell.hasTile(6)).toBeFalsy() );

    map.setCellFlags(5, 5, 0, GW.flags.cellMech.EVENT_PROTECTED);
    map.setCellFlags(6, 5, 0, GW.flags.cellMech.EVENT_PROTECTED);
    map.setCellFlags(7, 5, 0, GW.flags.cellMech.EVENT_PROTECTED);

    const feat = GW.make.tileEvent({ tile: 6 });

    await GW.tileEvent.spawnTiles(feat, grid, { map }, GW.tiles[6]);
    map.forRect(5, 5, 3, 3, (cell, x, y) => {
      if (y != 5) {
        expect(cell.hasTile(6)).toBeTruthy();
        expect(cell.mechFlags & GW.flags.cellMech.EVENT_FIRED_THIS_TURN).toBeTruthy();
        expect(cell.mechFlags & GW.flags.cellMech.EVENT_PROTECTED).toBeFalsy();
      }
      else {
        expect(cell.hasTile(6)).toBeFalsy();
        expect(cell.mechFlags & GW.flags.cellMech.EVENT_FIRED_THIS_TURN).toBeFalsy();
        expect(cell.mechFlags & GW.flags.cellMech.EVENT_PROTECTED).toBeTruthy();
      }
    });
  });


  // SPAWN

  test('will spawn into map', async () => {
    feat = GW.make.tileEvent({ tile: 6, spread: 200, decrement: 100 });
    await GW.tileEvent.spawn(feat, { map, x: 5, y: 5 });
    expect(map.hasTile(5, 5, 6)).toBeTruthy();
    map.eachNeighbor(5, 5, (c) => expect(c.hasTile(6)).toBeTruthy(), true);
  });

  // fn
  test('fn', async () => {
    feat = jest.fn();
    ctx = 'ctx';
    await UTILS.alwaysAsync( () => GW.tileEvent.spawn(feat, ctx) );
    expect(feat).toHaveBeenCalledWith(ctx);
    // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeFalsy(); // You have to set it yourself
    expect(feat).toHaveBeenCalledTimes(1000);
  });

  // { fn }
  test('{ fn }', async () => {
    feat = { fn: jest.fn() };
    await UTILS.alwaysAsync( async () => {
      await GW.tileEvent.spawn(feat, ctx);
      // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeTruthy();
    });
    expect(feat.fn).toHaveBeenCalledWith(10, 10, ctx);
    expect(feat.fn).toHaveBeenCalledTimes(1000);
  });

  // { fn: ..., always fire }
  test('{ fn, always fire }', async () => {
    const featFn = jest.fn();
    const feat = GW.make.tileEvent({ fn: featFn, chance: 50, flags: 'DFF_ALWAYS_FIRE' });

    await UTILS.alwaysAsync( async () => {
      await GW.tileEvent.spawn(feat, ctx);
      // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeTruthy();
    });
    expect(featFn).toHaveBeenCalledTimes(1000);
  });

  // { fn: ..., do not mark }
  test('{ fn, do not mark }', async () => {
    const featFn = jest.fn();
    const feat = GW.make.tileEvent({ fn: featFn, chance: 50, flags: 'DFF_NO_MARK_FIRED' });

    await UTILS.alwaysAsync( async () => {
      await GW.tileEvent.spawn(feat, ctx);
      // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeFalsy();
    });
    expect(featFn).toHaveBeenCalledTimes(1000);
  });

  // { tile: 6 }
  test('{ tile: 6 }', async () => {
    const feat = GW.make.tileEvent({ tile: 6 });
    await GW.tileEvent.spawn(feat, ctx);
    expect(map.hasTile(10, 10, 6)).toBeTruthy();
    expect(map.hasCellFlag(10, 10, GW.flags.cell.NEEDS_REDRAW)).toBeTruthy();
    expect(map.hasCellFlag(10, 10, GW.flags.cell.TILE_CHANGED)).toBeTruthy();
    // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeTruthy();
  });

  // { item: 'BOX' }
  test('{ item: "BOX" }', async () => {

    GW.item.installKind('BOX', {
    	name: 'box',
    	description: 'a large wooden box',
    	sprite: { ch: '\u2612', fg: 'light_brown' },
    	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, IK_BLOCKS_MOVE',
    	stats: { health: 10 }
    });

    expect(GW.itemKinds.BOX).toBeDefined();
    const feat = GW.make.tileEvent({ item: 'BOX' });
    expect(feat.item).toEqual('BOX');

    expect(map.itemAt(10, 10)).toBeNull();
    expect(map.hasTile(10, 10, 1)).toBeTruthy();

    await GW.tileEvent.spawn(feat, ctx);
    expect(map.hasTile(10, 10, 1)).toBeTruthy();
    expect(map.itemAt(10, 10)).not.toBeNull();
    expect(map.hasCellFlag(10, 10, GW.flags.cell.NEEDS_REDRAW)).toBeTruthy();
    expect(map.hasCellFlag(10, 10, GW.flags.cell.TILE_CHANGED)).toBeTruthy();
    // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeTruthy();
  });

  // { tile: 'WALL' }
  test('{ tile: WALL }', async () => {
    const feat = GW.make.tileEvent({ tile: 'WALL' });
    expect(feat.tile).toEqual('WALL');
    await GW.tileEvent.spawn(feat, ctx);
    expect(feat.tile).toEqual(6);
    expect(map.hasTile(10, 10, 6)).toBeTruthy();
    expect(map.hasCellFlag(10, 10, GW.flags.cell.NEEDS_REDRAW)).toBeTruthy();
    expect(map.hasCellFlag(10, 10, GW.flags.cell.TILE_CHANGED)).toBeTruthy();
    // expect(map.hasCellMechFlag(10, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN)).toBeTruthy();
  });

  // { tile: 8, next: 'OTHER' }


  test('can clear extra tiles from the cell', () => {
    const feat = GW.make.tileEvent({ flags: 'DFF_CLEAR_CELL' });

    const cell = map.cell(5, 5);
    cell.setTile(3);
    expect(cell.surface).toEqual(3);
    expect(cell.ground).toEqual(1);

    GW.tileEvent.spawn(feat, { map, x: 5, y: 5 });
    expect(cell.ground).toEqual(1);
    expect(cell.surface).toEqual(0);

  });


  test('can do waves', async () => {

    map.fill(LAKE);
    for(let i = 0; i < map.width; ++i) {
      map.setTile(i, 8, 'BRIDGE');
    }
    map.setTile(10, 10, WAVE);

    expect(countTile(map, 'BRIDGE')).toEqual(map.width);

    await map.tick();
    // map.dump();
    expect(map.hasTile(10, 10, ROUGH_WATER)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(1);
    expect(countTile(map, WAVE)).toEqual(4);

    expect(countTile(map, 'BRIDGE')).toEqual(map.width);

    await map.tick();
    // map.dump();
    expect(map.hasTile(10, 10, LAKE)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(4);
    expect(countTile(map, WAVE)).toEqual(8);

    expect(countTile(map, 'BRIDGE')).toEqual(map.width - 1);

    await map.tick();
    // map.dump();
    expect(map.hasTile(10, 10, LAKE)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(8);
    expect(countTile(map, WAVE)).toEqual(12);

    expect(countTile(map, 'BRIDGE')).toEqual(map.width - 3);

    await map.tick();
    // map.dump();
    expect(map.hasTile(10, 10, LAKE)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(12);
    expect(countTile(map, WAVE)).toEqual(16);

    expect(countTile(map, 'BRIDGE')).toEqual(map.width - 5);

    for(let i = 0; i < 5; ++i) {
      await map.tick();
    }

    // map.dump();
    await map.tick();
    // map.dump();

    expect(map.hasTile(19,10, ROUGH_WATER)).toBeTruthy();

    // expect(countTile(map, WAVE)).toEqual(0);

  });


  test('can do waves - in turbulent waters', async () => {

    map.fill(LAKE);
    map.setTile(10, 10, WAVE);

    await map.tick();
    // map.dump();
    expect(map.hasTile(10, 10, ROUGH_WATER)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(1);
    expect(countTile(map, WAVE)).toEqual(4);

    // begin map.tick
    map.forEach( (c) => c.mechFlags &= ~(GW.flags.cellMech.EVENT_FIRED_THIS_TURN | GW.flags.cellMech.EVENT_PROTECTED));
		// map.forEach( (c) => c.mechFlags &= ~GW.flags.cellMech.EVENT_PROTECTED);

    map.setCellFlags(8, 10, GW.flags.cellMech.EVENT_FIRED_THIS_TURN); // fake another event was fired (should still overwrite)

		for(let x = 0; x < map.width; ++x) {
			for(let y = 0; y < map.height; ++y) {
				const cell = map.cells[x][y];
				await cell.fireEvent('tick', { map, x, y, cell });
			}
		}
    // end map.tick

    // map.dump();
    expect(map.hasTile(10, 10, LAKE)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(4);
    expect(countTile(map, WAVE)).toEqual(8);


    await map.tick();
    // map.dump();
    expect(map.hasTile(10, 10, LAKE)).toBeTruthy();
    expect(countTile(map, ROUGH_WATER)).toEqual(8);
    expect(countTile(map, WAVE)).toEqual(12);

  });

  // { tile: 2, line }
  test('{ tile: 2, line }', async () => {
    GW.random.seed(23456);
    const feat = GW.make.tileEvent({ tile: 2, flags: 'DFF_SPREAD_LINE', spread: 200, decrement: 50 });

    await GW.tileEvent.spawn(feat, ctx);

    // map.dump();

    expect(map.hasTile(10, 10, 2)).toBeTruthy();
    expect(map.hasTile(9, 10, 2)).toBeTruthy();
    expect(map.hasTile(8, 10, 2)).toBeTruthy();
    expect(map.hasTile(7, 10, 2)).toBeTruthy();

    expect(map.cells.count( (c) => c.hasTile(2) )).toEqual(4);
  });

});
