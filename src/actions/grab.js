
import { message as MSG, fx as FX, data as DATA } from '../gw.js';


export async function grab(actor, item, ctx={}) {
  if (!item) return false;

  const map = ctx.map || DATA.map;

  if (actor.grabbed) {
    if (actor.grabbed === item) {
      return false; // already grabbed
    }

    MSG.add('%s let go of %s.', actor.getName(), actor.grabbed.getName('a'));
    await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
    actor.grabbed = null;
    actor.endTurn();
    return true;
  }

  actor.grabbed = item;
  MSG.add('%s grab %s.', actor.getName(), actor.grabbed.getName('a'));
  await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.endTurn();
  return true;
}
