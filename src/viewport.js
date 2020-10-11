

import { Flags as CellFlags } from './cell.js';
import { Flags as MapFlags, map as MAP } from './map.js';
import { viewport, types, data as DATA, ui as UI, config as CONFIG } from './gw.js';


let VIEWPORT = null;

function setup(opts={}) {
  VIEWPORT = viewport.bounds = new types.Bounds(opts.x, opts.y, opts.w, opts.h);
  CONFIG.followPlayer = opts.followPlayer || false;
}

viewport.setup = setup;

// DRAW

function drawViewport(buffer, map) {
  map = map || DATA.map;
  if (!map) return;
  if (!map.flags & MapFlags.MAP_CHANGED) return;

  if (CONFIG.followPlayer && DATA.player && DATA.player.x >= 0) {
    const offsetX = DATA.player.x - VIEWPORT.centerX();
    const offsetY = DATA.player.y - VIEWPORT.centerY();

    for(let x = 0; x < VIEWPORT.width; ++x) {
      for(let y = 0; y < VIEWPORT.height; ++y) {

        const buf = buffer[x + VIEWPORT.x][y + VIEWPORT.y];
        const mapX= x + offsetX;
        const mapY = y + offsetY;
        if (map.hasXY(mapX, mapY)) {
          MAP.getCellAppearance(map, mapX, mapY, buf);
        }
        else {
          buf.blackOut();
        }
      }
    }
    map.clearFlags(MapFlags.MAP_CHANGED, CellFlags.NEEDS_REDRAW | CellFlags.CELL_CHANGED);
    buffer.needsUpdate = true;
  }
  else {
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

}


viewport.draw = drawViewport;
