
// CREDIT - Most of this is adapted from Brogue 1.7.5


import { Flags as CellFlags, MechFlags as CellMechFlags } from './cell.js';
import { MechFlags as TileMechFlags } from './tile.js';
import { config as CONFIG, data as DATA, types, utils as UTILS } from './gw.js';


export var fov = {};

fov.debug = UTILS.NOOP;

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
  constructor(grid, isBlockedFn) {
    this.grid = grid;
    this.isBlocked = isBlockedFn;
  }

  isVisible(x, y) { return this.grid.hasXY(x, y) && this.grid[x][y]; }
  setVisible(x, y) {
    if (this.grid.hasXY(x, y)) {
      this.grid[x][y] = 1;
    }
  }

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
  	// fov.debug('scanOctantFOV', xLoc, yLoc, octant, maxRadius, columnsRightFromOrigin, startSlope, endSlope);
  	if ((columnsRightFromOrigin << FP_BASE) >= maxRadius) {
  		// fov.debug(' - columnsRightFromOrigin >= maxRadius', columnsRightFromOrigin << FP_BASE, maxRadius);
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

    fov.debug('SCAN OCTANT #%d @ %d,%d, crfo=%d, iStart=%d, iEnd=%d, startSlope=%d, endSlope=%d', octant, xLoc, yLoc, columnsRightFromOrigin, iStart, iEnd, startSlope, endSlope);

  	// restrict vision to a circle of radius maxRadius

  	let radiusSquared = Number(BigInt(maxRadius*maxRadius) >> (BIG_BASE*2n));
  	radiusSquared += (maxRadius >> FP_BASE);
  	if ((columnsRightFromOrigin*columnsRightFromOrigin + iEnd*iEnd) >= radiusSquared ) {
  		// fov.debug(' - columnsRightFromOrigin^2 + iEnd^2 >= radiusSquared', columnsRightFromOrigin, iEnd, radiusSquared);
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

  	// fov.debug(' - scan', iStart, iEnd);
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
