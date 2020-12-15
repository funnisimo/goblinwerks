
import * as GW from './index.js';


describe('horde', () => {

  beforeAll(() => {
    GW.actor.addKind('GOBLIN', {
      name: 'Goblin', ch: 'g', fg: 'green',
    });
  });

  afterEach(() => {
    Object.keys(GW.hordes).forEach( (id) => {
      if (id !== 'all') {
        GW.horde.removeKind(id);
      }
    });
  });

  test('make - args', () => {
    const horde = GW.make.horde('GOBLIN', '1-5');
    expect(horde.leader).toEqual('GOBLIN');
    expect(horde.flags).toEqual(0);
    expect(horde.frequency(0)).toEqual(0);
    expect(horde.frequency(1)).toEqual(100);
    expect(horde.frequency(5)).toEqual(100);
    expect(horde.frequency(6)).toEqual(0);
    expect(horde.minions).toBeFalsy();
  });

  test('make - leader + object', () => {
    const horde = GW.make.horde('GOBLIN', { frequency: '1:150' });
    expect(horde.leader).toEqual('GOBLIN');
    expect(horde.flags).toEqual(0);
    expect(horde.frequency(0)).toEqual(0);
    expect(horde.frequency(1)).toEqual(150);
    expect(horde.frequency(2)).toEqual(0);
    expect(horde.minions).toBeFalsy();
  });

  test('make - object', () => {
    const horde = GW.make.horde({ leader: 'GOBLIN', frequency: { '1-5': 150 } });
    expect(horde.leader).toEqual('GOBLIN');
    expect(horde.flags).toEqual(0);
    expect(horde.frequency(0)).toEqual(0);
    expect(horde.frequency(1)).toEqual(150);
    expect(horde.frequency(5)).toEqual(150);
    expect(horde.frequency(6)).toEqual(0);
    expect(horde.minions).toBeFalsy();
  });

  test('addKind - args', () => {
    const horde = GW.horde.addKind('GOBLIN', 'GOBLIN', '1-5');
    expect(horde.leader).toEqual('GOBLIN');
    expect(horde.id).toEqual('GOBLIN');
    expect(horde.flags).toEqual(0);
    expect(horde.frequency(0)).toEqual(0);
    expect(horde.frequency(1)).toEqual(100);
    expect(horde.frequency(5)).toEqual(100);
    expect(horde.frequency(6)).toEqual(0);
    expect(horde.minions).toBeFalsy();
    expect(GW.hordes.GOBLIN).toBe(horde);
  });

  test('addKind - leader + object', () => {
    const horde = GW.horde.addKind('GOBLIN', 'GOBLIN', { frequency: '1:150' });
    expect(horde.leader).toEqual('GOBLIN');
    expect(horde.id).toEqual('GOBLIN');
    expect(horde.flags).toEqual(0);
    expect(horde.frequency(0)).toEqual(0);
    expect(horde.frequency(1)).toEqual(150);
    expect(horde.frequency(2)).toEqual(0);
    expect(horde.minions).toBeFalsy();
    expect(GW.hordes.GOBLIN).toBe(horde);
  });

  test('addKind - object', () => {
    const horde = GW.horde.addKind('GOBLIN', { leader: 'GOBLIN', frequency: { '1-5': 150 } });
    expect(horde.leader).toEqual('GOBLIN');
    expect(horde.id).toEqual('GOBLIN');
    expect(horde.flags).toEqual(0);
    expect(horde.frequency(0)).toEqual(0);
    expect(horde.frequency(1)).toEqual(150);
    expect(horde.frequency(5)).toEqual(150);
    expect(horde.frequency(6)).toEqual(0);
    expect(horde.minions).toBeFalsy();
    expect(GW.hordes.GOBLIN).toBe(horde);
  });


  test('spawn', () => {
    GW.horde.addKind('GOBLIN', 'GOBLIN', '1-5');
    const map = GW.make.map(10, 10, 'FLOOR');
    const goblin = GW.horde.spawn('GOBLIN', map, 4, 5);

    expect(goblin).toBeDefined();
    expect(goblin.x).toEqual(4);
    expect(goblin.y).toEqual(5);
    expect(map.actorAt(4,5)).toBe(goblin);
  });

  test('pick', () => {
    const pig = GW.horde.addKind('PIG', { leader: 'PIG', frequency: { '1-5': 150 } });
    const cow = GW.horde.addKind('COW', { leader: 'COW', frequency: { '2-6': 150 } });
    const chicken = GW.horde.addKind('CHICKEN', { leader: 'CHICKEN', frequency: { '3-7': 150 } });
    const goat = GW.horde.addKind('GOAT', { leader: 'GOAT', frequency: { '4-8': 150 } });

    expect(GW.hordes.all).toHaveLength(4);

    for(let i = 0; i < 10; ++i) {
      expect(GW.horde.pick(0)).toBeNull();
      expect(GW.horde.pick(1)).toBe(pig);
      expect(GW.horde.pick(2)).toBeOneOf([pig, cow]);
      expect(GW.horde.pick(3)).toBeOneOf([pig, cow, chicken]);
      expect(GW.horde.pick(4)).toBeOneOf([pig, cow, chicken, goat]);
      expect(GW.horde.pick(5)).toBeOneOf([pig, cow, chicken, goat]);
      expect(GW.horde.pick(6)).toBeOneOf([cow, chicken, goat]);
      expect(GW.horde.pick(7)).toBeOneOf([chicken, goat]);
      expect(GW.horde.pick(8)).toBe(goat);
      expect(GW.horde.pick(9)).toBeNull();
    }

  });


  test.only('spawnRandom', () => {
    const goblin = GW.horde.addKind('GOBLIN', { leader: 'GOBLIN', frequency: { '1-5': 150 } });

    const map = GW.make.map(10, 10, 'FLOOR');
    map.challenge = 2;

    debugger;

    const actor = GW.horde.spawnRandom(map);
    expect(actor).toBeObject();
    expect(actor.x).toBeGreaterThan(-1);
    expect(actor.y).toBeGreaterThan(-1);
    expect(map.actorAt(actor.x, actor.y)).toBe(actor);
    expect(actor.kind).toBe(GW.actorKinds.GOBLIN);
  });

});
