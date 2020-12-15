
import * as GW from './index.js';

describe('frequency', () => {

  test('undefined', () => {
    const f = GW.make.frequency();
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(100);
    }
  });

  test('null', () => {
    const f = GW.make.frequency(null);
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(0);
    }
  });

  test('number - 100', () => {
    const f = GW.make.frequency(100);
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(100);
    }
  });

  test('number - 0', () => {
    const f = GW.make.frequency(0);
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(0);
    }
  });

  test('string - 1', () => {
    const f = GW.make.frequency('1');
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(i == 1 ? 100 : 0);
    }
  });

  test('string - 1:150', () => {
    const f = GW.make.frequency('1:150');
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(i == 1 ? 150 : 0);
    }
  });

  test('string - 1:50,2:100,3:150', () => {
    const f = GW.make.frequency('1:50, 2:100 | 3:150');
    for(let i = 0; i < 20; ++i) {
      if (i > 0 && i < 4) {
        expect(f(i)).toEqual(i * 50);
      }
      else {
        expect(f(i)).toEqual(0);
      }
    }
  });

  test('string - 5+', () => {
    const f = GW.make.frequency('5+');
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(i >= 5 ? 100 : 0);
    }
  });

  test('string - 1-5', () => {
    const f = GW.make.frequency('1-5');
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual( (i >= 1 && i <= 5) ? 100 : 0);
    }
  });

  test('object - { 1: 100 }', () => {
    const f = GW.make.frequency({ 1: 100 });
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(i == 1 ? 100 : 0);
    }
  });

  test('object - { 1-5: 150 }', () => {
    const f = GW.make.frequency({ '1-5': 150 });
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual( (i >= 1 && i <= 5) ? 150 : 0);
    }
  });

  test('object - { 5+: 150 }', () => {
    const f = GW.make.frequency({ '5+': 150 });
    for(let i = 0; i < 20; ++i) {
      expect(f(i)).toEqual(i >= 5 ? 150 : 0);
    }
  });

});
