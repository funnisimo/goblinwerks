

import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags, map as MAP } from './map.js';
import { viewport, types, data as DATA, ui as UI } from './gw.js';


let VIEWPORT = null;


function setup(opts={}) {
  VIEWPORT = viewport.bounds = new types.Bounds(opts.x, opts.y, opts.w, opts.h);
}

viewport.setup = setup;

// DRAW

function drawViewport(buffer, map) {
  map = map || DATA.map;
  if (!map) return;
  if (!map.flags & MapFlags.MAP_CHANGED) return;

  map.cells.forEach( (c, i, j) => {
    if (!VIEWPORT.containsXY(i + VIEWPORT.x, j + VIEWPORT.y)) return;

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
