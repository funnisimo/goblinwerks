
import * as GW from './index.js';


describe('GW.path', () => {

  let distGrid;
  let costGrid;

  afterEach( () => {
    distGrid = GW.grid.free(distGrid);
    costGrid = GW.grid.free(costGrid);
  });

  test('can scan a grid', () => {
    distGrid = GW.grid.alloc(10, 10);
    costGrid = GW.grid.alloc(10, 10, 1);

    costGrid[3][2] = GW.def.PDS_OBSTRUCTION;
    costGrid[4][2] = GW.def.PDS_OBSTRUCTION;
    costGrid[5][2] = GW.def.PDS_OBSTRUCTION;
    costGrid[6][2] = GW.def.PDS_OBSTRUCTION;

    GW.path.calculateDistances(distGrid, 4, 4, costGrid, true);

    expect(distGrid[4][4]).toEqual(0);
    expect(distGrid[4][5]).toEqual(1);
    expect(distGrid[5][5]).toFloatEqual(1.4142);  // diagonals cost sqrt(2)
    expect(distGrid[4][8]).toEqual(4);
    expect(distGrid[8][4]).toEqual(4);
    expect(distGrid[4][1]).toFloatEqual(6.4142);  // have to go around stuff
    expect(distGrid[4][9]).toEqual(30000);
  });
});
