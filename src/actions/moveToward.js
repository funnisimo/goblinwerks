
import { utils as Utils, grid as Grid, path as Path } from 'gw-core';
import { data as DATA, def } from '../gw.js';
import { actions as Actions } from './index.js';


export async function moveToward(actor, x, y, ctx) {

  const map = ctx.map || DATA.map;
  const destCell = map.cell(x, y);
  const fromCell = map.cell(actor.x, actor.y);

  if (actor.x == x && actor.y == y) {
    return false; // Hmmm...  Not sure on this one
  }

  if (destCell.isVisible() && fromCell.isVisible()) {
    const dir = Utils.dirBetween(actor.x, actor.y, x, y); // TODO = try 3 directions direct, -45, +45
    const spread = Utils.dirSpread(dir);
    ctx.bump = false;
    for(let i = 0; i < spread.length; ++i) {
      const d = spread[i];
      if (await Actions.moveDir(actor, d, ctx)) {
        return true;
      }
    }
    ctx.bump = true;
  }

  let travelGrid = actor.travelGrid;
  if (!travelGrid) {
    travelGrid = actor.travelGrid = Grid.alloc(map.width, map.height);
    travelGrid.x = travelGrid.y = -1;
  }
  if (travelGrid.x != x || travelGrid.y != y) {
    const costGrid = Grid.alloc(map.width, map.height);
    actor.fillCostGrid(map, costGrid);
    Path.calculateDistances(travelGrid, x, y, costGrid, true);
    Grid.free(costGrid);
  }

  const dir = Path.nextStep(map, travelGrid, actor.x, actor.y, actor, true);
  if (!dir) return false;

  return await Actions.moveDir(actor, dir, ctx);
}



Actions.moveToward = moveToward;
