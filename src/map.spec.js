
import * as GW from './index.js';


describe('Map', () => {

  test('constructor', () => {
    const map = GW.make.map(10, 10);
    expect(map.width).toEqual(10);
    expect(map.height).toEqual(10);
    expect(map.id).toBeUndefined();

    expect(map.hasXY(3, 3)).toBeTruthy();
    expect(map.hasXY(30, 3)).toBeFalsy();

    // You need to validate the XY before getting the cell
    expect(map.cell(3, 3)).toBeDefined();
    expect(() => map.cell(30, 3)).toThrow();
  });

  test('constructor with id', () => {
    const map = GW.make.map(10, 10, { id: 1 });
    expect(map.width).toEqual(10);
    expect(map.height).toEqual(10);
    expect(map.id).toEqual(1);
  });

  test('setTile', () => {
    GW.cosmetic.seed(12345);

    const map = GW.make.map(10, 10);
    expect(GW.tiles.FLOOR).toBeDefined();

    map.setTile(2, 2, 'FLOOR');

    const sprite = new GW.types.Sprite();
    GW.map.getCellAppearance(map, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles.FLOOR.sprite.ch);
    expect(sprite.fg).toBakeFrom(GW.tiles.FLOOR.sprite.fg);
    expect(sprite.bg).toBakeFrom(GW.tiles.FLOOR.sprite.bg);

    map.setTile(2, 2, 'DOOR');  // can use tile name too (slower)

    GW.map.getCellAppearance(map, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles.DOOR.sprite.ch);
    expect(sprite.fg).toBakeFrom(GW.tiles.DOOR.sprite.fg);
    expect(sprite.bg).toBakeFrom(GW.tiles.DOOR.sprite.bg);

  });


  test('getLine', () => {
    const map = GW.make.map(10, 10);
    const line = GW.map.getLine(map, 1, 1, 7, 8);
    expect(line.length).toEqual(8);
    expect(line).not.toContainEqual([1,1]);
    expect(line).toContainEqual([7,8]);
    expect(line).toEqual([
      [ 2, 2 ],  [ 3, 3 ], [ 4, 4 ],  [ 4, 5 ], [ 5, 6 ],  [ 6, 7 ], [ 7, 8 ],  [ 8, 9 ]
    ]);
  });


  describe('liquids', () => {

    beforeAll( () => {
      GW.tile.addKind('RED_LIQUID', {
        name: 'red liquid',
        layer: 'LIQUID',
      });
    });

    afterAll( () => {
      delete GW.tiles.RED_LIQUID;
    });

    test('liquids dissipate', async () => {
      GW.random.seed(12345);
      const map = GW.make.map(10, 10);
      map.setTile(5, 5, 'RED_LIQUID', 50);
      const cell = map.cell(5, 5);
      expect(cell.liquidVolume).toEqual(50);
      expect(map.cell(4, 5).liquidVolume).toEqual(0);

      await map.tick();
      expect(cell.liquidVolume).toEqual(40);
      expect(map.cell(4, 5).liquidVolume).toEqual(0);

      await map.tick();
      expect(cell.liquidVolume).toEqual(32);
      expect(map.cell(4, 5).liquidVolume).toEqual(0);

      expect(cell.liquidTile.dissipate).toBeGreaterThan(0);
      while( cell.liquidVolume > 0) {
        await map.tick();
      }

      expect(cell.liquid).toEqual(0);

    });
  });
});
