

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
});
