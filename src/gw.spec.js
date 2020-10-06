
import * as GW from './index.js';


describe('GW', () => {

  test('exists', () => {
    expect(GW.data).toBeObject();
    expect(GW.def.dirs).toBeArray();
  });

});
