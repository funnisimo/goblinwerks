
// CREDIT - Most of this is adapted from Brogue 1.7.5


import { Flags as CellFlags, MechFlags as CellMechFlags } from './cell.js';
import { MechFlags as TileMechFlags } from './tile.js';
import { config as CONFIG, data as DATA, types } from './gw.js';


export var fov = {};


const FP_BASE = 16;
const BIG_BASE = 16n;
const LOS_SLOPE_GRANULARITY =	32768;		// how finely we divide up the squares when calculating slope;


CONFIG.DEFAULT_CELL_FLAGS = 0;




/* Computing the number of leading zeros in a word. */
function clz(x)
{
    let n;

    /* See "Hacker's Delight" book for more details */
    if (x == 0) return 32;
    n = 0;
    if (x <= 0x0000FFFF) {n = n +16; x = (x <<16) >>> 0;}
    if (x <= 0x00FFFFFF) {n = n + 8; x = (x << 8) >>> 0;}
    if (x <= 0x0FFFFFFF) {n = n + 4; x = (x << 4) >>> 0;}
    if (x <= 0x3FFFFFFF) {n = n + 2; x = (x << 2) >>> 0;}
    if (x <= 0x7FFFFFFF) {n = n + 1;}

    return n;
}


function fp_sqrt(val)
{
    let x;
    let bitpos;
    let v;		// int64

    if(!val)
        return val;

    if (val < 0) {
    	throw new Error('MATH OVERFLOW - limit is 32767 << FP_BASE (about 181 * 181)! Received: ' + val);
    }

    /* clz = count-leading-zeros. bitpos is the position of the most significant bit,
        relative to "1" or 1 << FP_BASE */
    bitpos = FP_BASE - clz(val);

    /* Calculate our first estimate.
        We use the identity 2^a * 2^a = 2^(2*a) or:
         sqrt(2^a) = 2^(a/2)
    */
    if(bitpos > 0) /* val > 1 */
        x = BigInt((1<<FP_BASE) << (bitpos >> 1));
    else if(bitpos < 0) /* 0 < val < 1 */
        x = BigInt((1<<FP_BASE) << ((~bitpos) << 1));
    else /* val == 1 */
        x = BigInt((1<<FP_BASE));

    /* We need to scale val with FP_BASE due to the division.
       Also val /= 2, hence the subtraction of one*/
    v = BigInt(val) << (BIG_BASE - 1n);  // v = val <<  (FP_BASE - 1);

    /* The actual iteration */
    x = (x >> 1n) + (v/x);
    x = (x >> 1n) + (v/x);
    x = (x >> 1n) + (v/x);
    x = (x >> 1n) + (v/x);

    return Number(x);
}

//
// function updateFieldOfViewDisplay(i, j, refreshDisplay) {
//
// 	refreshDisplay = (refreshDisplay !== false);
//
//   const map = DATA.map;
// 	const cell = map.cell(i, j);
//
// 	if (cell.flags & CellFlags.IN_FIELD_OF_VIEW
// 		&& (map.hasVisibleLight(i, j))
// 		&& !(cell.flags & CellFlags.CLAIRVOYANT_DARKENED))
// 	{
// 		cell.flags |= CellFlags.VISIBLE;
// 	}
//
// 	if ((cell.flags & CellFlags.VISIBLE) && !(cell.flags & CellFlags.WAS_VISIBLE)) { // if the cell became visible this move
// 		if (!(cell.flags & CellFlags.REVEALED) && DATA.automationActive) {
//         if (cell.flags & CellFlags.HAS_ITEM) {
//             const theItem = map.itemAt(i, j);
//             if (theItem && theItem.category && (GW.categories[theItem.category].flags & GW.const.IC_INTERRUPT_EXPLORATION_WHEN_SEEN)) {
//                 const name = GW.item.name(theItem, false, true, NULL);
//                 const buf = GW.string.format("you see %s.", name);
//                 GW.ui.message(GW.colors.itemMessageColor, buf);
//             }
//         }
//         if (!(cell.flags & CellFlags.MAGIC_MAPPED)
//             && map.hasTileMechFlag(i, j, TM_INTERRUPT_EXPLORATION_WHEN_SEEN))
// 				{
//             const name = map.tileWithMechFlag(i, j, TM_INTERRUPT_EXPLORATION_WHEN_SEEN).description;
//             const buf = GW.string.format("you see %s.", name);
//             GW.ui.message(GW.colors.backgroundMessageColor, buf);
//         }
//     }
//     map.markRevealed(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.VISIBLE) && (cell.flags & CellFlags.WAS_VISIBLE)) { // if the cell ceased being visible this move
//     map.storeMemory(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.CLAIRVOYANT_VISIBLE) && (cell.flags & CellFlags.WAS_CLAIRVOYANT_VISIBLE)) { // ceased being clairvoyantly visible
// 		map.storeMemory(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.WAS_CLAIRVOYANT_VISIBLE) && (cell.flags & CellFlags.CLAIRVOYANT_VISIBLE)) { // became clairvoyantly visible
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.TELEPATHIC_VISIBLE) && (cell.flags & CellFlags.WAS_TELEPATHIC_VISIBLE)) { // ceased being telepathically visible
//     map.storeMemory(i, j);
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.WAS_TELEPATHIC_VISIBLE) && (cell.flags & CellFlags.TELEPATHIC_VISIBLE)) { // became telepathically visible
//     if (!(cell.flags & CellFlags.REVEALED)
// 			&& !map.hasTileFlag(i, j, T_PATHING_BLOCKER))
// 		{
// 			DATA.xpxpThisTurn++;
//     }
//
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.MONSTER_DETECTED) && (cell.flags & CellFlags.WAS_MONSTER_DETECTED)) { // ceased being detected visible
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 			map.storeMemory(i, j);
// 		}
// 	} else if (!(cell.flags & CellFlags.WAS_MONSTER_DETECTED) && (cell.flags & CellFlags.MONSTER_DETECTED)) { // became detected visible
// 		cell.flags &= ~STABLE_MEMORY;
// 		if (refreshDisplay) {
// 			map.redrawCell(i, j);
// 			map.storeMemory(i, j);
// 		}
// 	} else if (GW.player.canSeeOrSense(i, j)
// 			   && GW.map.lightChanged(i, j)) // if the cell's light color changed this move
// 	{
//    if (refreshDisplay) {
// 	   map.redrawCell(i, j);
//    }
// 	}
// }
//
// fov.updateCellDisplay = updateFieldOfViewDisplay;
//
//
//
// function demoteVisibility() {
// 	let i, j;
//
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			const cell = DATA.map.cell(i, j);
// 			cell.flags &= ~WAS_VISIBLE;
// 			if (cell.flags & CellFlags.VISIBLE) {
// 				cell.flags &= ~VISIBLE;
// 				cell.flags |= WAS_VISIBLE;
// 			}
// 		}
// 	}
// }
//
//
// function updateVision(refreshDisplay) {
// 	let i, j;
// 	let theItem;	// item *
// 	let monst;	// creature *
//
//   demoteVisibility();
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			DATA.map.cell(i, j).flags &= ~IN_FIELD_OF_VIEW;
// 		}
// 	}
//
// 	// Calculate player's field of view (distinct from what is visible, as lighting hasn't been done yet).
// 	const maxRadius = GW.player.visionRadius();
// 	const grid = GW.grid.alloc();
// 	getFOVMask(grid, GW.PLAYER.x, GW.PLAYER.y, maxRadius, (T_OBSTRUCTS_VISION), 0, false);
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			if (grid[i][j]) {
// 				DATA.map.setCellFlags(i, j, IN_FIELD_OF_VIEW);
// 			}
// 		}
// 	}
// 	GW.grid.free(grid);
//
// 	DATA.map.setCellFlags(GW.PLAYER.x, GW.PLAYER.y, IN_FIELD_OF_VIEW | VISIBLE);
//
// 	// if (PLAYER.bonus.clairvoyance < 0) {
//   //   discoverCell(PLAYER.xLoc, PLAYER.yLoc);
// 	// }
// 	//
// 	// if (PLAYER.bonus.clairvoyance != 0) {
// 	// 	updateClairvoyance();
// 	// }
//
//   // updateTelepathy();
// 	// updateMonsterDetection();
//
// 	// updateLighting();
// 	for (i=0; i<DATA.map.width; i++) {
// 		for (j=0; j<DATA.map.height; j++) {
// 			fov.updateCellDisplay(i, j, refreshDisplay);
// 		}
// 	}
//
// 	if (GW.PLAYER.status[GW.const.STATUS_HALLUCINATING] > 0) {
// 		for (theItem of GW.ITEMS) {
// 			if (DATA.map.hasCellFlag(theItem.x, theItem.y, REVEALED) && refreshDisplay) {
// 				DATA.map.redrawCell(theItem.x, theItem.y);
// 			}
// 		}
// 		for (monst of GW.ACTORS) {
// 			if (DATA.map.hasCellFlag(monst.x, monst.y, REVEALED) && refreshDisplay) {
// 				DATA.map.redrawCell(monst.x, monst.y);
// 			}
// 		}
// 	}
//
// }
//
//
// fov.update = updateVision;
//



//		   Octants:      //
//			\7|8/        //
//			6\|/1        //
//			--@--        //
//			5/|\2        //
//			/4|3\        //

function betweenOctant1andN(x, y, x0, y0, n) {
	let x1 = x, y1 = y;
	let dx = x1 - x0, dy = y1 - y0;
	switch (n) {
		case 1:
			return [x,y];
		case 2:
			return [x, y0 - dy];
		case 5:
			return [x0 - dx, y0 - dy];
		case 6:
			return [x0 - dx, y];
		case 8:
			return [x0 - dy, y0 - dx];
		case 3:
			return [x0 - dy, y0 + dx];
		case 7:
			return [x0 + dy, y0 - dx];
		case 4:
			return [x0 + dy, y0 + dx];
	}
}


export class FOV {
  constructor(grid, isBlocked) {
    this.grid = grid;
    this.isBlocked = isBlocked;
  }

  isVisible(x, y) { return this.grid.hasXY(x, y) && this.grid[x][y]; }
  setVisible(x, y) { this.grid[x][y] = 1; }

  calculate(x, y, maxRadius, cautiousOnWalls) {
    this.grid.fill(0);
    this.grid[x][y] = 1;
    for (let i=1; i<=8; i++) {
  		this._scanOctant(x, y, i, (maxRadius + 1) << FP_BASE, 1, LOS_SLOPE_GRANULARITY * -1, 0, cautiousOnWalls);
  	}
  }

  // This is a custom implementation of recursive shadowcasting.
  _scanOctant(xLoc, yLoc, octant, maxRadius,
  				   columnsRightFromOrigin, startSlope, endSlope, cautiousOnWalls)
  {
  	// GW.debug.log('scanOctantFOV', xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin, startSlope, endSlope);
  	if ((columnsRightFromOrigin << FP_BASE) >= maxRadius) {
  		// GW.debug.log(' - columnsRightFromOrigin >= maxRadius', columnsRightFromOrigin << FP_BASE, maxRadius);
  		return;
  	}

  	let i, a, b, iStart, iEnd, x, y, x2, y2; // x and y are temporary variables on which we do the octant transform
  	let newStartSlope, newEndSlope;
  	let cellObstructed;
  	let loc;

  	// if (Math.floor(maxRadius) != maxRadius) {
  	// 		maxRadius = Math.floor(maxRadius);
  	// }
  	newStartSlope = startSlope;

  	a = (((LOS_SLOPE_GRANULARITY / -2 + 1) + startSlope * columnsRightFromOrigin) / LOS_SLOPE_GRANULARITY) >> 0;
  	b = (((LOS_SLOPE_GRANULARITY / -2 + 1) + endSlope * columnsRightFromOrigin) / LOS_SLOPE_GRANULARITY) >> 0;

  	iStart = Math.min(a, b);
  	iEnd = Math.max(a, b);

  	// restrict vision to a circle of radius maxRadius

  	let radiusSquared = Number(BigInt(maxRadius*maxRadius) >> (BIG_BASE*2n));
  	radiusSquared += (maxRadius >> FP_BASE);
  	if ((columnsRightFromOrigin*columnsRightFromOrigin + iEnd*iEnd) >= radiusSquared ) {
  		// GW.debug.log(' - columnsRightFromOrigin^2 + iEnd^2 >= radiusSquared', columnsRightFromOrigin, iEnd, radiusSquared);
  		return;
  	}
  	if ((columnsRightFromOrigin*columnsRightFromOrigin + iStart*iStart) >= radiusSquared ) {
  		const bigRadiusSquared = Number(BigInt(maxRadius*maxRadius) >> BIG_BASE); // (maxRadius*maxRadius >> FP_BASE)
  		const bigColumsRightFromOriginSquared = Number(BigInt(columnsRightFromOrigin*columnsRightFromOrigin) << BIG_BASE);	// (columnsRightFromOrigin*columnsRightFromOrigin << FP_BASE)
  		iStart = Math.floor(-1 * fp_sqrt(bigRadiusSquared - bigColumsRightFromOriginSquared) >> FP_BASE);
  	}

  	x = xLoc + columnsRightFromOrigin;
  	y = yLoc + iStart;
  	loc = betweenOctant1andN(x, y, xLoc, yLoc, octant);
  	x = loc[0];
  	y = loc[1];
  	let currentlyLit = this.isBlocked(x, y);

  	// GW.debug.log(' - scan', iStart, iEnd);
  	for (i = iStart; i <= iEnd; i++) {
  		x = xLoc + columnsRightFromOrigin;
  		y = yLoc + i;
  		loc = betweenOctant1andN(x, y, xLoc, yLoc, octant);
  		x = loc[0];
  		y = loc[1];

  		cellObstructed = this.isBlocked(x, y);
  		// if we're cautious on walls and this is a wall:
  		if (cautiousOnWalls && cellObstructed) {
  			// (x2, y2) is the tile one space closer to the origin from the tile we're on:
  			x2 = xLoc + columnsRightFromOrigin - 1;
  			y2 = yLoc + i;
  			if (i < 0) {
  				y2++;
  			} else if (i > 0) {
  				y2--;
  			}
  			loc = betweenOctant1andN(x2, y2, xLoc, yLoc, octant);
  			x2 = loc[0];
  			y2 = loc[1];

  			if (this.isVisible(x2, y2)) {
  				// previous tile is visible, so illuminate
  				this.setVisible(x, y);
  			}
  		} else {
  			// illuminate
        this.setVisible(x, y);
  		}
  		if (!cellObstructed && !currentlyLit) { // next column slope starts here
  			newStartSlope = ((LOS_SLOPE_GRANULARITY * (i) - LOS_SLOPE_GRANULARITY / 2) / (columnsRightFromOrigin * 2 + 1) * 2) >> 0;
  			currentlyLit = true;
  		} else if (cellObstructed && currentlyLit) { // next column slope ends here
  			newEndSlope = ((LOS_SLOPE_GRANULARITY * (i) - LOS_SLOPE_GRANULARITY / 2)
  							/ (columnsRightFromOrigin * 2 - 1) * 2) >> 0;
  			if (newStartSlope <= newEndSlope) {
  				// run next column
  				this._scanOctant(xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin + 1, newStartSlope, newEndSlope, cautiousOnWalls);
  			}
  			currentlyLit = false;
  		}
  	}
  	if (currentlyLit) { // got to the bottom of the scan while lit
  		newEndSlope = endSlope;
  		if (newStartSlope <= newEndSlope) {
  			// run next column
  			this._scanOctant(xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin + 1, newStartSlope, newEndSlope, cautiousOnWalls);
  		}
  	}
  }
}

types.FOV = FOV;
