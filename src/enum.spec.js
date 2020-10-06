
import * as GW from './index.js';


describe('Enum', () => {

  test('constructor', () => {
    const e = new GW.types.Enum('a', 'b', 'c', 'd');
    expect(e.a).toEqual(0);
    expect(e.b).toEqual(1);

    expect(e.toString()).toEqual('{"a":0,"b":1,"c":2,"d":3}');
    expect(e.toString(1)).toEqual('b');
  });

  test('can have an offset', () => {
    const e = new GW.types.Enum(1, 'a', 'b', 'c', 'd');
    expect(e.a).toEqual(1);
    expect(e.b).toEqual(2);

    expect(e.toString()).toEqual('{"a":1,"b":2,"c":3,"d":4}');
    expect(e.toString(1)).toEqual('a');
  });
});
