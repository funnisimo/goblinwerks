
const GW = require('../dist/gw.cjs');


describe('Map', () => {

  test('constructor', () => {
    const map = GW.make.map(10, 10);
    expect(map.width).toEqual(10);
    expect(map.height).toEqual(10);
  });
});
