
import * as Flags from '../flags.js';
import { actions as Actions } from './index.js';
import * as GW from '../gw.js';


GW.message.addKind('USE_NOTHING', 'Nothing happens.');

export async function use(actor, item, ctx) {

  let success;
  if (item.kind.use) {
    success = await item.kind.use(item, actor, ctx);
    if (!success) return false;
  }
  else {
    GW.message.add('USE_NOTHING', { actor, item });
    return false;
  }

  if (item.kind.flags & Flags.ItemKind.IK_DESTROY_ON_USE) {
    item.quantity -= 1;
  }

  if (item.quantity <= 0) {
    item.destroy();
  }

  if (item.isDestroyed()) {
    const map = ctx.map || GW.data.map;
    if (map) {
      map.removeItem(item);
    }

    actor.removeFromPack(item);
  }

  actor.endTurn();
  return true;
}

Actions.use = use;
