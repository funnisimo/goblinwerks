
import * as GW from './index.js';


describe('Sprite', () => {

  test('make', () => {

    const a = GW.make.sprite();
    expect(a.ch).toEqual(' ');
    expect(a.fg.toString(true)).toEqual('#ffffff');
    expect(a.bg.toString(true)).toEqual('#000000');
    expect(a.opacity).toEqual(100);
    expect(a.needsUpdate).toBeTruthy();

    const b = GW.make.sprite('@', 'green', 'blue', 50);
    expect(b.ch).toEqual('@');
    expect(b.fg).not.toBe(GW.colors.green); // cannot be a reference bc we change it on a plot
    expect(b.fg.toString(true)).toEqual('#00ff00');
    expect(b.bg).not.toBe(GW.colors.blue);
    expect(b.bg.toString(true)).toEqual('#0000ff');
    expect(b.opacity).toEqual(50);
    expect(b.needsUpdate).toBeTruthy();

    const d = GW.make.sprite('@', [100,0,0], null, 50);
    expect(d.ch).toEqual('@');
    expect(d.fg.toString(true)).toEqual('#ff0000');
    expect(d.bg).toBeNull();
    expect(d.opacity).toEqual(50);

    const e = GW.make.sprite(null, null, 'green', 50);
    expect(e.ch).toBeNull();
    expect(e.fg).toBeNull();
    expect(e.bg.toString(true)).toEqual('#00ff00');
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

    s.drawSprite(t);
    expect(s.needsUpdate).toBeTruthy();

    expect(s.ch).toEqual('$');
    expect(s.fg.toString(true)).toEqual('#808000');  // mixes fgs
    expect(s.bg.toString(true)).toEqual('#40bf80');  // mixes bgs
  });

  test('plot with alpha', () => {
    const s = GW.make.sprite('@', [100,0,0], [50,50,50]);
    const t = GW.make.sprite('$', [0, 100, 0], [0, 100, 50], 50);
    expect(t.opacity).toEqual(50);
    s.needsUpdate = false;

    expect(s.fg.toString(true)).toEqual('#ff0000');
    expect(s.bg.toString(true)).toEqual('#808080');

    expect(t.fg.toString(true)).toEqual('#00ff00');
    expect(t.bg.toString(true)).toEqual('#00ff80');

    s.drawSprite(t, 50);
    expect(s.needsUpdate).toBeTruthy();

    expect(s.ch).toEqual('$');
    expect(s.fg.toString(true)).toEqual('#bf4000');  // mixes 50% of t fg
    expect(s.bg.toString(true)).toEqual('#61a180');  // mixes 50% of t bg
  });

  test('plotting w/o fg/bg', () => {
    const dest = GW.make.sprite();
    const tile = GW.make.sprite(null, null, 'green'); // bg
    const player = GW.make.sprite('@', 'white', null);

    dest.drawSprite(tile);
    dest.drawSprite(player);

    expect(dest.ch).toEqual('@');
    expect(dest.fg.toString(true)).toEqual('#ffffff');
    expect(dest.bg.toString(true)).toEqual('#00ff00');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

  test('plotting with opacity', () => {
    const dest = GW.make.sprite();
    const tile = GW.make.sprite('green'); // bg
    const player = GW.make.sprite('@');
    const fx = GW.make.sprite('red', 50);

    dest.drawSprite(tile);
    dest.drawSprite(player);
    dest.drawSprite(fx);

    expect(dest.ch).toEqual('@');
    expect(dest.fg.toString(true)).toEqual('#ffffff');
    expect(dest.bg.toString(true)).toEqual('#808000');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

  test('plotting just fg', () => {
    const dest = GW.make.sprite();
    const tile = GW.make.sprite('green'); // bg
    const player = GW.make.sprite('@');
    const fx = GW.make.sprite(null, 'red', 50);

    dest.drawSprite(tile);
    dest.drawSprite(player);
    dest.drawSprite(fx);

    expect(dest.ch).toEqual('@');
    expect(dest.fg.toString(true)).toEqual('#ff8080');  // (white + red) / 2
    expect(dest.bg.toString(true)).toEqual('#00ff00');
    expect(dest.opacity).toEqual(100);
    expect(dest.needsUpdate).toBeTruthy();
  });

  test('will track hanging letter changes in plotChar', () => {
    const s = GW.make.sprite('@', 'red');
    expect(s.wasHanging).toBeFalsy();
    s.draw('|');
    expect(s.wasHanging).toBeTruthy();
    s.draw('@');
    expect(s.wasHanging).toBeTruthy();
    s.draw('o');
    expect(s.wasHanging).toBeTruthy();  // does not get turned off automatically
    s.nullify();
    expect(s.wasHanging).toBeTruthy();  // does not get nullified

    s.wasHanging = false;
    s.draw('|');
    expect(s.wasHanging).toBeTruthy();
    s.nullify();
    expect(s.wasHanging).toBeTruthy();  // gets set
  });

  test('will track hanging letter changes in plot', () => {
    const s = GW.make.sprite('@', 'red');
    const t = GW.make.sprite('|', 'blue');
    const u = GW.make.sprite('o', 'orange');

    expect(s.wasHanging).toBeFalsy();
    s.drawSprite(t);
    expect(s.wasHanging).toBeTruthy();
    s.drawSprite(u);
    expect(s.wasHanging).toBeTruthy();
    s.drawSprite(u);
    expect(s.wasHanging).toBeTruthy();  // Not auto turned off
    s.nullify();
    expect(s.wasHanging).toBeTruthy();  // does not get cleared
  });

});
