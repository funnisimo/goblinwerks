
import * as GW from '../index.js';


describe('moveDir', () => {

  test('moves in the given direction', async () => {

    const actor = GW.make.actor({ name: 'TEST' });
    expect(actor.getName({ color: false })).toEqual('TEST');

    const map = GW.data.map = GW.make.map(20, 20, 'FLOOR');
    expect(map.isPassableNow(10, 10)).toBeTruthy();
    expect(map.isPassableNow(11, 10)).toBeTruthy();

    map.addActor(10, 10, actor);
    expect(map.actorAt(10, 10)).toBe(actor);

    const r = await GW.actions.moveDir(actor, [1,0], { map });
    expect(r).toBeTruthy();

    expect(actor).toBeAtXY(11, 10);

  });
});
