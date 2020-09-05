
const GW = require('../dist/gw.cjs');


describe('GW.digger', () => {

  let grid;

  beforeEach( () => {
    grid = GW.grid.alloc(50, 30);
  });

  afterEach( () => {
    GW.grid.free(grid);
  });

  test('rectangularRoom', () => {
  	GW.digger.rectangularRoom({ width: grid.width - 2, height: grid.height - 2 }, grid);

    grid.forEach( (v, i, j) => {
      if (grid.isBoundaryXY(i, j)) {
        expect(v).toEqual(0);
      }
      else {
        expect(v).toEqual(1);
      }
    });
  });

  test('digCavern', () => {
    GW.random.seed(123456);
    expect(grid.count(1)).toEqual(0);
    GW.digger.cavern({ width: 10, height: 10 }, grid);
    // GW.grid.dump(grid);
    expect(grid.count(1)).toBeGreaterThan(0);
  });

});
