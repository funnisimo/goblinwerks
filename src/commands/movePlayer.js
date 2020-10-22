

import * as Flags from '../flags.js';
import { pickupItem, attack } from '../actions/index.js';
import { game as GAME } from '../game.js';
import * as Actor from '../actor.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX, config as CONFIG } from '../gw.js';

CONFIG.autoPickup = true;


async function movePlayer(e) {
  const actor = e.actor || DATA.player;
  const dir = e.dir;
  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = DATA.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };
  const isPlayer = actor.isPlayer();

  commands.debug('movePlayer');

  if (!map.hasXY(newX, newY)) {
    commands.debug('move blocked - invalid xy: %d,%d', newX, newY);
    if (isPlayer) MSG.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  // TODO - Can we leave old cell?
  // PROMOTES ON EXIT, NO KEY(?), PLAYER EXIT, ENTANGLED

  if (cell.actor) {
    if (await Actor.bump(actor, cell.actor, ctx)) {
      return true;
    }

    MSG.add('%s bump into %s.', actor.getName(), cell.actor.getName());
    actor.endTurn(0.5);
    return true;
  }

  let isPush = false;
  if (cell.item && cell.item.hasKindFlag(Flags.ItemKind.IK_BLOCKS_MOVE)) {
    if (!cell.item.hasActionFlag(Flags.Action.A_PUSH)) {
      ctx.item = cell.item;
      if (isPlayer) MSG.moveBlocked(ctx);
      return false;
    }
    const pushX = newX + dir[0];
    const pushY = newY + dir[1];
    const pushCell = map.cell(pushX, pushY);
    if (!pushCell.isEmpty() || pushCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
      if (isPlayer) MSG.moveBlocked(ctx);
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
    if (isPlayer) {
      MSG.moveBlocked(ctx);
      // TURN ENDED (1/2 turn)?
      await FX.flashSprite(map, newX, newY, 'hit', 50, 1);
    }
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    if (isPlayer)  {
      MSG.moveBlocked(ctx);
      // TURN ENDED (1/2 turn)?
      await FX.flashSprite(map, newX, newY, 'hit', 50, 1);
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
      if (isPlayer) {
        MSG.add('You cannot use stairs while holding %s.', actor.grabbed.getFlavor());
      }
      return false;
    }
  }

  if (actor.grabbed && !isPush) {
    const dirToItem = UTILS.dirFromTo(actor, actor.grabbed);
    let destXY = [actor.grabbed.x + dir[0], actor.grabbed.y + dir[1]];
    if (UTILS.isOppositeDir(dirToItem, dir)) {  // pull
      if (!actor.grabbed.hasActionFlag(Flags.Action.A_PULL)) {
        if (isPlayer) MSG.add('you cannot pull %s.', actor.grabbed.getFlavor());
        return false;
      }
    }
    else {  // slide
      if (!actor.grabbed.hasActionFlag(Flags.Action.A_SLIDE)) {
        if (isPlayer) MSG.add('you cannot slide %s.', actor.grabbed.getFlavor());
        return false;
      }
    }
    const destCell = map.cell(destXY[0], destXY[1]);
    if (destCell.item || destCell.actor || destCell.hasTileFlag(Flags.Tile.T_OBSTRUCTS_ITEMS | Flags.Tile.T_OBSTRUCTS_PASSABILITY)) {
      MSG.add('%s let go of %s.', actor.getName(), actor.grabbed.getName('a'));
      await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
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
    if (DATA.gameHasEnded) {
      return true;
    }
  }

  // PROMOTES ON ENTER, PLAYER ENTER, KEY(?)
  let fired = false;
  if (DATA.player === actor) {
    fired = await cell.fireEvent('playerEnter', ctx);
  }
  if (!fired) {
    await cell.fireEvent('enter', ctx);
  }

  if (cell.hasTileFlag(Flags.Tile.T_HAS_STAIRS) && isPlayer) {
    console.log('Use stairs!');
    await GAME.useStairs(newX, newY);
  }

  // auto pickup any items
  if (CONFIG.autoPickup && cell.item && isPlayer) {
    await pickupItem(actor, cell.item, ctx);
  }

  commands.debug('moveComplete');

  UI.requestUpdate();
  actor.endTurn();
  return true;
}

commands.movePlayer = movePlayer;
