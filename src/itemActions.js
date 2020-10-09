
import { Flags as ItemFlags, ActionFlags as ItemActionFlags } from './item.js';
import { tileEvent as TILE_EVENT } from './tileEvent.js';
import { message as MSG, utils as UTILS, fx as FX } from './gw.js';

export var itemActions = {};

async function bashItem(item, actor, ctx) {

  const map = ctx.map;

  if (!item.hasActionFlag(ItemActionFlags.A_BASH)) {
    MSG.add('You cannot bash %s.', item.getName());
    return false;
  }

  MSG.add('You bash %s.', item.getName('the'));

  if (item.applyDamage(1, actor, ctx)) {
    await FX.flashSprite(map, item.x, item.y, 'hit', 100, 1);
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
