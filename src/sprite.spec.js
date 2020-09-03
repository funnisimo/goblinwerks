
const GW = require('../dist/gw.cjs');


describe('Sprite', () => {

  test('make', () => {
    const s = GW.make.sprite('@');
    expect(s.ch).toEqual('@');
    expect(s.fg).not.toBe(GW.colors.white); // cannot be a reference bc we change it on a plot
    expect(GW.color.css(s.fg)).toEqual('#ffffff');
    expect(s.bg).not.toBe(GW.colors.black);
    expect(GW.color.css(s.bg)).toEqual('#000000');
    expect(s.opacity).toEqual(100);
    expect(s.needsUpdate).toBeTruthy();
  });

  test('plot', () => {
    const s = GW.make.sprite('@', [100,0,0], [50,50,50]);
    const t = GW.make.sprite('$', [0, 100, 0], [0, 100, 50], 50);
    expect(t.opacity).toEqual(50);
    s.needsUpdate = false;

    s.plot(t);
    expect(s.needsUpdate).toBeTruthy();

    expect(s.ch).toEqual('$');
    expect(GW.color.css(s.fg)).toEqual('#00ff00');  // takes new fg
    expect(GW.color.css(s.bg)).toEqual('#40bf80');  // mixes bgs

  });
});
