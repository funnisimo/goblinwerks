
const GW = require('../dist/gw.cjs');

describe('GW.color', () => {

  test('Color', () => {
    const d = new GW.types.Color(100, 90, 80);
    expect(d.red).toEqual(100);
    expect(d.green).toEqual(90);
    expect(d.blue).toEqual(80);
    expect(d[0]).toEqual(100);
    expect(d[1]).toEqual(90);
    expect(d[2]).toEqual(80);

  });

});