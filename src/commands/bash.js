

import { Flags as TileFlags, tile as TILE } from '../tile.js';
import { KindFlags as ItemKindFlags, ActionFlags as ItemActionFlags } from '../item.js';
import { game as GAME } from '../game.js';
import { itemActions as ITEM_ACTIONS } from '../itemActions.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from '../gw.js';


async function bash(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(ItemActionFlags.A_BASH)) {
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

  if (!await ITEM_ACTIONS.bash(choice, actor, { map, actor, x: choice.x, y: choice.y, item: choice })) {
    return false;
  }
  actor.endTurn();
  return true;
}

commands.bash = bash;
