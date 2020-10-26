
import * as GW from '../index.js';


describe('moveToward', () => {

  test('moves toward a goal location', async () => {

    const actor = GW.make.actor({ name: 'TEST' });
    expect(actor.getName({ color: false })).toEqual('TEST');

    const map = GW.data.map = GW.make.map(20, 20, 'FLOOR');
    expect(map.isPassableNow(10, 10)).toBeTruthy();
    expect(map.isPassableNow(11, 10)).toBeTruthy();

    map.addActor(10, 10, actor);
    expect(map.actorAt(10, 10)).toBe(actor);

    let r = await GW.actions.moveToward(actor, 13, 10, { map });
    expect(r).toBeTruthy();
    expect(actor).toBeAtXY(11, 10);

    r = await GW.actions.moveToward(actor, 13, 10, { map });
    expect(r).toBeTruthy();
    expect(actor).toBeAtXY(12, 10);

    r = await GW.actions.moveToward(actor, 13, 10, { map });
    expect(r).toBeTruthy();
    expect(actor).toBeAtXY(13, 10);

    r = await GW.actions.moveToward(actor, 13, 10, { map });
    expect(r).toBeFalsy();
    expect(actor).toBeAtXY(13, 10);

  });
});
