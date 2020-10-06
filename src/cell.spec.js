

import * as GW from './index.js';


describe('CellMemory', () => {

  test('will copy another memory object', () => {
    const a = new GW.types.CellMemory();
    const b = new GW.types.CellMemory();

    a.sprite.plotChar('a');
    a.tileFlags = 1;
    a.cellFlags = 1;

    b.sprite.plotChar('b');
    b.tileFlags = 2;
    b.tileFlags = 2;

    expect(a.sprite).not.toBe(b.sprite);
    a.copy(b);
    expect(a.sprite).not.toBe(b.sprite);
    expect(a.sprite.ch).toEqual('b');
    expect(a.tileFlags).toEqual(2);
    expect(a.tileFlags).toEqual(2);
  });

  test('setTile', () => {
    const c = GW.make.cell();

    expect(GW.tiles.FLOOR.priority).toBeLessThan(GW.tiles.DOOR.priority);

    const floor = 'FLOOR';
    const wall = 'WALL';

    expect(c.ground).toEqual(0);
    c.setTile(floor);
    expect(c.ground).toEqual(floor);
    c.setTile(wall);
    expect(c.ground).toEqual(wall);
    c.setTile(floor, true); // checks priority
    expect(c.ground).toEqual(wall);  // 2 has better priority
    c.setTile(floor);
    expect(c.ground).toEqual(floor);  // ignored priority
  });

  test('can support many layers', () => {

    const c = GW.make.cell();
    c.setTile('FLOOR');

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
    const c = GW.make.cell();
    c.setTile('FLOOR');

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
    expect(app).toEqual(ex);

    c.clearFlags(GW.flags.cell.CELL_CHANGED);
    c.removeSprite(a);
    expect(c.flags & GW.flags.cell.CELL_CHANGED).toBeTruthy();
    c.removeSprite(b);

    GW.cell.getAppearance(c, app);
    expect(app).toEqual(GW.tiles.FLOOR.sprite);
  });

});
