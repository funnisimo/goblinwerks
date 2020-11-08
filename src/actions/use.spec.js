

import * as GW from '../index.js';


describe('Actions.use', () => {

  let actor;
  let map;
  let ctx;

  beforeEach( () => {
    actor = GW.make.actor({ name: 'actor' });
    map = GW.make.map(10, 10, 'FLOOR');
    map.addActor(5, 5, actor);

    GW.item.addKind('TEST', {
      name: 'thing',
      use: jest.fn(),
    });

    jest.spyOn(GW.message, 'add'); //.mockReturnValue(true);  // clear .mockReturnValue to see output
    GW.config.inventory = true;

    ctx = {
      map,
      x: actor.x,
      y: actor.y,
    };
  });

  afterEach( () => {
    delete GW.itemKinds.TEST;
    jest.restoreAllMocks();
  });


  test('nothing happens', async () => {
    GW.itemKinds.TEST.use = null;
    const item = GW.make.item('TEST');

    expect(await GW.actions.use(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).toHaveBeenCalled();
    expect(item.isDestroyed()).toBeFalsy();
  });

  test('kind use - succeeds', async () => {
    GW.itemKinds.TEST.use.mockReturnValue(true);
    const item = GW.make.item('TEST');

    expect(await GW.actions.use(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.quantity).toEqual(1);
    expect(item.isDestroyed()).toBeFalsy();
  });

  test('kind use - succeeds & reduces qty', async () => {
    GW.itemKinds.TEST.use.mockImplementation((item, actor, ctx) => {
      item.quantity = 0;
      return true;
    });
    const item = GW.make.item('TEST');

    expect(await GW.actions.use(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.quantity).toEqual(0);
    expect(item.isDestroyed()).toBeTruthy();
  });

  test('kind use - succeeds & destroys', async () => {
    GW.itemKinds.TEST.use.mockImplementation((item, actor, ctx) => {
      item.destroy();
      return true;
    });
    const item = GW.make.item('TEST');
    jest.spyOn(map, 'removeItem');
    jest.spyOn(actor, 'removeFromPack');

    expect(await GW.actions.use(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.isDestroyed()).toBeTruthy();
    expect(map.removeItem).toHaveBeenCalled();
    expect(actor.removeFromPack).toHaveBeenCalled();
  });

  test('kind use - fails', async () => {
    GW.itemKinds.TEST.use.mockReturnValue(false);
    const item = GW.make.item('TEST');

    expect(await GW.actions.use(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.quantity).toEqual(1);
    expect(item.isDestroyed()).toBeFalsy();
  });

  test('kind use - fails & destroys', async () => {
    GW.itemKinds.TEST.use.mockImplementation((item, actor, ctx) => {
      item.destroy();
      return false;
    });
    const item = GW.make.item('TEST');
    jest.spyOn(map, 'removeItem');
    jest.spyOn(actor, 'removeFromPack');

    expect(await GW.actions.use(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.isDestroyed()).toBeTruthy();
    expect(map.removeItem).not.toHaveBeenCalled();
    expect(actor.removeFromPack).not.toHaveBeenCalled();
  });

  test('destroy on use w/ qty > 1', async () => {
    GW.itemKinds.TEST.use.mockReturnValue(true);
    GW.itemKinds.TEST.flags |= GW.flags.itemKind.IK_DESTROY_ON_USE;
    const item = GW.make.item('TEST');
    item.quantity = 4;

    expect(await GW.actions.use(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.quantity).toEqual(3);
    expect(item.isDestroyed()).toBeFalsy();
  });

  test('destroy - in pack', async () => {
    GW.itemKinds.TEST.use.mockReturnValue(true);
    GW.itemKinds.TEST.flags |= GW.flags.itemKind.IK_DESTROY_ON_USE;
    const item = GW.make.item('TEST');
    actor.pack = item;

    expect(await GW.actions.use(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.quantity).toEqual(0);
    expect(item.isDestroyed()).toBeTruthy();
    expect(actor.pack).toBeNull();
  });

  test.todo('destroy - equipped');

  test('destroy - on ground', async () => {
    GW.itemKinds.TEST.use.mockReturnValue(true);
    GW.itemKinds.TEST.flags |= GW.flags.itemKind.IK_DESTROY_ON_USE;
    const item = GW.make.item('TEST');
    map.addItem(5, 5, item);
    expect(map.items).toBe(item);

    expect(await GW.actions.use(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(item.quantity).toEqual(0);
    expect(item.isDestroyed()).toBeTruthy();
    expect(map.items).toBeNull();
  });

});
