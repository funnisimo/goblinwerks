
import * as Flags from '../flags.js';
import * as Utils from '../utils.js';
import * as FX from '../fx.js';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, commands, ui as UI, message as MSG } from '../gw.js';


async function talk(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.actor && c.actor.kind.talk) {
      candidates.push(c.actor);
    }
  }, true);
  if (!candidates.length) {
    MSG.add('Nobody is listening.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Talk to whom?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (!await Actions.talk(actor, choice, { map, actor, x: choice.x, y: choice.y })) {
    return false;
  }
  if (!actor.turnEnded()) {
    actor.endTurn();
  }
  return true;
}

commands.talk = talk;
