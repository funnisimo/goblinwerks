
import * as Flags from '../flags.js';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from '../gw.js';


async function bash(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(Flags.Action.A_BASH)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    MSG.add('Nothing to bash.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Bash what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await Actions.bashItem(actor, choice, { map, actor, x: choice.x, y: choice.y, item: choice })) {
    return false;
  }
  return true;
}

commands.bash = bash;
