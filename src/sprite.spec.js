
const GW = require('../dist/gw.cjs');

const CSS = GW.color.css;

describe('Sprite', () => {

  test('make', () => {

    const a = GW.make.sprite();
    expect(a.ch).toEqual(' ');
    expect(CSS(a.fg)).toEqual('#ffffff');
    expect(CSS(a.bg)).toEqual('#000000');
    expect(a.opacity).toEqual(100);
    expect(a.needsUpdate).toBeTruthy();

    const b = GW.make.sprite('@', 'green', 'blue', 50);
    expect(b.ch).toEqual('@');
    expect(b.fg).not.toBe(GW.colors.green); // cannot be a reference bc we change it on a plot
    expect(CSS(b.fg)).toEqual('#00ff00');
    expect(b.bg).not.toBe(GW.colors.blue);
    expect(CSS(b.bg)).toEqual('#0000ff');
    expect(b.opacity).toEqual(50);
    expect(b.needsUpdate).toBeTruthy();

    const d = GW.make.sprite('@', [100,0,0], null, 50);
    expect(d.ch).toEqual('@');
    expect(CSS(d.fg)).toEqual('#ff0000');
    expect(d.bg).toBeNull();
    expect(d.opacity).toEqual(50);

    const e = GW.make.sprite(null, null, 'green', 50);
    expect(e.ch).toBeNull();
    expect(e.fg).toBeNull();
    expect(CSS(e.bg)).toEqual('#00ff00');
    expect(e.opacity).toEqual(50);

  });

  test('plot', () => {
    const s = GW.make.sprite('@', [100,0,0], [50,50,50]);
    const t = GW.make.sprite('$', [0, 100, 0], [0, 100, 50], 50);
    expect(t.opacity).toEqual(50);
    s.needsUpdate = false;

    s.plot(t);
    expect(s.needsUpdate).toBeTruthy();

    expect(s.ch).toEqual('$');
    expect(CSS(s.fg)).toEqual('#00ff00');  // takes new fg
    expect(CSS(s.bg)).toEqual('#40bf80');  // mixes bgs

  });

  test('plotting w/o fg/bg', () => {
    const dest = GW.make.sprite();
    const tile = GW.make.sprite(null, null, 'green'); // bg
    const player = GW.make.sprite('@', 'white', null);

    dest.plot(tile);
    dest.plot(player);

    expect(dest.ch).toEqual('@');
    expect(CSS(dest.fg)).toEqual('#ffffff');
    expect(CSS(dest.bg)).toEqual('#00ff00');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

  test('plotting with opacity', () => {
    const dest = GW.make.sprite();
    const tile = GW.make.sprite(null, null, 'green'); // bg
    const player = GW.make.sprite('@', 'white', null);
    const fx = GW.make.sprite(null, null, 'red', 50);

    dest.plot(tile);
    dest.plot(player);
    dest.plot(fx);

    expect(dest.ch).toEqual('@');
    expect(CSS(dest.fg)).toEqual('#ffffff');
    expect(CSS(dest.bg)).toEqual('#808000');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

});
