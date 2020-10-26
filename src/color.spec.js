
import * as GW from './index.js';

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

  test('css', () => {
    const c = new GW.types.Color(100, 50, 0);
    expect(c.css()).toEqual('#ff8000');

    const d = GW.make.color(0x202020);
    expect(d.css()).toEqual('#1f1f1f'); // some rounding things between base 256 and base 100
  });

});
