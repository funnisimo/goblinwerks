
import * as GW from './index.js';

describe('flavor', () => {

  describe('getFlavorText', () => {

    let map;
    let flavor;

    beforeAll( () => {
      GW.tile.addKind('DESK', {
        name: 'desk', article: 'a',
        ch: 'T', fg: 'brown',
        flags: 'T_OBSTRUCTS_PASSABILITY',
        layer: 'SURFACE'
      });

      GW.item.addKind('STAPLER', {
        name: 'stapler', article: 'a',
        ch: '-', fg: 'red',
      });
    });

    afterAll(() => {
      delete GW.tiles.DESK;
      delete GW.itemKinds.STAPLER;
    });

    beforeEach( () => {
      map = GW.make.map(10, 10, 'FLOOR');
    });

    test('will give ground information', () => {
      flavor = GW.flavor.getFlavorText(map, 5, 5);
      expect(GW.text.removeColors(flavor)).toEqual('you see the floor.');
    });

    test('will give surface + ground information', () => {
      map.setTile(4, 4, 'DESK');
      flavor = GW.flavor.getFlavorText(map, 4, 4);
      expect(GW.text.removeColors(flavor)).toEqual('you see a desk on the floor.');

      map.setTile(5, 5, 'BRIDGE');
      flavor = GW.flavor.getFlavorText(map, 5, 5);
      expect(GW.text.removeColors(flavor)).toEqual('you see a bridge over the floor.');
    });

    test('will give you item information', () => {
      const item = GW.make.item('STAPLER');
      map.setTile(4, 4, 'DESK');
      map.addItem(4, 4, item);

      flavor = GW.flavor.getFlavorText(map, 4, 4);
      expect(GW.text.removeColors(flavor)).toEqual('you see a stapler on a desk on the floor.');

    });

  });
});
