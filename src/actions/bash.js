
import * as Flags from '../flags.js';
import { spawnTileEvent } from '../tileEvent.js';
import * as GW from '../gw.js';


export async function bashItem(actor, item, ctx) {

  const map = ctx.map || GW.data.map;

  if (!item.hasActionFlag(Flags.Action.A_BASH)) {
    GW.message.add('%s cannot bash %s.', actor.getName(), item.getName());
    return false;
  }

  let success = false;
  if (item.kind.bash) {
    success = await item.kind.bash(item, actor, ctx);
    if (!success) return false;
  }
  else if (actor) {
    const damage = actor.kind.calcBashDamage(actor, item, ctx);
    if (item.kind.applyDamage(item, damage, actor, ctx)) {
      GW.message.add('%s bash %s [-%d].', actor.getName(), item.getName('the'), damage);
      await GW.fx.flashSprite(map, item.x, item.y, 'hit', 100, 1);
    }
  }
  else {
    item.kind.applyDamage(item, ctx.damage || 1, null, ctx);
  }

  if (item.isDestroyed()) {
    map.removeItem(item);
    GW.message.add('%s is destroyed.', item.getName('the'));
    if (item.kind.corpse) {
      await spawnTileEvent(item.kind.corpse, { map, x: item.x, y: item.y });
    }
  }
  if (actor) {
    actor.endTurn();
  }
  return true;
}
