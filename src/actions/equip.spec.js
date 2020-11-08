
import * as GW from '../index.js';

describe('Actions', () => {

  let actor;
  let map;
  let ctx;

  beforeEach( () => {
    actor = GW.make.actor({ name: 'actor' });
    map = GW.make.map(10, 10, 'FLOOR');
    map.addActor(5, 5, actor);

    GW.item.addKind('TEST', {
      name: 'thing',
      slot: 'a',
    });

    jest.spyOn(GW.message, 'add').mockReturnValue(true);  // clear .mockReturnValue to see output
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

  describe('equip', () => {

    test('no item', async () => {
      expect(await GW.actions.equip(actor, null)).toBeFalsy();
      expect(GW.message.add).not.toHaveBeenCalled();
    });

    test('not equippable - no slot', async () => {
      GW.itemKinds.TEST.slot = null;
      const item = GW.make.item('TEST');
      expect(await GW.actions.equip(actor, item)).toBeFalsy();
      expect(GW.message.add).toHaveBeenCalled();
    });

    test('equip - already equipped', async () => {
      const item1 = GW.make.item('TEST');
      actor.pack = item1;
      actor.slots[item1.kind.slot] = item1;
      jest.spyOn(GW.actions, 'unequip').mockReturnValue(false);

      expect(await GW.actions.equip(actor, item1)).toBeFalsy();
      expect(GW.actions.unequip).not.toHaveBeenCalled();
      expect(GW.message.add).toHaveBeenCalled();

      expect(actor.slots[item1.kind.slot]).toBe(item1);
    });

    test('unequip - fails', async () => {
      const item1 = GW.make.item('TEST');
      const item2 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;

      jest.spyOn(GW.actions, 'unequip').mockReturnValue(false);

      expect(await GW.actions.equip(actor, item2)).toBeFalsy();
      expect(GW.message.add).not.toHaveBeenCalled();  // logging handled by GW.actions.unequip
      expect(GW.actions.unequip).toHaveBeenCalledWith(actor, item1.kind.slot, expect.objectContaining({ quiet: true }));
      expect(actor.slots[item1.kind.slot]).toBe(item1);
    });

    test('actor equip - fails', async () => {
      const item1 = GW.make.item('TEST');
      actor.pack = item1;
      jest.spyOn(actor, 'equip').mockReturnValue(false);
      jest.spyOn(GW.actions, 'unequip').mockReturnValue(false);

      expect(await GW.actions.equip(actor, item1)).toBeFalsy();
      expect(GW.actions.unequip).not.toHaveBeenCalled();
      expect(GW.message.add).toHaveBeenCalled();

      expect(actor.slots[item1.kind.slot]).toBeUndefined();
    });

    test('actor equip fails - after unequip', async () => {
      const item1 = GW.make.item('TEST');
      const item2 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;

      jest.spyOn(actor, 'equip').mockReturnValue(false);

      expect(await GW.actions.equip(actor, item2)).toBeFalsy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBeNull();
      expect(map.items).toBeNull();
    });

    test('no inventory - unequipped, fails', async () => {
      GW.config.inventory = false;

      const item1 = GW.make.item('TEST');
      const item2 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;

      jest.spyOn(actor, 'equip').mockReturnValue(false);
      jest.spyOn(GW.actions, 'unequip');

      expect(await GW.actions.equip(actor, item2, ctx)).toBeFalsy();
      expect(GW.actions.unequip).toHaveBeenCalled();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBeNull();
      expect(map.items).toBe(item1);  // dropped 1
      expect(item1.next).toBeNull();  // ... but not 2
    });

    test('succeeds', async () => {
      const item1 = GW.make.item('TEST');
      expect(await GW.actions.equip(actor, item1, ctx)).toBeTruthy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(item1);
    });

    test('succeeds - after unequip', async () => {
      const item1 = GW.make.item('TEST');
      const item2 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item2;

      expect(await GW.actions.equip(actor, item1, ctx)).toBeTruthy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(item1);
      expect(map.items).toBeNull();
    });

    test('succeeds - no inventory, after unequip', async () => {
      GW.config.inventory = false;
      const item1 = GW.make.item('TEST');
      const item2 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item2;

      expect(await GW.actions.equip(actor, item1, ctx)).toBeTruthy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(item1);
      expect(map.items).toBe(item2);
    });

    test('quiet', async () => {
      const item1 = GW.make.item('TEST');
      ctx.quiet = true;
      expect(await GW.actions.equip(actor, item1, ctx)).toBeTruthy();
      expect(GW.message.add).not.toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(item1);
    });

  });

  describe('unequip', () => {

    test('no item', async () => {
      expect(await GW.actions.unequip(actor, null)).toBeFalsy();
      expect(GW.message.add).not.toHaveBeenCalled();
    });

    test('item no slot', async () => {
      GW.itemKinds.TEST.slot = null;
      const item = GW.make.item('TEST');
      expect(await GW.actions.unequip(actor, item)).toBeFalsy();
      expect(GW.message.add).toHaveBeenCalled();
    });

    test('unequip slot - succeeds', async () => {
      const item1 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;
      actor.pack = item1;

      expect(await GW.actions.unequip(actor, item1.kind.slot)).toBeTruthy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(null);
      expect(actor.pack).toBe(item1);
      expect(map.items).toBeNull(); // did not add to map
    });

    test.todo('cursed item - cannot unequip');

    test('unequip item - succeeds', async () => {
      const item1 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;
      actor.pack = item1;

      expect(await GW.actions.unequip(actor, item1)).toBeTruthy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(null);
      expect(actor.pack).toBe(item1);
      expect(map.items).toBeNull(); // did not add to map
    });

    test('unequip item - not equipped, but slot is', async () => {
      const item1 = GW.make.item('TEST');
      const item2 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;

      expect(await GW.actions.unequip(actor, item2)).toBeFalsy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(item1);
    });

    test('unequip item - not equipped', async () => {
      const item1 = GW.make.item('TEST');

      expect(await GW.actions.unequip(actor, item1)).toBeFalsy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBeUndefined();
    });

    test('no inventory', async () => {
      GW.config.inventory = false;

      const item1 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;

      expect(await GW.actions.unequip(actor, item1, ctx)).toBeTruthy();
      expect(GW.message.add).toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(null);
      expect(actor.pack).toBeNull();
      expect(map.items).toBe(item1);
      expect(item1.x).toEqual(actor.x);
      expect(item1.y).toEqual(actor.y);
    });

    test('quiet', async () => {
      const item1 = GW.make.item('TEST');
      actor.slots[item1.kind.slot] = item1;
      actor.pack = item1;

      ctx.quiet = true;
      expect(await GW.actions.unequip(actor, item1, ctx)).toBeTruthy();
      expect(GW.message.add).not.toHaveBeenCalled();
      expect(actor.slots[item1.kind.slot]).toBe(null);
      expect(actor.pack).toBe(item1);
      expect(map.items).toBeNull(); // did not add to map
    });

  });
});
