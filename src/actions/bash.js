
import * as Flags from '../flags.js';
import * as TileEvent from '../tileEvent.js';
import * as GW from '../gw.js';
import { actions as Actions } from './index.js';


GW.message.addKind('BASH_NO', '§you§ cannot bash §item§.');
GW.message.addKind('BASH_ITEM', '§you§ §bash§ §the item§ [-§damage§].');
GW.message.addKind('BASH_DESTROYED', '§the item§ §is§ destroyed.');

export async function bashItem(actor, item, ctx) {

  const map = ctx.map || GW.data.map;

  if (!item.hasActionFlag(Flags.Action.A_BASH)) {
    if (!ctx.quiet) GW.message.add('BASH_NO', { actor, item });
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
      if (actor.isPlayer()) GW.message.add('BASH_ITEM', { actor, item, damage });
      await GW.fx.flashSprite(map, item.x, item.y, 'hit', 100, 1);
    }
  }
  else {
    item.kind.applyDamage(item, ctx.damage || 1, null, ctx);
  }

  if (item.isDestroyed()) {
    map.removeItem(item);
    if (actor.isPlayer()) GW.message.add('BASH_DESTROYED', { item });
    if (item.kind.corpse) {
      await TileEvent.spawn(item.kind.corpse, { map, x: item.x, y: item.y });
    }
  }
  if (actor) {
    actor.endTurn();
  }
  console.log('bash done', actor.turnEnded());
  return true;
}

Actions.bashItem = bashItem;
