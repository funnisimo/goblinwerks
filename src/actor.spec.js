
import * as GW from './index.js';


describe('actor', () => {

  let actor;

  beforeAll( () => {
    GW.item.addKind('OTHER', {
      name: 'other thing',
    });

    GW.item.addKind('THING', {
      name: 'thing',
      slot: 'a',
    });

    GW.item.addKind('THING_STACKABLE', {
      name: 'stackable thing',
      flags: 'IK_STACKABLE',
      slot: 'b',
    });

  });

  afterAll( () => {
    delete GW.itemKinds.OTHER;
    delete GW.itemKinds.THING;
    delete GW.itemKinds.THING_STACKABLE;
  });

  describe('inventory', () => {

    beforeEach( () => {
      actor = GW.make.actor({ name: 'test' });
    });

    test('actor has no inventory by default', () => {
      expect(actor.pack).toBeNull();
    });

    test('can add an item to inventory', () => {
      const item = GW.make.item('THING');
      const r = actor.addToPack(item);
      expect(r).toBeTruthy();
      expect(actor.pack).toBe(item);
      expect(item.next).toBeNull();
    });

    test('can remove from inventory', () => {
      const item = GW.make.item('THING');
      actor.addToPack(item);
      expect(actor.pack).toBe(item);
      const r  = actor.removeFromPack(item);
      expect(r).toBeTruthy();
      expect(actor.pack).toBeNull();
    });

    test('can add multiple items to inventory', () => {
      const item1 = GW.make.item('THING');
      let r = actor.addToPack(item1);
      expect(r).toBeTruthy();
      expect(actor.pack).toBe(item1);
      expect(item1.next).toBeNull();

      const item2 = GW.make.item('THING');
      r = actor.addToPack(item2);
      expect(r).toBeTruthy();
      expect(actor.pack).toBe(item2);
      expect(item2.next).toBe(item1);
      expect(item1.next).toBe(null);
    });

    test('can remove last item', () => {
      const item1 = GW.make.item('THING');
      let r = actor.addToPack(item1);
      const item2 = GW.make.item('THING');
      r = actor.addToPack(item2);

      expect(actor.pack).toBe(item2);
      expect(item2.next).toBe(item1);
      expect(item1.next).toBe(null);

      r = actor.removeFromPack(item1);
      expect(r).toBeTruthy();
      expect(actor.pack).toBe(item2);
      expect(item2.next).toBeNull();
      expect(item1.next).toBeNull();
    });

    test('can remove first item', () => {
      const item1 = GW.make.item('THING');
      let r = actor.addToPack(item1);
      const item2 = GW.make.item('THING');
      r = actor.addToPack(item2);

      expect(actor.pack).toBe(item2);
      expect(item2.next).toBe(item1);
      expect(item1.next).toBe(null);

      r = actor.removeFromPack(item2);
      expect(r).toBeTruthy();
      expect(actor.pack).toBe(item1);
      expect(item2.next).toBeNull();
      expect(item1.next).toBeNull();
    });

    test('can iterate pack', () => {
      const item1 = GW.make.item('THING');
      let r = actor.addToPack(item1);
      const item2 = GW.make.item('THING');
      r = actor.addToPack(item2);

      const fn = jest.fn();
      actor.eachPack(fn);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith(item1);
      expect(fn).toHaveBeenCalledWith(item2);
    });

  });

  describe('equipment', () => {

    beforeEach( () => {
      actor = GW.make.actor({ name: 'test' });
    });

    test('actor has no equipment by default', () => {
      expect(actor.slots).toEqual({});
    });

    test('will not equip something that has no slot', () => {
      const other = GW.make.item('OTHER');
      expect(actor.equip(other)).toBeFalsy();
    });

    test('will equip something with a slot', () => {
      const thing = GW.make.item('THING');
      expect(actor.equip(thing)).toBeTruthy();
      expect(actor.slots.a).toBe(thing);
    });

    test('will not equip something with a filled slot', () => {
      const thing = GW.make.item('THING');
      expect(actor.equip(thing)).toBeTruthy();
      expect(actor.slots.a).toBe(thing);

      const thing2 = GW.make.item('THING');
      expect(actor.equip(thing2)).toBeFalsy();
      expect(actor.slots.a).toBe(thing);
    });

    test('can unequip by slot name', () => {
      const thing = GW.make.item('THING');
      expect(actor.equip(thing)).toBeTruthy();
      expect(actor.slots.a).toBe(thing);

      expect(actor.unequipSlot('b')).toBeFalsy();
      expect(actor.unequipSlot('a')).toBe(thing);
      expect(actor.slots.a).toBeNull();
    });

    test('can iterate equipment', () => {
      const thing = GW.make.item('THING');
      expect(actor.equip(thing)).toBeTruthy();

      const thing2 = GW.make.item('THING_STACKABLE');
      expect(actor.equip(thing2)).toBeTruthy();

      expect(actor.slots.a).toBe(thing);
      expect(actor.slots.b).toBe(thing2);

      const fn = jest.fn();
      actor.eachEquip(fn);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn.mock.calls[0]).toEqual([thing]);
      expect(fn.mock.calls[1]).toEqual([thing2]);
    });

  });
});
