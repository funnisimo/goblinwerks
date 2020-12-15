
import * as Flags from './flags.js';
import * as Utils from './utils.js';
import { random } from './random.js';
import * as FX from './fx.js';
import * as GW from './gw.js';
import { actions as Actions } from './actions/index.js';



async function idle(actor, ctx) {
  actor.debug('idle');
  actor.endTurn();
  return true;
}

GW.ai.idle = { act: idle };


async function sleep(actor, ctx={}) {
  if (!actor.current.sleep) return false;

  const map = ctx.map || GW.data.map;
  const player = GW.data.player;
  if (player) {
    const dist = Utils.distanceFromTo(actor, player);
    const notice = actor.kind.getAwarenessDistance(actor, player); // does/should this take into account stealth?
    if (dist <= notice && actor.canDirectlySee(player)) {
      actor.adjustStat('sleep', -Math.round(notice/dist));
    }
  }

  if (actor.current.sleep <= 0) {
    GW.message.fromActor(actor, '§actor§ wakes!', { actor });
    await FX.flashSprite(map, actor.x, actor.y, 'bump', 300, 3);
    actor.current.sleep = 0;
  }

  actor.debug('sleep');
  actor.endTurn();
  return true;
}

GW.ai.sleep = { act: sleep };


async function moveRandomly(actor, ctx) {

  // get random move chance...
  const b = actor.kind.behaviors || 0;
  let chance = 0;
  if (b & Flags.Behaviors.BB_MOVES_RANDOM_12) chance += 12;
  if (b & Flags.Behaviors.BB_MOVES_RANDOM_25) chance += 25;
  if (b & Flags.Behaviors.BB_MOVES_RANDOM_50) chance += 50;

  if (!b) return false;
  if (!random.chance(b)) return false;

  const dirIndex = random.number(4);
  const dir = GW.def.dirs[dirIndex];

  return Actions.moveDir(actor, dir, ctx);
}

GW.ai.moveRandomly = { act: moveRandomly };


async function attackPlayer(actor, ctx) {
  const player = GW.data.player;

  const dist = Utils.distanceFromTo(actor, player);
  if (dist >= 2) return false;

  return Actions.attack(actor, player, ctx);
}

GW.ai.attackPlayer = { act: attackPlayer };


async function talkToPlayer(actor, ctx) {
  const player = GW.data.player;

  if (!actor.kind.talk) return false;

  const dist = Utils.distanceFromTo(actor, player);
  if (dist >= 2) return false;

  return Actions.talk(actor, player, ctx);
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
    if (dist <= actor.kind.getAwarenessDistance(actor, player)) {
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
