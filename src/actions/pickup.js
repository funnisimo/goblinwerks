
import * as Flags from '../flags.js';
import { types } from '../gw.js';


export async function pickupItem(actor, item, ctx) {

  if (!actor.hasActionFlag(Flags.Action.A_PICKUP)) return false;
  if (item.hasActionFlag(Flags.Action.A_NO_PICKUP)) {
    // TODO - GW.message.add('...');
    return false;
  }

  let success;
  if (item.kind.pickup) {
    success = await item.kind.pickup(item, actor, ctx);
    if (!success) return false;
  }
  else {
    // if no room in inventory - return false
    // add to inventory
    success = true;
  }

  const map = ctx.map;
  map.removeItem(item);

  if (success instanceof types.Item) {
    map.addItem(item.x, item.y, success);
  }
  return true;
}
