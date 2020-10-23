
import * as Flags from './flags.js';
import { random } from './random.js';
import { def, data as DATA, utils as UTILS, ai } from './gw.js';
import { actions as Actions } from './actions/index.js';



async function idle(actor, ctx) {
  actor.debug('idle');
  actor.endTurn();
  return true;
}

ai.idle = { act: idle };


async function moveRandomly(actor, ctx) {
  const dirIndex = random.number(4);
  const dir = def.dirs[dirIndex];

  if (!await Actions.moveDir(actor, dir, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

ai.moveRandomly = { act: moveRandomly };


async function attackPlayer(actor, ctx) {
  const player = DATA.player;

  const dist = UTILS.distanceFromTo(actor, player);
  if (dist >= 2) return false;

  if (!await Actions.attack(actor, player, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

ai.attackPlayer = { act: attackPlayer };


async function moveTowardPlayer(actor, ctx={}) {

  const player = DATA.player;
  const map = ctx.map || DATA.map;
  const cell = map.cell(actor.x, actor.y);

  const dist = UTILS.distanceFromTo(actor, player);
  if (dist < 2) return false; // Already next to player

  if (cell.flags & Flags.Cell.IN_FOV) {
    // actor in player FOV so actor can see player (if in range, light, etc...)
    if (dist < actor.kind.getAwarenessDistance(actor, player)) {
      actor.lastSeenPlayerAt = [player.x, player.y];
    }
  }

  if (actor.lastSeenPlayerAt) {
    if (!await Actions.moveToward(actor, actor.lastSeenPlayerAt[0], actor.lastSeenPlayerAt[1], ctx)) {
      actor.lastSeenPlayerAt = null;  // cannot move toward this location, so stop trying
      return false;
    }
    if (actor.lastSeenPlayerAt[0] == actor.x && actor.lastSeenPlayerAt[1] == actor.y) {
      // at goal
      actor.lastSeenPlayerAt = null;
    }
    return true;
  }

  return false;
}

ai.moveTowardPlayer = { act: moveTowardPlayer };
