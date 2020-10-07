
import * as GW from './index.js';


describe('tiles', () => {

  let map;
  let grid;
  let feat;
  let ctx;

  beforeEach( () => {
    map = GW.make.map(20, 20, { tile: 'FLOOR', boundary: 'WALL' });
    ctx = { map, x: 10, y: 10 };
    grid = null;
  });

  afterEach( () => {
    if (grid) GW.grid.free(grid);
    grid = null;
  });

  describe('BRIDGE', () => {
    test('has see through bg', () => {
      const tile = GW.tiles.BRIDGE;
      expect(tile.sprite.bg).toBeNull();
    });
  });

  describe('DOOR', () => {

    test('can do doors (open/close)', async () => {
      map.setTile(10, 10, 'DOOR');
      const cell = map.cell(10, 10);

      expect(cell.ground).toEqual('DOOR');
      await cell.fireEvent('enter', ctx);
      expect(cell.ground).toEqual('OPEN_DOOR');

      cell.clearFlags(0, GW.flags.cellMech.EVENT_FIRED_THIS_TURN);
      await cell.fireEvent('tick', ctx);
      expect(cell.ground).toEqual('DOOR');

      const kind = new GW.types.ItemKind({ name: 'Thing' });
      const item = GW.make.item(kind);

      cell.clearFlags(0, GW.flags.cellMech.EVENT_FIRED_THIS_TURN);
      await cell.fireEvent('enter', ctx);
      expect(cell.ground).toEqual('OPEN_DOOR');

      // drop item to block door
      map.addItem(10, 10, item);
      expect(cell.item).toBe(item);

      cell.clearFlags(0, GW.flags.cellMech.EVENT_FIRED_THIS_TURN);
      await cell.fireEvent('tick', ctx);
      expect(cell.ground).toEqual('OPEN_DOOR');

      map.removeItem(item);
      expect(cell.item).toBeNull();

      cell.clearFlags(0, GW.flags.cellMech.EVENT_FIRED_THIS_TURN);
      await cell.fireEvent('tick', ctx);
      expect(cell.ground).toEqual('DOOR');

      cell.clearFlags(0, GW.flags.cellMech.EVENT_FIRED_THIS_TURN);
      await cell.fireEvent('enter', ctx);
      expect(cell.ground).toEqual('OPEN_DOOR');

      const player = GW.make.player({ name: 'player' });
      map.addActor(10, 10, player);
      expect(cell.actor).toBe(player);

      cell.clearFlags(0, GW.flags.cellMech.EVENT_FIRED_THIS_TURN);
      await cell.fireEvent('tick', ctx);
      expect(cell.ground).toEqual('OPEN_DOOR');

    });

  });
});



describe('RL.Tile', () => {

  test('can be created from an object', () => {
    const tile = GW.tile.addKind('WALL', {
      name: 'Stone Wall',
      sprite: { ch: '#', fg: 'light_gray', bg: 'dark_gray' },
      flags: ['T_OBSTRUCTS_EVERYTHING'],
      priority: 90
    });

    expect(tile).toBeDefined();
    expect(GW.tiles.WALL).toBe(tile);

    expect(tile.flags).toEqual(GW.tile.flags.T_OBSTRUCTS_EVERYTHING);
    expect(tile.mechFlags).toEqual(0);
    expect(tile.sprite).toMatchObject({ ch: '#', fg: GW.colors.light_gray, bg: GW.colors.dark_gray });
    expect(tile.layer).toEqual(GW.tile.Layer.GROUND);
    expect(tile.events).toEqual({});
    expect(tile.priority).toEqual(90);
    expect(tile.name).toEqual('Stone Wall');

    expect(tile.getName()).toEqual('Stone Wall');
    expect(tile.getName('a')).toEqual('a Stone Wall');
    expect(tile.getName('the')).toEqual('the Stone Wall');
    expect(tile.getName(true)).toEqual('a Stone Wall');

    expect(tile.getName({ color: true })).toEqual(GW.text.format('%RStone Wall%R', GW.colors.light_gray, null));
    expect(tile.getName({ color: true, article: 'a' })).toEqual(GW.text.format('a %RStone Wall%R', GW.colors.light_gray, null));
    expect(tile.getName({ color: true, article: 'the' })).toEqual(GW.text.format('the %RStone Wall%R', GW.colors.light_gray, null));
    expect(tile.getName({ color: true, article: true })).toEqual(GW.text.format('a %RStone Wall%R', GW.colors.light_gray, null));

    expect(tile.getDescription()).toEqual(tile.getName());
  });

  test('can create tiles with see through bg', () => {
    const tile = GW.tile.addKind('TEST', {
      name: 'Test',
      sprite: { ch: '#', fg: 'light_gray', bg: null },
    });

    expect(tile.sprite.bg).toBeNull();
  });

  test('can extend another tile', () => {

    const wall = GW.tile.addKind('WALL', {
      name: 'Stone Wall',
      sprite: { ch: '#', fg: 'light_gray', bg: 'dark_gray' },
      flags: ['T_OBSTRUCTS_EVERYTHING'],
      priority: 90
    });

    expect(wall).toBeDefined();
    expect(GW.tiles.WALL).toBe(wall);

    const glassWall = GW.tile.addKind('GLASS_WALL', {
      Extends: 'WALL',
      name: 'Glass Wall',
      sprite: { ch: '+', fg: 'teal' },
      flags: ['!T_OBSTRUCTS_VISION']
    });

    expect(glassWall).toBeDefined();
    expect(GW.tiles.GLASS_WALL).toBe(glassWall);

    expect(glassWall.flags).not.toEqual(wall.flags);
    expect(glassWall.flags & GW.tile.flags.T_OBSTRUCTS_VISION).toBeFalsy();
    expect(glassWall.flags & GW.tile.flags.T_OBSTRUCTS_PASSABILITY).toBeTruthy();
    expect(glassWall.getName()).toEqual('Glass Wall');
    expect(glassWall.sprite).not.toBe(wall.sprite);
    expect(glassWall.sprite).toMatchObject({ ch: '+', fg: GW.colors.teal, bg: null });
  });

  test('can add multiple from an object', () => {
    GW.tile.addKinds({
      WALL: {
        name: 'Stone Wall',
        sprite: { ch: '#', fg: 'light_gray', bg: 'dark_gray' },
        flags: ['T_OBSTRUCTS_EVERYTHING'],
        priority: 90
      },
      GLASS_WALL: {
        Extends: 'WALL',
        name: 'Glass Wall',
        sprite: { fg: 'teal', bg: 'silver' },
        flags: ['!T_OBSTRUCTS_VISION']
      }
    });

    expect(GW.tiles.WALL.getName()).toEqual('Stone Wall');
    expect(GW.tiles.WALL.flags).toEqual(GW.tile.flags.T_OBSTRUCTS_EVERYTHING);
    expect(GW.tiles.GLASS_WALL.getName()).toEqual('Glass Wall');
    expect(GW.tiles.GLASS_WALL.flags & GW.tile.flags.T_OBSTRUCTS_VISION).toBeFalsy();
    expect(GW.tiles.GLASS_WALL.flags & GW.tile.flags.T_OBSTRUCTS_PASSABILITY).toBeTruthy();
  });

  test('can set the layer', () => {

    const carpet = GW.tile.addKind('CARPET', {
      name: 'Carpet',
      sprite: { ch: '+', fg: 'dark_red', bg: 'dark_teal' },
      priority: 10,
      layer: 'SURFACE'
    });

    expect(GW.tiles.CARPET).toBe(carpet);
    expect(carpet.layer).toEqual(GW.tile.Layer.SURFACE);
  });

  test('can use objects for activations', async () => {
    const carpet = GW.tile.addKind('CARPET', {
      name: 'Carpet',
      sprite: { ch: '+', fg: '#f66', bg: '#ff6' },
      events: {
        tick: { chance: 0, log: 'testing' },
      },
      layer: 'SURFACE'
    });

    expect(GW.tiles.CARPET).toBe(carpet);
    expect(carpet.events.tick).not.toBeNil();

    // expect(carpet.hasEvent('tick')).toBeTruthy();
    // expect(await carpet.fireEvent('tick')).toBeFalsy();
  });


  test('can be created by extending another tile', () => {
    const WALL = GW.tiles.WALL;
    expect(WALL).toBeDefined();

    const custom = GW.tile.addKind('CUSTOM', 'WALL', {
      sprite: { ch: '+', fg: 'white' },
      name: 'Custom Wall'
    });

    expect(custom.sprite).toMatchObject({ ch: '+', fg: GW.colors.white, bg: null });
    expect(custom.name).toEqual('Custom Wall');
  });

});
