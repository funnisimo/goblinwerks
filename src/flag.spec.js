
import * as GW from './index.js';

const Fl = GW.flag.fl;

describe('flag', () => {

  test('builds and decodes flags', () => {

    const Flag = GW.make.flag({
      A: Fl(0),
      B: Fl(1),
      C: Fl(2),
      D: Fl(3),
      AB: ' A , B ',
      BC: 'B|C',
      AD: ['A', 'D'],
    });

    expect(Flag.A).toEqual(1);
    expect(Flag.B).toEqual(2);
    expect(Flag.C).toEqual(4);
    expect(Flag.D).toEqual(8);
    expect(Flag.AB).toEqual(3);
    expect(Flag.BC).toEqual(6);
    expect(Flag.AD).toEqual(9);

    expect(Flag.toString(11)).toEqual('A | B | D');
    expect(Flag.toFlag('A')).toEqual(Flag.A);
    expect(Flag.toFlag('UNKNOWN')).toEqual(0);
    expect(Flag.toFlag('A | B')).toEqual(Flag.AB);

    expect(Flag.toFlag('2 | A')).toEqual(Flag.AB);
    expect(Flag.toFlag(Flag.D, '2 | A')).toEqual(Flag.D | Flag.A | Flag.B);
    expect(Flag.toFlag(Flag.AB, '!A')).toEqual(Flag.B);
    expect(Flag.toFlag(Flag.AB, '0, D')).toEqual(Flag.D);
  });
});
