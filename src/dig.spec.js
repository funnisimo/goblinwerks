
const GW = require('../dist/gw.cjs');


describe('GW.dig', () => {

  beforeAll( () => {
    GW.dig.installDigger('ROOM',     GW.dig.rectangularRoom,  { width: [10,20], height: [5,10] });
  });

  afterEach( () => {
    GW.dig.finishDig();
  });

  test('one big room', () => {
    const SITE = GW.dig.startDig(10, 10);
  	GW.dig.rectangularRoom({ width: SITE.width - 2, height: SITE.height - 2 }, SITE.grid);

    SITE.grid.forEach( (v, i, j) => {
      if (SITE.grid.isBoundaryXY(i, j)) {
        expect(v).toEqual(0);
      }
      else {
        expect(v).toEqual(1);
      }
    });
  });

  test('five rooms', () => {
    GW.random.seed(12345);
    const SITE = GW.dig.startDig(80, 30);

    let doors = [ [38, 28] ];
    let roomCount = 5;

    for(let i = 0; i < roomCount; ++i) {
  		doors = GW.dig.digRoom({ digger: 'ROOM', doors, tries: 20, tile: 1 });
  		if (!doors) {
        fail('Failed to dig map on room #' + (i + 1));
  		}
  	}

    expect(doors).toEqual([[-1,-1], [63,22], [56,17], [74,21]]);
    expect(SITE.grid[70][19]).toEqual(1);

    SITE.grid.forRect(57, 17, 73-57+1, 21-17+1, (v) => expect(v).toEqual(1));

    expect(SITE.grid[49][21]).toEqual(2);
    expect(SITE.grid[44][11]).toEqual(2);
    expect(SITE.grid[58][10]).toEqual(2);
    expect(SITE.grid[59][16]).toEqual(2);

  });

});
