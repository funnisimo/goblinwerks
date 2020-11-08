
import * as GW from '../index.js';


describe('Actions.pickup', () => {

  let item;
  let actor;
  let map;
  let ctx;

  beforeEach( () => {
    actor = GW.make.actor({ name: 'actor', flags: 'A_PICKUP' });
    map = GW.make.map(10, 10, 'FLOOR');
    map.addActor(5, 5, actor);

    GW.item.addKind('THING', {
      name: 'thing',
    });

    jest.spyOn(GW.message, 'add').mockReturnValue(true);  // clear .mockReturnValue to see output
    GW.config.inventory = true;

    item = GW.make.item('THING');
    map.addItem(5, 5, item);

    ctx = {
      map,
      x: actor.x,
      y: actor.y,
    };
  });

  afterEach( () => {
    delete GW.itemKinds.THING;
    jest.restoreAllMocks();
  });

  test('actor cannot pickup items', async () => {
    actor.kind.actionFlags = 0;
    expect(actor.hasActionFlag(GW.flags.action.A_PICKUP)).toBeFalsy();

    expect(await GW.actions.pickup(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).not.toHaveBeenCalled();
  });

  test('item cannot be picked up', async () => {
    expect(actor.hasActionFlag(GW.flags.action.A_PICKUP)).toBeTruthy();
    item.kind.actionFlags |= GW.flags.action.A_NO_PICKUP;

    expect(await GW.actions.pickup(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).toHaveBeenCalled();
  });

  test('inventory off - equip succeeds', async () => {
    GW.config.inventory = false;
    item.kind.slot = 'a';
    expect(map.items).toBe(item);

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).toHaveBeenCalled();
    expect(actor.pack).toBeNull();
    expect(actor.slots[item.kind.slot]).toBe(item);
    expect(map.items).toBeNull();
  });

  test('inventory off - equip swaps', async () => {
    GW.config.inventory = false;
    item.kind.slot = 'a';
    expect(map.items).toBe(item);

    const item2 = GW.make.item('THING');
    actor.slots[item.kind.slot] = item2;

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).toHaveBeenCalled();
    expect(actor.pack).toBeNull();
    expect(actor.slots[item.kind.slot]).toBe(item);
    expect(map.items).toBe(item2);
    expect(item2.x).toEqual(actor.x);
    expect(item2.y).toEqual(actor.y);
  });

  test('inventory off - equip fails', async () => {
    // e.g. Cursed item equipped
    GW.config.inventory = false;
    item.kind.slot = 'a';
    expect(map.items).toBe(item);

    const item2 = GW.make.item('THING');
    actor.slots[item.kind.slot] = item2;
    jest.spyOn(GW.actions, 'equip').mockReturnValue(false); // cannot equip - cursed item already equipped

    expect(await GW.actions.pickup(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).not.toHaveBeenCalled();  // handled in equip call (which we mock out)
    expect(actor.pack).toBeNull();
    expect(actor.slots[item.kind.slot]).toBe(item2);
    expect(map.items).toBe(item);
  });

  test('inventory off - use succeeds', async () => {
    GW.config.inventory = false;
    expect(map.items).toBe(item);

    jest.spyOn(GW.actions, 'use').mockReturnValue(true);

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled(); // handled in 'use'
    expect(actor.pack).toBeNull();
    expect(map.items).toBeNull();
  });

  test('inventory off - use fails', async () => {
    GW.config.inventory = false;
    expect(map.items).toBe(item);

    jest.spyOn(GW.actions, 'use');

    expect(await GW.actions.pickup(actor, item, ctx)).toBeFalsy();
    expect(GW.actions.use).toHaveBeenCalled();
    expect(GW.message.add).toHaveBeenCalled(); // Nothing happens
    expect(actor.pack).toBeNull();
    expect(map.items).toBe(item);
  });

  test('kind pickup - succeeds', async () => {
    expect(map.items).toBe(item);
    item.kind.pickup = jest.fn().mockReturnValue(true);

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).toHaveBeenCalled();
    expect(actor.pack).toBeNull();  // custom functions have to handle adding to pack
    expect(map.items).toBeNull();
  });

  test('kind pickup - fails', async () => {
    expect(map.items).toBe(item);
    item.kind.pickup = jest.fn().mockReturnValue(false);

    expect(await GW.actions.pickup(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(actor.pack).toBeNull();
    expect(map.items).toBe(item);
  });

  test('addToPack - success', async () => {
    expect(map.items).toBe(item);

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).toHaveBeenCalled();
    expect(actor.pack).toBe(item);
    expect(map.items).toBeNull();
  });

  test('addToPack - fails', async () => {
    expect(map.items).toBe(item);

    jest.spyOn(actor, 'addToPack').mockReturnValue(false);

    expect(await GW.actions.pickup(actor, item, ctx)).toBeFalsy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(actor.pack).toBeNull();
    expect(map.items).toBe(item);
  });

  test('equip on pickup', async () => {
    item.kind.flags |= GW.flags.itemKind.IK_EQUIP_ON_PICKUP;
    item.kind.slot = 'a';
    expect(map.items).toBe(item);

    jest.spyOn(GW.actions, 'equip');

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.actions.equip).toHaveBeenCalled();
    expect(GW.message.add).toHaveBeenCalled();  // Nothing happens in use
    expect(actor.pack).toBe(item);
    expect(map.items).toBeNull();
    expect(actor.slots[item.kind.slot]).toBe(item);
  });

  test('use on pickup', async () => {
    item.kind.flags |= GW.flags.itemKind.IK_USE_ON_PICKUP;
    expect(map.items).toBe(item);

    jest.spyOn(GW.actions, 'use');

    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.actions.use).toHaveBeenCalled();
    expect(GW.message.add).toHaveBeenCalled();  // Nothing happens in use
    expect(actor.pack).toBe(item);
    expect(map.items).toBeNull();
  });

  test('quiet', async () => {
    expect(map.items).toBe(item);

    ctx.quiet = true;
    expect(await GW.actions.pickup(actor, item, ctx)).toBeTruthy();
    expect(GW.message.add).not.toHaveBeenCalled();
    expect(actor.pack).toBe(item);
    expect(map.items).toBeNull();
  });

});
