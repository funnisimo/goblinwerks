

import * as GW from './index.js';


describe('CellMemory', () => {

  beforeAll(() => {
    GW.tile.addKind('TEST_FLOOR', {
      name: 'floor',
      ch: '.',
      fg: [80,80,80],
      bg: [20,20,20],
    });
    GW.tile.addKind('RED_LIQUID', {
      name: 'red liquid', article: 'some',
      bg: 'red',
      layer: 'LIQUID'
    });
    GW.tile.addKind('BLUE_LIQUID', {
      name: 'blue liquid', article: 'some',
      bg: 'blue',
      layer: 'LIQUID'
    });
  });

  afterAll(() => {
    delete GW.tiles.TEST_FLOOR;
    delete GW.tiles.RED_LIQUID;
    delete GW.tiles.BLUE_LIQUID;
  });

  test('_setTile(0) - can clear tile', () => {
    const c = GW.make.cell();
    c._setTile('FLOOR');
    expect(c.ground).toEqual('FLOOR');

    c._setTile(0);
    expect(c.ground).toEqual(0);
  });

  test('will copy another memory object', () => {
    const a = new GW.types.CellMemory();
    const b = new GW.types.CellMemory();

    a.sprite.draw('a');
    a.tileFlags = 1;
    a.cellFlags = 1;

    b.sprite.draw('b');
    b.tileFlags = 2;
    b.tileFlags = 2;

    expect(a.sprite).not.toBe(b.sprite);
    a.copy(b);
    expect(a.sprite).not.toBe(b.sprite);
    expect(a.sprite.ch).toEqual('b');
    expect(a.tileFlags).toEqual(2);
    expect(a.tileFlags).toEqual(2);
  });

  test('_setTile', () => {
    const c = GW.make.cell();

    expect(GW.tiles.FLOOR.priority).toBeLessThan(GW.tiles.DOOR.priority);

    const floor = 'FLOOR';
    const wall = 'WALL';

    expect(c.ground).toEqual(0);
    c._setTile(floor);
    expect(c.ground).toEqual(floor);
    c._setTile(wall);
    expect(c.ground).toEqual(wall);
    // c._setTile(floor, true); // checks priority
    // expect(c.ground).toEqual(wall);  // 2 has better priority
    c._setTile(floor);
    expect(c.ground).toEqual(floor);  // ignored priority
  });

  test('will keep sprites in sorted order by layer, priority increasing', () => {
    const c = GW.make.cell();

    c.addSprite(6, '@');
    expect(c.sprites).toEqual({ layer: 6, sprite: '@', priority: 50, next: null });

    c.addSprite(4, 'i');
    expect(c.sprites).toMatchObject({ layer: 4, sprite: 'i', priority: 50 });
    expect(c.sprites.next).toEqual({ layer: 6, sprite: '@', priority: 50, next: null });
  });

  test('can support many layers', () => {

    const c = GW.make.cell();
    c._setTile('FLOOR');

    const a = GW.make.sprite('@', 'white', 'blue');
    const b = GW.make.sprite(null, null, 'red');

    c.addSprite(1, a);
    c.addSprite(2, b, 100);

    expect(c.sprites).not.toBeNull();
    expect(c.sprites.sprite).toBe(a);
    expect(c.sprites.next.sprite).toBe(b);

    const app = GW.make.sprite();
    GW.cell.getAppearance(c, app);

    const ex = GW.make.sprite('@', 'white', 'red');
    expect(app).toEqual(ex);
  });

  test('layers will blend opacities', () => {
    GW.cosmetic.seed(12345);
    const c = GW.make.cell();
    c._setTile('FLOOR');

    const a = GW.make.sprite('@', 'white', 'blue');
    const b = GW.make.sprite(null, null, 'red', 50);

    c.clearFlags(GW.flags.cell.CELL_CHANGED);
    c.addSprite(1, a);
    expect(c.flags & GW.flags.cell.CELL_CHANGED).toBeTruthy();
    c.addSprite(2, b, 100);

    expect(c.sprites).not.toBeNull();
    expect(c.sprites.sprite).toBe(a);
    expect(c.sprites.next.sprite).toBe(b);

    const app = GW.make.sprite();
    GW.cell.getAppearance(c, app);

    const ex = GW.make.sprite('@', 'white', [50,0,50]);
    expect(app.ch).toEqual(ex.ch);
    expect(app.fg).toEqual(ex.fg);
    expect(app.bg).toEqual(ex.bg);

    c.clearFlags(GW.flags.cell.CELL_CHANGED);
    c.removeSprite(a);
    expect(c.flags & GW.flags.cell.CELL_CHANGED).toBeTruthy();
    c.removeSprite(b);

    GW.cell.getAppearance(c, app);
    const FLOOR = GW.tiles.FLOOR.sprite;
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.fg).toBakeFrom(FLOOR.fg);
    expect(app.bg).toBakeFrom(FLOOR.bg);
  });

  test('will set liquid with volume', () => {
    GW.cosmetic.seed(12345);
    const FLOOR = GW.tiles.TEST_FLOOR.sprite;
    const c = GW.make.cell();
    c._setTile('TEST_FLOOR');

    const app = GW.make.sprite();
    GW.cell.getAppearance(c, app);
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.bg).toEqual([20,20,20,0,0,0,0]);
    expect(app.fg).toEqual([80,80,80,0,0,0,0]);

    c._setTile('RED_LIQUID', 100);
    expect(c.liquid).toEqual('RED_LIQUID');
    expect(c.liquidVolume).toEqual(100);
    GW.cell.getAppearance(c, app);
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.bg).toEqual([100,0,0,0,0,0,0]);
    expect(app.fg).toEqual([80,80,80,0,0,0,0]);

    c.clearLayer('LIQUID');
    expect(c.liquid).toEqual(0);
    expect(c.liquidVolume).toEqual(0);
    GW.cell.getAppearance(c, app);
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.bg).toEqual([20,20,20,0,0,0,0]);
    expect(app.fg).toEqual([80,80,80,0,0,0,0]);

    c._setTile('RED_LIQUID', 50);
    expect(c.liquid).toEqual('RED_LIQUID');
    expect(c.liquidVolume).toEqual(50);
    GW.cell.getAppearance(c, app);
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.bg).toEqual([60,10,10,0,0,0,0]);
    expect(app.fg).toEqual([80,80,80,0,0,0,0]);

    c._setTile('BLUE_LIQUID', 10);
    expect(c.liquid).toEqual('BLUE_LIQUID');
    expect(c.liquidVolume).toEqual(10);
    GW.cell.getAppearance(c, app);
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.bg).toEqual([16,16,36,0,0,0,0]);
    expect(app.fg).toEqual([80,80,80,0,0,0,0]);

  });

  test('will add liquid volumes', () => {
    GW.cosmetic.seed(12345);
    const FLOOR = GW.tiles.TEST_FLOOR.sprite;
    const c = GW.make.cell();
    c._setTile('TEST_FLOOR');

    const app = GW.make.sprite();
    GW.cell.getAppearance(c, app);
    expect(app.ch).toEqual(FLOOR.ch);
    expect(app.bg).toEqual([20,20,20,0,0,0,0]);
    expect(app.fg).toEqual([80,80,80,0,0,0,0]);

    c._setTile('RED_LIQUID', 10);
    expect(c.liquid).toEqual('RED_LIQUID');
    expect(c.liquidVolume).toEqual(10);

    c._setTile('RED_LIQUID', 10);
    expect(c.liquid).toEqual('RED_LIQUID');
    expect(c.liquidVolume).toEqual(20);

    c._setTile('RED_LIQUID', 10);
    expect(c.liquid).toEqual('RED_LIQUID');
    expect(c.liquidVolume).toEqual(30);

    c._setTile('BLUE_LIQUID', 10);
    expect(c.liquid).toEqual('BLUE_LIQUID');
    expect(c.liquidVolume).toEqual(10);

    c.clearLayer('LIQUID');
    expect(c.liquid).toEqual(0);
    expect(c.liquidVolume).toEqual(0);

  });
});
