
const GW = require('../dist/gw.cjs');

describe('GW', () => {

  test('exists', () => {
    expect(GW.MAP).toBeNull();
    expect(GW.PLAYER).toBeNull();
  });

});
