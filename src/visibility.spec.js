
import * as GW from './index.js';
import * as UTILS from '../test/utils.js';


describe('visibility', () => {

  let map;

  beforeAll( () => {
    GW.config.fov = true;
  });

  beforeEach( () => {
    map = GW.make.map(20, 20, { tile: 'FLOOR', boundary: 'WALL' });
  });

  afterAll(() => {
    GW.config.fov = false;
  });

  test('maps are visible by default', () => {
    map.forEach( (c) => {
      expect(c.isAnyKindOfVisible()).toBeTruthy();
    });
  });

  test('everything is visible after basic calculation (no vision blockers)', () => {
    expect(map.cell(2, 2).hasVisibleLight()).toBeTruthy();
    GW.visibility.update(map, 10, 10);
    expect(map.cell(2, 2).hasVisibleLight()).toBeTruthy();
    // map.dump( (c) => (c.flags & GW.flags.cell.IN_FOV) ? c.dump() : '/');
    // map.dump( (c) => (c.flags & GW.flags.cell.VISIBLE) ? c.dump() : '/');
    map.forEach( (c) => {
      expect(c.flags & GW.flags.cell.IN_FOV).toBeTruthy();
      expect(c.flags & GW.flags.cell.VISIBLE).toBeTruthy();
      expect(c.isVisible()).toBeTruthy();
    });
  });

  test('visibility is blocked by walls', () => {

    map.setTile(8, 10, 'WALL');
    GW.visibility.update(map, 10, 10);
    // map.dump( (c) => (c.flags & GW.flags.cell.IN_FOV) ? c.dump() : '/');
    expect(map.isVisible(8, 10)).toBeTruthy();
    expect(map.isVisible(7, 10)).toBeFalsy();
  });

});
