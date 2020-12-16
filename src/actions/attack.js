
import { utils as Utils } from 'gw-core';
import * as GW from '../gw.js';
import { actions as Actions } from './index.js';
import * as Combat from '../combat.js';

// Mostly handles arranging that the correct attack occurs
// Uses GW.combat functions to do most of the work
export async function attack(actor, target, ctx={}) {

  if (actor.isPlayer() == target.isPlayer()) return false;

  const type = ctx.type = ctx.type || 'melee';
  const map = ctx.map = ctx.map || GW.data.map;
  const kind = actor.kind;

  // custom combat function
  // TODO - Should this be 'GW.config.attack'?
  if (GW.config.combat) {
    return GW.config.combat(actor, target, ctx);
  }

  if (actor.grabbed) {
    GW.message.forPlayer(actor, '%s cannot attack while holding %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getName('the'));
    return false;
  }

  // is this an attack by the player with an equipped item?
  const item = actor.slots[type];
  if (item) {
    if (await Actions.itemAttack(actor, target, ctx)) {
      return true;
    }
  }

  const attacks = kind.attacks;
  if (!attacks) return false;

  const info = attacks[type];
  if (!info) return false;

  const dist = Math.floor(Utils.distanceFromTo(actor, target));
  if (dist > (info.range || 1)) {
    return false;
  }

  if (info.fn) {
    return await info.fn(actor, target, ctx); // custom attack
  }

  ctx.damage = actor.calcDamageTo(target, info, ctx);
  await Combat.applyDamage(actor, target, info, ctx);

  if (target.isPlayer() && target.isDead()) {
    await Game.gameOver(false, 'Killed by §attacker§.', { actor });
  }

  actor.endTurn();
  return true;
}

Actions.attack = attack;
