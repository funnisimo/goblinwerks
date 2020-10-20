
import * as Flags from '../flags.js';
import { itemAttack } from '../actions/index.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from '../gw.js';


async function fire(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  if (!actor.ranged) {
    MSG.add('%s have nothing to %Rfire%R.', actor.getName(), 'orange', null);
    return false;
  }

  const range = actor.ranged.stats.range || 0;

  const candidates = [];
  let choice;
  UTILS.eachChain(map.actors, (target) => {
    if (actor === target) return;
    if (UTILS.distanceFromTo(actor, target) <= range) {
      if (!actor.kind.willAttack(actor, target)) return;
      if (!actor.canDirectlySee(target, map)) return;
      candidates.push(target);
    }
  });
  if (!candidates.length) {
    MSG.add('No targets.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    candidates.sort( (a, b) => {
      return UTILS.distanceFromTo(actor, a) - UTILS.distanceFromTo(actor, b);
    });
    choice = await UI.chooseTarget(candidates, 'Fire at which target?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await itemAttack(actor, choice, actor.ranged, { map, actor, x: choice.x, y: choice.y, item: actor.ranged })) {
    return false;
  }
  actor.endTurn();
  return true;
}

commands.fire = fire;
