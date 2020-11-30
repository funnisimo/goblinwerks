

import * as Grid from './grid.js';
import * as Flags from './flags.js';
import { data as DATA, config as CONFIG } from './gw.js';



function demoteCellVisibility(cell, i, j, map) {
  cell.flags &= ~Flags.Cell.WAS_VISIBLE;
  if (cell.flags & Flags.Cell.VISIBLE) {
    cell.flags &= ~Flags.Cell.VISIBLE;
    cell.flags |= Flags.Cell.WAS_VISIBLE;
  }
}

function promoteCellVisibility(cell, i, j, map) {

	if (cell.flags & Flags.Cell.IN_FOV
		&& (map.hasVisibleLight(i, j))
		&& !(cell.flags & Flags.Cell.CLAIRVOYANT_DARKENED))
	{
		cell.flags |= Flags.Cell.VISIBLE;
	}

	if ((cell.flags & Flags.Cell.VISIBLE) && !(cell.flags & Flags.Cell.WAS_VISIBLE)) { // if the cell became visible this move
		if (!(cell.flags & Flags.Cell.REVEALED) && DATA.automationActive) {
        if (cell.item) {
            const theItem = cell.item;
            if (theItem.hasKindFlag(Flags.ItemKind.IK_INTERRUPT_EXPLORATION_WHEN_SEEN)) {
                MSG.add('§you§ §see§ ΩitemMessageColorΩ§item§∆.', { item, actor: GW.data.player });
            }
        }
        if (!(cell.flags & Flags.Cell.MAGIC_MAPPED)
            && cell.hasTileMechFlag(Flags.TileMech.TM_INTERRUPT_EXPLORATION_WHEN_SEEN))
				{
            const tile = cell.tileWithMechFlag(Flags.TileMech.TM_INTERRUPT_EXPLORATION_WHEN_SEEN);
            MSG.add('§you§ §see§ ΩbackgroundMessageColorΩ§item§∆.', { actor: GW.data.player, item: tile.name });
        }
    }
    cell.markRevealed();
		map.redrawCell(cell);
	} else if (!(cell.flags & Flags.Cell.VISIBLE) && (cell.flags & Flags.Cell.WAS_VISIBLE)) { // if the cell ceased being visible this move
    cell.storeMemory();
		map.redrawCell(cell);
	} else if (!(cell.flags & Flags.Cell.CLAIRVOYANT_VISIBLE) && (cell.flags & Flags.Cell.WAS_CLAIRVOYANT_VISIBLE)) { // ceased being clairvoyantly visible
		cell.storeMemory();
		map.redrawCell(cell);
	} else if (!(cell.flags & Flags.Cell.WAS_CLAIRVOYANT_VISIBLE) && (cell.flags & Flags.Cell.CLAIRVOYANT_VISIBLE)) { // became clairvoyantly visible
		cell.flags &= ~STABLE_MEMORY;
		map.redrawCell(cell);
	} else if (!(cell.flags & Flags.Cell.TELEPATHIC_VISIBLE) && (cell.flags & Flags.Cell.WAS_TELEPATHIC_VISIBLE)) { // ceased being telepathically visible
    cell.storeMemory();
		map.redrawCell(cell);
	} else if (!(cell.flags & Flags.Cell.WAS_TELEPATHIC_VISIBLE) && (cell.flags & Flags.Cell.TELEPATHIC_VISIBLE)) { // became telepathically visible
    if (!(cell.flags & Flags.Cell.REVEALED)
			&& !cell.hasTileFlag(Flags.Tile.T_PATHING_BLOCKER))
		{
			DATA.xpxpThisTurn++;
    }
		cell.flags &= ~Flags.Cell.STABLE_MEMORY;
		map.redrawCell(cell);
	} else if (!(cell.flags & Flags.Cell.MONSTER_DETECTED) && (cell.flags & Flags.Cell.WAS_MONSTER_DETECTED)) { // ceased being detected visible
		cell.flags &= ~Flags.Cell.STABLE_MEMORY;
		map.redrawCell(cell);
    cell.storeMemory();
	} else if (!(cell.flags & Flags.Cell.WAS_MONSTER_DETECTED) && (cell.flags & Flags.Cell.MONSTER_DETECTED)) { // became detected visible
		cell.flags &= ~Flags.Cell.STABLE_MEMORY;
		map.redrawCell(cell);
    cell.storeMemory();
	} else if (cell.isAnyKindOfVisible()
			   && cell.lightChanged()) // if the cell's light color changed this move
	{
   map.redrawCell(cell);
	}
}


export function initMap(map) {
  if (!CONFIG.fov) {
    map.forEach( (cell) => cell.flags |= Flags.Cell.REVEALED );
    return;
  }

  map.clearFlags(0, Flags.Cell.IS_WAS_ANY_KIND_OF_VISIBLE);
}


export function update(map, x, y, maxRadius) {
  if (!CONFIG.fov) return;

  if (!(map.flags & Flags.Map.MAP_FOV_CHANGED)) return;
  map.flags &= ~Flags.Map.MAP_FOV_CHANGED;

  map.forEach( demoteCellVisibility );
  map.clearFlags(0, Flags.Cell.IN_FOV);

  // Calculate player's field of view (distinct from what is visible, as lighting hasn't been done yet).
  const grid = Grid.alloc(map.width, map.height, 0);
  map.calcFov(grid, x, y, maxRadius);
  grid.forEach( (v, i, j) => {
    if (v) {
      map.setCellFlags(i, j, Flags.Cell.IN_FOV);
    }
  });
  Grid.free(grid);

	map.setCellFlags(x, y, Flags.Cell.IN_FOV | Flags.Cell.VISIBLE);

	// if (PLAYER.bonus.clairvoyance < 0) {
  //   discoverCell(PLAYER.xLoc, PLAYER.yLoc);
	// }
  //
	// if (PLAYER.bonus.clairvoyance != 0) {
	// 	updateClairvoyance();
	// }
  //
  // updateTelepathy();
	// updateMonsterDetection();

	// updateLighting();
	map.forEach( promoteCellVisibility );

	// if (PLAYER.status.hallucinating > 0) {
	// 	for (theItem of DUNGEON.items) {
	// 		if ((pmap[theItem.xLoc][theItem.yLoc].flags & DISCOVERED) && refreshDisplay) {
	// 			refreshDungeonCell(theItem.xLoc, theItem.yLoc);
	// 		}
	// 	}
	// 	for (monst of DUNGEON.monsters) {
	// 		if ((pmap[monst.xLoc][monst.yLoc].flags & DISCOVERED) && refreshDisplay) {
	// 			refreshDungeonCell(monst.xLoc, monst.yLoc);
	// 		}
	// 	}
	// }

}
