
import * as GW from './index.js';


describe('FX', () => {

  test('will show up in a cell', async () => {

    GW.cosmetic.seed(12345);

    const m = GW.make.map(20, 20, { tile: 'FLOOR', boundary: 'WALL' });
    const cell = m.cell(2, 2);
    expect(cell.sprites).toBeNull();

    const sprite = GW.make.sprite();
    GW.map.getCellAppearance(m, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles.FLOOR.sprite.ch);
    expect(sprite.fg.css()).toEqual('#5c5c5c');
    expect(sprite.bg.css()).toEqual('#05051a');

    const hit = GW.make.sprite('!', 'red');
    let resolved = false;
    const p = GW.fx.flashSprite(m, 2, 2, hit, 100).then( () => resolved = true );

    expect(cell.sprites).not.toBeNull();
    expect(cell.sprites.sprite).toBe(hit);
    expect(cell.flags & GW.flags.cell.NEEDS_REDRAW).toBeTruthy();
    expect(m.flags & GW.flags.map.MAP_CHANGED).toBeTruthy();

    GW.map.getCellAppearance(m, 2, 2, sprite);
    expect(sprite.ch).toEqual(hit.ch);
    expect(sprite.fg).toEqual(hit.fg);
    expect(sprite.bg.css()).toEqual('#05051a');

    GW.fx.tick(101);
    expect(cell.sprites).toBeNull();

    GW.map.getCellAppearance(m, 2, 2, sprite);
    expect(sprite.ch).toEqual(GW.tiles.FLOOR.sprite.ch);
    expect(sprite.fg.css()).toEqual('#4f4f4f'); // cosmetic difference
    expect(sprite.bg.css()).toEqual('#08051a'); // cosmetic difference

    expect(resolved).toBeFalsy();
    await p;
    expect(resolved).toBeTruthy();

  });

});
