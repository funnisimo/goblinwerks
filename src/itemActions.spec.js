
import * as GW from './index.js';

describe('itemActions', () => {

  describe('bash', () => {

    let flashSprite;

    beforeEach( () => {
      flashSprite = jest.spyOn(GW.fx, 'flashSprite').mockReturnValue(true);
    });

    afterEach( () => {
      flashSprite.mockRestore();
    });

    test('allows adding a corpse', async () => {

      const map = GW.make.map(20, 20, 'FLOOR');
      const effect = jest.fn();

      const box2 = GW.item.addKind('BOX2', {
      	name: 'box',
      	description: 'a large wooden box',
      	sprite: { ch: '\u2612', fg: 'light_brown' },
      	flags: 'A_PUSH, A_PULL, A_SLIDE, A_NO_PICKUP, A_BASH, IK_BLOCKS_MOVE',
        corpse: effect,
      	stats: { health: 8 }
      });

      expect(box2.corpse.fn).toBe(effect);

      const item = GW.make.item(box2);
      expect(item.kind).toBe(box2);
      expect(item.stats.health).toEqual(8);
      item.stats.health = 1;

      map.addItem(10, 10, item);

      await GW.itemActions.bash(item, null, { map, x: 10, y: 10 });

      expect(item.isDestroyed()).toBeTruthy();
      expect(map.itemAt(10,10)).toBeNull();
      expect(effect).toHaveBeenCalled();

    });
  });
});
