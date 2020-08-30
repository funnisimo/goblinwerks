
const GW = require('../dist/gw.cjs');


describe('GW.random', () => {

  test('is initialized', () => {
    expect(GW.random).toBeDefined();
  });

  test('gives random percents => [0, 1)', () => {
    for(let i = 0; i < 10000; ++i) {
      expect(GW.random.value()).toBeWithin(0, 1);
    }
  });

  test('gives random numbers => [0, MAX)', () => {
    expect(GW.types.Random.MAX).toBeGreaterThan(1e6);
    for(let i = 0; i < 10000; ++i) {
      expect(GW.random.number()).toBeWithin(0, GW.types.Random.MAX);
    }
  });

});

describe('GW.cosmetic', () => {

  test('can give random numbers', () => {
    expect(GW.cosmetic.value()).toBeWithin(0, 1);
  });
});

describe('GW.types.Range', () => {

  test('Range', () => {
    const r = new GW.types.Range(10,20,5);
    expect(r.lo).toEqual(10);
    expect(r.hi).toEqual(20);
    expect(r.clumps).toEqual(5);
    expect(r.value()).toBeInRange(10, 20);
  });

  test('can be made from strings', () => {
    const r = GW.make.range('1-3');
    expect(r.lo).toEqual(1);
    expect(r.hi).toEqual(3);
    expect(r.clumps).toEqual(1);
  });
});
