
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { random } from './random.js';
import * as GW from './gw.js';
import { actions as Actions } from './actions/index.js';



async function idle(actor, ctx) {
  actor.debug('idle');
  actor.endTurn();
  return true;
}

GW.ai.idle = { act: idle };


async function moveRandomly(actor, ctx) {
  const dirIndex = random.number(4);
  const dir = GW.def.dirs[dirIndex];

  if (!await Actions.moveDir(actor, dir, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

GW.ai.moveRandomly = { act: moveRandomly };


async function attackPlayer(actor, ctx) {
  const player = GW.data.player;

  const dist = Utils.distanceFromTo(actor, player);
  if (dist >= 2) return false;

  if (!await Actions.attack(actor, player, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

GW.ai.attackPlayer = { act: attackPlayer };

async function talkToPlayer(actor, ctx) {
  const player = GW.data.player;

  if (!actor.kind.talk) return false;

  const dist = Utils.distanceFromTo(actor, player);
  if (dist >= 2) return false;

  if (!await Actions.talk(actor, player, ctx)) {
    return false;
  }
  // actor.endTurn();
  return true;
}

GW.ai.talkToPlayer = { act: talkToPlayer };



async function moveTowardPlayer(actor, ctx={}) {

  const player = GW.data.player;
  const map = ctx.map || GW.data.map;
  const cell = map.cell(actor.x, actor.y);

  const dist = Utils.distanceFromTo(actor, player);
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

GW.ai.moveTowardPlayer = { act: moveTowardPlayer };
