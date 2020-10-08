

import { Flags as TileFlags, tile as TILE } from '../tile.js';
import { KindFlags as ItemKindFlags, ActionFlags as ItemActionFlags } from '../item.js';
import { game as GAME } from '../game.js';
import { itemActions as ITEM_ACTIONS } from '../itemActions.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from '../gw.js';


async function close(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  console.log('close');

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c, i, j) => {
    if (c.item && c.item.hasActionFlag(ItemActionFlags.A_CLOSE)) {
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
    if (!await ITEM_ACTIONS.close(choice, actor, choice)) {
      return false;
    }
  }
  else {
    await choice.cell.fireEvent('close', choice);
  }
  actor.endTurn();
  return true;
}

commands.close = close;
