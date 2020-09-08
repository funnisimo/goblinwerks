
const GW = require('../dist/gw.cjs');


describe('FOV', () => {

  test('will calculate FOV', () => {

    const map = GW.make.map(50, 50);

    map.setTile(20, 25, 6); // wall
    map.setTile(25, 20, 6);

    const grid = GW.grid.alloc(map.width, map.height);

    GW.fov.getMask(map, grid, 25, 25, 10, GW.flags.tile.T_OBSTRUCTS_PASSABILITY);

    expect(grid[25][25]).toEqual(0);  // center is 0 for some reason
    expect(grid[20][25]).toEqual(1);
    expect(grid[19][25]).toEqual(0);
    expect(grid[25][20]).toEqual(1);
    expect(grid[25][19]).toEqual(0);

    GW.grid.free(grid);
  });
});
