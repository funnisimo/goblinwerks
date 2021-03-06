
import * as Flags from '../flags.js';
import * as Utils from '../utils.js';
import * as TileEvent from '../tileEvent.js';
import { gameOver } from '../game.js';
import * as GW from '../gw.js';
import { actions as Actions } from './index.js';


export async function itemAttack(actor, target, ctx={}) {

  if (actor.isPlayer() == target.isPlayer()) return false;

  const slot = ctx.slot || ctx.type || 'ranged';
  const map = ctx.map || GW.data.map;
  const kind = actor.kind;

  if (actor.grabbed) {
    GW.message.forPlayer(actor, '%s cannot attack while holding %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getName('the'));
    return false;
  }

  const item = ctx.item || actor.slots[slot];
  if (!item) {
    return false;
  }

  const range = item.stats.range || 1;
  let damage  = item.stats.damage || 1;
  const verb  = item.kind.verb || 'hit';

  const dist = Math.floor(Utils.distanceFromTo(actor, target));
  if (dist > (range)) {
    return false;
  }

  if (item.kind.projectile) {
    await GW.fx.projectile(map, actor, target, item.kind.projectile);
  }

  if (typeof damage === 'function') {
    damage = damage(actor, target, ctx) || 1;
  }

  damage = target.kind.applyDamage(target, damage, actor, ctx);
  GW.message.addCombat('%s %s %s for %F%d%F damage', actor.getName(), actor.getVerb(verb), target.getName('the'), 'red', damage, null);

  if (target.isDead()) {
    GW.message.addCombat('%s %s', target.isInanimate() ? 'destroying' : 'killing', target.getPronoun('it'));
  }

  const ctx2 = { map: map, x: target.x, y: target.y, volume: damage };

  await GW.fx.hit(GW.data.map, target);
  if (target.kind.blood) {
    await TileEvent.spawn(target.kind.blood, ctx2);
  }
  if (target.isDead()) {
    target.kind.kill(target);
    map.removeActor(target);
    if (target.kind.corpse) {
      await TileEvent.spawn(target.kind.corpse, ctx2);
    }
    if (target.isPlayer()) {
      await gameOver(false, 'Killed by %s.', actor.getName(true));
    }
  }

  actor.endTurn();
  return true;
}

Actions.itemAttack = itemAttack;
