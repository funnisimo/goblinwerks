

const GW = require('../dist/gw.cjs');


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

});
