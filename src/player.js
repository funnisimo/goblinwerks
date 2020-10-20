

import * as Flags from './flags.js';
import { io as IO } from './io.js';
import { startActorTurn } from './actor.js';
import { make, data as DATA, types, ui as UI, utils as UTILS } from './gw.js';

export var player = {};

player.debug = UTILS.NOOP;



export function makePlayer(kind) {
  if (!(kind instanceof types.ActorKind)) {
    kind = new types.ActorKind(kind);
  }
  return new types.Actor(kind);
}

make.player = makePlayer;



export async function takeTurn() {
  const PLAYER = DATA.player;
  player.debug('player turn...', DATA.time);
  if (PLAYER.isDead() || DATA.gameHasEnded) {
    return 0;
  }
  await UI.updateIfRequested();
  await startActorTurn(PLAYER);

  while(!PLAYER.turnTime) {
    const ev = await IO.nextEvent(1000);
    await UI.dispatchEvent(ev);
    await UI.updateIfRequested();
    if (DATA.gameHasEnded) {
      return 0;
    }
  }

  player.debug('...end turn', PLAYER.turnTime);
  return PLAYER.turnTime;
}

player.takeTurn = takeTurn;



function isValidStartLoc(cell, x, y) {
  if (cell.hasTileFlag(Flags.Tile.T_PATHING_BLOCKER | Flags.Tile.T_HAS_STAIRS)) {
    return false;
  }
  return true;
}

player.isValidStartLoc = isValidStartLoc;
