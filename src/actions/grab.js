
import { message as MSG, fx as FX, data as DATA } from '../gw.js';
import { actions as Actions } from './index.js';


export async function grab(actor, item, ctx={}) {
  if (!item) return false;

  const map = ctx.map || DATA.map;

  if (!actor.isPlayer()) return false;

  if (actor.grabbed) {
    if (actor.grabbed === item) {
      return false; // already grabbed
    }
    return await Actions.release(actor, actor.grabbed, ctx);
  }

  actor.grabbed = item;
  MSG.add('$you$ $grab$ $a.item$.', { actor, item: actor.grabbed });
  await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.endTurn();
  return true;
}

Actions.grab = grab;


export async function release(actor, item, ctx={}) {
  if (!actor.grabbed) return false;

  MSG.add('$you$ $let$ go of $a.item$.', { actor, item: actor.grabbed });
  await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.grabbed = null;
  actor.endTurn();
  return true;
}

Actions.release = release;
