
const GW = require('../dist/gw.cjs');


describe('GW.dungeon', () => {

  beforeAll( () => {
    GW.dungeon.installDigger('ROOM',     GW.dungeon.rectangularRoom,  { width: [10,20], height: [5,10] });
  });

  afterEach( () => {
    GW.dungeon.finishDig();
  });

  test('one big room', () => {
    const SITE = GW.dungeon.startDig(10, 10);
  	GW.dungeon.rectangularRoom({ width: SITE.width - 2, height: SITE.height - 2 }, SITE.grid);

    SITE.grid.forEach( (v, i, j) => {
      if (SITE.grid.isBoundaryXY(i, j)) {
        expect(v).toEqual(0);
      }
      else {
        expect(v).toEqual(1);
      }
    });
  });


  test('can randomly attach rooms', () => {
    GW.random.seed(12345);
    const SITE = GW.dungeon.startDig(80, 30);

    let locs = [38, 28];
    let roomCount = 4;

    locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 1 });

    debugger;
    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', tries: 20, tile: 1 });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // SITE.grid.dump( (v) => GW.tiles[v].sprite.ch );

    expect(locs).toEqual([[75,8], [60,18], [-1,-1], [76,9]]);
    expect(SITE.grid[70][15]).toEqual(1);

    SITE.grid.forRect(36, 22, 14, 6, (v) => expect(v).toEqual(1));

    expect(SITE.grid[47][21]).toEqual(2);
    expect(SITE.grid[35][22]).toEqual(2);
    expect(SITE.grid[45][11]).toEqual(2);
    expect(SITE.grid[59][9]).toEqual(2);

  });


  test('can chain five rooms', () => {
    GW.random.seed(12345);
    const SITE = GW.dungeon.startDig(80, 30);

    let locs = [38, 28];
    let roomCount = 5;

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 1 });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // GW.grid.dump(SITE.grid);

    expect(locs).toEqual([[-1,-1], [63,22], [56,17], [74,21]]);
    expect(SITE.grid[70][15]).toEqual(1);

    SITE.grid.forRect(36, 22, 14, 6, (v) => expect(v).toEqual(1));

    expect(SITE.grid[49][21]).toEqual(2);
    expect(SITE.grid[44][11]).toEqual(2);
    expect(SITE.grid[58][10]).toEqual(2);
    expect(SITE.grid[59][16]).toEqual(2);

  });

  test('adds loops', () => {

    GW.random.seed(12345);
    const SITE = GW.dungeon.startDig(80, 30);

    let locs = [38, 28];
    let roomCount = 5;

    for(let i = 0; i < roomCount; ++i) {
  		locs = GW.dungeon.digRoom({ digger: 'ROOM', locs, tries: 20, tile: 1 });
  		if (!locs) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    // GW.grid.dump(SITE.grid);

    expect(SITE.grid[56][18]).toEqual(0);
    expect(SITE.grid[69][16]).toEqual(0);
    GW.dungeon.addLoops(20, 5);

    // GW.grid.dump(SITE.grid);

    expect(SITE.grid[56][18]).toEqual(2); // added door
    expect(SITE.grid[69][16]).toEqual(2); // added door

  });

});
