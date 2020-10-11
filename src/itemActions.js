
import { Flags as ItemFlags, ActionFlags as ItemActionFlags } from './item.js';
import { tileEvent as TILE_EVENT } from './tileEvent.js';
import { message as MSG, utils as UTILS, fx as FX, types } from './gw.js';

export var itemActions = {};

async function bashItem(item, actor, ctx) {

  const map = ctx.map;

  if (!item.hasActionFlag(ItemActionFlags.A_BASH)) {
    MSG.add('%s cannot bash %s.', actor.getName(), item.getName());
    return false;
  }

  let success = false;
  if (item.kind.bash) {
    success = await item.kind.bash(item, actor, ctx);
    if (!success) return false;
  }
  else {
    const damage = actor.calcBashDamage(item, ctx);
    if (item.applyDamage(damage, actor, ctx)) {
      MSG.add('%s bash %s [-%d].', actor.getName(), item.getName('the'), damage);
      await FX.flashSprite(map, item.x, item.y, 'hit', 100, 1);
    }
  }

  if (item.isDestroyed()) {
    map.removeItem(item);
    MSG.add('%s is destroyed.', item.getName('the'));
    if (item.kind.corpse) {
      await TILE_EVENT.spawn(item.kind.corpse, { map, x: item.x, y: item.y });
    }
  }
  return true;
}

itemActions.bash = bashItem;


async function pickupItem(item, actor, ctx) {

  if (item.hasActionFlag(ItemActionFlags.A_NO_PICKUP)) return false;

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

itemActions.pickup = pickupItem;
