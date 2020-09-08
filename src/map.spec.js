
const GW = require('../dist/gw.cjs');


describe('Map', () => {

  test('constructor', () => {
    const map = GW.make.map(10, 10);
    expect(map.width).toEqual(10);
    expect(map.height).toEqual(10);

    expect(map.hasXY(3, 3)).toBeTruthy();
    expect(map.hasXY(30, 3)).toBeFalsy();

    // You need to validate the XY before getting the cell
    expect(map.cell(3, 3)).toBeDefined();
    expect(() => map.cell(30, 3)).toThrow();
  });

  test('setTile', () => {
    GW.cosmetic.seed(12345);

    const map = GW.make.map(10, 10);
    expect(GW.tiles[1]).toBeDefined();

    map.setTile(2, 2, 1);

    const sprite = GW.make.sprite();
    GW.map.getCellAppearance(map, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles[1].sprite.ch);
    expect(GW.color.diff(sprite.bg, GW.tiles[1].sprite.bg)).toBeLessThan(5);
    expect(GW.color.diff(sprite.fg, GW.tiles[1].sprite.fg)).toBeLessThan(40);

    debugger;
    map.setTile(2, 2, 'DOOR');  // can use tile name too (slower)

    GW.map.getCellAppearance(map, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles[2].sprite.ch);
    expect(GW.color.diff(sprite.bg, GW.tiles[2].sprite.bg)).toBeLessThan(5);
    expect(GW.color.diff(sprite.fg, GW.tiles[2].sprite.fg)).toBeLessThan(5);

  });


  test('getLine', () => {
    const map = GW.make.map(10, 10);
    const line = GW.map.getLine(map, 1, 1, 7, 8);
    expect(line.length).toEqual(9);
    expect(line).not.toContainEqual([1,1]);
    expect(line).toContainEqual([7,8]);
    expect(line).toEqual([
      [ 2, 2 ],  [ 3, 3 ], [ 4, 4 ],  [ 4, 5 ], [ 5, 6 ],  [ 6, 7 ], [ 7, 8 ],  [ 8, 9 ], [ 9, 10 ]
    ]);
  });
});
