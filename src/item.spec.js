
import * as GW from './index.js';


describe('GW.item', () => {

  let BOX;
  let MAP;

  beforeAll( () => {
    BOX = GW.item.addKind('BOX', {
      name: 'box',
      description: 'a large wooden box',
      sprite: { ch: '#', fg: 'brown' },
      flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, IK_BLOCKS_MOVE',
      stats: { health: 10 }
    });
  });

  beforeEach( () => {
    MAP = GW.make.map(10, 10, { tile: 'FLOOR', boundary: 'WALL' });
  })

  afterAll( () => {
    delete GW.items.BOX;
  });

  describe('ItemKind', () => {

    test('Basic create', () => {
      expect(GW.itemKinds.BOX).toBe(BOX);
      expect(BOX.flags).toBeGreaterThan(0);
      expect(BOX.stats.health).toEqual(10);
      expect(BOX.description).toEqual('a large wooden box');
      expect(BOX.name).toEqual('box');
      expect(BOX.sprite.ch).toEqual('#');
      expect(BOX.sprite.fg).toEqual(GW.colors.brown);
      expect(BOX.sprite.bg).toBeNull();
      expect(BOX.sprite.opacity).toEqual(100);
      expect(GW.color.css(BOX.sprite.fg)).toEqual(GW.color.css(GW.colors.brown));

      expect(BOX.actionFlags & GW.flags.action.A_PUSH).toBeTruthy();
      expect(BOX.actionFlags & GW.flags.action.A_PULL).toBeTruthy();
      expect(BOX.actionFlags & GW.flags.action.A_SLIDE).toBeTruthy();
      expect(BOX.actionFlags & GW.flags.action.A_GRABBABLE).toBeTruthy();
      expect(BOX.actionFlags & GW.flags.action.A_USE).toBeFalsy();

      expect(BOX.flags & GW.flags.itemKind.IK_BLOCKS_MOVE).toBeTruthy();
      expect(BOX.flags & GW.flags.itemKind.IK_BLOCKS_VISION).toBeFalsy();
    });

  });

  describe('Item', () => {
    test('basic create', async () => {
      const ITEM = GW.make.item('BOX');
      expect(ITEM.kind).toBe(BOX);
      expect(ITEM.stats.health).toBeGreaterThan(0);

      // MAP.dump();

      expect(MAP.items).toBeNull();
      MAP.addItem(3, 4, ITEM);
      expect(ITEM.x).toEqual(3);
      expect(ITEM.y).toEqual(4);
      expect(MAP.itemAt(3, 4)).toBe(ITEM);
      expect(MAP.items).toBe(ITEM);

      expect(await ITEM.applyDamage(20)).toEqual(10);
      expect(ITEM.isDestroyed()).toBeTruthy();
      expect(MAP.itemAt(3, 4)).toBe(ITEM);  // does not remove from map
      MAP.removeItem(ITEM);
      expect(MAP.itemAt(3, 4)).toBe(null);
      expect(MAP.items).toBeNull();
    });
  });

});
