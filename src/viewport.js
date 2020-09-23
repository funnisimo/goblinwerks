

import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags, map as MAP } from './map.js';
import { viewport, types, data as DATA, ui as UI } from './gw.js';


let VIEWPORT = null;

var CURSOR = viewport.cursor = {
  x: -1,
  y: -1,
};


function setup(opts={}) {
  VIEWPORT = viewport.bounds = new types.Bounds(opts.x, opts.y, opts.w, opts.h);
}

viewport.setup = setup;

//////////////////
// CURSOR

function setCursor(x, y) {
  const map = DATA.map;
  if (!map) return false;

  if (CURSOR.x == x && CURSOR.y == y) return false;

  // console.log('set cursor', x, y);

  if (map.hasXY(CURSOR.x, CURSOR.y)) {
    map.clearCellFlags(CURSOR.x, CURSOR.y, CellFlags.IS_CURSOR);
  }
  CURSOR.x = x;
  CURSOR.y = y;

  if (map.hasXY(x, y)) {
    if (!DATA.player || DATA.player.x !== x || DATA.player.y !== y ) {
      map.setCellFlags(CURSOR.x, CURSOR.y, CellFlags.IS_CURSOR);
    }

    // if (!GW.player.isMoving()) {
    //   showPathFromPlayerTo(x, y);
    // }
    // GW.ui.flavorMessage('' + x + ',' + y + ': ' + GW.map.cellFlavor(x, y));
  }
  else {
    // GW.map.clearPath();
    // GW.ui.flavorMessage('' + x + ',' + y + '');
  }

  UI.requestUpdate();
  return true;
}

viewport.setCursor = setCursor;

// function moveCursor(dx, dy) {
//   GW.map.setCursor(CURSOR.x + dx, CURSOR.y + dy);
// }
//
// GW.map.moveCursor = moveCursor;

// GW.map.cursor = CURSOR;

function clearCursor() {
  return viewport.setCursor(-1,-1);
  // GW.ui.flavorMessage(GW.map.cellFlavor(GW.PLAYER.x, GW.PLAYER.y));
}

viewport.clearCursor = clearCursor;



// DRAW

function drawViewport(buffer, map) {
  map = map || DATA.map;
  if (!map) return;
  if (!map.flags & MapFlags.MAP_CHANGED) return;

  map.cells.forEach( (c, i, j) => {
    if (!VIEWPORT.hasCanvasLoc(i + VIEWPORT.x, j + VIEWPORT.y)) return;

    if (c.flags & CellFlags.NEEDS_REDRAW) {
      const buf = buffer[i + VIEWPORT.x][j + VIEWPORT.y];
      MAP.getCellAppearance(map, i, j, buf);
      c.clearFlags(CellFlags.NEEDS_REDRAW);
      buffer.needsUpdate = true;
    }
  });

  map.flags &= ~MapFlags.MAP_CHANGED;
}


viewport.draw = drawViewport;
