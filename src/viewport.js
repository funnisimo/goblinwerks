

import * as Utils from './utils.js';
import * as Flags from './flags.js';
import { map as MAP } from './map.js';
import { viewport, types, data as DATA, ui as UI, config as CONFIG } from './gw.js';


let VIEWPORT = null;

function setup(opts={}) {
  VIEWPORT = viewport.bounds = new types.Bounds(opts.x, opts.y, opts.w, opts.h);
  CONFIG.followPlayer = opts.followPlayer || false;
  CONFIG.autoCenter = opts.autoCenter || false;
}

viewport.setup = setup;

let VIEW_FILTER = null;

function setFilter(fn) {
  VIEW_FILTER = fn || null;
}

viewport.setFilter = setFilter;

// DRAW

function drawViewport(buffer, map) {
  map = map || DATA.map;
  if (!map) return;
  if (!map.flags & Flags.Map.MAP_CHANGED) return;

  let offsetX = 0;
  let offsetY = 0;
  if (CONFIG.followPlayer && DATA.player && DATA.player.x >= 0) {
    VIEWPORT.offsetX = DATA.player.x - VIEWPORT.centerX();
    VIEWPORT.offsetY = DATA.player.y - VIEWPORT.centerY();
  }
  else if (CONFIG.autoCenter && DATA.player && DATA.player.x >= 0) {
    const left = VIEWPORT.offsetX;
    const right = VIEWPORT.offsetX + VIEWPORT.width;
    const top = VIEWPORT.offsetY;
    const bottom = VIEWPORT.offsetY + VIEWPORT.height;

    const edgeX = Math.floor(VIEWPORT.width/5);
    const edgeY = Math.floor(VIEWPORT.height/5);

    const thirdW = Math.floor(VIEWPORT.width / 3);
    if (left + edgeX >= DATA.player.x) {
      VIEWPORT.offsetX = Math.max(0, DATA.player.x + thirdW - VIEWPORT.width);
    }
    else if (right - edgeX <= DATA.player.x) {
      VIEWPORT.offsetX = Math.min(DATA.player.x - thirdW, map.width - VIEWPORT.width);
    }

    const thirdH = Math.floor(VIEWPORT.height/3);
    if (top + edgeY >= DATA.player.y) {
      VIEWPORT.offsetY = Math.max(0, DATA.player.y + thirdH - VIEWPORT.height);
    }
    else if (bottom - edgeY <= DATA.player.y) {
      VIEWPORT.offsetY = Math.min(DATA.player.y - thirdH, map.height - VIEWPORT.height);
    }
  }

  for(let x = 0; x < VIEWPORT.width; ++x) {
    for(let y = 0; y < VIEWPORT.height; ++y) {

      const buf = buffer[x + VIEWPORT.x][y + VIEWPORT.y];
      const mapX = x + VIEWPORT.offsetX;
      const mapY = y + VIEWPORT.offsetY;
      if (map.hasXY(mapX, mapY)) {
        MAP.getCellAppearance(map, mapX, mapY, buf);
        map.clearCellFlags(mapX, mapY, Flags.Cell.NEEDS_REDRAW | Flags.Cell.CELL_CHANGED);
      }
      else {
        buf.blackOut();
      }

      if (VIEW_FILTER) {
        VIEW_FILTER(buf, mapX, mapY, map);
      }
    }
  }
  buffer.needsUpdate = true;
  map.flags &= ~Flags.Map.MAP_CHANGED;
}

viewport.draw = drawViewport;

function hasXY(x, y) {
  return VIEWPORT.containsXY(x - VIEWPORT.offsetX + VIEWPORT.x, y - VIEWPORT.offsetY + VIEWPORT.y);
}

viewport.hasXY = hasXY;
