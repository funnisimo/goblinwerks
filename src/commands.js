

import { Flags as TileFlags } from './tile.js';
import { ui as UI } from './ui.js';
import { message as MSG } from './message.js';
import { data as DATA, def, commands } from './gw.js';



async function moveDir(e) {
  const actor = e.actor || DATA.player;
  const newX = e.dir[0] + actor.x;
  const newY = e.dir[1] + actor.y;
  const map = DATA.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };

  if (!map.hasXY(newX, newY)) {
    MSG.moveBlocked(ctx);
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT

  // Can we enter new cell?
  if (cell.hasTileFlag(TileFlags.T_OBSTRUCTS_PASSABILITY)) {
    MSG.moveBlocked(ctx);
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    MSG.moveBlocked(ctx);
    return false;
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(TileFlags.T_LAVA) && !cell.hasTileFlag(TileFlags.T_BRIDGE)) {
    if (!await UI.confirm('That is certain death!  Proceed anyway?')) {
      return false;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    MSG.moveFailed(ctx);
    return false;
  }

  // APPLY EFFECTS

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)
  let fired;
  if (DATA.player === actor) {
    fired = await cell.fireEvent('playerEnter', ctx);
  }
  if (!fired) {
    await cell.fireEvent('enter', ctx);
  }

  UI.requestUpdate();
  actor.endTurn();
  return true;
}

commands.moveDir = moveDir;


// async function moveTo(x, y, actor) {
//   actor = actor || DATA.player;
//   return commands.moveDir(x - actor.x, y - actor.y, actor);
// }
