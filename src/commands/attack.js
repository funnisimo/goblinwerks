
import * as Flags from '../flags.js';
import { attack as attackAction } from '../actions/index.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from '../gw.js';


async function attack(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;
  const ctx = { map, actor, x: -1, y: -1 };

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    ctx.x = i;
    ctx.y = j;
    if (c.actor && actor.kind.willAttack(actor, c.actor, ctx)) {
      candidates.push(c.actor);
    }
  }, true);

  if (!candidates.length) {
    MSG.add('Nothing to attack.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Attack where?');
  }
  if (!choice) {
    return false; // cancelled
  }

  ctx.x = choice.x;
  ctx.y = choice.y;
  if (!await attackAction(actor, choice, ctx)) {
    return false;
  }
  return true;
}

commands.attack = attack;
