
import * as Utils from './utils.js';
import * as Text from './text.js';
import * as TileEvent from './tileEvent.js';
import * as Game from './game.js';
import * as GW from './gw.js';



export async function applyDamage(attacker, defender, attackInfo, ctx) {
  ctx.damage = attackInfo.damage || ctx.damage || attacker.calcDamageTo(defender, attackInfo, ctx);
  const map = ctx.map || GW.data.map;

  ctx.damage = defender.kind.applyDamage(defender, ctx.damage, attacker, ctx);

  let msg = Utils.firstOpt('msg', attackInfo, ctx, true);
  if (msg) {
    if (typeof msg !== 'string') {
      let verb = attackInfo.verb || 'hit';
      GW.message.addCombat('§attacker§ §verb attacker§ §the defender§ for ΩredΩ§damage§∆ damage', { attacker, verb, defender, damage: Math.round(ctx.damage) });
    }
    else {
      GW.message.addCombat(msg);
    }
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
    defender.kill();
    if (map) {
      map.removeActor(defender);
      if (defender.kind.corpse) {
        await TileEvent.spawn(defender.kind.corpse, ctx2);
      }
      if (defender.pack && !defender.isPlayer()) {
        Utils.eachChain(defender.pack, (item) => {
          map.addItemNear(defender.x, defender.y, item);
        });
      }
    }

    if (defender.isDead() && (msg !== false)) {
      GW.message.addCombat('ΩredΩ§action§∆ §it defender§', { action: defender.isInanimate() ? 'destroying' : 'killing', defender });
    }
  }
  return ctx.damage;
}
