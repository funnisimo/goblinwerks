
import * as Flags from '../flags.js';
import * as Utils from '../utils.js';
import * as Actor from '../actor.js';
import * as Item from '../item.js';
import * as Game from '../game.js';
import * as GW from '../gw.js'
import { actions as Actions } from './index.js';


export async function moveDir(actor, dir, opts={}) {

  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = opts.map || GW.data.map;
  const cell = map.cell(newX, newY);
  const isPlayer = actor.isPlayer();

  const canBump = (opts.bump !== false);
  const ctx = { actor, map, x: newX, y: newY, cell };

  actor.debug('moveDir', dir);

  if (!map.hasXY(newX, newY)) {
    commands.debug('move blocked - invalid xy: %d,%d', newX, newY);
    GW.message.forPlayer(actor, 'Blocked!');
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT, ENTANGLED

  if (cell.actor) {
    if (canBump && await cell.actor.bumpBy(actor, ctx)) {
      return true;
    }

    GW.message.forPlayer(actor, '%s bump into %s.', actor.getName(), cell.actor.getName('the'));
    actor.endTurn(0.5);
    return true;
  }

  let isPush = false;
  if (cell.item && cell.item.hasKindFlag(Flags.ItemKind.IK_BLOCKS_MOVE)) {
    console.log('bump into item');
    if (!canBump || !(await cell.item.bumpBy(actor, ctx))) {
      console.log('bump - no action');
      GW.message.forPlayer(actor, 'Blocked!');
      return false;
    }

    console.log('bump done', actor.turnEnded());
    if (actor.turnEnded()) {
      return true;
    }

    // if (!cell.item.hasActionFlag(Flags.Action.A_PUSH)) {
    //   ctx.item = cell.item;
    // }
    // const pushX = newX + dir[0];
    // const pushY = newY + dir[1];
    // const pushCell = map.cell(pushX, pushY);
    // if (!pushCell.isEmpty() || pushCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
    //   GW.message.forPlayer(actor, 'Blocked!');
    //   return false;
    // }
    //
    // ctx.item = cell.item;
    // map.removeItem(cell.item);
    // map.addItem(pushX, pushY, ctx.item);
    isPush = true;
    // Do we need to activate stuff - key enter, key leave?
  }

  // Can we enter new cell?
  if (cell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
    if (isPlayer) {
      GW.message.forPlayer(actor, 'Blocked!');
      // TURN ENDED (1/2 turn)?
      await GW.fx.flashSprite(map, newX, newY, 'hit', 50, 1);
    }
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    if (isPlayer)  {
      GW.message.forPlayer(actor, 'Blocked!');
      // TURN ENDED (1/2 turn)?
      await GW.fx.flashSprite(map, newX, newY, 'hit', 50, 1);
    }
    return false;
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(Flags.Tile.T_LAVA) && !cell.hasTileFlag(Flags.Tile.T_BRIDGE)) {
    if (!isPlayer) return false;
    if (!await UI.confirm('That is certain death!  Proceed anyway?')) {
      return false;
    }
  }
  else if (cell.hasTileFlag(Flags.Tile.T_HAS_STAIRS)) {
    if (actor.grabbed) {
      GW.message.forPlayer(actor, '%s cannot use stairs while holding %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getFlavor());
      return false;
    }
  }

  if (actor.grabbed && !isPush) {
    const dirToItem = Utils.dirFromTo(actor, actor.grabbed);
    let destXY = [actor.grabbed.x + dir[0], actor.grabbed.y + dir[1]];
    const destCell = map.cell(destXY[0], destXY[1]);

    let blocked = (destCell.item || destCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY));
    if (Utils.isOppositeDir(dirToItem, dir)) {  // pull
      if (!actor.grabbed.hasActionFlag(Flags.Action.A_PULL)) {
        GW.message.forPlayer(actor, '%s cannot pull %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getFlavor());
        return false;
      }
    }
    else {  // slide
      if (!actor.grabbed.hasActionFlag(Flags.Action.A_SLIDE)) {
        GW.message.forPlayer(actor, '%s cannot slide %s.', actor.getName({article: 'the', color: true }), actor.grabbed.getFlavor());
        return false;
      }
      if (destCell.actor) {
        blocked = true;
      }
    }

    if (blocked) {
      GW.message.forPlayer(actor, '%s let go of %s.', actor.getName(), actor.grabbed.getName('a'));
      await GW.fx.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
      actor.grabbed = null;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    Utils.ERROR('Move failed! ' + newX + ',' + newY);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  if (actor.isPlayer()) {
    map.clearCellFlags(actor.x, actor.y, Flags.Cell.IS_IN_PATH);
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
  let fired = false;
  if (isPlayer) {
    fired = await cell.fireEvent('playerEnter', ctx);
  }
  if (!fired) {
    await cell.fireEvent('enter', ctx);
  }

  if (cell.hasTileFlag(Flags.Tile.T_HAS_STAIRS) && isPlayer) {
    console.log('Use stairs!');
    await Game.useStairs(newX, newY);
  }

  // auto pickup any items
  if (GW.config.autoPickup && cell.item && isPlayer) {
    await Actions.pickup(actor, cell.item, ctx);
  }

  Actions.debug('moveComplete');

  if (actor.isPlayer()) {
    GW.ui.updatePathToCursor();
  }

  GW.ui.requestUpdate();
  actor.endTurn();
  return true;
}

Actions.moveDir = moveDir;
