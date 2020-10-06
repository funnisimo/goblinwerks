
import * as UTILS from './utils.js';


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
    expect(UTILS.dirIndex([1,0])).toEqual(3);
    expect(UTILS.dirIndex([-1,1])).toEqual(6);
  });
});
