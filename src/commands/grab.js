

import { Flags as TileFlags, tile as TILE } from '../tile.js';
import { KindFlags as ItemKindFlags, ActionFlags as ItemActionFlags } from '../item.js';
import { game as GAME } from '../game.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from '../gw.js';


async function grab(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  if (actor.grabbed) {
    MSG.add('%s let go of %s.', actor.getName(), actor.grabbed.getName('a'));
    await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
    actor.grabbed = null;
    actor.endTurn();
    return true;
  }

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(ItemActionFlags.A_GRABBABLE)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    MSG.add('Nothing to grab.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Grab what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  actor.grabbed = choice;
  MSG.add('%s grab %s.', actor.getName(), actor.grabbed.getName('a'));
  await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.endTurn();
  return true;
}

commands.grab = grab;
