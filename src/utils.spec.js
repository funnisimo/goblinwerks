
import * as GW from './index.js';
const UTILS = GW.utils;


describe('GW.utils', () => {

  test('basics', () => {
    expect(UTILS.NOOP()).toBeUndefined();
    expect(UTILS.FALSE()).toBeFalsy();
    expect(UTILS.TRUE()).toBeTruthy();
    expect(UTILS.IDENTITY(4)).toEqual(4);
  });

  test('clamp', () => {
    expect(UTILS.clamp(0, 1, 4)).toEqual(1);
    expect(UTILS.clamp(1, 1, 4)).toEqual(1);
    expect(UTILS.clamp(4, 1, 4)).toEqual(4);
    expect(UTILS.clamp(5, 1, 4)).toEqual(4);
  });

  test('copyXY', () => {
    const dest = { x: 0, y: 0 };

    UTILS.copyXY(dest, { x: 4, y: 5 });
    expect(dest).toEqual({ x: 4, y: 5 });

    UTILS.copyXY(dest, [2,3]);
    expect(dest).toEqual({ x: 2, y: 3 });
  });

  test('addXY', () => {
    const dest = { x: 0, y: 0 };

    UTILS.addXY(dest, { x: 4, y: 5 });
    expect(dest).toEqual({ x: 4, y: 5 });

    UTILS.addXY(dest, [2,3]);
    expect(dest).toEqual({ x: 6, y: 8 });
  });

  test('equalsXY', () => {
    const dest = { x: 2, y: 3 };

    expect(UTILS.equalsXY(dest, { x: 4, y: 5 })).toBeFalsy();
    expect(UTILS.equalsXY(dest, { x: 4, y: 3 })).toBeFalsy();
    expect(UTILS.equalsXY(dest, { x: 2, y: 5 })).toBeFalsy();
    expect(UTILS.equalsXY(dest, { x: 2, y: 3 })).toBeTruthy();

    expect(UTILS.equalsXY(dest, [4,5])).toBeFalsy();
    expect(UTILS.equalsXY(dest, [4,3])).toBeFalsy();
    expect(UTILS.equalsXY(dest, [2,5])).toBeFalsy();
    expect(UTILS.equalsXY(dest, [2,3])).toBeTruthy();

  });

  test('distanceBetween', () => {
    expect(UTILS.distanceBetween(5,0,10,0)).toEqual(5);
    expect(UTILS.distanceBetween(0,5,0,10)).toEqual(5);
    expect(UTILS.distanceBetween(5,5,10,10)).toEqual(5*1.4);
  });

  test('distanceFromTo', () => {
    expect(UTILS.distanceFromTo({ x: 5, y: 0 }, { x: 10, y: 0 })).toEqual(5);
    expect(UTILS.distanceFromTo([5,0], [10,0])).toEqual(5);
  });

  test('dirBetween', () => {
    expect(UTILS.dirBetween(0, 0, 3, 0)).toEqual([1,0]);
    expect(UTILS.dirBetween(0, 0, 0, -3)).toEqual([0,-1]);
    expect(UTILS.dirBetween(0, 0, 10, 9)).toEqual([1,1]);
    expect(UTILS.dirBetween(0, 0, -10, 9)).toEqual([-1,1]);
  });

  test('dirFromTo', () => {
    expect(UTILS.dirFromTo({x: 0, y: 0 }, { x: 5, y: -1 })).toEqual([1,0]);
    expect(UTILS.dirFromTo([0,0], { x: -5, y: -10 })).toEqual([0,-1]);
  });

  test('dirIndex', () => {
    expect(UTILS.dirIndex([0,0])).toEqual(-1);
    expect(UTILS.dirIndex([2,0])).toEqual(-1);
    expect(UTILS.dirIndex([1,0])).toEqual(1);
    expect(UTILS.dirIndex([-1,1])).toEqual(7);
  });

  test('stepFromTo', () => {
    const fn = jest.fn();
    UTILS.stepFromTo([0,0], [2,4], fn);
    expect(fn).toHaveBeenCalledWith(0,0);
    expect(fn).toHaveBeenCalledWith(0,1);
    expect(fn).toHaveBeenCalledWith(1,2);
    expect(fn).toHaveBeenCalledWith(1,3);
    expect(fn).toHaveBeenCalledWith(2,4);
    expect(fn).toHaveBeenCalledTimes(5);
  });

  test('assignOmitting', () => {
    const dest = {};
    UTILS.assignOmitting(['a', 'b', 'c'], dest, { a: 1, b: 2, c: 3, d: 4, e: 5 });
    expect(dest).toEqual({ d: 4, e: 5 });

    UTILS.assignOmitting('c, d, e', dest, { a: 10, b: 20, c: 30, d: 40, e: 50 });
    expect(dest).toEqual({ a: 10, b: 20, d: 4, e: 5 });
  });

  test('addToChain + removeFromChain', () => {
    const obj = {
      chain: null,
    };

    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const e = {};
    const f = {};

    UTILS.addToChain(obj, 'chain', a);
    UTILS.addToChain(obj, 'chain', b);
    UTILS.addToChain(obj, 'chain', c);
    UTILS.addToChain(obj, 'chain', d);
    UTILS.addToChain(obj, 'chain', e);
    UTILS.addToChain(obj, 'chain', f);
    expect(obj.chain).toBe(f);
    expect(f.next).toBe(e);
    expect(e.next).toBe(d);
    expect(d.next).toBe(c);
    expect(c.next).toBe(b);
    expect(b.next).toBe(a);
    expect(a.next).toBeNull();
    expect(UTILS.chainLength(obj.chain)).toEqual(6);

    UTILS.removeFromChain(obj, 'chain', c);
    expect(c.next).toBeNull();
    expect(d.next).toBe(b);
    expect(UTILS.chainLength(obj.chain)).toEqual(5);
  });

  describe('kindDefaults', () => {

    test('sets basic values', () => {
      const dest = {};
      UTILS.kindDefaults(dest, {
        a: 1,
        b: 2,
        'c.d': 3,
        'e.f.g': 4
      });

      expect(dest.a).toEqual(1);
      expect(dest.b).toEqual(2);
      expect(dest.c.d).toEqual(3);
      expect(dest.e.f.g).toEqual(4);

    });

    test('honors set values', () => {

      const dest = {
        b: 3,
        c: { h: 2 },
        e: { f: { g: 5 } },
      };
      UTILS.kindDefaults(dest, {
        a: 1,
        b: 2,
        'c.d': 3,
        'e.f.g': 4
      });

      expect(dest.a).toEqual(1);
      expect(dest.b).toEqual(3);
      expect(dest.c.d).toEqual(3);
      expect(dest.e.f.g).toEqual(5);

    });

    test('treats flags as an array', () => {
      const dest = {};
      UTILS.kindDefaults(dest, {
        flags: 'TEST',
      });
      expect(dest.flags).toEqual(['TEST']);
    });

    test('concats default value first', () => {
      const dest = {
        flags: 'VALUE',
      };
      UTILS.kindDefaults(dest, {
        flags: 'TEST',
      });
      expect(dest.flags).toEqual(['TEST', 'VALUE']);
    });

    test('works with # flags', () => {
      const dest = {
        flags: 8,
      };
      UTILS.kindDefaults(dest, {
        flags: 32,
      });
      expect(dest.flags).toEqual([32, 8]);
    });

    test('works with array flags', () => {
      const dest = {
        flags: ['A', 'B'],
      };
      UTILS.kindDefaults(dest, {
        flags: ['B', 'C'],
      });
      expect(dest.flags).toEqual(['B', 'C', 'A', 'B']);
    });

    test('works with string flags', () => {
      const dest = {
        flags: 'A, B',
      };
      UTILS.kindDefaults(dest, {
        flags: 'B, C',
      });
      expect(dest.flags).toEqual(['B', 'C', 'A', 'B']);
    });

  });

});
