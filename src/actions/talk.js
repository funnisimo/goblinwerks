import * as Flags from '../flags.js';
import * as Utils from '../utils.js';
import * as GW from '../gw.js';
import { actions as Actions } from './index.js';

export async function talk(actor, target, ctx={}) {
  let talker = target;
  let listener = actor;
  if (!talker.kind.talk) {
    if (!actor.kind.talk) return false;
    talker = actor;
    listener = target;
  }

  const success = await talker.kind.talk(talker, listener, ctx);

  if (success) {
    actor.endTurn();
  }
  return success;
}

Actions.talk = talk;
