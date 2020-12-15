
import { utils as Utils, io as IO } from 'gw-core';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, ui as UI, message as MSG } from '../gw.js';


async function fire(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  const item = actor.slots.ranged;

  if (!item) {
    MSG.add('§you§ §have§ nothing to ΩorangeΩfire∆.', { actor });
    return false;
  }

  const range = item.stats.range || 0;

  const candidates = [];
  let choice;
  Utils.eachChain(map.actors, (target) => {
    if (actor === target) return;
    if (Utils.distanceFromTo(actor, target) <= range) {
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
      return Utils.distanceFromTo(actor, a) - Utils.distanceFromTo(actor, b);
    });
    choice = await UI.chooseTarget(candidates, 'Fire at which target?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await Actions.itemAttack(actor, choice, { map, actor, x: choice.x, y: choice.y, item, type: 'ranged' })) {
    return false;
  }
  return true;
}

IO.addCommand('fire', fire);
