
const GW = require('../dist/gw.cjs');

describe('GW', () => {

  test('exists', () => {
    expect(GW.data).toBeObject();
    expect(GW.def.dirs).toBeArray();
  });

});
