

const GW = require('../dist/gw.cjs');


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
    expect(c.layers).toEqual([0,0,0,0]);
    c.setTile(1);
    expect(c.layers).toEqual([1,0,0,0]);
    c.setTile(2);
    expect(c.layers).toEqual([2,0,0,0]);
    c.setTile(1);
    expect(c.layers).toEqual([2,0,0,0]);  // 2 has better priority
    c.setTile(1, true);
    expect(c.layers).toEqual([1,0,0,0]);  // 2 has better priority
  });
});
