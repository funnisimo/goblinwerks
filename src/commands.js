

import { Flags as TileFlags, tile as TILE } from './tile.js';
import { KindFlags as ItemKindFlags, ActionFlags as ItemActionFlags } from './item.js';
import { game as GAME } from './game.js';
import { data as DATA, def, commands, ui as UI, message as MSG, utils as UTILS, fx as FX } from './gw.js';


commands.debug = UTILS.NOOP;

async function rest(e) {
	PLAYER.endTurn();
	return true;
}

commands.rest = rest;


async function moveDir(e) {
  const actor = e.actor || DATA.player;
  const dir = e.dir;
  const newX = dir[0] + actor.x;
  const newY = dir[1] + actor.y;
  const map = DATA.map;
  const cell = map.cell(newX, newY);

  const ctx = { actor, map, x: newX, y: newY, cell };

  commands.debug('moveDir');

  if (!map.hasXY(newX, newY)) {
    commands.debug('move blocked - invalid xy: %d,%d', newX, newY);
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
    await FX.flashSprite(map, newX, newY, 'hit', 50, 1);
    return false;
  }
  if (map.diagonalBlocked(actor.x, actor.y, newX, newY)) {
    MSG.moveBlocked(ctx);
    // TURN ENDED (1/2 turn)?
    await FX.flashSprite(map, newX, newY, 'hit', 50, 1);
    return false;
  }

  let isPush = false;
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
    isPush = true;
    // Do we need to activate stuff - key enter, key leave?
  }

  // CHECK SOME SANITY MOVES
  if (cell.hasTileFlag(TileFlags.T_LAVA) && !cell.hasTileFlag(TileFlags.T_BRIDGE)) {
    if (!await UI.confirm('That is certain death!  Proceed anyway?')) {
      return false;
    }
  }
  else if (cell.hasTileFlag(TileFlags.T_HAS_STAIRS)) {
    if (actor.grabbed) {
      MSG.add('You cannot use stairs while holding %s.', actor.grabbed.flavorText());
      return false;
    }
  }

  if (actor.grabbed && !isPush) {
    const dirToItem = UTILS.dirFromTo(actor, actor.grabbed);
    let destXY = [actor.grabbed.x + dir[0], actor.grabbed.y + dir[1]];
    if (UTILS.isOppositeDir(dirToItem, dir)) {  // pull
      if (!actor.grabbed.hasActionFlag(ItemActionFlags.A_PULL)) {
        MSG.add('you cannot pull %s.', actor.grabbed.flavorText());
        return false;
      }
    }
    else {  // slide
      if (!actor.grabbed.hasActionFlag(ItemActionFlags.A_SLIDE)) {
        MSG.add('you cannot slide %s.', actor.grabbed.flavorText());
        return false;
      }
    }
    const destCell = map.cell(destXY[0], destXY[1]);
    if (destCell.item || destCell.hasTileFlag(TileFlags.T_OBSTRUCTS_ITEMS)) {
      commands.debug('move blocked - item obstructed: %d,%d', destXY[0], destXY[1]);
      MSG.moveBlocked(ctx);
      return false;
    }
  }

  if (!map.moveActor(newX, newY, actor)) {
    MSG.moveFailed(ctx);
    // TURN ENDED (1/2 turn)?
    return false;
  }

  if (actor.grabbed && !isPush) {
    map.removeItem(actor.grabbed);
    map.addItem(actor.grabbed.x + dir[0], actor.grabbed.y + dir[1], actor.grabbed);
  }

  // APPLY EFFECTS
  for(let tile of cell.tiles()) {
    await TILE.applyInstantEffects(tile, cell);
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

  if (cell.hasTileFlag(TileFlags.T_HAS_STAIRS)) {
    console.log('Use stairs!');
    await GAME.useStairs(newX, newY);
  }

  commands.debug('moveComplete');

  UI.requestUpdate();
  actor.endTurn();
  return true;
}

commands.moveDir = moveDir;


// async function moveTo(x, y, actor) {
//   actor = actor || DATA.player;
//   return commands.moveDir(x - actor.x, y - actor.y, actor);
// }


async function grab(e) {
  const actor = e.actor || DATA.player;
  const map = DATA.map;

  if (actor.grabbed) {
    MSG.add('You let go of %s.', actor.grabbed.flavorText());
    await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
    actor.grabbed = null;
    actor.endTurn();
    return true;
  }

  const candidates = [];
  let choice;
  map.eachNeighbor(actor.x, actor.y, (c) => {
    if (c.item && c.item.hasActionFlag(ItemActionFlags.A_GRABBABLE)) {
      candidates.push(c.item);
    }
  }, true);
  if (!candidates.length) {
    MSG.add('Nothing to grab.');
    return false;
  }
  else if (candidates.length == 1) {
    choice = candidates[0];
  }
  else {
    choice = await UI.chooseTarget(candidates, 'Grab what?');
  }
  if (!choice) {
    return false; // cancelled
  }

  actor.grabbed = choice;
  MSG.add('you grab %s.', actor.grabbed.flavorText());
  await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
  actor.endTurn();
  return true;
}

commands.grab = grab;

//
//
// async function attack(e) {
//   const actor = e.actor || DATA.player;
//   const map = DATA.map;
//
//   if (actor.target && actor.target.isDead()) {
//     actor.target = null;
//   }
//
//   const candidates = [];
//   let choice;
//   map.eachNeighbor(actor.x, actor.y, (c) => {
//     if (c.actor && actor.willAttack(c.actor)) {
//       candidates.shift(c.actor);
//     }
//     else if (c.item && c.item.hasActionFlag(ItemActionFlags.A_DESTROY)) {
//       candidates.push(c.item);
//     }
//   });
//   if (!candidates.length) {
//     MSG.add('No targets.');
//     return false;
//   }
//   else if (candidates.length == 1) {
//     choice = candidates[0];
//   }
//   else {
//     choice = await UI.chooseTarget(candidates, 'Attack where?');
//   }
//   if (!choice) {
//     return false; // cancelled
//   }
//
//   if (choice instanceOf GW.types.Item) {
//     actor.target = choice;
//     MSG.add('you bash %s.', actor.grabbed.flavorText());
//     await FX.flashSprite(map, actor.grabbed.x, actor.grabbed.y, 'target', 100, 1);
//     actor.endTurn();
//     return true;
//   }
//   else {
//     MSG.add('Not implemented.');
//     return false;
//   }
//
// }
//
// commands.grab = grab;
