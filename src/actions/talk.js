
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

  if (success !== false) {
    actor.endTurn();
    return true;
  }
  return false;
}

Actions.talk = talk;
