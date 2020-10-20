

import * as Flags from './flags.js';
import { map as MAP } from './map.js';
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
  if (!map.flags & Flags.Map.MAP_CHANGED) return;

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
          map.clearCellFlags(mapX, mapY, Flags.Cell.NEEDS_REDRAW | Flags.Cell.CELL_CHANGED);
        }
        else {
          buf.blackOut();
        }
      }
    }
    buffer.needsUpdate = true;
  }
  else {
    map.cells.forEach( (c, i, j) => {
      if (!VIEWPORT.containsXY(i + VIEWPORT.x, j + VIEWPORT.y)) return;

      if (c.flags & Flags.Cell.NEEDS_REDRAW) {
        const buf = buffer[i + VIEWPORT.x][j + VIEWPORT.y];
        MAP.getCellAppearance(map, i, j, buf);
        c.clearFlags(Flags.Cell.NEEDS_REDRAW);
        buffer.needsUpdate = true;
      }
    });
  }
  map.flags &= ~Flags.Map.MAP_CHANGED;

}


viewport.draw = drawViewport;
