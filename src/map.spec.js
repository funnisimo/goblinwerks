
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
    const map = GW.make.map(10, 10);
    expect(GW.tiles[1]).toBeDefined();

    map.setTile(2, 2, 1);

    const sprite = GW.make.sprite();
    GW.map.getCellAppearance(map, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles[1].sprite.ch);
    expect(GW.color.equals(sprite.bg, GW.tiles[1].sprite.bg)).toBeTruthy();
    expect(GW.color.equals(sprite.fg, GW.tiles[1].sprite.fg)).toBeTruthy();

    debugger;
    map.setTile(2, 2, 'DOOR');  // can use tile name too (slower)

    GW.map.getCellAppearance(map, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles[2].sprite.ch);
    expect(GW.color.equals(sprite.bg, GW.tiles[2].sprite.bg)).toBeTruthy();
    expect(GW.color.equals(sprite.fg, GW.tiles[2].sprite.fg)).toBeTruthy();

  });
});