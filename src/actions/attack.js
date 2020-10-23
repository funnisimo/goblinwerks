
import * as Flags from '../flags.js';
import { spawnTileEvent } from '../tileEvent.js';
import { gameOver } from '../game.js';
import * as GW from '../gw.js';
import { actions as Actions } from './index.js';

export async function attack(actor, target, ctx={}) {

  if (actor.isPlayer() == target.isPlayer()) return false;

  const type = ctx.type = ctx.type || 'melee';
  const map = ctx.map || GW.data.map;
  const kind = actor.kind;

  // is this an attack by the player with an equipped item?
  const item = actor[type];
  if (item) {
    if (await Actions.itemAttack(actor, target, ctx)) {
      return true;
    }
  }

  const attacks = kind.attacks;
  if (!attacks) return false;

  const info = attacks[type];
  if (!info) return false;

  const dist = Math.floor(GW.utils.distanceFromTo(actor, target));
  if (dist > (info.range || 1)) {
    return false;
  }

  let damage = info.damage;
  if (typeof damage === 'function') {
    damage = damage(actor, target, ctx) || 1;
  }
  const verb = info.verb || 'hit';

  damage = target.kind.applyDamage(target, damage, actor, ctx);
  GW.message.addCombat('%s %s %s for %R%d%R damage', actor.getName(), actor.getVerb(verb), target.getName('the'), 'red', damage, null);

  if (target.isDead()) {
    GW.message.addCombat('%s %s', target.isInanimate() ? 'destroying' : 'killing', target.getPronoun('it'));
  }

  const ctx2 = { map: map, x: target.x, y: target.y, volume: damage };

  await GW.fx.hit(GW.data.map, target);
  if (target.kind.blood) {
    await spawnTileEvent(target.kind.blood, ctx2);
  }
  if (target.isDead()) {
    target.kind.kill(target);
    map.removeActor(target);
    if (target.kind.corpse) {
      await spawnTileEvent(target.kind.corpse, ctx2);
    }
    if (target.isPlayer()) {
      await gameOver(false, 'Killed by %s.', actor.getName(true));
    }
  }

  actor.endTurn();
  return true;
}

Actions.attack = attack;
