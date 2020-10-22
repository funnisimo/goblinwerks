
import { message as MSG, fx as FX, data as DATA } from '../gw.js';


export async function grab(actor, item, ctx={}) {
  if (!item) return false;

  const map = ctx.map || DATA.map;

  actor.grabbed = item;
  MSG.add('%s grab %s.', actor.getName(), actor.grabbed.getName('a'));
  await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.endTurn();
  return true;
}
