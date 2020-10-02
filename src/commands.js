

import { Flags as TileFlags, tile as TILE } from './tile.js';
import { KindFlags as ItemKindFlags, ActionFlags as ItemActionFlags } from './item.js';
import { game as GAME } from './game.js';
import { data as DATA, def, commands, ui as UI, message as MSG } from './gw.js';



async function moveDir(e) {
  const actor = e.actor || DATA.player;
  const dir = e.dir;
  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = DATA.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };

  if (!map.hasXY(newX, newY)) {
    MSG.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT

  // Can we enter new cell?
  if (cell.hasTileFlag(TileFlags.T_OBSTRUCTS_PASSABILITY)) {
    MSG.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    MSG.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }
  if (cell.item && cell.item.hasKindFlag(ItemKindFlags.IK_BLOCKS_MOVE)) {
    if (!cell.item.hasActionFlag(ItemActionFlags.A_PUSH)) {
      ctx.item = cell.item;
      MSG.moveBlocked(ctx);
      return false;
    }
    const pushX = newX + dir[0];
    const pushY = newY + dir[1];
    const pushCell = map.cell(pushX, pushY);
    if (!pushCell.isEmpty() || pushCell.hasTileFlag(TileFlags.T_OBSTRUCTS_ITEMS)) {
      MSG.moveBlocked(ctx);
      return false;
    }

    ctx.item = cell.item;
    map.removeItem(cell.item);
    map.addItem(pushX, pushY, ctx.item);
    // Do we need to activate stuff - key enter, key leave?
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(TileFlags.T_LAVA) && !cell.hasTileFlag(TileFlags.T_BRIDGE)) {
    if (!await UI.confirm('That is certain death!  Proceed anyway?')) {
      return false;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    MSG.moveFailed(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // APPLY EFFECTS
  for(let tile of cell.tiles()) {
    await TILE.applyInstantEffects(tile, cell);
    if (DATA.gameHasEnded) {
      return true;
    }
  }

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)
  let fired;
  if (DATA.player === actor) {
    fired = await cell.fireEvent('playerEnter', ctx);
  }
  if (!fired) {
    await cell.fireEvent('enter', ctx);
  }

  if (cell.hasTileFlag(TileFlags.T_HAS_STAIRS)) {
    console.log('Use stairs!');
    await GAME.useStairs(newX, newY);
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
