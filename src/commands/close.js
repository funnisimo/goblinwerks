
import { io as IO } from 'gw-utils';
import * as Flags from '../flags.js';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, ui as UI, message as MSG } from '../gw.js';


async function close(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  console.log('close');

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    if (c.item && c.item.hasActionFlag(Flags.Action.A_CLOSE)) {
      candidates.push({ item: c.item, cell: c, x: i, y: j, map, actor });
    }
    else {
      if (c.hasTileWithEvent('close')) {
        candidates.push({ cell: c, x: i, y: j, map, actor });
      }
    }
  }, true);
  if (!candidates.length) {
    MSG.add('Nothing to close.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Close what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (choice.item) {
    if (!await Actions.closeItem(actor, choice, choice)) {
      return false;
    }
  }
  else {
    await choice.cell.fireEvent('close', choice);
    actor.endTurn();
  }
  return true;
}

IO.addCommand('close', close);
