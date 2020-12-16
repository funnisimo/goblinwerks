

import { io as IO } from 'gw-utils';
import * as Flags from '../flags.js';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, ui as UI, message as MSG } from '../gw.js';


async function open(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  console.log('open');

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    if (c.item && c.item.hasActionFlag(Flags.Action.A_OPEN)) {
      candidates.push({ item: c.item, cell: c, x: i, y: j, map, actor });
    }
    else if (c.hasTileWithEvent('open')) {
      candidates.push({ cell: c, x: i, y: j, map, actor });
    }
  }, true);
  console.log('- candidates:', candidates.length);
  if (!candidates.length) {
    MSG.add('Nothing to open.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Open what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  if (choice.item) {
    if (!await Actions.openItem(actor, choice, choice)) {
      return false;
    }
  }
  else {
    console.log('fire event');
    await choice.cell.fireEvent('open', choice);
    actor.endTurn();
  }
  return true;
}

IO.addCommand('open', open);
