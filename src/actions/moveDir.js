
import * as Flags from '../flags.js';
import * as Actor from '../actor.js';
import * as GW from '../gw.js'
import { actions as Actions } from './index.js';


export async function moveDir(actor, dir, opts={}) {

  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = opts.map || GW.data.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };

  actor.debug('moveDir', dir);

  if (!map.hasXY(newX, newY)) {
    actor.debug('move blocked - invalid xy: %d,%d', newX, newY);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT

  if (cell.actor) {
    if (await Actor.bump(actor, cell.actor, ctx)) {
      return true;
    }
    return false;  // cannot move here and did not attack
  }

  let isPush = false;
  if (cell.item && cell.item.hasKindFlag(Flags.ItemKind.IK_BLOCKS_MOVE)) {
    // ACTOR.hasActionFlag(A_PUSH);
    if (!cell.item.hasActionFlag(Flags.Action.A_PUSH)) {
      ctx.item = cell.item;
      return false;
    }
    const pushX = newX + dir[0];
    const pushY = newY + dir[1];
    const pushCell = map.cell(pushX, pushY);
    if (!pushCell.isEmpty() || pushCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
      return false;
    }

    ctx.item = cell.item;
    map.removeItem(cell.item);
    map.addItem(pushX, pushY, ctx.item);
    isPush = true;
    // Do we need to activate stuff - key enter, key leave?
  }

  // Can we enter new cell?
  if (cell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    return false;
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(Flags.Tile.T_LAVA) && !cell.hasTileFlag(Flags.Tile.T_BRIDGE)) {
    return false;
  }
  else if (cell.hasTileFlag(Flags.Tile.T_HAS_STAIRS)) {
    if (actor.grabbed) {
      return false;
    }
  }

  if (actor.grabbed && !isPush) {
    const dirToItem = UTILS.dirFromTo(actor, actor.grabbed);
    let destXY = [actor.grabbed.x + dir[0], actor.grabbed.y + dir[1]];
    if (UTILS.isOppositeDir(dirToItem, dir)) {  // pull
      if (!actor.grabbed.hasActionFlag(Flags.Action.A_PULL)) {
        return false;
      }
    }
    else {  // slide
      if (!actor.grabbed.hasActionFlag(Flags.Action.A_SLIDE)) {
        return false;
      }
    }
    const destCell = map.cell(destXY[0], destXY[1]);
    if (destCell.item || destCell.actor || destCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
      actor.grabbed = null;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    UTILS.ERROR('Move failed! ' + newX + ',' + newY);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  if (actor.grabbed && !isPush) {
    map.removeItem(actor.grabbed);
    map.addItem(actor.grabbed.x + dir[0], actor.grabbed.y + dir[1], actor.grabbed);
  }

  // APPLY EFFECTS
  for(let tile of cell.tiles()) {
    await tile.applyInstantEffects(map, newX, newY, cell);
    if (GW.data.gameHasEnded) {
      return true;
    }
  }

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)
  await cell.fireEvent('enter', ctx);

  // pickup any items
  if (cell.item && actor.hasActionFlag(Flags.Action.A_PICKUP)) {
    await Actions.pickupItem(actor, cell.item, ctx);
  }

  actor.debug('moveComplete');

  GW.ui.requestUpdate();
  actor.endTurn();
  return true;
}

Actions.moveDir = moveDir;
