
import * as Flags from '../flags.js';
import * as Utils from '../utils.js';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, commands, ui as UI, message as MSG, fx as FX } from '../gw.js';


async function push(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(Flags.Action.A_PUSH)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    MSG.add('Nothing to push.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Push what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await Actions.push(actor, choice, { map, x: choice.x, y: choice.y })) {
    return false;
  }
  if (!actor.turnEnded()) {
    actor.endTurn();
  }
  return true;
}

commands.push = push;
