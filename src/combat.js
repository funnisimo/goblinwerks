
import * as Utils from './utils.js';
import * as Text from './text.js';
import * as TileEvent from './tileEvent.js';
import * as GW from './gw.js';



export async function applyDamage(attacker, defender, attackInfo, ctx) {
  ctx.damage = attackInfo.damage || ctx.damage || attacker.calcDamageTo(defender, attackInfo, ctx);
  const map = ctx.map || GW.data.map;

  ctx.damage = defender.kind.applyDamage(defender, ctx.damage, attacker, ctx);

  let msg = Utils.firstOpt('msg', attackInfo, ctx, true);
  if (msg) {
    if (typeof msg !== 'string') {
      let verb = attackInfo.verb || 'hit';
      msg = Text.format('%s %s %s for %F%d%F damage', attacker.getName(), attacker.getVerb(verb), defender.getName('the'), 'red', Math.round(ctx.damage), null);
    }
    GW.message.addCombat(msg);
  }

  const ctx2 = { map, x: defender.x, y: defender.y, volume: ctx.damage };

  if (map) {
    let hit = Utils.firstOpt('fx', attackInfo, ctx, false);
    if (hit) {
      await GW.fx.hit(map, defender);
    }
    if (defender.kind.blood) {
      await TileEvent.spawn(defender.kind.blood, ctx2);
    }
  }
  if (defender.isDead()) {
    defender.kind.kill(defender);
    if (map) {
      map.removeActor(defender);
      if (defender.kind.corpse) {
        await TileEvent.spawn(defender.kind.corpse, ctx2);
      }
    }

    if (defender.isDead() && (msg !== false)) {
      GW.message.addCombat('%s %s', defender.isInanimate() ? 'destroying' : 'killing', defender.getPronoun('it'));
    }

    if (defender.isPlayer()) {
      await gameOver(false, 'Killed by %s.', attacker.getName(true));
    }
  }
  return ctx.damage;
}
