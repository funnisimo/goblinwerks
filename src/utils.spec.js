
const GW = require('../dist/gw.cjs');


describe('GW.utils', () => {

  test('clamp', () => {
    expect(GW.utils.clamp(0, 1, 4)).toEqual(1);
    expect(GW.utils.clamp(1, 1, 4)).toEqual(1);
    expect(GW.utils.clamp(4, 1, 4)).toEqual(4);
    expect(GW.utils.clamp(5, 1, 4)).toEqual(4);
  });

});
