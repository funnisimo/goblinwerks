
const GW = require('../dist/goblinwerks.cjs');

describe('GW', () => {

  test('exists', () => {
    expect(GW.MAP).toBeNull();
    expect(GW.PLAYER).toBeNull();
  });

  test('clamp', () => {
    expect(GW.utils.clamp(5, 1, 4)).toEqual(4);
  });
});
