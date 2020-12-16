
import { io as IO } from 'gw-utils';
import * as Flags from '../flags.js';
import * as FX from '../fx.js';
import { actions as Actions } from '../actions/index.js';
import { data as DATA, def, ui as UI, message as MSG } from '../gw.js';


async function grab(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  if (actor.grabbed) {
    MSG.add('§you§ §let§ go of §a item§.', { actor, item: actor.grabbed });
    await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
    actor.grabbed = null;
    actor.endTurn();
    return true;
  }

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(Flags.Action.A_GRABBABLE)) {
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

  if (!await Actions.grab(actor, choice, { map, x: choice.x, y: choice.y })) {
    return false;
  }
  return true;
}

IO.addCommand('grab', grab);
