
import * as GW from './index.js';

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

    const f = GW.make.sprite('@', null, null, 50);
    expect(f.ch).toEqual('@');
    expect(f.fg).toBeNull();
    expect(f.bg).toBeNull();
    expect(f.opacity).toEqual(50);

    const g = GW.make.sprite({ ch: '@', fg: 'green'});
    expect(g.ch).toEqual('@');
    expect(g.fg).toEqual(GW.colors.green);
    expect(g.bg).toBeNull();
    expect(g.opacity).toEqual(100);

    const h = GW.make.sprite();
    expect(h.ch).toEqual(' ');
    expect(h.fg).toEqual(GW.colors.white);
    expect(h.bg).toEqual(GW.colors.black);
    expect(h.opacity).toEqual(100);

    const i = GW.make.sprite(null);
    expect(i.ch).toBeNull();
    expect(i.fg).toBeNull();
    expect(i.bg).toBeNull();
    expect(i.opacity).toEqual(100);

    const j = GW.make.sprite(undefined);
    expect(j.ch).toEqual(' ');
    expect(j.fg).toEqual(GW.colors.white);
    expect(j.bg).toEqual(GW.colors.black);
    expect(j.opacity).toEqual(100);

    const k = GW.make.sprite(['$', 'blue']);
    expect(k.ch).toEqual('$');
    expect(k.fg).toEqual(GW.colors.blue);
    expect(k.bg).toBeNull();
    expect(k.opacity).toEqual(100);

    const l = GW.make.sprite(['blue']);
    expect(l.ch).toBeNull();
    expect(l.fg).toBeNull();
    expect(l.bg).toEqual(GW.colors.blue);
    expect(l.opacity).toEqual(100);

  });

  test('copy', () => {
    const b = GW.make.sprite('@', 'green', 'blue', 50);

    b.copy({ ch: '!' });
    expect(b.ch).toEqual('!');
    expect(b.fg).toEqual(GW.colors.green);
    expect(b.bg).toEqual(GW.colors.blue);
    expect(b.opacity).toEqual(50);

    b.copy({ fg: 'red' });
    expect(b.ch).toEqual('!');
    expect(b.fg).toEqual(GW.colors.red);
    expect(b.bg).toEqual(GW.colors.blue);

    b.copy({ fg: 'white', bg: null });
    expect(b.ch).toEqual('!');
    expect(b.fg).toEqual(GW.colors.white);
    expect(b.bg).toBeNull();

    b.copy({ fg: 'red', bg: 'blue' });
    expect(b.ch).toEqual('!');
    expect(b.fg).toEqual(GW.colors.red);
    expect(b.bg).toEqual(GW.colors.blue);

  });

  test('plot', () => {
    const s = GW.make.sprite('@', [100,0,0], [50,50,50]);
    const t = GW.make.sprite('$', [0, 100, 0], [0, 100, 50], 50);
    expect(t.opacity).toEqual(50);
    s.needsUpdate = false;

    s.plot(t);
    expect(s.needsUpdate).toBeTruthy();

    expect(s.ch).toEqual('$');
    expect(CSS(s.fg)).toEqual('#808000');  // mixes fgs
    expect(CSS(s.bg)).toEqual('#40bf80');  // mixes bgs
  });

  test('plot with alpha', () => {
    const s = GW.make.sprite('@', [100,0,0], [50,50,50]);
    const t = GW.make.sprite('$', [0, 100, 0], [0, 100, 50], 50);
    expect(t.opacity).toEqual(50);
    s.needsUpdate = false;

    s.plot(t, 50);
    expect(s.needsUpdate).toBeTruthy();

    expect(s.ch).toEqual('$');
    expect(CSS(s.fg)).toEqual('#bf4000');  // mixes 50% of t fg
    expect(CSS(s.bg)).toEqual('#5e9e80');  // mixes 50% of t bg
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
    const tile = GW.make.sprite('green'); // bg
    const player = GW.make.sprite('@');
    const fx = GW.make.sprite('red', 50);

    dest.plot(tile);
    dest.plot(player);
    dest.plot(fx);

    expect(dest.ch).toEqual('@');
    expect(CSS(dest.fg)).toEqual('#ffffff');
    expect(CSS(dest.bg)).toEqual('#808000');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

  test('plotting just fg', () => {
    const dest = GW.make.sprite();
    const tile = GW.make.sprite('green'); // bg
    const player = GW.make.sprite('@');
    const fx = GW.make.sprite(null, 'red', 50);

    dest.plot(tile);
    dest.plot(player);
    dest.plot(fx);

    expect(dest.ch).toEqual('@');
    expect(CSS(dest.fg)).toEqual('#ff8080');  // (white + red) / 2
    expect(CSS(dest.bg)).toEqual('#00ff00');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

  test('will track hanging letter changes in plotChar', () => {
    const s = GW.make.sprite('@', 'red');
    expect(s.wasHanging).toBeFalsy();
    s.plotChar('|');
    expect(s.wasHanging).toBeTruthy();
    s.plotChar('@');
    expect(s.wasHanging).toBeTruthy();
    s.plotChar('o');
    expect(s.wasHanging).toBeTruthy();  // does not get turned off automatically
    s.nullify();
    expect(s.wasHanging).toBeTruthy();  // does not get nullified

    s.wasHanging = false;
    s.plotChar('|');
    expect(s.wasHanging).toBeTruthy();
    s.nullify();
    expect(s.wasHanging).toBeTruthy();  // gets set
  });

  test('will track hanging letter changes in plot', () => {
    const s = GW.make.sprite('@', 'red');
    const t = GW.make.sprite('|', 'blue');
    const u = GW.make.sprite('o', 'orange');

    expect(s.wasHanging).toBeFalsy();
    s.plot(t);
    expect(s.wasHanging).toBeTruthy();
    s.plot(u);
    expect(s.wasHanging).toBeTruthy();
    s.plot(u);
    expect(s.wasHanging).toBeTruthy();  // Not auto turned off
    s.nullify();
    expect(s.wasHanging).toBeTruthy();  // does not get cleared
  });

});
