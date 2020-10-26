
import { grid as GRID } from '../grid.js';
import { path as PATH } from '../path.js';
import * as Utils from '../utils.js';
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
    if (await Actions.moveDir(actor, dir, ctx)) {
      return true;
    }
  }

  let travelGrid = actor.travelGrid;
  if (!travelGrid) {
    travelGrid = actor.travelGrid = GRID.alloc(map.width, map.height);
    travelGrid.x = travelGrid.y = -1;
  }
  if (travelGrid.x != x || travelGrid.y != y) {
    const costGrid = GRID.alloc(map.width, map.height);
    actor.fillCostGrid(map, costGrid);
    PATH.calculateDistances(travelGrid, x, y, costGrid, true);
    GRID.free(costGrid);
  }

  const dir = nextStep(map, travelGrid, actor.x, actor.y, actor, true);
  if (!dir) return false;

  return await Actions.moveDir(actor, dir, ctx);
}



// Returns null if there are no beneficial moves.
// If preferDiagonals is true, we will prefer diagonal moves.
// Always rolls downhill on the distance map.
// If monst is provided, do not return a direction pointing to
// a cell that the monster avoids.
function nextStep( map, distanceMap, x, y, traveler, useDiagonals) {
	let newX, newY, bestScore;
  let dir, bestDir;
  let blocker;	// creature *
  let blocked;

  // brogueAssert(coordinatesAreInMap(x, y));

	bestScore = 0;
	bestDir = def.NO_DIRECTION;

	for (dir = 0; dir < (useDiagonals ? 8 : 4); ++dir)
  {
		newX = x + def.dirs[dir][0];
		newY = y + def.dirs[dir][1];

    if (map.hasXY(newX, newY)) {
        blocked = false;
        const cell = map.cell(newX, newY);
        blocker = cell.actor;
        if (traveler
            && traveler.avoidsCell(cell, newX, newY))
				{
            blocked = true;
        } else if (traveler && blocker
                   && !traveler.kind.canPass(traveler, blocker))
				{
            blocked = true;
        }
        if (!blocked
						&& (distanceMap[x][y] - distanceMap[newX][newY]) > bestScore
            && !map.diagonalBlocked(x, y, newX, newY, traveler.isPlayer())
            && map.isPassableNow(newX, newY, traveler.isPlayer()))
				{
            bestDir = dir;
            bestScore = distanceMap[x][y] - distanceMap[newX][newY];
        }
    }
	}
	return def.dirs[bestDir] || null;
}

Actions.moveToward = moveToward;
