
const GW = require('../dist/gw.cjs');


describe('FOV', () => {

  test('will calculate FOV', () => {

    const map = GW.make.map(50, 50);

    map.setTile(20, 25, 6); // wall
    map.setTile(25, 20, 6);

    const grid = GW.grid.alloc(map.width, map.height);

    map.calcFov(grid, 25, 25, 10);

    expect(grid[25][25]).toEqual(1);  // center is always visible
    expect(grid[20][25]).toEqual(1);
    expect(grid[19][25]).toEqual(0);
    expect(grid[25][20]).toEqual(1);
    expect(grid[25][19]).toEqual(0);

    // grid[25][25] = 2;
    // grid.dump();

    expect(grid[25][35]).toEqual(1);  // 10 away

    GW.grid.free(grid);
  });
});
