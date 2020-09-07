
const GW = require('../dist/gw.cjs');


describe('FX', () => {

  test('will show up in a cell', async () => {

    const m = GW.make.map(20, 20, { tile: 1, boundary: 6 });

    const sprite = GW.make.sprite();

    GW.map.getCellAppearance(m, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles[1].sprite.ch);
    expect(sprite.fg).toEqual(GW.tiles[1].sprite.fg);
    expect(sprite.bg).toEqual(GW.tiles[1].sprite.bg);

    const hit = GW.make.sprite('!', 'red');
    let resolved = false;
    const p = GW.fx.flashSprite(m, 2, 2, hit, 100).then( () => resolved = true );

    const cell = m.cell(2, 2);
    expect(cell.flags & GW.flags.cell.HAS_FX).toBeTruthy();
    expect(cell.flags & GW.flags.cell.NEEDS_REDRAW).toBeTruthy();
    expect(m.flags & GW.flags.map.MAP_CHANGED).toBeTruthy();
    expect(m.fx).toHaveLength(1);

    GW.map.getCellAppearance(m, 2, 2, sprite);
    expect(sprite.ch).toEqual(hit.ch);
    expect(sprite.fg).toEqual(hit.fg);
    expect(sprite.bg).toEqual(GW.tiles[1].sprite.bg);

    m.fx[0].tick(101);
    expect(cell.flags & GW.flags.cell.HAS_FX).toBeFalsy();
    expect(m.fx).toHaveLength(0);

    GW.map.getCellAppearance(m, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles[1].sprite.ch);
    expect(sprite.fg).toEqual(GW.tiles[1].sprite.fg);
    expect(sprite.bg).toEqual(GW.tiles[1].sprite.bg);

    expect(resolved).toBeFalsy();
    await p;
    expect(resolved).toBeTruthy();

  });

});
