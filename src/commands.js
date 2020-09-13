

import { Flags as TileFlags } from './tile.js';
import { ui as UI } from './ui.js';
import { message as MSG } from './message.js';
import { data as DATA, def } from './gw.js';


export var commands = {};


async function moveDir(e) {
  const actor = e.actor || DATA.player;
  const newX = e.dir[0] + actor.x;
  const newY = e.dir[1] + actor.y;
  const map = DATA.map;
  const cell = map.cell(newX, newY);

  if (!map.hasXY(newX, newY)) {
    MSG.moveBlocked({ actor, x: newX, y: newY, map });
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT

  // Can we enter new cell?
  if (cell.hasTileFlag(TileFlags.T_OBSTRUCTS_PASSABILITY)) {
    MSG.moveBlocked({ actor, x: newX, y: newY, map });
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    MSG.moveBlocked({ actor, x: newX, y: newY, map });
    return false;
  }

  if (!map.moveActor(newX, newY, actor)) {
    MSG.moveFailed({ actor, x: newX, y: newY, map });
    return false;
  }

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)

  UI.requestUpdate();
  actor.endTurn();
  return true;
}

commands.moveDir = moveDir;


// async function moveTo(x, y, actor) {
//   actor = actor || DATA.player;
//   return commands.moveDir(x - actor.x, y - actor.y, actor);
// }
