
import * as Flags from '../flags.js';
import { spawnTileEvent } from '../tileEvent.js';
import * as GW from '../gw.js';


export async function attack(actor, target, ctx={}) {

  if (actor.isPlayer() == target.isPlayer()) return false;

  const kind = actor.kind;
  const attacks = kind.attacks;
  if (!attacks) return false;

  const melee = attacks.melee;
  if (!melee) return false;

  const dist = Math.floor(GW.utils.distanceFromTo(actor, target));
  if (dist > (melee.range || 1)) {
    return false;
  }

  let damage = melee.damage;
  if (typeof damage === 'function') {
    damage = damage(actor, target, ctx) || 1;
  }
  const verb = melee.verb || 'hit';

  damage = target.applyDamage(damage, actor, ctx);
  GW.message.addCombat('%s %s %s for %R%d%R damage', actor.getName(), actor.getVerb(verb), target.getName('the'), 'red', damage, null);

  if (target.isDead()) {
    GW.message.addCombat('%s %s', target.isInanimate() ? 'destroying' : 'killing', target.getPronoun('it'));
  }

  await GW.fx.hit(GW.data.map, target);
  if (target.isDead()) {
    await target.kill();
    if (target.kind.corpse) {
      const ctx2 = { map: ctx.map, x: target.x, y: target.y };
      await spawnTileEvent(target.kind.corpse, ctx2);
    }
  }

  actor.endTurn();
  return true;
}
