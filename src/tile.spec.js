
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
