
import * as Flags from '../flags.js';
import { types } from '../gw.js';
import { actions as Actions } from './index.js';
import * as GW from '../gw.js';


export async function pickup(actor, item, ctx) {

  if (!actor.hasActionFlag(Flags.Action.A_PICKUP)) return false;
  if (item.hasActionFlag(Flags.Action.A_NO_PICKUP)) {
    GW.message.add('you cannot pickup %s.', item.getName({ article: 'the', color: true }));
    return false;
  }

  const map = ctx.map || GW.data.map;
  map.removeItem(item);

  let success = false;
  if (!GW.config.inventory) {
    if (item.kind.slot) {
      success = await Actions.equip(actor, item, ctx);
    }
    else {
      success = await Actions.use(actor, item, ctx);
    }
    ctx.quiet = true; // no need to log the pickup - we did that in either 'equip' or 'use'
  }
  else if (item.kind.pickup) {
    success = await item.kind.pickup(item, actor, ctx);
  }
  else {
    success = actor.addToPack(item);
  }

  if (!success) {
    // put item back on floor
    map.addItem(item.x, item.y, item);
    return false;
  }

  if ((item.kind.flags & Flags.ItemKind.IK_EQUIP_ON_PICKUP) && item.kind.slot) {
    await Actions.equip(actor, item, ctx);
  }
  else if (item.kind.flags & Flags.ItemKind.IK_USE_ON_PICKUP) {
    await Actions.use(actor, item, ctx);
  }
  else if (!ctx.quiet) {
    GW.message.add('you pickup %s.', item.getName('the'));
  }

  actor.endTurn();
  return true;
}

Actions.pickup = pickup;
