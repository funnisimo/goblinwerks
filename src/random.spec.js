
import * as GW from './index.js';


function always(testFn, count=1000) {
  for(let i = 0; i < count; ++i) {
    testFn();
  }
}

describe('GW.random', () => {

  test('is initialized', () => {
    expect(GW.random).toBeDefined();
  });

  test('works with a seed', () => {
    GW.random.seed(12345);
    expect(GW.random.number(100)).toEqual(9);
    expect(GW.random.number(100)).toEqual(96);
    expect(GW.random.number(100)).toEqual(70);
    expect(GW.random.number(100)).toEqual(49);
    expect(GW.random.number(100)).toEqual(54);

    GW.random.seed(12345);
    expect(GW.random.number(100)).toEqual(9);
    expect(GW.random.number(100)).toEqual(96);
    expect(GW.random.number(100)).toEqual(70);
    expect(GW.random.number(100)).toEqual(49);
    expect(GW.random.number(100)).toEqual(54);
  });

  test('gives random percents => [0, 1)', () => {
    always( () => expect(GW.random.value()).toBeWithin(0, 1) );
  });

  test('gives random numbers => [0, MAX)', () => {
    always( () => {
      const n = GW.random.number();
      expect(n).toBeWithin(0, Number.MAX_SAFE_INTEGER) 
      expect(n).toBeInteger();
    });
  });

  test('can give a random key from an object', () => {
    const source = {
      a: 1, b: 2, c: 3, d: 4
    };

    GW.random.seed(12345);
    expect(GW.random.key(source)).toEqual('a');
    GW.random.seed(2345678);
    expect(GW.random.key(source)).toEqual('b');
  });

});

describe('GW.cosmetic', () => {

  test('can give random numbers', () => {
    always( () => expect(GW.cosmetic.value()).toBeWithin(0, 1) );
  });
});

describe('GW.types.Range', () => {

  let r;

  test('Range', () => {
    r = new GW.range.Range(10,20,5);
    expect(r.lo).toEqual(10);
    expect(r.hi).toEqual(20);
    expect(r.clumps).toEqual(5);
    expect(r.value()).toBeInRange(10, 20);
  });

  test('can be made from strings', () => {
    r = GW.range.make('1-3');
    expect(r.lo).toEqual(1);
    expect(r.hi).toEqual(3);
    expect(r.clumps).toEqual(1);

    r = GW.range.make('3');
    expect(r.lo).toEqual(3);
    expect(r.hi).toEqual(3);
    expect(r.clumps).toEqual(1);
  });

  test('can be made from a number', () => {
    r = GW.range.make(3);
    expect(r.lo).toEqual(3);
    expect(r.hi).toEqual(3);
    expect(r.clumps).toEqual(1);
  });

  test('can be made with a semi-standard deviation', () => {
    r = GW.range.make('100~10');  // 100 +/- 10
    expect(r.lo).toEqual(80);
    expect(r.hi).toEqual(120);
    expect(r.clumps).toEqual(3);
  });
});
