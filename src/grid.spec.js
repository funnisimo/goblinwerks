

import * as GW from './index.js';


describe('GW.grid', () => {

  let a;

  afterEach( () => {
    GW.grid.free(a);
    a = null;
  });

  test('alloc/free', () => {
    a = GW.grid.alloc(10, 10);
    expect(a.width).toEqual(10);
    expect(a.height).toEqual(10);
    expect(a[9][9]).toEqual(0);
    expect(a.hasXY(0, 0)).toBeTruthy();
  });

  test('hasXY', () => {
    a = GW.grid.alloc(10, 10);
    expect(a.hasXY(5, 5)).toBeTruthy();
    expect(a.hasXY(0, 0)).toBeTruthy();
    expect(a.hasXY(-1, 0)).toBeFalsy();
    expect(a.hasXY(0, -1)).toBeFalsy();
    expect(a.hasXY(9, 9)).toBeTruthy();
    expect(a.hasXY(10, 0)).toBeFalsy();
    expect(a.hasXY(0, 10)).toBeFalsy();
  });

  test('isBoundaryXY', () => {
    a = GW.grid.alloc(10, 10);
    expect(a.isBoundaryXY(5, 5)).toBeFalsy();
    expect(a.isBoundaryXY(0, 0)).toBeTruthy();
    expect(a.isBoundaryXY(5, 0)).toBeTruthy();
    expect(a.isBoundaryXY(0, 5)).toBeTruthy();
    expect(a.isBoundaryXY(-1, 0)).toBeFalsy();
    expect(a.isBoundaryXY(0, -1)).toBeFalsy();
    expect(a.isBoundaryXY(9, 9)).toBeTruthy();
    expect(a.isBoundaryXY(5, 9)).toBeTruthy();
    expect(a.isBoundaryXY(9, 5)).toBeTruthy();
    expect(a.isBoundaryXY(10, 0)).toBeFalsy();
    expect(a.isBoundaryXY(0, 10)).toBeFalsy();
  });

  test('fill', () => {
    a = GW.grid.alloc(10, 10, 10);
    expect(a.count(0)).toEqual(0);
    a.fill(0);
    expect(a.count(0)).toEqual(100);
  });

  test('fillBlob', () => {
    a = GW.grid.alloc(80, 30);
    expect(a.count(1)).toEqual(0);

    GW.grid.fillBlob(a, 5, 4, 4, 30, 15, 55, "ffffftttt", "ffffttttt");
    expect(a.count(1)).toBeGreaterThan(10);
  });

  test.only('fillBlob - can handle min >= max', () => {
    GW.random.seed(123456);
    a = GW.grid.alloc(50, 30);
    expect(a.count(1)).toEqual(0);

    GW.grid.fillBlob(a, 5, 12, 12, 10, 10, 55, "ffffftttt", "ffffttttt");
    expect(a.count(1)).toBeGreaterThan(10);
  });

});
