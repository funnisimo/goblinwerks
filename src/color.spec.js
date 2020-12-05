
import * as GW from './index.js';

describe('GW.color', () => {

  test('Color', () => {
    const d = new GW.types.Color(100, 90, 80);
    expect(d.r).toEqual(255);
    expect(d.g).toEqual(230);
    expect(d.b).toEqual(204);
  });

  test('css', () => {
    const c = new GW.types.Color(100, 50, 0);
    expect(c.toString(true)).toEqual('#ff8000');

    const d = GW.make.color(0x202020, true);
    expect(d.r).toEqual(d.g);
    expect(d.r).toEqual(d.b);
    expect(d.toString(true)).toEqual('#212121'); // some rounding things between base 256 and base 100
  });

  test('installed colors', () => {
    expect(GW.colors.white.toString(true)).toEqual('white');
    expect(GW.colors.white.toInt(true)).toEqual(0xFFFFFF);

    expect(GW.colors.black.toString(true)).toEqual('black');
    expect(GW.colors.black.toInt(true)).toEqual(0x000000);

    expect(GW.colors.blue.toString(true)).toEqual('blue');
    expect(GW.colors.blue.toInt(true)).toEqual(0x0000FF);

    expect(GW.colors.dark_red.toString(true)).toEqual('dark_red');
    expect(GW.colors.dark_red.toInt(true)).toEqual(0xBF0000);
  });

});
